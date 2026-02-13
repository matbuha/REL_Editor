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

  const KNOWN_SYSTEM_FAMILIES = new Set(
    SYSTEM_FONT_CHOICES.map((item) => item.family.toLowerCase())
  );

  const basicComponents = [
    { type: "section", name: "Section", description: "Structural section block", props: { text: "New section" } },
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

  const PATCH_VERSION = 3;
  const LAYOUT_STORAGE_KEY = "rel-editor-layout-v1";
  const LEFT_MIN_PX = 200;
  const RIGHT_MIN_PX = 260;
  const CENTER_MIN_PX = 320;
  const RESIZER_TOTAL_PX = 16;

  const state = {
    projectRoot: "",
    indexPath: "index.html",
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
    overridesMeta: {},
    attributesMeta: {},
    linksMeta: {},
    addedNodes: [],
    deletedNodes: [],
    lastSelection: null,
    lastTreeSnapshot: [],
    overlayReady: false,
    layout: {
      leftPx: null,
      rightPx: null,
      resizeSide: null,
      rafId: 0,
      pendingClientX: 0,
      moveHandler: null,
      upHandler: null,
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
      backgroundSolidInput: null,
      backgroundGradientInput: null,
      backgroundPreview: null,
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
    indexPathInput: document.getElementById("indexPathInput"),
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
    buildStyleControls();
    buildThemeManagerUi();
    clearSelectionUi();
    bindEvents();
    initResizableLayout();
    await loadProjectInfo();
    await loadPatchInfo();
    syncLibraryControlsFromState();
    syncFontControlsFromState();
    syncThemeUiFromState();
    buildAddPanel();
    loadIframe();
  }

  function bindEvents() {
    window.addEventListener("message", onMessageFromOverlay);
    window.addEventListener("keydown", onEditorKeyDown, true);

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
        fallbackSelector: state.elementsMap[state.selectedRelId] || "",
        source,
      },
    });
  }
  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-btn"));
    const contents = Array.from(document.querySelectorAll("[data-tab-content]"));

    for (const btn of buttons) {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-tab");
        for (const b of buttons) {
          b.classList.toggle("active", b === btn);
        }
        for (const c of contents) {
          c.classList.toggle("active", c.getAttribute("data-tab-content") === key);
        }
      });
    }
  }

  function buildThemeManagerUi() {
    renderThemePaletteRows();
    renderThemePresetOptions();
    renderPaletteVarOptions();
    rebuildThemeFontPresetOptions();
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
      return;
    }

    for (const [key, value] of customEntries) {
      const row = createThemeColorRow(key, key, value, true);
      dom.themeCustomPaletteList.appendChild(row.root);
      state.controls.themeCustomRows[key] = row;
    }
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

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";

    root.appendChild(label);
    root.appendChild(swatch);
    root.appendChild(input);
    root.appendChild(copyBtn);

    let removeBtn = null;
    if (isCustom) {
      removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
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
    state.controls.backgroundSolidInput = null;
    state.controls.backgroundGradientInput = null;
    state.controls.backgroundPreview = null;
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
        if (control.type === "background") {
          buildBackgroundControl(sectionRoot);
          continue;
        }
        if (control.type === "font-family") {
          buildFontFamilyControl(sectionRoot, control);
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
  }

  function buildSimpleStyleControl(container, control) {
    const row = document.createElement("label");
    row.className = "control-item";
    row.setAttribute("data-property", control.property);

    const caption = document.createElement("span");
    caption.textContent = control.label;

    const input = createSimpleControlInput(control);
    const eventName = control.type === "select" ? "change" : "input";
    input.addEventListener(eventName, () => {
      applyStyle(control.property, input.value);
    });

    row.appendChild(caption);
    row.appendChild(input);
    container.appendChild(row);
    state.controls.styleInputs[control.property] = input;
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
    const gradientText = document.createElement("span");
    gradientText.textContent = "Gradient";
    gradientLabel.appendChild(gradientRadio);
    gradientLabel.appendChild(gradientText);

    row.appendChild(solidLabel);
    row.appendChild(gradientLabel);
    container.appendChild(row);

    const solidRow = document.createElement("label");
    solidRow.className = "control-item";
    solidRow.setAttribute("data-property", "background-color");
    const solidCaption = document.createElement("span");
    solidCaption.textContent = "Solid Color";
    const solidInput = document.createElement("input");
    solidInput.type = "color";
    solidInput.value = "#ffffff";
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
    gradientInput.addEventListener("input", () => {
      if (state.controls.backgroundType !== "gradient") {
        setBackgroundType("gradient", true);
      }
      applyBackgroundFromControls();
    });
    gradientRow.appendChild(gradientCaption);
    gradientRow.appendChild(gradientInput);
    container.appendChild(gradientRow);

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

    state.controls.backgroundSolidRow = solidRow;
    state.controls.backgroundGradientRow = gradientRow;
    state.controls.backgroundSolidRadio = solidRadio;
    state.controls.backgroundGradientRadio = gradientRadio;
    state.controls.backgroundSolidInput = solidInput;
    state.controls.backgroundGradientInput = gradientInput;
    state.controls.backgroundPreview = preview;
  }

  function setBackgroundType(type, force) {
    const nextType = type === "gradient" ? "gradient" : "solid";
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
    if (state.controls.backgroundSolidRow) {
      state.controls.backgroundSolidRow.classList.toggle("hidden", isGradient);
    }
    if (state.controls.backgroundGradientRow) {
      state.controls.backgroundGradientRow.classList.toggle("hidden", !isGradient);
    }
    if (state.controls.backgroundSolidRadio) {
      state.controls.backgroundSolidRadio.checked = !isGradient;
    }
    if (state.controls.backgroundGradientRadio) {
      state.controls.backgroundGradientRadio.checked = isGradient;
    }
  }

  function applyBackgroundFromControls() {
    if (!state.selectedRelId) {
      updateBackgroundPreview();
      return;
    }

    if (state.controls.backgroundType === "gradient") {
      const gradientValue = String(state.controls.backgroundGradientInput?.value || "").trim();
      applyStyle("background-color", "");
      applyStyle("background", gradientValue);
    } else {
      const solidValue = String(state.controls.backgroundSolidInput?.value || "").trim();
      applyStyle("background", "");
      applyStyle("background-color", solidValue);
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

    if (state.controls.backgroundType === "gradient") {
      const gradientValue = String(state.controls.backgroundGradientInput?.value || "").trim();
      if (gradientValue) {
        preview.style.background = gradientValue;
      }
      return;
    }

    const colorValue = String(state.controls.backgroundSolidInput?.value || "").trim();
    if (colorValue) {
      preview.style.backgroundColor = colorValue;
    }
  }

  function buildShadowControl(container) {
    const root = document.createElement("div");
    root.className = "shadow-controls";

    const enableRow = document.createElement("label");
    enableRow.className = "check-row";
    const enableInput = document.createElement("input");
    enableInput.type = "checkbox";
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
    const color = String(state.controls.shadowColorInput?.value || "rgba(0, 0, 0, 0.2)").trim() || "rgba(0, 0, 0, 0.2)";
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
    const color = colorMatch ? colorMatch[1] : fallback.color;
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
    state.indexPath = data.index_path;
    state.defaultsLibraries = normalizeRuntimeLibraries(data.defaults_libraries || {});
    state.runtimeLibraries = { ...state.defaultsLibraries };
    state.defaultsFonts = normalizeRuntimeFonts(data.defaults_fonts || {});
    state.runtimeFonts = { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.defaultsTheme = createDefaultThemeState();
    state.theme = createDefaultThemeState();
    dom.projectRootInput.value = data.project_root;
    dom.indexPathInput.value = data.index_path;
    setStatus(`Loaded project: ${data.project_root}`);
  }

  async function applyProjectSelection() {
    const payload = {
      project_root: dom.projectRootInput.value,
      index_path: dom.indexPathInput.value,
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
    state.indexPath = data.index_path;
    state.defaultsLibraries = normalizeRuntimeLibraries(data.defaults_libraries || {});
    state.runtimeLibraries = { ...state.defaultsLibraries };
    state.defaultsFonts = normalizeRuntimeFonts(data.defaults_fonts || {});
    state.runtimeFonts = { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.defaultsTheme = createDefaultThemeState();
    state.theme = createDefaultThemeState();
    state.selectedRelId = null;
    state.elementsMap = {};
    state.overridesMeta = {};
    state.attributesMeta = {};
    state.linksMeta = {};
    state.addedNodes = [];
    state.deletedNodes = [];
    state.lastSelection = null;
    state.lastTreeSnapshot = [];
    state.overlayReady = false;
    state.controls.backgroundModeByRelId = {};

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
    setStatus("Loading preview...");
    const url = `/project/${encodePath(state.indexPath)}`;
    dom.iframe.src = url;
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
    state.overridesMeta = normalizedPatch.overridesMeta;
    state.attributesMeta = normalizedPatch.attributesMeta;
    state.linksMeta = normalizedPatch.linksMeta;
    state.addedNodes = normalizedPatch.addedNodes;
    state.deletedNodes = normalizedPatch.deletedNodes;
    state.runtimeLibraries = normalizedPatch.runtimeLibraries || { ...state.defaultsLibraries };
    state.runtimeFonts = normalizedPatch.runtimeFonts || { ...state.defaultsFonts, families: [...state.defaultsFonts.families] };
    state.theme = normalizedPatch.theme || createDefaultThemeState();
    state.controls.backgroundModeByRelId = {};

    if (hasPatchContent()) {
      setStatus("Patch loaded");
    }
  }

  async function savePatch() {
    const patch = {
      version: PATCH_VERSION,
      project_root: state.projectRoot,
      index_path: state.indexPath,
      elementsMap: state.elementsMap,
      overridesMeta: state.overridesMeta,
      attributesMeta: state.attributesMeta,
      linksMeta: state.linksMeta,
      addedNodes: state.addedNodes,
      deletedNodes: state.deletedNodes,
      runtimeLibraries: state.runtimeLibraries,
      runtimeFonts: state.runtimeFonts,
      theme: state.theme,
    };

    const overrideCss = buildOverrideCss(state.overridesMeta, state.theme);
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

    setStatus("Patch saved");
  }

  async function exportSafe() {
    const response = await fetch("/api/export-safe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index_path: state.indexPath }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.error || "Export Safe failed", true);
      return;
    }

    setStatus(`Exported: ${data.result.html}`);
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
      clearSelectionUi();
      return;
    }

    if (msg.type === "REL_TREE_SNAPSHOT") {
      state.lastTreeSnapshot = Array.isArray(msg.payload) ? msg.payload : [];
      renderTree(state.lastTreeSnapshot, dom.treeSearchInput.value.trim().toLowerCase());
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
  }

  function handleSelection(payload) {
    if (!payload || !payload.relId) {
      return;
    }

    const previousRelId = state.selectedRelId;
    const selectionChanged = previousRelId !== payload.relId;

    state.selectedRelId = payload.relId;
    state.lastSelection = payload;
    state.elementsMap[payload.relId] = payload.fallbackSelector || state.elementsMap[payload.relId] || "";

    const overrides = state.overridesMeta[payload.relId] || {};
    const attrs = state.attributesMeta[payload.relId] || {};
    const links = state.linksMeta[payload.relId] || {};

    updateSelectionInfo(payload, overrides, attrs, links);
    updateStyleControlValues(payload.computed || {}, overrides, {
      selectionChanged,
      relId: payload.relId,
      selection: payload,
    });
    updateAttributesPanel(payload, attrs);
    updateLinkPanel(payload, links);
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
    setBackgroundType("solid", true);
    updateFontLoadingWarning("");
    updateBackgroundPreview();
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
    for (const property of Object.keys(state.controls.styleInputs || {})) {
      const input = state.controls.styleInputs[property];
      if (!input) {
        continue;
      }
      input.value = overrides[property] ?? computed[property] ?? "";
    }

    const effectiveFontFamily = overrides["font-family"] ?? computed["font-family"] ?? "";
    rebuildFontFamilyOptions(effectiveFontFamily);

    const overrideBackground = String(overrides.background ?? "").trim();
    const computedBackground = String(computed.background ?? "").trim();
    const computedBackgroundImage = String(computed["background-image"] ?? "").trim();
    const overrideBackgroundColor = String(overrides["background-color"] ?? "").trim();
    const computedBackgroundColor = String(computed["background-color"] ?? "").trim();
    const relId = String(options?.relId || state.selectedRelId || "");
    const selectionChanged = Boolean(options?.selectionChanged);
    const detectedMode = detectBackgroundMode(overrides, computed);
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

    const gradientValue = overrideBackground || computedBackground || (isGradientValue(computedBackgroundImage) ? computedBackgroundImage : "");
    const colorValue = overrideBackgroundColor || computedBackgroundColor;
    if (state.controls.backgroundGradientInput) {
      if (nextMode === "gradient") {
        state.controls.backgroundGradientInput.value = gradientValue;
      } else if (selectionChanged) {
        state.controls.backgroundGradientInput.value = "";
      }
    }
    if (state.controls.backgroundSolidInput) {
      if (nextMode === "solid") {
        state.controls.backgroundSolidInput.value = toHexColor(colorValue, "#ffffff");
      } else if (selectionChanged && colorValue) {
        state.controls.backgroundSolidInput.value = toHexColor(colorValue, "#ffffff");
      }
    }

    updateBackgroundPreview();
    updateShadowControlValues(computed, overrides, options?.selection || state.lastSelection || {}, options || {});
  }

  function updateAttributesPanel(selection, attrs) {
    dom.attrIdInput.value = getEffectiveValue(attrs.id, selection.attributes && selection.attributes.id) || "";
    dom.attrClassInput.value = getEffectiveValue(attrs.class, selection.attributes && selection.attributes.class) || "";
  }

  function updateLinkPanel(selection, linkOverrides) {
    const linkData = Object.keys(linkOverrides).length ? linkOverrides : (selection.link || {});
    const isAnchor = Boolean(selection.isAnchor || (selection.link && selection.link.isAnchor));
    const makeLinkLabel = selection.isImage ? "Wrap image with link" : "Make this element a link";
    dom.makeLinkRow.querySelector("span").textContent = makeLinkLabel;
    dom.makeLinkRow.classList.toggle("hidden", isAnchor);

    const enabled = isAnchor ? true : Boolean(linkData.enabled);
    dom.makeLinkCheckbox.checked = enabled;
    dom.linkHrefInput.value = linkData.href || "";
    dom.linkTargetInput.value = linkData.target || "";
    dom.linkRelInput.value = linkData.rel || "";
    dom.linkTitleInput.value = linkData.title || "";
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

  function applyStyle(property, value) {
    if (!state.selectedRelId) {
      return;
    }

    const relId = state.selectedRelId;
    if (!state.overridesMeta[relId]) {
      state.overridesMeta[relId] = {};
    }

    if (String(value).trim() === "") {
      delete state.overridesMeta[relId][property];
    } else {
      state.overridesMeta[relId][property] = value;
    }

    if (Object.keys(state.overridesMeta[relId]).length === 0) {
      delete state.overridesMeta[relId];
    }

    sendToOverlay({
      type: "REL_APPLY_STYLE",
      payload: { relId, property, value },
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

    if (node.relId && node.fallbackSelector) {
      state.elementsMap[node.relId] = node.fallbackSelector;
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
      state.addedNodes = state.addedNodes.filter((node) => node.relId !== relId);
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

  function requestTreeSnapshot() {
    sendToOverlay({ type: "REL_REQUEST_TREE" });
  }

  function renderTree(items, searchQuery) {
    dom.treeContainer.innerHTML = "";
    const normalizedItems = Array.isArray(items) ? items : [];

    for (const item of normalizedItems) {
      if (!matchesTreeNode(item, searchQuery)) {
        continue;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tree-node";
      btn.style.paddingLeft = `${8 + item.depth * 12}px`;
      btn.textContent = formatTreeLabel(item);
      btn.setAttribute("data-rel-id", item.relId);
      btn.addEventListener("click", () => {
        sendToOverlay({
          type: "REL_SELECT_BY_REL_ID",
          payload: { relId: item.relId },
        });
      });

      dom.treeContainer.appendChild(btn);
    }
  }

  function matchesTreeNode(node, query) {
    if (!query) {
      return true;
    }
    const haystack = `${node.tagName || ""} ${node.id || ""} ${node.className || ""}`.toLowerCase();
    return haystack.includes(query);
  }

  function markActiveTreeNode(relId) {
    const nodes = dom.treeContainer.querySelectorAll(".tree-node");
    for (const node of nodes) {
      node.classList.toggle("active", node.getAttribute("data-rel-id") === relId);
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
        addedNodes: state.addedNodes,
        deletedNodes: state.deletedNodes,
        runtimeLibraries: state.runtimeLibraries,
        runtimeFonts: state.runtimeFonts,
        themeCss: buildThemeCss(state.theme),
      },
    });

    for (const relId of Object.keys(state.overridesMeta)) {
      const props = state.overridesMeta[relId] || {};
      for (const property of Object.keys(props)) {
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

  function buildOverrideCss(overridesMeta, themeState) {
    const lines = [];
    const themeCss = String(buildThemeCss(themeState || createDefaultThemeState()) || "").trim();
    if (themeCss) {
      lines.push(themeCss);
      lines.push("");
    }
    const relIds = Object.keys(overridesMeta).sort();

    for (const relId of relIds) {
      const props = overridesMeta[relId] || {};
      const entries = Object.entries(props).filter(([, value]) => String(value).trim() !== "");
      if (entries.length === 0) {
        continue;
      }

      lines.push(`[data-rel-id="${cssEscape(relId)}"] {`);
      for (const [property, value] of entries) {
        lines.push(`  ${property}: ${value};`);
      }
      lines.push("}");
      lines.push("");
    }

    return lines.join("\n");
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
    const runtimeLibraries =
      patch.runtimeLibraries ||
      patch.runtime_libraries ||
      null;
    const runtimeFonts =
      patch.runtimeFonts ||
      patch.runtime_fonts ||
      null;
    const theme =
      patch.theme ||
      patch.Theme ||
      null;

    return {
      version: Number(patch.version || 1),
      elementsMap: ensurePlainObject(patch.elementsMap || patch.elements),
      overridesMeta: ensurePlainObject(patch.overridesMeta || patch.overrides_meta),
      attributesMeta: ensurePlainObject(patch.attributesMeta || patch.attributes_meta),
      linksMeta: ensurePlainObject(patch.linksMeta || patch.links_meta),
      addedNodes: ensureArray(patch.addedNodes || patch.added_nodes),
      deletedNodes: ensureArray(patch.deletedNodes || patch.deleted_nodes),
      runtimeLibraries: runtimeLibraries ? normalizeRuntimeLibraries(runtimeLibraries) : null,
      runtimeFonts: runtimeFonts ? normalizeRuntimeFonts(runtimeFonts) : null,
      theme: theme ? normalizeThemeState(theme) : null,
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

  function isGradientValue(value) {
    return /gradient\s*\(/i.test(String(value || ""));
  }

  function detectBackgroundMode(overrides, computed) {
    const overrideBackground = String(overrides.background ?? "").trim();
    const computedBackgroundImage = String(computed["background-image"] ?? "").trim();
    if (isGradientValue(overrideBackground)) {
      return "gradient";
    }
    if (!overrideBackground && isGradientValue(computedBackgroundImage)) {
      return "gradient";
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
      Object.keys(state.attributesMeta).length > 0 ||
      Object.keys(state.linksMeta).length > 0 ||
      state.addedNodes.length > 0 ||
      state.deletedNodes.length > 0 ||
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
    if (/^javascript:/i.test(value)) {
      return false;
    }
    if (/^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(value)) {
      return true;
    }
    return false;
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

  function setStatus(message, isError) {
    dom.statusText.textContent = message;
    dom.statusText.style.color = isError ? "#a32b2b" : "#786a5b";
  }
})();
