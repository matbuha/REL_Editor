const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const { URL } = require("url");
const express = require("express");
const multer = require("multer");
const mime = require("mime-types");
const { WebSocketServer, WebSocket } = require("ws");
const { injectRuntimeAssets } = require("./inject");
const {
  fileExists,
  normalizeProjectRoot,
  resolveInside,
  loadRelConfig,
  readPatch,
  writePatch,
} = require("./file_io");
const { exportSafe, exportMerge } = require("./export");
const { DevServerManager } = require("./devServerManager");
const {
  PROJECT_TYPE_STATIC,
  PROJECT_TYPE_VITE_REACT_STYLE,
  DEFAULT_VITE_DEV_URL,
  normalizeProjectType,
  normalizeDevUrl,
} = require("./vite_runner");

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");

async function main() {
  const config = await loadRelConfig(ROOT_DIR);
  let currentProjectRoot = normalizeProjectRoot(ROOT_DIR, config.default_project_root);
  let currentProjectType = normalizeProjectType(config.default_project_type || PROJECT_TYPE_STATIC);
  let currentIndexPath = (config.default_index_path || "index.html").replace(/\\/g, "/");
  let currentDevUrl = normalizeDevUrl(config.default_dev_url || DEFAULT_VITE_DEV_URL);
  const externalStyles = sanitizeExternalList(config.externalStyles);
  const externalScripts = sanitizeExternalList(config.externalScripts);
  const defaultsLibraries = normalizeDefaultsLibraries(config.defaultsLibraries);
  const defaultsFonts = normalizeDefaultsFonts(config.defaultsFonts);
  const defaultTheme = createDefaultTheme();
  const viteRunner = new DevServerManager({ defaultDevUrl: currentDevUrl });
  let viteStatus = buildViteStatusSnapshot(viteRunner.getStatus(), currentDevUrl);
  const wsClients = new Set();

  await ensureRelEditorArtifacts({
    projectRoot: currentProjectRoot,
    projectType: currentProjectType,
    indexPath: currentIndexPath,
    devUrl: currentDevUrl,
    defaultsLibraries,
    defaultsFonts,
    defaultTheme,
  });

  function broadcastViteStatus() {
    if (wsClients.size === 0) {
      return;
    }
    const message = JSON.stringify({
      type: "viteStatus",
      payload: viteStatus,
    });
    for (const client of wsClients) {
      if (!client || client.readyState !== WebSocket.OPEN) {
        continue;
      }
      client.send(message);
    }
  }

  function publishViteStatus(nextStatus, options) {
    const opts = options && typeof options === "object" ? options : {};
    const normalized = normalizeViteStatusSnapshot(nextStatus);
    if (!opts.force && isViteStatusSnapshotEqual(viteStatus, normalized)) {
      return false;
    }
    viteStatus = {
      ...normalized,
      updatedAt: Date.now(),
    };
    broadcastViteStatus();
    return true;
  }

  function publishViteStatusFromRunner(runnerStatus) {
    const status = runnerStatus && typeof runnerStatus === "object"
      ? runnerStatus
      : viteRunner.getStatus();
    return publishViteStatus(buildViteStatusSnapshot(status, currentDevUrl));
  }

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const editorDir = path.resolve(ROOT_DIR, "REL_EDITOR", "editor");
  const runtimeDir = path.resolve(ROOT_DIR, "REL_EDITOR", "runtime");

  app.use("/editor", express.static(editorDir));
  app.use("/runtime", express.static(runtimeDir));

  app.get("/", (req, res) => {
    res.redirect("/editor/index.html");
  });

  function buildProjectPayload() {
    const viteStatus = viteRunner.getStatus();
    const safeDevUrl = normalizeDevUrl(viteStatus.dev_url || currentDevUrl || DEFAULT_VITE_DEV_URL);
    const iframeSrc = currentProjectType === PROJECT_TYPE_VITE_REACT_STYLE
      ? "/vite-proxy/"
      : `/project/${encodePathForUrl(currentIndexPath)}`;

    return {
      project_root: currentProjectRoot,
      project_type: currentProjectType,
      index_path: currentIndexPath,
      dev_url: safeDevUrl,
      iframe_src: iframeSrc,
      vite_status: viteStatus,
      vite_status_stream: viteStatus,
      external_styles: externalStyles,
      external_scripts: externalScripts,
      defaults_libraries: defaultsLibraries,
      defaults_fonts: defaultsFonts,
    };
  }

  app.get("/api/project", async (req, res) => {
    try {
      await ensureRelEditorArtifacts({
        projectRoot: currentProjectRoot,
        projectType: currentProjectType,
        indexPath: currentIndexPath,
        devUrl: currentDevUrl,
        defaultsLibraries,
        defaultsFonts,
        defaultTheme,
      });
      res.json(buildProjectPayload());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/project", async (req, res) => {
    try {
      const body = req.body || {};
      const requestedRoot = normalizeProjectRoot(ROOT_DIR, body.project_root || config.default_project_root);
      const stats = await fs.stat(requestedRoot);
      if (!stats.isDirectory()) {
        throw new Error("project_root must point to a directory");
      }
      const requestedType = normalizeProjectType(body.project_type || currentProjectType);
      const requestedDevUrl = normalizeDevUrl(body.dev_url || currentDevUrl);

      let requestedIndex = currentIndexPath;
      if (requestedType === PROJECT_TYPE_STATIC) {
        requestedIndex = (body.index_path || "index.html").replace(/\\/g, "/");
        const indexAbsolute = resolveInside(requestedRoot, requestedIndex);
        if (!(await fileExists(indexAbsolute))) {
          throw new Error(`index_path not found: ${requestedIndex}`);
        }
      } else if (!(await fileExists(path.join(requestedRoot, "package.json")))) {
        throw new Error("Vite React mode requires package.json in project root");
      }

      const rootChanged = currentProjectRoot !== requestedRoot;
      const switchedToStatic = requestedType === PROJECT_TYPE_STATIC && currentProjectType !== PROJECT_TYPE_STATIC;
      if (rootChanged || switchedToStatic) {
        await viteRunner.stop();
        publishViteStatus({
          state: "stopped",
          url: currentDevUrl,
          port: null,
          pid: null,
          message: null,
        });
      }

      currentProjectRoot = requestedRoot;
      currentIndexPath = requestedIndex;
      currentProjectType = requestedType;
      currentDevUrl = requestedDevUrl;
      await ensureRelEditorArtifacts({
        projectRoot: currentProjectRoot,
        projectType: currentProjectType,
        indexPath: currentIndexPath,
        devUrl: currentDevUrl,
        defaultsLibraries,
        defaultsFonts,
        defaultTheme,
      });
      publishViteStatusFromRunner();

      res.json({
        ok: true,
        ...buildProjectPayload(),
      });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/vite/status", (req, res) => {
    const status = viteRunner.getStatus();
    const safeDevUrl = normalizeDevUrl(status.dev_url || currentDevUrl);
    publishViteStatusFromRunner(status);
    res.json({
      ok: true,
      project_type: currentProjectType,
      dev_url: safeDevUrl,
      vite_status: status,
      vite_status_stream: viteStatus,
    });
  });

  app.post("/api/vite/start", async (req, res) => {
    try {
      const body = req.body || {};
      const requestedRoot = normalizeProjectRoot(ROOT_DIR, body.project_root || currentProjectRoot);
      const stats = await fs.stat(requestedRoot);
      if (!stats.isDirectory()) {
        throw new Error("project_root must point to a directory");
      }

      currentProjectRoot = requestedRoot;
      currentProjectType = PROJECT_TYPE_VITE_REACT_STYLE;
      currentDevUrl = normalizeDevUrl(body.dev_url || currentDevUrl || DEFAULT_VITE_DEV_URL);
      await ensureRelEditorArtifacts({
        projectRoot: currentProjectRoot,
        projectType: currentProjectType,
        indexPath: currentIndexPath,
        devUrl: currentDevUrl,
        defaultsLibraries,
        defaultsFonts,
        defaultTheme,
      });
      publishViteStatus({
        state: "starting",
        url: currentDevUrl,
        port: null,
        pid: null,
        message: null,
      });

      const viteStatus = await viteRunner.start({
        projectRoot: currentProjectRoot,
        devUrl: currentDevUrl,
      });
      const resolvedRoot = String(viteStatus.project_root || "").trim();
      if (resolvedRoot) {
        currentProjectRoot = resolvedRoot;
      }
      currentDevUrl = normalizeDevUrl(viteStatus.dev_url || currentDevUrl);
      publishViteStatusFromRunner(viteStatus);
      console.log(`[REL VITE] Dev server running at ${currentDevUrl} (root: ${currentProjectRoot})`);

      res.json({
        ok: true,
        project_root: currentProjectRoot,
        project_type: currentProjectType,
        dev_url: currentDevUrl,
        vite_status: viteStatus,
      });
    } catch (error) {
      console.error(`[REL VITE] Failed to start dev server: ${error.message}`);
      publishViteStatus({
        state: "error",
        url: currentDevUrl,
        port: null,
        pid: null,
        message: String(error.message || "Failed to start Vite dev server"),
      });
      res.status(400).json({
        ok: false,
        error: error.message,
        vite_status: viteRunner.getStatus(),
      });
    }
  });

  app.post("/api/vite/stop", async (req, res) => {
    try {
      await viteRunner.stop();
      publishViteStatus({
        state: "stopped",
        url: currentDevUrl,
        port: null,
        pid: null,
        message: null,
      });
      console.log("[REL VITE] Dev server stopped");
      res.json({
        ok: true,
        project_root: currentProjectRoot,
        project_type: currentProjectType,
        dev_url: currentDevUrl,
        vite_status: viteRunner.getStatus(),
      });
    } catch (error) {
      publishViteStatus({
        state: "error",
        url: currentDevUrl,
        port: null,
        pid: null,
        message: String(error.message || "Failed to stop Vite dev server"),
      });
      res.status(400).json({
        ok: false,
        error: error.message,
        vite_status: viteRunner.getStatus(),
      });
    }
  });

  app.get("/api/patch", async (req, res) => {
    try {
      const { patch, overrideCss } = await readPatch(currentProjectRoot);
      res.json({
        patch: patch || null,
        override_css: overrideCss || "",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patch", async (req, res) => {
    try {
      const body = req.body || {};
      const patch = body.patch || {
        version: 4,
        project_root: currentProjectRoot,
        project_type: currentProjectType,
        index_path: currentIndexPath,
        dev_url: currentDevUrl,
        elementsMap: {},
        selectorMap: {},
        attributeOverrides: {},
        textOverrides: {},
        overridesMeta: {},
        attributesMeta: {},
        linksMeta: {},
        addedNodes: [],
        deletedNodes: [],
        runtimeLibraries: defaultsLibraries,
        runtimeFonts: defaultsFonts,
        theme: defaultTheme,
      };
      const overrideCss = typeof body.override_css === "string" ? body.override_css : "";

      await writePatch(currentProjectRoot, patch, overrideCss);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/export-safe", async (req, res) => {
    try {
      const body = req.body || {};
      const requestedType = normalizeProjectType(body.project_type || currentProjectType);
      let safeIndexPath = currentIndexPath;
      if (requestedType === PROJECT_TYPE_STATIC) {
        const indexPath = (body.index_path || currentIndexPath).replace(/\\/g, "/");
        safeIndexPath = await validateIndexPath(currentProjectRoot, indexPath);
      }
      const result = await exportSafe(currentProjectRoot, safeIndexPath, {
        projectType: requestedType,
      });
      res.json({ ok: true, result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/export-merge", async (req, res) => {
    try {
      const body = req.body || {};
      const indexPath = (body.index_path || currentIndexPath).replace(/\\/g, "/");
      const safeIndexPath = await validateIndexPath(currentProjectRoot, indexPath);
      const result = await exportMerge(currentProjectRoot, safeIndexPath, {
        projectType: PROJECT_TYPE_STATIC,
      });
      res.json({ ok: true, result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/upload-image", (req, res) => {
    upload.single("image")(req, res, async (uploadError) => {
      if (uploadError) {
        res.status(400).json({ ok: false, error: uploadError.message || "Upload failed" });
        return;
      }

      try {
        if (!req.file) {
          throw new Error("No image file provided");
        }

        if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        const assetsDir = path.join(currentProjectRoot, "rel_editor", "assets");
        await fs.mkdir(assetsDir, { recursive: true });

        const extension = resolveImageExtension(req.file.originalname, req.file.mimetype);
        const filename = `img-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
        const targetPath = path.join(assetsDir, filename);

        await fs.writeFile(targetPath, req.file.buffer);

        const relativePath = `rel_editor/assets/${filename}`;
        const projectUrl = `/project/${encodePathForUrl(relativePath)}`;

        res.json({
          ok: true,
          relative_path: relativePath,
          project_url: projectUrl,
          file_name: filename,
        });
      } catch (error) {
        res.status(400).json({ ok: false, error: error.message });
      }
    });
  });

  app.post("/api/upload-background-image", (req, res) => {
    upload.single("image")(req, res, async (uploadError) => {
      if (uploadError) {
        res.status(400).json({ ok: false, error: uploadError.message || "Upload failed" });
        return;
      }

      try {
        if (!req.file) {
          throw new Error("No image file provided");
        }

        if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        const extension = resolveImageExtension(req.file.originalname, req.file.mimetype);
        const filename = `bg-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
        const storage = resolveBackgroundAssetStorage({
          projectRoot: currentProjectRoot,
          projectType: currentProjectType,
          indexPath: currentIndexPath,
          fileName: filename,
        });

        await fs.mkdir(storage.assetsDir, { recursive: true });
        await fs.writeFile(storage.targetPath, req.file.buffer);

        res.json({
          ok: true,
          css_url: storage.cssUrl,
          relative_path: storage.relativePath,
          file_name: filename,
        });
      } catch (error) {
        res.status(400).json({ ok: false, error: error.message });
      }
    });
  });

  app.use(async (req, res, next) => {
    try {
      if (!shouldProxyViteRequest(req)) {
        next();
        return;
      }
      await proxyViteRequest(req, res);
    } catch (error) {
      res.status(502).send(`Vite proxy failed: ${error.message}`);
    }
  });

  function shouldProxyViteRequest(req) {
    if (currentProjectType !== PROJECT_TYPE_VITE_REACT_STYLE) {
      return false;
    }

    const viteStatus = viteRunner.getStatus();
    if (!viteStatus.running || !viteStatus.dev_url) {
      return String(req.path || "").startsWith("/vite-proxy");
    }

    const safePath = String(req.path || "");
    if (safePath === "/vite-proxy" || safePath.startsWith("/vite-proxy/")) {
      return true;
    }

    if (
      safePath.startsWith("/@vite") ||
      safePath.startsWith("/@react-refresh") ||
      safePath.startsWith("/@id/") ||
      safePath.startsWith("/@fs/") ||
      safePath.startsWith("/src/") ||
      safePath.startsWith("/node_modules/") ||
      safePath.startsWith("/assets/") ||
      safePath === "/vite.svg" ||
      safePath === "/favicon.ico"
    ) {
      return true;
    }

    const referer = String(req.get("referer") || "");
    let refererPath = "";
    if (referer) {
      try {
        refererPath = new URL(referer).pathname || "";
      } catch {
        refererPath = "";
      }
    }

    const refererLooksVite = [
      "/vite-proxy",
      "/src/",
      "/node_modules/",
      "/@vite",
      "/@id/",
      "/@fs/",
      "/@react-refresh",
    ].some((prefix) => refererPath.startsWith(prefix));

    if (!refererLooksVite) {
      return false;
    }

    if (
      safePath.startsWith("/api/") ||
      safePath.startsWith("/editor/") ||
      safePath.startsWith("/runtime/") ||
      safePath.startsWith("/project/")
    ) {
      return false;
    }
    return true;
  }

  async function proxyViteRequest(req, res) {
    const status = viteRunner.getStatus();
    if (!status.running || !status.dev_url) {
      res.status(503).type("html").send(buildViteStoppedHtml(currentDevUrl, status));
      return;
    }

    const targetUrl = buildViteProxyTargetUrl(req, status.dev_url);
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: "manual",
    });

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const shouldInjectHtml = contentType.includes("text/html") && String(req.path || "").startsWith("/vite-proxy");
    const overrideAbsolute = path.join(currentProjectRoot, "rel_editor", "override.css");
    const hasOverride = await fileExists(overrideAbsolute);

    res.status(response.status);
    for (const [headerName, headerValue] of response.headers.entries()) {
      const key = headerName.toLowerCase();
      if (["content-length", "transfer-encoding", "content-encoding", "connection"].includes(key)) {
        continue;
      }
      if (key === "location") {
        res.setHeader(headerName, rewriteViteLocationHeader(headerValue));
        continue;
      }
      res.setHeader(headerName, headerValue);
    }

    if (response.status === 304 || req.method === "HEAD") {
      res.end();
      return;
    }

    if (shouldInjectHtml) {
      const html = await response.text();
      const injected = injectRuntimeAssets(html, {
        runtimeCssHref: "/runtime/overlay.css",
        runtimeJsHref: "/runtime/overlay.js",
        overrideCssHref: hasOverride ? "/project/rel_editor/override.css" : null,
        externalStyleHrefs: externalStyles,
        externalScriptSrcs: externalScripts,
      });
      res.type("html").send(injected);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  }

  function buildViteProxyTargetUrl(req, baseDevUrl) {
    const safeBase = normalizeDevUrl(baseDevUrl || currentDevUrl || DEFAULT_VITE_DEV_URL);
    const sourcePath = String(req.originalUrl || req.url || "");
    let targetPath = sourcePath;
    if (sourcePath === "/vite-proxy") {
      targetPath = "/";
    } else if (sourcePath.startsWith("/vite-proxy/")) {
      targetPath = sourcePath.slice("/vite-proxy".length);
    }
    return new URL(targetPath || "/", safeBase).toString();
  }

  function rewriteViteLocationHeader(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return raw;
    }
    if (raw.startsWith("/")) {
      return `/vite-proxy${raw}`;
    }
    try {
      const parsed = new URL(raw);
      const status = viteRunner.getStatus();
      if (status.dev_url && normalizeDevUrl(parsed.origin) === normalizeDevUrl(status.dev_url)) {
        return `/vite-proxy${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  app.get("/project", async (req, res) => {
    res.redirect(`/project/${encodePathForUrl(currentIndexPath)}`);
  });

  app.get("/project/*", async (req, res) => {
    try {
      const requested = decodeURIComponent(req.params[0] || currentIndexPath);
      let filePath = resolveInside(currentProjectRoot, requested);

      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".html" || ext === ".htm") {
        const html = await fs.readFile(filePath, "utf8");
        const overrideAbsolute = path.join(currentProjectRoot, "rel_editor", "override.css");
        const hasOverride = await fileExists(overrideAbsolute);
        const injected = injectRuntimeAssets(html, {
          runtimeCssHref: "/runtime/overlay.css",
          runtimeJsHref: "/runtime/overlay.js",
          overrideCssHref: hasOverride ? "/project/rel_editor/override.css" : null,
          externalStyleHrefs: externalStyles,
          externalScriptSrcs: externalScripts,
        });

        res.type("html").send(injected);
        return;
      }

      const mimeType = mime.lookup(filePath) || "application/octet-stream";
      res.type(mimeType);
      res.sendFile(filePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        res.status(404).send("Not found");
        return;
      }
      if (error.message && error.message.includes("escapes project root")) {
        res.status(400).send("Invalid path");
        return;
      }
      res.status(500).send(error.message);
    }
  });

  const port = Number(process.env.REL_EDITOR_PORT || config.port || 4311);
  const httpServer = app.listen(port, () => {
    console.log(`REL_EDITOR running on http://localhost:${port}`);
    console.log(`Project root: ${currentProjectRoot}`);
    console.log(`Index path: ${currentIndexPath}`);
  });
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/ws",
  });
  wsServer.on("connection", (socket) => {
    wsClients.add(socket);
    socket.send(JSON.stringify({
      type: "viteStatus",
      payload: viteStatus,
    }));
    socket.on("close", () => {
      wsClients.delete(socket);
    });
    socket.on("error", () => {
      wsClients.delete(socket);
    });
  });

  const viteStatusWatchTimer = setInterval(() => {
    publishViteStatusFromRunner();
  }, 750);
  publishViteStatusFromRunner();

  let shuttingDown = false;
  async function shutdown() {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    clearInterval(viteStatusWatchTimer);
    for (const client of wsClients) {
      try {
        client.close();
      } catch {
        // Ignore cleanup errors.
      }
    }
    wsClients.clear();
    await new Promise((resolve) => {
      wsServer.close(() => resolve());
    });
    await viteRunner.dispose();
    httpServer.close(() => {
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function encodePathForUrl(inputPath) {
  return inputPath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function validateIndexPath(projectRoot, indexPath) {
  const absolute = resolveInside(projectRoot, indexPath);
  const stats = await fs.stat(absolute);
  if (!stats.isFile()) {
    throw new Error("index_path must point to an HTML file");
  }
  return path.relative(projectRoot, absolute).replace(/\\/g, "/");
}

function buildViteStoppedHtml(devUrl, viteStatus) {
  const safeUrl = normalizeDevUrl(devUrl || DEFAULT_VITE_DEV_URL);
  const status = viteStatus && typeof viteStatus === "object" ? viteStatus : {};
  const phase = String(status.phase || "stopped");
  const lastError = String(status.last_error || "").trim();
  const logs = Array.isArray(status.log_lines) ? status.log_lines.slice(-8) : [];
  const detailBlock = lastError
    ? `<p>Last error: <code>${escapeHtmlText(lastError)}</code></p>`
    : "<p>No runtime error was reported yet.</p>";
  const logsBlock = logs.length > 0
    ? `<pre>${escapeHtmlText(logs.join("\n"))}</pre>`
    : "<p>No logs captured yet.</p>";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>REL_EDITOR Vite Preview</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f6f4ef; color: #3f3328; }
    .box { max-width: 680px; margin: 48px auto; background: #fff; border: 1px solid #dacbb7; border-radius: 10px; padding: 18px; }
    h1 { margin: 0 0 10px; font-size: 20px; }
    p { margin: 0 0 8px; line-height: 1.45; }
    code { background: #f4efe7; border-radius: 4px; padding: 2px 6px; }
    pre { margin: 8px 0 0; padding: 8px; max-height: 240px; overflow: auto; background: #f7f1e7; border: 1px solid #dbcdb9; border-radius: 6px; white-space: pre-wrap; font-size: 12px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Vite Dev Server Is Not Running</h1>
    <p>Start the server from REL_EDITOR using <strong>Start Dev Server</strong>.</p>
    <p>Status: <code>${escapeHtmlText(phase)}</code></p>
    <p>Configured Dev URL: <code>${escapeHtmlText(safeUrl)}</code></p>
    ${detailBlock}
    ${logsBlock}
  </div>
</body>
</html>`;
}

function escapeHtmlText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeExternalList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => String(entry || "").trim())
    .filter((entry) => entry.length > 0);
}

function resolveImageExtension(originalName, mimeType) {
  const allowed = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"]);
  const extFromName = path.extname(String(originalName || "")).toLowerCase();
  if (allowed.has(extFromName)) {
    return extFromName;
  }

  const mimeToExt = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/avif": ".avif",
  };

  return mimeToExt[mimeType] || ".png";
}

function resolveBackgroundAssetStorage(options) {
  const opts = options && typeof options === "object" ? options : {};
  const projectRoot = String(opts.projectRoot || "").trim();
  const fileName = String(opts.fileName || "").trim();
  const projectType = normalizeProjectType(opts.projectType || PROJECT_TYPE_STATIC);
  const indexPath = String(opts.indexPath || "index.html").replace(/\\/g, "/");

  if (!projectRoot || !fileName) {
    throw new Error("Background asset storage requires project root and file name");
  }

  if (projectType === PROJECT_TYPE_VITE_REACT_STYLE) {
    const relativePath = `public/rel_assets/${fileName}`;
    const assetsDir = path.join(projectRoot, "public", "rel_assets");
    return {
      assetsDir,
      targetPath: path.join(assetsDir, fileName),
      relativePath,
      cssUrl: `/rel_assets/${fileName}`,
    };
  }

  const staticRelativePath = `REL_assets/${fileName}`;
  const assetsDir = path.join(projectRoot, "REL_assets");
  return {
    assetsDir,
    targetPath: path.join(assetsDir, fileName),
    relativePath: staticRelativePath,
    cssUrl: computeCssRelativePathFromIndex(indexPath, staticRelativePath),
  };
}

function computeCssRelativePathFromIndex(indexPath, assetRelativePath) {
  const safeIndexPath = String(indexPath || "index.html").replace(/\\/g, "/");
  const safeAssetPath = String(assetRelativePath || "").replace(/\\/g, "/");
  const indexDir = path.posix.dirname(safeIndexPath);
  const fromDir = indexDir === "." ? "" : indexDir;
  const relative = path.posix.relative(fromDir, safeAssetPath);
  return relative || safeAssetPath;
}

async function ensureRelEditorArtifacts(options) {
  const opts = options && typeof options === "object" ? options : {};
  const projectRoot = String(opts.projectRoot || "").trim();
  if (!projectRoot) {
    throw new Error("projectRoot is required for rel_editor artifacts");
  }

  const relEditorDir = path.join(projectRoot, "rel_editor");
  const patchPath = path.join(relEditorDir, "patch.json");
  const overridePath = path.join(relEditorDir, "override.css");

  await fs.mkdir(relEditorDir, { recursive: true });

  if (!(await fileExists(overridePath))) {
    await fs.writeFile(overridePath, "", "utf8");
  }

  if (await fileExists(patchPath)) {
    return;
  }

  const patchData = buildDefaultPatchData({
    projectRoot,
    projectType: opts.projectType,
    indexPath: opts.indexPath,
    devUrl: opts.devUrl,
    defaultsLibraries: opts.defaultsLibraries,
    defaultsFonts: opts.defaultsFonts,
    defaultTheme: opts.defaultTheme,
  });
  await fs.writeFile(patchPath, JSON.stringify(patchData, null, 2), "utf8");
}

function buildDefaultPatchData(options) {
  const opts = options && typeof options === "object" ? options : {};
  const defaultsLibraries = normalizeDefaultsLibraries(opts.defaultsLibraries || {});
  const defaultsFonts = normalizeDefaultsFonts(opts.defaultsFonts || {});
  const defaultTheme = opts.defaultTheme && typeof opts.defaultTheme === "object"
    ? opts.defaultTheme
    : createDefaultTheme();
  return {
    version: 4,
    project_root: String(opts.projectRoot || "").trim(),
    project_type: normalizeProjectType(opts.projectType || PROJECT_TYPE_STATIC),
    index_path: String(opts.indexPath || "index.html").replace(/\\/g, "/"),
    dev_url: normalizeDevUrl(opts.devUrl || DEFAULT_VITE_DEV_URL),
    elementsMap: {},
    selectorMap: {},
    attributeOverrides: {},
    textOverrides: {},
    overridesMeta: {},
    attributesMeta: {},
    linksMeta: {},
    addedNodes: [],
    deletedNodes: [],
    runtimeLibraries: defaultsLibraries,
    runtimeFonts: defaultsFonts,
    theme: JSON.parse(JSON.stringify(defaultTheme)),
  };
}

function buildViteStatusSnapshot(status, fallbackUrl) {
  const raw = status && typeof status === "object" ? status : {};
  let state = "stopped";
  if (Boolean(raw.running)) {
    state = "running";
  } else if (Boolean(raw.starting) || Boolean(raw.installing) || ["starting", "installing"].includes(String(raw.phase || "").toLowerCase())) {
    state = "starting";
  } else if (String(raw.last_error || "").trim()) {
    state = "error";
  }

  return normalizeViteStatusSnapshot({
    state,
    url: raw.dev_url || fallbackUrl || null,
    port: raw.port,
    pid: raw.pid,
    message: state === "error" ? raw.last_error : null,
  });
}

function normalizeViteStatusSnapshot(value) {
  const raw = value && typeof value === "object" ? value : {};
  const state = normalizeViteStatusState(raw.state);
  const parsedPort = Number(raw.port);
  const parsedPid = Number(raw.pid);
  const hasUrl = raw.url != null && String(raw.url).trim() !== "";
  const url = hasUrl ? normalizeDevUrl(raw.url) : null;
  const message = normalizeOptionalMessage(raw.message);
  return {
    state,
    url,
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : null,
    pid: Number.isFinite(parsedPid) && parsedPid > 0 ? parsedPid : null,
    message: message || null,
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now(),
  };
}

function normalizeViteStatusState(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["stopped", "starting", "running", "error"].includes(normalized)) {
    return normalized;
  }
  return "stopped";
}

function normalizeOptionalMessage(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isViteStatusSnapshotEqual(left, right) {
  const a = normalizeViteStatusSnapshot(left);
  const b = normalizeViteStatusSnapshot(right);
  return a.state === b.state
    && a.url === b.url
    && a.port === b.port
    && a.pid === b.pid
    && a.message === b.message;
}

function normalizeDefaultsLibraries(value) {
  const raw = value && typeof value === "object" ? value : {};
  const designLibrary = String(raw.designLibrary || "none").trim().toLowerCase();
  const iconSet = String(raw.iconSet || "none").trim().toLowerCase();
  const animateCss = Boolean(raw.animateCss);
  const bootstrapJs = Boolean(raw.bootstrapJs);

  return {
    designLibrary: designLibrary || "none",
    iconSet: iconSet || "none",
    animateCss,
    bootstrapJs,
  };
}

function normalizeDefaultsFonts(value) {
  const raw = value && typeof value === "object" ? value : {};
  const provider = String(raw.provider || "none").trim().toLowerCase();
  const families = Array.isArray(raw.families)
    ? Array.from(
      new Set(
        raw.families
          .map((item) => String(item || "").trim().replace(/\s+/g, " "))
          .filter(Boolean)
      )
    )
    : [];

  if (!["none", "google", "bunny", "adobe-edge"].includes(provider)) {
    return { provider: "none", families: [] };
  }
  if (provider === "none") {
    return { provider: "none", families: [] };
  }

  return {
    provider,
    families,
  };
}

function createDefaultTheme() {
  return {
    applied: false,
    activeThemeId: "theme-default",
    themes: [
      {
        id: "theme-default",
        name: "Default Theme",
        colors: {
          primary: "#2b6df8",
          secondary: "#17b57a",
          accent: "#f97316",
          background: "#f6f7fb",
          surface: "#ffffff",
          text: "#1f2937",
          muted: "#6b7280",
          border: "#d1d5db",
        },
        customColors: {},
        fonts: {
          bodyFamily: "\"Segoe UI\", system-ui, sans-serif",
          headingFamily: "\"Segoe UI\", system-ui, sans-serif",
          bodySize: "16px",
          h1Size: "2.5rem",
          h2Size: "2rem",
          h3Size: "1.5rem",
          smallSize: "0.875rem",
          lineHeight: "1.5",
        },
      },
    ],
  };
}

main().catch((error) => {
  console.error("Failed to start REL_EDITOR", error);
  process.exitCode = 1;
});
