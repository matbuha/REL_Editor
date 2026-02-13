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
  ];

  const state = {
    projectRoot: "",
    indexPath: "index.html",
    selectedRelId: null,
    elementsMap: {},
    overridesMeta: {},
    lastSelection: null,
    lastTreeSnapshot: [],
  };

  const dom = {
    iframe: document.getElementById("liveFrame"),
    projectRootInput: document.getElementById("projectRootInput"),
    indexPathInput: document.getElementById("indexPathInput"),
    loadProjectBtn: document.getElementById("loadProjectBtn"),
    savePatchBtn: document.getElementById("savePatchBtn"),
    exportSafeBtn: document.getElementById("exportSafeBtn"),
    statusText: document.getElementById("statusText"),
    selectionInfo: document.getElementById("selectionInfo"),
    controlsContainer: document.getElementById("controlsContainer"),
    refreshTreeBtn: document.getElementById("refreshTreeBtn"),
    treeContainer: document.getElementById("treeContainer"),
    treeSearchInput: document.getElementById("treeSearchInput"),
  };

  init();

  async function init() {
    setupTabs();
    buildControls();
    bindEvents();
    await loadProjectInfo();
    await loadPatchInfo();
    loadIframe();
  }

  function bindEvents() {
    window.addEventListener("message", onMessageFromOverlay);

    dom.loadProjectBtn.addEventListener("click", async () => {
      await applyProjectSelection();
    });

    dom.savePatchBtn.addEventListener("click", async () => {
      await savePatch();
    });

    dom.exportSafeBtn.addEventListener("click", async () => {
      await exportSafe();
    });

    dom.refreshTreeBtn.addEventListener("click", requestTreeSnapshot);

    dom.treeSearchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();
      renderTree(state.lastTreeSnapshot || [], query);
    });

    dom.iframe.addEventListener("load", () => {
      requestTreeSnapshot();
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

  function buildControls() {
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
        if (!state.selectedRelId) {
          return;
        }
        const value = input.value;
        applyStyle(control.property, value);
      });

      row.appendChild(caption);
      row.appendChild(input);
      dom.controlsContainer.appendChild(row);
    }
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
    state.selectedRelId = null;
    state.elementsMap = {};
    state.overridesMeta = {};
    state.lastSelection = null;
    state.lastTreeSnapshot = [];

    await loadPatchInfo();
    loadIframe();
    setStatus(`Project loaded: ${data.project_root}`);
  }

  function loadIframe() {
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
    const patch = data.patch || {
      version: 1,
      project_root: state.projectRoot,
      index_path: state.indexPath,
      elements: {},
      overrides_meta: {},
    };

    state.elementsMap = patch.elements || {};
    state.overridesMeta = patch.overrides_meta || {};

    if (Object.keys(state.overridesMeta).length > 0) {
      setStatus("Patch loaded");
    }
  }

  async function savePatch() {
    const patch = {
      version: 1,
      project_root: state.projectRoot,
      index_path: state.indexPath,
      elements: state.elementsMap,
      overrides_meta: state.overridesMeta,
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

  function onMessageFromOverlay(event) {
    if (event.source !== dom.iframe.contentWindow) {
      return;
    }
    if (event.origin !== window.location.origin) {
      return;
    }

    const msg = event.data || {};

    if (msg.type === "REL_SELECTION") {
      handleSelection(msg.payload);
      return;
    }

    if (msg.type === "REL_TREE_SNAPSHOT") {
      state.lastTreeSnapshot = msg.payload || [];
      renderTree(state.lastTreeSnapshot, dom.treeSearchInput.value.trim().toLowerCase());
    }
  }

  function handleSelection(payload) {
    if (!payload || !payload.relId) {
      return;
    }

    state.selectedRelId = payload.relId;
    state.lastSelection = payload;
    state.elementsMap[payload.relId] = payload.fallbackSelector || state.elementsMap[payload.relId] || "";

    const currentOverride = state.overridesMeta[payload.relId] || {};
    updateSelectionInfo(payload, currentOverride);
    updateControlValues(payload.computed || {}, currentOverride);
    markActiveTreeNode(payload.relId);
  }

  function updateSelectionInfo(selection, overrides) {
    const lines = [
      `relId: ${selection.relId}`,
      `tagName: ${selection.tagName || ""}`,
      `id: ${selection.id || ""}`,
      `class: ${selection.className || ""}`,
      `src/href: ${selection.srcOrHref || ""}`,
      `alt: ${selection.alt || ""}`,
      `rect: x=${Math.round(selection.rect?.x || 0)}, y=${Math.round(selection.rect?.y || 0)}, w=${Math.round(selection.rect?.width || 0)}, h=${Math.round(selection.rect?.height || 0)}`,
      "",
      "Overrides:",
      Object.keys(overrides).length ? JSON.stringify(overrides, null, 2) : "(none)",
    ];

    dom.selectionInfo.textContent = lines.join("\n");
  }

  function updateControlValues(computed, overrides) {
    const rows = dom.controlsContainer.querySelectorAll("[data-property]");

    for (const row of rows) {
      const property = row.getAttribute("data-property");
      const input = row.querySelector("input, select");
      const value = overrides[property] ?? computed[property] ?? "";
      input.value = value;
    }
  }

  function applyStyle(property, value) {
    if (!state.selectedRelId) {
      return;
    }

    const relId = state.selectedRelId;
    if (!state.overridesMeta[relId]) {
      state.overridesMeta[relId] = {};
    }

    if (value === "") {
      delete state.overridesMeta[relId][property];
    } else {
      state.overridesMeta[relId][property] = value;
    }

    if (Object.keys(state.overridesMeta[relId]).length === 0) {
      delete state.overridesMeta[relId];
    }

    sendToOverlay({
      type: "REL_APPLY_STYLE",
      payload: {
        relId,
        property,
        value,
      },
    });

    updateSelectionInfo(state.lastSelection || {}, state.overridesMeta[relId] || {});
  }

  function requestTreeSnapshot() {
    sendToOverlay({ type: "REL_REQUEST_TREE" });
  }

  function renderTree(items, searchQuery) {
    dom.treeContainer.innerHTML = "";

    for (const item of items) {
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
      ? `.${item.className.trim().split(/\s+/).slice(0, 2).join(".")}`
      : "";
    return `${item.tagName}${id}${cls}`;
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

  function sendToOverlay(message) {
    const iframeWindow = dom.iframe.contentWindow;
    if (!iframeWindow) {
      return;
    }
    iframeWindow.postMessage(message, "*");
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

  function setStatus(message, isError) {
    dom.statusText.textContent = message;
    dom.statusText.style.color = isError ? "#a32b2b" : "#786a5b";
  }
})();
