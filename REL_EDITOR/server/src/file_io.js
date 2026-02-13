const path = require("path");
const fs = require("fs/promises");

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeProjectRoot(rootDir, maybePath) {
  if (!maybePath || typeof maybePath !== "string") {
    throw new Error("projectRoot is required");
  }

  const trimmed = maybePath.trim();
  if (!trimmed) {
    throw new Error("projectRoot is required");
  }

  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }

  return path.resolve(rootDir, trimmed);
}

function resolveInside(baseDir, maybeRelative) {
  const relative = (maybeRelative || "").replace(/\\/g, "/");
  const targetPath = path.resolve(baseDir, relative);
  const normalizedBase = path.resolve(baseDir);
  const rel = path.relative(normalizedBase, targetPath);
  const outside = rel.startsWith("..") || path.isAbsolute(rel);

  if (outside) {
    throw new Error("Path escapes project root");
  }

  return targetPath;
}

async function loadRelConfig(rootDir) {
  const configPath = path.join(rootDir, "rel.config.json");
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw);
}

function relEditorDir(projectRoot) {
  return path.join(projectRoot, "rel_editor");
}

async function readPatch(projectRoot) {
  const patchPath = path.join(relEditorDir(projectRoot), "patch.json");
  const overridePath = path.join(relEditorDir(projectRoot), "override.css");

  let patch = null;
  let overrideCss = "";

  if (await fileExists(patchPath)) {
    const rawPatch = await fs.readFile(patchPath, "utf8");
    patch = JSON.parse(rawPatch);
  }

  if (await fileExists(overridePath)) {
    overrideCss = await fs.readFile(overridePath, "utf8");
  }

  return { patch, overrideCss, patchPath, overridePath };
}

async function writePatch(projectRoot, patchData, overrideCss) {
  const editorDir = relEditorDir(projectRoot);
  const patchPath = path.join(editorDir, "patch.json");
  const overridePath = path.join(editorDir, "override.css");

  await fs.mkdir(editorDir, { recursive: true });
  await fs.writeFile(patchPath, JSON.stringify(patchData, null, 2), "utf8");
  await fs.writeFile(overridePath, overrideCss || "", "utf8");

  return { patchPath, overridePath };
}

module.exports = {
  fileExists,
  normalizeProjectRoot,
  resolveInside,
  loadRelConfig,
  readPatch,
  writePatch,
  relEditorDir,
};