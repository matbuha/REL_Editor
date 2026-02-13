const path = require("path");
const fs = require("fs/promises");

async function exportSafe(projectRoot, indexPath) {
  const sourceIndexPath = path.resolve(projectRoot, indexPath);
  const sourceDir = path.dirname(sourceIndexPath);
  const sourceFileName = path.basename(sourceIndexPath);

  const relHtmlName = `REL_${sourceFileName}`;
  const relCssName = `REL_${path.parse(sourceFileName).name}.css`;

  const relHtmlPath = path.join(sourceDir, relHtmlName);
  const relCssPath = path.join(sourceDir, relCssName);

  const overridePath = path.join(projectRoot, "rel_editor", "override.css");
  const htmlRaw = await fs.readFile(sourceIndexPath, "utf8");

  let overrideCss = "";
  try {
    overrideCss = await fs.readFile(overridePath, "utf8");
  } catch {
    overrideCss = "";
  }

  await fs.writeFile(relCssPath, overrideCss, "utf8");

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