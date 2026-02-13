function injectRuntimeAssets(html, options) {
  const runtimeCssHref = options.runtimeCssHref;
  const runtimeJsHref = options.runtimeJsHref;
  const overrideCssHref = options.overrideCssHref;

  const tags = [];

  if (runtimeCssHref) {
    tags.push(`<link rel="stylesheet" href="${runtimeCssHref}" data-rel-runtime="overlay-css">`);
  }

  if (overrideCssHref) {
    tags.push(`<link rel="stylesheet" href="${overrideCssHref}" data-rel-runtime="override-css">`);
  }

  if (runtimeJsHref) {
    tags.push(`<script src="${runtimeJsHref}" data-rel-runtime="overlay-js"></script>`);
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

module.exports = {
  injectRuntimeAssets,
};