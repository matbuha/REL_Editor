const path = require("path");
const fs = require("fs/promises");
const { parseHTML } = require("linkedom");
const { readPatch } = require("./file_io");
const { PROJECT_TYPE_VITE_REACT_STYLE, normalizeProjectType } = require("./vite_runner");

const TEXT_EDIT_TAGS = new Set(["A", "BUTTON", "P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "LABEL", "LI", "DIV", "SECTION"]);
const LINK_ATTRIBUTE_KEYS = ["href", "target", "rel", "title"];
const VOID_TAGS = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK", "SOURCE", "TRACK", "WBR"]);
const PROTECTED_TAGS = new Set(["HTML", "HEAD"]);

async function exportSafe(projectRoot, indexPath, options) {
  const opts = options && typeof options === "object" ? options : {};
  const projectType = normalizeProjectType(opts.projectType);
  if (projectType === PROJECT_TYPE_VITE_REACT_STYLE) {
    return exportSafeViteReactStyle(projectRoot);
  }

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

  const cssResult = buildExportCssWithReport(patch, patchResult.overrideCss || "");
  await fs.writeFile(relCssPath, cssResult.css, "utf8");

  const exportedHtml = buildExportHtml(htmlRaw, patch, sourceDir, relCssPath);
  await fs.writeFile(relHtmlPath, exportedHtml, "utf8");

  return {
    mode: "safe",
    html: relHtmlPath,
    css: relCssPath,
    export_report: cssResult.report,
  };
}

async function exportSafeViteReactStyle(projectRoot) {
  const patchResult = await safeReadPatchForExport(projectRoot);
  const patch = ensurePlainObject(patchResult.patch);
  const cssResult = buildExportCssWithReport(patch, patchResult.overrideCss || "");

  const srcDir = path.join(projectRoot, "src");
  await fs.mkdir(srcDir, { recursive: true });

  const relCssPath = path.join(srcDir, "REL_overrides.css");
  await fs.writeFile(relCssPath, cssResult.css, "utf8");

  const originalEntry = await detectViteEntryFile(srcDir);
  const relEntryPath = await writeViteRelEntry(srcDir, originalEntry);
  const instructionsPath = path.join(projectRoot, "REL_INSTRUCTIONS.txt");
  await fs.writeFile(instructionsPath, buildViteInstructionsText(originalEntry, relEntryPath), "utf8");

  return {
    mode: "safe-vite-react-style",
    css: relCssPath,
    entry: relEntryPath,
    instructions: instructionsPath,
    export_report: cssResult.report,
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

async function detectViteEntryFile(srcDir) {
  const candidates = [
    "main.tsx",
    "main.jsx",
    "main.ts",
    "main.js",
    "index.tsx",
    "index.jsx",
    "index.ts",
    "index.js",
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(srcDir, candidate);
    if (await fileExists(fullPath)) {
      return candidate;
    }
  }
  throw new Error(`Could not detect Vite entry file in "${srcDir}". Expected one of: ${candidates.join(", ")}`);
}

async function writeViteRelEntry(srcDir, originalEntry) {
  const safeOriginal = String(originalEntry || "").trim();
  const originalExt = path.extname(safeOriginal).toLowerCase();
  const relEntryName = [".tsx", ".ts"].includes(originalExt) ? "REL_entry.tsx" : "REL_entry.jsx";
  const relEntryPath = path.join(srcDir, relEntryName);
  const importTarget = `./${safeOriginal.replace(/\\/g, "/")}`;

  const lines = [
    "/* REL_EDITOR generated entry for Style-only export */",
    "import \"./REL_overrides.css\";",
    `import \"${importTarget}\";`,
    "",
  ];
  await fs.writeFile(relEntryPath, lines.join("\n"), "utf8");
  return relEntryPath;
}

function buildViteInstructionsText(originalEntry, relEntryPath) {
  const relEntryName = path.basename(relEntryPath || "REL_entry.jsx");
  return [
    "REL_EDITOR Vite React (Style only) export",
    "",
    `Generated CSS: src/REL_overrides.css`,
    `Generated entry: src/${relEntryName}`,
    "",
    "To run with the REL entry without editing source files permanently:",
    "1. Temporarily point your Vite entry import to src/REL_entry.* in your local run flow,",
    "   or create a local script that uses REL_entry as the startup module.",
    `2. Keep your original entry file unchanged: src/${originalEntry}`,
    "",
    "No package.json changes were made automatically.",
    "",
  ].join("\n");
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
  const relElementMap = new Map();
  applyStructuralOpsToDocument(document, patch, selectorMap, relElementMap);
  applyAttributeOverridesToDocument(document, patch, selectorMap, relElementMap);
  applyTextOverridesToDocument(document, patch, selectorMap, relElementMap);
}

function applyAttributeOverridesToDocument(document, patch, selectorMap, relElementMap) {
  const attributeOverrides = buildAttributeOverridesForExport(patch);
  const relIds = Object.keys(attributeOverrides);
  for (const relId of relIds) {
    const element = resolveElementForExportOperation(document, relId, selectorMap, patch, relElementMap, "attribute override");
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

function applyTextOverridesToDocument(document, patch, selectorMap, relElementMap) {
  const textOverrides = normalizeTextOverridesForExport(patch.textOverrides || patch.text_overrides);
  const relIds = Object.keys(textOverrides);
  for (const relId of relIds) {
    const element = resolveElementForExportOperation(document, relId, selectorMap, patch, relElementMap, "text override");
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

function applyStructuralOpsToDocument(document, patch, selectorMap, relElementMap) {
  const addedNodes = normalizeAddedNodesForExport(patch.addedNodes || patch.added_nodes);
  for (const node of addedNodes) {
    applyAddedNodeForExport(document, node, selectorMap, patch, relElementMap);
  }

  const movedNodes = normalizeMovedNodesForExport(patch.movedNodes || patch.moved_nodes);
  for (const moveOp of movedNodes) {
    applyMovedNodeForExport(document, moveOp, selectorMap, patch, relElementMap);
  }

  const deletedNodes = normalizeDeletedNodesForExport(patch.deletedNodes || patch.deleted_nodes);
  for (const node of deletedNodes) {
    applyDeletedNodeForExport(document, node, selectorMap, patch, relElementMap);
  }
}

function normalizeAddedNodesForExport(value) {
  const raw = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const type = String(item.type || "").trim().toLowerCase();
    if (!type) {
      continue;
    }
    result.push({
      nodeId: String(item.nodeId || "").trim(),
      relId: String(item.relId || "").trim(),
      parentRelId: String(item.parentRelId || "").trim(),
      parentFallbackSelector: String(item.parentFallbackSelector || "").trim(),
      type,
      props: ensurePlainObject(item.props),
    });
  }
  return result;
}

function normalizeDeletedNodesForExport(value) {
  const raw = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const relId = String(item.relId || "").trim();
    const fallbackSelector = String(item.fallbackSelector || "").trim();
    if (!relId && !fallbackSelector) {
      continue;
    }
    result.push({
      relId,
      fallbackSelector,
    });
  }
  return result;
}

function normalizeMovedNodesForExport(value) {
  const raw = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const sourceRelId = String(item.sourceRelId || item.relId || "").trim();
    const targetRelId = String(item.targetRelId || "").trim();
    if (!sourceRelId || !targetRelId) {
      continue;
    }
    result.push({
      sourceRelId,
      targetRelId,
      placement: normalizeMovePlacementForExport(item.placement),
      sourceFallbackSelector: String(item.sourceFallbackSelector || item.fallbackSelector || "").trim(),
      targetFallbackSelector: String(item.targetFallbackSelector || "").trim(),
    });
  }
  return result;
}

function normalizeMovePlacementForExport(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "before" || normalized === "after" || normalized === "inside") {
    return normalized;
  }
  return "inside";
}

function applyAddedNodeForExport(document, node, selectorMap, patch, relElementMap) {
  const parent = resolveElementForExportOperation(
    document,
    node.parentRelId,
    selectorMap,
    patch,
    relElementMap,
    "added node parent",
    node.parentFallbackSelector
  );
  let targetParent = parent;
  if (!targetParent || !canContainChildrenForExport(targetParent)) {
    targetParent = document.body || document.documentElement;
  }
  if (!targetParent) {
    return null;
  }

  const element = createNodeElementForExport(document, node.type, node.props);
  if (!element) {
    return null;
  }
  targetParent.appendChild(element);

  if (node.relId) {
    relElementMap.set(node.relId, element);
  }
  return element;
}

function applyMovedNodeForExport(document, moveOp, selectorMap, patch, relElementMap) {
  const source = resolveElementForExportOperation(
    document,
    moveOp.sourceRelId,
    selectorMap,
    patch,
    relElementMap,
    "move source",
    moveOp.sourceFallbackSelector
  );
  const target = resolveElementForExportOperation(
    document,
    moveOp.targetRelId,
    selectorMap,
    patch,
    relElementMap,
    "move target",
    moveOp.targetFallbackSelector
  );
  if (!source || !target) {
    return false;
  }
  if (source === target || source.contains(target)) {
    return false;
  }
  if (PROTECTED_TAGS.has(String(source.tagName || "").toUpperCase())) {
    return false;
  }

  let parent = null;
  let reference = null;
  if (moveOp.placement === "inside") {
    if (!canContainChildrenForExport(target)) {
      return false;
    }
    parent = target;
    reference = null;
  } else if (moveOp.placement === "before") {
    parent = target.parentNode;
    reference = target;
  } else {
    parent = target.parentNode;
    reference = target.nextSibling;
  }
  if (!(parent && typeof parent.insertBefore === "function")) {
    return false;
  }
  if (parent === source || source.contains(parent)) {
    return false;
  }
  parent.insertBefore(source, reference);
  return true;
}

function applyDeletedNodeForExport(document, node, selectorMap, patch, relElementMap) {
  const element = resolveElementForExportOperation(
    document,
    node.relId,
    selectorMap,
    patch,
    relElementMap,
    "delete node",
    node.fallbackSelector
  );
  if (!element || !element.parentNode) {
    return false;
  }
  const relId = String(node.relId || "").trim();
  if (relId) {
    relElementMap.delete(relId);
  }
  element.parentNode.removeChild(element);
  return true;
}

function resolveElementForExportOperation(document, relId, selectorMap, patch, relElementMap, contextLabel, fallbackSelector) {
  const safeRelId = String(relId || "").trim();
  if (safeRelId && relElementMap.has(safeRelId)) {
    const mapped = relElementMap.get(safeRelId);
    if (mapped && mapped.isConnected) {
      return mapped;
    }
    relElementMap.delete(safeRelId);
  }

  let selector = "";
  if (safeRelId) {
    selector = resolveExportSelector(safeRelId, selectorMap, patch);
  }
  if (!selector) {
    selector = normalizeSelectorValue(fallbackSelector);
  }
  if (!selector) {
    if (safeRelId) {
      console.warn(`[REL export] Missing selector for ${contextLabel} relId "${safeRelId}". Skipping.`);
    }
    return null;
  }

  const element = selectSingleNode(document, selector, safeRelId || "(selector)", contextLabel);
  if (!element) {
    return null;
  }
  if (safeRelId) {
    relElementMap.set(safeRelId, element);
  }
  return element;
}

function canContainChildrenForExport(element) {
  if (!element || !element.tagName) {
    return false;
  }
  const tagName = String(element.tagName || "").toUpperCase();
  if (PROTECTED_TAGS.has(tagName)) {
    return false;
  }
  if (VOID_TAGS.has(tagName)) {
    return false;
  }
  return true;
}

function createNodeElementForExport(document, type, props) {
  const safeType = String(type || "").trim().toLowerCase();
  const safeProps = ensurePlainObject(props);
  switch (safeType) {
    case "section":
      return createSectionElementForExport(document, safeProps);
    case "container":
      return createTextNodeElementForExport(document, "div", safeProps.text || "Container");
    case "heading-h1":
      return createTextNodeElementForExport(document, "h1", safeProps.text || "Heading H1");
    case "heading-h2":
      return createTextNodeElementForExport(document, "h2", safeProps.text || "Heading H2");
    case "heading-h3":
      return createTextNodeElementForExport(document, "h3", safeProps.text || "Heading H3");
    case "paragraph":
      return createTextNodeElementForExport(document, "p", safeProps.text || "Paragraph text");
    case "button": {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = safeProps.text || "Button";
      return button;
    }
    case "image": {
      const img = document.createElement("img");
      img.src = String(safeProps.src || "https://via.placeholder.com/480x240.png?text=Image").trim();
      img.alt = String(safeProps.alt || "Image");
      return img;
    }
    case "link": {
      const anchor = document.createElement("a");
      anchor.href = String(safeProps.href || "#");
      anchor.textContent = String(safeProps.text || "Link");
      return anchor;
    }
    case "card":
      return createBasicCardForExport(document);
    case "spacer": {
      const spacer = document.createElement("div");
      spacer.style.height = String(safeProps.height || "24px");
      spacer.style.width = "100%";
      spacer.setAttribute("aria-hidden", "true");
      return spacer;
    }
    case "divider":
      return document.createElement("hr");
    case "bootstrap-card":
      return createBootstrapCardForExport(document);
    case "bootstrap-button": {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = String(safeProps.text || "Bootstrap Button");
      return btn;
    }
    case "bootstrap-grid":
      return createBootstrapGridForExport(document);
    case "bootstrap-navbar":
      return createBootstrapNavbarForExport(document);
    case "bulma-button": {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "button is-primary";
      btn.textContent = String(safeProps.text || "Bulma Button");
      return btn;
    }
    case "bulma-card":
      return createBulmaCardForExport(document);
    case "pico-button": {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "contrast";
      btn.textContent = String(safeProps.text || "Pico Button");
      return btn;
    }
    case "pico-link": {
      const anchor = document.createElement("a");
      anchor.href = String(safeProps.href || "#");
      anchor.className = "contrast";
      anchor.textContent = String(safeProps.text || "Pico Link");
      return anchor;
    }
    default:
      return createTextNodeElementForExport(document, "div", safeProps.text || "New element");
  }
}

function createTextNodeElementForExport(document, tagName, text) {
  const el = document.createElement(tagName);
  el.textContent = String(text || "");
  return el;
}

function createSectionElementForExport(document, props) {
  const section = document.createElement("section");
  if (Object.prototype.hasOwnProperty.call(props, "text")) {
    section.textContent = String(props.text || "");
  }
  return section;
}

function createBasicCardForExport(document) {
  const card = document.createElement("article");
  const title = document.createElement("h3");
  const text = document.createElement("p");
  const button = document.createElement("button");

  card.className = "rel-added-card";
  card.style.border = "1px solid #dddddd";
  card.style.borderRadius = "8px";
  card.style.padding = "12px";
  card.style.background = "#ffffff";

  title.textContent = "Card title";
  text.textContent = "Card description text";
  button.type = "button";
  button.textContent = "Action";

  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(button);
  return card;
}

function createBootstrapCardForExport(document) {
  const card = document.createElement("div");
  card.className = "card";
  const body = document.createElement("div");
  body.className = "card-body";
  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = "Card title";
  const text = document.createElement("p");
  text.className = "card-text";
  text.textContent = "Some quick example text.";
  const link = document.createElement("a");
  link.className = "btn btn-primary";
  link.href = "#";
  link.textContent = "Go somewhere";
  body.appendChild(title);
  body.appendChild(text);
  body.appendChild(link);
  card.appendChild(body);
  return card;
}

function createBootstrapGridForExport(document) {
  const row = document.createElement("div");
  row.className = "row";

  const colOne = document.createElement("div");
  colOne.className = "col";
  colOne.textContent = "Col 1";

  const colTwo = document.createElement("div");
  colTwo.className = "col";
  colTwo.textContent = "Col 2";

  row.appendChild(colOne);
  row.appendChild(colTwo);
  return row;
}

function createBootstrapNavbarForExport(document) {
  const nav = document.createElement("nav");
  nav.className = "navbar navbar-expand-lg bg-body-tertiary";

  const container = document.createElement("div");
  container.className = "container-fluid";

  const brand = document.createElement("a");
  brand.className = "navbar-brand";
  brand.href = "#";
  brand.textContent = "Navbar";

  container.appendChild(brand);
  nav.appendChild(container);
  return nav;
}

function createBulmaCardForExport(document) {
  const card = document.createElement("div");
  card.className = "card";

  const cardContent = document.createElement("div");
  cardContent.className = "card-content";

  const title = document.createElement("p");
  title.className = "title is-5";
  title.textContent = "Bulma Card";

  const text = document.createElement("p");
  text.textContent = "Card content";

  cardContent.appendChild(title);
  cardContent.appendChild(text);
  card.appendChild(cardContent);
  return card;
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

function buildExportCssWithReport(patch, overrideCss) {
  const globalCss = normalizeRgbaAlphaInCssValue(stripManagedRelIdRules(overrideCss));
  const stableResult = buildStableOverrideCssWithReport(patch);
  const stableCss = stableResult.css;

  const parts = [];
  if (globalCss.trim()) {
    parts.push(globalCss.trim());
  }
  if (stableCss.trim()) {
    parts.push(stableCss.trim());
  }
  const css = parts.length === 0 ? "" : `${parts.join("\n\n")}\n`;
  return {
    css,
    report: {
      exported_rules: stableResult.report.exported_rules,
      skipped_rules_count: stableResult.report.skipped_rules.length,
      skipped_rules: stableResult.report.skipped_rules,
    },
  };
}

function stripManagedRelIdRules(cssText) {
  const raw = String(cssText || "");
  const withoutRelRules = raw.replace(/\[data-rel-id=(?:"[^"]*"|'[^']*')\]\s*\{[\s\S]*?\}\s*/gi, "");
  return withoutRelRules.replace(/\n{3,}/g, "\n\n");
}

function buildStableOverrideCssWithReport(rawPatch) {
  const patch = ensurePlainObject(rawPatch);
  const overridesMeta = ensurePlainObject(patch.overridesMeta || patch.overrides_meta);
  const relIds = Object.keys(overridesMeta).sort();
  if (relIds.length === 0) {
    return {
      css: "",
      report: {
        exported_rules: 0,
        skipped_rules: [],
      },
    };
  }

  const selectorMap = buildSelectorMapForExport(patch);
  const mergedBySelector = new Map();
  const skippedRules = [];

  for (const relId of relIds) {
    const selector = resolveExportSelector(relId, selectorMap, patch);
    if (!selector) {
      console.warn(`[REL export] Missing selector for relId "${relId}". Skipping overrides.`);
      skippedRules.push({
        relId,
        reason: "missing-stable-selector",
      });
      continue;
    }

    const props = ensurePlainObject(overridesMeta[relId]);
    const entries = Object.entries(props)
      .map(([property, value]) => [String(property || "").trim(), normalizeRgbaAlphaInCssValue(String(value ?? ""))])
      .filter(([property, value]) => property && !isStyleMetadataProperty(property) && String(value).trim() !== "");
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

  return {
    css: lines.join("\n"),
    report: {
      exported_rules: mergedBySelector.size,
      skipped_rules: skippedRules,
    },
  };
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

function isStyleMetadataProperty(property) {
  return String(property || "").trim().startsWith("_");
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

async function exportMerge(projectRoot, indexPath, options) {
  const safeResult = await exportSafe(projectRoot, indexPath, options);
  return {
    mode: "merge",
    html: safeResult.html,
    css: safeResult.css,
    note: "Merge mode currently exports a merged-ready REL_ HTML + CSS pair.",
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

module.exports = {
  exportSafe,
  exportMerge,
};
