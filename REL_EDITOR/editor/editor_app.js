(function () {
  const styleSectionsSchema = [
    {
      key: "layout",
      title: "Layout",
      controls: [
        { label: "width", property: "width", type: "text", placeholder: "auto" },
        { label: "height", property: "height", type: "text", placeholder: "auto" },
        { label: "display", property: "display", type: "select", options: ["", "block", "inline-block", "inline", "flex", "grid", "none"] },
        { label: "flex-direction", property: "flex-direction", type: "select", options: ["", "row", "column", "row-reverse", "column-reverse"] },
        { label: "justify-content", property: "justify-content", type: "select", options: ["", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] },
        { label: "align-items", property: "align-items", type: "select", options: ["", "stretch", "flex-start", "center", "flex-end", "baseline"] },
        { label: "object-fit", property: "object-fit", type: "select", options: ["", "fill", "contain", "cover", "none", "scale-down"] },
      ],
    },
    {
      key: "spacing",
      title: "Spacing",
      controls: [
        { label: "padding-top", property: "padding-top", type: "text", placeholder: "0px" },
        { label: "padding-right", property: "padding-right", type: "text", placeholder: "0px" },
        { label: "padding-bottom", property: "padding-bottom", type: "text", placeholder: "0px" },
        { label: "padding-left", property: "padding-left", type: "text", placeholder: "0px" },
        { label: "margin-top", property: "margin-top", type: "text", placeholder: "0px" },
        { label: "margin-right", property: "margin-right", type: "text", placeholder: "0px" },
        { label: "margin-bottom", property: "margin-bottom", type: "text", placeholder: "0px" },
        { label: "margin-left", property: "margin-left", type: "text", placeholder: "0px" },
        { label: "gap", property: "gap", type: "text", placeholder: "0px" },
      ],
    },
    {
      key: "layering",
      title: "LAYERING",
      controls: [{ label: "order", type: "order" }],
    },
    {
      key: "background",
      title: "Background",
      controls: [{ label: "background", type: "background" }],
    },
    {
      key: "typography",
      title: "Typography",
      controls: [
        { label: "font-family", property: "font-family", type: "font-family" },
        { label: "font-size", property: "font-size", type: "text", placeholder: "16px" },
        { label: "font-weight", property: "font-weight", type: "text", placeholder: "400" },
        { label: "line-height", property: "line-height", type: "text", placeholder: "1.4" },
        { label: "letter-spacing", property: "letter-spacing", type: "text", placeholder: "0px" },
        { label: "text-transform", property: "text-transform", type: "select", options: ["", "none", "uppercase", "lowercase", "capitalize"] },
        { label: "text-decoration", property: "text-decoration", type: "select", options: ["", "none", "underline", "overline", "line-through"] },
        { label: "vertical-align-content", type: "vertical-align-content" },
      ],
    },
    {
      key: "border",
      title: "Border",
      controls: [
        { label: "border-radius", property: "border-radius", type: "text", placeholder: "0px" },
        { label: "border-width", property: "border-width", type: "text", placeholder: "0px" },
        { label: "border-color", property: "border-color", type: "text", placeholder: "#000000" },
      ],
    },
    {
      key: "shadow",
      title: "SHADOW",
      controls: [{ label: "shadow", type: "shadow" }],
    },
    {
      key: "advanced",
      title: "Advanced",
      controls: [
        { label: "color", property: "color", type: "text", placeholder: "#222222" },
        { label: "text-align", property: "text-align", type: "select", options: ["", "left", "center", "right", "justify"] },
      ],
    },
  ];

  const SYSTEM_FONT_CHOICES = [
    { label: "Arial", family: "Arial", value: "\"Arial\", sans-serif" },
    { label: "Helvetica", family: "Helvetica", value: "\"Helvetica\", sans-serif" },
    { label: "Georgia", family: "Georgia", value: "\"Georgia\", serif" },
    { label: "Times New Roman", family: "Times New Roman", value: "\"Times New Roman\", serif" },
    { label: "Verdana", family: "Verdana", value: "\"Verdana\", sans-serif" },
    { label: "sans-serif", family: "sans-serif", value: "sans-serif" },
    { label: "serif", family: "serif", value: "serif" },
    { label: "monospace", family: "monospace", value: "monospace" },
  ];

  const FONT_PROVIDER_LABELS = {
    none: "None",
    google: "Google Fonts",
    bunny: "Bunny Fonts",
    "adobe-edge": "Adobe Edge Fonts",
  };

  const THEME_COLOR_DEFS = [
    { key: "primary", label: "Primary", varName: "--rel-primary", fallback: "#2b6df8" },
    { key: "secondary", label: "Secondary", varName: "--rel-secondary", fallback: "#17b57a" },
    { key: "accent", label: "Accent", varName: "--rel-accent", fallback: "#f97316" },
    { key: "background", label: "Background", varName: "--rel-bg", fallback: "#f6f7fb" },
    { key: "surface", label: "Surface", varName: "--rel-surface", fallback: "#ffffff" },
    { key: "text", label: "Text", varName: "--rel-text", fallback: "#1f2937" },
    { key: "muted", label: "Muted", varName: "--rel-muted", fallback: "#6b7280" },
    { key: "border", label: "Border", varName: "--rel-border", fallback: "#d1d5db" },
  ];

  const THEME_COLOR_VAR_BY_KEY = THEME_COLOR_DEFS.reduce((acc, entry) => {
    acc[entry.key] = entry.varName;
    return acc;
  }, {});

  const DEFAULT_THEME_FONTS = {
    bodyFamily: "\"Segoe UI\", system-ui, sans-serif",
    headingFamily: "\"Segoe UI\", system-ui, sans-serif",
    bodySize: "16px",
    h1Size: "2.5rem",
    h2Size: "2rem",
    h3Size: "1.5rem",
    smallSize: "0.875rem",
    lineHeight: "1.5",
  };

  const SHADOW_PRESETS = {
    none: "none",
    soft: "0px 2px 8px 0px rgba(15, 23, 42, 0.12)",
    medium: "0px 6px 18px 0px rgba(15, 23, 42, 0.2)",
    strong: "0px 12px 30px 0px rgba(15, 23, 42, 0.28)",
    inner: "inset 0px 2px 8px 0px rgba(15, 23, 42, 0.2)",
  };

  const BORDER_BOX_TRIGGER_PROPS = new Set([
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "width",
    "height",
  ]);

  const KNOWN_SYSTEM_FAMILIES = new Set(
    SYSTEM_FONT_CHOICES.map((item) => item.family.toLowerCase())
  );

  const basicComponents = [
    { type: "section", name: "Section", description: "Structural section block", props: {} },
    { type: "container", name: "Container", description: "Generic div container", props: { text: "Container" } },
    { type: "heading-h1", name: "Heading H1", description: "Large title", props: { text: "Heading H1" } },
    { type: "heading-h2", name: "Heading H2", description: "Section title", props: { text: "Heading H2" } },
    { type: "heading-h3", name: "Heading H3", description: "Sub section title", props: { text: "Heading H3" } },
    { type: "paragraph", name: "Paragraph", description: "Text block", props: { text: "Paragraph text" } },
    { type: "button", name: "Button", description: "Clickable button", props: { text: "Button" } },
    { type: "image", name: "Image", description: "Image placeholder", props: { alt: "Image" } },
    { type: "link", name: "Link", description: "Anchor element", props: { text: "Link", href: "#" } },
    { type: "card", name: "Card", description: "Ready card structure", props: {} },
    { type: "spacer", name: "Spacer", description: "Vertical spacing element", props: { height: "24px" } },
    { type: "divider", name: "Divider", description: "Horizontal rule", props: {} },
  ];

  const bootstrapComponents = [
    { type: "bootstrap-card", name: "Bootstrap Card", description: "Card block", props: {} },
    { type: "bootstrap-button", name: "Bootstrap Button", description: "Button with btn classes", props: { text: "Bootstrap Button" } },
    { type: "bootstrap-grid", name: "Grid Row + Col", description: "Row with two columns", props: {} },
    { type: "bootstrap-navbar", name: "Navbar", description: "Bootstrap navbar", props: {} },
  ];

  const bulmaComponents = [
    { type: "bulma-button", name: "Bulma Button", description: "Bulma styled button", props: { text: "Bulma Button" } },
    { type: "bulma-card", name: "Bulma Card", description: "Bulma card layout", props: {} },
  ];

  const picoComponents = [
    { type: "pico-button", name: "Pico Button", description: "Pico button style", props: { text: "Pico Button" } },
    { type: "pico-link", name: "Pico Link", description: "Pico link style", props: { text: "Pico Link", href: "#" } },
  ];

  const PATCH_VERSION = 4;
  const PROJECT_TYPE_STATIC = "static-html";
  const PROJECT_TYPE_VITE_REACT_STYLE = "vite-react-style";
  const DEFAULT_VITE_DEV_URL = "http://localhost:5173";
  const VITE_STATUS_WS_RETRY_STEPS_MS = [1000, 2000, 5000, 10000];
  const CARD_CENTER_TRIGGER_PROPS = new Set(["justify-content", "align-items"]);
  const VITE_GLOBAL_TARGET_PROPS = ["background", "background-color", "background-image", "color"];
  const LAYER_ORDER_MIN = 0;
  const LAYER_ORDER_MAX = 1000;
  const ORDER_AUTO_POSITION_META_KEY = "_relAutoPositionForZ";
  const ORDER_AUTO_POSITION_PREV_META_KEY = "_relAutoPositionPrev";
  const ROOT_LIKE_LAYER_TAGS = new Set(["html", "body"]);
  const BG_META_SOLID_KEY = "_relBgSolid";
  const BG_META_GRADIENT_KEY = "_relBgGradient";
  const BG_META_IMAGE_ENABLED_KEY = "_relBgImageEnabled";
  const BG_META_IMAGE_URL_KEY = "_relBgImageUrl";
  const BG_META_IMAGE_SIZE_KEY = "_relBgImageSize";
  const BG_META_IMAGE_POSITION_KEY = "_relBgImagePosition";
  const BG_META_IMAGE_REPEAT_KEY = "_relBgImageRepeat";
  const BG_SIZE_OPTIONS = ["auto", "contain", "cover"];
  const BG_POSITION_OPTIONS = ["center", "top", "bottom", "left", "right"];
  const BG_REPEAT_OPTIONS = ["no-repeat", "repeat"];
  const BACKGROUND_IMPORTANT_PROPS = new Set([
    "background",
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
  ]);
  const LAYOUT_STORAGE_KEY = "rel-editor-layout-v1";
  const LEFT_MIN_PX = 200;
  const RIGHT_MIN_PX = 260;
  const CENTER_MIN_PX = 320;
  const RESIZER_TOTAL_PX = 16;
  const TREE_INDENT_PX = 14;
  const TREE_AUTO_EXPAND_DELAY_MS = 750;
  const TREE_DROP_INSIDE_MIN_RATIO = 0.32;
  const TREE_DROP_INSIDE_MAX_RATIO = 0.68;
  const TREE_VOID_TAGS = new Set(["img", "input", "br", "hr", "meta", "link", "source", "track", "wbr"]);
  const TREE_PROTECTED_TAGS = new Set(["html", "head"]);
  const TOOLTIP_DEV_CHECK_DELAY_MS = 200;
  const TOOLTIP_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const TOOLTIP_ALLOWLIST_SELECTORS = [
    "input[type=\"file\"][hidden]",
    "#uploadImageInput",
  ];
  const TREE_CONTEXT_MENU_ACTIONS = [
    { action: "duplicate", label: "Duplicate", tooltipKey: "tree.context.duplicate" },
    { action: "delete", label: "Delete", tooltipKey: "tree.context.delete" },
    { action: "move-before", label: "Move before", tooltipKey: "tree.context.moveBefore" },
    { action: "move-after", label: "Move after", tooltipKey: "tree.context.moveAfter" },
    { action: "insert-container-above", label: "Insert container above", tooltipKey: "tree.context.insertContainerAbove" },
    { action: "insert-section-below", label: "Insert section below", tooltipKey: "tree.context.insertSectionBelow" },
  ];

  const state = {
    projectRoot: "",
    projectType: PROJECT_TYPE_STATIC,
    indexPath: "index.html",
    devUrl: DEFAULT_VITE_DEV_URL,
    viteStatus: {
      running: false,
      port: null,
      installing: false,
      starting: false,
      phase: "stopped",
      pid: null,
      preferredPort: null,
      portAutoSelected: false,
      lastError: "",
      logLines: [],
      projectRoot: "",
      devUrl: DEFAULT_VITE_DEV_URL,
    },
    defaultsLibraries: {
      designLibrary: "none",
      iconSet: "none",
      animateCss: false,
      bootstrapJs: false,
    },
    runtimeLibraries: {
      designLibrary: "none",
      iconSet: "none",
      animateCss: false,
      bootstrapJs: false,
    },
    defaultsFonts: {
      provider: "none",
      families: [],
    },
    runtimeFonts: {
      provider: "none",
      families: [],
    },
    defaultsTheme: createDefaultThemeState(),
    theme: createDefaultThemeState(),
    selectedRelId: null,
    elementsMap: {},
    selectorMap: {},
    attributeOverrides: {},
    textOverrides: {},
    overridesMeta: {},
    attributesMeta: {},
    linksMeta: {},
    addedNodes: [],
    deletedNodes: [],
    movedNodes: [],
    lastSelection: null,
    lastTreeSnapshot: [],
    overlayReady: false,
    viteStatusSocket: null,
    viteStatusSocketUrl: "",
    viteStatusReconnectTimer: null,
    viteStatusReconnectAttempt: 0,
    viteStatusConnectionLost: false,
    viteStatusManualClose: false,
    layout: {
      leftPx: null,
      rightPx: null,
      resizeSide: null,
      rafId: 0,
      pendingClientX: 0,
      moveHandler: null,
      upHandler: null,
    },
    tooltip: {
      devCheckTimer: 0,
      warnedMissing: new Set(),
      warnedUnknownKeys: new Set(),
    },
    treeUi: {
      collapsedByRelId: {},
      parentByRelId: {},
      nodeByRelId: {},
      query: "",
      dragSourceRelId: "",
      dragHoverRelId: "",
      dragDropPosition: "",
      dragAutoExpandRelId: "",
      dragAutoExpandTimer: 0,
      dragTooltipEl: null,
      dragging: false,
      bound: false,
      dragSourceRow: null,
    },
    treeContextMenu: {
      root: null,
      visible: false,
      targetRelId: "",
    },
    controls: {
      styleInputs: {},
      fontFamilySelect: null,
      fontFamilyWarning: null,
      fontFamilyWarningText: null,
      fontFamilyAutoLoadBtn: null,
      backgroundType: null,
      backgroundModeByRelId: {},
      backgroundSolidRow: null,
      backgroundGradientRow: null,
      backgroundSolidRadio: null,
      backgroundGradientRadio: null,
      backgroundImageRadio: null,
      backgroundSolidInput: null,
      backgroundGradientInput: null,
      backgroundImageGroup: null,
      backgroundImageToggle: null,
      backgroundImageUploadBtn: null,
      backgroundImageUploadInput: null,
      backgroundImageUrlInput: null,
      backgroundImageSizeInput: null,
      backgroundImagePositionInput: null,
      backgroundImageRepeatInput: null,
      backgroundImageClearBtn: null,
      backgroundPreview: null,
      layerOrderInput: null,
      layerOrderResetBtn: null,
      verticalAlignSelect: null,
      pendingUnloadedFontFamily: "",
      shadowRoot: null,
      shadowEnabledInput: null,
      shadowTargetInput: null,
      shadowTextTargetOption: null,
      shadowPresetInput: null,
      shadowRawInput: null,
      shadowOffsetXInput: null,
      shadowOffsetYInput: null,
      shadowBlurInput: null,
      shadowSpreadInput: null,
      shadowColorInput: null,
      shadowInsetInput: null,
      shadowModeUpdating: false,
      shadowValueUpdating: false,
      themeColorRows: {},
      themeCustomRows: {},
    },
  };

  const dom = {
    layoutRoot: document.getElementById("layoutRoot"),
    leftResizer: document.getElementById("leftResizer"),
    rightResizer: document.getElementById("rightResizer"),
    resizeOverlay: document.getElementById("resizeOverlay"),
    iframe: document.getElementById("liveFrame"),
    projectRootInput: document.getElementById("projectRootInput"),
    projectTypeSelect: document.getElementById("projectTypeSelect"),
    indexPathRow: document.getElementById("indexPathRow"),
    indexPathInput: document.getElementById("indexPathInput"),
    viteControlsRow: document.getElementById("viteControlsRow"),
    devUrlInput: document.getElementById("devUrlInput"),
    startDevServerBtn: document.getElementById("startDevServerBtn"),
    stopDevServerBtn: document.getElementById("stopDevServerBtn"),
    viteStatusText: document.getElementById("viteStatusText"),
    viteLogText: document.getElementById("viteLogText"),
    loadProjectBtn: document.getElementById("loadProjectBtn"),
    savePatchBtn: document.getElementById("savePatchBtn"),
    exportSafeBtn: document.getElementById("exportSafeBtn"),
    resetLayoutBtn: document.getElementById("resetLayoutBtn"),
    deleteElementBtn: document.getElementById("deleteElementBtn"),
    designLibrarySelect: document.getElementById("designLibrarySelect"),
    bootstrapJsCheckbox: document.getElementById("bootstrapJsCheckbox"),
    iconSetSelect: document.getElementById("iconSetSelect"),
    animateCssCheckbox: document.getElementById("animateCssCheckbox"),
    fontLibrarySelect: document.getElementById("fontLibrarySelect"),
    fontLibraryFamilyRow: document.getElementById("fontLibraryFamilyRow"),
    fontLibraryFamilyInput: document.getElementById("fontLibraryFamilyInput"),
    addFontFamilyBtn: document.getElementById("addFontFamilyBtn"),
    fontFamiliesList: document.getElementById("fontFamiliesList"),
    themePresetSelect: document.getElementById("themePresetSelect"),
    themeNameInput: document.getElementById("themeNameInput"),
    newThemePresetBtn: document.getElementById("newThemePresetBtn"),
    saveThemePresetBtn: document.getElementById("saveThemePresetBtn"),
    deleteThemePresetBtn: document.getElementById("deleteThemePresetBtn"),
    themePaletteList: document.getElementById("themePaletteList"),
    themeCustomPaletteList: document.getElementById("themeCustomPaletteList"),
    addCustomColorBtn: document.getElementById("addCustomColorBtn"),
    paletteColorSelect: document.getElementById("paletteColorSelect"),
    paletteBackgroundSelect: document.getElementById("paletteBackgroundSelect"),
    paletteBorderSelect: document.getElementById("paletteBorderSelect"),
    applyPaletteToSelectedBtn: document.getElementById("applyPaletteToSelectedBtn"),
    themeBodyFontSelect: document.getElementById("themeBodyFontSelect"),
    themeHeadingFontSelect: document.getElementById("themeHeadingFontSelect"),
    themeBodySizeInput: document.getElementById("themeBodySizeInput"),
    themeH1SizeInput: document.getElementById("themeH1SizeInput"),
    themeH2SizeInput: document.getElementById("themeH2SizeInput"),
    themeH3SizeInput: document.getElementById("themeH3SizeInput"),
    themeSmallSizeInput: document.getElementById("themeSmallSizeInput"),
    themeLineHeightInput: document.getElementById("themeLineHeightInput"),
    themeLoadFontsBtn: document.getElementById("themeLoadFontsBtn"),
    applyFontsGloballyBtn: document.getElementById("applyFontsGloballyBtn"),
    applyThemeToPageBtn: document.getElementById("applyThemeToPageBtn"),
    statusText: document.getElementById("statusText"),
    exportReport: document.getElementById("exportReport"),
    selectionInfo: document.getElementById("selectionInfo"),
    controlsContainer: document.getElementById("controlsContainer"),
    refreshTreeBtn: document.getElementById("refreshTreeBtn"),
    treeContainer: document.getElementById("treeContainer"),
    treeSearchInput: document.getElementById("treeSearchInput"),
    addBasicList: document.getElementById("addBasicList"),
    addExternalList: document.getElementById("addExternalList"),
    addExternalSection: document.getElementById("addExternalSection"),
    attrIdInput: document.getElementById("attrIdInput"),
    attrClassInput: document.getElementById("attrClassInput"),
    makeLinkRow: document.getElementById("makeLinkRow"),
    makeLinkCheckbox: document.getElementById("makeLinkCheckbox"),
    linkHrefInput: document.getElementById("linkHrefInput"),
    linkTargetInput: document.getElementById("linkTargetInput"),
    linkRelInput: document.getElementById("linkRelInput"),
    linkTitleInput: document.getElementById("linkTitleInput"),
    textSettingsSection: document.getElementById("textSettingsSection"),
    textContentInput: document.getElementById("textContentInput"),
    applyTextBtn: document.getElementById("applyTextBtn"),
    textComplexWarning: document.getElementById("textComplexWarning"),
    imageSettingsSection: document.getElementById("imageSettingsSection"),
    imageSrcInput: document.getElementById("imageSrcInput"),
    imageAltInput: document.getElementById("imageAltInput"),
    imageWidthInput: document.getElementById("imageWidthInput"),
    imageHeightInput: document.getElementById("imageHeightInput"),
    imageObjectFitInput: document.getElementById("imageObjectFitInput"),
    imageBorderRadiusInput: document.getElementById("imageBorderRadiusInput"),
    imageDisplayInput: document.getElementById("imageDisplayInput"),
    uploadImageBtn: document.getElementById("uploadImageBtn"),
    uploadImageInput: document.getElementById("uploadImageInput"),
  };

  init().catch((error) => {
    setStatus(`Init failed: ${error.message}`, true);
  });

  async function init() {
    setupTabs();
    initTreeUi();
    buildStyleControls();
    buildThemeManagerUi();
    setupTooltipSystem();
    clearSelectionUi();
    bindEvents();
    initResizableLayout();
    await loadProjectInfo();
    syncProjectTypeUi();
    await loadPatchInfo();
    syncLibraryControlsFromState();
    syncFontControlsFromState();
    syncThemeUiFromState();
    buildAddPanel();
    ensureViteStatusSocket();
    loadIframe();
    scheduleTooltipCoverageCheck();
  }

  function setupTooltipSystem() {
    applyStaticTooltipKeys();
    const manager = window.REL_TOOLTIP_MANAGER;
    if (manager && typeof manager.init === "function") {
      manager.init({
        registry: window.REL_TOOLTIPS_REGISTRY || {},
      });
    }
    scheduleTooltipCoverageCheck();
  }

  function applyStaticTooltipKeys() {
    const staticMappings = [
      [dom.projectRootInput, "top.projectRoot"],
      [dom.projectTypeSelect, "top.projectType"],
      [dom.indexPathInput, "top.indexPath"],
      [dom.devUrlInput, "top.devUrl"],
      [dom.startDevServerBtn, "top.startDevServer"],
      [dom.stopDevServerBtn, "top.stopDevServer"],
      [dom.loadProjectBtn, "top.loadProject"],
      [dom.savePatchBtn, "top.savePatch"],
      [dom.exportSafeBtn, "top.exportSafe"],
      [dom.resetLayoutBtn, "top.resetLayout"],
      [dom.designLibrarySelect, "top.designLibrary"],
      [dom.bootstrapJsCheckbox, "top.bootstrapJs"],
      [dom.iconSetSelect, "top.iconSet"],
      [dom.animateCssCheckbox, "top.animateCss"],
      [dom.fontLibrarySelect, "top.fontLibrary"],
      [dom.fontLibraryFamilyInput, "top.fontFamilyInput"],
      [dom.addFontFamilyBtn, "top.addFont"],
      [dom.treeSearchInput, "tree.search"],
      [dom.refreshTreeBtn, "tree.refresh"],
      [dom.attrIdInput, "inspector.attr.id"],
      [dom.attrClassInput, "inspector.attr.class"],
      [dom.deleteElementBtn, "inspector.delete"],
      [dom.makeLinkCheckbox, "link.toggle"],
      [dom.linkHrefInput, "link.href"],
      [dom.linkTargetInput, "link.target"],
      [dom.linkRelInput, "link.rel"],
      [dom.linkTitleInput, "link.title"],
      [dom.textContentInput, "text.content"],
      [dom.applyTextBtn, "text.apply"],
      [dom.imageSrcInput, "image.src"],
      [dom.imageAltInput, "image.alt"],
      [dom.imageWidthInput, "image.width"],
      [dom.imageHeightInput, "image.height"],
      [dom.imageObjectFitInput, "image.objectFit"],
      [dom.imageBorderRadiusInput, "image.borderRadius"],
      [dom.imageDisplayInput, "image.display"],
      [dom.uploadImageBtn, "image.upload"],
      [dom.themePresetSelect, "theme.preset"],
      [dom.themeNameInput, "theme.name"],
      [dom.newThemePresetBtn, "theme.new"],
      [dom.saveThemePresetBtn, "theme.save"],
      [dom.deleteThemePresetBtn, "theme.delete"],
      [dom.addCustomColorBtn, "theme.addCustomColor"],
      [dom.paletteColorSelect, "theme.palette.color"],
      [dom.paletteBackgroundSelect, "theme.palette.background"],
      [dom.paletteBorderSelect, "theme.palette.border"],
      [dom.applyPaletteToSelectedBtn, "theme.applyPaletteSelected"],
      [dom.themeBodyFontSelect, "theme.bodyFont"],
      [dom.themeHeadingFontSelect, "theme.headingFont"],
      [dom.themeBodySizeInput, "theme.bodySize"],
      [dom.themeH1SizeInput, "theme.h1Size"],
      [dom.themeH2SizeInput, "theme.h2Size"],
      [dom.themeH3SizeInput, "theme.h3Size"],
      [dom.themeSmallSizeInput, "theme.smallSize"],
      [dom.themeLineHeightInput, "theme.lineHeight"],
      [dom.themeLoadFontsBtn, "theme.loadFonts"],
      [dom.applyFontsGloballyBtn, "theme.applyFontsGlobally"],
      [dom.applyThemeToPageBtn, "theme.applyThemeToPage"],
      [dom.leftResizer, "layout.leftResizer"],
      [dom.rightResizer, "layout.rightResizer"],
    ];

    for (const [element, key] of staticMappings) {
      setTooltipKey(element, key);
    }
  }

  function setTooltipKey(element, key) {
    if (!(element instanceof Element)) {
      return;
    }
    const safeKey = String(key || "").trim();
    if (!safeKey) {
      return;
    }
    element.setAttribute("data-tooltip-key", safeKey);
  }

  function resolveStyleTooltipKey(property) {
    const safeProperty = String(property || "").trim().toLowerCase();
    if (!safeProperty) {
      return "generic.input";
    }
    if (safeProperty.startsWith("padding-")) {
      return "style.padding";
    }
    if (safeProperty.startsWith("margin-")) {
      return "style.margin";
    }
    if (safeProperty === "vertical-align-content") {
      return "style.verticalAlignContent";
    }
    return `style.${safeProperty}`;
  }

  function isTooltipDevMode() {
    const host = String(window.location.hostname || "").trim().toLowerCase();
    if (TOOLTIP_DEV_HOSTS.has(host)) {
      return true;
    }
    return host.endsWith(".local");
  }

  function scheduleTooltipCoverageCheck() {
    if (!isTooltipDevMode()) {
      return;
    }
    if (state.tooltip.devCheckTimer) {
      clearTimeout(state.tooltip.devCheckTimer);
    }
    state.tooltip.devCheckTimer = window.setTimeout(() => {
      state.tooltip.devCheckTimer = 0;
      runTooltipCoverageCheck();
    }, TOOLTIP_DEV_CHECK_DELAY_MS);
  }

  function runTooltipCoverageCheck() {
    const registry = window.REL_TOOLTIPS_REGISTRY || {};
    const selector = "button, input:not([type=\"hidden\"]), select, textarea, [role=\"button\"], .panel-resizer, .tree-node, .add-item";
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (isTooltipAllowlisted(node)) {
        continue;
      }
      const key = String(node.getAttribute("data-tooltip-key") || "").trim();
      if (!key) {
        const signature = describeTooltipNode(node);
        if (!state.tooltip.warnedMissing.has(signature)) {
          state.tooltip.warnedMissing.add(signature);
          console.warn(`[REL TOOLTIP] Missing data-tooltip-key for ${signature}`);
        }
        continue;
      }
      if (!hasTooltipRegistryEntry(key, registry)) {
        const signature = `${key}::${describeTooltipNode(node)}`;
        if (!state.tooltip.warnedUnknownKeys.has(signature)) {
          state.tooltip.warnedUnknownKeys.add(signature);
          console.warn(`[REL TOOLTIP] Missing tooltip registry entry for key "${key}" (${describeTooltipNode(node)})`);
        }
      }
    }
  }

  function isTooltipAllowlisted(node) {
    if (!(node instanceof HTMLElement)) {
      return true;
    }
    if (node.hidden || node.closest(".hidden")) {
      return true;
    }
    for (const selector of TOOLTIP_ALLOWLIST_SELECTORS) {
      if (selector && node.matches(selector)) {
        return true;
      }
    }
    return false;
  }

  function hasTooltipRegistryEntry(key, registry) {
    if (Object.prototype.hasOwnProperty.call(registry, key)) {
      return true;
    }
    if (key.startsWith("style.")) {
      return true;
    }
    if (key.startsWith("add.")) {
      return true;
    }
    if (key.startsWith("generic.")) {
      return true;
    }
    return false;
  }

  function describeTooltipNode(node) {
    const id = String(node.id || "").trim();
    if (id) {
      return `#${id}`;
    }
    const key = String(node.getAttribute("data-tooltip-key") || "").trim();
    if (key) {
      return `[data-tooltip-key="${key}"]`;
    }
    const text = String(node.textContent || "").trim().slice(0, 28);
    if (text) {
      return `${node.tagName.toLowerCase()}("${text}")`;
    }
    return node.tagName.toLowerCase();
  }

  function initTreeUi() {
    ensureTreeDragTooltip();
    ensureTreeContextMenu();
    if (state.treeUi.bound || !(dom.treeContainer instanceof Element)) {
      return;
    }
    state.treeUi.bound = true;

    dom.treeContainer.addEventListener("dragover", (event) => {
      if (!state.treeUi.dragging) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    dom.treeContainer.addEventListener("drop", (event) => {
      if (!state.treeUi.dragging) {
        return;
      }
      event.preventDefault();
      clearTreeDropIndicator();
      clearTreeDragState();
    });

    dom.treeContainer.addEventListener("dragleave", (event) => {
      if (!state.treeUi.dragging) {
        return;
      }
      const next = event.relatedTarget;
      if (next instanceof Element && dom.treeContainer.contains(next)) {
        return;
      }
      clearTreeDropIndicator();
      hideTreeDragTooltip();
    });

    dom.treeContainer.addEventListener("contextmenu", (event) => {
      const target = event.target;
      const item = resolveTreeItemFromContextTarget(target);
      if (!item) {
        hideTreeContextMenu();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openTreeContextMenu(item, event.clientX, event.clientY);
    });
  }

  function ensureTreeDragTooltip() {
    const container = dom.treeContainer;
    if (!(container instanceof Element)) {
      return;
    }
    const parent = container.parentElement;
    if (!(parent instanceof Element)) {
      return;
    }
    if (state.treeUi.dragTooltipEl && state.treeUi.dragTooltipEl.isConnected) {
      return;
    }
    const tooltip = document.createElement("div");
    tooltip.className = "tree-drop-tooltip hidden";
    tooltip.setAttribute("aria-hidden", "true");
    parent.appendChild(tooltip);
    state.treeUi.dragTooltipEl = tooltip;
  }

  function ensureTreeContextMenu() {
    if (state.treeContextMenu.root && state.treeContextMenu.root.isConnected) {
      return state.treeContextMenu.root;
    }

    const root = document.createElement("div");
    root.className = "tree-context-menu hidden";
    root.setAttribute("aria-hidden", "true");

    for (const item of TREE_CONTEXT_MENU_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tree-context-item";
      button.dataset.treeContextAction = item.action;
      button.textContent = item.label;
      setTooltipKey(button, item.tooltipKey);
      root.appendChild(button);
    }

    root.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest(".tree-context-item")
        : null;
      if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const action = String(button.dataset.treeContextAction || "").trim();
      const relId = String(state.treeContextMenu.targetRelId || "").trim();
      hideTreeContextMenu();
      applyTreeContextAction(action, relId);
    });

    document.body.appendChild(root);
    state.treeContextMenu.root = root;
    scheduleTooltipCoverageCheck();
    return root;
  }

  function resolveTreeItemFromContextTarget(target) {
    if (!(target instanceof Element)) {
      return null;
    }
    const row = target.closest(".tree-row");
    if (!(row instanceof HTMLElement)) {
      return null;
    }
    const relId = String(row.dataset.relId || "").trim();
    if (!relId) {
      return null;
    }
    return state.treeUi.nodeByRelId[relId] || null;
  }

  function openTreeContextMenu(item, clientX, clientY) {
    const safeItem = item && typeof item === "object" ? item : null;
    if (!safeItem || !safeItem.relId) {
      hideTreeContextMenu();
      return;
    }

    const root = ensureTreeContextMenu();
    const relId = String(safeItem.relId || "").trim();
    if (!relId) {
      hideTreeContextMenu();
      return;
    }

    state.treeContextMenu.targetRelId = relId;
    if (state.selectedRelId !== relId) {
      sendToOverlay({
        type: "REL_SELECT_BY_REL_ID",
        payload: { relId },
      });
    }
    markActiveTreeNode(relId);

    updateTreeContextMenuState(safeItem);

    root.classList.remove("hidden");
    root.setAttribute("aria-hidden", "false");
    state.treeContextMenu.visible = true;

    root.style.left = "0px";
    root.style.top = "0px";
    const menuRect = root.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
    const left = clamp(Number(clientX) + 8, 8, maxLeft);
    const top = clamp(Number(clientY) + 8, 8, maxTop);
    root.style.left = `${Math.round(left)}px`;
    root.style.top = `${Math.round(top)}px`;
    scheduleTooltipCoverageCheck();
  }

  function hideTreeContextMenu() {
    const root = state.treeContextMenu.root;
    const wasVisible = Boolean(state.treeContextMenu.visible);
    if (root instanceof HTMLElement) {
      root.classList.add("hidden");
      root.setAttribute("aria-hidden", "true");
    }
    state.treeContextMenu.visible = false;
    state.treeContextMenu.targetRelId = "";
    return wasVisible;
  }

  function updateTreeContextMenuState(item) {
    const root = state.treeContextMenu.root;
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const availability = getTreeContextActionAvailability(item);
    const buttons = root.querySelectorAll(".tree-context-item");
    for (const button of buttons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }
      const action = String(button.dataset.treeContextAction || "").trim();
      const info = availability[action] || { enabled: true, reason: "" };
      button.disabled = !info.enabled;
      const tooltipMeta = TREE_CONTEXT_MENU_ACTIONS.find((entry) => entry.action === action) || null;
      const baseTitle = tooltipMeta ? String((window.REL_TOOLTIPS_REGISTRY || {})[tooltipMeta.tooltipKey]?.description || "") : "";
      button.title = info.enabled || !info.reason
        ? baseTitle
        : `${baseTitle} Disabled: ${info.reason}`.trim();
    }
  }

  function getTreeContextActionAvailability(item) {
    const safeItem = item && typeof item === "object" ? item : null;
    if (!safeItem) {
      return {};
    }

    const blocked = Boolean(safeItem.isProtected || safeItem.isSystem);
    const siblingInfo = getTreeSiblingInfo(safeItem.relId);
    const hasPrev = siblingInfo.index > 0;
    const hasNext = siblingInfo.index >= 0 && siblingInfo.index < siblingInfo.relIds.length - 1;
    const canInsertAround = !blocked && Boolean(String(safeItem.parentRelId || "").trim());

    return {
      duplicate: blocked ? { enabled: false, reason: "Protected element" } : { enabled: true, reason: "" },
      delete: blocked ? { enabled: false, reason: "Protected element" } : { enabled: true, reason: "" },
      "move-before": hasPrev ? { enabled: true, reason: "" } : { enabled: false, reason: "Already first" },
      "move-after": hasNext ? { enabled: true, reason: "" } : { enabled: false, reason: "Already last" },
      "insert-container-above": canInsertAround
        ? { enabled: true, reason: "" }
        : { enabled: false, reason: "Cannot insert at this level" },
      "insert-section-below": canInsertAround
        ? { enabled: true, reason: "" }
        : { enabled: false, reason: "Cannot insert at this level" },
    };
  }

  function getTreeSiblingInfo(relId) {
    const safeRelId = String(relId || "").trim();
    const item = safeRelId ? (state.treeUi.nodeByRelId[safeRelId] || null) : null;
    if (!item) {
      return { relIds: [], index: -1 };
    }
    const parentRelId = String(item.parentRelId || "").trim();
    const relIds = state.lastTreeSnapshot
      .filter((entry) => {
        if (!entry || typeof entry !== "object") {
          return false;
        }
        if (entry.isSystem || entry.isProtected) {
          return false;
        }
        return String(entry.parentRelId || "").trim() === parentRelId;
      })
      .map((entry) => String(entry.relId || "").trim())
      .filter(Boolean);
    return {
      relIds,
      index: relIds.indexOf(safeRelId),
    };
  }

  function applyTreeContextAction(actionName, forcedRelId) {
    const action = String(actionName || "").trim().toLowerCase();
    const relId = String(forcedRelId || state.treeContextMenu.targetRelId || "").trim();
    if (!action || !relId) {
      return;
    }
    const item = state.treeUi.nodeByRelId[relId] || null;
    if (!item) {
      return;
    }

    const sourceSelector = String(state.selectorMap[relId] || state.elementsMap[relId] || "").trim();
    if (action === "duplicate" || action === "delete") {
      sendToOverlay({
        type: "REL_QUICK_ACTION",
        payload: {
          action: action === "duplicate" ? "duplicate" : "delete",
          relId,
          fallbackSelector: sourceSelector,
        },
      });
      return;
    }

    if (action === "move-before" || action === "move-after") {
      const siblingInfo = getTreeSiblingInfo(relId);
      const targetIndex = action === "move-before" ? siblingInfo.index - 1 : siblingInfo.index + 1;
      if (targetIndex < 0 || targetIndex >= siblingInfo.relIds.length) {
        return;
      }
      const targetRelId = siblingInfo.relIds[targetIndex];
      const targetSelector = String(state.selectorMap[targetRelId] || state.elementsMap[targetRelId] || "").trim();
      sendToOverlay({
        type: "REL_MOVE_NODE",
        payload: {
          sourceRelId: relId,
          targetRelId,
          sourceFallbackSelector: sourceSelector,
          targetFallbackSelector: targetSelector,
          placement: action === "move-before" ? "before" : "after",
        },
      });
      return;
    }

    if (action === "insert-container-above" || action === "insert-section-below") {
      const type = action === "insert-container-above" ? "container" : "section";
      const position = action === "insert-container-above" ? "before" : "after";
      sendToOverlay({
        type: "REL_ADD_NODE",
        payload: {
          node: {
            nodeId: generateId("node"),
            relId: generateId("rel-added"),
            type,
            position,
            parentRelId: String(item.parentRelId || "").trim(),
            targetRelId: relId,
            targetFallbackSelector: sourceSelector,
            props: type === "container" ? { text: "Container" } : {},
          },
        },
      });
    }
  }

  function showTreeDragTooltip(text, clientX, clientY) {
    const tooltip = state.treeUi.dragTooltipEl;
    if (!(tooltip instanceof HTMLElement)) {
      return;
    }

    const parent = tooltip.parentElement;
    if (!(parent instanceof HTMLElement)) {
      return;
    }

    const parentRect = parent.getBoundingClientRect();
    const x = Number(clientX) - parentRect.left + 10;
    const y = Number(clientY) - parentRect.top + 12;
    tooltip.textContent = String(text || "").trim();
    tooltip.style.left = `${Math.max(8, Math.round(x))}px`;
    tooltip.style.top = `${Math.max(8, Math.round(y))}px`;
    tooltip.classList.remove("hidden");
    tooltip.setAttribute("aria-hidden", "false");
  }

  function hideTreeDragTooltip() {
    const tooltip = state.treeUi.dragTooltipEl;
    if (!(tooltip instanceof HTMLElement)) {
      return;
    }
    tooltip.classList.add("hidden");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function bindEvents() {
    window.addEventListener("message", onMessageFromOverlay);
    window.addEventListener("keydown", onEditorKeyDown, true);
    document.addEventListener("pointerdown", onEditorPointerDown, true);
    window.addEventListener("beforeunload", () => {
      closeViteStatusSocket({ manual: true });
      clearViteStatusReconnectTimer();
    });

    dom.projectTypeSelect.addEventListener("change", () => {
      const nextType = normalizeProjectType(dom.projectTypeSelect.value);
      state.projectType = nextType;
      syncProjectTypeUi();
    });

    dom.startDevServerBtn.addEventListener("click", async () => {
      await startViteDevServer();
    });

    dom.stopDevServerBtn.addEventListener("click", async () => {
      await stopViteDevServer();
    });

    dom.loadProjectBtn.addEventListener("click", async () => {
      await applyProjectSelection();
    });

    dom.savePatchBtn.addEventListener("click", async () => {
      await savePatch();
    });

    dom.exportSafeBtn.addEventListener("click", async () => {
      await exportSafe();
    });

    dom.resetLayoutBtn.addEventListener("click", () => {
      resetLayoutWidths();
    });

    dom.deleteElementBtn.addEventListener("click", () => {
      requestDeleteSelected("button");
    });

    dom.refreshTreeBtn.addEventListener("click", requestTreeSnapshot);

    dom.treeSearchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      state.treeUi.query = query;
      renderTree(state.lastTreeSnapshot, query);
    });

    dom.iframe.addEventListener("load", () => {
      if (!state.overlayReady) {
        setStatus("Preview loaded");
      }
    });

    dom.attrIdInput.addEventListener("input", () => {
      applyAttributeEdit("id", dom.attrIdInput.value);
    });

    dom.attrClassInput.addEventListener("input", () => {
      applyAttributeEdit("class", dom.attrClassInput.value);
    });

    dom.makeLinkCheckbox.addEventListener("change", () => {
      applyLinkSettingsFromPanel();
    });
    dom.linkHrefInput.addEventListener("input", () => {
      applyLinkSettingsFromPanel();
    });
    dom.linkTargetInput.addEventListener("change", () => {
      applyLinkSettingsFromPanel();
    });
    dom.linkRelInput.addEventListener("input", () => {
      applyLinkSettingsFromPanel();
    });
    dom.linkTitleInput.addEventListener("input", () => {
      applyLinkSettingsFromPanel();
    });

    dom.applyTextBtn.addEventListener("click", () => {
      applyTextOverrideFromPanel();
    });

    dom.imageSrcInput.addEventListener("input", () => {
      applyAttributeEdit("src", dom.imageSrcInput.value);
    });
    dom.imageAltInput.addEventListener("input", () => {
      applyAttributeEdit("alt", dom.imageAltInput.value);
    });
    dom.imageWidthInput.addEventListener("input", () => {
      applyAttributeEdit("width", dom.imageWidthInput.value);
    });
    dom.imageHeightInput.addEventListener("input", () => {
      applyAttributeEdit("height", dom.imageHeightInput.value);
    });

    dom.imageObjectFitInput.addEventListener("change", () => {
      applyStyle("object-fit", dom.imageObjectFitInput.value);
    });
    dom.imageBorderRadiusInput.addEventListener("input", () => {
      applyStyle("border-radius", dom.imageBorderRadiusInput.value);
    });
    dom.imageDisplayInput.addEventListener("change", () => {
      applyStyle("display", dom.imageDisplayInput.value);
    });

    dom.uploadImageBtn.addEventListener("click", () => {
      dom.uploadImageInput.click();
    });
    dom.uploadImageInput.addEventListener("change", async () => {
      await uploadImageFromInput();
    });

    const onLibraryChange = () => {
      updateRuntimeLibrariesFromControls();
    };

    dom.designLibrarySelect.addEventListener("change", onLibraryChange);
    dom.bootstrapJsCheckbox.addEventListener("change", onLibraryChange);
    dom.iconSetSelect.addEventListener("change", onLibraryChange);
    dom.animateCssCheckbox.addEventListener("change", onLibraryChange);

    dom.fontLibrarySelect.addEventListener("change", () => {
      updateRuntimeFontsFromControls();
    });

    dom.addFontFamilyBtn.addEventListener("click", () => {
      addFontFamilyFromToolbar();
    });

    dom.fontLibraryFamilyInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      addFontFamilyFromToolbar();
    });

    dom.themePresetSelect.addEventListener("change", () => {
      selectThemePreset(dom.themePresetSelect.value);
    });
    dom.newThemePresetBtn.addEventListener("click", () => {
      createThemePresetFromUi();
    });
    dom.saveThemePresetBtn.addEventListener("click", () => {
      saveActiveThemePresetFromUi();
    });
    dom.deleteThemePresetBtn.addEventListener("click", () => {
      deleteActiveThemePreset();
    });
    dom.addCustomColorBtn.addEventListener("click", () => {
      addCustomThemeColor();
    });
    dom.applyPaletteToSelectedBtn.addEventListener("click", () => {
      applyPaletteToSelectedElement();
    });
    dom.themeLoadFontsBtn.addEventListener("click", () => {
      loadThemeFonts();
    });
    dom.applyFontsGloballyBtn.addEventListener("click", () => {
      applyThemeFontsGlobally();
    });
    dom.applyThemeToPageBtn.addEventListener("click", () => {
      applyThemeToPage();
    });

    for (const input of [
      dom.themeBodySizeInput,
      dom.themeH1SizeInput,
      dom.themeH2SizeInput,
      dom.themeH3SizeInput,
      dom.themeSmallSizeInput,
      dom.themeLineHeightInput,
    ]) {
      input.addEventListener("input", () => {
        updateThemeFontsFromUi();
      });
    }

    dom.themeBodyFontSelect.addEventListener("change", () => {
      updateThemeFontsFromUi();
    });
    dom.themeHeadingFontSelect.addEventListener("change", () => {
      updateThemeFontsFromUi();
    });
  }

  function onEditorKeyDown(event) {
    const key = event.key;
    if (key === "Escape") {
      const closed = hideTreeContextMenu();
      if (closed) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (key !== "Delete" && key !== "Backspace") {
      return;
    }

    if (!state.selectedRelId) {
      return;
    }

    if (document.activeElement === dom.iframe) {
      return;
    }

    if (isEditableElement(document.activeElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    requestDeleteSelected("keyboard");
  }

  function onEditorPointerDown(event) {
    if (!state.treeContextMenu.visible) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest(".tree-context-menu")) {
      return;
    }
    hideTreeContextMenu();
  }

  function requestDeleteSelected(source) {
    if (!state.selectedRelId) {
      return;
    }

    const selection = state.lastSelection || {};
    if (selection.canDelete === false) {
      setStatus("This element is protected and cannot be deleted", true);
      return;
    }

    const shouldDelete = window.confirm("Delete selected element?");
    if (!shouldDelete) {
      return;
    }

    sendToOverlay({
      type: "REL_DELETE_NODE",
      payload: {
        relId: state.selectedRelId,
        fallbackSelector:
          state.selectorMap[state.selectedRelId] ||
          state.elementsMap[state.selectedRelId] ||
          "",
        source,
      },
    });
  }
  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-btn"));
    const contents = Array.from(document.querySelectorAll("[data-tab-content]"));

    for (const btn of buttons) {
      const tabKey = String(btn.getAttribute("data-tab") || "").trim().toLowerCase();
      if (tabKey) {
        setTooltipKey(btn, `tab.${tabKey}`);
      }
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-tab");
        for (const b of buttons) {
          b.classList.toggle("active", b === btn);
        }
        for (const c of contents) {
          c.classList.toggle("active", c.getAttribute("data-tab-content") === key);
        }
        scheduleTooltipCoverageCheck();
      });
    }
  }

  function buildThemeManagerUi() {
    renderThemePaletteRows();
    renderThemePresetOptions();
    renderPaletteVarOptions();
    rebuildThemeFontPresetOptions();
    scheduleTooltipCoverageCheck();
  }

  function syncThemeUiFromState() {
    state.theme = normalizeThemeState(state.theme);
    renderThemePresetOptions();
    renderThemePaletteRows();
    renderPaletteVarOptions();
    rebuildThemeFontPresetOptions();

    const active = getActiveThemePreset();
    dom.themeNameInput.value = active.name;
    dom.themeBodySizeInput.value = active.fonts.bodySize;
    dom.themeH1SizeInput.value = active.fonts.h1Size;
    dom.themeH2SizeInput.value = active.fonts.h2Size;
    dom.themeH3SizeInput.value = active.fonts.h3Size;
    dom.themeSmallSizeInput.value = active.fonts.smallSize;
    dom.themeLineHeightInput.value = active.fonts.lineHeight;
    setThemeFontSelectValue(dom.themeBodyFontSelect, active.fonts.bodyFamily);
    setThemeFontSelectValue(dom.themeHeadingFontSelect, active.fonts.headingFamily);
  }

  function renderThemePresetOptions() {
    state.theme = normalizeThemeState(state.theme);
    dom.themePresetSelect.innerHTML = "";
    for (const themePreset of state.theme.themes) {
      const option = document.createElement("option");
      option.value = themePreset.id;
      option.textContent = themePreset.name;
      dom.themePresetSelect.appendChild(option);
    }
    dom.themePresetSelect.value = state.theme.activeThemeId;
  }

  function renderThemePaletteRows() {
    const active = getActiveThemePreset();
    dom.themePaletteList.innerHTML = "";
    dom.themeCustomPaletteList.innerHTML = "";
    state.controls.themeColorRows = {};
    state.controls.themeCustomRows = {};

    for (const colorDef of THEME_COLOR_DEFS) {
      const row = createThemeColorRow(colorDef.label, colorDef.key, active.colors[colorDef.key], false);
      dom.themePaletteList.appendChild(row.root);
      state.controls.themeColorRows[colorDef.key] = row;
    }

    const customEntries = Object.entries(active.customColors || {});
    if (customEntries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "theme-empty";
      empty.textContent = "No custom colors";
      dom.themeCustomPaletteList.appendChild(empty);
      scheduleTooltipCoverageCheck();
      return;
    }

    for (const [key, value] of customEntries) {
      const row = createThemeColorRow(key, key, value, true);
      dom.themeCustomPaletteList.appendChild(row.root);
      state.controls.themeCustomRows[key] = row;
    }
    scheduleTooltipCoverageCheck();
  }

  function createThemeColorRow(labelText, colorKey, colorValue, isCustom) {
    const root = document.createElement("div");
    root.className = "theme-color-row";

    const label = document.createElement("span");
    label.className = "theme-color-label";
    label.textContent = labelText;

    const swatch = document.createElement("span");
    swatch.className = "theme-swatch";

    const input = document.createElement("input");
    input.type = "text";
    input.value = colorValue;
    setTooltipKey(input, "theme.color.value");

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    setTooltipKey(copyBtn, "theme.color.copy");

    root.appendChild(label);
    root.appendChild(swatch);
    root.appendChild(input);
    root.appendChild(copyBtn);

    let removeBtn = null;
    if (isCustom) {
      removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      setTooltipKey(removeBtn, "theme.color.remove");
      root.appendChild(removeBtn);
      removeBtn.addEventListener("click", () => {
        deleteCustomThemeColor(colorKey);
      });
    }

    const refreshSwatch = () => {
      const normalized = normalizeHexColor(input.value, THEME_COLOR_DEFS.find((item) => item.key === colorKey)?.fallback || "#000000");
      swatch.style.backgroundColor = normalized;
    };

    refreshSwatch();
    input.addEventListener("input", () => {
      const active = getActiveThemePreset();
      const fallback = isCustom
        ? String(active.customColors?.[colorKey] || "#000000")
        : String(active.colors?.[colorKey] || THEME_COLOR_DEFS.find((item) => item.key === colorKey)?.fallback || "#000000");
      const value = normalizeHexColor(input.value, fallback);
      input.value = value;
      setThemeColorValue(colorKey, value, isCustom);
      refreshSwatch();
      renderPaletteVarOptions();
    });

    copyBtn.addEventListener("click", async () => {
      try {
        await copyText(input.value);
        setStatus(`Copied ${labelText} color`);
      } catch {
        setStatus("Copy failed", true);
      }
    });

    return { root, swatch, input, copyBtn, removeBtn };
  }

  function renderPaletteVarOptions() {
    const active = getActiveThemePreset();
    const availableKeys = [
      ...THEME_COLOR_DEFS.map((item) => item.key),
      ...Object.keys(active.customColors || {}),
    ];
    const optionSet = [{ value: "", label: "(none)" }];
    for (const key of availableKeys) {
      optionSet.push({
        value: key,
        label: `${key} -> ${resolveThemeVariableName(key)}`,
      });
    }

    applySelectOptions(dom.paletteColorSelect, optionSet);
    applySelectOptions(dom.paletteBackgroundSelect, optionSet);
    applySelectOptions(dom.paletteBorderSelect, optionSet);

    if (!dom.paletteColorSelect.value) {
      dom.paletteColorSelect.value = "text";
    }
    if (!dom.paletteBackgroundSelect.value) {
      dom.paletteBackgroundSelect.value = "surface";
    }
    if (!dom.paletteBorderSelect.value) {
      dom.paletteBorderSelect.value = "border";
    }
  }

  function applySelectOptions(select, options) {
    const previous = select.value;
    select.innerHTML = "";
    for (const item of options) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    }
    if (Array.from(select.options).some((item) => item.value === previous)) {
      select.value = previous;
    }
  }

  function rebuildThemeFontPresetOptions() {
    fillThemeFontSelect(dom.themeBodyFontSelect, dom.themeBodyFontSelect.value);
    fillThemeFontSelect(dom.themeHeadingFontSelect, dom.themeHeadingFontSelect.value);
  }

  function fillThemeFontSelect(select, value) {
    const currentValue = String(value || "");
    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "(empty)";
    select.appendChild(emptyOption);

    for (const choice of SYSTEM_FONT_CHOICES) {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      option.dataset.relFontFamily = choice.family;
      option.dataset.relFontSystem = "1";
      select.appendChild(option);
    }

    const providerLabel = FONT_PROVIDER_LABELS[state.runtimeFonts.provider] || FONT_PROVIDER_LABELS.none;
    for (const family of ensureFontFamilies(state.runtimeFonts.families)) {
      const option = document.createElement("option");
      option.value = buildThemeExternalFontFamilyValue(family);
      option.textContent = `${family} (${providerLabel})`;
      option.dataset.relFontFamily = family;
      option.dataset.relFontExternal = "1";
      select.appendChild(option);
    }

    setThemeFontSelectValue(select, currentValue);
  }

  function setThemeFontSelectValue(select, value) {
    const target = String(value || "");
    if (!target) {
      select.value = "";
      return;
    }

    if (Array.from(select.options).some((option) => option.value === target)) {
      select.value = target;
      return;
    }

    const primary = resolvePrimaryFontFamily(target);
    const byFamily = Array.from(select.options).find((option) => {
      return option.dataset.relFontFamily && option.dataset.relFontFamily.toLowerCase() === primary.toLowerCase();
    });
    if (byFamily) {
      select.value = byFamily.value;
      return;
    }

    const custom = document.createElement("option");
    custom.value = target;
    custom.textContent = `${primary || target} (current)`;
    custom.dataset.relFontFamily = primary || target;
    select.appendChild(custom);
    select.value = target;
  }

  function selectThemePreset(themeId) {
    const wanted = String(themeId || "").trim();
    if (!wanted) {
      return;
    }
    if (!state.theme.themes.some((item) => item.id === wanted)) {
      return;
    }
    state.theme.activeThemeId = wanted;
    syncThemeUiFromState();
    if (state.theme.applied) {
      applyThemeToOverlay();
    }
  }

  function createThemePresetFromUi() {
    const name = String(dom.themeNameInput.value || "").trim() || "New Theme";
    const source = getActiveThemePreset();
    const preset = cloneThemePreset(source);
    preset.id = generateId("theme");
    preset.name = name;
    state.theme.themes.push(preset);
    state.theme.activeThemeId = preset.id;
    syncThemeUiFromState();
    setStatus(`Theme created: ${name}`);
  }

  function saveActiveThemePresetFromUi() {
    const active = getActiveThemePreset();
    active.name = String(dom.themeNameInput.value || "").trim() || active.name;
    updateThemeFontsFromUi();
    renderThemePresetOptions();
    setStatus(`Theme saved: ${active.name}`);
  }

  function deleteActiveThemePreset() {
    if (state.theme.themes.length <= 1) {
      setStatus("At least one theme preset is required", true);
      return;
    }

    const currentId = state.theme.activeThemeId;
    state.theme.themes = state.theme.themes.filter((item) => item.id !== currentId);
    state.theme.activeThemeId = state.theme.themes[0].id;
    syncThemeUiFromState();
    if (state.theme.applied) {
      applyThemeToOverlay();
    }
    setStatus("Theme deleted");
  }

  function addCustomThemeColor() {
    const nameInput = window.prompt("Custom color name (example: brand-alt)");
    if (nameInput == null) {
      return;
    }

    const key = sanitizeCustomColorName(nameInput);
    if (!key) {
      setStatus("Invalid custom color name", true);
      return;
    }

    const active = getActiveThemePreset();
    if (!active.customColors) {
      active.customColors = {};
    }
    if (!active.customColors[key]) {
      active.customColors[key] = "#000000";
    }

    renderThemePaletteRows();
    renderPaletteVarOptions();
  }

  function deleteCustomThemeColor(key) {
    const active = getActiveThemePreset();
    if (!active.customColors || !Object.prototype.hasOwnProperty.call(active.customColors, key)) {
      return;
    }
    delete active.customColors[key];
    renderThemePaletteRows();
    renderPaletteVarOptions();
  }

  function setThemeColorValue(key, value, isCustom) {
    const active = getActiveThemePreset();
    if (isCustom) {
      if (!active.customColors) {
        active.customColors = {};
      }
      active.customColors[key] = normalizeHexColor(value, "#000000");
      return;
    }
    active.colors[key] = normalizeHexColor(value, THEME_COLOR_DEFS.find((item) => item.key === key)?.fallback || "#000000");
  }

  async function applyPaletteToSelectedElement() {
    if (!state.selectedRelId) {
      setStatus("Select an element first", true);
      return;
    }

    state.theme.applied = true;
    applyThemeToOverlay();

    const mapping = [
      { property: "color", key: dom.paletteColorSelect.value },
      { property: "background-color", key: dom.paletteBackgroundSelect.value },
      { property: "border-color", key: dom.paletteBorderSelect.value },
    ];

    for (const item of mapping) {
      if (!item.key) {
        continue;
      }
      applyStyle(item.property, `var(${resolveThemeVariableName(item.key)})`);
    }

    setStatus("Palette applied to selected element");
  }

  function updateThemeFontsFromUi() {
    const active = getActiveThemePreset();
    active.fonts = normalizeThemeFonts({
      bodyFamily: dom.themeBodyFontSelect.value || active.fonts.bodyFamily,
      headingFamily: dom.themeHeadingFontSelect.value || active.fonts.headingFamily,
      bodySize: dom.themeBodySizeInput.value || active.fonts.bodySize,
      h1Size: dom.themeH1SizeInput.value || active.fonts.h1Size,
      h2Size: dom.themeH2SizeInput.value || active.fonts.h2Size,
      h3Size: dom.themeH3SizeInput.value || active.fonts.h3Size,
      smallSize: dom.themeSmallSizeInput.value || active.fonts.smallSize,
      lineHeight: dom.themeLineHeightInput.value || active.fonts.lineHeight,
    });
  }

  function loadThemeFonts() {
    updateThemeFontsFromUi();
    const active = getActiveThemePreset();
    const families = new Set(ensureFontFamilies(state.runtimeFonts.families));
    const neededFamilies = [
      resolvePrimaryFontFamily(active.fonts.bodyFamily),
      resolvePrimaryFontFamily(active.fonts.headingFamily),
    ];

    let changed = false;
    for (const family of neededFamilies) {
      if (!family || KNOWN_SYSTEM_FAMILIES.has(family.toLowerCase())) {
        continue;
      }
      if (!families.has(family)) {
        families.add(family);
        changed = true;
      }
    }

    if (!changed && state.runtimeFonts.provider !== "none") {
      setStatus("Theme fonts already loaded");
      return;
    }
    if (!changed && state.runtimeFonts.provider === "none") {
      setStatus("No external fonts to load");
      return;
    }

    const provider = state.runtimeFonts.provider !== "none" ? state.runtimeFonts.provider : "google";
    state.runtimeFonts = normalizeRuntimeFonts({
      provider,
      families: Array.from(families),
    });
    syncFontControlsFromState();
    sendRuntimeFontsToOverlay();
    setStatus("Theme fonts loaded");
  }

  function applyThemeFontsGlobally() {
    loadThemeFonts();
    applyThemeToPage();
  }

  function applyThemeToPage() {
    updateThemeFontsFromUi();
    state.theme.applied = true;
    applyThemeToOverlay();
    setStatus("Theme applied to page");
  }

  function applyThemeToOverlay() {
    if (!state.overlayReady) {
      return;
    }
    sendToOverlay({
      type: "REL_SET_THEME",
      payload: {
        cssText: buildThemeCss(state.theme),
      },
    });
  }

  function buildThemeCss(themeState) {
    const normalized = normalizeThemeState(themeState);
    if (!normalized.applied) {
      return "";
    }
    const active = normalized.themes.find((item) => item.id === normalized.activeThemeId) || normalized.themes[0];
    if (!active) {
      return "";
    }

    const lines = [];
    lines.push(":root {");
    for (const def of THEME_COLOR_DEFS) {
      lines.push(`  ${def.varName}: ${active.colors[def.key]};`);
    }
    for (const [key, value] of Object.entries(active.customColors || {})) {
      lines.push(`  ${resolveThemeVariableName(key)}: ${value};`);
    }
    lines.push(`  --rel-font-body: ${active.fonts.bodyFamily};`);
    lines.push(`  --rel-font-heading: ${active.fonts.headingFamily};`);
    lines.push(`  --rel-font-size-body: ${active.fonts.bodySize};`);
    lines.push(`  --rel-font-size-h1: ${active.fonts.h1Size};`);
    lines.push(`  --rel-font-size-h2: ${active.fonts.h2Size};`);
    lines.push(`  --rel-font-size-h3: ${active.fonts.h3Size};`);
    lines.push(`  --rel-font-size-small: ${active.fonts.smallSize};`);
    lines.push(`  --rel-font-line-height: ${active.fonts.lineHeight};`);
    lines.push("}");
    lines.push("");
    lines.push("body {");
    lines.push("  font-family: var(--rel-font-body);");
    lines.push("  font-size: var(--rel-font-size-body);");
    lines.push("  line-height: var(--rel-font-line-height);");
    lines.push("  color: var(--rel-text);");
    lines.push("  background-color: var(--rel-bg);");
    lines.push("}");
    lines.push("");
    lines.push("h1, h2, h3 {");
    lines.push("  font-family: var(--rel-font-heading);");
    lines.push("  line-height: var(--rel-font-line-height);");
    lines.push("}");
    lines.push("");
    lines.push("h1 { font-size: var(--rel-font-size-h1); }");
    lines.push("h2 { font-size: var(--rel-font-size-h2); }");
    lines.push("h3 { font-size: var(--rel-font-size-h3); }");
    lines.push("small { font-size: var(--rel-font-size-small); }");

    return lines.join("\n");
  }

  function resolveThemeVariableName(key) {
    const mapped = THEME_COLOR_VAR_BY_KEY[key];
    if (mapped) {
      return mapped;
    }
    return `--rel-${sanitizeCustomColorName(key)}`;
  }

  async function copyText(value) {
    const text = String(value || "");
    if (!text) {
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  function sanitizeCustomColorName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function buildStyleControls() {
    dom.controlsContainer.innerHTML = "";
    state.controls.styleInputs = {};
    state.controls.fontFamilySelect = null;
    state.controls.fontFamilyWarning = null;
    state.controls.fontFamilyWarningText = null;
    state.controls.fontFamilyAutoLoadBtn = null;
    state.controls.pendingUnloadedFontFamily = "";
    state.controls.backgroundType = "solid";
    state.controls.backgroundSolidRow = null;
    state.controls.backgroundGradientRow = null;
    state.controls.backgroundSolidRadio = null;
    state.controls.backgroundGradientRadio = null;
    state.controls.backgroundImageRadio = null;
    state.controls.backgroundSolidInput = null;
    state.controls.backgroundGradientInput = null;
    state.controls.backgroundImageGroup = null;
    state.controls.backgroundImageToggle = null;
    state.controls.backgroundImageUploadBtn = null;
    state.controls.backgroundImageUploadInput = null;
    state.controls.backgroundImageUrlInput = null;
    state.controls.backgroundImageSizeInput = null;
    state.controls.backgroundImagePositionInput = null;
    state.controls.backgroundImageRepeatInput = null;
    state.controls.backgroundImageClearBtn = null;
    state.controls.backgroundPreview = null;
    state.controls.layerOrderInput = null;
    state.controls.layerOrderResetBtn = null;
    state.controls.verticalAlignSelect = null;
    state.controls.shadowRoot = null;
    state.controls.shadowEnabledInput = null;
    state.controls.shadowTargetInput = null;
    state.controls.shadowTextTargetOption = null;
    state.controls.shadowPresetInput = null;
    state.controls.shadowRawInput = null;
    state.controls.shadowOffsetXInput = null;
    state.controls.shadowOffsetYInput = null;
    state.controls.shadowBlurInput = null;
    state.controls.shadowSpreadInput = null;
    state.controls.shadowColorInput = null;
    state.controls.shadowInsetInput = null;
    state.controls.shadowModeUpdating = false;
    state.controls.shadowValueUpdating = false;

    for (const section of styleSectionsSchema) {
      const sectionRoot = document.createElement("section");
      sectionRoot.className = "control-group";
      sectionRoot.setAttribute("data-control-section", section.key);

      const title = document.createElement("h4");
      title.textContent = section.title;
      sectionRoot.appendChild(title);

      for (const control of section.controls) {
        if (control.type === "order") {
          buildLayerOrderControl(sectionRoot, control);
          continue;
        }
        if (control.type === "background") {
          buildBackgroundControl(sectionRoot);
          continue;
        }
        if (control.type === "font-family") {
          buildFontFamilyControl(sectionRoot, control);
          continue;
        }
        if (control.type === "vertical-align-content") {
          buildVerticalAlignControl(sectionRoot, control);
          continue;
        }
        if (control.type === "shadow") {
          buildShadowControl(sectionRoot);
          continue;
        }
        buildSimpleStyleControl(sectionRoot, control);
      }

      dom.controlsContainer.appendChild(sectionRoot);
    }

    rebuildFontFamilyOptions("");
    updateBackgroundControlVisibility();
    updateBackgroundPreview();
    if (state.controls.layerOrderInput) {
      state.controls.layerOrderInput.value = "0";
      state.controls.layerOrderInput.disabled = true;
    }
    if (state.controls.layerOrderResetBtn) {
      state.controls.layerOrderResetBtn.disabled = true;
    }
    if (state.controls.verticalAlignSelect) {
      state.controls.verticalAlignSelect.value = "";
      state.controls.verticalAlignSelect.disabled = true;
    }
    scheduleTooltipCoverageCheck();
  }

  function buildSimpleStyleControl(container, control) {
    const row = document.createElement("label");
    row.className = "control-item";
    row.setAttribute("data-property", control.property);

    const caption = document.createElement("span");
    caption.textContent = control.label;

    const input = createSimpleControlInput(control);
    setTooltipKey(input, resolveStyleTooltipKey(control.property));
    const eventName = control.type === "select" ? "change" : "input";
    input.addEventListener(eventName, () => {
      applyStyle(control.property, input.value);
    });

    row.appendChild(caption);
    row.appendChild(input);
    container.appendChild(row);
    state.controls.styleInputs[control.property] = input;
  }

  function buildLayerOrderControl(container, control) {
    const row = document.createElement("label");
    row.className = "control-item";
    row.setAttribute("data-property", "z-index");

    const caption = document.createElement("span");
    caption.textContent = control.label || "order";

    const actions = document.createElement("div");
    actions.className = "control-inline-actions";

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(LAYER_ORDER_MIN);
    input.max = String(LAYER_ORDER_MAX);
    input.step = "1";
    input.value = "0";
    input.addEventListener("input", () => {
      applyLayerOrderFromControl(input.value);
    });
    input.addEventListener("change", () => {
      applyLayerOrderFromControl(input.value);
    });
    setTooltipKey(input, "style.order");

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reset";
    setTooltipKey(resetBtn, "style.orderReset");
    resetBtn.addEventListener("click", () => {
      input.value = "0";
      applyLayerOrderFromControl("0");
    });

    actions.appendChild(input);
    actions.appendChild(resetBtn);
    row.appendChild(caption);
    row.appendChild(actions);
    container.appendChild(row);

    state.controls.layerOrderInput = input;
    state.controls.layerOrderResetBtn = resetBtn;
  }

  function createSimpleControlInput(control) {
    if (control.type === "select") {
      const select = document.createElement("select");
      for (const optionValue of control.options || []) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue || "(empty)";
        select.appendChild(option);
      }
      return select;
    }

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = control.placeholder || "";
    return input;
  }

  function buildFontFamilyControl(container, control) {
    const row = document.createElement("label");
    row.className = "control-item";
    row.setAttribute("data-property", control.property);

    const caption = document.createElement("span");
    caption.textContent = control.label;

    const select = document.createElement("select");
    setTooltipKey(select, "style.font-family");
    select.addEventListener("change", () => {
      applyStyle("font-family", select.value);
      updateFontLoadingWarning(resolvePrimaryFontFamily(select.value));
    });

    row.appendChild(caption);
    row.appendChild(select);
    container.appendChild(row);

    const warning = document.createElement("div");
    warning.className = "font-loading-warning hidden";
    const warningText = document.createElement("span");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Load Font";
    setTooltipKey(button, "style.fontLoadWarning");
    button.addEventListener("click", () => {
      autoLoadPendingFontFamily();
    });
    warning.appendChild(warningText);
    warning.appendChild(button);
    container.appendChild(warning);

    state.controls.fontFamilySelect = select;
    state.controls.fontFamilyWarning = warning;
    state.controls.fontFamilyWarningText = warningText;
    state.controls.fontFamilyAutoLoadBtn = button;
  }

  function buildVerticalAlignControl(container, control) {
    const row = document.createElement("label");
    row.className = "control-item";
    row.setAttribute("data-property", "vertical-align-content");

    const caption = document.createElement("span");
    caption.textContent = control.label;

    const select = document.createElement("select");
    setTooltipKey(select, "style.verticalAlignContent");
    const options = [
      { value: "", label: "(empty)" },
      { value: "top", label: "top" },
      { value: "center", label: "center" },
      { value: "bottom", label: "bottom" },
    ];
    for (const optionDef of options) {
      const option = document.createElement("option");
      option.value = optionDef.value;
      option.textContent = optionDef.label;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      applyVerticalAlignContent(select.value);
    });

    row.appendChild(caption);
    row.appendChild(select);
    container.appendChild(row);
    state.controls.verticalAlignSelect = select;
  }

  function buildBackgroundControl(container) {
    const row = document.createElement("div");
    row.className = "background-type-row";

    const caption = document.createElement("span");
    caption.textContent = "Background Type";
    row.appendChild(caption);

    const radioName = `background-type-${Math.random().toString(36).slice(2, 8)}`;

    const solidLabel = document.createElement("label");
    solidLabel.className = "radio-option";
    const solidRadio = document.createElement("input");
    solidRadio.type = "radio";
    solidRadio.name = radioName;
    solidRadio.value = "solid";
    solidRadio.checked = true;
    setTooltipKey(solidRadio, "style.backgroundModeSolid");
    const solidText = document.createElement("span");
    solidText.textContent = "Solid";
    solidLabel.appendChild(solidRadio);
    solidLabel.appendChild(solidText);

    const gradientLabel = document.createElement("label");
    gradientLabel.className = "radio-option";
    const gradientRadio = document.createElement("input");
    gradientRadio.type = "radio";
    gradientRadio.name = radioName;
    gradientRadio.value = "gradient";
    setTooltipKey(gradientRadio, "style.backgroundModeGradient");
    const gradientText = document.createElement("span");
    gradientText.textContent = "Gradient";
    gradientLabel.appendChild(gradientRadio);
    gradientLabel.appendChild(gradientText);

    const imageLabel = document.createElement("label");
    imageLabel.className = "radio-option";
    const imageRadio = document.createElement("input");
    imageRadio.type = "radio";
    imageRadio.name = radioName;
    imageRadio.value = "image";
    setTooltipKey(imageRadio, "style.backgroundModeImage");
    const imageText = document.createElement("span");
    imageText.textContent = "Image";
    imageLabel.appendChild(imageRadio);
    imageLabel.appendChild(imageText);

    row.appendChild(solidLabel);
    row.appendChild(gradientLabel);
    row.appendChild(imageLabel);
    container.appendChild(row);

    const solidRow = document.createElement("label");
    solidRow.className = "control-item";
    solidRow.setAttribute("data-property", "background-color");
    const solidCaption = document.createElement("span");
    solidCaption.textContent = "Solid Color";
    const solidInput = document.createElement("input");
    solidInput.type = "color";
    solidInput.value = "#ffffff";
    setTooltipKey(solidInput, "style.backgroundSolid");
    solidInput.addEventListener("input", () => {
      if (state.controls.backgroundType !== "solid") {
        setBackgroundType("solid", true);
      }
      applyBackgroundFromControls();
    });
    solidRow.appendChild(solidCaption);
    solidRow.appendChild(solidInput);
    container.appendChild(solidRow);

    const gradientRow = document.createElement("label");
    gradientRow.className = "control-item";
    gradientRow.setAttribute("data-property", "background");
    const gradientCaption = document.createElement("span");
    gradientCaption.textContent = "Gradient CSS";
    const gradientInput = document.createElement("textarea");
    gradientInput.placeholder = "linear-gradient(0deg, #df1111, #000000)";
    setTooltipKey(gradientInput, "style.backgroundGradient");
    gradientInput.addEventListener("input", () => {
      if (state.controls.backgroundType !== "gradient") {
        setBackgroundType("gradient", true);
      }
      applyBackgroundFromControls();
    });
    gradientRow.appendChild(gradientCaption);
    gradientRow.appendChild(gradientInput);
    container.appendChild(gradientRow);

    const imageGroup = document.createElement("div");
    imageGroup.className = "background-image-group hidden";

    const imageToggleRow = document.createElement("label");
    imageToggleRow.className = "check-row";
    const imageToggle = document.createElement("input");
    imageToggle.type = "checkbox";
    setTooltipKey(imageToggle, "style.backgroundImageToggle");
    const imageToggleText = document.createElement("span");
    imageToggleText.textContent = "Use background image";
    imageToggleRow.appendChild(imageToggle);
    imageToggleRow.appendChild(imageToggleText);
    imageGroup.appendChild(imageToggleRow);

    const imageUploadRow = document.createElement("div");
    imageUploadRow.className = "upload-row";
    const imageUploadBtn = document.createElement("button");
    imageUploadBtn.type = "button";
    imageUploadBtn.textContent = "Choose Image";
    setTooltipKey(imageUploadBtn, "style.backgroundImageUpload");
    const imageUploadInput = document.createElement("input");
    imageUploadInput.type = "file";
    imageUploadInput.accept = "image/*";
    imageUploadInput.hidden = true;
    setTooltipKey(imageUploadInput, "style.backgroundImageUpload");
    imageUploadRow.appendChild(imageUploadBtn);
    imageUploadRow.appendChild(imageUploadInput);
    imageGroup.appendChild(imageUploadRow);

    const imageUrlRow = document.createElement("label");
    imageUrlRow.className = "control-item";
    imageUrlRow.setAttribute("data-property", "background-image");
    const imageUrlCaption = document.createElement("span");
    imageUrlCaption.textContent = "Image URL";
    const imageUrlInput = document.createElement("input");
    imageUrlInput.type = "text";
    imageUrlInput.placeholder = "REL_assets/background.png or https://...";
    setTooltipKey(imageUrlInput, "style.backgroundImageUrl");
    imageUrlRow.appendChild(imageUrlCaption);
    imageUrlRow.appendChild(imageUrlInput);
    imageGroup.appendChild(imageUrlRow);

    const imageSizeRow = document.createElement("label");
    imageSizeRow.className = "control-item";
    imageSizeRow.setAttribute("data-property", "background-size");
    const imageSizeCaption = document.createElement("span");
    imageSizeCaption.textContent = "background-size";
    const imageSizeInput = document.createElement("select");
    setTooltipKey(imageSizeInput, "style.backgroundSize");
    for (const optionValue of BG_SIZE_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      imageSizeInput.appendChild(option);
    }
    imageSizeRow.appendChild(imageSizeCaption);
    imageSizeRow.appendChild(imageSizeInput);
    imageGroup.appendChild(imageSizeRow);

    const imagePositionRow = document.createElement("label");
    imagePositionRow.className = "control-item";
    imagePositionRow.setAttribute("data-property", "background-position");
    const imagePositionCaption = document.createElement("span");
    imagePositionCaption.textContent = "background-position";
    const imagePositionInput = document.createElement("select");
    setTooltipKey(imagePositionInput, "style.backgroundPosition");
    for (const optionValue of BG_POSITION_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      imagePositionInput.appendChild(option);
    }
    imagePositionRow.appendChild(imagePositionCaption);
    imagePositionRow.appendChild(imagePositionInput);
    imageGroup.appendChild(imagePositionRow);

    const imageRepeatRow = document.createElement("label");
    imageRepeatRow.className = "control-item";
    imageRepeatRow.setAttribute("data-property", "background-repeat");
    const imageRepeatCaption = document.createElement("span");
    imageRepeatCaption.textContent = "background-repeat";
    const imageRepeatInput = document.createElement("select");
    setTooltipKey(imageRepeatInput, "style.backgroundRepeat");
    for (const optionValue of BG_REPEAT_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      imageRepeatInput.appendChild(option);
    }
    imageRepeatRow.appendChild(imageRepeatCaption);
    imageRepeatRow.appendChild(imageRepeatInput);
    imageGroup.appendChild(imageRepeatRow);

    const imageActionsRow = document.createElement("div");
    imageActionsRow.className = "background-image-actions";
    const clearImageBtn = document.createElement("button");
    clearImageBtn.type = "button";
    clearImageBtn.textContent = "Clear image";
    setTooltipKey(clearImageBtn, "style.backgroundClearImage");
    imageActionsRow.appendChild(clearImageBtn);
    imageGroup.appendChild(imageActionsRow);

    container.appendChild(imageGroup);

    const preview = document.createElement("div");
    preview.className = "background-preview";
    container.appendChild(preview);

    solidRadio.addEventListener("change", () => {
      if (!solidRadio.checked) {
        return;
      }
      setBackgroundType("solid", true);
      applyBackgroundFromControls();
    });

    gradientRadio.addEventListener("change", () => {
      if (!gradientRadio.checked) {
        return;
      }
      setBackgroundType("gradient", true);
      applyBackgroundFromControls();
    });

    imageRadio.addEventListener("change", () => {
      if (!imageRadio.checked) {
        return;
      }
      setBackgroundType("image", true);
      applyBackgroundFromControls();
    });

    imageToggle.addEventListener("change", () => {
      if (state.controls.backgroundType !== "image") {
        setBackgroundType("image", true);
      }
      applyBackgroundFromControls();
    });

    imageUploadBtn.addEventListener("click", () => {
      imageUploadInput.click();
    });
    imageUploadInput.addEventListener("change", async () => {
      await uploadBackgroundImageFromInput();
    });

    imageUrlInput.addEventListener("input", () => {
      if (state.controls.backgroundType !== "image") {
        setBackgroundType("image", true);
      }
      applyBackgroundFromControls();
    });

    imageSizeInput.addEventListener("change", () => {
      if (state.controls.backgroundType !== "image") {
        setBackgroundType("image", true);
      }
      applyBackgroundFromControls();
    });

    imagePositionInput.addEventListener("change", () => {
      if (state.controls.backgroundType !== "image") {
        setBackgroundType("image", true);
      }
      applyBackgroundFromControls();
    });

    imageRepeatInput.addEventListener("change", () => {
      if (state.controls.backgroundType !== "image") {
        setBackgroundType("image", true);
      }
      applyBackgroundFromControls();
    });

    clearImageBtn.addEventListener("click", () => {
      clearBackgroundImageFromControls();
    });

    state.controls.backgroundSolidRow = solidRow;
    state.controls.backgroundGradientRow = gradientRow;
    state.controls.backgroundSolidRadio = solidRadio;
    state.controls.backgroundGradientRadio = gradientRadio;
    state.controls.backgroundImageRadio = imageRadio;
    state.controls.backgroundSolidInput = solidInput;
    state.controls.backgroundGradientInput = gradientInput;
    state.controls.backgroundImageGroup = imageGroup;
    state.controls.backgroundImageToggle = imageToggle;
    state.controls.backgroundImageUploadBtn = imageUploadBtn;
    state.controls.backgroundImageUploadInput = imageUploadInput;
    state.controls.backgroundImageUrlInput = imageUrlInput;
    state.controls.backgroundImageSizeInput = imageSizeInput;
    state.controls.backgroundImagePositionInput = imagePositionInput;
    state.controls.backgroundImageRepeatInput = imageRepeatInput;
    state.controls.backgroundImageClearBtn = clearImageBtn;
    state.controls.backgroundPreview = preview;
  }

  function setBackgroundType(type, force) {
    const nextType = normalizeBackgroundMode(type);
    if (!force && state.controls.backgroundType === nextType) {
      return;
    }
    state.controls.backgroundType = nextType;
    if (state.selectedRelId) {
      state.controls.backgroundModeByRelId[state.selectedRelId] = nextType;
    }
    updateBackgroundControlVisibility();
    updateBackgroundPreview();
  }

  function updateBackgroundControlVisibility() {
    const isGradient = state.controls.backgroundType === "gradient";
    const isImage = state.controls.backgroundType === "image";
    if (state.controls.backgroundSolidRow) {
      state.controls.backgroundSolidRow.classList.toggle("hidden", isGradient || isImage);
    }
    if (state.controls.backgroundGradientRow) {
      state.controls.backgroundGradientRow.classList.toggle("hidden", !isGradient);
    }
    if (state.controls.backgroundImageGroup) {
      state.controls.backgroundImageGroup.classList.toggle("hidden", !isImage);
    }
    if (state.controls.backgroundSolidRadio) {
      state.controls.backgroundSolidRadio.checked = !isGradient && !isImage;
    }
    if (state.controls.backgroundGradientRadio) {
      state.controls.backgroundGradientRadio.checked = isGradient;
    }
    if (state.controls.backgroundImageRadio) {
      state.controls.backgroundImageRadio.checked = isImage;
    }
    const imageControlsDisabled = !isImage || !Boolean(state.controls.backgroundImageToggle?.checked);
    if (state.controls.backgroundImageUploadBtn) {
      state.controls.backgroundImageUploadBtn.disabled = !isImage;
    }
    if (state.controls.backgroundImageUrlInput) {
      state.controls.backgroundImageUrlInput.disabled = imageControlsDisabled;
    }
    if (state.controls.backgroundImageSizeInput) {
      state.controls.backgroundImageSizeInput.disabled = imageControlsDisabled;
    }
    if (state.controls.backgroundImagePositionInput) {
      state.controls.backgroundImagePositionInput.disabled = imageControlsDisabled;
    }
    if (state.controls.backgroundImageRepeatInput) {
      state.controls.backgroundImageRepeatInput.disabled = imageControlsDisabled;
    }
    if (state.controls.backgroundImageClearBtn) {
      state.controls.backgroundImageClearBtn.disabled = !isImage;
    }
  }

  function applyBackgroundFromControls() {
    if (!state.selectedRelId) {
      updateBackgroundPreview();
      return;
    }

    const relId = String(state.selectedRelId || "").trim();
    if (!relId) {
      updateBackgroundPreview();
      return;
    }

    const draft = readBackgroundDraftFromControls();
    writeBackgroundDraftMeta(relId, draft);

    if (state.controls.backgroundType === "gradient") {
      applyStyleForRelId(relId, "background-image", "");
      applyStyleForRelId(relId, "background-size", "");
      applyStyleForRelId(relId, "background-position", "");
      applyStyleForRelId(relId, "background-repeat", "");
      applyStyleForRelId(relId, "background", draft.gradient);
    } else if (state.controls.backgroundType === "image") {
      applyStyleForRelId(relId, "background", "");
      applyStyleForRelId(relId, "background-color", "");
      if (draft.imageEnabled && draft.imageUrl) {
        applyStyleForRelId(relId, "background-image", buildCssBackgroundImageUrl(draft.imageUrl));
        applyStyleForRelId(relId, "background-size", draft.imageSize);
        applyStyleForRelId(relId, "background-position", draft.imagePosition);
        applyStyleForRelId(relId, "background-repeat", draft.imageRepeat);
      } else {
        applyStyleForRelId(relId, "background-image", "");
        applyStyleForRelId(relId, "background-size", "");
        applyStyleForRelId(relId, "background-position", "");
        applyStyleForRelId(relId, "background-repeat", "");
      }
    } else {
      // Solid mode must explicitly clear shorthand/image leftovers so color is always visible.
      applyStyleForRelId(relId, "background", "");
      applyStyleForRelId(relId, "background-color", draft.solid);
      applyStyleForRelId(relId, "background-image", "none");
      applyStyleForRelId(relId, "background-size", "");
      applyStyleForRelId(relId, "background-position", "");
      applyStyleForRelId(relId, "background-repeat", "");
    }
    updateBackgroundPreview();
  }

  function updateBackgroundPreview() {
    const preview = state.controls.backgroundPreview;
    if (!preview) {
      return;
    }

    preview.style.background = "";
    preview.style.backgroundColor = "";
    preview.style.backgroundImage = "";
    preview.style.backgroundSize = "";
    preview.style.backgroundPosition = "";
    preview.style.backgroundRepeat = "";

    if (state.controls.backgroundType === "gradient") {
      const gradientValue = String(state.controls.backgroundGradientInput?.value || "").trim();
      if (gradientValue) {
        preview.style.background = gradientValue;
      }
      return;
    }

    if (state.controls.backgroundType === "image") {
      const enabled = Boolean(state.controls.backgroundImageToggle?.checked);
      const rawImageUrl = String(state.controls.backgroundImageUrlInput?.value || "").trim();
      const imageUrl = normalizeBackgroundImageUrl(rawImageUrl);
      if (enabled && imageUrl) {
        preview.style.backgroundImage = buildCssBackgroundImageUrl(imageUrl);
        preview.style.backgroundSize = normalizeEnumValue(state.controls.backgroundImageSizeInput?.value, BG_SIZE_OPTIONS, "cover");
        preview.style.backgroundPosition = normalizeEnumValue(state.controls.backgroundImagePositionInput?.value, BG_POSITION_OPTIONS, "center");
        preview.style.backgroundRepeat = normalizeEnumValue(state.controls.backgroundImageRepeatInput?.value, BG_REPEAT_OPTIONS, "no-repeat");
      }
      return;
    }

    const colorValue = String(state.controls.backgroundSolidInput?.value || "").trim();
    if (colorValue) {
      preview.style.backgroundColor = colorValue;
    }
  }

  async function uploadBackgroundImageFromInput() {
    const fileInput = state.controls.backgroundImageUploadInput;
    const file = fileInput?.files && fileInput.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload-background-image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    fileInput.value = "";

    if (!response.ok || !data.ok) {
      setStatus(data.error || "Background image upload failed", true);
      return;
    }

    if (state.controls.backgroundImageUrlInput) {
      state.controls.backgroundImageUrlInput.value = String(data.css_url || "").trim();
    }
    if (state.controls.backgroundImageToggle) {
      state.controls.backgroundImageToggle.checked = true;
    }
    if (state.controls.backgroundType !== "image") {
      setBackgroundType("image", true);
    }
    applyBackgroundFromControls();
    setStatus(`Background image uploaded: ${data.file_name}`);
  }

  function clearBackgroundImageFromControls() {
    if (state.controls.backgroundImageToggle) {
      state.controls.backgroundImageToggle.checked = false;
    }
    if (state.controls.backgroundImageUrlInput) {
      state.controls.backgroundImageUrlInput.value = "";
    }
    if (state.controls.backgroundType !== "image") {
      setBackgroundType("image", true);
    }
    applyBackgroundFromControls();
    setStatus("Background image cleared");
  }

  function applyVerticalAlignContent(mode) {
    if (!state.selectedRelId) {
      return;
    }

    const selectedMode = String(mode || "").trim().toLowerCase();
    const alignItemsValue = mapVerticalAlignModeToAlignItems(selectedMode);
    if (!alignItemsValue) {
      applyStyle("align-items", "");
      return;
    }

    const relId = state.selectedRelId;
    const overrides = state.overridesMeta[relId] || {};
    const computed = (state.lastSelection && state.lastSelection.computed) || {};
    const effectiveDisplay = getEffectiveDisplayForVerticalAlign(overrides, computed);

    if (isFlexOrGridDisplay(effectiveDisplay)) {
      applyStyle("align-items", alignItemsValue);
      return;
    }

    if (!canPromoteToFlexForVerticalAlign(state.lastSelection || {})) {
      setStatus("Vertical align requires a simple text element or existing flex/grid container", true);
      updateVerticalAlignControlForSelection(state.lastSelection || {}, computed, overrides);
      return;
    }

    const nextDisplay = /^inline/i.test(effectiveDisplay) ? "inline-flex" : "flex";
    applyStyle("display", nextDisplay);
    applyStyle("align-items", alignItemsValue);
  }

  function updateVerticalAlignControlForSelection(selection, computed, overrides) {
    const select = state.controls.verticalAlignSelect;
    if (!select) {
      return;
    }

    const safeComputed = computed && typeof computed === "object" ? computed : {};
    const safeOverrides = overrides && typeof overrides === "object" ? overrides : {};
    const effectiveDisplay = getEffectiveDisplayForVerticalAlign(safeOverrides, safeComputed);
    const canUse = isFlexOrGridDisplay(effectiveDisplay) || canPromoteToFlexForVerticalAlign(selection || {});
    select.disabled = !canUse;
    select.value = resolveVerticalAlignControlValue(safeOverrides, safeComputed);
  }

  function getEffectiveDisplayForVerticalAlign(overrides, computed) {
    return String(overrides.display ?? computed.display ?? "").trim().toLowerCase();
  }

  function isFlexOrGridDisplay(displayValue) {
    const normalized = String(displayValue || "").trim().toLowerCase();
    return ["flex", "inline-flex", "grid", "inline-grid"].includes(normalized);
  }

  function canPromoteToFlexForVerticalAlign(selection) {
    const tag = String(selection?.tagName || "").toLowerCase();
    if (!tag) {
      return false;
    }
    if (["button", "a", "input", "label", "p", "li", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
      return true;
    }
    if (["div", "span"].includes(tag)) {
      return Boolean(selection?.textInfo?.canEdit);
    }
    return false;
  }

  function mapVerticalAlignModeToAlignItems(mode) {
    if (mode === "top") {
      return "flex-start";
    }
    if (mode === "center") {
      return "center";
    }
    if (mode === "bottom") {
      return "flex-end";
    }
    return "";
  }

  function resolveVerticalAlignControlValue(overrides, computed) {
    const raw = String(overrides["align-items"] ?? computed["align-items"] ?? "").trim().toLowerCase();
    if (raw === "flex-start") {
      return "top";
    }
    if (raw === "center") {
      return "center";
    }
    if (raw === "flex-end") {
      return "bottom";
    }
    return "";
  }

  function buildShadowControl(container) {
    const root = document.createElement("div");
    root.className = "shadow-controls";

    const enableRow = document.createElement("label");
    enableRow.className = "check-row";
    const enableInput = document.createElement("input");
    enableInput.type = "checkbox";
    setTooltipKey(enableInput, "style.shadow.enable");
    const enableText = document.createElement("span");
    enableText.textContent = "Enable shadow";
    enableRow.appendChild(enableInput);
    enableRow.appendChild(enableText);
    root.appendChild(enableRow);

    const targetRow = document.createElement("label");
    targetRow.className = "control-item";
    const targetLabel = document.createElement("span");
    targetLabel.textContent = "Target";
    const targetSelect = document.createElement("select");
    setTooltipKey(targetSelect, "style.shadow.target");
    const boxOption = document.createElement("option");
    boxOption.value = "box";
    boxOption.textContent = "Box shadow";
    const textOption = document.createElement("option");
    textOption.value = "text";
    textOption.textContent = "Text shadow";
    targetSelect.appendChild(boxOption);
    targetSelect.appendChild(textOption);
    targetRow.appendChild(targetLabel);
    targetRow.appendChild(targetSelect);
    root.appendChild(targetRow);

    const presetRow = document.createElement("label");
    presetRow.className = "control-item";
    const presetLabel = document.createElement("span");
    presetLabel.textContent = "Preset";
    const presetSelect = document.createElement("select");
    setTooltipKey(presetSelect, "style.shadow.preset");
    const presetOptions = [
      { value: "none", label: "None" },
      { value: "soft", label: "Soft" },
      { value: "medium", label: "Medium" },
      { value: "strong", label: "Strong" },
      { value: "inner", label: "Inner" },
      { value: "custom", label: "Custom" },
    ];
    for (const item of presetOptions) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      presetSelect.appendChild(option);
    }
    presetRow.appendChild(presetLabel);
    presetRow.appendChild(presetSelect);
    root.appendChild(presetRow);

    const rawRow = document.createElement("label");
    rawRow.className = "control-item";
    const rawLabel = document.createElement("span");
    rawLabel.textContent = "Shadow String";
    const rawInput = document.createElement("input");
    rawInput.type = "text";
    rawInput.placeholder = "0px 6px 18px 0px rgba(0,0,0,0.2)";
    setTooltipKey(rawInput, "style.shadow.raw");
    rawRow.appendChild(rawLabel);
    rawRow.appendChild(rawInput);
    root.appendChild(rawRow);

    const advancedGrid = document.createElement("div");
    advancedGrid.className = "shadow-advanced-grid";
    const advancedControls = [
      { key: "offsetX", label: "offset-x", placeholder: "0px" },
      { key: "offsetY", label: "offset-y", placeholder: "6px" },
      { key: "blur", label: "blur", placeholder: "18px" },
      { key: "spread", label: "spread", placeholder: "0px" },
      { key: "color", label: "color", placeholder: "rgba(0, 0, 0, 0.2)" },
    ];
    const advancedInputs = {};
    for (const item of advancedControls) {
      const row = document.createElement("label");
      row.className = "control-item";
      const label = document.createElement("span");
      label.textContent = item.label;
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = item.placeholder;
      setTooltipKey(input, `style.shadow.${item.key}`);
      row.appendChild(label);
      row.appendChild(input);
      advancedGrid.appendChild(row);
      advancedInputs[item.key] = input;
    }
    root.appendChild(advancedGrid);

    const insetRow = document.createElement("label");
    insetRow.className = "check-row";
    const insetInput = document.createElement("input");
    insetInput.type = "checkbox";
    setTooltipKey(insetInput, "style.shadow.inset");
    const insetText = document.createElement("span");
    insetText.textContent = "Inset";
    insetRow.appendChild(insetInput);
    insetRow.appendChild(insetText);
    root.appendChild(insetRow);

    enableInput.addEventListener("change", () => {
      if (state.controls.shadowModeUpdating) {
        return;
      }
      updateShadowControlsDisabledState();
      applyShadowFromControls();
    });

    targetSelect.addEventListener("change", () => {
      if (state.controls.shadowModeUpdating) {
        return;
      }
      updateShadowControlsDisabledState();
      applyShadowFromControls();
    });

    presetSelect.addEventListener("change", () => {
      if (state.controls.shadowModeUpdating) {
        return;
      }
      applyShadowPresetFromSelect();
    });

    rawInput.addEventListener("input", () => {
      if (state.controls.shadowModeUpdating) {
        return;
      }
      const parsed = parseShadowValue(rawInput.value, targetSelect.value);
      state.controls.shadowValueUpdating = true;
      hydrateShadowAdvancedInputs(parsed, targetSelect.value);
      state.controls.shadowValueUpdating = false;
      presetSelect.value = detectShadowPreset(rawInput.value, targetSelect.value);
      applyShadowFromControls();
    });

    for (const input of Object.values(advancedInputs)) {
      input.addEventListener("input", () => {
        if (state.controls.shadowModeUpdating) {
          return;
        }
        if (state.controls.shadowValueUpdating) {
          return;
        }
        updateShadowRawFromAdvanced();
      });
    }

    insetInput.addEventListener("change", () => {
      if (state.controls.shadowModeUpdating) {
        return;
      }
      if (state.controls.shadowValueUpdating) {
        return;
      }
      updateShadowRawFromAdvanced();
    });

    container.appendChild(root);

    state.controls.shadowRoot = root;
    state.controls.shadowEnabledInput = enableInput;
    state.controls.shadowTargetInput = targetSelect;
    state.controls.shadowTextTargetOption = textOption;
    state.controls.shadowPresetInput = presetSelect;
    state.controls.shadowRawInput = rawInput;
    state.controls.shadowOffsetXInput = advancedInputs.offsetX;
    state.controls.shadowOffsetYInput = advancedInputs.offsetY;
    state.controls.shadowBlurInput = advancedInputs.blur;
    state.controls.shadowSpreadInput = advancedInputs.spread;
    state.controls.shadowColorInput = advancedInputs.color;
    state.controls.shadowInsetInput = insetInput;
    updateShadowControlsDisabledState();
  }

  function applyShadowPresetFromSelect() {
    const preset = state.controls.shadowPresetInput?.value || "none";
    if (preset === "custom") {
      return;
    }
    const target = state.controls.shadowTargetInput?.value === "text" ? "text" : "box";
    const value = preset === "none" ? "none" : SHADOW_PRESETS[preset] || "none";
    state.controls.shadowModeUpdating = true;
    state.controls.shadowRawInput.value = value === "none" ? "" : value;
    hydrateShadowAdvancedInputs(parseShadowValue(value, target), target);
    state.controls.shadowModeUpdating = false;
    applyShadowFromControls();
  }

  function updateShadowRawFromAdvanced() {
    const target = state.controls.shadowTargetInput?.value === "text" ? "text" : "box";
    const value = composeShadowFromAdvanced(target);
    state.controls.shadowModeUpdating = true;
    state.controls.shadowRawInput.value = value === "none" ? "" : value;
    state.controls.shadowPresetInput.value = detectShadowPreset(value, target);
    state.controls.shadowModeUpdating = false;
    applyShadowFromControls();
  }

  function composeShadowFromAdvanced(target) {
    const x = String(state.controls.shadowOffsetXInput?.value || "0px").trim() || "0px";
    const y = String(state.controls.shadowOffsetYInput?.value || "0px").trim() || "0px";
    const blur = String(state.controls.shadowBlurInput?.value || "0px").trim() || "0px";
    const spread = String(state.controls.shadowSpreadInput?.value || "0px").trim() || "0px";
    const color = normalizeRgbaAlphaInCssValue(
      String(state.controls.shadowColorInput?.value || "rgba(0, 0, 0, 0.2)").trim() || "rgba(0, 0, 0, 0.2)"
    );
    const inset = Boolean(state.controls.shadowInsetInput?.checked);
    if (target === "text") {
      return `${x} ${y} ${blur} ${color}`;
    }
    return `${inset ? "inset " : ""}${x} ${y} ${blur} ${spread} ${color}`.trim();
  }

  function applyShadowFromControls() {
    if (!state.selectedRelId) {
      return;
    }

    const target = state.controls.shadowTargetInput?.value === "text" ? "text" : "box";
    const enabled = Boolean(state.controls.shadowEnabledInput?.checked);
    const rawValue = String(state.controls.shadowRawInput?.value || "").trim();
    const value = enabled ? (rawValue || composeShadowFromAdvanced(target)) : "none";

    if (target === "text") {
      applyStyle("box-shadow", "");
      applyStyle("text-shadow", value);
      return;
    }
    applyStyle("text-shadow", "");
    applyStyle("box-shadow", value);
  }

  function updateShadowControlValues(computed, overrides, selection, options) {
    if (!state.controls.shadowRoot) {
      return;
    }

    const selectionChanged = Boolean(options && options.selectionChanged);
    const isTextLike = isTextLikeSelection(selection);

    const overrideBox = String(overrides["box-shadow"] ?? "").trim();
    const overrideText = String(overrides["text-shadow"] ?? "").trim();
    const computedBox = String(computed["box-shadow"] ?? "").trim();
    const computedText = String(computed["text-shadow"] ?? "").trim();

    const effectiveBox = overrideBox || computedBox || "none";
    const effectiveText = overrideText || computedText || "none";

    let target = state.controls.shadowTargetInput?.value === "text" ? "text" : "box";
    if (selectionChanged) {
      if (isShadowEnabled(effectiveText) && !isShadowEnabled(effectiveBox)) {
        target = "text";
      } else {
        target = "box";
      }
    }
    if (!isTextLike && target === "text") {
      target = "box";
    }

    const effectiveValue = target === "text" ? effectiveText : effectiveBox;
    const enabled = isShadowEnabled(effectiveValue);
    const parsed = parseShadowValue(effectiveValue, target);

    state.controls.shadowModeUpdating = true;
    state.controls.shadowTextTargetOption.hidden = !isTextLike;
    state.controls.shadowTargetInput.value = target;
    state.controls.shadowEnabledInput.checked = enabled;
    state.controls.shadowRawInput.value = enabled && effectiveValue !== "none" ? effectiveValue : "";
    hydrateShadowAdvancedInputs(parsed, target);
    state.controls.shadowPresetInput.value = detectShadowPreset(effectiveValue, target);
    updateShadowControlsDisabledState();
    state.controls.shadowModeUpdating = false;
  }

  function hydrateShadowAdvancedInputs(parsed, target) {
    const value = parsed || parseShadowValue("", target);
    state.controls.shadowOffsetXInput.value = value.offsetX;
    state.controls.shadowOffsetYInput.value = value.offsetY;
    state.controls.shadowBlurInput.value = value.blur;
    state.controls.shadowSpreadInput.value = target === "box" ? value.spread : "";
    state.controls.shadowColorInput.value = value.color;
    state.controls.shadowInsetInput.checked = target === "box" ? Boolean(value.inset) : false;
  }

  function updateShadowControlsDisabledState() {
    const enabled = Boolean(state.controls.shadowEnabledInput?.checked);
    const target = state.controls.shadowTargetInput?.value === "text" ? "text" : "box";
    const disableAll = !enabled;
    const disableSpread = disableAll || target === "text";
    const disableInset = disableAll || target === "text";

    for (const input of [
      state.controls.shadowTargetInput,
      state.controls.shadowPresetInput,
      state.controls.shadowRawInput,
      state.controls.shadowOffsetXInput,
      state.controls.shadowOffsetYInput,
      state.controls.shadowBlurInput,
      state.controls.shadowColorInput,
    ]) {
      if (input) {
        input.disabled = disableAll;
      }
    }
    if (state.controls.shadowSpreadInput) {
      state.controls.shadowSpreadInput.disabled = disableSpread;
    }
    if (state.controls.shadowInsetInput) {
      state.controls.shadowInsetInput.disabled = disableInset;
    }
  }

  function isShadowEnabled(value) {
    const normalized = normalizeShadowString(value);
    return normalized && normalized !== "none";
  }

  function detectShadowPreset(value, target) {
    if (!isShadowEnabled(value)) {
      return "none";
    }
    const normalized = normalizeShadowString(value);
    for (const [preset, presetValue] of Object.entries(SHADOW_PRESETS)) {
      if (preset === "none") {
        continue;
      }
      if (target === "text" && preset === "inner") {
        continue;
      }
      if (normalizeShadowString(presetValue) === normalized) {
        return preset;
      }
    }
    return "custom";
  }

  function normalizeShadowString(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function parseShadowValue(input, target) {
    const raw = String(input || "").trim();
    const fallback = {
      parsed: false,
      inset: false,
      offsetX: "0px",
      offsetY: "0px",
      blur: "0px",
      spread: "0px",
      color: "rgba(0, 0, 0, 0.2)",
    };
    if (!raw || normalizeShadowString(raw) === "none") {
      return { ...fallback, parsed: true };
    }

    let text = raw;
    let inset = false;
    if (target === "box" && /^inset\b/i.test(text)) {
      inset = true;
      text = text.replace(/^inset\s+/i, "");
    }

    const colorMatch = text.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8})$/);
    const color = normalizeRgbaAlphaInCssValue(colorMatch ? colorMatch[1] : fallback.color);
    const geometry = colorMatch ? text.slice(0, colorMatch.index).trim() : text;
    const tokens = geometry.split(/\s+/).filter(Boolean);

    if (target === "text") {
      if (tokens.length < 3) {
        return { ...fallback, color, inset: false };
      }
      return {
        parsed: true,
        inset: false,
        offsetX: tokens[0],
        offsetY: tokens[1],
        blur: tokens[2],
        spread: "0px",
        color,
      };
    }

    if (tokens.length < 3) {
      return { ...fallback, color, inset };
    }

    return {
      parsed: true,
      inset,
      offsetX: tokens[0],
      offsetY: tokens[1],
      blur: tokens[2],
      spread: tokens[3] || "0px",
      color,
    };
  }

  function isTextLikeSelection(selection) {
    const tag = String(selection?.tagName || "").toLowerCase();
    return ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "a", "small", "strong", "em", "label", "li"].includes(tag);
  }

  function rebuildFontFamilyOptions(currentValue) {
    const select = state.controls.fontFamilySelect;
    if (!select) {
      return;
    }

    const currentPrimaryFamily = resolvePrimaryFontFamily(currentValue);
    const previousPrimaryFamily = resolvePrimaryFontFamily(select.value);
    const preferredPrimary = currentPrimaryFamily || previousPrimaryFamily;
    const providerLabel = FONT_PROVIDER_LABELS[state.runtimeFonts.provider] || FONT_PROVIDER_LABELS.none;

    select.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "(empty)";
    select.appendChild(emptyOption);

    for (const choice of SYSTEM_FONT_CHOICES) {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      option.dataset.relFontFamily = choice.family;
      option.dataset.relFontSystem = "1";
      select.appendChild(option);
    }

    const runtimeFamilies = ensureFontFamilies(state.runtimeFonts.families);
    for (const family of runtimeFamilies) {
      const option = document.createElement("option");
      option.value = buildExternalFontFamilyValue(family);
      option.textContent = `${family} (${providerLabel})`;
      option.dataset.relFontFamily = family;
      option.dataset.relFontExternal = "1";
      select.appendChild(option);
    }

    if (preferredPrimary) {
      const matching = Array.from(select.options).find((option) => {
        return option.dataset.relFontFamily && option.dataset.relFontFamily.toLowerCase() === preferredPrimary.toLowerCase();
      });

      if (matching) {
        select.value = matching.value;
      } else if (currentValue) {
        const customOption = document.createElement("option");
        customOption.value = currentValue;
        customOption.textContent = `${preferredPrimary} (current)`;
        customOption.dataset.relFontFamily = preferredPrimary;
        customOption.dataset.relFontExternal = "1";
        customOption.dataset.relFontMissing = "1";
        select.appendChild(customOption);
        select.value = customOption.value;
      } else {
        select.value = "";
      }
    } else {
      select.value = currentValue || "";
    }

    updateFontLoadingWarning(resolvePrimaryFontFamily(select.value));
  }

  function updateFontLoadingWarning(primaryFamily) {
    const warning = state.controls.fontFamilyWarning;
    const warningText = state.controls.fontFamilyWarningText;
    const warningButton = state.controls.fontFamilyAutoLoadBtn;
    if (!warning || !warningText || !warningButton) {
      return;
    }

    const family = String(primaryFamily || "").trim();
    if (!family || KNOWN_SYSTEM_FAMILIES.has(family.toLowerCase()) || isLoadedRuntimeFontFamily(family)) {
      warning.classList.add("hidden");
      state.controls.pendingUnloadedFontFamily = "";
      return;
    }

    const provider = state.runtimeFonts.provider !== "none" ? state.runtimeFonts.provider : "google";
    warningText.textContent = `Font "${family}" is not loaded.`;
    warningButton.textContent = `Load via ${FONT_PROVIDER_LABELS[provider] || provider}`;
    warning.classList.remove("hidden");
    state.controls.pendingUnloadedFontFamily = family;
  }

  function buildAddPanel() {
    renderComponentList(dom.addBasicList, basicComponents, false);
    dom.addExternalList.innerHTML = "";

    const externalComponents = [];
    const designLibrary = state.runtimeLibraries.designLibrary;
    if (designLibrary === "bootstrap") {
      externalComponents.push(...bootstrapComponents);
    }
    if (designLibrary === "bulma") {
      externalComponents.push(...bulmaComponents);
    }
    if (designLibrary === "pico") {
      externalComponents.push(...picoComponents);
    }

    dom.addExternalSection.classList.toggle("hidden", externalComponents.length === 0);
    if (externalComponents.length > 0) {
      renderComponentList(dom.addExternalList, externalComponents, true);
    }
  }

  function renderComponentList(container, components, markExternal) {
    container.innerHTML = "";
    for (const component of components) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "add-item";
      item.draggable = true;
      item.setAttribute("data-component-type", component.type);
      setTooltipKey(item, markExternal ? "add.external" : `add.${component.type}`);

      const name = document.createElement("div");
      name.className = "add-item-name";
      name.textContent = component.name;

      if (markExternal) {
        const badge = document.createElement("span");
        badge.className = "add-badge";
        badge.textContent = "CDN";
        name.appendChild(badge);
      }

      const desc = document.createElement("div");
      desc.className = "add-item-desc";
      desc.textContent = component.description;

      item.appendChild(name);
      item.appendChild(desc);

      item.addEventListener("dragstart", (event) => {
        const nodeTemplate = createNodeTemplate(component);
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", component.type);
        sendToOverlay({
          type: "REL_SET_DRAG_COMPONENT",
          payload: { nodeTemplate },
        });
        setStatus(`Dragging ${component.name} into preview`);
      });

      item.addEventListener("dragend", () => {
        sendToOverlay({ type: "REL_CLEAR_DRAG_COMPONENT" });
      });

      container.appendChild(item);
    }
    scheduleTooltipCoverageCheck();
  }

  function createNodeTemplate(component) {
    return {
      nodeId: generateId("node"),
      relId: generateId("rel-added"),
      type: component.type,
      position: "append",
      props: component.props || {},
    };
  }

  async function loadProjectInfo() {
    const response = await fetch("/api/project");
    if (!response.ok) {
      setStatus("Failed to load project info", true);
      return;
    }

    const data = await response.json();
    state.projectRoot = data.project_root;
    state.projectType = normalizeProjectType(data.project_type);
    state.indexPath = data.index_path;
    state.devUrl = normalizeDevUrl(data.dev_url);
    state.viteStatus = normalizeViteStatus(data.vite_status_stream || data.vite_status, state.devUrl);
    state.defaultsLibraries = normalizeRuntimeLibraries(data.defaults_libraries || {});
    state.runtimeLibraries = { ...state.defaultsLibraries };
    state.defaultsFonts = normalizeRuntimeFonts(data.defaults_fonts || {});
    state.runtimeFonts = { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.defaultsTheme = createDefaultThemeState();
    state.theme = createDefaultThemeState();
    state.selectorMap = {};
    state.attributeOverrides = {};
    state.textOverrides = {};
    dom.projectRootInput.value = data.project_root;
    dom.projectTypeSelect.value = state.projectType;
    dom.indexPathInput.value = data.index_path;
    dom.devUrlInput.value = state.devUrl;
    clearExportReport();
    renderViteStatus();
    ensureViteStatusSocket();
    setStatus(`Loaded project: ${data.project_root}`);
  }

  async function applyProjectSelection() {
    const requestedType = normalizeProjectType(dom.projectTypeSelect.value);
    const payload = {
      project_root: dom.projectRootInput.value,
      project_type: requestedType,
      index_path: dom.indexPathInput.value,
      dev_url: dom.devUrlInput.value,
    };

    const response = await fetch("/api/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.error || "Failed to set project", true);
      return;
    }

    state.projectRoot = data.project_root;
    state.projectType = normalizeProjectType(data.project_type);
    state.indexPath = data.index_path;
    state.devUrl = normalizeDevUrl(data.dev_url);
    state.viteStatus = normalizeViteStatus(data.vite_status_stream || data.vite_status, state.devUrl);
    state.defaultsLibraries = normalizeRuntimeLibraries(data.defaults_libraries || {});
    state.runtimeLibraries = { ...state.defaultsLibraries };
    state.defaultsFonts = normalizeRuntimeFonts(data.defaults_fonts || {});
    state.runtimeFonts = { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.defaultsTheme = createDefaultThemeState();
    state.theme = createDefaultThemeState();
    state.selectedRelId = null;
    state.elementsMap = {};
    state.selectorMap = {};
    state.attributeOverrides = {};
    state.textOverrides = {};
    state.overridesMeta = {};
    state.attributesMeta = {};
    state.linksMeta = {};
    state.addedNodes = [];
    state.deletedNodes = [];
    state.movedNodes = [];
    state.lastSelection = null;
    state.lastTreeSnapshot = [];
    state.overlayReady = false;
    state.controls.backgroundModeByRelId = {};
    state.treeUi.collapsedByRelId = {};
    state.treeUi.parentByRelId = {};
    state.treeUi.nodeByRelId = {};
    state.treeUi.query = "";
    hideTreeContextMenu();
    clearTreeDropIndicator();
    clearTreeDragState();

    dom.projectRootInput.value = state.projectRoot;
    dom.indexPathInput.value = state.indexPath;
    dom.projectTypeSelect.value = state.projectType;
    dom.devUrlInput.value = state.devUrl;
    syncProjectTypeUi();
    clearExportReport();
    renderViteStatus();
    ensureViteStatusSocket();
    await loadPatchInfo();
    syncLibraryControlsFromState();
    syncFontControlsFromState();
    syncThemeUiFromState();
    buildAddPanel();
    clearSelectionUi();
    loadIframe();
    setStatus(`Project loaded: ${data.project_root}`);
  }

  function loadIframe() {
    state.overlayReady = false;
    if (state.projectType === PROJECT_TYPE_VITE_REACT_STYLE) {
      logVite(`Loading iframe from /vite-proxy/ (dev_url=${state.devUrl})`);
      setStatus("Loading Vite preview...");
      dom.iframe.src = "/vite-proxy/";
      return;
    }

    setStatus("Loading preview...");
    const url = `/project/${encodePath(state.indexPath)}`;
    dom.iframe.src = url;
  }

  function syncProjectTypeUi() {
    const isVite = state.projectType === PROJECT_TYPE_VITE_REACT_STYLE;
    dom.projectTypeSelect.value = state.projectType;
    dom.indexPathRow.classList.toggle("hidden", isVite);
    dom.viteControlsRow.classList.toggle("hidden", !isVite);
    dom.indexPathInput.disabled = isVite;
    dom.devUrlInput.disabled = !isVite;
    renderViteStatus();
    if (!isVite) {
      clearExportReport();
    }
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
      return parsed.origin;
    } catch {
      return DEFAULT_VITE_DEV_URL;
    }
  }

  function normalizeViteStatus(value, fallbackUrl) {
    const raw = value && typeof value === "object" ? value : {};
    const streamState = String(raw.state || "").trim().toLowerCase();
    const hasStreamState = ["stopped", "starting", "running", "error"].includes(streamState);
    const devUrl = normalizeDevUrl(
      raw.url || raw.dev_url || raw.devUrl || fallbackUrl || DEFAULT_VITE_DEV_URL
    );
    const parsedPort = Number(raw.port);
    const preferredPort = Number(raw.preferred_port || raw.preferredPort);
    const pid = Number(raw.pid);
    const logLines = Array.isArray(raw.log_lines)
      ? raw.log_lines.map((line) => String(line || "").trim()).filter(Boolean)
      : (Array.isArray(raw.logLines) ? raw.logLines.map((line) => String(line || "").trim()).filter(Boolean) : []);

    let running = Boolean(raw.running);
    let installing = Boolean(raw.installing);
    let starting = Boolean(raw.starting);
    let phase = String(raw.phase || "").trim().toLowerCase() || "stopped";
    let lastError = String(raw.last_error || raw.lastError || "").trim();
    if (hasStreamState) {
      running = streamState === "running";
      installing = false;
      starting = streamState === "starting";
      if (streamState === "error") {
        phase = "failed";
        lastError = String(raw.message || raw.last_error || raw.lastError || "").trim();
      } else {
        phase = streamState;
        if (streamState !== "stopped") {
          lastError = "";
        }
      }
    }

    return {
      running,
      installing,
      starting,
      phase,
      port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : null,
      preferredPort: Number.isFinite(preferredPort) && preferredPort > 0 ? preferredPort : null,
      portAutoSelected: Boolean(
        Object.prototype.hasOwnProperty.call(raw, "port_auto_selected")
          ? raw.port_auto_selected
          : raw.portAutoSelected
      ),
      pid: Number.isFinite(pid) && pid > 0 ? pid : null,
      lastError,
      logLines,
      projectRoot: String(raw.project_root || raw.projectRoot || state.projectRoot || "").trim(),
      devUrl,
    };
  }

  function renderViteStatus() {
    if (!dom.viteStatusText) {
      return;
    }
    const isVite = state.projectType === PROJECT_TYPE_VITE_REACT_STYLE;
    const status = normalizeViteStatus(state.viteStatus, state.devUrl);
    state.viteStatus = status;
    dom.viteStatusText.classList.remove("running", "error");

    if (!isVite) {
      dom.viteStatusText.textContent = "Vite: not active";
      dom.startDevServerBtn.disabled = true;
      dom.stopDevServerBtn.disabled = true;
      renderViteLog([]);
      return;
    }

    if (status.installing || status.phase === "installing") {
      dom.viteStatusText.textContent = "Vite: installing dependencies...";
    } else if (status.starting || status.phase === "starting") {
      dom.viteStatusText.textContent = "Vite: starting...";
    } else if (status.running) {
      const portText = status.port ? ` on port ${status.port}` : "";
      const autoPortText = status.portAutoSelected ? " (auto port)" : "";
      const pidText = status.pid ? ` pid ${status.pid}` : "";
      dom.viteStatusText.textContent = `Vite: running${portText}${autoPortText}${pidText}`;
      dom.viteStatusText.classList.add("running");
    } else if (status.lastError) {
      dom.viteStatusText.textContent = "Vite: error";
      dom.viteStatusText.classList.add("error");
    } else {
      dom.viteStatusText.textContent = "Vite: stopped";
    }

    dom.startDevServerBtn.disabled = status.running || status.installing || status.starting;
    dom.stopDevServerBtn.disabled = !status.running && !status.installing && !status.starting;
    renderViteLog(status.logLines, status.lastError);
  }

  function renderViteLog(lines, lastError) {
    if (!dom.viteLogText) {
      return;
    }
    const isVite = state.projectType === PROJECT_TYPE_VITE_REACT_STYLE;
    if (!isVite) {
      dom.viteLogText.classList.add("hidden");
      dom.viteLogText.textContent = "";
      return;
    }

    const safeLines = Array.isArray(lines)
      ? lines.map((line) => String(line || "").trim()).filter(Boolean)
      : [];

    if (safeLines.length === 0) {
      const fallbackError = String(lastError || "").trim();
      dom.viteLogText.textContent = fallbackError || "No Vite logs yet.";
      dom.viteLogText.classList.remove("hidden");
      return;
    }

    dom.viteLogText.textContent = safeLines.slice(-16).join("\n");
    dom.viteLogText.classList.remove("hidden");
  }

  function resolveViteStatusSocketUrl() {
    const wsUrl = new URL(window.location.href);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
    wsUrl.pathname = "/ws";
    wsUrl.search = "";
    wsUrl.hash = "";
    return wsUrl.toString();
  }

  function clearViteStatusReconnectTimer() {
    if (!state.viteStatusReconnectTimer) {
      return;
    }
    clearTimeout(state.viteStatusReconnectTimer);
    state.viteStatusReconnectTimer = null;
  }

  function closeViteStatusSocket(options) {
    const opts = options && typeof options === "object" ? options : {};
    state.viteStatusManualClose = Boolean(opts.manual);
    const socket = state.viteStatusSocket;
    if (!socket) {
      return;
    }
    try {
      socket.close();
    } catch {
      // Ignore close errors.
    }
  }

  function scheduleViteStatusSocketReconnect() {
    clearViteStatusReconnectTimer();
    const attempt = state.viteStatusReconnectAttempt;
    const delayIndex = Math.min(attempt, VITE_STATUS_WS_RETRY_STEPS_MS.length - 1);
    const delayMs = VITE_STATUS_WS_RETRY_STEPS_MS[delayIndex] || 10000;
    state.viteStatusReconnectAttempt = attempt + 1;
    state.viteStatusReconnectTimer = window.setTimeout(() => {
      state.viteStatusReconnectTimer = null;
      ensureViteStatusSocket();
    }, delayMs);
  }

  function handleViteStatusSocketMessage(rawData) {
    let parsed = null;
    try {
      parsed = JSON.parse(String(rawData || ""));
    } catch {
      return;
    }
    if (!parsed || parsed.type !== "viteStatus" || !parsed.payload || typeof parsed.payload !== "object") {
      return;
    }

    const nextStatus = normalizeViteStatus(parsed.payload, state.devUrl);
    const prevRunning = Boolean(state.viteStatus && state.viteStatus.running);
    const nextRunning = Boolean(nextStatus.running);
    state.viteStatus = nextStatus;
    if (nextStatus.devUrl && nextStatus.devUrl !== state.devUrl) {
      state.devUrl = nextStatus.devUrl;
      dom.devUrlInput.value = state.devUrl;
    }
    renderViteStatus();
    if (nextRunning && !prevRunning) {
      setStatus(`Vite dev server running: ${state.devUrl}`);
    }
    if (!nextRunning && prevRunning) {
      setStatus(nextStatus.lastError || "Vite dev server stopped", Boolean(nextStatus.lastError));
    }
  }

  function ensureViteStatusSocket(options) {
    const opts = options && typeof options === "object" ? options : {};
    if (!window.WebSocket) {
      return;
    }

    const targetUrl = resolveViteStatusSocketUrl();
    const currentSocket = state.viteStatusSocket;
    const currentIsActive = Boolean(
      currentSocket
      && [window.WebSocket.OPEN, window.WebSocket.CONNECTING].includes(currentSocket.readyState)
    );
    if (!opts.forceReconnect && currentIsActive && state.viteStatusSocketUrl === targetUrl) {
      return;
    }

    clearViteStatusReconnectTimer();
    if (currentSocket) {
      closeViteStatusSocket({ manual: true });
    }

    const socket = new window.WebSocket(targetUrl);
    state.viteStatusSocket = socket;
    state.viteStatusSocketUrl = targetUrl;
    state.viteStatusManualClose = false;

    socket.addEventListener("open", () => {
      if (state.viteStatusSocket !== socket) {
        return;
      }
      state.viteStatusReconnectAttempt = 0;
      state.viteStatusConnectionLost = false;
    });

    socket.addEventListener("message", (event) => {
      if (state.viteStatusSocket !== socket) {
        return;
      }
      handleViteStatusSocketMessage(event.data);
    });

    socket.addEventListener("close", () => {
      if (state.viteStatusSocket !== socket) {
        return;
      }
      state.viteStatusSocket = null;
      state.viteStatusSocketUrl = "";
      const wasManual = Boolean(state.viteStatusManualClose);
      state.viteStatusManualClose = false;
      if (wasManual) {
        return;
      }
      if (!state.viteStatusConnectionLost) {
        state.viteStatusConnectionLost = true;
        setStatus("Status connection lost", true);
      }
      scheduleViteStatusSocketReconnect();
    });

    socket.addEventListener("error", () => {
      // Close event handles reconnection.
    });
  }

  async function startViteDevServer() {
    if (state.projectType !== PROJECT_TYPE_VITE_REACT_STYLE) {
      state.projectType = PROJECT_TYPE_VITE_REACT_STYLE;
      syncProjectTypeUi();
    }

    state.viteStatus = {
      ...state.viteStatus,
      installing: true,
      starting: true,
      phase: "starting",
      lastError: "",
    };
    renderViteStatus();
    setStatus("Starting Vite dev server...");
    try {
      const response = await fetch("/api/vite/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_root: dom.projectRootInput.value,
          dev_url: dom.devUrlInput.value,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        state.viteStatus = normalizeViteStatus(data.vite_status || {}, state.devUrl);
        renderViteStatus();
        setStatus(data.error || "Failed to start Vite dev server", true);
        return;
      }

      state.projectRoot = String(data.project_root || state.projectRoot || "").trim();
      state.projectType = normalizeProjectType(data.project_type || PROJECT_TYPE_VITE_REACT_STYLE);
      state.devUrl = normalizeDevUrl(data.dev_url || dom.devUrlInput.value);
      dom.projectRootInput.value = state.projectRoot;
      dom.projectTypeSelect.value = state.projectType;
      dom.devUrlInput.value = state.devUrl;
      syncProjectTypeUi();
      ensureViteStatusSocket();
      loadIframe();
      setStatus("Vite dev server start requested");
    } catch (error) {
      state.viteStatus = {
        ...state.viteStatus,
        installing: false,
        starting: false,
        phase: "failed",
        lastError: String(error && error.message ? error.message : "Unknown error"),
      };
      renderViteStatus();
      setStatus(`Failed to start Vite dev server: ${error.message}`, true);
    }
  }

  async function stopViteDevServer() {
    setStatus("Stopping Vite dev server...");
    try {
      const response = await fetch("/api/vite/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_root: dom.projectRootInput.value,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        state.viteStatus = normalizeViteStatus(data.vite_status || {}, state.devUrl);
        renderViteStatus();
        setStatus(data.error || "Failed to stop Vite dev server", true);
        return;
      }

      state.projectType = normalizeProjectType(data.project_type || state.projectType);
      state.devUrl = normalizeDevUrl(data.dev_url || state.devUrl);
      dom.projectTypeSelect.value = state.projectType;
      dom.devUrlInput.value = state.devUrl;
      syncProjectTypeUi();
      ensureViteStatusSocket();
      if (state.projectType === PROJECT_TYPE_VITE_REACT_STYLE) {
        loadIframe();
      }
      setStatus("Vite dev server stop requested");
    } catch (error) {
      setStatus(`Failed to stop Vite dev server: ${error.message}`, true);
    }
  }

  function clearExportReport() {
    if (!dom.exportReport) {
      return;
    }
    dom.exportReport.classList.add("hidden");
    dom.exportReport.textContent = "";
  }

  function renderExportReport(report) {
    if (!dom.exportReport) {
      return;
    }

    const safeReport = report && typeof report === "object" ? report : null;
    const skipped = safeReport && Array.isArray(safeReport.skipped_rules) ? safeReport.skipped_rules : [];
    const exportedRules = Number(safeReport && safeReport.exported_rules) || 0;
    const skippedCount = Number(safeReport && safeReport.skipped_rules_count) || skipped.length;

    if (!safeReport) {
      clearExportReport();
      return;
    }

    const lines = [`Export report: ${exportedRules} rules exported, ${skippedCount} skipped`];
    for (const item of skipped.slice(0, 10)) {
      const relId = String(item && item.relId ? item.relId : "").trim();
      const reason = String(item && item.reason ? item.reason : "unknown").trim();
      lines.push(`- ${relId || "(unknown relId)"}: ${reason}`);
    }
    if (skipped.length > 10) {
      lines.push(`- ... ${skipped.length - 10} more skipped rules`);
    }

    dom.exportReport.textContent = lines.join("\n");
    dom.exportReport.classList.remove("hidden");
  }

  async function loadPatchInfo() {
    const response = await fetch("/api/patch");
    if (!response.ok) {
      setStatus("Could not load patch", true);
      return;
    }

    const data = await response.json();
    const normalizedPatch = normalizeLoadedPatch(data.patch);

    state.elementsMap = normalizedPatch.elementsMap;
    state.selectorMap = normalizedPatch.selectorMap || {};
    state.attributeOverrides = normalizedPatch.attributeOverrides || {};
    state.textOverrides = normalizedPatch.textOverrides || {};
    state.overridesMeta = normalizedPatch.overridesMeta;
    state.attributesMeta = normalizedPatch.attributesMeta;
    state.linksMeta = normalizedPatch.linksMeta;
    state.addedNodes = normalizedPatch.addedNodes;
    state.deletedNodes = normalizedPatch.deletedNodes;
    state.movedNodes = normalizedPatch.movedNodes;
    state.runtimeLibraries = normalizedPatch.runtimeLibraries || { ...state.defaultsLibraries };
    state.runtimeFonts = normalizedPatch.runtimeFonts || { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.theme = normalizedPatch.theme || createDefaultThemeState();
    state.controls.backgroundModeByRelId = {};
    dom.projectTypeSelect.value = state.projectType;
    dom.devUrlInput.value = state.devUrl;
    syncProjectTypeUi();

    if (hasPatchContent()) {
      setStatus("Patch loaded");
    }
  }

  async function savePatch(options) {
    const opts = options && typeof options === "object" ? options : {};
    const patch = {
      version: PATCH_VERSION,
      project_root: state.projectRoot,
      project_type: state.projectType,
      index_path: state.indexPath,
      dev_url: state.devUrl,
      elementsMap: state.elementsMap,
      selectorMap: normalizeSelectorMap(state.selectorMap),
      attributeOverrides: normalizeAttributeOverrides(state.attributeOverrides),
      textOverrides: normalizeTextOverrides(state.textOverrides),
      overridesMeta: state.overridesMeta,
      attributesMeta: state.attributesMeta,
      linksMeta: state.linksMeta,
      addedNodes: state.addedNodes,
      deletedNodes: state.deletedNodes,
      movedNodes: state.movedNodes,
      runtimeLibraries: state.runtimeLibraries,
      runtimeFonts: state.runtimeFonts,
      theme: state.theme,
    };

    const overrideCss = buildOverrideCss(state.overridesMeta, state.theme, {
      projectType: state.projectType,
      selectorMap: state.selectorMap,
      elementsMap: state.elementsMap,
    });
    const response = await fetch("/api/patch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patch, override_css: overrideCss }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.error || "Failed to save patch", true);
      return;
    }

    if (!opts.silent) {
      const successMessage = String(opts.successMessage || "").trim();
      setStatus(successMessage || "Patch saved");
    }
  }

  function handleResizeSyncMessage(payload) {
    const safePayload = payload && typeof payload === "object" ? payload : {};
    const relId = String(safePayload.relId || "").trim();
    if (!relId) {
      return;
    }

    const phase = String(safePayload.phase || "preview").trim().toLowerCase() === "commit"
      ? "commit"
      : "preview";
    const before = ensurePlainObject(safePayload.before);
    const after = ensurePlainObject(safePayload.after);
    if (Object.keys(after).length === 0) {
      return;
    }

    applyResizeOverride(relId, before, after, { phase });
    if (phase === "commit") {
      savePatch({ silent: true }).catch((error) => {
        setStatus(`Resize save failed: ${error.message || "Unknown error"}`, true);
      });
    }
  }

  function applyResizeOverride(relId, before, after, options) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }

    // Keep before/after in this API for future undo/redo integration.
    const beforeState = ensurePlainObject(before);
    const afterState = ensurePlainObject(after);
    const phase = String(options && options.phase ? options.phase : "preview").toLowerCase();
    if (!state.overridesMeta[safeRelId]) {
      state.overridesMeta[safeRelId] = {};
    }

    for (const [property, value] of Object.entries(afterState)) {
      const safeProperty = String(property || "").trim();
      if (!safeProperty) {
        continue;
      }

      const normalizedValue = normalizeRgbaAlphaInCssValue(String(value ?? ""));
      if (normalizedValue.trim() === "") {
        delete state.overridesMeta[safeRelId][safeProperty];
      } else {
        state.overridesMeta[safeRelId][safeProperty] = normalizedValue;
      }
    }

    if (Object.keys(state.overridesMeta[safeRelId]).length === 0) {
      delete state.overridesMeta[safeRelId];
    }

    if (state.selectedRelId !== safeRelId || !state.lastSelection) {
      return;
    }

    if (!state.lastSelection.computed || typeof state.lastSelection.computed !== "object") {
      state.lastSelection.computed = {};
    }

    for (const [property, value] of Object.entries(afterState)) {
      const safeProperty = String(property || "").trim();
      if (!safeProperty) {
        continue;
      }
      state.lastSelection.computed[safeProperty] = String(value ?? "");
    }

    if (phase === "commit") {
      state.lastSelection.resizeBefore = beforeState;
      state.lastSelection.resizeAfter = afterState;
    }

    updateStyleControlValues(
      state.lastSelection.computed,
      state.overridesMeta[safeRelId] || {},
      {
        selectionChanged: false,
        relId: safeRelId,
        selection: state.lastSelection,
      }
    );

    updateSelectionInfo(
      state.lastSelection,
      state.overridesMeta[safeRelId] || {},
      state.attributesMeta[safeRelId] || {},
      state.linksMeta[safeRelId] || {}
    );
  }

  async function exportSafe() {
    clearExportReport();
    const response = await fetch("/api/export-safe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_path: state.indexPath,
        project_type: state.projectType,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.error || "Export Safe failed", true);
      return;
    }

    const result = data.result || {};
    renderExportReport(result.export_report || null);

    if (state.projectType === PROJECT_TYPE_VITE_REACT_STYLE) {
      const cssPath = String(result.css || "").trim();
      const exported = Number(result.export_report && result.export_report.exported_rules) || 0;
      const skipped = Number(result.export_report && result.export_report.skipped_rules_count) || 0;
      setStatus(`Exported Vite CSS: ${cssPath} (rules: ${exported}, skipped: ${skipped})`);
      return;
    }

    setStatus(`Exported: ${result.html}`);
  }

  async function uploadImageFromInput() {
    if (!state.selectedRelId || !state.lastSelection || !state.lastSelection.isImage) {
      setStatus("Select an image element before uploading", true);
      dom.uploadImageInput.value = "";
      return;
    }

    const file = dom.uploadImageInput.files && dom.uploadImageInput.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    dom.uploadImageInput.value = "";

    if (!response.ok || !data.ok) {
      setStatus(data.error || "Image upload failed", true);
      return;
    }

    const relativePath = data.relative_path || "";
    dom.imageSrcInput.value = relativePath;
    applyAttributeEdit("src", relativePath);
    setStatus(`Image uploaded: ${data.file_name}`);
  }

  function onMessageFromOverlay(event) {
    if (event.source !== dom.iframe.contentWindow) {
      return;
    }
    if (event.origin !== window.location.origin) {
      return;
    }

    const msg = event.data || {};
    if (msg.type === "REL_OVERLAY_READY") {
      state.overlayReady = true;
      applyPatchToOverlay();
      requestTreeSnapshot();
      logVite("Overlay reported ready");
      setStatus("Overlay ready");
      return;
    }

    if (msg.type === "REL_SELECTION") {
      handleSelection(msg.payload);
      return;
    }

    if (msg.type === "REL_SELECTION_CLEARED") {
      state.selectedRelId = null;
      state.lastSelection = null;
      hideTreeContextMenu();
      clearSelectionUi();
      return;
    }

    if (msg.type === "REL_TREE_SNAPSHOT") {
      state.lastTreeSnapshot = Array.isArray(msg.payload) ? msg.payload : [];
      const query = dom.treeSearchInput.value.trim().toLowerCase();
      state.treeUi.query = query;
      renderTree(state.lastTreeSnapshot, query);
      return;
    }

    if (msg.type === "REL_NODE_ADDED") {
      handleNodeAdded(msg.payload);
      return;
    }

    if (msg.type === "REL_NODE_DELETED") {
      handleNodeDeleted(msg.payload);
      return;
    }

    if (msg.type === "REL_NODE_MOVED") {
      handleNodeMoved(msg.payload);
      return;
    }

    if (msg.type === "REL_ATTRIBUTE_SYNC") {
      handleAttributeSync(msg.payload);
      return;
    }

    if (msg.type === "REL_ATTRIBUTE_ERROR") {
      const details = msg.payload || {};
      setStatus(details.message || "Attribute update failed", true);
      return;
    }

    if (msg.type === "REL_DELETE_ERROR") {
      const details = msg.payload || {};
      setStatus(details.message || "Delete failed", true);
      return;
    }

    if (msg.type === "REL_TEXT_ERROR") {
      const details = msg.payload || {};
      setStatus(details.message || "Text update failed", true);
      return;
    }

    if (msg.type === "REL_MOVE_ERROR") {
      const details = msg.payload || {};
      setStatus(details.message || "Move failed", true);
      return;
    }

    if (msg.type === "REL_LIBRARIES_APPLIED") {
      state.runtimeLibraries = normalizeRuntimeLibraries(msg.payload || state.runtimeLibraries);
      syncLibraryControlsFromState();
      buildAddPanel();
      return;
    }

    if (msg.type === "REL_FONTS_APPLIED") {
      state.runtimeFonts = normalizeRuntimeFonts(msg.payload || state.runtimeFonts);
      syncFontControlsFromState();
      return;
    }

    if (msg.type === "REL_THEME_APPLIED") {
      return;
    }

    if (msg.type === "REL_CENTER_APPLIED") {
      handleCenterApplied(msg.payload);
      return;
    }

    if (msg.type === "REL_RESIZE_SYNC") {
      handleResizeSyncMessage(msg.payload || {});
      return;
    }
  }

  function handleSelection(payload) {
    if (!payload || !payload.relId) {
      return;
    }

    const previousRelId = state.selectedRelId;
    const selectionChanged = previousRelId !== payload.relId;

    state.selectedRelId = payload.relId;
    state.lastSelection = payload;
    const fallbackSelector = String(payload.fallbackSelector || "").trim();
    const stableSelector = String(payload.stableSelector || "").trim();
    if (fallbackSelector) {
      state.elementsMap[payload.relId] = fallbackSelector;
    } else if (!state.elementsMap[payload.relId]) {
      state.elementsMap[payload.relId] = "";
    }
    if (stableSelector) {
      state.selectorMap[payload.relId] = stableSelector;
    } else if (fallbackSelector && !state.selectorMap[payload.relId]) {
      state.selectorMap[payload.relId] = fallbackSelector;
    }
    const parentRelId = String(payload.parentRelId || "").trim();
    const parentFallbackSelector = String(payload.parentFallbackSelector || "").trim();
    const parentStableSelector = String(payload.parentStableSelector || "").trim();
    if (parentRelId) {
      if (parentFallbackSelector) {
        state.elementsMap[parentRelId] = parentFallbackSelector;
      } else if (!state.elementsMap[parentRelId]) {
        state.elementsMap[parentRelId] = "";
      }
      if (parentStableSelector) {
        state.selectorMap[parentRelId] = parentStableSelector;
      } else if (parentFallbackSelector && !state.selectorMap[parentRelId]) {
        state.selectorMap[parentRelId] = parentFallbackSelector;
      }
    }

    const overrides = state.overridesMeta[payload.relId] || {};
    const attrs = state.attributesMeta[payload.relId] || {};
    const links = state.linksMeta[payload.relId] || {};
    const attributeOverrides = state.attributeOverrides[payload.relId] || {};
    const textOverride = state.textOverrides[payload.relId] || {};

    updateSelectionInfo(payload, overrides, attrs, links);
    updateStyleControlValues(payload.computed || {}, overrides, {
      selectionChanged,
      relId: payload.relId,
      selection: payload,
    });
    updateAttributesPanel(payload, attrs);
    updateLinkPanel(payload, links, attributeOverrides);
    updateTextPanel(payload, textOverride);
    updateImagePanel(payload, attrs, overrides);
    updateDeleteButton(payload);
    markActiveTreeNode(payload.relId);
  }

  function clearSelectionUi() {
    dom.selectionInfo.textContent = "No element selected.";
    dom.attrIdInput.value = "";
    dom.attrClassInput.value = "";
    dom.makeLinkCheckbox.checked = false;
    dom.linkHrefInput.value = "";
    dom.linkTargetInput.value = "";
    dom.linkRelInput.value = "";
    dom.linkTitleInput.value = "";
    dom.textContentInput.value = "";
    dom.textContentInput.disabled = true;
    dom.applyTextBtn.disabled = true;
    dom.textSettingsSection.classList.add("hidden");
    dom.textComplexWarning.classList.add("hidden");
    dom.textComplexWarning.textContent = "";
    dom.imageSrcInput.value = "";
    dom.imageAltInput.value = "";
    dom.imageWidthInput.value = "";
    dom.imageHeightInput.value = "";
    dom.imageObjectFitInput.value = "";
    dom.imageBorderRadiusInput.value = "";
    dom.imageDisplayInput.value = "";
    dom.imageSettingsSection.classList.add("hidden");
    dom.deleteElementBtn.disabled = true;

    for (const property of Object.keys(state.controls.styleInputs || {})) {
      const input = state.controls.styleInputs[property];
      if (input) {
        input.value = "";
      }
    }

    if (state.controls.fontFamilySelect) {
      rebuildFontFamilyOptions("");
      state.controls.fontFamilySelect.value = "";
    }

    if (state.controls.backgroundSolidInput) {
      state.controls.backgroundSolidInput.value = "#ffffff";
    }
    if (state.controls.backgroundGradientInput) {
      state.controls.backgroundGradientInput.value = "";
    }
    if (state.controls.backgroundImageToggle) {
      state.controls.backgroundImageToggle.checked = false;
    }
    if (state.controls.backgroundImageUrlInput) {
      state.controls.backgroundImageUrlInput.value = "";
    }
    if (state.controls.backgroundImageSizeInput) {
      state.controls.backgroundImageSizeInput.value = "cover";
    }
    if (state.controls.backgroundImagePositionInput) {
      state.controls.backgroundImagePositionInput.value = "center";
    }
    if (state.controls.backgroundImageRepeatInput) {
      state.controls.backgroundImageRepeatInput.value = "no-repeat";
    }
    setBackgroundType("solid", true);
    updateFontLoadingWarning("");
    updateBackgroundPreview();
    if (state.controls.layerOrderInput) {
      state.controls.layerOrderInput.value = "0";
      state.controls.layerOrderInput.disabled = true;
    }
    if (state.controls.layerOrderResetBtn) {
      state.controls.layerOrderResetBtn.disabled = true;
    }
    if (state.controls.verticalAlignSelect) {
      state.controls.verticalAlignSelect.value = "";
      state.controls.verticalAlignSelect.disabled = true;
    }
    if (state.controls.shadowEnabledInput) {
      state.controls.shadowModeUpdating = true;
      state.controls.shadowEnabledInput.checked = false;
      state.controls.shadowTargetInput.value = "box";
      state.controls.shadowPresetInput.value = "none";
      state.controls.shadowRawInput.value = "";
      hydrateShadowAdvancedInputs(parseShadowValue("", "box"), "box");
      updateShadowControlsDisabledState();
      state.controls.shadowModeUpdating = false;
    }

    markActiveTreeNode("");
  }

  function updateSelectionInfo(selection, overrides, attrs, links) {
    const effectiveId = getEffectiveValue(attrs.id, selection.attributes && selection.attributes.id);
    const effectiveClass = getEffectiveValue(attrs.class, selection.attributes && selection.attributes.class);
    const linkState = Object.keys(links).length ? links : selection.link || {};

    const lines = [
      `relId: ${selection.relId}`,
      `tagName: ${selection.tagName || ""}`,
      `id: ${effectiveId || ""}`,
      `class: ${effectiveClass || ""}`,
      `src/href: ${(selection.srcOrHref || "").trim()}`,
      `alt: ${getEffectiveValue(attrs.alt, selection.attributes && selection.attributes.alt) || ""}`,
      `rect: x=${Math.round(selection.rect?.x || 0)}, y=${Math.round(selection.rect?.y || 0)}, w=${Math.round(selection.rect?.width || 0)}, h=${Math.round(selection.rect?.height || 0)}`,
      "",
      "Overrides:",
      Object.keys(overrides).length ? JSON.stringify(overrides, null, 2) : "(none)",
      "",
      "Attribute Overrides:",
      Object.keys(attrs).length ? JSON.stringify(attrs, null, 2) : "(none)",
      "",
      "Link Overrides:",
      Object.keys(linkState).length ? JSON.stringify(linkState, null, 2) : "(none)",
    ];

    dom.selectionInfo.textContent = lines.join("\n");
  }

  function updateStyleControlValues(computed, overrides, options) {
    const safeComputed = computed && typeof computed === "object" ? computed : {};
    const safeOverrides = overrides && typeof overrides === "object" ? overrides : {};
    for (const property of Object.keys(state.controls.styleInputs || {})) {
      const input = state.controls.styleInputs[property];
      if (!input) {
        continue;
      }
      input.value = safeOverrides[property] ?? safeComputed[property] ?? "";
    }

    const effectiveFontFamily = safeOverrides["font-family"] ?? safeComputed["font-family"] ?? "";
    rebuildFontFamilyOptions(effectiveFontFamily);

    const relId = String(options?.relId || state.selectedRelId || "");
    const selectionChanged = Boolean(options?.selectionChanged);
    const detectedMode = detectBackgroundMode(safeOverrides, safeComputed);
    const rememberedMode = relId ? state.controls.backgroundModeByRelId[relId] : "";
    const nextMode = selectionChanged
      ? detectedMode
      : (rememberedMode || state.controls.backgroundType || detectedMode);

    if (selectionChanged) {
      setBackgroundType(nextMode, true);
    } else if (!state.controls.backgroundType) {
      setBackgroundType(nextMode, true);
    }

    if (relId && selectionChanged) {
      state.controls.backgroundModeByRelId[relId] = nextMode;
    }

    const draft = resolveBackgroundDraft(relId, safeOverrides, safeComputed);
    if (state.controls.backgroundGradientInput) {
      state.controls.backgroundGradientInput.value = draft.gradient;
    }
    if (state.controls.backgroundSolidInput) {
      state.controls.backgroundSolidInput.value = draft.solid;
    }
    if (state.controls.backgroundImageToggle) {
      state.controls.backgroundImageToggle.checked = Boolean(draft.imageEnabled);
    }
    if (state.controls.backgroundImageUrlInput) {
      state.controls.backgroundImageUrlInput.value = draft.imageUrl;
    }
    if (state.controls.backgroundImageSizeInput) {
      state.controls.backgroundImageSizeInput.value = draft.imageSize;
    }
    if (state.controls.backgroundImagePositionInput) {
      state.controls.backgroundImagePositionInput.value = draft.imagePosition;
    }
    if (state.controls.backgroundImageRepeatInput) {
      state.controls.backgroundImageRepeatInput.value = draft.imageRepeat;
    }

    updateBackgroundControlVisibility();
    updateBackgroundPreview();
    updateLayerOrderControlForSelection(
      options?.selection || state.lastSelection || {},
      safeComputed,
      safeOverrides
    );
    updateVerticalAlignControlForSelection(options?.selection || state.lastSelection || {}, safeComputed, safeOverrides);
    updateShadowControlValues(safeComputed, safeOverrides, options?.selection || state.lastSelection || {}, options || {});
  }

  function updateAttributesPanel(selection, attrs) {
    dom.attrIdInput.value = getEffectiveValue(attrs.id, selection.attributes && selection.attributes.id) || "";
    dom.attrClassInput.value = getEffectiveValue(attrs.class, selection.attributes && selection.attributes.class) || "";
  }

  function updateLinkPanel(selection, linkOverrides, attributeOverrides) {
    const linkData = Object.keys(linkOverrides).length ? linkOverrides : (selection.link || {});
    const attrData = attributeOverrides && typeof attributeOverrides === "object" ? attributeOverrides : {};
    const isAnchor = Boolean(selection.isAnchor || (selection.link && selection.link.isAnchor));
    const makeLinkLabel = selection.isImage ? "Wrap image with link" : "Make this element a link";
    dom.makeLinkRow.querySelector("span").textContent = makeLinkLabel;
    dom.makeLinkRow.classList.toggle("hidden", isAnchor);

    const enabled = isAnchor ? true : Boolean(linkData.enabled);
    dom.makeLinkCheckbox.checked = enabled;
    dom.linkHrefInput.value = Object.prototype.hasOwnProperty.call(attrData, "href") ? String(attrData.href || "") : (linkData.href || "");
    dom.linkTargetInput.value = Object.prototype.hasOwnProperty.call(attrData, "target") ? String(attrData.target || "") : (linkData.target || "");
    dom.linkRelInput.value = Object.prototype.hasOwnProperty.call(attrData, "rel") ? String(attrData.rel || "") : (linkData.rel || "");
    dom.linkTitleInput.value = Object.prototype.hasOwnProperty.call(attrData, "title") ? String(attrData.title || "") : (linkData.title || "");
  }

  function updateTextPanel(selection, textOverride) {
    const textInfo = selection && selection.textInfo && typeof selection.textInfo === "object" ? selection.textInfo : {};
    const isSupported = Boolean(textInfo.isTextLike);
    dom.textSettingsSection.classList.toggle("hidden", !isSupported);

    if (!isSupported) {
      dom.textContentInput.value = "";
      dom.textContentInput.disabled = true;
      dom.applyTextBtn.disabled = true;
      dom.textComplexWarning.classList.add("hidden");
      dom.textComplexWarning.textContent = "";
      return;
    }

    const overrideValue = textOverride && Object.prototype.hasOwnProperty.call(textOverride, "text")
      ? String(textOverride.text || "")
      : null;
    const effectiveValue = overrideValue !== null
      ? overrideValue
      : String(textInfo.value || "");

    dom.textContentInput.value = effectiveValue;

    const canEdit = Boolean(textInfo.canEdit);
    dom.textContentInput.disabled = !canEdit;
    dom.applyTextBtn.disabled = !canEdit;
    if (canEdit) {
      dom.textComplexWarning.classList.add("hidden");
      dom.textComplexWarning.textContent = "";
      return;
    }

    dom.textComplexWarning.classList.remove("hidden");
    dom.textComplexWarning.textContent = String(textInfo.reason || "Complex content. Text editing is disabled for this element.");
  }

  function updateImagePanel(selection, attrs, overrides) {
    const isImage = Boolean(selection.isImage);
    dom.imageSettingsSection.classList.toggle("hidden", !isImage);
    if (!isImage) {
      return;
    }

    dom.imageSrcInput.value = getEffectiveValue(attrs.src, selection.attributes && selection.attributes.src) || "";
    dom.imageAltInput.value = getEffectiveValue(attrs.alt, selection.attributes && selection.attributes.alt) || "";
    dom.imageWidthInput.value = getEffectiveValue(attrs.width, selection.attributes && selection.attributes.width) || "";
    dom.imageHeightInput.value = getEffectiveValue(attrs.height, selection.attributes && selection.attributes.height) || "";
    dom.imageObjectFitInput.value = overrides["object-fit"] ?? selection.computed?.["object-fit"] ?? "";
    dom.imageBorderRadiusInput.value = overrides["border-radius"] ?? selection.computed?.["border-radius"] ?? "";
    dom.imageDisplayInput.value = overrides.display ?? selection.computed?.display ?? "";
  }

  function updateDeleteButton(selection) {
    const canDelete = Boolean(selection && selection.relId && selection.canDelete !== false);
    dom.deleteElementBtn.disabled = !canDelete;
  }

  function applyLayerOrderFromControl(rawValue) {
    if (!state.selectedRelId) {
      return;
    }
    if (isRootLikeLayerSelection(state.lastSelection || {})) {
      return;
    }

    const relId = String(state.selectedRelId || "").trim();
    if (!relId) {
      return;
    }

    const orderValue = normalizeLayerOrder(rawValue);
    if (state.controls.layerOrderInput) {
      state.controls.layerOrderInput.value = String(orderValue);
    }

    applyStyleForRelId(relId, "z-index", orderValue > 0 ? String(orderValue) : "");
    if (orderValue > 0) {
      ensurePositionOverrideForLayerOrder(relId);
      return;
    }
    clearAutoPositionForLayerOrder(relId);
  }

  function updateLayerOrderControlForSelection(selection, computed, overrides) {
    const input = state.controls.layerOrderInput;
    if (!input) {
      return;
    }

    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const safeComputed = computed && typeof computed === "object" ? computed : {};
    const safeOverrides = overrides && typeof overrides === "object" ? overrides : {};
    const disabled = isRootLikeLayerSelection(safeSelection);
    const zValue = safeOverrides["z-index"] ?? safeComputed["z-index"] ?? "";
    const normalized = normalizeLayerOrder(zValue);

    input.value = String(normalized);
    input.disabled = disabled;
    if (state.controls.layerOrderResetBtn) {
      state.controls.layerOrderResetBtn.disabled = disabled;
    }
  }

  function applyStyle(property, value) {
    if (!state.selectedRelId) {
      return;
    }

    const relId = String(state.selectedRelId || "").trim();
    const safeProperty = String(property || "").trim().toLowerCase();
    const normalizedValue = normalizeRgbaAlphaInCssValue(String(value ?? ""));
    const trimmedValue = normalizedValue.trim();

    applyStyleForRelId(relId, safeProperty, normalizedValue);
    if (shouldTriggerCardCenterHelper(safeProperty, trimmedValue)) {
      requestCardCenterInParent(relId);
    }
  }

  function applyStyleForRelId(relId, property, value) {
    const safeRelId = String(relId || "").trim();
    const safeProperty = String(property || "").trim().toLowerCase();
    if (!safeRelId || !safeProperty) {
      return;
    }

    const normalizedValue = normalizeRgbaAlphaInCssValue(String(value ?? ""));
    const trimmedValue = normalizedValue.trim();
    if (!state.overridesMeta[safeRelId]) {
      state.overridesMeta[safeRelId] = {};
    }

    if (trimmedValue === "") {
      delete state.overridesMeta[safeRelId][safeProperty];
    } else {
      state.overridesMeta[safeRelId][safeProperty] = normalizedValue;
    }
    if (safeProperty === "position" && trimmedValue.toLowerCase() !== "relative") {
      clearStyleMetadataValue(safeRelId, ORDER_AUTO_POSITION_META_KEY);
      clearStyleMetadataValue(safeRelId, ORDER_AUTO_POSITION_PREV_META_KEY);
    }
    const borderBoxPayload = ensureBorderBoxOverrideForSizing(safeRelId, safeProperty, trimmedValue);

    if (Object.keys(state.overridesMeta[safeRelId]).length === 0) {
      delete state.overridesMeta[safeRelId];
    }

    sendToOverlay({
      type: "REL_APPLY_STYLE",
      payload: { relId: safeRelId, property: safeProperty, value: trimmedValue ? normalizedValue : "" },
    });
    if (borderBoxPayload) {
      sendToOverlay({
        type: "REL_APPLY_STYLE",
        payload: borderBoxPayload,
      });
    }

    if (state.lastSelection && state.selectedRelId === safeRelId) {
      updateSelectionInfo(
        state.lastSelection,
        state.overridesMeta[safeRelId] || {},
        state.attributesMeta[safeRelId] || {},
        state.linksMeta[safeRelId] || {}
      );
    }
  }

  function shouldTriggerCardCenterHelper(property, value) {
    if (state.projectType !== PROJECT_TYPE_VITE_REACT_STYLE) {
      return false;
    }
    if (!state.lastSelection || !state.selectedRelId) {
      return false;
    }
    if (!CARD_CENTER_TRIGGER_PROPS.has(String(property || "").toLowerCase())) {
      return false;
    }
    if (String(value || "").trim().toLowerCase() !== "center") {
      return false;
    }
    return isCardSelection(state.lastSelection);
  }

  function requestCardCenterInParent(relId) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }
    logVite(`Center helper requested for relId=${safeRelId}`);
    sendToOverlay({
      type: "REL_CENTER_IN_PARENT",
      payload: { relId: safeRelId },
    });
  }

  function isCardSelection(selection) {
    const safeSelection = selection && typeof selection === "object" ? selection : {};
    const className = String(safeSelection.className || "").toLowerCase();
    if (className.includes("rel-added-card") || /\bcard\b/.test(className)) {
      return true;
    }
    return false;
  }

  function ensureBorderBoxOverrideForSizing(relId, property, value) {
    const safeProperty = String(property || "").trim().toLowerCase();
    if (!BORDER_BOX_TRIGGER_PROPS.has(safeProperty)) {
      return null;
    }
    if (!String(value || "").trim()) {
      return null;
    }

    if (!state.overridesMeta[relId]) {
      state.overridesMeta[relId] = {};
    }

    const existing = String(state.overridesMeta[relId]["box-sizing"] ?? "").trim().toLowerCase();
    if (existing === "border-box") {
      return null;
    }

    state.overridesMeta[relId]["box-sizing"] = "border-box";
    return {
      relId,
      property: "box-sizing",
      value: "border-box",
    };
  }

  function applyAttributeEdit(field, rawValue) {
    if (!state.selectedRelId) {
      return;
    }

    const relId = state.selectedRelId;
    const value = normalizeAttributeValue(field, rawValue);

    if (field === "id" && value && idExistsInSnapshot(value, relId)) {
      setStatus(`ID already exists: ${value}`, true);
      return;
    }

    upsertAttributeMeta(relId, field, value);
    sendToOverlay({
      type: "REL_SET_ATTRIBUTES",
      payload: { relId, attributes: { [field]: value } },
    });

    if (field === "id" || field === "class") {
      requestTreeSnapshot();
    }

    if (state.lastSelection) {
      updateSelectionInfo(
        state.lastSelection,
        state.overridesMeta[relId] || {},
        state.attributesMeta[relId] || {},
        state.linksMeta[relId] || {}
      );
    }
  }

  function applyLinkSettingsFromPanel() {
    if (!state.selectedRelId || !state.lastSelection) {
      return;
    }

    const relId = state.selectedRelId;
    const isAnchor = Boolean(state.lastSelection.isAnchor);
    const enabled = isAnchor ? true : Boolean(dom.makeLinkCheckbox.checked);
    const href = dom.linkHrefInput.value.trim();
    const target = dom.linkTargetInput.value.trim();
    const rel = dom.linkRelInput.value.trim();
    const title = dom.linkTitleInput.value.trim();

    if (href && !isValidUrl(href)) {
      setStatus("Invalid URL format for href", true);
      return;
    }

    const linkPatch = { enabled, href, target, rel, title };
    if (!isAnchor && !enabled && !href && !target && !rel && !title) {
      delete state.linksMeta[relId];
    } else {
      state.linksMeta[relId] = linkPatch;
    }
    state.attributeOverrides[relId] = {
      href,
      target,
      rel,
      title,
    };

    sendToOverlay({
      type: "REL_SET_LINK",
      payload: {
        relId,
        link: linkPatch,
      },
    });

    if (state.lastSelection) {
      updateSelectionInfo(
        state.lastSelection,
        state.overridesMeta[relId] || {},
        state.attributesMeta[relId] || {},
        state.linksMeta[relId] || {}
      );
    }
  }

  function applyTextOverrideFromPanel() {
    if (!state.selectedRelId || !state.lastSelection) {
      return;
    }

    const relId = state.selectedRelId;
    const textInfo = state.lastSelection && state.lastSelection.textInfo && typeof state.lastSelection.textInfo === "object"
      ? state.lastSelection.textInfo
      : {};
    if (!Boolean(textInfo.canEdit)) {
      setStatus("Text editing is disabled for this element", true);
      return;
    }

    const text = String(dom.textContentInput.value || "");
    state.textOverrides[relId] = { text };

    sendToOverlay({
      type: "REL_SET_TEXT",
      payload: {
        relId,
        text,
      },
    });

    setStatus("Text updated");
  }

  function handleNodeAdded(payload) {
    const node = payload && payload.node;
    if (!node || !node.nodeId) {
      return;
    }

    const index = state.addedNodes.findIndex((item) => item.nodeId === node.nodeId);
    if (index >= 0) {
      state.addedNodes[index] = node;
    } else {
      state.addedNodes.push(node);
    }

    if (node.relId) {
      const fallbackSelector = String(node.fallbackSelector || "").trim();
      const stableSelector = String(node.stableSelector || "").trim();
      if (fallbackSelector) {
        state.elementsMap[node.relId] = fallbackSelector;
      }
      if (stableSelector) {
        state.selectorMap[node.relId] = stableSelector;
      } else if (fallbackSelector && !state.selectorMap[node.relId]) {
        state.selectorMap[node.relId] = fallbackSelector;
      }
      state.deletedNodes = state.deletedNodes.filter((item) => item.relId !== node.relId);
    }

    setStatus(`Added node: ${node.type}`);
  }

  function handleNodeDeleted(payload) {
    const info = payload && typeof payload === "object" ? payload : {};
    const relId = String(info.relId || "").trim();
    const fallbackSelector = String(info.fallbackSelector || "").trim();
    const timestamp = Number(info.timestamp || Date.now());

    if (!relId && !fallbackSelector) {
      return;
    }

    if (relId) {
      delete state.overridesMeta[relId];
      delete state.attributesMeta[relId];
      delete state.linksMeta[relId];
      delete state.selectorMap[relId];
      delete state.attributeOverrides[relId];
      delete state.textOverrides[relId];
      state.addedNodes = state.addedNodes.filter((node) => node.relId !== relId);
      state.movedNodes = state.movedNodes.filter((entry) => {
        return entry.sourceRelId !== relId && entry.targetRelId !== relId;
      });
      state.elementsMap[relId] = fallbackSelector || state.elementsMap[relId] || "";
    }

    if (relId) {
      state.deletedNodes = state.deletedNodes.filter((item) => item.relId !== relId);
    } else if (fallbackSelector) {
      state.deletedNodes = state.deletedNodes.filter((item) => item.fallbackSelector !== fallbackSelector);
    }
    state.deletedNodes.push({
      relId,
      fallbackSelector,
      timestamp,
    });

    state.selectedRelId = null;
    state.lastSelection = null;
    clearSelectionUi();
    requestTreeSnapshot();
    setStatus("Element deleted");
  }

  function handleNodeMoved(payload) {
    const operation = normalizeMovedNodeEntry(payload && payload.operation ? payload.operation : payload);
    if (!operation) {
      return;
    }

    upsertMovedNodeOperation(operation);
    if (operation.sourceRelId && operation.sourceFallbackSelector) {
      state.elementsMap[operation.sourceRelId] = operation.sourceFallbackSelector;
    }
    if (operation.targetRelId && operation.targetFallbackSelector && !state.elementsMap[operation.targetRelId]) {
      state.elementsMap[operation.targetRelId] = operation.targetFallbackSelector;
    }
    if (operation.sourceRelId && operation.sourceStableSelector) {
      state.selectorMap[operation.sourceRelId] = operation.sourceStableSelector;
    }
    if (operation.targetRelId && operation.targetStableSelector && !state.selectorMap[operation.targetRelId]) {
      state.selectorMap[operation.targetRelId] = operation.targetStableSelector;
    }
    setStatus("Tree move applied");
  }

  function handleAttributeSync(payload) {
    const info = payload && typeof payload === "object" ? payload : {};
    const relId = String(info.relId || "").trim();
    const attributes = info.attributes && typeof info.attributes === "object" ? info.attributes : {};
    if (!relId || Object.keys(attributes).length === 0) {
      return;
    }

    const fallbackSelector = String(info.fallbackSelector || "").trim();
    const stableSelector = String(info.stableSelector || "").trim();
    if (fallbackSelector) {
      state.elementsMap[relId] = fallbackSelector;
    }
    if (stableSelector) {
      state.selectorMap[relId] = stableSelector;
    } else if (fallbackSelector && !state.selectorMap[relId]) {
      state.selectorMap[relId] = fallbackSelector;
    }

    let requiresTreeRefresh = false;
    for (const [field, rawValue] of Object.entries(attributes)) {
      const safeField = String(field || "").trim();
      if (!safeField) {
        continue;
      }
      const normalized = normalizeAttributeValue(safeField, rawValue);
      upsertAttributeMeta(relId, safeField, normalized);
      if (safeField === "id" || safeField === "class") {
        requiresTreeRefresh = true;
      }
    }

    if (state.selectedRelId === relId && state.lastSelection) {
      updateSelectionInfo(
        state.lastSelection,
        state.overridesMeta[relId] || {},
        state.attributesMeta[relId] || {},
        state.linksMeta[relId] || {}
      );
      updateAttributesPanel(state.lastSelection, state.attributesMeta[relId] || {});
    }

    if (requiresTreeRefresh) {
      requestTreeSnapshot();
    }
  }

  function upsertMovedNodeOperation(operation) {
    const normalized = normalizeMovedNodeEntry(operation);
    if (!normalized) {
      return;
    }
    state.movedNodes = state.movedNodes.filter((entry) => entry.sourceRelId !== normalized.sourceRelId);
    state.movedNodes.push(normalized);
  }

  function handleCenterApplied(payload) {
    const safePayload = payload && typeof payload === "object" ? payload : {};
    const containerRelId = String(safePayload.containerRelId || "").trim();
    if (!containerRelId) {
      return;
    }

    const fallbackSelector = String(safePayload.fallbackSelector || "").trim();
    const stableSelector = String(safePayload.stableSelector || "").trim();
    if (fallbackSelector) {
      state.elementsMap[containerRelId] = fallbackSelector;
    }
    if (stableSelector) {
      state.selectorMap[containerRelId] = stableSelector;
    } else if (fallbackSelector && !state.selectorMap[containerRelId]) {
      state.selectorMap[containerRelId] = fallbackSelector;
    }

    const appliedProps = safePayload.appliedProps && typeof safePayload.appliedProps === "object"
      ? safePayload.appliedProps
      : {};
    for (const [property, rawValue] of Object.entries(appliedProps)) {
      const value = String(rawValue || "").trim();
      applyStyleForRelId(containerRelId, property, value);
    }

    logVite(`Center helper applied on relId=${containerRelId}`);
    setStatus("Card centered in parent container");
  }

  function requestTreeSnapshot() {
    sendToOverlay({ type: "REL_REQUEST_TREE" });
  }

  function renderTree(items, searchQuery) {
    initTreeUi();
    dom.treeContainer.innerHTML = "";

    const query = String(searchQuery || "").trim().toLowerCase();
    state.treeUi.query = query;
    const model = buildTreeModel(items);
    const nodeByRelId = {};
    const parentByRelId = {};
    for (const item of model) {
      nodeByRelId[item.relId] = item;
      parentByRelId[item.relId] = item.parentRelId || "";
    }
    state.treeUi.nodeByRelId = nodeByRelId;
    state.treeUi.parentByRelId = parentByRelId;
    pruneTreeCollapsedState(nodeByRelId);

    const filteredModel = filterTreeItemsByQuery(model, query);
    const visibleItems = query ? filteredModel : computeVisibleTreeItems(filteredModel);
    for (const item of visibleItems) {
      const row = buildTreeRowElement(item);
      dom.treeContainer.appendChild(row);
    }

    markActiveTreeNode(state.selectedRelId || "");
    if (state.treeContextMenu.visible) {
      const targetRelId = String(state.treeContextMenu.targetRelId || "").trim();
      if (!targetRelId || !state.treeUi.nodeByRelId[targetRelId]) {
        hideTreeContextMenu();
      }
    }
    scheduleTooltipCoverageCheck();
  }

  function buildTreeModel(items) {
    const source = Array.isArray(items) ? items : [];
    const relStack = [];
    const model = [];

    for (let index = 0; index < source.length; index += 1) {
      const raw = source[index] && typeof source[index] === "object" ? source[index] : {};
      const relId = String(raw.relId || "").trim();
      if (!relId) {
        continue;
      }

      const depthRaw = Number(raw.depth);
      const depth = Number.isFinite(depthRaw) ? Math.max(0, Math.floor(depthRaw)) : 0;
      while (relStack.length > depth) {
        relStack.pop();
      }

      const nextRaw = source[index + 1] && typeof source[index + 1] === "object" ? source[index + 1] : null;
      const nextDepth = nextRaw ? Math.max(0, Math.floor(Number(nextRaw.depth) || 0)) : depth;
      const tagName = String(raw.tagName || "").trim().toLowerCase() || "div";
      const isSystem = Boolean(raw.isSystem);
      const isProtected = Boolean(raw.isProtected) || TREE_PROTECTED_TAGS.has(tagName);
      const inferredCanContainChildren = !TREE_VOID_TAGS.has(tagName) && !isSystem && tagName !== "head";
      const canContainChildren = Object.prototype.hasOwnProperty.call(raw, "canContainChildren")
        ? Boolean(raw.canContainChildren)
        : inferredCanContainChildren;
      const hasChildren = Object.prototype.hasOwnProperty.call(raw, "hasChildren")
        ? Boolean(raw.hasChildren)
        : nextDepth > depth;

      let parentRelId = String(raw.parentRelId || "").trim();
      if (!parentRelId && depth > 0) {
        parentRelId = String(relStack[depth - 1] || "").trim();
      }

      const item = {
        relId,
        parentRelId,
        depth,
        tagName,
        id: String(raw.id || "").trim(),
        className: String(raw.className || "").trim(),
        hasChildren,
        canContainChildren,
        canDropInside: canContainChildren && !isProtected && !isSystem,
        isProtected,
        isSystem,
        canDrag: !isProtected && !isSystem,
      };
      model.push(item);
      relStack[depth] = relId;
    }

    return model;
  }

  function pruneTreeCollapsedState(nodeByRelId) {
    const next = {};
    const current = state.treeUi.collapsedByRelId || {};
    for (const relId of Object.keys(current)) {
      if (!current[relId]) {
        continue;
      }
      if (!nodeByRelId[relId]) {
        continue;
      }
      next[relId] = true;
    }
    state.treeUi.collapsedByRelId = next;
  }

  function filterTreeItemsByQuery(items, query) {
    const safeQuery = String(query || "").trim().toLowerCase();
    if (!safeQuery) {
      return items;
    }

    const byRelId = {};
    for (const item of items) {
      byRelId[item.relId] = item;
    }

    const included = new Set();
    for (const item of items) {
      if (!matchesTreeNode(item, safeQuery)) {
        continue;
      }
      let cursor = item;
      while (cursor) {
        if (included.has(cursor.relId)) {
          break;
        }
        included.add(cursor.relId);
        const parentRelId = String(cursor.parentRelId || "").trim();
        cursor = parentRelId ? byRelId[parentRelId] : null;
      }
    }

    return items.filter((item) => included.has(item.relId));
  }

  function computeVisibleTreeItems(items) {
    const visible = [];
    const hiddenDepths = [];

    for (const item of items) {
      while (hiddenDepths.length > 0 && item.depth <= hiddenDepths[hiddenDepths.length - 1]) {
        hiddenDepths.pop();
      }
      if (hiddenDepths.length > 0) {
        continue;
      }

      visible.push(item);
      if (item.hasChildren && isTreeNodeCollapsed(item.relId)) {
        hiddenDepths.push(item.depth);
      }
    }

    return visible;
  }

  function buildTreeRowElement(item) {
    const row = document.createElement("div");
    row.className = "tree-row";
    row.dataset.relId = item.relId;
    row.dataset.depth = String(item.depth);
    if (item.canDropInside) {
      row.dataset.canDropInside = "1";
    }
    if (item.relId === state.selectedRelId) {
      row.classList.add("active");
    }

    const guides = document.createElement("div");
    guides.className = "tree-indent";
    buildTreeGuideColumns(guides, item.depth);
    row.appendChild(guides);

    if (item.hasChildren) {
      const expander = document.createElement("button");
      expander.type = "button";
      expander.className = "tree-expander";
      const collapsed = isTreeNodeCollapsed(item.relId);
      expander.textContent = collapsed ? "\u25b8" : "\u25be";
      expander.dataset.relId = item.relId;
      setTooltipKey(expander, "tree.expandToggle");
      expander.dataset.tooltipExtra = collapsed ? "Action: expand branch" : "Action: collapse branch";
      expander.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleTreeNodeCollapsed(item.relId);
      });
      row.appendChild(expander);
    } else {
      const spacer = document.createElement("span");
      spacer.className = "tree-expander-spacer";
      row.appendChild(spacer);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tree-node";
    btn.textContent = formatTreeLabel(item);
    btn.setAttribute("data-rel-id", item.relId);
    setTooltipKey(btn, "tree.node");
    btn.dataset.tooltipExtra = `rel-id: ${item.relId}`;
    btn.addEventListener("click", () => {
      sendToOverlay({
        type: "REL_SELECT_BY_REL_ID",
        payload: { relId: item.relId },
      });
    });
    row.appendChild(btn);

    if (item.canDrag) {
      row.draggable = true;
      row.addEventListener("dragstart", (event) => {
        onTreeRowDragStart(event, item, row);
      });
    }
    row.addEventListener("dragover", (event) => {
      onTreeRowDragOver(event, item, row);
    });
    row.addEventListener("drop", (event) => {
      onTreeRowDrop(event, item, row);
    });
    row.addEventListener("dragleave", (event) => {
      onTreeRowDragLeave(event, item, row);
    });
    row.addEventListener("dragend", () => {
      onTreeRowDragEnd();
    });

    return row;
  }

  function buildTreeGuideColumns(container, depth) {
    const levels = Math.max(0, Number(depth) || 0);
    if (levels <= 0) {
      return;
    }
    for (let i = 0; i < levels - 1; i += 1) {
      const column = document.createElement("span");
      column.className = "tree-guide-col";
      column.style.width = `${TREE_INDENT_PX}px`;
      container.appendChild(column);
    }
    const branch = document.createElement("span");
    branch.className = "tree-guide-branch";
    branch.style.width = `${TREE_INDENT_PX}px`;
    container.appendChild(branch);
  }

  function matchesTreeNode(node, query) {
    if (!query) {
      return true;
    }
    const haystack = `${node.tagName || ""} ${node.id || ""} ${node.className || ""}`.toLowerCase();
    return haystack.includes(query);
  }

  function isTreeNodeCollapsed(relId) {
    return Boolean(state.treeUi.collapsedByRelId[String(relId || "").trim()]);
  }

  function toggleTreeNodeCollapsed(relId) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }
    const current = isTreeNodeCollapsed(safeRelId);
    if (current) {
      delete state.treeUi.collapsedByRelId[safeRelId];
    } else {
      state.treeUi.collapsedByRelId[safeRelId] = true;
    }
    renderTree(state.lastTreeSnapshot, state.treeUi.query || "");
  }

  function onTreeRowDragStart(event, item, row) {
    if (!item || !item.canDrag) {
      event.preventDefault();
      return;
    }
    hideTreeContextMenu();

    const sourceRelId = String(item.relId || "").trim();
    if (!sourceRelId) {
      event.preventDefault();
      return;
    }

    state.treeUi.dragging = true;
    state.treeUi.dragSourceRelId = sourceRelId;
    state.treeUi.dragSourceRow = row;
    row.classList.add("drag-source");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", sourceRelId);
    }
    showTreeDragTooltip("Move element", event.clientX, event.clientY);
  }

  function onTreeRowDragOver(event, item, row) {
    if (!state.treeUi.dragging || !state.treeUi.dragSourceRelId) {
      return;
    }

    const placement = resolveTreeDropPlacementFromPointer(event, row, item);
    if (!isValidTreeDropTarget(state.treeUi.dragSourceRelId, item, placement)) {
      clearTreeDropIndicator();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    applyTreeDropIndicator(row, item, placement, event.clientX, event.clientY);
  }

  function onTreeRowDrop(event, item, row) {
    if (!state.treeUi.dragging || !state.treeUi.dragSourceRelId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const placement = normalizeTreeDropPlacement(
      state.treeUi.dragHoverRelId === item.relId
        ? state.treeUi.dragDropPosition
        : resolveTreeDropPlacementFromPointer(event, row, item)
    );
    if (!isValidTreeDropTarget(state.treeUi.dragSourceRelId, item, placement)) {
      clearTreeDropIndicator();
      clearTreeDragState();
      return;
    }

    sendToOverlay({
      type: "REL_MOVE_NODE",
      payload: {
        sourceRelId: state.treeUi.dragSourceRelId,
        targetRelId: item.relId,
        placement,
      },
    });
    clearTreeDropIndicator();
    clearTreeDragState();
  }

  function onTreeRowDragLeave(event, item) {
    if (!state.treeUi.dragging) {
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(".tree-row") === event.currentTarget) {
      return;
    }
    if (state.treeUi.dragHoverRelId === item.relId) {
      clearTreeDropIndicator();
    }
  }

  function onTreeRowDragEnd() {
    clearTreeDropIndicator();
    clearTreeDragState();
  }

  function resolveTreeDropPlacementFromPointer(event, row, item) {
    const rect = row.getBoundingClientRect();
    if (!rect.height) {
      return "inside";
    }
    const y = clamp(Number(event.clientY) - rect.top, 0, rect.height);
    const ratio = rect.height > 0 ? (y / rect.height) : 0.5;
    if (
      item.canDropInside
      && ratio >= TREE_DROP_INSIDE_MIN_RATIO
      && ratio <= TREE_DROP_INSIDE_MAX_RATIO
    ) {
      return "inside";
    }
    return ratio < 0.5 ? "before" : "after";
  }

  function normalizeTreeDropPlacement(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "before" || normalized === "after" || normalized === "inside") {
      return normalized;
    }
    return "inside";
  }

  function isValidTreeDropTarget(sourceRelId, targetItem, placement) {
    const sourceId = String(sourceRelId || "").trim();
    const target = targetItem && typeof targetItem === "object" ? targetItem : null;
    const safePlacement = normalizeTreeDropPlacement(placement);
    if (!sourceId || !target || !target.relId) {
      return false;
    }
    if (sourceId === target.relId) {
      return false;
    }
    const sourceItem = state.treeUi.nodeByRelId[sourceId] || null;
    if (!sourceItem || sourceItem.isProtected || sourceItem.isSystem || !sourceItem.canDrag) {
      return false;
    }
    if (target.isSystem || target.isProtected) {
      return false;
    }
    if (safePlacement === "inside" && !target.canDropInside) {
      return false;
    }
    if (isTreeDescendant(target.relId, sourceId)) {
      return false;
    }
    return true;
  }

  function isTreeDescendant(candidateRelId, ancestorRelId) {
    const candidate = String(candidateRelId || "").trim();
    const ancestor = String(ancestorRelId || "").trim();
    if (!candidate || !ancestor) {
      return false;
    }
    let cursor = String(state.treeUi.parentByRelId[candidate] || "").trim();
    while (cursor) {
      if (cursor === ancestor) {
        return true;
      }
      cursor = String(state.treeUi.parentByRelId[cursor] || "").trim();
    }
    return false;
  }

  function applyTreeDropIndicator(row, item, placement, clientX, clientY) {
    const safePlacement = normalizeTreeDropPlacement(placement);
    if (state.treeUi.dragHoverRelId === item.relId && state.treeUi.dragDropPosition === safePlacement) {
      showTreeDragTooltip(getTreeDropActionLabel(safePlacement), clientX, clientY);
      scheduleTreeAutoExpand(item, safePlacement);
      return;
    }

    clearTreeDropIndicator();
    row.dataset.dropPosition = safePlacement;
    state.treeUi.dragHoverRelId = item.relId;
    state.treeUi.dragDropPosition = safePlacement;

    showTreeDragTooltip(getTreeDropActionLabel(safePlacement), clientX, clientY);
    scheduleTreeAutoExpand(item, safePlacement);
  }

  function clearTreeDropIndicator() {
    clearTreeAutoExpandTimer();
    if (state.treeUi.dragHoverRelId) {
      const previousRow = dom.treeContainer.querySelector(`.tree-row[data-rel-id="${cssEscape(state.treeUi.dragHoverRelId)}"]`);
      if (previousRow instanceof HTMLElement) {
        delete previousRow.dataset.dropPosition;
      }
    }
    state.treeUi.dragHoverRelId = "";
    state.treeUi.dragDropPosition = "";
    hideTreeDragTooltip();
  }

  function scheduleTreeAutoExpand(item, placement) {
    const shouldExpand = Boolean(
      item
      && item.hasChildren
      && isTreeNodeCollapsed(item.relId)
      && normalizeTreeDropPlacement(placement) === "inside"
    );
    if (!shouldExpand) {
      clearTreeAutoExpandTimer();
      return;
    }

    if (state.treeUi.dragAutoExpandRelId === item.relId && state.treeUi.dragAutoExpandTimer) {
      return;
    }
    clearTreeAutoExpandTimer();
    state.treeUi.dragAutoExpandRelId = item.relId;
    state.treeUi.dragAutoExpandTimer = window.setTimeout(() => {
      state.treeUi.dragAutoExpandTimer = 0;
      const relId = String(state.treeUi.dragAutoExpandRelId || "").trim();
      state.treeUi.dragAutoExpandRelId = "";
      if (!relId || !isTreeNodeCollapsed(relId)) {
        return;
      }
      delete state.treeUi.collapsedByRelId[relId];
      renderTree(state.lastTreeSnapshot, state.treeUi.query || "");
    }, TREE_AUTO_EXPAND_DELAY_MS);
  }

  function clearTreeAutoExpandTimer() {
    if (!state.treeUi.dragAutoExpandTimer) {
      state.treeUi.dragAutoExpandRelId = "";
      return;
    }
    clearTimeout(state.treeUi.dragAutoExpandTimer);
    state.treeUi.dragAutoExpandTimer = 0;
    state.treeUi.dragAutoExpandRelId = "";
  }

  function clearTreeDragState() {
    clearTreeAutoExpandTimer();
    state.treeUi.dragging = false;
    state.treeUi.dragSourceRelId = "";
    state.treeUi.dragHoverRelId = "";
    state.treeUi.dragDropPosition = "";
    if (state.treeUi.dragSourceRow instanceof Element) {
      state.treeUi.dragSourceRow.classList.remove("drag-source");
    }
    state.treeUi.dragSourceRow = null;
    hideTreeDragTooltip();
  }

  function getTreeDropActionLabel(placement) {
    const normalized = normalizeTreeDropPlacement(placement);
    if (normalized === "before") {
      return "Insert before";
    }
    if (normalized === "after") {
      return "Insert after";
    }
    return "Nest inside";
  }

  function markActiveTreeNode(relId) {
    const rows = dom.treeContainer.querySelectorAll(".tree-row");
    for (const row of rows) {
      const isActive = row.getAttribute("data-rel-id") === relId;
      row.classList.toggle("active", isActive);
      const nodeBtn = row.querySelector(".tree-node");
      if (nodeBtn) {
        nodeBtn.classList.toggle("active", isActive);
      }
    }
  }

  function formatTreeLabel(item) {
    const id = item.id ? `#${item.id}` : "";
    const cls = item.className
      ? `.${String(item.className).trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
    return `${item.tagName}${id}${cls}`;
  }

  function applyPatchToOverlay() {
    if (!state.overlayReady) {
      return;
    }

    sendToOverlay({
      type: "REL_APPLY_PATCH",
      payload: {
        elementsMap: state.elementsMap,
        attributesMeta: state.attributesMeta,
        linksMeta: state.linksMeta,
        textOverrides: state.textOverrides,
        addedNodes: state.addedNodes,
        deletedNodes: state.deletedNodes,
        movedNodes: state.movedNodes,
        runtimeLibraries: state.runtimeLibraries,
        runtimeFonts: state.runtimeFonts,
        themeCss: buildThemeCss(state.theme),
      },
    });

    for (const relId of Object.keys(state.overridesMeta)) {
      const props = state.overridesMeta[relId] || {};
      for (const property of Object.keys(props)) {
        if (isStyleMetadataKey(property)) {
          continue;
        }
        sendToOverlay({
          type: "REL_APPLY_STYLE",
          payload: { relId, property, value: props[property] },
        });
      }
    }
  }

  function syncLibraryControlsFromState() {
    const libs = normalizeRuntimeLibraries(state.runtimeLibraries || state.defaultsLibraries);
    state.runtimeLibraries = libs;
    dom.designLibrarySelect.value = libs.designLibrary;
    dom.iconSetSelect.value = libs.iconSet;
    dom.animateCssCheckbox.checked = libs.animateCss;
    dom.bootstrapJsCheckbox.checked = libs.bootstrapJs;
    dom.bootstrapJsCheckbox.disabled = libs.designLibrary !== "bootstrap";
  }

  function updateRuntimeLibrariesFromControls() {
    const libs = normalizeRuntimeLibraries({
      designLibrary: dom.designLibrarySelect.value,
      iconSet: dom.iconSetSelect.value,
      animateCss: dom.animateCssCheckbox.checked,
      bootstrapJs: dom.bootstrapJsCheckbox.checked,
    });

    if (libs.designLibrary !== "bootstrap") {
      libs.bootstrapJs = false;
    }

    const changed = JSON.stringify(libs) !== JSON.stringify(state.runtimeLibraries);
    state.runtimeLibraries = libs;
    syncLibraryControlsFromState();
    buildAddPanel();

    if (changed) {
      setStatus("Runtime libraries updated");
    }

    sendToOverlay({
      type: "REL_SET_LIBRARIES",
      payload: {
        runtimeLibraries: state.runtimeLibraries,
      },
    });
  }

  function syncFontControlsFromState() {
    const fonts = normalizeRuntimeFonts(state.runtimeFonts || state.defaultsFonts);
    state.runtimeFonts = fonts;

    dom.fontLibrarySelect.value = fonts.provider;
    const isProviderActive = fonts.provider !== "none";
    dom.fontLibraryFamilyRow.classList.toggle("hidden", !isProviderActive);
    dom.fontLibraryFamilyInput.disabled = !isProviderActive;
    dom.addFontFamilyBtn.disabled = !isProviderActive;
    dom.fontLibraryFamilyInput.placeholder = getFontFamilyPlaceholder(fonts.provider);

    renderToolbarFontFamilies(fonts);
    rebuildFontFamilyOptions(state.controls.fontFamilySelect ? state.controls.fontFamilySelect.value : "");
    rebuildThemeFontPresetOptions();
    const activeTheme = getActiveThemePreset();
    setThemeFontSelectValue(dom.themeBodyFontSelect, activeTheme.fonts.bodyFamily);
    setThemeFontSelectValue(dom.themeHeadingFontSelect, activeTheme.fonts.headingFamily);
  }

  function updateRuntimeFontsFromControls() {
    const nextProvider = normalizeEnumValue(dom.fontLibrarySelect.value, ["none", "google", "bunny", "adobe-edge"], "none");
    const families = nextProvider === "none" ? [] : ensureFontFamilies(state.runtimeFonts.families);
    const nextFonts = normalizeRuntimeFonts({
      provider: nextProvider,
      families,
    });

    const changed = JSON.stringify(nextFonts) !== JSON.stringify(state.runtimeFonts);
    state.runtimeFonts = nextFonts;
    syncFontControlsFromState();

    if (changed) {
      setStatus("Runtime fonts updated");
    }

    sendRuntimeFontsToOverlay();
  }

  function addFontFamilyFromToolbar() {
    const provider = state.runtimeFonts.provider;
    if (provider === "none") {
      setStatus("Select a font provider first", true);
      return;
    }

    const rawFamily = String(dom.fontLibraryFamilyInput.value || "").trim();
    const family = normalizeFontFamilyName(rawFamily);
    if (!family) {
      return;
    }

    const families = ensureFontFamilies(state.runtimeFonts.families);
    const exists = families.some((item) => item.toLowerCase() === family.toLowerCase());
    if (!exists) {
      families.push(family);
      state.runtimeFonts = normalizeRuntimeFonts({
        provider,
        families,
      });
      setStatus(`Loaded font: ${family}`);
    } else {
      setStatus(`Font already loaded: ${family}`);
    }

    dom.fontLibraryFamilyInput.value = "";
    syncFontControlsFromState();
    sendRuntimeFontsToOverlay();
  }

  function renderToolbarFontFamilies(fonts) {
    dom.fontFamiliesList.innerHTML = "";
    const families = ensureFontFamilies(fonts.families);
    if (families.length === 0) {
      const empty = document.createElement("span");
      empty.className = "add-item-desc";
      empty.textContent = "No fonts loaded";
      dom.fontFamiliesList.appendChild(empty);
      return;
    }

    for (const family of families) {
      const chip = document.createElement("span");
      chip.className = "font-chip";
      chip.textContent = family;
      dom.fontFamiliesList.appendChild(chip);
    }
  }

  function autoLoadPendingFontFamily() {
    const pendingFamily = normalizeFontFamilyName(state.controls.pendingUnloadedFontFamily);
    if (!pendingFamily) {
      return;
    }

    let provider = state.runtimeFonts.provider;
    if (provider === "none") {
      provider = "google";
    }

    const families = ensureFontFamilies(state.runtimeFonts.families);
    if (!families.some((item) => item.toLowerCase() === pendingFamily.toLowerCase())) {
      families.push(pendingFamily);
    }

    state.runtimeFonts = normalizeRuntimeFonts({
      provider,
      families,
    });

    syncFontControlsFromState();
    sendRuntimeFontsToOverlay();

    const targetValue = buildExternalFontFamilyValue(pendingFamily);
    rebuildFontFamilyOptions(targetValue);
    if (state.controls.fontFamilySelect) {
      state.controls.fontFamilySelect.value = targetValue;
    }
    if (state.selectedRelId) {
      applyStyle("font-family", targetValue);
    }
    setStatus(`Loaded font: ${pendingFamily}`);
  }

  function sendRuntimeFontsToOverlay() {
    sendToOverlay({
      type: "REL_SET_FONTS",
      payload: {
        runtimeFonts: state.runtimeFonts,
      },
    });
  }

  function getFontFamilyPlaceholder(provider) {
    if (provider === "google") {
      return "Poppins";
    }
    if (provider === "bunny") {
      return "Nunito";
    }
    if (provider === "adobe-edge") {
      return "Source Sans Pro";
    }
    return "Font family";
  }

  function buildOverrideCss(overridesMeta, themeState, options) {
    const opts = options && typeof options === "object" ? options : {};
    const lines = [];
    const themeCss = String(buildThemeCss(themeState || createDefaultThemeState()) || "").trim();
    if (themeCss) {
      lines.push(themeCss);
      lines.push("");
    }
    const relIds = Object.keys(overridesMeta).sort();

    for (const relId of relIds) {
      const props = overridesMeta[relId] || {};
      const entries = Object.entries(props)
        .filter(([property]) => !isStyleMetadataKey(property))
        .map(([property, value]) => [property, normalizeRgbaAlphaInCssValue(String(value ?? ""))])
        .filter(([, value]) => String(value).trim() !== "");
      if (entries.length === 0) {
        continue;
      }

      lines.push(`[data-rel-id="${cssEscape(relId)}"] {`);
      for (const [property, value] of entries) {
        const needsImportant = shouldUseImportantInOverride(property, value);
        lines.push(`  ${property}: ${value}${needsImportant ? " !important" : ""};`);
      }
      lines.push("}");
      lines.push("");
    }

    const viteGlobalLines = buildViteGlobalOverrideBlock(overridesMeta, opts);
    if (viteGlobalLines.length > 0) {
      lines.push(...viteGlobalLines);
      lines.push("");
    }

    return lines.join("\n");
  }

  function buildViteGlobalOverrideBlock(overridesMeta, options) {
    if (normalizeProjectType(options.projectType) !== PROJECT_TYPE_VITE_REACT_STYLE) {
      return [];
    }

    const selectorMap = ensurePlainObject(options.selectorMap);
    const elementsMap = ensurePlainObject(options.elementsMap);
    const relIds = Object.keys(overridesMeta || {}).sort();
    const bodyOverrides = {};

    for (const relId of relIds) {
      const selector = String(selectorMap[relId] || elementsMap[relId] || "").trim();
      if (!isBodySelector(selector)) {
        continue;
      }
      const props = ensurePlainObject(overridesMeta[relId]);
      for (const key of VITE_GLOBAL_TARGET_PROPS) {
        const value = String(props[key] ?? "").trim();
        if (!value) {
          continue;
        }
        bodyOverrides[key] = normalizeRgbaAlphaInCssValue(value);
      }
    }

    const declarations = VITE_GLOBAL_TARGET_PROPS
      .map((key) => [key, String(bodyOverrides[key] || "").trim()])
      .filter(([, value]) => value);

    if (declarations.length === 0) {
      return [];
    }

    const lines = [
      "/* [REL VITE] Global background/color override for Vite root containers */",
      "html,",
      "body,",
      "#root,",
      "#root > * {",
    ];
    for (const [property, value] of declarations) {
      lines.push(`  ${property}: ${value} !important;`);
    }
    lines.push("}");
    return lines;
  }

  function isBodySelector(selector) {
    const normalized = String(selector || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!normalized) {
      return false;
    }
    if (normalized === "body" || normalized === "html body") {
      return true;
    }
    if (normalized.startsWith("body:") || normalized.startsWith("html body:")) {
      return true;
    }
    return false;
  }

  function upsertAttributeMeta(relId, field, value) {
    if (!state.attributesMeta[relId]) {
      state.attributesMeta[relId] = {};
    }

    if (String(value).trim() === "") {
      delete state.attributesMeta[relId][field];
    } else {
      state.attributesMeta[relId][field] = value;
    }

    if (Object.keys(state.attributesMeta[relId]).length === 0) {
      delete state.attributesMeta[relId];
    }
  }

  function normalizeAttributeValue(field, rawValue) {
    const trimmed = String(rawValue || "").trim();
    if (field === "class") {
      return trimmed.split(/\s+/).filter(Boolean).join(" ");
    }
    if (field === "src") {
      if (trimmed.startsWith("/project/")) {
        return trimmed.slice("/project/".length);
      }
      return trimmed;
    }
    return trimmed;
  }

  function idExistsInSnapshot(idValue, excludeRelId) {
    const normalized = String(idValue || "").trim();
    if (!normalized) {
      return false;
    }
    return state.lastTreeSnapshot.some((node) => node.id === normalized && node.relId !== excludeRelId);
  }

  function getEffectiveValue(overrideValue, fallbackValue) {
    return typeof overrideValue === "undefined" ? fallbackValue : overrideValue;
  }

  function normalizeLoadedPatch(rawPatch) {
    const patch = rawPatch && typeof rawPatch === "object" ? rawPatch : {};
    const linksMeta = ensurePlainObject(patch.linksMeta || patch.links_meta);
    const runtimeLibraries =
      patch.runtimeLibraries ||
      patch.runtime_libraries ||
      null;
    const runtimeFonts =
      patch.runtimeFonts ||
      patch.runtime_fonts ||
      null;
    const selectorMap =
      patch.selectorMap ||
      patch.selector_map ||
      null;
    const attributeOverrides =
      patch.attributeOverrides ||
      patch.attribute_overrides ||
      null;
    const textOverrides =
      patch.textOverrides ||
      patch.text_overrides ||
      null;
    const theme =
      patch.theme ||
      patch.Theme ||
      null;

    return {
      version: Number(patch.version || 1),
      elementsMap: ensurePlainObject(patch.elementsMap || patch.elements),
      selectorMap: normalizeSelectorMap(selectorMap),
      overridesMeta: ensurePlainObject(patch.overridesMeta || patch.overrides_meta),
      attributesMeta: ensurePlainObject(patch.attributesMeta || patch.attributes_meta),
      linksMeta,
      attributeOverrides: normalizeAttributeOverrides(attributeOverrides, linksMeta),
      textOverrides: normalizeTextOverrides(textOverrides),
      addedNodes: ensureArray(patch.addedNodes || patch.added_nodes),
      deletedNodes: ensureArray(patch.deletedNodes || patch.deleted_nodes),
      movedNodes: normalizeMovedNodes(ensureArray(patch.movedNodes || patch.moved_nodes)),
      runtimeLibraries: runtimeLibraries ? normalizeRuntimeLibraries(runtimeLibraries) : null,
      runtimeFonts: runtimeFonts ? normalizeRuntimeFonts(runtimeFonts) : null,
      theme: theme ? normalizeThemeState(theme) : null,
    };
  }

  function normalizeSelectorMap(value) {
    const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const result = {};
    for (const [relId, selectorValue] of Object.entries(raw)) {
      const safeRelId = String(relId || "").trim();
      const safeSelector = String(selectorValue || "").trim();
      if (!safeRelId || !safeSelector) {
        continue;
      }
      result[safeRelId] = safeSelector;
    }
    return result;
  }

  function normalizeAttributeOverrides(value, fallbackLinksMeta) {
    const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const result = {};

    for (const [relId, attrs] of Object.entries(raw)) {
      const safeRelId = String(relId || "").trim();
      if (!safeRelId) {
        continue;
      }
      const normalizedEntry = normalizeLinkAttributeEntry(attrs);
      if (!normalizedEntry) {
        continue;
      }
      result[safeRelId] = normalizedEntry;
    }

    const legacyLinks = fallbackLinksMeta && typeof fallbackLinksMeta === "object" ? fallbackLinksMeta : {};
    for (const [relId, linkValue] of Object.entries(legacyLinks)) {
      const safeRelId = String(relId || "").trim();
      if (!safeRelId || result[safeRelId]) {
        continue;
      }
      const normalizedEntry = normalizeLinkAttributeEntry(linkValue);
      if (!normalizedEntry) {
        continue;
      }
      result[safeRelId] = normalizedEntry;
    }

    return result;
  }

  function normalizeLinkAttributeEntry(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    const hasAnyField =
      Object.prototype.hasOwnProperty.call(value, "href") ||
      Object.prototype.hasOwnProperty.call(value, "target") ||
      Object.prototype.hasOwnProperty.call(value, "rel") ||
      Object.prototype.hasOwnProperty.call(value, "title");
    if (!hasAnyField) {
      return null;
    }

    return {
      href: String(value.href || "").trim(),
      target: String(value.target || "").trim(),
      rel: String(value.rel || "").trim(),
      title: String(value.title || "").trim(),
    };
  }

  function normalizeTextOverrides(value) {
    const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const result = {};
    for (const [relId, entry] of Object.entries(raw)) {
      const safeRelId = String(relId || "").trim();
      if (!safeRelId || !entry || typeof entry !== "object") {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(entry, "text")) {
        continue;
      }
      result[safeRelId] = { text: String(entry.text || "") };
    }
    return result;
  }

  function shouldUseImportantInOverride(property, value) {
    const safeProperty = String(property || "").trim().toLowerCase();
    if (!BACKGROUND_IMPORTANT_PROPS.has(safeProperty)) {
      return false;
    }
    return !/\s!important\s*$/i.test(String(value || ""));
  }

  function normalizeMovedNodes(value) {
    const raw = Array.isArray(value) ? value : [];
    const result = [];
    for (const entry of raw) {
      const normalized = normalizeMovedNodeEntry(entry);
      if (!normalized) {
        continue;
      }
      result.push(normalized);
    }
    return result;
  }

  function normalizeMovedNodeEntry(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const sourceRelId = String(value.sourceRelId || value.relId || "").trim();
    const targetRelId = String(value.targetRelId || "").trim();
    const placement = normalizeTreeDropPlacement(value.placement);
    if (!sourceRelId || !targetRelId) {
      return null;
    }
    return {
      sourceRelId,
      targetRelId,
      placement,
      sourceFallbackSelector: String(value.sourceFallbackSelector || value.fallbackSelector || "").trim(),
      targetFallbackSelector: String(value.targetFallbackSelector || "").trim(),
      sourceStableSelector: String(value.sourceStableSelector || "").trim(),
      targetStableSelector: String(value.targetStableSelector || "").trim(),
      timestamp: Number(value.timestamp || Date.now()),
    };
  }

  function normalizeRuntimeLibraries(value) {
    const raw = value && typeof value === "object" ? value : {};
    const designLibrary = normalizeEnumValue(raw.designLibrary, ["none", "bootstrap", "bulma", "pico", "tailwind"], "none");
    const iconSet = normalizeEnumValue(raw.iconSet, ["none", "material-icons", "font-awesome"], "none");
    return {
      designLibrary,
      iconSet,
      animateCss: Boolean(raw.animateCss),
      bootstrapJs: Boolean(raw.bootstrapJs),
    };
  }

  function normalizeRuntimeFonts(value) {
    const raw = value && typeof value === "object" ? value : {};
    const provider = normalizeEnumValue(raw.provider, ["none", "google", "bunny", "adobe-edge"], "none");
    return {
      provider,
      families: provider === "none" ? [] : ensureFontFamilies(raw.families),
    };
  }

  function createDefaultThemeState() {
    const preset = createDefaultThemePreset();
    return {
      applied: false,
      activeThemeId: preset.id,
      themes: [preset],
    };
  }

  function createDefaultThemePreset() {
    const colors = {};
    for (const def of THEME_COLOR_DEFS) {
      colors[def.key] = def.fallback;
    }
    return {
      id: "theme-default",
      name: "Default Theme",
      colors,
      customColors: {},
      fonts: { ...DEFAULT_THEME_FONTS },
    };
  }

  function cloneThemePreset(preset) {
    const normalized = normalizeThemePreset(preset, createDefaultThemePreset().id);
    return {
      id: normalized.id,
      name: normalized.name,
      colors: { ...normalized.colors },
      customColors: { ...normalized.customColors },
      fonts: { ...normalized.fonts },
    };
  }

  function normalizeThemeState(value) {
    const raw = value && typeof value === "object" ? value : {};
    const rawThemes = Array.isArray(raw.themes) ? raw.themes : [];
    const themes = rawThemes
      .map((item, index) => normalizeThemePreset(item, `theme-${index + 1}`))
      .filter((item) => item.id);

    if (themes.length === 0) {
      const preset = createDefaultThemePreset();
      return {
        applied: Boolean(raw.applied),
        activeThemeId: preset.id,
        themes: [preset],
      };
    }

    const activeThemeId = String(raw.activeThemeId || "").trim();
    const active = themes.find((item) => item.id === activeThemeId) ? activeThemeId : themes[0].id;

    return {
      applied: Boolean(raw.applied),
      activeThemeId: active,
      themes,
    };
  }

  function normalizeThemePreset(value, fallbackId) {
    const raw = value && typeof value === "object" ? value : {};
    const id = String(raw.id || fallbackId || "").trim() || generateId("theme");
    const name = String(raw.name || "Theme").trim() || "Theme";
    return {
      id,
      name,
      colors: normalizeThemeColors(raw.colors),
      customColors: normalizeCustomThemeColors(raw.customColors || raw.custom_colors),
      fonts: normalizeThemeFonts(raw.fonts),
    };
  }

  function normalizeThemeColors(value) {
    const raw = value && typeof value === "object" ? value : {};
    const colors = {};
    for (const def of THEME_COLOR_DEFS) {
      colors[def.key] = normalizeHexColor(raw[def.key], def.fallback);
    }
    return colors;
  }

  function normalizeCustomThemeColors(value) {
    const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const result = {};
    for (const key of Object.keys(raw)) {
      const safeKey = sanitizeCustomColorName(key);
      if (!safeKey) {
        continue;
      }
      result[safeKey] = normalizeHexColor(raw[key], "#000000");
    }
    return result;
  }

  function normalizeThemeFonts(value) {
    const raw = value && typeof value === "object" ? value : {};
    return {
      bodyFamily: normalizeFontFamilyValue(raw.bodyFamily, DEFAULT_THEME_FONTS.bodyFamily),
      headingFamily: normalizeFontFamilyValue(raw.headingFamily, DEFAULT_THEME_FONTS.headingFamily),
      bodySize: normalizeCssLength(raw.bodySize, DEFAULT_THEME_FONTS.bodySize),
      h1Size: normalizeCssLength(raw.h1Size, DEFAULT_THEME_FONTS.h1Size),
      h2Size: normalizeCssLength(raw.h2Size, DEFAULT_THEME_FONTS.h2Size),
      h3Size: normalizeCssLength(raw.h3Size, DEFAULT_THEME_FONTS.h3Size),
      smallSize: normalizeCssLength(raw.smallSize, DEFAULT_THEME_FONTS.smallSize),
      lineHeight: normalizeLineHeight(raw.lineHeight, DEFAULT_THEME_FONTS.lineHeight),
    };
  }

  function normalizeFontFamilyValue(value, fallback) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return fallback;
    }
    return normalized;
  }

  function normalizeCssLength(value, fallback) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return fallback;
    }
    return normalized;
  }

  function normalizeLineHeight(value, fallback) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return fallback;
    }
    return normalized;
  }

  function normalizeHexColor(value, fallback) {
    const normalized = toHexColor(value, fallback || "#000000");
    return normalized || (fallback || "#000000");
  }

  function getActiveThemePreset() {
    state.theme = normalizeThemeState(state.theme);
    return state.theme.themes.find((item) => item.id === state.theme.activeThemeId) || state.theme.themes[0];
  }

  function buildThemeExternalFontFamilyValue(family) {
    const normalized = normalizeFontFamilyName(family);
    if (!normalized) {
      return DEFAULT_THEME_FONTS.bodyFamily;
    }
    return `"${normalized.replace(/"/g, '\\"')}", system-ui, sans-serif`;
  }

  function ensureFontFamilies(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    const unique = [];
    const seen = new Set();
    for (const item of value) {
      const normalized = normalizeFontFamilyName(item);
      if (!normalized) {
        continue;
      }
      const key = normalized.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(normalized);
    }
    return unique;
  }

  function normalizeFontFamilyName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function buildExternalFontFamilyValue(family) {
    const normalized = normalizeFontFamilyName(family);
    if (!normalized) {
      return "";
    }
    return `"${normalized.replace(/"/g, '\\"')}", sans-serif`;
  }

  function resolvePrimaryFontFamily(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    const firstPart = raw.split(",")[0] || "";
    return normalizeFontFamilyName(firstPart.replace(/^['"]+|['"]+$/g, ""));
  }

  function isLoadedRuntimeFontFamily(family) {
    const target = normalizeFontFamilyName(family).toLowerCase();
    if (!target) {
      return false;
    }
    return ensureFontFamilies(state.runtimeFonts.families).some((item) => item.toLowerCase() === target);
  }

  function normalizeLayerOrder(value) {
    const parsed = Number(String(value ?? "").trim());
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return clamp(Math.round(parsed), LAYER_ORDER_MIN, LAYER_ORDER_MAX);
  }

  function isRootLikeLayerSelection(selection) {
    const tagName = String(selection?.tagName || "").trim().toLowerCase();
    return ROOT_LIKE_LAYER_TAGS.has(tagName);
  }

  function ensurePositionOverrideForLayerOrder(relId) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }

    const overrides = ensurePlainObject(state.overridesMeta[safeRelId]);
    const overridePosition = String(overrides.position ?? "").trim().toLowerCase();
    const computedPosition = String(state.lastSelection?.computed?.position ?? "").trim().toLowerCase();
    const effectivePosition = overridePosition || computedPosition || "static";

    if (effectivePosition !== "static") {
      return;
    }

    const previousPosition = String(overrides.position ?? "").trim();

    applyStyleForRelId(safeRelId, "position", "relative");
    setStyleMetadataValue(safeRelId, ORDER_AUTO_POSITION_META_KEY, true);
    setStyleMetadataValue(
      safeRelId,
      ORDER_AUTO_POSITION_PREV_META_KEY,
      previousPosition || null
    );
  }

  function clearAutoPositionForLayerOrder(relId) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }

    const overrides = ensurePlainObject(state.overridesMeta[safeRelId]);
    if (!isStyleMetadataTrue(overrides[ORDER_AUTO_POSITION_META_KEY])) {
      return;
    }

    const overridePosition = String(overrides.position ?? "").trim().toLowerCase();
    const previousPosition = String(overrides[ORDER_AUTO_POSITION_PREV_META_KEY] ?? "").trim();
    if (overridePosition === "relative") {
      applyStyleForRelId(safeRelId, "position", previousPosition);
    }
    clearStyleMetadataValue(safeRelId, ORDER_AUTO_POSITION_META_KEY);
    clearStyleMetadataValue(safeRelId, ORDER_AUTO_POSITION_PREV_META_KEY);
  }

  function normalizeBackgroundMode(value) {
    const mode = String(value || "").trim().toLowerCase();
    if (mode === "gradient") {
      return "gradient";
    }
    if (mode === "image") {
      return "image";
    }
    return "solid";
  }

  function normalizeBackgroundImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    if (/^url\s*\(/i.test(raw)) {
      return extractBackgroundImageUrl(raw);
    }

    if (raw.startsWith("/project/")) {
      return raw.slice("/project/".length);
    }

    return raw;
  }

  function buildCssBackgroundImageUrl(value) {
    const raw = normalizeBackgroundImageUrl(value);
    if (!raw) {
      return "";
    }
    const escaped = raw.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    return `url("${escaped}")`;
  }

  function extractBackgroundImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw || raw.toLowerCase() === "none") {
      return "";
    }

    const match = raw.match(/url\((.+)\)/i);
    if (!match || !match[1]) {
      return "";
    }
    return String(match[1]).trim().replace(/^['"]|['"]$/g, "");
  }

  function isBackgroundImageValue(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || normalized === "none") {
      return false;
    }
    return normalized.includes("url(");
  }

  function resolveBackgroundDraft(relId, overrides, computed) {
    const safeRelId = String(relId || "").trim();
    const safeOverrides = overrides && typeof overrides === "object" ? overrides : {};
    const safeComputed = computed && typeof computed === "object" ? computed : {};
    const stored = safeRelId ? ensurePlainObject(state.overridesMeta[safeRelId]) : {};

    const overrideBackground = String(safeOverrides.background ?? "").trim();
    const computedBackground = String(safeComputed.background ?? "").trim();
    const overrideBackgroundColor = String(safeOverrides["background-color"] ?? "").trim();
    const computedBackgroundColor = String(safeComputed["background-color"] ?? "").trim();
    const overrideBackgroundImage = String(safeOverrides["background-image"] ?? "").trim();
    const computedBackgroundImage = String(safeComputed["background-image"] ?? "").trim();

    const colorFallback = overrideBackgroundColor ||
      (!isGradientValue(overrideBackground) && !isBackgroundImageValue(overrideBackground) ? overrideBackground : "") ||
      computedBackgroundColor;
    const gradientFallback = isGradientValue(overrideBackground)
      ? overrideBackground
      : (isGradientValue(computedBackground) ? computedBackground : (isGradientValue(computedBackgroundImage) ? computedBackgroundImage : ""));
    const imageFallback = extractBackgroundImageUrl(overrideBackgroundImage) || extractBackgroundImageUrl(computedBackgroundImage);

    const solid = toHexColor(
      stored[BG_META_SOLID_KEY] ??
      colorFallback,
      "#ffffff"
    );
    const gradient = String(stored[BG_META_GRADIENT_KEY] ?? gradientFallback).trim();
    const imageUrl = normalizeBackgroundImageUrl(String(stored[BG_META_IMAGE_URL_KEY] ?? imageFallback).trim());
    const imageEnabledRaw = stored[BG_META_IMAGE_ENABLED_KEY];
    const imageEnabled = typeof imageEnabledRaw === "boolean"
      ? imageEnabledRaw
      : (String(imageEnabledRaw || "").trim() === "" ? Boolean(imageUrl) : ["true", "1", "yes"].includes(String(imageEnabledRaw).trim().toLowerCase()));
    const imageSize = normalizeEnumValue(
      stored[BG_META_IMAGE_SIZE_KEY] ?? safeOverrides["background-size"] ?? safeComputed["background-size"],
      BG_SIZE_OPTIONS,
      "cover"
    );
    const imagePosition = normalizeEnumValue(
      stored[BG_META_IMAGE_POSITION_KEY] ?? safeOverrides["background-position"] ?? safeComputed["background-position"],
      BG_POSITION_OPTIONS,
      "center"
    );
    const imageRepeat = normalizeEnumValue(
      stored[BG_META_IMAGE_REPEAT_KEY] ?? safeOverrides["background-repeat"] ?? safeComputed["background-repeat"],
      BG_REPEAT_OPTIONS,
      "no-repeat"
    );

    return {
      solid,
      gradient,
      imageEnabled,
      imageUrl,
      imageSize,
      imagePosition,
      imageRepeat,
    };
  }

  function readBackgroundDraftFromControls() {
    return {
      solid: toHexColor(state.controls.backgroundSolidInput?.value, "#ffffff"),
      gradient: String(state.controls.backgroundGradientInput?.value || "").trim(),
      imageEnabled: Boolean(state.controls.backgroundImageToggle?.checked),
      imageUrl: normalizeBackgroundImageUrl(state.controls.backgroundImageUrlInput?.value),
      imageSize: normalizeEnumValue(state.controls.backgroundImageSizeInput?.value, BG_SIZE_OPTIONS, "cover"),
      imagePosition: normalizeEnumValue(state.controls.backgroundImagePositionInput?.value, BG_POSITION_OPTIONS, "center"),
      imageRepeat: normalizeEnumValue(state.controls.backgroundImageRepeatInput?.value, BG_REPEAT_OPTIONS, "no-repeat"),
    };
  }

  function writeBackgroundDraftMeta(relId, draft) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }

    const safeDraft = draft && typeof draft === "object" ? draft : {};
    setStyleMetadataValue(safeRelId, BG_META_SOLID_KEY, String(safeDraft.solid || "").trim() || null);
    setStyleMetadataValue(safeRelId, BG_META_GRADIENT_KEY, String(safeDraft.gradient || "").trim() || null);
    setStyleMetadataValue(safeRelId, BG_META_IMAGE_ENABLED_KEY, Boolean(safeDraft.imageEnabled));
    setStyleMetadataValue(safeRelId, BG_META_IMAGE_URL_KEY, String(safeDraft.imageUrl || "").trim() || null);
    setStyleMetadataValue(safeRelId, BG_META_IMAGE_SIZE_KEY, String(safeDraft.imageSize || "").trim() || null);
    setStyleMetadataValue(safeRelId, BG_META_IMAGE_POSITION_KEY, String(safeDraft.imagePosition || "").trim() || null);
    setStyleMetadataValue(safeRelId, BG_META_IMAGE_REPEAT_KEY, String(safeDraft.imageRepeat || "").trim() || null);
  }

  function isStyleMetadataKey(property) {
    return String(property || "").trim().startsWith("_");
  }

  function isStyleMetadataTrue(value) {
    if (typeof value === "boolean") {
      return value;
    }
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  function setStyleMetadataValue(relId, key, value) {
    const safeRelId = String(relId || "").trim();
    const safeKey = String(key || "").trim();
    if (!safeRelId || !safeKey || !isStyleMetadataKey(safeKey)) {
      return;
    }

    if (!state.overridesMeta[safeRelId]) {
      state.overridesMeta[safeRelId] = {};
    }

    if (value == null || (typeof value === "string" && value.trim() === "")) {
      delete state.overridesMeta[safeRelId][safeKey];
    } else {
      state.overridesMeta[safeRelId][safeKey] = value;
    }

    if (Object.keys(state.overridesMeta[safeRelId]).length === 0) {
      delete state.overridesMeta[safeRelId];
    }
  }

  function clearStyleMetadataValue(relId, key) {
    setStyleMetadataValue(relId, key, null);
  }

  function isGradientValue(value) {
    return /gradient\s*\(/i.test(String(value || ""));
  }

  function detectBackgroundMode(overrides, computed) {
    const overrideBackground = String(overrides.background ?? "").trim();
    const overrideBackgroundImage = String(overrides["background-image"] ?? "").trim();
    const computedBackgroundImage = String(computed["background-image"] ?? "").trim();
    if (isBackgroundImageValue(overrideBackgroundImage)) {
      return "image";
    }
    if (isGradientValue(overrideBackgroundImage)) {
      return "gradient";
    }
    if (isGradientValue(overrideBackground)) {
      return "gradient";
    }
    if (overrideBackgroundImage.toLowerCase() === "none") {
      return "solid";
    }
    if (!overrideBackground && isGradientValue(computedBackgroundImage)) {
      return "gradient";
    }
    if (isBackgroundImageValue(computedBackgroundImage)) {
      return "image";
    }
    return "solid";
  }

  function toHexColor(value, fallback) {
    const input = String(value || "").trim();
    if (!input) {
      return fallback || "#ffffff";
    }

    const hexMatch = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const raw = hexMatch[1];
      if (raw.length === 3) {
        return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
      }
      return `#${raw.toLowerCase()}`;
    }

    const rgbMatch = input.match(/^rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i);
    if (rgbMatch) {
      const alpha = typeof rgbMatch[4] === "string" ? Number(rgbMatch[4]) : 1;
      if (Number.isFinite(alpha) && alpha <= 0) {
        return fallback || "#ffffff";
      }
      const r = clamp(Number(rgbMatch[1]), 0, 255);
      const g = clamp(Number(rgbMatch[2]), 0, 255);
      const b = clamp(Number(rgbMatch[3]), 0, 255);
      const toHex = (n) => Number(n).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    return fallback || "#ffffff";
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

  function normalizeEnumValue(input, allowed, fallback) {
    const value = String(input || "").trim().toLowerCase();
    return allowed.includes(value) ? value : fallback;
  }

  function hasPatchContent() {
    const runtimeDiff = JSON.stringify(normalizeRuntimeLibraries(state.runtimeLibraries)) !== JSON.stringify(normalizeRuntimeLibraries(state.defaultsLibraries));
    const runtimeFontsDiff = JSON.stringify(normalizeRuntimeFonts(state.runtimeFonts)) !== JSON.stringify(normalizeRuntimeFonts(state.defaultsFonts));
    const themeDiff = JSON.stringify(normalizeThemeState(state.theme)) !== JSON.stringify(normalizeThemeState(state.defaultsTheme));
    return (
      Object.keys(state.overridesMeta).length > 0 ||
      Object.keys(state.selectorMap).length > 0 ||
      Object.keys(state.attributeOverrides).length > 0 ||
      Object.keys(state.textOverrides).length > 0 ||
      Object.keys(state.attributesMeta).length > 0 ||
      Object.keys(state.linksMeta).length > 0 ||
      state.addedNodes.length > 0 ||
      state.deletedNodes.length > 0 ||
      state.movedNodes.length > 0 ||
      runtimeDiff ||
      runtimeFontsDiff ||
      themeDiff
    );
  }

  function ensurePlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isEditableElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    if (element.closest("input, textarea, select")) {
      return true;
    }

    return element.isContentEditable;
  }

  function initResizableLayout() {
    const saved = loadLayoutFromStorage();
    if (saved) {
      applyLayoutWidths(saved.leftPx, saved.rightPx, false);
    } else {
      resetLayoutWidths(false);
    }

    dom.leftResizer.addEventListener("mousedown", (event) => {
      beginResize("left", event);
    });

    dom.rightResizer.addEventListener("mousedown", (event) => {
      beginResize("right", event);
    });

    window.addEventListener("resize", () => {
      const left = state.layout.leftPx;
      const right = state.layout.rightPx;
      if (left != null && right != null) {
        applyLayoutWidths(left, right, false);
      }
    });
  }

  function beginResize(side, event) {
    if (window.innerWidth <= 1200) {
      return;
    }

    event.preventDefault();
    state.layout.resizeSide = side;
    state.layout.pendingClientX = event.clientX;

    if (!state.layout.moveHandler) {
      state.layout.moveHandler = (moveEvent) => {
        state.layout.pendingClientX = moveEvent.clientX;
        if (!state.layout.rafId) {
          state.layout.rafId = window.requestAnimationFrame(() => {
            state.layout.rafId = 0;
            applyDragResize();
          });
        }
      };
    }

    if (!state.layout.upHandler) {
      state.layout.upHandler = () => {
        finishResize();
      };
    }

    dom.resizeOverlay.classList.remove("hidden");
    dom.resizeOverlay.addEventListener("mousemove", state.layout.moveHandler, true);
    dom.resizeOverlay.addEventListener("mouseup", state.layout.upHandler, true);
    window.addEventListener("mouseup", state.layout.upHandler, true);
  }

  function applyDragResize() {
    const rect = dom.layoutRoot.getBoundingClientRect();
    const side = state.layout.resizeSide;
    if (!side || rect.width <= 0) {
      return;
    }

    const currentLeft = state.layout.leftPx != null ? state.layout.leftPx : rect.width * 0.25;
    const currentRight = state.layout.rightPx != null ? state.layout.rightPx : rect.width * 0.25;

    if (side === "left") {
      const requestedLeft = state.layout.pendingClientX - rect.left;
      applyLayoutWidths(requestedLeft, currentRight, false, "left");
      return;
    }

    const requestedRight = rect.right - state.layout.pendingClientX;
    applyLayoutWidths(currentLeft, requestedRight, false, "right");
  }

  function finishResize() {
    dom.resizeOverlay.removeEventListener("mousemove", state.layout.moveHandler, true);
    dom.resizeOverlay.removeEventListener("mouseup", state.layout.upHandler, true);
    dom.resizeOverlay.classList.add("hidden");
    window.removeEventListener("mouseup", state.layout.upHandler, true);
    state.layout.resizeSide = null;
    if (state.layout.rafId) {
      cancelAnimationFrame(state.layout.rafId);
      state.layout.rafId = 0;
    }
    persistLayoutToStorage();
  }

  function applyLayoutWidths(leftPx, rightPx, save, priority) {
    const rect = dom.layoutRoot.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const normalized = normalizeLayoutWidths(leftPx, rightPx, rect.width, priority || "none");
    state.layout.leftPx = normalized.leftPx;
    state.layout.rightPx = normalized.rightPx;

    dom.layoutRoot.style.setProperty("--left-width", `${normalized.leftPx}px`);
    dom.layoutRoot.style.setProperty("--right-width", `${normalized.rightPx}px`);

    if (save) {
      persistLayoutToStorage();
    }
  }

  function normalizeLayoutWidths(leftPx, rightPx, layoutWidth, priority) {
    const maxTotal = Math.max(0, layoutWidth - RESIZER_TOTAL_PX - CENTER_MIN_PX);
    const leftMaxPercent = layoutWidth * 0.45;
    const rightMaxPercent = layoutWidth * 0.45;

    let left = clamp(leftPx, LEFT_MIN_PX, leftMaxPercent);
    let right = clamp(rightPx, RIGHT_MIN_PX, rightMaxPercent);

    if (left + right > maxTotal) {
      const overflow = left + right - maxTotal;
      if (priority === "left") {
        right -= overflow;
      } else if (priority === "right") {
        left -= overflow;
      } else {
        left -= overflow / 2;
        right -= overflow / 2;
      }
    }

    const relaxedLeftMin = Math.min(LEFT_MIN_PX, Math.max(80, maxTotal - RIGHT_MIN_PX));
    const relaxedRightMin = Math.min(RIGHT_MIN_PX, Math.max(80, maxTotal - LEFT_MIN_PX));

    left = clamp(left, relaxedLeftMin, leftMaxPercent);
    right = clamp(right, relaxedRightMin, rightMaxPercent);

    if (left + right > maxTotal) {
      if (priority === "left") {
        left = Math.max(relaxedLeftMin, maxTotal - right);
      } else {
        right = Math.max(relaxedRightMin, maxTotal - left);
      }
    }

    return {
      leftPx: Math.round(Math.max(80, left)),
      rightPx: Math.round(Math.max(80, right)),
    };
  }

  function loadLayoutFromStorage() {
    try {
      const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      const leftPx = Number(parsed.leftPx);
      const rightPx = Number(parsed.rightPx);
      if (!Number.isFinite(leftPx) || !Number.isFinite(rightPx)) {
        return null;
      }
      return { leftPx, rightPx };
    } catch {
      return null;
    }
  }

  function persistLayoutToStorage() {
    if (state.layout.leftPx == null || state.layout.rightPx == null) {
      return;
    }
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({
        leftPx: state.layout.leftPx,
        rightPx: state.layout.rightPx,
      })
    );
  }

  function resetLayoutWidths(save) {
    const rect = dom.layoutRoot.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const left = width * 0.25;
    const right = width * 0.25;
    applyLayoutWidths(left, right, save !== false, "none");
  }

  function clamp(value, min, max) {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : safeMin;
    const n = Number.isFinite(value) ? value : safeMin;
    if (safeMax < safeMin) {
      return safeMin;
    }
    return Math.min(safeMax, Math.max(safeMin, n));
  }

  function isValidUrl(url) {
    const value = String(url || "").trim();
    if (!value) {
      return true;
    }
    if (/\s/.test(value)) {
      return false;
    }
    if (/^(javascript|data|vbscript):/i.test(value)) {
      return false;
    }

    const schemeMatch = value.match(/^([a-z][a-z0-9+\-.]*):/i);
    if (schemeMatch) {
      const scheme = String(schemeMatch[1] || "").toLowerCase();
      return ["http", "https", "mailto", "tel"].includes(scheme);
    }

    if (/^(#|\/\/|\/|\.\/|\.\.\/)/.test(value)) {
      return true;
    }

    return true;
  }

  function sendToOverlay(message) {
    const iframeWindow = dom.iframe.contentWindow;
    if (!iframeWindow) {
      return;
    }
    iframeWindow.postMessage(message, window.location.origin);
  }

  function encodePath(filePath) {
    return String(filePath || "index.html")
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function cssEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function logVite(message) {
    if (state.projectType !== PROJECT_TYPE_VITE_REACT_STYLE) {
      return;
    }
    console.log(`[REL VITE] ${String(message || "").trim()}`);
  }

  function setStatus(message, isError) {
    dom.statusText.textContent = message;
    dom.statusText.style.color = isError ? "#a32b2b" : "#786a5b";
  }
})();
