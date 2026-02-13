const path = require("path");
const fs = require("fs/promises");
const { spawn } = require("child_process");

const PROJECT_TYPE_STATIC = "static-html";
const PROJECT_TYPE_VITE_REACT_STYLE = "vite-react-style";
const DEFAULT_VITE_DEV_URL = "http://localhost:5173";

class ViteRunner {
  constructor() {
    this.process = null;
    this.projectRoot = "";
    this.devUrl = DEFAULT_VITE_DEV_URL;
    this.port = 5173;
    this.installing = false;
    this.lastError = "";
  }

  isRunning() {
    return Boolean(this.process && !this.process.killed);
  }

  getStatus() {
    return {
      running: this.isRunning(),
      installing: this.installing,
      port: this.port || null,
      dev_url: this.devUrl,
      project_root: this.projectRoot,
      last_error: this.lastError,
    };
  }

  async start(options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const projectRoot = String(safeOptions.projectRoot || "").trim();
    if (!projectRoot) {
      throw new Error("project_root is required");
    }

    const requestedDevUrl = normalizeDevUrl(safeOptions.devUrl || DEFAULT_VITE_DEV_URL);
    const requested = new URL(requestedDevUrl);
    const requestedPort = normalizePort(requested.port) || 5173;
    const requestedHost = requested.hostname || "127.0.0.1";

    if (this.isRunning()) {
      if (this.projectRoot === projectRoot) {
        return this.getStatus();
      }
      await this.stop();
    }

    await ensurePackageJson(projectRoot);
    await ensureNodeModules(projectRoot, this);

    this.projectRoot = projectRoot;
    this.devUrl = `${requested.protocol}//${requested.host}`;
    this.port = requestedPort;
    this.lastError = "";

    const npmRunDev = buildNpmSpawnCommand([
      "run",
      "dev",
      "--",
      "--host",
      requestedHost,
      "--port",
      String(requestedPort),
      "--strictPort",
    ]);

    const child = spawn(npmRunDev.command, npmRunDev.args, {
      cwd: projectRoot,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    this.process = child;
    child.once("exit", () => {
      this.process = null;
      this.installing = false;
    });

    await waitForViteReady(child, (line) => {
      const detectedUrl = extractViteUrl(line);
      if (!detectedUrl) {
        return;
      }
      const normalized = normalizeDevUrl(detectedUrl);
      const parsed = new URL(normalized);
      this.devUrl = normalized;
      this.port = normalizePort(parsed.port) || this.port;
    });

    return this.getStatus();
  }

  async stop() {
    const active = this.process;
    if (!active) {
      return this.getStatus();
    }

    this.installing = false;
    await killProcessTree(active.pid);
    await waitForProcessExit(active, 6000);
    this.process = null;
    return this.getStatus();
  }

  async dispose() {
    try {
      await this.stop();
    } catch {
      // Best effort cleanup on shutdown.
    }
  }
}

async function ensurePackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await fileExists(packageJsonPath))) {
    throw new Error(`package.json not found in project root: ${projectRoot}`);
  }
}

async function ensureNodeModules(projectRoot, runner) {
  const nodeModulesPath = path.join(projectRoot, "node_modules");
  if (await fileExists(nodeModulesPath)) {
    return;
  }

  runner.installing = true;
  try {
    const npmInstall = buildNpmSpawnCommand(["install"]);
    await runCommand(npmInstall.command, npmInstall.args, {
      cwd: projectRoot,
      env: process.env,
      timeoutMs: 5 * 60 * 1000,
    });
  } finally {
    runner.installing = false;
  }
}

function waitForViteReady(child, onOutputLine) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let output = "";

    const cleanupStdout = attachLineReader(child.stdout, handleLine);
    const cleanupStderr = attachLineReader(child.stderr, handleLine);

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve();
    }, 20000);

    const onExit = (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      const extra = output.trim() ? `\n${output.trim().slice(-1200)}` : "";
      reject(new Error(`Vite dev server exited before ready (code=${code}, signal=${signal}).${extra}`));
    };

    child.once("exit", onExit);

    function handleLine(rawLine) {
      const line = String(rawLine || "");
      if (!line.trim()) {
        return;
      }
      output += `${line}\n`;
      if (typeof onOutputLine === "function") {
        onOutputLine(line);
      }

      if (!extractViteUrl(line)) {
        return;
      }

      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve();
    }

    function cleanup() {
      clearTimeout(timeoutId);
      child.removeListener("exit", onExit);
      cleanupStdout();
      cleanupStderr();
    }
  });
}

function extractViteUrl(line) {
  const text = String(line || "");
  const localMatch = text.match(/Local:\s*(https?:\/\/[^\s]+)/i);
  if (localMatch && localMatch[1]) {
    return localMatch[1];
  }
  const genericMatch = text.match(/\bhttps?:\/\/[^\s'"`<>]+/i);
  if (genericMatch && genericMatch[0]) {
    return genericMatch[0];
  }
  return "";
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
    for (const line of parts) {
      onLine(line);
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

  await new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let finished = false;

    const child = spawn(command, args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const cleanupStdout = attachLineReader(child.stdout, (line) => {
      stdout += `${line}\n`;
    });
    const cleanupStderr = attachLineReader(child.stderr, (line) => {
      stderr += `${line}\n`;
    });

    const timeoutId = setTimeout(async () => {
      if (finished) {
        return;
      }
      finished = true;
      cleanupStdout();
      cleanupStderr();
      await killProcessTree(child.pid);
      reject(new Error(`Command timed out: ${command} ${args.join(" ")}`));
    }, timeoutMs);

    child.once("error", (error) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeoutId);
      cleanupStdout();
      cleanupStderr();
      reject(error);
    });

    child.once("exit", (code, signal) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeoutId);
      cleanupStdout();
      cleanupStderr();
      if (code === 0) {
        resolve();
        return;
      }
      const tail = `${stdout}\n${stderr}`.trim().slice(-1200);
      reject(new Error(`Command failed (${command} ${args.join(" ")}) code=${code} signal=${signal}${tail ? `\n${tail}` : ""}`));
    });
  });
}

function normalizeProjectType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === PROJECT_TYPE_VITE_REACT_STYLE) {
    return PROJECT_TYPE_VITE_REACT_STYLE;
  }
  return PROJECT_TYPE_STATIC;
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
    const port = normalizePort(parsed.port);
    const host = parsed.hostname || "localhost";
    const protocol = parsed.protocol;
    if (port) {
      return `${protocol}//${host}:${port}`;
    }
    return `${protocol}//${host}`;
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

function buildNpmSpawnCommand(args) {
  const safeArgs = Array.isArray(args) ? args.map((item) => String(item)) : [];
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
    return;
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
  ViteRunner,
  PROJECT_TYPE_STATIC,
  PROJECT_TYPE_VITE_REACT_STYLE,
  DEFAULT_VITE_DEV_URL,
  normalizeProjectType,
  normalizeDevUrl,
};
