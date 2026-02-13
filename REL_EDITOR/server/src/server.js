const path = require("path");
const fs = require("fs/promises");
const express = require("express");
const mime = require("mime-types");
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

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");

async function main() {
  const config = await loadRelConfig(ROOT_DIR);
  let currentProjectRoot = normalizeProjectRoot(ROOT_DIR, config.default_project_root);
  let currentIndexPath = (config.default_index_path || "index.html").replace(/\\/g, "/");

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const editorDir = path.resolve(ROOT_DIR, "REL_EDITOR", "editor");
  const runtimeDir = path.resolve(ROOT_DIR, "REL_EDITOR", "runtime");

  app.use("/editor", express.static(editorDir));
  app.use("/runtime", express.static(runtimeDir));

  app.get("/", (req, res) => {
    res.redirect("/editor/index.html");
  });

  app.get("/api/project", async (req, res) => {
    res.json({
      project_root: currentProjectRoot,
      index_path: currentIndexPath,
      iframe_src: `/project/${encodePathForUrl(currentIndexPath)}`,
    });
  });

  app.post("/api/project", async (req, res) => {
    try {
      const body = req.body || {};
      const requestedRoot = normalizeProjectRoot(ROOT_DIR, body.project_root || config.default_project_root);
      const stats = await fs.stat(requestedRoot);
      if (!stats.isDirectory()) {
        throw new Error("project_root must point to a directory");
      }

      const requestedIndex = (body.index_path || "index.html").replace(/\\/g, "/");
      const indexAbsolute = resolveInside(requestedRoot, requestedIndex);
      if (!(await fileExists(indexAbsolute))) {
        throw new Error(`index_path not found: ${requestedIndex}`);
      }

      currentProjectRoot = requestedRoot;
      currentIndexPath = requestedIndex;

      res.json({
        ok: true,
        project_root: currentProjectRoot,
        index_path: currentIndexPath,
        iframe_src: `/project/${encodePathForUrl(currentIndexPath)}`,
      });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
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
        version: 1,
        project_root: currentProjectRoot,
        index_path: currentIndexPath,
        elements: {},
        overrides_meta: {},
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
      const indexPath = (body.index_path || currentIndexPath).replace(/\\/g, "/");
      const safeIndexPath = await validateIndexPath(currentProjectRoot, indexPath);
      const result = await exportSafe(currentProjectRoot, safeIndexPath);
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
      const result = await exportMerge(currentProjectRoot, safeIndexPath);
      res.json({ ok: true, result });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

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
  app.listen(port, () => {
    console.log(`REL_EDITOR running on http://localhost:${port}`);
    console.log(`Project root: ${currentProjectRoot}`);
    console.log(`Index path: ${currentIndexPath}`);
  });
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

main().catch((error) => {
  console.error("Failed to start REL_EDITOR", error);
  process.exitCode = 1;
});
