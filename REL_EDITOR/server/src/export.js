const path = require("path");
const fs = require("fs/promises");
const { parseHTML } = require("linkedom");
const { readPatch } = require("./file_io");

const TEXT_EDIT_TAGS = new Set(["A", "BUTTON", "P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "LABEL", "LI", "DIV"]);
const LINK_ATTRIBUTE_KEYS = ["href", "target", "rel", "title"];

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
  const patch = ensurePlainObject(patchResult.patch);

  const exportCss = buildExportCss(patch, patchResult.overrideCss || "");
  await fs.writeFile(relCssPath, exportCss, "utf8");

  const exportedHtml = buildExportHtml(htmlRaw, patch, sourceDir, relCssPath);
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

function buildExportHtml(htmlRaw, patch, sourceDir, relCssPath) {
  const sourceHtml = String(htmlRaw || "");
  const doctype = extractDoctype(sourceHtml);

  let htmlBody = sourceHtml;
  try {
    const { document } = parseHTML(sourceHtml);
    applyHtmlOverrides(document, patch);
    htmlBody = document.toString();
  } catch (error) {
    console.warn(`[REL export] Failed to parse HTML for attribute/text overrides (${error.message}).`);
    htmlBody = sourceHtml;
  }

  if (doctype && !/^\s*<!doctype/i.test(htmlBody)) {
    htmlBody = `${doctype}\n${htmlBody}`;
  }

  const cssRelative = path.relative(sourceDir, relCssPath).replace(/\\/g, "/");
  const loader = `<link rel="stylesheet" href="${cssRelative}" data-rel-export="safe">`;
  return injectStylesheetLoader(htmlBody, loader);
}

function applyHtmlOverrides(document, patch) {
  if (!document || typeof document.querySelectorAll !== "function") {
    return;
  }

  const selectorMap = buildSelectorMapForExport(patch);
  applyAttributeOverridesToDocument(document, patch, selectorMap);
  applyTextOverridesToDocument(document, patch, selectorMap);
}

function applyAttributeOverridesToDocument(document, patch, selectorMap) {
  const attributeOverrides = buildAttributeOverridesForExport(patch);
  const relIds = Object.keys(attributeOverrides);
  for (const relId of relIds) {
    const selector = resolveExportSelector(relId, selectorMap, patch);
    if (!selector) {
      console.warn(`[REL export] Missing selector for attribute override relId "${relId}". Skipping.`);
      continue;
    }

    const element = selectSingleNode(document, selector, relId, "attribute override");
    if (!element) {
      continue;
    }

    const attrs = attributeOverrides[relId];
    for (const key of LINK_ATTRIBUTE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) {
        continue;
      }
      const value = String(attrs[key] || "").trim();
      if (value) {
        element.setAttribute(key, value);
      } else {
        element.removeAttribute(key);
      }
    }
  }
}

function applyTextOverridesToDocument(document, patch, selectorMap) {
  const textOverrides = normalizeTextOverridesForExport(patch.textOverrides || patch.text_overrides);
  const relIds = Object.keys(textOverrides);
  for (const relId of relIds) {
    const selector = resolveExportSelector(relId, selectorMap, patch);
    if (!selector) {
      console.warn(`[REL export] Missing selector for text override relId "${relId}". Skipping.`);
      continue;
    }

    const element = selectSingleNode(document, selector, relId, "text override");
    if (!element) {
      continue;
    }

    const canEdit = canApplyTextOverride(element);
    if (!canEdit.ok) {
      console.warn(`[REL export] Skipping text override for relId "${relId}": ${canEdit.reason}`);
      continue;
    }

    element.textContent = String(textOverrides[relId].text || "");
  }
}

function canApplyTextOverride(element) {
  if (!element || !element.tagName) {
    return { ok: false, reason: "Element not valid" };
  }
  const tagName = String(element.tagName || "").toUpperCase();
  if (!TEXT_EDIT_TAGS.has(tagName)) {
    return { ok: false, reason: `Tag "${tagName}" is not text-editable` };
  }

  const childElements = element.children ? element.children.length : 0;
  if (childElements > 0) {
    return { ok: false, reason: "Complex content with child elements" };
  }

  const childNodes = Array.from(element.childNodes || []);
  const nonWhitespaceTextNodes = childNodes.filter((node) => {
    return node && node.nodeType === 3 && String(node.textContent || "").trim() !== "";
  });
  if (nonWhitespaceTextNodes.length > 1) {
    return { ok: false, reason: "Multiple text nodes" };
  }
  return { ok: true, reason: "" };
}

function selectSingleNode(document, selector, relId, contextLabel) {
  let nodes;
  try {
    nodes = document.querySelectorAll(selector);
  } catch (error) {
    console.warn(`[REL export] Invalid selector for ${contextLabel} relId "${relId}": ${selector} (${error.message})`);
    return null;
  }

  if (!nodes || nodes.length === 0) {
    console.warn(`[REL export] Selector not found for ${contextLabel} relId "${relId}": ${selector}`);
    return null;
  }
  if (nodes.length > 1) {
    console.warn(`[REL export] Selector matched multiple nodes for ${contextLabel} relId "${relId}": ${selector}. Using first match.`);
  }
  return nodes[0];
}

function extractDoctype(htmlRaw) {
  const match = String(htmlRaw || "").match(/^\s*<!doctype[^>]*>/i);
  return match ? match[0].trim() : "";
}

function injectStylesheetLoader(htmlText, loaderTag) {
  let exportedHtml = String(htmlText || "");
  if (/<\/head>/i.test(exportedHtml)) {
    return exportedHtml.replace(/<\/head>/i, `${loaderTag}\n</head>`);
  }
  if (/<\/body>/i.test(exportedHtml)) {
    return exportedHtml.replace(/<\/body>/i, `${loaderTag}\n</body>`);
  }
  return `${exportedHtml}\n${loaderTag}`;
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

function buildAttributeOverridesForExport(patch) {
  const explicit = normalizeAttributeOverridesForExport(patch.attributeOverrides || patch.attribute_overrides);
  const linksMeta = ensurePlainObject(patch.linksMeta || patch.links_meta);
  const result = { ...explicit };

  for (const [relId, linkValue] of Object.entries(linksMeta)) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId || result[safeRelId]) {
      continue;
    }

    const normalized = normalizeLegacyLinkEntry(linkValue);
    if (!normalized) {
      continue;
    }
    result[safeRelId] = normalized;
  }

  return result;
}

function normalizeLegacyLinkEntry(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const enabled = Boolean(value.enabled);
  const attrs = {
    href: String(value.href || "").trim(),
    target: String(value.target || "").trim(),
    rel: String(value.rel || "").trim(),
    title: String(value.title || "").trim(),
  };
  const hasNonEmpty = Object.values(attrs).some((item) => item !== "");
  if (!enabled && !hasNonEmpty) {
    return null;
  }
  return attrs;
}

function normalizeAttributeOverridesForExport(value) {
  const raw = ensurePlainObject(value);
  const result = {};
  for (const [relId, attrs] of Object.entries(raw)) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId || !attrs || typeof attrs !== "object") {
      continue;
    }

    const normalized = {};
    let hasAnyKey = false;
    for (const key of LINK_ATTRIBUTE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) {
        continue;
      }
      hasAnyKey = true;
      normalized[key] = String(attrs[key] || "").trim();
    }
    if (!hasAnyKey) {
      continue;
    }
    result[safeRelId] = normalized;
  }
  return result;
}

function normalizeTextOverridesForExport(value) {
  const raw = ensurePlainObject(value);
  const result = {};
  for (const [relId, entry] of Object.entries(raw)) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId || !entry || typeof entry !== "object") {
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(entry, "text")) {
      continue;
    }
    result[safeRelId] = {
      text: String(entry.text || ""),
    };
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
