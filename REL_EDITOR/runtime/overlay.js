(function () {
  if (window.__REL_OVERLAY_LOADED__) {
    return;
  }
  window.__REL_OVERLAY_LOADED__ = true;

  const TRACKED_STYLES = [
    "color",
    "background",
    "background-color",
    "background-image",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "letter-spacing",
    "text-transform",
    "text-decoration",
    "text-align",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "border-radius",
    "border-width",
    "border-color",
    "box-shadow",
    "text-shadow",
    "width",
    "height",
    "display",
    "gap",
    "flex-direction",
    "justify-content",
    "align-items",
    "object-fit",
  ];

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT"]);
  const VOID_TAGS = new Set(["IMG", "INPUT", "BR", "HR", "META", "LINK", "SOURCE", "TRACK", "WBR"]);
  const MANAGED_SELECTION_CLASS = "rel-editor-selected";
  const MANAGED_DROP_CLASS = "rel-editor-drop-target";
  const RESIZER_SELECTION_EVENT = "rel-selection-change";
  const PROTECTED_TAGS = new Set(["HTML", "HEAD", "BODY"]);
  const TEXT_EDIT_TAGS = new Set(["A", "BUTTON", "P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "LABEL", "LI", "DIV", "SECTION"]);
  const IS_VITE_PROXY_MODE = String(window.location.pathname || "").startsWith("/vite-proxy");
  const VITE_GLOBAL_STYLE_PROPS = ["background", "background-color", "background-image", "color"];

  const LIBRARY_ASSETS = {
    bootstrap: {
      styles: ["https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"],
      scripts: ["https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"],
    },
    bulma: {
      styles: ["https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css"],
      scripts: [],
    },
    pico: {
      styles: ["https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"],
      scripts: [],
    },
    tailwind: {
      styles: [],
      scripts: ["https://cdn.tailwindcss.com"],
    },
    icons: {
      "material-icons": {
        styles: ["https://fonts.googleapis.com/icon?family=Material+Icons"],
      },
      "font-awesome": {
        styles: ["https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"],
      },
    },
    animateCss: "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css",
  };

  const state = {
    selectedElement: null,
    idCounter: 1,
    editMode: true,
    pendingDragNodeTemplate: null,
    activeDropTarget: null,
    elementsMap: {},
    appliedAddedNodeIds: new Set(),
    runtimeLibraries: {
      designLibrary: "none",
      iconSet: "none",
      animateCss: false,
      bootstrapJs: false,
    },
    runtimeFonts: {
      provider: "none",
      families: [],
    },
    themeCss: "",
    viteHeadObserver: null,
    viteHeadEnsureRafId: 0,
    viteBodyGlobalStyleValues: {},
    viteBodyGlobalStyleTouched: false,
  };

  ensureResizerModuleLoaded();
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onDocumentKeyDown, true);
  document.addEventListener("dragover", onDocumentDragOver, true);
  document.addEventListener("drop", onDocumentDrop, true);
  document.addEventListener("dragleave", onDocumentDragLeave, true);
  window.addEventListener("message", onMessageFromEditor);

  blockTopNavigation();
  if (IS_VITE_PROXY_MODE) {
    logVite(`Overlay active on ${window.location.pathname}`);
    setupViteHeadObserver();
  }
  postToEditor({ type: "REL_OVERLAY_READY" });

  function onDocumentClick(event) {
    if (!state.editMode) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest("[data-rel-runtime='overlay-ui']")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectElement(target);
  }

  function onDocumentKeyDown(event) {
    if (!state.editMode) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      postToEditor({ type: "REL_SELECTION_CLEARED" });
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      if (!state.selectedElement) {
        return;
      }

      const allow = window.confirm("Delete selected element?");
      if (!allow) {
        return;
      }

      deleteNodeByReference({
        relId: ensureRelId(state.selectedElement),
        fallbackSelector: buildStableSelector(state.selectedElement),
        silent: false,
      });
    }
  }

  function onDocumentDragOver(event) {
    if (!state.pendingDragNodeTemplate) {
      return;
    }

    const target = resolveDropTarget(event.target);
    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setActiveDropTarget(target);
  }

  function onDocumentDrop(event) {
    if (!state.pendingDragNodeTemplate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const targetParent = resolveDropTarget(event.target) || resolveFallbackParent();
    const parentRelId = ensureRelId(targetParent);
    const nodeTemplate = state.pendingDragNodeTemplate;
    state.pendingDragNodeTemplate = null;
    clearDropTarget();

    const nodeDescriptor = {
      nodeId: nodeTemplate.nodeId || generateNodeId(),
      relId: nodeTemplate.relId || "",
      type: nodeTemplate.type,
      position: "append",
      parentRelId,
      props: nodeTemplate.props || {},
    };

    const created = ensureAddedNode(nodeDescriptor, true);
    if (created) {
      postToEditor({ type: "REL_NODE_ADDED", payload: { node: created } });
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }
  }

  function onDocumentDragLeave(event) {
    if (!state.pendingDragNodeTemplate) {
      return;
    }
    if (event.target === document.documentElement) {
      clearDropTarget();
    }
  }

  function onMessageFromEditor(event) {
    if (event.source !== window.parent) {
      return;
    }
    if (event.origin !== window.location.origin) {
      return;
    }

    const message = event.data || {};

    if (message.type === "REL_APPLY_STYLE") {
      const payload = message.payload || {};
      applyStyle(payload.relId, payload.property, payload.value);
      return;
    }

    if (message.type === "REL_SET_ATTRIBUTES") {
      const payload = message.payload || {};
      applyAttributes(payload.relId, payload.attributes || {});
      return;
    }

    if (message.type === "REL_SET_LINK") {
      const payload = message.payload || {};
      applyLinkSettings(payload.relId, payload.link || {});
      return;
    }

    if (message.type === "REL_SET_TEXT") {
      const payload = message.payload || {};
      applyTextOverride(payload.relId, payload.text || "");
      return;
    }

    if (message.type === "REL_DELETE_NODE") {
      const payload = message.payload || {};
      deleteNodeByReference({
        relId: payload.relId,
        fallbackSelector: payload.fallbackSelector,
        silent: false,
      });
      return;
    }

    if (message.type === "REL_CENTER_IN_PARENT") {
      const payload = message.payload || {};
      centerElementInParent(payload.relId);
      return;
    }

    if (message.type === "REL_SET_LIBRARIES") {
      const payload = message.payload || {};
      applyRuntimeLibraries(payload.runtimeLibraries || {});
      return;
    }

    if (message.type === "REL_SET_FONTS") {
      const payload = message.payload || {};
      applyRuntimeFonts(payload.runtimeFonts || {});
      return;
    }

    if (message.type === "REL_SET_THEME") {
      const payload = message.payload || {};
      applyThemeCss(payload.cssText || "");
      return;
    }

    if (message.type === "REL_REQUEST_TREE") {
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
      return;
    }

    if (message.type === "REL_SELECT_BY_REL_ID") {
      const relId = message.payload && message.payload.relId;
      if (!relId) {
        return;
      }
      const element = findElementByRelIdOrFallback(relId, state.elementsMap);
      if (element) {
        selectElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (message.type === "REL_APPLY_PATCH") {
      applyPatch(message.payload || {});
      return;
    }

    if (message.type === "REL_SET_DRAG_COMPONENT") {
      state.pendingDragNodeTemplate = message.payload && message.payload.nodeTemplate
        ? message.payload.nodeTemplate
        : null;
      return;
    }

    if (message.type === "REL_CLEAR_DRAG_COMPONENT") {
      state.pendingDragNodeTemplate = null;
      clearDropTarget();
      return;
    }

    if (message.type === "REL_ADD_NODE") {
      const payload = message.payload || {};
      const created = ensureAddedNode(payload.node || {}, true);
      if (created) {
        postToEditor({ type: "REL_NODE_ADDED", payload: { node: created } });
        postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
      }
    }
  }

  function applyPatch(payload) {
    state.elementsMap = payload.elementsMap || {};
    state.appliedAddedNodeIds.clear();
    state.viteBodyGlobalStyleValues = {};
    state.viteBodyGlobalStyleTouched = false;
    applyRuntimeLibraries(payload.runtimeLibraries || state.runtimeLibraries);
    applyRuntimeFonts(payload.runtimeFonts || state.runtimeFonts);
    applyThemeCss(payload.themeCss || "");

    const addedNodes = Array.isArray(payload.addedNodes) ? payload.addedNodes : [];
    for (const node of addedNodes) {
      ensureAddedNode(node, false);
    }

    const attributesMeta = payload.attributesMeta || {};
    for (const relId of Object.keys(attributesMeta)) {
      applyAttributes(relId, attributesMeta[relId], { silent: true });
    }

    const linksMeta = payload.linksMeta || {};
    for (const relId of Object.keys(linksMeta)) {
      applyLinkSettings(relId, linksMeta[relId], { silent: true });
    }

    const textOverrides = payload.textOverrides || {};
    for (const relId of Object.keys(textOverrides)) {
      const entry = textOverrides[relId];
      if (!entry || typeof entry !== "object" || !Object.prototype.hasOwnProperty.call(entry, "text")) {
        continue;
      }
      applyTextOverride(relId, entry.text, { silent: true });
    }

    const deletedNodes = Array.isArray(payload.deletedNodes) ? payload.deletedNodes : [];
    for (const node of deletedNodes) {
      deleteNodeByReference({
        relId: node && node.relId,
        fallbackSelector: node && node.fallbackSelector,
        silent: true,
      });
    }

    if (IS_VITE_PROXY_MODE) {
      updateViteBodyGlobalOverrideFromBody(document.body);
    }

    if (state.selectedElement) {
      const relId = ensureRelId(state.selectedElement);
      postToEditor({ type: "REL_SELECTION", payload: buildSelectionPayload(state.selectedElement, relId) });
    }

    postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
  }

  function clearSelection() {
    if (state.selectedElement) {
      state.selectedElement.classList.remove(MANAGED_SELECTION_CLASS);
      state.selectedElement = null;
      notifyResizerSelectionChange(null);
    }
  }

  function deleteNodeByReference(options) {
    const relId = String(options.relId || "").trim();
    const fallbackSelector = String(options.fallbackSelector || "").trim();
    const silent = Boolean(options.silent);

    let element = relId ? findElementByRelIdOrFallback(relId, state.elementsMap) : null;
    if (!element && fallbackSelector) {
      try {
        element = document.querySelector(fallbackSelector);
      } catch {
        element = null;
      }
    }

    if (!element) {
      return false;
    }

    if (isProtectedElement(element)) {
      if (!silent) {
        postToEditor({
          type: "REL_DELETE_ERROR",
          payload: {
            relId: relId || ensureRelId(element),
            message: "This element is protected and cannot be deleted",
          },
        });
      }
      return false;
    }

    const parent = element.parentNode;
    if (!parent) {
      return false;
    }

    const finalRelId = ensureRelId(element, relId);
    const finalStableSelector = buildStableSelector(element);
    const deletedNodeId = element.dataset.relAddedNodeId || "";

    if (state.selectedElement === element) {
      clearSelection();
      postToEditor({ type: "REL_SELECTION_CLEARED" });
    }

    parent.removeChild(element);

    if (deletedNodeId) {
      state.appliedAddedNodeIds.delete(deletedNodeId);
    }

    if (!silent) {
      postToEditor({
        type: "REL_NODE_DELETED",
        payload: {
          relId: finalRelId,
          fallbackSelector: finalStableSelector,
          stableSelector: finalStableSelector,
          timestamp: Date.now(),
        },
      });
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }

    return true;
  }

  function selectElement(element) {
    if (!(element instanceof Element)) {
      return;
    }

    if (SKIP_TAGS.has(element.tagName)) {
      return;
    }

    if (state.selectedElement) {
      state.selectedElement.classList.remove(MANAGED_SELECTION_CLASS);
    }

    const relId = ensureRelId(element);
    element.classList.add(MANAGED_SELECTION_CLASS);
    state.selectedElement = element;
    notifyResizerSelectionChange(element);

    const payload = buildSelectionPayload(element, relId);
    postToEditor({ type: "REL_SELECTION", payload });
  }

  function applyStyle(relId, property, value) {
    if (!relId || !property) {
      return;
    }

    const safeProperty = String(property || "").trim().toLowerCase();
    const element = findElementByRelIdOrFallback(relId, state.elementsMap);
    if (!element) {
      return;
    }

    if (value === "") {
      element.style.removeProperty(safeProperty);
    } else {
      element.style.setProperty(safeProperty, value);
    }

    if (IS_VITE_PROXY_MODE && element.tagName === "BODY" && VITE_GLOBAL_STYLE_PROPS.includes(safeProperty)) {
      trackViteBodyGlobalStyleValue(safeProperty, value);
      updateViteBodyGlobalOverrideFromBody(element);
    }

    if (IS_VITE_PROXY_MODE) {
      scheduleViteHeadOrderEnsure();
    }

    if (state.selectedElement === element) {
      const payload = buildSelectionPayload(element, relId);
      postToEditor({ type: "REL_SELECTION", payload });
    }
  }

  function applyAttributes(relId, attributes, options) {
    if (!relId || !attributes || typeof attributes !== "object") {
      return false;
    }

    const opts = options || {};
    const element = findElementByRelIdOrFallback(relId, state.elementsMap);
    if (!element) {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(attributes, "id")) {
      const rawId = String(attributes.id || "").trim();
      if (rawId) {
        if (!isValidId(rawId)) {
          postToEditor({
            type: "REL_ATTRIBUTE_ERROR",
            payload: { relId, field: "id", message: "Invalid ID format" },
          });
          return false;
        }

        const existing = document.getElementById(rawId);
        if (existing && existing !== element) {
          postToEditor({
            type: "REL_ATTRIBUTE_ERROR",
            payload: { relId, field: "id", message: `ID already exists: ${rawId}` },
          });
          return false;
        }
        element.id = rawId;
      } else {
        element.removeAttribute("id");
      }
    }

    if (Object.prototype.hasOwnProperty.call(attributes, "class")) {
      const classValue = normalizeClassString(attributes.class);
      if (classValue) {
        element.setAttribute("class", classValue);
      } else {
        element.removeAttribute("class");
      }
      if (state.selectedElement === element) {
        element.classList.add(MANAGED_SELECTION_CLASS);
      }
    }

    if (Object.prototype.hasOwnProperty.call(attributes, "src")) {
      applySimpleAttribute(element, "src", attributes.src, true);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "alt")) {
      applySimpleAttribute(element, "alt", attributes.alt, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "href")) {
      applySimpleAttribute(element, "href", attributes.href, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "target")) {
      applySimpleAttribute(element, "target", attributes.target, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "rel")) {
      applySimpleAttribute(element, "rel", attributes.rel, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "title")) {
      applySimpleAttribute(element, "title", attributes.title, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "width")) {
      applySimpleAttribute(element, "width", attributes.width, false);
    }
    if (Object.prototype.hasOwnProperty.call(attributes, "height")) {
      applySimpleAttribute(element, "height", attributes.height, false);
    }

    if (!opts.silent && state.selectedElement === element) {
      const payload = buildSelectionPayload(element, relId);
      postToEditor({ type: "REL_SELECTION", payload });
    }

    return true;
  }

  function applySimpleAttribute(element, name, value, convertProjectAsset) {
    const rawValue = value == null ? "" : String(value).trim();
    if (!rawValue) {
      element.removeAttribute(name);
      return;
    }

    const normalized = convertProjectAsset ? normalizeAssetSrc(rawValue) : rawValue;
    element.setAttribute(name, normalized);
  }

  function applyLinkSettings(relId, link, options) {
    if (!relId || !link || typeof link !== "object") {
      return false;
    }

    const opts = options || {};
    const element = findElementByRelIdOrFallback(relId, state.elementsMap);
    if (!element) {
      return false;
    }

    const isAnchor = element.tagName === "A";
    const enabled = Boolean(link.enabled) || isAnchor;
    const href = String(link.href || "").trim();
    const target = String(link.target || "").trim();
    const rel = String(link.rel || "").trim();
    const title = String(link.title || "").trim();

    if (isAnchor) {
      setOrRemoveAttr(element, "href", href);
      setOrRemoveAttr(element, "target", target);
      setOrRemoveAttr(element, "rel", rel);
      setOrRemoveAttr(element, "title", title);
    } else if (enabled) {
      const wrapper = ensureLinkWrapper(element, relId);
      setOrRemoveAttr(wrapper, "href", href);
      setOrRemoveAttr(wrapper, "target", target);
      setOrRemoveAttr(wrapper, "rel", rel);
      setOrRemoveAttr(wrapper, "title", title);
    } else {
      removeManagedLinkWrapper(element, relId);
    }

    if (!opts.silent && state.selectedElement === element) {
      const payload = buildSelectionPayload(element, relId);
      postToEditor({ type: "REL_SELECTION", payload });
    }

    return true;
  }

  function applyTextOverride(relId, text, options) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return false;
    }

    const opts = options || {};
    const silent = Boolean(opts.silent);
    const element = findElementByRelIdOrFallback(safeRelId, state.elementsMap);
    if (!element) {
      if (!silent) {
        postToEditor({
          type: "REL_TEXT_ERROR",
          payload: { relId: safeRelId, message: "Element not found for text update" },
        });
      }
      return false;
    }

    const textInfo = getTextEditInfo(element);
    if (!textInfo.canEdit) {
      if (!silent) {
        postToEditor({
          type: "REL_TEXT_ERROR",
          payload: { relId: safeRelId, message: textInfo.reason || "Text editing is disabled for this element" },
        });
      }
      return false;
    }

    element.textContent = String(text || "");
    if (!silent && state.selectedElement === element) {
      const payload = buildSelectionPayload(element, safeRelId);
      postToEditor({ type: "REL_SELECTION", payload });
    }
    return true;
  }

  function ensureLinkWrapper(element, relId) {
    const parent = element.parentElement;
    if (parent && parent.tagName === "A") {
      if (!parent.dataset.relLinkWrapperFor) {
        parent.dataset.relLinkWrapperFor = relId;
      }
      return parent;
    }

    const wrapper = document.createElement("a");
    wrapper.dataset.relLinkWrapperFor = relId;
    if (element.parentNode) {
      element.parentNode.insertBefore(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  function removeManagedLinkWrapper(element, relId) {
    const parent = element.parentElement;
    if (!parent || parent.tagName !== "A") {
      return;
    }
    if (parent.dataset.relLinkWrapperFor !== relId) {
      return;
    }

    const grandParent = parent.parentNode;
    if (!grandParent) {
      return;
    }
    grandParent.insertBefore(element, parent);
    grandParent.removeChild(parent);
  }

  function ensureAddedNode(nodeDescriptor, selectAfterCreate) {
    const node = normalizeNodeDescriptor(nodeDescriptor);
    if (!node) {
      return null;
    }

    if (node.nodeId && state.appliedAddedNodeIds.has(node.nodeId)) {
      return null;
    }

    if (node.nodeId) {
      const existingByNodeId = document.querySelector(`[data-rel-added-node-id="${cssEscape(node.nodeId)}"]`);
      if (existingByNodeId) {
        state.appliedAddedNodeIds.add(node.nodeId);
        if (node.relId) {
          assignKnownRelId(existingByNodeId, node.relId);
        }
        return {
          nodeId: node.nodeId,
          relId: ensureRelId(existingByNodeId, node.relId),
          parentRelId: ensureRelId(existingByNodeId.parentElement || document.body),
          type: node.type,
          position: "append",
          props: node.props,
          fallbackSelector: buildStableSelector(existingByNodeId),
          stableSelector: buildStableSelector(existingByNodeId),
        };
      }
    }

    if (node.relId) {
      const existingByRelId = findElementByRelIdOrFallback(node.relId, state.elementsMap);
      if (existingByRelId) {
        if (node.nodeId) {
          existingByRelId.dataset.relAddedNodeId = node.nodeId;
          state.appliedAddedNodeIds.add(node.nodeId);
        }
        return {
          nodeId: node.nodeId || existingByRelId.dataset.relAddedNodeId || "",
          relId: node.relId,
          parentRelId: ensureRelId(existingByRelId.parentElement || document.body),
          type: node.type,
          position: "append",
          props: node.props,
          fallbackSelector: buildStableSelector(existingByRelId),
          stableSelector: buildStableSelector(existingByRelId),
        };
      }
    }

    const parent = resolveParentForNode(node.parentRelId);
    if (!parent) {
      return null;
    }

    const element = createNodeElement(node.type, node.props);
    if (!element) {
      return null;
    }

    const finalRelId = ensureRelId(element, node.relId);
    const finalNodeId = node.nodeId || generateNodeId();
    element.dataset.relAddedNodeId = finalNodeId;
    element.dataset.relManaged = "1";
    parent.appendChild(element);
    state.appliedAddedNodeIds.add(finalNodeId);

    if (selectAfterCreate) {
      selectElement(element);
    }

    return {
      nodeId: finalNodeId,
      relId: finalRelId,
      parentRelId: ensureRelId(parent),
      type: node.type,
      position: "append",
      props: node.props,
      fallbackSelector: buildStableSelector(element),
      stableSelector: buildStableSelector(element),
    };
  }

  function normalizeNodeDescriptor(nodeDescriptor) {
    if (!nodeDescriptor || typeof nodeDescriptor !== "object") {
      return null;
    }
    const type = String(nodeDescriptor.type || "").trim().toLowerCase();
    if (!type) {
      return null;
    }
    return {
      nodeId: String(nodeDescriptor.nodeId || "").trim(),
      relId: String(nodeDescriptor.relId || "").trim(),
      type,
      parentRelId: String(nodeDescriptor.parentRelId || "").trim(),
      props: nodeDescriptor.props && typeof nodeDescriptor.props === "object" ? nodeDescriptor.props : {},
    };
  }

  function resolveParentForNode(parentRelId) {
    let parent = null;
    if (parentRelId) {
      parent = findElementByRelIdOrFallback(parentRelId, state.elementsMap);
    }
    if (!parent) {
      parent = resolveFallbackParent();
    }

    if (!parent) {
      return document.body || document.documentElement;
    }

    if (canContainChildren(parent)) {
      return parent;
    }

    if (parent.parentElement && canContainChildren(parent.parentElement)) {
      return parent.parentElement;
    }

    return document.body || document.documentElement;
  }

  function resolveFallbackParent() {
    if (state.selectedElement && canContainChildren(state.selectedElement)) {
      return state.selectedElement;
    }
    if (state.selectedElement && state.selectedElement.parentElement && canContainChildren(state.selectedElement.parentElement)) {
      return state.selectedElement.parentElement;
    }
    return document.body || document.documentElement;
  }

  function createNodeElement(type, props) {
    switch (type) {
      case "section":
        return createSectionElement(props);
      case "container":
        return createTextNodeElement("div", props.text || "Container");
      case "heading-h1":
        return createTextNodeElement("h1", props.text || "Heading H1");
      case "heading-h2":
        return createTextNodeElement("h2", props.text || "Heading H2");
      case "heading-h3":
        return createTextNodeElement("h3", props.text || "Heading H3");
      case "paragraph":
        return createTextNodeElement("p", props.text || "Paragraph text");
      case "button": {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = props.text || "Button";
        return button;
      }
      case "image": {
        const img = document.createElement("img");
        img.src = normalizeAssetSrc(props.src || "https://via.placeholder.com/480x240.png?text=Image");
        img.alt = props.alt || "Image";
        return img;
      }
      case "link": {
        const anchor = document.createElement("a");
        anchor.href = props.href || "#";
        anchor.textContent = props.text || "Link";
        return anchor;
      }
      case "card":
        return createBasicCard();
      case "spacer": {
        const spacer = document.createElement("div");
        spacer.style.height = props.height || "24px";
        spacer.style.width = "100%";
        spacer.setAttribute("aria-hidden", "true");
        return spacer;
      }
      case "divider":
        return document.createElement("hr");
      case "bootstrap-card":
        return createBootstrapCard();
      case "bootstrap-button": {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-primary";
        btn.textContent = props.text || "Bootstrap Button";
        return btn;
      }
      case "bootstrap-grid":
        return createBootstrapGrid();
      case "bootstrap-navbar":
        return createBootstrapNavbar();
      case "bulma-button": {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "button is-primary";
        btn.textContent = props.text || "Bulma Button";
        return btn;
      }
      case "bulma-card":
        return createBulmaCard();
      case "pico-button": {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "contrast";
        btn.textContent = props.text || "Pico Button";
        return btn;
      }
      case "pico-link": {
        const link = document.createElement("a");
        link.href = props.href || "#";
        link.className = "contrast";
        link.textContent = props.text || "Pico Link";
        return link;
      }
      default:
        return createTextNodeElement("div", props.text || "New element");
    }
  }

  function createTextNodeElement(tagName, text) {
    const el = document.createElement(tagName);
    el.textContent = text;
    return el;
  }

  function createSectionElement(props) {
    const section = document.createElement("section");
    if (props && Object.prototype.hasOwnProperty.call(props, "text")) {
      section.textContent = String(props.text || "");
    }
    return section;
  }

  function createBasicCard() {
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

  function createBootstrapCard() {
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

  function createBootstrapGrid() {
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

  function createBootstrapNavbar() {
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

  function createBulmaCard() {
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

  function buildSelectionPayload(element, relId) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const linkContext = getLinkContext(element, relId);
    const stableSelector = buildStableSelector(element);
    const textInfo = getTextEditInfo(element);
    const parent = element.parentElement;
    const parentRelId = parent ? ensureRelId(parent) : "";
    const parentStableSelector = parent ? buildStableSelector(parent) : "";

    const computedSubset = {};
    for (const key of TRACKED_STYLES) {
      computedSubset[key] = computed.getPropertyValue(key);
    }

    const className = getUserClassString(element);
    const href = element.getAttribute("href") || "";
    const src = element.getAttribute("src") || "";

    return {
      relId,
      fallbackSelector: stableSelector,
      stableSelector,
      parentRelId,
      parentFallbackSelector: parentStableSelector,
      parentStableSelector,
      tagName: element.tagName.toLowerCase(),
      id: element.id || "",
      className,
      srcOrHref: src || href,
      alt: element.getAttribute("alt") || "",
      title: element.getAttribute("title") || "",
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      attributes: {
        id: element.id || "",
        class: className,
        src,
        href,
        alt: element.getAttribute("alt") || "",
        title: element.getAttribute("title") || "",
        target: element.getAttribute("target") || "",
        rel: element.getAttribute("rel") || "",
        width: element.getAttribute("width") || "",
        height: element.getAttribute("height") || "",
      },
      link: linkContext,
      isImage: element.tagName === "IMG",
      isAnchor: element.tagName === "A",
      canDelete: !isProtectedElement(element),
      textInfo,
      computed: computedSubset,
    };
  }

  function getLinkContext(element, relId) {
    if (element.tagName === "A") {
      return {
        enabled: true,
        isAnchor: true,
        canWrap: false,
        managedWrapper: false,
        href: element.getAttribute("href") || "",
        target: element.getAttribute("target") || "",
        rel: element.getAttribute("rel") || "",
        title: element.getAttribute("title") || "",
      };
    }

    const parent = element.parentElement;
    if (parent && parent.tagName === "A") {
      return {
        enabled: true,
        isAnchor: false,
        canWrap: true,
        managedWrapper: parent.dataset.relLinkWrapperFor === relId,
        href: parent.getAttribute("href") || "",
        target: parent.getAttribute("target") || "",
        rel: parent.getAttribute("rel") || "",
        title: parent.getAttribute("title") || "",
      };
    }

    return {
      enabled: false,
      isAnchor: false,
      canWrap: true,
      managedWrapper: false,
      href: "",
      target: "",
      rel: "",
      title: "",
    };
  }

  function getTextEditInfo(element) {
    if (!(element instanceof Element)) {
      return {
        isTextLike: false,
        canEdit: false,
        value: "",
        reason: "Element is not editable",
      };
    }

    const isTextLike = TEXT_EDIT_TAGS.has(element.tagName);
    if (!isTextLike) {
      return {
        isTextLike: false,
        canEdit: false,
        value: "",
        reason: "Text editing is available for text elements only",
      };
    }

    const childElementCount = element.children ? element.children.length : 0;
    const textNodes = Array.from(element.childNodes || []).filter((node) => node && node.nodeType === Node.TEXT_NODE);
    const nonWhitespaceTextNodes = textNodes.filter((node) => String(node.textContent || "").trim() !== "");

    if (childElementCount > 0) {
      return {
        isTextLike: true,
        canEdit: false,
        value: String(element.textContent || ""),
        reason: "Complex content detected. Text edit is disabled to preserve child elements.",
      };
    }

    if (nonWhitespaceTextNodes.length > 1) {
      return {
        isTextLike: true,
        canEdit: false,
        value: String(element.textContent || ""),
        reason: "Complex text nodes detected. Text edit is disabled.",
      };
    }

    return {
      isTextLike: true,
      canEdit: true,
      value: String(element.textContent || ""),
      reason: "",
    };
  }

  function buildStableSelector(element) {
    if (!(element instanceof Element)) {
      return "";
    }

    if (element.id) {
      const idSelector = `#${cssEscape(element.id)}`;
      if (matchesSingleElement(idSelector, element)) {
        return idSelector;
      }
    }

    const uniqueClassSelector = findUniqueClassSelector(element);
    if (uniqueClassSelector) {
      return uniqueClassSelector;
    }

    const anchoredWithoutNth = buildAnchoredSelector(element, false);
    if (anchoredWithoutNth) {
      return anchoredWithoutNth;
    }

    const anchoredWithNth = buildAnchoredSelector(element, true);
    if (anchoredWithNth) {
      return anchoredWithNth;
    }

    return buildMinimalNthPath(element);
  }

  function findUniqueClassSelector(element) {
    const classes = getUserClassString(element).split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      const classSelector = `.${cssEscape(cls)}`;
      if (matchesSingleElement(classSelector, element)) {
        return classSelector;
      }
    }
    return "";
  }

  function buildAnchoredSelector(element, allowNth) {
    const chain = [];
    let current = element;
    while (current && current !== document.body && chain.length < 6) {
      chain.unshift(current);
      current = current.parentElement;
    }
    if (chain.length === 0) {
      return "";
    }

    for (let anchorIndex = 0; anchorIndex < chain.length; anchorIndex += 1) {
      const anchorElement = chain[anchorIndex];
      const anchorSelector = buildAnchorSelector(anchorElement);
      if (!anchorSelector) {
        continue;
      }

      const baseSegments = [];
      for (let index = anchorIndex + 1; index < chain.length; index += 1) {
        baseSegments.push(buildPathSegment(chain[index], false));
      }
      const candidate = [anchorSelector, ...baseSegments].join(" ");
      if (matchesSingleElement(candidate, element)) {
        return candidate;
      }

      if (!allowNth || baseSegments.length === 0) {
        continue;
      }

      for (let segmentIndex = baseSegments.length - 1; segmentIndex >= 0; segmentIndex -= 1) {
        const withSingleNth = [...baseSegments];
        const sourceElement = chain[anchorIndex + 1 + segmentIndex];
        withSingleNth[segmentIndex] = buildPathSegment(sourceElement, true);
        const nthCandidate = [anchorSelector, ...withSingleNth].join(" ");
        if (matchesSingleElement(nthCandidate, element)) {
          return nthCandidate;
        }
      }

      const cumulativeNth = [...baseSegments];
      for (let segmentIndex = cumulativeNth.length - 1; segmentIndex >= 0; segmentIndex -= 1) {
        const sourceElement = chain[anchorIndex + 1 + segmentIndex];
        cumulativeNth[segmentIndex] = buildPathSegment(sourceElement, true);
        const nthCandidate = [anchorSelector, ...cumulativeNth].join(" ");
        if (matchesSingleElement(nthCandidate, element)) {
          return nthCandidate;
        }
      }
    }

    return "";
  }

  function buildAnchorSelector(element) {
    if (!(element instanceof Element)) {
      return "";
    }
    if (element.id) {
      const byId = `#${cssEscape(element.id)}`;
      if (matchesSingleElement(byId, element)) {
        return byId;
      }
    }

    const classes = getUserClassString(element).split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      const byClass = `.${cssEscape(cls)}`;
      if (matchesSingleElement(byClass, element)) {
        return byClass;
      }
      const byTagClass = `${element.tagName.toLowerCase()}.${cssEscape(cls)}`;
      if (matchesSingleElement(byTagClass, element)) {
        return byTagClass;
      }
    }

    return "";
  }

  function buildPathSegment(element, allowNth) {
    let segment = element.tagName.toLowerCase();
    const classes = getUserClassString(element).split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      segment += `.${cssEscape(classes[0])}`;
    }

    if (!allowNth) {
      return segment;
    }

    const parent = element.parentElement;
    if (!parent) {
      return segment;
    }

    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter((child) => {
      return child instanceof Element && child.tagName.toLowerCase() === tagName;
    });

    if (siblings.length <= 1) {
      return segment;
    }

    const index = siblings.indexOf(element) + 1;
    if (index <= 0) {
      return segment;
    }
    return `${segment}:nth-of-type(${index})`;
  }

  function buildMinimalNthPath(element) {
    const parts = [];
    let current = element;
    while (current && current !== document.body && parts.length < 6) {
      const tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        parts.unshift(tagName);
        break;
      }

      const siblings = Array.from(parent.children).filter((child) => {
        return child instanceof Element && child.tagName.toLowerCase() === tagName;
      });
      const index = siblings.indexOf(current) + 1;
      const needsNth = siblings.length > 1 && index > 0;
      parts.unshift(needsNth ? `${tagName}:nth-of-type(${index})` : tagName);
      current = parent;
    }

    if (parts.length === 0) {
      return element.tagName.toLowerCase();
    }
    return parts.join(" ");
  }

  function matchesSingleElement(selector, element) {
    if (!(element instanceof Element)) {
      return false;
    }
    const normalized = String(selector || "").trim();
    if (!normalized) {
      return false;
    }
    try {
      const matches = document.querySelectorAll(normalized);
      return matches.length === 1 && matches[0] === element;
    } catch {
      return false;
    }
  }

  function getTreeSnapshot() {
    const result = [];
    const root = document.body;
    if (!root) {
      return result;
    }

    const stack = [{ element: root, depth: 0 }];
    while (stack.length > 0) {
      const item = stack.pop();
      const el = item.element;
      const depth = item.depth;

      if (!(el instanceof Element)) {
        continue;
      }

      if (SKIP_TAGS.has(el.tagName)) {
        continue;
      }

      const relId = ensureRelId(el);
      result.push({
        relId,
        depth,
        tagName: el.tagName.toLowerCase(),
        id: el.id || "",
        className: getUserClassString(el),
      });

      const children = Array.from(el.children).filter((child) => !SKIP_TAGS.has(child.tagName));
      for (let i = children.length - 1; i >= 0; i -= 1) {
        stack.push({ element: children[i], depth: depth + 1 });
      }
    }

    return result;
  }

  function ensureRelId(element, preferredRelId) {
    if (!(element instanceof Element)) {
      return "";
    }

    if (element.dataset.relId) {
      return element.dataset.relId;
    }

    if (preferredRelId) {
      return assignKnownRelId(element, preferredRelId);
    }

    const generated = generateRelId();
    element.dataset.relId = generated;
    return generated;
  }

  function assignKnownRelId(element, preferredRelId) {
    const wanted = String(preferredRelId || "").trim();
    if (!wanted) {
      return ensureRelId(element);
    }

    const conflict = document.querySelector(`[data-rel-id="${cssEscape(wanted)}"]`);
    if (conflict && conflict !== element) {
      return ensureRelId(element);
    }

    element.dataset.relId = wanted;
    return wanted;
  }

  function findElementByRelIdOrFallback(relId, elementsMap) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return null;
    }

    const direct = document.querySelector(`[data-rel-id="${cssEscape(safeRelId)}"]`);
    if (direct) {
      return direct;
    }

    const fallbackSelector = elementsMap && elementsMap[safeRelId] ? String(elementsMap[safeRelId]) : "";
    if (!fallbackSelector) {
      return null;
    }

    try {
      const fallbackElement = document.querySelector(fallbackSelector);
      if (fallbackElement) {
        assignKnownRelId(fallbackElement, safeRelId);
      }
      return fallbackElement;
    } catch {
      return null;
    }
  }

  function resolveDropTarget(rawTarget) {
    const element = rawTarget instanceof Element ? rawTarget : null;
    if (!element) {
      return resolveFallbackParent();
    }

    let current = element;
    while (current) {
      if (canContainChildren(current) && !SKIP_TAGS.has(current.tagName)) {
        return current;
      }
      current = current.parentElement;
    }

    return resolveFallbackParent();
  }

  function canContainChildren(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (SKIP_TAGS.has(element.tagName)) {
      return false;
    }
    if (VOID_TAGS.has(element.tagName)) {
      return false;
    }
    return true;
  }

  function isProtectedElement(element) {
    if (!(element instanceof Element)) {
      return true;
    }
    return PROTECTED_TAGS.has(element.tagName);
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (target.closest("input, textarea, select")) {
      return true;
    }
    return target.isContentEditable;
  }

  function centerElementInParent(relId) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return false;
    }

    const element = findElementByRelIdOrFallback(safeRelId, state.elementsMap);
    if (!element) {
      return false;
    }

    let container = resolveCenterContainer(element);
    if (!container) {
      container = ensureCenterWrapper(element, safeRelId);
    }
    if (!container) {
      return false;
    }

    const containerRelId = ensureRelId(container);
    container.style.setProperty("display", "flex");
    container.style.setProperty("justify-content", "center");
    container.style.setProperty("align-items", "center");
    if (container.dataset.relWrapper === "center") {
      container.style.setProperty("width", "100%");
    }

    const stableSelector = buildStableSelector(container);
    postToEditor({
      type: "REL_CENTER_APPLIED",
      payload: {
        relId: safeRelId,
        containerRelId,
        fallbackSelector: stableSelector,
        stableSelector,
        appliedProps: {
          display: "flex",
          "justify-content": "center",
          "align-items": "center",
        },
      },
    });
    postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    logVite(`Center helper applied via container ${containerRelId}`);
    return true;
  }

  function resolveCenterContainer(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    let current = element.parentElement;
    while (current) {
      const isProtectedContainer = PROTECTED_TAGS.has(current.tagName);
      if (
        !isProtectedContainer
        &&
        canContainChildren(current)
        && (current.dataset.relManaged === "1" || Boolean(current.dataset.relId))
      ) {
        return current;
      }
      current = current.parentElement;
    }

    const directParent = element.parentElement;
    if (directParent && !PROTECTED_TAGS.has(directParent.tagName) && canContainChildren(directParent)) {
      return directParent;
    }

    return null;
  }

  function ensureCenterWrapper(element, relId) {
    if (!(element instanceof Element)) {
      return null;
    }

    const parent = element.parentElement;
    if (!parent || !element.parentNode) {
      return null;
    }

    if (parent.dataset.relWrapper === "center" && parent.dataset.relWrapperFor === relId) {
      return parent;
    }

    const wrapper = document.createElement("div");
    wrapper.dataset.relWrapper = "center";
    wrapper.dataset.relWrapperFor = relId;
    wrapper.dataset.relManaged = "1";
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    return wrapper;
  }

  function setActiveDropTarget(target) {
    if (state.activeDropTarget === target) {
      return;
    }
    clearDropTarget();
    state.activeDropTarget = target;
    target.classList.add(MANAGED_DROP_CLASS);
  }

  function clearDropTarget() {
    if (state.activeDropTarget) {
      state.activeDropTarget.classList.remove(MANAGED_DROP_CLASS);
      state.activeDropTarget = null;
    }
  }

  function blockTopNavigation() {
    const originalOpen = window.open;
    window.open = function () {
      if (state.editMode) {
        return null;
      }
      return originalOpen.apply(window, arguments);
    };

    document.addEventListener(
      "submit",
      (event) => {
        if (state.editMode) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );
  }

  function setupViteHeadObserver() {
    if (!IS_VITE_PROXY_MODE || !document.head || state.viteHeadObserver) {
      return;
    }

    state.viteHeadObserver = new MutationObserver(() => {
      scheduleViteHeadOrderEnsure();
    });
    state.viteHeadObserver.observe(document.head, { childList: true });
    ensureViteHeadOrderNow();
    logVite("Head cascade watcher enabled");
  }

  function scheduleViteHeadOrderEnsure() {
    if (!IS_VITE_PROXY_MODE || !document.head) {
      return;
    }
    if (state.viteHeadEnsureRafId) {
      return;
    }

    state.viteHeadEnsureRafId = window.requestAnimationFrame(() => {
      state.viteHeadEnsureRafId = 0;
      ensureViteHeadOrderNow();
    });
  }

  function ensureViteHeadOrderNow() {
    if (!IS_VITE_PROXY_MODE || !document.head) {
      return;
    }

    const orderedSelectors = [
      'link[data-rel-runtime="overlay-css"]',
      'link[data-rel-runtime="override-css"]',
      'style[data-rel-theme-managed="1"]',
      'style[data-rel-vite-global-body="1"]',
    ];

    for (const selector of orderedSelectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        if (node.parentElement === document.head) {
          document.head.appendChild(node);
        }
      }
    }
  }

  function updateViteBodyGlobalOverrideFromBody(bodyElement) {
    if (!IS_VITE_PROXY_MODE || !document.head) {
      return;
    }

    const body = bodyElement instanceof HTMLBodyElement ? bodyElement : document.body;
    if (!body) {
      return;
    }

    const declarations = [];
    const trackedValues = state.viteBodyGlobalStyleValues || {};
    for (const key of VITE_GLOBAL_STYLE_PROPS) {
      const trackedValue = String(trackedValues[key] || "").trim();
      const fallbackValue = String(body.style.getPropertyValue(key) || "").trim();
      const value = state.viteBodyGlobalStyleTouched ? trackedValue : (trackedValue || fallbackValue);
      if (!value) {
        continue;
      }
      declarations.push([key, value]);
    }

    const selector = 'style[data-rel-vite-global-body="1"]';
    const existing = document.querySelector(selector);
    if (declarations.length === 0) {
      if (existing) {
        existing.remove();
        logVite("Removed global body override block");
      }
      scheduleViteHeadOrderEnsure();
      return;
    }

    const cssLines = [
      "html, body, #root, #root > * {",
      ...declarations.map(([property, value]) => `  ${property}: ${value} !important;`),
      "}",
    ];
    const styleNode = existing || document.createElement("style");
    styleNode.dataset.relViteGlobalBody = "1";
    styleNode.textContent = cssLines.join("\n");
    if (!existing) {
      document.head.appendChild(styleNode);
    }
    logVite(`Updated global body override (${declarations.map(([key]) => key).join(", ")})`);
    scheduleViteHeadOrderEnsure();
  }

  function trackViteBodyGlobalStyleValue(property, value) {
    if (!IS_VITE_PROXY_MODE || !VITE_GLOBAL_STYLE_PROPS.includes(property)) {
      return;
    }

    state.viteBodyGlobalStyleTouched = true;
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      delete state.viteBodyGlobalStyleValues[property];
      return;
    }
    state.viteBodyGlobalStyleValues[property] = normalizedValue;
  }

  function applyRuntimeLibraries(rawLibraries) {
    const libraries = normalizeRuntimeLibraries(rawLibraries);
    clearInjectedLibraries();

    const assets = collectLibraryAssets(libraries);
    for (const asset of assets) {
      if (asset.type === "style") {
        if (hasAssetAlready("style", asset.url)) {
          continue;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = asset.url;
        link.dataset.relLib = asset.key;
        link.dataset.relLibType = "style";
        link.dataset.relLibManaged = "1";
        document.head.appendChild(link);
        continue;
      }

      if (asset.type === "script") {
        if (hasAssetAlready("script", asset.url)) {
          continue;
        }
        const script = document.createElement("script");
        script.src = asset.url;
        script.dataset.relLib = asset.key;
        script.dataset.relLibType = "script";
        script.dataset.relLibManaged = "1";
        document.head.appendChild(script);
      }
    }

    state.runtimeLibraries = libraries;
    if (IS_VITE_PROXY_MODE) {
      scheduleViteHeadOrderEnsure();
    }
    postToEditor({ type: "REL_LIBRARIES_APPLIED", payload: libraries });
  }

  function clearInjectedLibraries() {
    const nodes = document.querySelectorAll('[data-rel-lib-managed="1"]');
    for (const node of nodes) {
      node.remove();
    }
  }

  function collectLibraryAssets(libraries) {
    const assets = [];
    const designLibrary = libraries.designLibrary;

    if (designLibrary && designLibrary !== "none" && LIBRARY_ASSETS[designLibrary]) {
      const entry = LIBRARY_ASSETS[designLibrary];
      for (const url of entry.styles || []) {
        assets.push({ type: "style", key: `${designLibrary}-style`, url });
      }
      for (const url of entry.scripts || []) {
        if (designLibrary === "bootstrap" && !libraries.bootstrapJs) {
          continue;
        }
        assets.push({ type: "script", key: `${designLibrary}-script`, url });
      }
    }

    const iconSet = libraries.iconSet;
    if (iconSet && iconSet !== "none" && LIBRARY_ASSETS.icons[iconSet]) {
      const iconStyles = LIBRARY_ASSETS.icons[iconSet].styles || [];
      for (const url of iconStyles) {
        assets.push({ type: "style", key: `${iconSet}-icon`, url });
      }
    }

    if (libraries.animateCss) {
      assets.push({ type: "style", key: "animate-css", url: LIBRARY_ASSETS.animateCss });
    }

    return assets;
  }

  function notifyResizerSelectionChange(element) {
    window.dispatchEvent(new CustomEvent(RESIZER_SELECTION_EVENT, {
      detail: {
        element: element instanceof Element ? element : null,
      },
    }));
  }

  function ensureResizerModuleLoaded() {
    if (document.querySelector('script[data-rel-runtime="resizer-js"]')) {
      return;
    }
    if (!document.head) {
      return;
    }

    const script = document.createElement("script");
    script.src = "/runtime/resizer.js";
    script.dataset.relRuntime = "resizer-js";
    script.async = false;
    document.head.appendChild(script);
    if (IS_VITE_PROXY_MODE) {
      scheduleViteHeadOrderEnsure();
    }
  }

  function applyRuntimeFonts(rawFonts) {
    const fonts = normalizeRuntimeFonts(rawFonts);
    clearInjectedFonts();

    if (fonts.provider !== "none") {
      for (const family of fonts.families) {
        const href = buildRuntimeFontHref(fonts.provider, family);
        if (!href) {
          continue;
        }
        if (hasAssetAlready("style", href)) {
          continue;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.relFont = fonts.provider;
        link.dataset.relFontFamily = family;
        link.dataset.relFontManaged = "1";
        document.head.appendChild(link);
      }
    }

    state.runtimeFonts = fonts;
    if (IS_VITE_PROXY_MODE) {
      scheduleViteHeadOrderEnsure();
    }
    postToEditor({ type: "REL_FONTS_APPLIED", payload: fonts });
  }

  function applyThemeCss(cssText) {
    const normalized = String(cssText || "").trim();
    const selector = 'style[data-rel-theme-managed="1"]';
    const existing = document.querySelector(selector);

    if (!normalized) {
      if (existing) {
        existing.remove();
      }
      state.themeCss = "";
      if (IS_VITE_PROXY_MODE) {
        scheduleViteHeadOrderEnsure();
      }
      postToEditor({ type: "REL_THEME_APPLIED", payload: { active: false } });
      return;
    }

    const node = existing || document.createElement("style");
    node.dataset.relThemeManaged = "1";
    node.textContent = normalized;
    if (!existing) {
      document.head.appendChild(node);
    }

    state.themeCss = normalized;
    if (IS_VITE_PROXY_MODE) {
      scheduleViteHeadOrderEnsure();
    }
    postToEditor({ type: "REL_THEME_APPLIED", payload: { active: true } });
  }

  function clearInjectedFonts() {
    const nodes = document.querySelectorAll('[data-rel-font-managed="1"]');
    for (const node of nodes) {
      node.remove();
    }
  }

  function buildRuntimeFontHref(provider, family) {
    const cleanFamily = normalizeFontFamilyName(family);
    if (!cleanFamily) {
      return "";
    }

    const familyQuery = encodeURIComponent(cleanFamily).replace(/%20/g, "+");
    if (provider === "google") {
      return `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@300;400;600;700&display=swap`;
    }
    if (provider === "bunny") {
      return `https://fonts.bunny.net/css?family=${familyQuery}:300,400,600,700&display=swap`;
    }
    if (provider === "adobe-edge") {
      return `https://use.edgefonts.net/${familyQuery}.css`;
    }
    return "";
  }

  function normalizeRuntimeFonts(value) {
    const raw = value && typeof value === "object" ? value : {};
    const provider = normalizeEnum(raw.provider, ["none", "google", "bunny", "adobe-edge"], "none");
    return {
      provider,
      families: provider === "none" ? [] : normalizeFontFamilies(raw.families),
    };
  }

  function normalizeFontFamilies(value) {
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

  function normalizeRuntimeLibraries(value) {
    const raw = value && typeof value === "object" ? value : {};
    return {
      designLibrary: normalizeEnum(raw.designLibrary, ["none", "bootstrap", "bulma", "pico", "tailwind"], "none"),
      iconSet: normalizeEnum(raw.iconSet, ["none", "material-icons", "font-awesome"], "none"),
      animateCss: Boolean(raw.animateCss),
      bootstrapJs: Boolean(raw.bootstrapJs),
    };
  }

  function normalizeEnum(value, allowed, fallback) {
    const text = String(value || "").trim().toLowerCase();
    return allowed.includes(text) ? text : fallback;
  }

  function hasAssetAlready(type, url) {
    const absolute = toAbsoluteUrl(url);
    if (type === "style") {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      for (const link of links) {
        if (toAbsoluteUrl(link.href) === absolute) {
          return true;
        }
      }
      return false;
    }

    const scripts = document.querySelectorAll("script[src]");
    for (const script of scripts) {
      if (toAbsoluteUrl(script.src) === absolute) {
        return true;
      }
    }
    return false;
  }

  function toAbsoluteUrl(url) {
    try {
      return new URL(url, document.baseURI).href;
    } catch {
      return String(url || "");
    }
  }

  function normalizeClassString(value) {
    const tokens = String(value || "")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token && token !== MANAGED_SELECTION_CLASS && token !== MANAGED_DROP_CLASS);
    return tokens.join(" ");
  }

  function getUserClassString(element) {
    return normalizeClassString(element.className || "");
  }

  function isValidId(value) {
    return /^[A-Za-z_][A-Za-z0-9_\-:.]*$/.test(value);
  }

  function setOrRemoveAttr(element, name, value) {
    const normalized = String(value || "").trim();
    if (!normalized) {
      element.removeAttribute(name);
      return;
    }
    element.setAttribute(name, normalized);
  }

  function normalizeAssetSrc(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return raw;
    }
    if (raw.startsWith("/project/")) {
      return raw;
    }
    if (/^(https?:|data:|blob:|mailto:|tel:|\/)/i.test(raw)) {
      return raw;
    }
    if (raw.startsWith("rel_editor/")) {
      return `/project/${encodePath(raw)}`;
    }
    return raw;
  }

  function generateRelId() {
    return `rel-${Date.now().toString(36)}-${state.idCounter++}`;
  }

  function generateNodeId() {
    return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function encodePath(pathValue) {
    return String(pathValue || "")
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  function logVite(message) {
    if (!IS_VITE_PROXY_MODE) {
      return;
    }
    console.log(`[REL VITE] ${String(message || "").trim()}`);
  }

  function postToEditor(message) {
    window.parent.postMessage(message, window.location.origin);
  }

  function cssEscape(value) {
    return String(value).replace(/(["\\])/g, "\\$1");
  }
})();
