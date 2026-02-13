const path = require("path");
const fs = require("fs/promises");
const { readPatch } = require("./file_io");

async function exportSafe(projectRoot, indexPath) {
  const sourceIndexPath = path.resolve(projectRoot, indexPath);
  const sourceDir = path.dirname(sourceIndexPath);
  const sourceFileName = path.basename(sourceIndexPath);

  const relHtmlName = `REL_${sourceFileName}`;
  const relCssName = `REL_${path.parse(sourceFileName).name}.css`;

  const relHtmlPath = path.join(sourceDir, relHtmlName);
  const relCssPath = path.join(sourceDir, relCssName);

  const htmlRaw = await fs.readFile(sourceIndexPath, "utf8");
  const patchResult = await safeReadPatchForExport(projectRoot);
  const exportCss = buildExportCss(patchResult.patch || {}, patchResult.overrideCss || "");
  await fs.writeFile(relCssPath, exportCss, "utf8");

  const cssRelative = path.relative(sourceDir, relCssPath).replace(/\\/g, "/");
  const loader = `<link rel="stylesheet" href="${cssRelative}" data-rel-export="safe">`;

  let exportedHtml = htmlRaw;
  if (/<\/head>/i.test(exportedHtml)) {
    exportedHtml = exportedHtml.replace(/<\/head>/i, `${loader}\n</head>`);
  } else if (/<\/body>/i.test(exportedHtml)) {
    exportedHtml = exportedHtml.replace(/<\/body>/i, `${loader}\n</body>`);
  } else {
    exportedHtml = `${exportedHtml}\n${loader}`;
  }

  await fs.writeFile(relHtmlPath, exportedHtml, "utf8");

  return {
    mode: "safe",
    html: relHtmlPath,
    css: relCssPath,
  };
}

async function safeReadPatchForExport(projectRoot) {
  try {
    return await readPatch(projectRoot);
  } catch (error) {
    const overridePath = path.join(projectRoot, "rel_editor", "override.css");
    let overrideCss = "";
    try {
      overrideCss = await fs.readFile(overridePath, "utf8");
    } catch {
      overrideCss = "";
    }
    console.warn(`[REL export] Failed to read patch.json (${error.message}). Falling back to override.css only.`);
    return { patch: null, overrideCss };
  }
}

function buildExportCss(patch, overrideCss) {
  const globalCss = normalizeRgbaAlphaInCssValue(stripManagedRelIdRules(overrideCss));
  const stableCss = buildStableOverrideCss(patch);

  const parts = [];
  if (globalCss.trim()) {
    parts.push(globalCss.trim());
  }
  if (stableCss.trim()) {
    parts.push(stableCss.trim());
  }
  if (parts.length === 0) {
    return "";
  }
  return `${parts.join("\n\n")}\n`;
}

function stripManagedRelIdRules(cssText) {
  const raw = String(cssText || "");
  const withoutRelRules = raw.replace(/\[data-rel-id=(?:"[^"]*"|'[^']*')\]\s*\{[\s\S]*?\}\s*/gi, "");
  return withoutRelRules.replace(/\n{3,}/g, "\n\n");
}

function buildStableOverrideCss(rawPatch) {
  const patch = ensurePlainObject(rawPatch);
  const overridesMeta = ensurePlainObject(patch.overridesMeta || patch.overrides_meta);
  const relIds = Object.keys(overridesMeta).sort();
  if (relIds.length === 0) {
    return "";
  }

  const selectorMap = buildSelectorMapForExport(patch);
  const mergedBySelector = new Map();

  for (const relId of relIds) {
    const selector = resolveExportSelector(relId, selectorMap, patch);
    if (!selector) {
      console.warn(`[REL export] Missing selector for relId "${relId}". Skipping overrides.`);
      continue;
    }

    const props = ensurePlainObject(overridesMeta[relId]);
    const entries = Object.entries(props)
      .map(([property, value]) => [String(property || "").trim(), normalizeRgbaAlphaInCssValue(String(value ?? ""))])
      .filter(([property, value]) => property && String(value).trim() !== "");
    if (entries.length === 0) {
      continue;
    }

    if (!mergedBySelector.has(selector)) {
      mergedBySelector.set(selector, {});
    }
    const target = mergedBySelector.get(selector);
    for (const [property, value] of entries) {
      target[property] = value;
    }
  }

  const lines = [];
  for (const [selector, declarations] of mergedBySelector.entries()) {
    const entries = Object.entries(declarations).filter(([, value]) => String(value).trim() !== "");
    if (entries.length === 0) {
      continue;
    }

    lines.push(`${selector} {`);
    for (const [property, value] of entries) {
      lines.push(`  ${property}: ${value};`);
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

function buildSelectorMapForExport(patch) {
  const explicit = normalizeSelectorMap(patch.selectorMap || patch.selector_map);
  const legacy = normalizeSelectorMap(patch.elementsMap || patch.elements);

  const result = { ...explicit };
  for (const [relId, selector] of Object.entries(legacy)) {
    if (!result[relId]) {
      result[relId] = selector;
    }
  }
  return result;
}

function resolveExportSelector(relId, selectorMap, patch) {
  const safeRelId = String(relId || "").trim();
  if (!safeRelId) {
    return "";
  }

  const direct = normalizeSelectorValue(selectorMap[safeRelId]);
  if (direct) {
    return direct;
  }

  const fallback = normalizeSelectorValue(
    ensurePlainObject(patch.elementsMap || patch.elements)[safeRelId]
  );
  return fallback;
}

function normalizeSelectorMap(value) {
  const raw = ensurePlainObject(value);
  const result = {};
  for (const [relId, selectorValue] of Object.entries(raw)) {
    const safeRelId = String(relId || "").trim();
    const safeSelector = normalizeSelectorValue(selectorValue);
    if (!safeRelId || !safeSelector) {
      continue;
    }
    result[safeRelId] = safeSelector;
  }
  return result;
}

function normalizeSelectorValue(value) {
  const selector = String(value || "").trim();
  if (!selector) {
    return "";
  }
  if (/\[data-rel-id\s*=/i.test(selector)) {
    return "";
  }
  return selector;
}

function normalizeRgbaAlphaInCssValue(value) {
  const raw = String(value ?? "");
  if (!raw) {
    return raw;
  }
  return raw.replace(/rgba\s*\(\s*([^)]+)\)/gi, (fullMatch, rawArgs) => {
    const parts = String(rawArgs || "")
      .split(",")
      .map((part) => part.trim());
    if (parts.length < 4) {
      return fullMatch;
    }

    const alpha = normalizeAlphaComponent(parts[3]);
    if (alpha === null) {
      return fullMatch;
    }
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${formatAlphaValue(alpha)})`;
  });
}

function normalizeAlphaComponent(input) {
  const parsed = Number(String(input || "").trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }

  let normalized = parsed;
  if (normalized > 1) {
    normalized = normalized <= 255 ? normalized / 255 : 1;
  }
  normalized = clamp(normalized, 0, 1);
  return normalized;
}

function formatAlphaValue(value) {
  const normalized = clamp(Number(value), 0, 1);
  const rounded = Math.round(normalized * 1000) / 1000;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return String(rounded).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensurePlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function exportMerge(projectRoot, indexPath) {
  const safeResult = await exportSafe(projectRoot, indexPath);
  return {
    mode: "merge",
    html: safeResult.html,
    css: safeResult.css,
    note: "Merge mode currently exports a merged-ready REL_ HTML + CSS pair.",
  };
}

module.exports = {
  exportSafe,
  exportMerge,
};
