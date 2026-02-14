const fs = require("fs/promises");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");
const { URL } = require("url");

const DEFAULT_VITE_DEV_URL = "http://localhost:5173";
const DEFAULT_VITE_PORT = 5173;
const VITE_DISCOVERY_MAX_DEPTH = 3;
const IGNORED_DISCOVERY_DIRS = new Set(["node_modules", ".git", "dist", "build"]);
const DEV_SERVER_LOG_LIMIT = 120;
const PORT_SCAN_ATTEMPTS = 30;

class DevServerManager {
  constructor(options) {
    const opts = options && typeof options === "object" ? options : {};
    const parsedDefault = parseRequestedDevUrl(opts.defaultDevUrl || DEFAULT_VITE_DEV_URL);

    this.process = null;
    this.projectRoot = "";
    this.devUrl = parsedDefault.devUrl;
    this.port = parsedDefault.port;
    this.installing = false;
    this.starting = false;
    this.lastError = "";
    this.stopping = false;
    this.pid = null;
    this.preferredPort = parsedDefault.port;
    this.portAutoSelected = false;
    this.logLines = [];
    this.outputCleanup = null;
    this.expectedStopPids = new Set();
    this.operationQueue = Promise.resolve();
  }

  isRunning() {
    return Boolean(this.process && this.process.exitCode === null && !this.process.killed);
  }

  getStatus() {
    return {
      running: this.isRunning(),
      installing: this.installing,
      starting: this.starting,
      phase: this.resolvePhase(),
      port: this.port || null,
      preferred_port: this.preferredPort || null,
      port_auto_selected: this.portAutoSelected,
      pid: this.pid || null,
      dev_url: this.devUrl,
      project_root: this.projectRoot,
      last_error: this.lastError,
      log_lines: this.logLines.slice(-25),
    };
  }

  clearLogs() {
    this.logLines = [];
  }

  pushLog(line) {
    const safeLine = stripAnsi(String(line || "").trim());
    if (!safeLine) {
      return;
    }
    pushTail(this.logLines, safeLine, DEV_SERVER_LOG_LIMIT);
  }

  detachOutputCapture() {
    if (typeof this.outputCleanup === "function") {
      this.outputCleanup();
    }
    this.outputCleanup = null;
  }

  async start(options) {
    return this.withLock(async () => this.startInternal(options));
  }

  async stop() {
    return this.withLock(async () => this.stopInternal());
  }

  async dispose() {
    try {
      await this.stop();
    } catch {
      // Best effort cleanup on shutdown.
    }
  }

  async withLock(task) {
    const previous = this.operationQueue;
    let release;
    this.operationQueue = new Promise((resolve) => {
      release = resolve;
    });

    await previous.catch(() => {});
    try {
      return await task();
    } finally {
      release();
    }
  }

  resolvePhase() {
    if (this.installing) {
      return "installing";
    }
    if (this.starting) {
      return "starting";
    }
    if (this.isRunning()) {
      return "running";
    }
    if (this.lastError) {
      return "failed";
    }
    return "stopped";
  }

  async startInternal(options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const projectRoot = String(safeOptions.projectRoot || "").trim();
    if (!projectRoot) {
      throw new Error("project_root is required");
    }

    await ensureDirectoryExists(projectRoot);

    const requested = parseRequestedDevUrl(safeOptions.devUrl || this.devUrl || DEFAULT_VITE_DEV_URL);
    const discovery = await findViteProjectRoot(projectRoot, VITE_DISCOVERY_MAX_DEPTH);
    if (!discovery.projectRoot) {
      throw new Error("No Vite project found in selected directory or subdirectories");
    }
    for (const warning of discovery.warnings) {
      console.warn(`[REL_EDITOR][ViteDiscovery] ${warning}`);
    }
    if (discovery.matches.length > 1) {
      console.warn(
        `[REL_EDITOR][ViteDiscovery] Multiple Vite projects found under "${projectRoot}". `
        + `Using closest: "${discovery.projectRoot}".`
      );
    }
    const effectiveProjectRoot = discovery.projectRoot;

    if (this.isRunning()) {
      const sameRuntimeTarget = this.projectRoot === effectiveProjectRoot && this.devUrl === requested.devUrl;
      if (sameRuntimeTarget) {
        return this.getStatus();
      }
      await this.stopInternal();
    }

    this.clearLogs();
    this.lastError = "";
    this.projectRoot = effectiveProjectRoot;
    this.preferredPort = requested.port;
    this.portAutoSelected = false;
    this.devUrl = requested.devUrl;
    this.port = requested.port;
    this.pid = null;
    this.pushLog(`[REL VITE] Using project root: ${effectiveProjectRoot}`);
    this.pushLog(`[REL VITE] Requested dev server URL: ${requested.devUrl}`);

    await ensureDependenciesInstalled(effectiveProjectRoot, this);

    const resolvedPort = await findNextAvailablePort(requested.port, PORT_SCAN_ATTEMPTS);
    const launchConfig = {
      ...requested,
      port: resolvedPort,
      devUrl: `${requested.protocol}//${requested.host}:${resolvedPort}`,
    };
    if (resolvedPort !== requested.port) {
      this.portAutoSelected = true;
      this.pushLog(
        `[REL VITE] Preferred port ${requested.port} is busy. Using next free port ${resolvedPort}.`
      );
    } else {
      this.pushLog(`[REL VITE] Using preferred port ${resolvedPort}.`);
    }
    this.devUrl = launchConfig.devUrl;
    this.port = launchConfig.port;

    this.starting = true;
    this.installing = false;
    this.stopping = false;

    const npmRunDev = buildNpmSpawnCommand([
      "run",
      "dev",
      "--",
      "--host",
      launchConfig.host,
      "--port",
      String(launchConfig.port),
    ]);

    const child = spawn(npmRunDev.command, npmRunDev.args, {
      cwd: effectiveProjectRoot,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    this.process = child;
    this.pid = Number.isFinite(Number(child.pid)) ? Number(child.pid) : null;
    this.detachOutputCapture();
    this.outputCleanup = attachProcessOutput(child, (line) => {
      this.pushLog(line);
    });

    child.once("exit", (code, signal) => {
      if (this.process === child) {
        this.process = null;
      }
      if (this.pid === Number(child.pid)) {
        this.pid = null;
      }
      this.detachOutputCapture();
      this.installing = false;
      this.starting = false;
      const childPid = Number(child.pid);
      const expectedStop = Number.isFinite(childPid) && this.expectedStopPids.has(childPid);
      if (expectedStop) {
        this.expectedStopPids.delete(childPid);
      }

      if (!expectedStop && !this.stopping && (code !== 0 || signal)) {
        const tail = summarizeTail(this.logLines);
        const suffix = tail ? `\n${tail}` : "";
        this.lastError = `Vite dev server stopped unexpectedly (code=${code}, signal=${signal || "none"}).${suffix}`;
      }
    });

    try {
      const ready = await waitForViteReady(child, {
        timeoutMs: 45000,
      });

      const runtimeUrl = parseRuntimeUrl(ready.url, launchConfig);
      this.devUrl = runtimeUrl.devUrl;
      this.port = runtimeUrl.port;
      this.starting = false;
      this.lastError = "";
      this.pushLog(`[REL VITE] Dev server ready at ${this.devUrl}`);
      return this.getStatus();
    } catch (error) {
      this.starting = false;
      this.installing = false;
      const friendly = toUserFriendlyNpmError(error);
      this.lastError = friendly.message;
      this.pushLog(`[REL VITE][ERROR] ${friendly.message}`);
      if (this.process === child) {
        await killProcessTree(child.pid);
        await waitForProcessExit(child, 6000);
        if (this.process === child && child.exitCode !== null) {
          this.process = null;
        }
      }
      if (this.pid === Number(child.pid)) {
        this.pid = null;
      }
      this.detachOutputCapture();
      throw friendly;
    }
  }

  async stopInternal() {
    const active = this.process;
    if (!active) {
      this.installing = false;
      this.starting = false;
      this.stopping = false;
      this.pid = null;
      this.detachOutputCapture();
      this.pushLog("[REL VITE] Stop requested but no running process was found.");
      return this.getStatus();
    }

    this.stopping = true;
    this.installing = false;
    this.starting = false;
    this.pushLog(`[REL VITE] Stopping dev server (pid=${active.pid || "unknown"})...`);
    const activePid = Number(active.pid);
    if (Number.isFinite(activePid) && activePid > 0) {
      this.expectedStopPids.add(activePid);
    }
    try {
      await killProcessTree(active.pid);
      await waitForProcessExit(active, 8000);
    } finally {
      if (this.process === active && active.exitCode !== null) {
        this.process = null;
      }
      if (this.pid === Number(active.pid)) {
        this.pid = null;
      }
      this.detachOutputCapture();
      this.stopping = false;
    }

    if (this.process === active && active.exitCode === null) {
      this.lastError = "Failed to stop Vite dev server cleanly.";
      return this.getStatus();
    }

    this.lastError = "";
    this.pushLog("[REL VITE] Dev server stopped.");
    return this.getStatus();
  }
}

async function ensureDirectoryExists(projectRoot) {
  let stats;
  try {
    stats = await fs.stat(projectRoot);
  } catch {
    throw new Error(`project_root does not exist: ${projectRoot}`);
  }
  if (!stats.isDirectory()) {
    throw new Error("project_root must point to a directory");
  }
}

async function findViteProjectRoot(basePath, maxDepth = VITE_DISCOVERY_MAX_DEPTH) {
  const startDir = path.resolve(String(basePath || "").trim());
  const safeMaxDepth = Number.isInteger(maxDepth) && maxDepth >= 0 ? maxDepth : VITE_DISCOVERY_MAX_DEPTH;
  const queue = [{ dir: startDir, depth: 0 }];
  const visited = new Set([normalizeVisitKey(startDir)]);
  const matches = [];
  const warnings = [];

  while (queue.length > 0) {
    const current = queue.shift();
    const packageJsonPath = path.join(current.dir, "package.json");
    if (await fileExists(packageJsonPath)) {
      const parsed = await readJsonFile(packageJsonPath);
      if (parsed.ok) {
        if (isVitePackageManifest(parsed.value)) {
          matches.push({
            projectRoot: current.dir,
            depth: current.depth,
          });
        }
      } else {
        warnings.push(`Failed to parse ${packageJsonPath}: ${parsed.error}`);
      }
    }

    if (current.depth >= safeMaxDepth) {
      continue;
    }

    let entries;
    try {
      entries = await fs.readdir(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    const childDirs = entries
      .filter((entry) => entry && typeof entry.isDirectory === "function" && entry.isDirectory())
      .map((entry) => String(entry.name || "").trim())
      .filter((name) => name.length > 0 && !IGNORED_DISCOVERY_DIRS.has(name.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    for (const childName of childDirs) {
      const childPath = path.join(current.dir, childName);
      const visitKey = normalizeVisitKey(childPath);
      if (visited.has(visitKey)) {
        continue;
      }
      visited.add(visitKey);
      queue.push({ dir: childPath, depth: current.depth + 1 });
    }
  }

  matches.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth;
    }
    return a.projectRoot.localeCompare(b.projectRoot);
  });

  return {
    projectRoot: matches.length > 0 ? matches[0].projectRoot : "",
    matches,
    warnings,
  };
}

function isVitePackageManifest(pkg) {
  const safePkg = ensureObject(pkg);
  const dependencies = ensureObject(safePkg.dependencies);
  const devDependencies = ensureObject(safePkg.devDependencies);
  const scripts = ensureObject(safePkg.scripts);
  const devScript = String(scripts.dev || "");

  const hasViteDependency = Object.prototype.hasOwnProperty.call(dependencies, "vite")
    || Object.prototype.hasOwnProperty.call(devDependencies, "vite");
  const hasViteDevScript = /\bvite\b/i.test(devScript);

  return hasViteDependency || hasViteDevScript;
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return {
      ok: true,
      value: JSON.parse(raw),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error || "Unknown error"),
    };
  }
}

function normalizeVisitKey(inputPath) {
  const resolved = path.resolve(String(inputPath || ""));
  if (process.platform === "win32") {
    return resolved.toLowerCase();
  }
  return resolved;
}

async function ensureDependenciesInstalled(projectRoot, manager) {
  const nodeModulesPath = path.join(projectRoot, "node_modules");
  if (await fileExists(nodeModulesPath)) {
    manager.pushLog("[REL VITE] node_modules found. Skipping npm install.");
    return;
  }

  manager.installing = true;
  manager.starting = false;
  manager.pushLog("[REL VITE] node_modules missing. Running npm install...");
  try {
    const npmInstall = buildNpmSpawnCommand(["install"]);
    await runCommand(npmInstall.command, npmInstall.args, {
      cwd: projectRoot,
      env: process.env,
      timeoutMs: 10 * 60 * 1000,
      onLine: (line) => manager.pushLog(`[npm install] ${line}`),
    });
    manager.pushLog("[REL VITE] npm install finished.");
  } catch (error) {
    throw toUserFriendlyNpmError(error);
  } finally {
    manager.installing = false;
  }
}

function waitForViteReady(child, options) {
  const opts = options && typeof options === "object" ? options : {};
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 30000;
  const onLine = typeof opts.onLine === "function" ? opts.onLine : null;

  return new Promise((resolve, reject) => {
    let settled = false;
    const outputLines = [];

    const cleanupStdout = attachLineReader(child.stdout, handleLine);
    const cleanupStderr = attachLineReader(child.stderr, handleLine);

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      const tail = summarizeTail(outputLines);
      const suffix = tail ? `\n${tail}` : "";
      reject(new Error(`Timed out while waiting for Vite dev server to report its Local URL.${suffix}`));
    }, timeoutMs);

    const onError = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(toUserFriendlyNpmError(error));
    };

    const onExit = (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      const tail = summarizeTail(outputLines);
      const suffix = tail ? `\n${tail}` : "";
      reject(new Error(`Vite dev server exited before ready (code=${code}, signal=${signal || "none"}).${suffix}`));
    };

    child.once("error", onError);
    child.once("exit", onExit);

    function handleLine(line) {
      const cleaned = stripAnsi(String(line || "").trim());
      if (!cleaned) {
        return;
      }
      if (onLine) {
        onLine(cleaned);
      }
      pushTail(outputLines, cleaned, 80);
      const detectedUrl = extractViteUrl(cleaned);
      if (!detectedUrl || settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve({ url: detectedUrl });
    }

    function cleanup() {
      clearTimeout(timeoutId);
      child.removeListener("error", onError);
      child.removeListener("exit", onExit);
      cleanupStdout();
      cleanupStderr();
    }
  });
}

function extractViteUrl(line) {
  const text = stripAnsi(String(line || ""));
  const localMatch = text.match(/Local:\s*(https?:\/\/[^\s]+)/i);
  if (localMatch && localMatch[1]) {
    return trimUrlCandidate(localMatch[1]);
  }

  const genericMatch = text.match(/\bhttps?:\/\/[^\s'"`<>]+/i);
  if (genericMatch && genericMatch[0]) {
    return trimUrlCandidate(genericMatch[0]);
  }
  return "";
}

function trimUrlCandidate(value) {
  return String(value || "").trim().replace(/[),.;]+$/, "");
}

function parseRequestedDevUrl(value) {
  const normalized = normalizeDevUrl(value || DEFAULT_VITE_DEV_URL);
  const parsed = new URL(normalized);
  const protocol = parsed.protocol || "http:";
  const host = parsed.hostname || "localhost";
  const port = normalizePort(parsed.port) || DEFAULT_VITE_PORT;
  return {
    protocol,
    host,
    port,
    devUrl: `${protocol}//${host}:${port}`,
  };
}

function parseRuntimeUrl(url, fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : parseRequestedDevUrl(DEFAULT_VITE_DEV_URL);
  const raw = String(url || "").trim();
  if (!raw) {
    return base;
  }

  try {
    const parsed = new URL(raw);
    const protocol = parsed.protocol || base.protocol;
    const host = parsed.hostname || base.host;
    const port = normalizePort(parsed.port) || base.port;
    return {
      protocol,
      host,
      port,
      devUrl: `${protocol}//${host}:${port}`,
    };
  } catch {
    return base;
  }
}

function normalizeDevUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return DEFAULT_VITE_DEV_URL;
  }

  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return DEFAULT_VITE_DEV_URL;
    }
    if (parsed.port) {
      return `${parsed.protocol}//${parsed.hostname}:${parsed.port}`;
    }
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return DEFAULT_VITE_DEV_URL;
  }
}

function normalizePort(input) {
  const parsed = Number(String(input || "").trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
}

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stripAnsi(value) {
  return String(value || "").replace(
    // eslint-disable-next-line no-control-regex
    /[\u001B\u009B][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

function pushTail(lines, value, maxLines) {
  lines.push(String(value || ""));
  while (lines.length > maxLines) {
    lines.shift();
  }
}

function summarizeTail(lines) {
  const safe = Array.isArray(lines) ? lines : [];
  if (safe.length === 0) {
    return "";
  }
  return safe.slice(-20).join("\n");
}

function attachLineReader(stream, onLine) {
  if (!stream || typeof stream.on !== "function") {
    return () => {};
  }

  let buffer = "";
  const onData = (chunk) => {
    buffer += String(chunk || "");
    const parts = buffer.split(/\r?\n/);
    buffer = parts.pop() || "";
    for (const part of parts) {
      onLine(part);
    }
  };

  const onEnd = () => {
    if (buffer.trim()) {
      onLine(buffer);
    }
    buffer = "";
  };

  stream.on("data", onData);
  stream.on("end", onEnd);

  return () => {
    stream.removeListener("data", onData);
    stream.removeListener("end", onEnd);
  };
}

async function runCommand(command, args, options) {
  const opts = options && typeof options === "object" ? options : {};
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 120000;
  const onLine = typeof opts.onLine === "function" ? opts.onLine : null;

  await new Promise((resolve, reject) => {
    let settled = false;
    const outputLines = [];

    const child = spawn(command, args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const cleanupStdout = attachLineReader(child.stdout, (line) => {
      const safeLine = stripAnsi(line);
      pushTail(outputLines, safeLine, 120);
      if (onLine && safeLine.trim()) {
        onLine(safeLine, "stdout");
      }
    });
    const cleanupStderr = attachLineReader(child.stderr, (line) => {
      const safeLine = stripAnsi(line);
      pushTail(outputLines, safeLine, 120);
      if (onLine && safeLine.trim()) {
        onLine(safeLine, "stderr");
      }
    });

    const timeoutId = setTimeout(async () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      await killProcessTree(child.pid);
      reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    const onError = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(toUserFriendlyNpmError(error));
    };

    const onExit = (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (code === 0) {
        resolve();
        return;
      }
      const outputTail = summarizeTail(outputLines);
      const suffix = outputTail ? `\n${outputTail}` : "";
      const error = new Error(`Command failed (${command} ${args.join(" ")}) code=${code} signal=${signal || "none"}${suffix}`);
      error.outputTail = outputTail;
      reject(toUserFriendlyNpmError(error));
    };

    child.once("error", onError);
    child.once("exit", onExit);

    function cleanup() {
      clearTimeout(timeoutId);
      child.removeListener("error", onError);
      child.removeListener("exit", onExit);
      cleanupStdout();
      cleanupStderr();
    }
  });
}

function toUserFriendlyNpmError(error) {
  const raw = error instanceof Error ? error : new Error(String(error || "Unknown error"));
  const outputTail = String(raw.outputTail || "");
  const combined = `${raw.message}\n${outputTail}`;

  if (raw.code === "ENOENT" || looksLikeNpmNotFound(combined)) {
    return new Error("npm not found. Install Node.js (with npm) and make sure npm is available in PATH.");
  }
  if (looksLikePortInUse(combined)) {
    return new Error(
      "Vite could not bind the selected port because it is already in use. "
      + "REL_EDITOR can switch to the next free port automatically; retry Start Dev Server or choose another Dev URL."
    );
  }
  if (looksLikeMissingPackageJson(combined)) {
    return new Error("package.json not found in the detected Vite project root.");
  }
  if (looksLikeMissingDevScript(combined)) {
    return new Error('Missing "dev" script in package.json. Add a Vite dev script (for example: "dev": "vite").');
  }
  return raw;
}

function looksLikeNpmNotFound(text) {
  const value = String(text || "");
  return /npm(?:\.cmd)?\s*:\s*command not found/i.test(value)
    || /'npm'\s+is not recognized as an internal or external command/i.test(value)
    || /cannot find.*npm/i.test(value);
}

function looksLikePortInUse(text) {
  const value = String(text || "");
  return /port\s+\d+\s+is already in use/i.test(value)
    || /eaddrinuse/i.test(value)
    || /address already in use/i.test(value);
}

function looksLikeMissingPackageJson(text) {
  const value = String(text || "");
  return /enoent.*package\.json/i.test(value)
    || /could not read package\.json/i.test(value);
}

function looksLikeMissingDevScript(text) {
  const value = String(text || "");
  return /missing script:\s*dev/i.test(value);
}

function buildNpmSpawnCommand(args) {
  const safeArgs = Array.isArray(args) ? args.map((arg) => String(arg || "")) : [];
  if (process.platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "npm", ...safeArgs],
    };
  }
  return {
    command: "npm",
    args: safeArgs,
  };
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function attachProcessOutput(child, onLine) {
  const callback = typeof onLine === "function" ? onLine : () => {};
  const cleanupStdout = attachLineReader(child.stdout, (line) => {
    callback(line, "stdout");
  });
  const cleanupStderr = attachLineReader(child.stderr, (line) => {
    callback(line, "stderr");
  });
  return () => {
    cleanupStdout();
    cleanupStderr();
  };
}

async function findNextAvailablePort(preferredPort, maxAttempts) {
  const startPort = normalizePort(preferredPort) || DEFAULT_VITE_PORT;
  const attempts = Number.isInteger(maxAttempts) && maxAttempts > 0 ? maxAttempts : PORT_SCAN_ATTEMPTS;

  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = startPort + offset;
    if (candidate > 65535) {
      break;
    }
    // Pre-check prevents the common "Port already in use" start failure.
    // Vite still receives an explicit --port, and may move to another port only if needed.
    // This keeps startup reliable without requiring terminal interaction.
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No free port found near ${startPort}. Checked ${attempts} ports (${startPort}-${Math.min(65535, startPort + attempts - 1)}).`
  );
}

function isPortAvailable(port) {
  const safePort = normalizePort(port);
  if (!safePort) {
    return Promise.resolve(false);
  }

  return probePortAvailability(safePort);
}

async function probePortAvailability(port) {
  const probes = [null, "127.0.0.1", "::1"];
  let hasSupportedProbe = false;

  for (const host of probes) {
    const result = await tryListenPort(port, host);
    if (result.supported) {
      hasSupportedProbe = true;
    }
    if (!result.available) {
      return false;
    }
  }

  return hasSupportedProbe;
}

function tryListenPort(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    let settled = false;
    const finish = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    server.once("error", (error) => {
      const code = String(error && error.code ? error.code : "");
      if (code === "EAFNOSUPPORT") {
        finish({ available: true, supported: false });
        return;
      }
      finish({ available: false, supported: true });
    });

    const listenOptions = host
      ? { port, host, exclusive: true }
      : { port, exclusive: true };

    server.listen(listenOptions, () => {
      server.close(() => finish({ available: true, supported: true }));
    });
  });
}

async function killProcessTree(pid) {
  if (!Number.isFinite(Number(pid)) || Number(pid) <= 0) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        shell: false,
        windowsHide: true,
        stdio: "ignore",
      });
      killer.once("error", () => resolve());
      killer.once("exit", () => resolve());
    });
    return;
  }

  try {
    process.kill(Number(pid), "SIGTERM");
  } catch {
    // Ignore.
  }
}

function waitForProcessExit(child, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      child.removeListener("exit", onExit);
      resolve();
    };

    const onExit = () => {
      finish();
    };

    const timeoutId = setTimeout(() => {
      finish();
    }, Number(timeoutMs) > 0 ? Number(timeoutMs) : 6000);

    child.once("exit", onExit);
  });
}

module.exports = {
  DevServerManager,
  findViteProjectRoot,
};
