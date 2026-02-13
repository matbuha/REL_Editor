(function () {
  if (window.__REL_OVERLAY_LOADED__) {
    return;
  }
  window.__REL_OVERLAY_LOADED__ = true;

  const TRACKED_STYLES = [
    "color",
    "background-color",
    "font-size",
    "font-weight",
    "line-height",
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

  const state = {
    selectedElement: null,
    idCounter: 1,
    editMode: true,
    pendingDragNodeTemplate: null,
    activeDropTarget: null,
    elementsMap: {},
    appliedAddedNodeIds: new Set(),
  };

  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onDocumentKeyDown, true);
  document.addEventListener("dragover", onDocumentDragOver, true);
  document.addEventListener("drop", onDocumentDrop, true);
  document.addEventListener("dragleave", onDocumentDragLeave, true);
  window.addEventListener("message", onMessageFromEditor);

  blockTopNavigation();
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
    }
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

    const payload = buildSelectionPayload(element, relId);
    postToEditor({ type: "REL_SELECTION", payload });
  }

  function applyStyle(relId, property, value) {
    if (!relId || !property) {
      return;
    }

    const element = findElementByRelIdOrFallback(relId, state.elementsMap);
    if (!element) {
      return;
    }

    if (value === "") {
      element.style.removeProperty(property);
    } else {
      element.style.setProperty(property, value);
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
          fallbackSelector: buildFallbackSelector(existingByNodeId),
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
          fallbackSelector: buildFallbackSelector(existingByRelId),
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
      fallbackSelector: buildFallbackSelector(element),
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
        return createTextNodeElement("section", props.text || "New section");
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
      default:
        return createTextNodeElement("div", props.text || "New element");
    }
  }

  function createTextNodeElement(tagName, text) {
    const el = document.createElement(tagName);
    el.textContent = text;
    return el;
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

  function buildSelectionPayload(element, relId) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const linkContext = getLinkContext(element, relId);

    const computedSubset = {};
    for (const key of TRACKED_STYLES) {
      computedSubset[key] = computed.getPropertyValue(key);
    }

    const className = getUserClassString(element);
    const href = element.getAttribute("href") || "";
    const src = element.getAttribute("src") || "";

    return {
      relId,
      fallbackSelector: buildFallbackSelector(element),
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

  function buildFallbackSelector(element) {
    if (element.id) {
      return `#${cssEscape(element.id)}`;
    }

    const parts = [];
    let current = element;
    let depth = 0;

    while (current && current.nodeType === 1 && depth < 5) {
      let part = current.tagName.toLowerCase();
      const className = getUserClassString(current).split(/\s+/)[0];
      if (className) {
        part += `.${cssEscape(className)}`;
      }
      parts.unshift(part);
      current = current.parentElement;
      depth += 1;
    }

    return parts.join(" > ");
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

  function postToEditor(message) {
    window.parent.postMessage(message, window.location.origin);
  }

  function cssEscape(value) {
    return String(value).replace(/(["\\])/g, "\\$1");
  }
})();
