(function () {
  const controlsSchema = [
    { label: "color", property: "color", type: "text", placeholder: "#222222" },
    { label: "background-color", property: "background-color", type: "text", placeholder: "#ffffff" },
    { label: "font-size", property: "font-size", type: "text", placeholder: "16px" },
    { label: "font-weight", property: "font-weight", type: "text", placeholder: "400" },
    { label: "line-height", property: "line-height", type: "text", placeholder: "1.4" },
    { label: "text-align", property: "text-align", type: "select", options: ["", "left", "center", "right", "justify"] },
    { label: "padding-top", property: "padding-top", type: "text", placeholder: "0px" },
    { label: "padding-right", property: "padding-right", type: "text", placeholder: "0px" },
    { label: "padding-bottom", property: "padding-bottom", type: "text", placeholder: "0px" },
    { label: "padding-left", property: "padding-left", type: "text", placeholder: "0px" },
    { label: "margin-top", property: "margin-top", type: "text", placeholder: "0px" },
    { label: "margin-right", property: "margin-right", type: "text", placeholder: "0px" },
    { label: "margin-bottom", property: "margin-bottom", type: "text", placeholder: "0px" },
    { label: "margin-left", property: "margin-left", type: "text", placeholder: "0px" },
    { label: "border-radius", property: "border-radius", type: "text", placeholder: "0px" },
    { label: "width", property: "width", type: "text", placeholder: "auto" },
    { label: "height", property: "height", type: "text", placeholder: "auto" },
    { label: "display", property: "display", type: "select", options: ["", "block", "inline-block", "flex", "none"] },
    { label: "flex-direction", property: "flex-direction", type: "select", options: ["", "row", "column", "row-reverse", "column-reverse"] },
    { label: "justify-content", property: "justify-content", type: "select", options: ["", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] },
    { label: "align-items", property: "align-items", type: "select", options: ["", "stretch", "flex-start", "center", "flex-end", "baseline"] },
    { label: "gap", property: "gap", type: "text", placeholder: "0px" },
    { label: "object-fit", property: "object-fit", type: "select", options: ["", "fill", "contain", "cover", "none", "scale-down"] },
  ];

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

  const PATCH_VERSION = 2;
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
    clearSelectionUi();
    bindEvents();
    initResizableLayout();
    await loadProjectInfo();
    await loadPatchInfo();
    syncLibraryControlsFromState();
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

  function buildStyleControls() {
    dom.controlsContainer.innerHTML = "";

    for (const control of controlsSchema) {
      const row = document.createElement("label");
      row.className = "control-item";
      row.setAttribute("data-property", control.property);

      const caption = document.createElement("span");
      caption.textContent = control.label;

      let input;
      if (control.type === "select") {
        input = document.createElement("select");
        for (const optionValue of control.options) {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue || "(empty)";
          input.appendChild(option);
        }
      } else {
        input = document.createElement("input");
        input.type = "text";
        input.placeholder = control.placeholder || "";
      }

      input.addEventListener("input", () => {
        applyStyle(control.property, input.value);
      });

      row.appendChild(caption);
      row.appendChild(input);
      dom.controlsContainer.appendChild(row);
    }
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

    await loadPatchInfo();
    syncLibraryControlsFromState();
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
    };

    const overrideCss = buildOverrideCss(state.overridesMeta);
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
    }
  }

  function handleSelection(payload) {
    if (!payload || !payload.relId) {
      return;
    }

    state.selectedRelId = payload.relId;
    state.lastSelection = payload;
    state.elementsMap[payload.relId] = payload.fallbackSelector || state.elementsMap[payload.relId] || "";

    const overrides = state.overridesMeta[payload.relId] || {};
    const attrs = state.attributesMeta[payload.relId] || {};
    const links = state.linksMeta[payload.relId] || {};

    updateSelectionInfo(payload, overrides, attrs, links);
    updateStyleControlValues(payload.computed || {}, overrides);
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

    const rows = dom.controlsContainer.querySelectorAll("[data-property]");
    for (const row of rows) {
      const input = row.querySelector("input, select");
      input.value = "";
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

  function updateStyleControlValues(computed, overrides) {
    const rows = dom.controlsContainer.querySelectorAll("[data-property]");
    for (const row of rows) {
      const property = row.getAttribute("data-property");
      const input = row.querySelector("input, select");
      input.value = overrides[property] ?? computed[property] ?? "";
    }
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

  function buildOverrideCss(overridesMeta) {
    const lines = [];
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

    return {
      version: Number(patch.version || 1),
      elementsMap: ensurePlainObject(patch.elementsMap || patch.elements),
      overridesMeta: ensurePlainObject(patch.overridesMeta || patch.overrides_meta),
      attributesMeta: ensurePlainObject(patch.attributesMeta || patch.attributes_meta),
      linksMeta: ensurePlainObject(patch.linksMeta || patch.links_meta),
      addedNodes: ensureArray(patch.addedNodes || patch.added_nodes),
      deletedNodes: ensureArray(patch.deletedNodes || patch.deleted_nodes),
      runtimeLibraries: runtimeLibraries ? normalizeRuntimeLibraries(runtimeLibraries) : null,
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

  function normalizeEnumValue(input, allowed, fallback) {
    const value = String(input || "").trim().toLowerCase();
    return allowed.includes(value) ? value : fallback;
  }

  function hasPatchContent() {
    const runtimeDiff = JSON.stringify(normalizeRuntimeLibraries(state.runtimeLibraries)) !== JSON.stringify(normalizeRuntimeLibraries(state.defaultsLibraries));
    return (
      Object.keys(state.overridesMeta).length > 0 ||
      Object.keys(state.attributesMeta).length > 0 ||
      Object.keys(state.linksMeta).length > 0 ||
      state.addedNodes.length > 0 ||
      state.deletedNodes.length > 0 ||
      runtimeDiff
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
