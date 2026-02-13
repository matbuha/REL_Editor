function injectRuntimeAssets(html, options) {
  const runtimeCssHref = options.runtimeCssHref;
  const runtimeJsHref = options.runtimeJsHref;
  const overrideCssHref = options.overrideCssHref;
  const externalStyleHrefs = Array.isArray(options.externalStyleHrefs) ? options.externalStyleHrefs : [];
  const externalScriptSrcs = Array.isArray(options.externalScriptSrcs) ? options.externalScriptSrcs : [];

  const tags = [];

  for (const href of externalStyleHrefs) {
    if (!href) {
      continue;
    }
    tags.push(`<link rel="stylesheet" href="${escapeAttr(href)}" data-rel-runtime="external-style">`);
  }

  if (runtimeCssHref) {
    tags.push(`<link rel="stylesheet" href="${escapeAttr(runtimeCssHref)}" data-rel-runtime="overlay-css">`);
  }

  if (overrideCssHref) {
    tags.push(`<link rel="stylesheet" href="${escapeAttr(overrideCssHref)}" data-rel-runtime="override-css">`);
  }

  for (const src of externalScriptSrcs) {
    if (!src) {
      continue;
    }
    tags.push(`<script src="${escapeAttr(src)}" data-rel-runtime="external-script"></script>`);
  }

  if (runtimeJsHref) {
    tags.push(`<script src="${escapeAttr(runtimeJsHref)}" data-rel-runtime="overlay-js"></script>`);
  }

  if (tags.length === 0) {
    return html;
  }

  const injection = tags.join("\n");

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${injection}\n</head>`);
  }

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${injection}\n</body>`);
  }

  return `${html}\n${injection}`;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = {
  injectRuntimeAssets,
};
