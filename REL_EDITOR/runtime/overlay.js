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
    "position",
    "z-index",
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
  const INLINE_ADD_EDGE_PX = 8;
  const INLINE_ADD_LAYOUT_TAGS = new Set(["SECTION", "DIV", "MAIN", "ARTICLE", "ASIDE", "NAV", "HEADER", "FOOTER", "FORM"]);
  const INLINE_ADD_ACTIONS = [
    {
      type: "container",
      label: "+ Container",
      props: { text: "Container" },
      tooltip: "Add a container at this edge (before/after target). Example: add a container before section.",
    },
    {
      type: "section",
      label: "+ Section",
      props: {},
      tooltip: "Add a section at this edge (before/after target). Example: add a section after container.",
    },
    {
      type: "heading-h2",
      label: "+ Heading",
      props: { text: "Heading H2" },
      tooltip: "Add a heading block at this edge. Example: insert heading before card row.",
    },
    {
      type: "paragraph",
      label: "+ Paragraph",
      props: { text: "Paragraph text" },
      tooltip: "Add a paragraph block at this edge. Example: add paragraph after heading.",
    },
    {
      type: "image",
      label: "+ Image",
      props: { alt: "Image" },
      tooltip: "Add an image placeholder at this edge. Example: insert image after paragraph.",
    },
  ];
  const QUICK_ACTION_CLASS_TOKENS_REGEX = /\s+/;
  const QUICK_ACTIONS = [
    {
      action: "duplicate",
      label: "Duplicate",
      tooltip: "Duplicate selected element with children. Inserts copy right after current element.",
    },
    {
      action: "delete",
      label: "Delete",
      tooltip: "Delete selected element. Protected root elements (html/body) cannot be deleted.",
    },
    {
      action: "move-up",
      label: "Move Up",
      tooltip: "Move selected element one position up inside the same parent.",
    },
    {
      action: "move-down",
      label: "Move Down",
      tooltip: "Move selected element one position down inside the same parent.",
    },
    {
      action: "wrap-container",
      label: "Wrap with Container",
      tooltip: "Insert a container at current position and move selected element inside it.",
    },
    {
      action: "convert-section",
      label: "Convert to Section",
      tooltip: "Convert selected element to a section while preserving current content.",
    },
    {
      action: "add-class",
      label: "Add class",
      tooltip: "Add one or more CSS classes (space-separated). Existing classes are kept.",
    },
  ];
  const PREVIEW_CONTEXT_ACTIONS = [
    {
      action: "duplicate",
      label: "Duplicate",
      tooltip: "Create a copy after the current element.",
    },
    {
      action: "delete",
      label: "Delete",
      tooltip: "Delete this element.",
    },
    {
      action: "move-up",
      label: "Move before",
      tooltip: "Move one step up within the same parent.",
    },
    {
      action: "move-down",
      label: "Move after",
      tooltip: "Move one step down within the same parent.",
    },
    {
      action: "insert-container-above",
      label: "Insert container above",
      tooltip: "Insert a new container immediately before this element.",
    },
    {
      action: "insert-section-below",
      label: "Insert section below",
      tooltip: "Insert a new section immediately after this element.",
    },
  ];
  const QUICK_TOOLBAR_VIEWPORT_GAP_PX = 8;
  const QUICK_TOOLBAR_DEFAULT_OFFSET_PX = 10;
  const IMPORTANT_STYLE_PROPS = new Set([
    "background",
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
  ]);

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
    inlineAdd: {
      root: null,
      visible: false,
      targetElement: null,
      targetRelId: "",
      targetFallbackSelector: "",
      placement: "",
    },
    quickActions: {
      root: null,
      actionsRow: null,
      classRow: null,
      classInput: null,
      classApplyBtn: null,
      classCancelBtn: null,
      visible: false,
      classMode: false,
      targetElement: null,
      hiddenByEscape: false,
    },
    contextMenu: {
      root: null,
      visible: false,
      targetElement: null,
      targetRelId: "",
      targetFallbackSelector: "",
    },
  };

  ensureResizerModuleLoaded();
  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("keydown", onDocumentKeyDown, true);
  document.addEventListener("contextmenu", onDocumentContextMenu, true);
  document.addEventListener("mousemove", onDocumentMouseMove, true);
  document.addEventListener("mouseleave", onDocumentMouseLeave, true);
  document.addEventListener("dragover", onDocumentDragOver, true);
  document.addEventListener("drop", onDocumentDrop, true);
  document.addEventListener("dragleave", onDocumentDragLeave, true);
  window.addEventListener("resize", hideInlineAddBar, true);
  window.addEventListener("scroll", hideInlineAddBar, true);
  window.addEventListener("resize", onViewportAdjusted, true);
  window.addEventListener("scroll", onViewportAdjusted, true);
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

    if (!target.closest('[data-rel-overlay-type="preview-context-menu"]')) {
      hidePreviewContextMenu();
    }

    if (target.closest("[data-rel-runtime='overlay-ui'], [data-rel-runtime='inline-add-bar']")) {
      return;
    }

    hideInlineAddBar();
    event.preventDefault();
    event.stopPropagation();
    selectElement(target);
  }

  function onDocumentKeyDown(event) {
    if (!state.editMode) {
      return;
    }

    if (event.key === "Escape") {
      const closedContext = hidePreviewContextMenu();
      const closedClassForm = setQuickActionsClassMode(false);
      const closedToolbar = hideQuickActionsToolbar({
        preserveSelection: true,
        markEscape: true,
      });
      if (closedContext || closedClassForm || closedToolbar) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
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

  function onDocumentContextMenu(event) {
    if (!state.editMode) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('[data-rel-runtime="inline-add-bar"]')) {
      event.preventDefault();
      return;
    }

    if (target.closest('[data-rel-runtime="overlay-ui"]')) {
      event.preventDefault();
      return;
    }

    const contextTarget = resolveContextTargetElement(target);
    if (!contextTarget) {
      hidePreviewContextMenu();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    hideInlineAddBar();
    selectElement(contextTarget);
    showPreviewContextMenu(event.clientX, event.clientY, contextTarget);
  }

  function onDocumentDragOver(event) {
    if (!state.pendingDragNodeTemplate) {
      return;
    }

    hideInlineAddBar();
    hideQuickActionsToolbar({ preserveSelection: true });
    hidePreviewContextMenu();

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

    hideInlineAddBar();
    hideQuickActionsToolbar({ preserveSelection: true });
    hidePreviewContextMenu();
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

  function onDocumentMouseMove(event) {
    if (!state.editMode) {
      hideInlineAddBar();
      return;
    }
    if (state.pendingDragNodeTemplate || document.body?.classList.contains("rel-resizing")) {
      hideInlineAddBar();
      hideQuickActionsToolbar({ preserveSelection: true });
      hidePreviewContextMenu();
      return;
    }

    if (
      state.selectedElement instanceof Element
      && !state.quickActions.visible
      && !state.quickActions.hiddenByEscape
    ) {
      showQuickActionsToolbar(state.selectedElement);
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      hideInlineAddBar();
      return;
    }

    if (target.closest('[data-rel-runtime="inline-add-bar"]')) {
      return;
    }
    if (target.closest("[data-rel-runtime='overlay-ui']")) {
      hideInlineAddBar();
      return;
    }

    const hoverElement = resolveInlineAddHoverElement(target);
    if (!hoverElement) {
      hideInlineAddBar();
      return;
    }

    const rect = hoverElement.getBoundingClientRect();
    if (!Number.isFinite(rect.top) || rect.height <= 0 || rect.width <= 0) {
      hideInlineAddBar();
      return;
    }
    const pointerY = Number(event.clientY);
    if (!Number.isFinite(pointerY) || pointerY < rect.top || pointerY > rect.bottom) {
      hideInlineAddBar();
      return;
    }

    const nearTop = pointerY <= rect.top + INLINE_ADD_EDGE_PX;
    const nearBottom = pointerY >= rect.bottom - INLINE_ADD_EDGE_PX;
    if (!nearTop && !nearBottom) {
      hideInlineAddBar();
      return;
    }

    const placement = nearTop ? "before" : "after";
    showInlineAddBar(hoverElement, placement, rect);
  }

  function onDocumentMouseLeave() {
    hideInlineAddBar();
  }

  function onViewportAdjusted() {
    hidePreviewContextMenu();
    positionQuickActionsToolbar();
  }

  function ensureInlineAddBar() {
    if (state.inlineAdd.root && state.inlineAdd.root.isConnected) {
      return state.inlineAdd.root;
    }

    const root = document.createElement("div");
    root.className = "rel-inline-add-bar";
    root.dataset.relRuntime = "inline-add-bar";
    root.setAttribute("aria-hidden", "true");

    const actions = document.createElement("div");
    actions.className = "rel-inline-add-actions";
    root.appendChild(actions);

    for (const action of INLINE_ADD_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rel-inline-add-btn";
      button.dataset.relInlineAddType = action.type;
      button.textContent = action.label;
      button.title = action.tooltip;
      actions.appendChild(button);
    }

    root.addEventListener("click", (event) => {
      const target = event.target;
      const actionButton = target instanceof Element
        ? target.closest(".rel-inline-add-btn")
        : null;
      if (!(actionButton instanceof HTMLButtonElement)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      applyInlineAddAction(actionButton.dataset.relInlineAddType || "");
    });

    document.body.appendChild(root);
    state.inlineAdd.root = root;
    return root;
  }

  function showInlineAddBar(targetElement, placement, rect) {
    if (!(targetElement instanceof Element)) {
      hideInlineAddBar();
      return;
    }

    const root = ensureInlineAddBar();
    const edgeY = placement === "before" ? rect.top : rect.bottom;
    root.style.left = `${Math.round(rect.left)}px`;
    root.style.width = `${Math.max(40, Math.round(rect.width))}px`;
    root.style.top = `${Math.round(edgeY)}px`;
    root.dataset.placement = placement === "before" ? "before" : "after";
    root.classList.add("is-visible");
    root.setAttribute("aria-hidden", "false");

    state.inlineAdd.visible = true;
    state.inlineAdd.targetElement = targetElement;
    state.inlineAdd.targetRelId = ensureRelId(targetElement);
    state.inlineAdd.targetFallbackSelector = buildStableSelector(targetElement);
    state.inlineAdd.placement = placement === "before" ? "before" : "after";
  }

  function hideInlineAddBar() {
    const root = state.inlineAdd.root;
    if (root instanceof HTMLElement) {
      root.classList.remove("is-visible");
      root.removeAttribute("data-placement");
      root.setAttribute("aria-hidden", "true");
    }
    state.inlineAdd.visible = false;
    state.inlineAdd.targetElement = null;
    state.inlineAdd.targetRelId = "";
    state.inlineAdd.targetFallbackSelector = "";
    state.inlineAdd.placement = "";
  }

  function resolveInlineAddHoverElement(rawTarget) {
    const start = rawTarget instanceof Element ? rawTarget : null;
    if (!start) {
      return null;
    }

    let cursor = start;
    while (cursor) {
      if (isInlineAddEligibleElement(cursor)) {
        return cursor;
      }
      cursor = cursor.parentElement;
    }
    return null;
  }

  function isInlineAddEligibleElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (SKIP_TAGS.has(element.tagName)) {
      return false;
    }
    if (element.tagName === "BODY") {
      return false;
    }
    if (isProtectedElement(element) || isEditorSystemElement(element)) {
      return false;
    }
    if (!canContainChildren(element)) {
      return false;
    }

    const tagName = element.tagName.toUpperCase();
    if (tagName === "SECTION") {
      return true;
    }

    const classValue = String(element.className || "").toLowerCase();
    if (classValue.includes("container")) {
      return true;
    }

    return INLINE_ADD_LAYOUT_TAGS.has(tagName);
  }

  function applyInlineAddAction(rawType) {
    const type = String(rawType || "").trim().toLowerCase();
    if (!type || !state.inlineAdd.targetElement || !state.inlineAdd.placement) {
      return;
    }

    const targetElement = state.inlineAdd.targetElement;
    if (!(targetElement instanceof Element)) {
      hideInlineAddBar();
      return;
    }

    const action = INLINE_ADD_ACTIONS.find((item) => item.type === type);
    if (!action) {
      return;
    }

    const targetRelId = state.inlineAdd.targetRelId || ensureRelId(targetElement);
    let placement = state.inlineAdd.placement === "before" ? "before" : "after";
    // Fallback: for empty containers/layout nodes, bottom-edge add should place inside.
    if (
      placement === "after"
      && canContainChildren(targetElement)
      && targetElement.children.length === 0
    ) {
      placement = "inside";
    }
    const parent = targetElement.parentElement;
    const parentRelId = parent ? ensureRelId(parent) : "";
    const nodeDescriptor = {
      nodeId: generateNodeId(),
      relId: generateRelId(),
      type: action.type,
      position: placement,
      parentRelId: placement === "inside" ? targetRelId : parentRelId,
      targetRelId,
      targetFallbackSelector: state.inlineAdd.targetFallbackSelector || buildStableSelector(targetElement),
      props: action.props || {},
    };

    const created = ensureAddedNode(nodeDescriptor, true);
    if (created) {
      postToEditor({ type: "REL_NODE_ADDED", payload: { node: created } });
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }
    hideInlineAddBar();
  }

  function resolveContextTargetElement(rawTarget) {
    let current = rawTarget instanceof Element ? rawTarget : null;
    while (current) {
      if (!SKIP_TAGS.has(current.tagName) && !isEditorSystemElement(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function ensureQuickActionsToolbar() {
    if (state.quickActions.root && state.quickActions.root.isConnected) {
      return state.quickActions.root;
    }

    const root = document.createElement("div");
    root.className = "rel-quick-actions-toolbar";
    root.dataset.relRuntime = "overlay-ui";
    root.dataset.relOverlayType = "quick-actions-toolbar";
    root.setAttribute("aria-hidden", "true");

    const actionsRow = document.createElement("div");
    actionsRow.className = "rel-quick-actions-row";
    root.appendChild(actionsRow);

    for (const action of QUICK_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rel-quick-action-btn";
      button.dataset.relQuickAction = action.action;
      button.textContent = action.label;
      button.title = action.tooltip;
      actionsRow.appendChild(button);
    }

    const classRow = document.createElement("div");
    classRow.className = "rel-quick-actions-class-row hidden";

    const classInput = document.createElement("input");
    classInput.type = "text";
    classInput.className = "rel-quick-actions-class-input";
    classInput.placeholder = "Enter class names (space-separated)";
    classInput.title = "Add class: type one or more class names separated by spaces. Example: card elevated";
    classRow.appendChild(classInput);

    const classApplyBtn = document.createElement("button");
    classApplyBtn.type = "button";
    classApplyBtn.className = "rel-quick-actions-class-apply";
    classApplyBtn.textContent = "Apply";
    classApplyBtn.title = "Apply entered class names to selected element";
    classRow.appendChild(classApplyBtn);

    const classCancelBtn = document.createElement("button");
    classCancelBtn.type = "button";
    classCancelBtn.className = "rel-quick-actions-class-cancel";
    classCancelBtn.textContent = "Cancel";
    classCancelBtn.title = "Close class input without applying changes";
    classRow.appendChild(classCancelBtn);

    root.appendChild(classRow);

    root.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest(".rel-quick-action-btn")
        : null;
      if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      hidePreviewContextMenu();
      const action = String(button.dataset.relQuickAction || "").trim();
      if (action === "add-class") {
        setQuickActionsClassMode(true);
        return;
      }
      executeQuickActionRequest({ action });
    });

    classApplyBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      applyQuickActionsAddClass();
    });

    classCancelBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setQuickActionsClassMode(false);
    });

    classInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        applyQuickActionsAddClass();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setQuickActionsClassMode(false);
      }
    });

    document.body.appendChild(root);
    state.quickActions.root = root;
    state.quickActions.actionsRow = actionsRow;
    state.quickActions.classRow = classRow;
    state.quickActions.classInput = classInput;
    state.quickActions.classApplyBtn = classApplyBtn;
    state.quickActions.classCancelBtn = classCancelBtn;
    return root;
  }

  function ensurePreviewContextMenu() {
    if (state.contextMenu.root && state.contextMenu.root.isConnected) {
      return state.contextMenu.root;
    }

    const root = document.createElement("div");
    root.className = "rel-preview-context-menu hidden";
    root.dataset.relRuntime = "overlay-ui";
    root.dataset.relOverlayType = "preview-context-menu";
    root.setAttribute("aria-hidden", "true");

    for (const action of PREVIEW_CONTEXT_ACTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rel-preview-context-item";
      button.dataset.relPreviewContextAction = action.action;
      button.textContent = action.label;
      button.title = action.tooltip;
      root.appendChild(button);
    }

    root.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element
        ? target.closest(".rel-preview-context-item")
        : null;
      if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const action = String(button.dataset.relPreviewContextAction || "").trim();
      const relId = String(state.contextMenu.targetRelId || "").trim();
      const fallbackSelector = String(state.contextMenu.targetFallbackSelector || "").trim();
      hidePreviewContextMenu();
      executeQuickActionRequest({
        action,
        relId,
        fallbackSelector,
      });
    });

    document.body.appendChild(root);
    state.contextMenu.root = root;
    return root;
  }

  function showQuickActionsToolbar(element) {
    if (!(element instanceof Element)) {
      hideQuickActionsToolbar();
      return;
    }
    if (isEditorSystemElement(element)) {
      hideQuickActionsToolbar();
      return;
    }
    if (state.pendingDragNodeTemplate || document.body?.classList.contains("rel-resizing")) {
      hideQuickActionsToolbar();
      return;
    }

    const root = ensureQuickActionsToolbar();
    state.quickActions.targetElement = element;
    state.quickActions.visible = true;
    root.classList.add("is-visible");
    root.classList.remove("hidden");
    root.setAttribute("aria-hidden", "false");
    updateQuickActionsControlStates(element);
    positionQuickActionsToolbar();
  }

  function hideQuickActionsToolbar(options) {
    const opts = options && typeof options === "object" ? options : {};
    const wasVisible = Boolean(state.quickActions.visible || state.quickActions.classMode);
    if (!wasVisible && !opts.force) {
      return false;
    }

    const root = state.quickActions.root;
    if (root instanceof HTMLElement) {
      root.classList.remove("is-visible");
      root.classList.add("hidden");
      root.setAttribute("aria-hidden", "true");
    }
    state.quickActions.visible = false;
    setQuickActionsClassMode(false);
    if (!opts.preserveSelection) {
      state.quickActions.targetElement = null;
    }
    if (opts.markEscape) {
      state.quickActions.hiddenByEscape = true;
    }
    return wasVisible;
  }

  function setQuickActionsClassMode(enabled) {
    const turnOn = Boolean(enabled);
    const row = state.quickActions.classRow;
    if (!(row instanceof HTMLElement)) {
      return false;
    }
    if (state.quickActions.classMode === turnOn) {
      return false;
    }
    if (turnOn && state.quickActions.classInput instanceof HTMLInputElement && state.quickActions.classInput.disabled) {
      return false;
    }

    state.quickActions.classMode = turnOn;
    row.classList.toggle("hidden", !turnOn);
    if (!turnOn) {
      if (state.quickActions.classInput) {
        state.quickActions.classInput.value = "";
      }
      return true;
    }
    if (state.quickActions.classInput) {
      state.quickActions.classInput.focus();
      state.quickActions.classInput.select();
    }
    positionQuickActionsToolbar();
    return true;
  }

  function applyQuickActionsAddClass() {
    const input = state.quickActions.classInput;
    if (!(input instanceof HTMLInputElement)) {
      return false;
    }
    const classValue = String(input.value || "").trim();
    if (!classValue) {
      setQuickActionsClassMode(false);
      return false;
    }
    const applied = executeQuickActionRequest({
      action: "add-class",
      classValue,
    });
    if (applied) {
      setQuickActionsClassMode(false);
    }
    return applied;
  }

  function positionQuickActionsToolbar() {
    if (!state.quickActions.visible) {
      return;
    }

    const root = state.quickActions.root;
    const target = state.quickActions.targetElement;
    if (!(root instanceof HTMLElement) || !(target instanceof Element) || !target.isConnected) {
      hideQuickActionsToolbar({ preserveSelection: true });
      return;
    }

    const rect = target.getBoundingClientRect();
    if (!Number.isFinite(rect.top) || rect.width <= 0 || rect.height <= 0) {
      hideQuickActionsToolbar({ preserveSelection: true });
      return;
    }

    const previousVisibility = root.classList.contains("is-visible");
    if (!previousVisibility) {
      root.classList.add("is-visible");
      root.classList.remove("hidden");
      root.setAttribute("aria-hidden", "false");
    }

    root.style.left = "0px";
    root.style.top = "0px";
    const toolbarRect = root.getBoundingClientRect();
    const toolbarWidth = Math.max(1, Math.round(toolbarRect.width || 0));
    const toolbarHeight = Math.max(1, Math.round(toolbarRect.height || 0));

    let left = rect.right - toolbarWidth;
    let top = rect.top - toolbarHeight - QUICK_TOOLBAR_DEFAULT_OFFSET_PX;
    if (top < QUICK_TOOLBAR_VIEWPORT_GAP_PX) {
      top = rect.bottom + QUICK_TOOLBAR_DEFAULT_OFFSET_PX;
    }
    if (left < QUICK_TOOLBAR_VIEWPORT_GAP_PX) {
      left = rect.left;
    }

    const maxLeft = Math.max(QUICK_TOOLBAR_VIEWPORT_GAP_PX, window.innerWidth - toolbarWidth - QUICK_TOOLBAR_VIEWPORT_GAP_PX);
    const maxTop = Math.max(QUICK_TOOLBAR_VIEWPORT_GAP_PX, window.innerHeight - toolbarHeight - QUICK_TOOLBAR_VIEWPORT_GAP_PX);
    left = clamp(left, QUICK_TOOLBAR_VIEWPORT_GAP_PX, maxLeft);
    top = clamp(top, QUICK_TOOLBAR_VIEWPORT_GAP_PX, maxTop);

    root.style.left = `${Math.round(left)}px`;
    root.style.top = `${Math.round(top)}px`;
  }

  function showPreviewContextMenu(clientX, clientY, targetElement) {
    if (!(targetElement instanceof Element)) {
      hidePreviewContextMenu();
      return;
    }

    const root = ensurePreviewContextMenu();
    state.contextMenu.targetElement = targetElement;
    state.contextMenu.targetRelId = ensureRelId(targetElement);
    state.contextMenu.targetFallbackSelector = buildStableSelector(targetElement);
    updatePreviewContextMenuControlStates(targetElement);

    root.classList.remove("hidden");
    root.classList.add("is-visible");
    root.setAttribute("aria-hidden", "false");
    state.contextMenu.visible = true;

    root.style.left = "0px";
    root.style.top = "0px";
    const rect = root.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || 0));
    const height = Math.max(1, Math.round(rect.height || 0));

    const maxLeft = Math.max(QUICK_TOOLBAR_VIEWPORT_GAP_PX, window.innerWidth - width - QUICK_TOOLBAR_VIEWPORT_GAP_PX);
    const maxTop = Math.max(QUICK_TOOLBAR_VIEWPORT_GAP_PX, window.innerHeight - height - QUICK_TOOLBAR_VIEWPORT_GAP_PX);
    const left = clamp(Number(clientX) + 8, QUICK_TOOLBAR_VIEWPORT_GAP_PX, maxLeft);
    const top = clamp(Number(clientY) + 8, QUICK_TOOLBAR_VIEWPORT_GAP_PX, maxTop);

    root.style.left = `${Math.round(left)}px`;
    root.style.top = `${Math.round(top)}px`;
  }

  function hidePreviewContextMenu() {
    const root = state.contextMenu.root;
    const wasVisible = Boolean(state.contextMenu.visible);
    if (root instanceof HTMLElement) {
      root.classList.add("hidden");
      root.classList.remove("is-visible");
      root.setAttribute("aria-hidden", "true");
    }
    state.contextMenu.visible = false;
    state.contextMenu.targetElement = null;
    state.contextMenu.targetRelId = "";
    state.contextMenu.targetFallbackSelector = "";
    return wasVisible;
  }

  function updateQuickActionsControlStates(targetElement) {
    const root = state.quickActions.root;
    if (!(root instanceof HTMLElement) || !(targetElement instanceof Element)) {
      return;
    }
    const availability = getQuickActionAvailability(targetElement);
    const buttons = root.querySelectorAll(".rel-quick-action-btn");
    for (const button of buttons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }
      const action = String(button.dataset.relQuickAction || "").trim();
      const info = availability[action] || { enabled: true, reason: "" };
      button.disabled = !info.enabled;
      const fallback = QUICK_ACTIONS.find((item) => item.action === action);
      const baseTooltip = fallback ? fallback.tooltip : "";
      button.title = info.enabled || !info.reason
        ? baseTooltip
        : `${baseTooltip} Disabled: ${info.reason}`.trim();
    }

    const addClassInfo = availability["add-class"] || { enabled: true, reason: "" };
    const classInput = state.quickActions.classInput;
    const classApplyBtn = state.quickActions.classApplyBtn;
    if (classInput instanceof HTMLInputElement) {
      classInput.disabled = !addClassInfo.enabled;
    }
    if (classApplyBtn instanceof HTMLButtonElement) {
      classApplyBtn.disabled = !addClassInfo.enabled;
      classApplyBtn.title = addClassInfo.enabled
        ? "Apply entered class names to selected element"
        : `Apply entered class names to selected element. Disabled: ${addClassInfo.reason}`;
    }
    if (!addClassInfo.enabled) {
      setQuickActionsClassMode(false);
    }
  }

  function updatePreviewContextMenuControlStates(targetElement) {
    const root = state.contextMenu.root;
    if (!(root instanceof HTMLElement) || !(targetElement instanceof Element)) {
      return;
    }
    const availability = getQuickActionAvailability(targetElement);
    const buttons = root.querySelectorAll(".rel-preview-context-item");
    for (const button of buttons) {
      if (!(button instanceof HTMLButtonElement)) {
        continue;
      }
      const action = String(button.dataset.relPreviewContextAction || "").trim();
      const info = availability[action] || { enabled: true, reason: "" };
      button.disabled = !info.enabled;
      const fallback = PREVIEW_CONTEXT_ACTIONS.find((item) => item.action === action);
      const baseTooltip = fallback ? fallback.tooltip : "";
      button.title = info.enabled || !info.reason
        ? baseTooltip
        : `${baseTooltip} Disabled: ${info.reason}`.trim();
    }
  }

  function getQuickActionAvailability(targetElement) {
    const element = targetElement instanceof Element ? targetElement : null;
    if (!element) {
      return {};
    }

    const blocked = isProtectedElement(element) || isEditorSystemElement(element);
    const tagName = String(element.tagName || "").toUpperCase();
    const previousSibling = findAdjacentMovableSibling(element, -1);
    const nextSibling = findAdjacentMovableSibling(element, 1);
    const parent = element.parentElement;
    const hasParent = parent instanceof Element && !isEditorSystemElement(parent);

    return {
      duplicate: blocked
        ? { enabled: false, reason: "Protected element" }
        : { enabled: true, reason: "" },
      delete: blocked
        ? { enabled: false, reason: "Protected element" }
        : { enabled: true, reason: "" },
      "move-up": previousSibling
        ? { enabled: true, reason: "" }
        : { enabled: false, reason: "Already first" },
      "move-down": nextSibling
        ? { enabled: true, reason: "" }
        : { enabled: false, reason: "Already last" },
      "wrap-container": blocked || !hasParent
        ? { enabled: false, reason: "Cannot wrap this element" }
        : { enabled: true, reason: "" },
      "convert-section": blocked
        ? { enabled: false, reason: "Protected element" }
        : (tagName === "SECTION"
          ? { enabled: false, reason: "Already a section" }
          : { enabled: true, reason: "" }),
      "add-class": blocked
        ? { enabled: false, reason: "Protected element" }
        : { enabled: true, reason: "" },
      "insert-container-above": blocked || !hasParent
        ? { enabled: false, reason: "Cannot insert above this element" }
        : { enabled: true, reason: "" },
      "insert-section-below": blocked || !hasParent
        ? { enabled: false, reason: "Cannot insert below this element" }
        : { enabled: true, reason: "" },
    };
  }

  function findAdjacentMovableSibling(element, direction) {
    if (!(element instanceof Element) || !(element.parentElement instanceof Element)) {
      return null;
    }
    const siblings = Array.from(element.parentElement.children).filter((child) => {
      return child instanceof Element && !SKIP_TAGS.has(child.tagName) && !isEditorSystemElement(child);
    });
    const index = siblings.indexOf(element);
    if (index < 0) {
      return null;
    }
    const wantedIndex = direction < 0 ? index - 1 : index + 1;
    if (wantedIndex < 0 || wantedIndex >= siblings.length) {
      return null;
    }
    return siblings[wantedIndex];
  }

  function executeQuickActionRequest(payload) {
    const raw = payload && typeof payload === "object" ? payload : {};
    const action = String(raw.action || "").trim().toLowerCase();
    if (!action) {
      return false;
    }

    const relId = String(raw.relId || "").trim();
    const fallbackSelector = String(raw.fallbackSelector || "").trim();
    const targetElement = relId
      ? resolveElementByReference(relId, fallbackSelector)
      : (state.selectedElement instanceof Element ? state.selectedElement : null);
    if (!(targetElement instanceof Element)) {
      return false;
    }

    const availability = getQuickActionAvailability(targetElement);
    const availabilityInfo = availability[action];
    if (availabilityInfo && !availabilityInfo.enabled) {
      return false;
    }

    if (action === "duplicate") {
      return runDuplicateAction(targetElement);
    }
    if (action === "delete") {
      return runDeleteAction(targetElement);
    }
    if (action === "move-up") {
      return runMoveStepAction(targetElement, -1);
    }
    if (action === "move-down") {
      return runMoveStepAction(targetElement, 1);
    }
    if (action === "wrap-container") {
      return runWrapWithContainerAction(targetElement);
    }
    if (action === "convert-section") {
      return runConvertToSectionAction(targetElement);
    }
    if (action === "add-class") {
      return runAddClassAction(targetElement, raw.classValue);
    }
    if (action === "insert-container-above") {
      return runInsertNearAction(targetElement, "container", "before");
    }
    if (action === "insert-section-below") {
      return runInsertNearAction(targetElement, "section", "after");
    }
    return false;
  }

  function runDuplicateAction(targetElement) {
    if (!(targetElement instanceof Element)) {
      return false;
    }

    const targetRelId = ensureRelId(targetElement);
    const html = buildRawHtmlFromElement(targetElement, {
      removeIds: true,
      replaceTagName: "",
    });
    if (!html) {
      return false;
    }

    const parent = targetElement.parentElement;
    const node = {
      nodeId: generateNodeId(),
      relId: generateRelId(),
      type: "raw-html",
      position: "after",
      parentRelId: parent ? ensureRelId(parent) : "",
      targetRelId,
      targetFallbackSelector: buildStableSelector(targetElement),
      props: { html },
    };
    const created = commitAddedNode(node, true);
    return Boolean(created);
  }

  function runDeleteAction(targetElement) {
    if (!(targetElement instanceof Element)) {
      return false;
    }
    const relId = ensureRelId(targetElement);
    return deleteNodeByReference({
      relId,
      fallbackSelector: buildStableSelector(targetElement),
      silent: false,
    });
  }

  function runMoveStepAction(targetElement, direction) {
    if (!(targetElement instanceof Element)) {
      return false;
    }
    const sibling = findAdjacentMovableSibling(targetElement, direction);
    if (!(sibling instanceof Element)) {
      return false;
    }

    return moveNodeByReference({
      sourceRelId: ensureRelId(targetElement),
      sourceFallbackSelector: buildStableSelector(targetElement),
      targetRelId: ensureRelId(sibling),
      targetFallbackSelector: buildStableSelector(sibling),
      placement: direction < 0 ? "before" : "after",
    }, { silent: false });
  }

  function runWrapWithContainerAction(targetElement) {
    if (!(targetElement instanceof Element) || isProtectedElement(targetElement) || isEditorSystemElement(targetElement)) {
      return false;
    }
    const targetRelId = ensureRelId(targetElement);
    const parent = targetElement.parentElement;

    const wrapperNode = {
      nodeId: generateNodeId(),
      relId: generateRelId(),
      type: "container",
      position: "before",
      parentRelId: parent ? ensureRelId(parent) : "",
      targetRelId,
      targetFallbackSelector: buildStableSelector(targetElement),
      props: { text: "" },
    };
    const created = commitAddedNode(wrapperNode, false);
    if (!created || !created.relId) {
      return false;
    }

    const moved = moveNodeByReference({
      sourceRelId: targetRelId,
      sourceFallbackSelector: buildStableSelector(targetElement),
      targetRelId: created.relId,
      targetFallbackSelector: created.fallbackSelector || "",
      placement: "inside",
    }, { silent: false });
    if (!moved) {
      return false;
    }

    const containerElement = resolveElementByReference(created.relId, created.fallbackSelector || "");
    if (containerElement instanceof Element) {
      selectElement(containerElement);
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }
    return true;
  }

  function runConvertToSectionAction(targetElement) {
    if (!(targetElement instanceof Element) || isProtectedElement(targetElement) || isEditorSystemElement(targetElement)) {
      return false;
    }
    if (targetElement.tagName === "SECTION") {
      return false;
    }

    const targetRelId = ensureRelId(targetElement);
    const parent = targetElement.parentElement;
    const html = buildRawHtmlFromElement(targetElement, {
      removeIds: false,
      replaceTagName: "section",
    });
    if (!html) {
      return false;
    }

    const replacementNode = {
      nodeId: generateNodeId(),
      relId: generateRelId(),
      type: "raw-html",
      position: "before",
      parentRelId: parent ? ensureRelId(parent) : "",
      targetRelId,
      targetFallbackSelector: buildStableSelector(targetElement),
      props: { html },
    };
    const created = commitAddedNode(replacementNode, false);
    if (!created || !created.relId) {
      return false;
    }

    const deleted = deleteNodeByReference({
      relId: targetRelId,
      fallbackSelector: buildStableSelector(targetElement),
      silent: false,
    });
    if (!deleted) {
      return false;
    }

    const replacementElement = resolveElementByReference(created.relId, created.fallbackSelector || "");
    if (replacementElement instanceof Element) {
      selectElement(replacementElement);
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }
    return true;
  }

  function runAddClassAction(targetElement, rawClassValue) {
    if (!(targetElement instanceof Element) || isProtectedElement(targetElement) || isEditorSystemElement(targetElement)) {
      return false;
    }

    const newTokens = String(rawClassValue || "")
      .split(QUICK_ACTION_CLASS_TOKENS_REGEX)
      .map((token) => token.trim())
      .filter(Boolean);
    if (newTokens.length === 0) {
      return false;
    }

    const existing = getUserClassString(targetElement)
      .split(QUICK_ACTION_CLASS_TOKENS_REGEX)
      .map((token) => token.trim())
      .filter(Boolean);
    const seen = new Set(existing);
    for (const token of newTokens) {
      if (!seen.has(token)) {
        seen.add(token);
        existing.push(token);
      }
    }

    const classValue = existing.join(" ");
    const relId = ensureRelId(targetElement);
    applyAttributes(relId, { class: classValue }, { silent: false });
    postToEditor({
      type: "REL_ATTRIBUTE_SYNC",
      payload: {
        relId,
        attributes: { class: classValue },
        fallbackSelector: buildStableSelector(targetElement),
        stableSelector: buildStableSelector(targetElement),
      },
    });
    postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    return true;
  }

  function runInsertNearAction(targetElement, type, position) {
    if (!(targetElement instanceof Element) || isProtectedElement(targetElement) || isEditorSystemElement(targetElement)) {
      return false;
    }
    const parent = targetElement.parentElement;
    const node = {
      nodeId: generateNodeId(),
      relId: generateRelId(),
      type,
      position: position === "before" ? "before" : "after",
      parentRelId: parent ? ensureRelId(parent) : "",
      targetRelId: ensureRelId(targetElement),
      targetFallbackSelector: buildStableSelector(targetElement),
      props: type === "container" ? { text: "Container" } : {},
    };
    const created = commitAddedNode(node, true);
    return Boolean(created);
  }

  function commitAddedNode(node, selectAfterCreate) {
    const created = ensureAddedNode(node, Boolean(selectAfterCreate));
    if (!created) {
      return null;
    }
    postToEditor({ type: "REL_NODE_ADDED", payload: { node: created } });
    postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    return created;
  }

  function buildRawHtmlFromElement(sourceElement, options) {
    if (!(sourceElement instanceof Element)) {
      return "";
    }
    const opts = options && typeof options === "object" ? options : {};
    const replacementTag = String(opts.replaceTagName || "").trim().toLowerCase();
    const removeIds = Boolean(opts.removeIds);

    let clone = sourceElement.cloneNode(true);
    if (!(clone instanceof Element)) {
      return "";
    }

    if (replacementTag) {
      const replacement = document.createElement(replacementTag);
      copyAttributes(clone, replacement);
      while (clone.firstChild) {
        replacement.appendChild(clone.firstChild);
      }
      clone = replacement;
    }

    sanitizeRuntimeAttributes(clone, { removeRelIds: true, removeIds });
    removeDisallowedNodes(clone);
    return clone.outerHTML;
  }

  function copyAttributes(fromElement, toElement) {
    if (!(fromElement instanceof Element) || !(toElement instanceof Element)) {
      return;
    }
    for (const attr of Array.from(fromElement.attributes || [])) {
      if (!attr || !attr.name) {
        continue;
      }
      toElement.setAttribute(attr.name, attr.value);
    }
  }

  function sanitizeRuntimeAttributes(rootElement, options) {
    if (!(rootElement instanceof Element)) {
      return;
    }
    const opts = options && typeof options === "object" ? options : {};
    const removeRelIds = Boolean(opts.removeRelIds);
    const removeIds = Boolean(opts.removeIds);
    const allNodes = [rootElement, ...Array.from(rootElement.querySelectorAll("*"))];
    for (const node of allNodes) {
      if (!(node instanceof Element)) {
        continue;
      }
      node.classList.remove(MANAGED_SELECTION_CLASS);
      node.classList.remove(MANAGED_DROP_CLASS);
      if (removeRelIds) {
        node.removeAttribute("data-rel-id");
      }
      node.removeAttribute("data-rel-added-node-id");
      node.removeAttribute("data-rel-managed");
      node.removeAttribute("data-rel-runtime");
      node.removeAttribute("data-rel-wrapper");
      node.removeAttribute("data-rel-wrapper-for");
      node.removeAttribute("data-rel-link-wrapper-for");
      if (removeIds) {
        node.removeAttribute("id");
      }
    }
  }

  function removeDisallowedNodes(rootElement) {
    if (!(rootElement instanceof Element)) {
      return;
    }
    const scripts = rootElement.querySelectorAll("script");
    for (const node of scripts) {
      node.remove();
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

    if (message.type === "REL_MOVE_NODE") {
      const payload = message.payload || {};
      moveNodeByReference(payload, { silent: false });
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
      hideInlineAddBar();
      hidePreviewContextMenu();
      hideQuickActionsToolbar({ preserveSelection: true });
      state.pendingDragNodeTemplate = message.payload && message.payload.nodeTemplate
        ? message.payload.nodeTemplate
        : null;
      return;
    }

    if (message.type === "REL_CLEAR_DRAG_COMPONENT") {
      state.pendingDragNodeTemplate = null;
      hideInlineAddBar();
      hidePreviewContextMenu();
      clearDropTarget();
      return;
    }

    if (message.type === "REL_QUICK_ACTION") {
      const payload = message.payload || {};
      executeQuickActionRequest(payload);
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

    const movedNodes = Array.isArray(payload.movedNodes) ? payload.movedNodes : [];
    for (const moveOp of movedNodes) {
      moveNodeByReference(moveOp, { silent: true });
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
    hidePreviewContextMenu();
    hideQuickActionsToolbar({ force: true });
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

  function moveNodeByReference(rawMove, options) {
    const move = rawMove && typeof rawMove === "object" ? rawMove : {};
    const opts = options && typeof options === "object" ? options : {};
    const silent = Boolean(opts.silent);
    const placement = normalizeMovePlacement(move.placement);
    const sourceRelId = String(move.sourceRelId || move.relId || "").trim();
    const targetRelId = String(move.targetRelId || "").trim();
    const sourceFallbackSelector = String(move.sourceFallbackSelector || move.fallbackSelector || "").trim();
    const targetFallbackSelector = String(move.targetFallbackSelector || "").trim();

    if (!sourceRelId || !targetRelId) {
      return false;
    }

    const sourceElement = resolveElementByReference(sourceRelId, sourceFallbackSelector);
    const targetElement = resolveElementByReference(targetRelId, targetFallbackSelector);
    if (!sourceElement || !targetElement) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Source or target element not found",
          },
        });
      }
      return false;
    }

    if (sourceElement === targetElement || sourceElement.contains(targetElement)) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Cannot move an element into itself or one of its descendants",
          },
        });
      }
      return false;
    }

    if (isProtectedElement(sourceElement) || isEditorSystemElement(sourceElement)) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Source element is protected and cannot be moved",
          },
        });
      }
      return false;
    }

    if (isProtectedElement(targetElement) || isEditorSystemElement(targetElement)) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Target element is protected and cannot be used as a drop target",
          },
        });
      }
      return false;
    }

    let parent = null;
    let referenceNode = null;
    if (placement === "inside") {
      if (!canContainChildren(targetElement)) {
        if (!silent) {
          postToEditor({
            type: "REL_MOVE_ERROR",
            payload: {
              sourceRelId,
              targetRelId,
              message: "Target element cannot contain child nodes",
            },
          });
        }
        return false;
      }
      parent = targetElement;
      referenceNode = null;
    } else if (placement === "before") {
      parent = targetElement.parentNode;
      referenceNode = targetElement;
    } else {
      parent = targetElement.parentNode;
      referenceNode = targetElement.nextSibling;
    }

    if (!(parent instanceof Node)) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Cannot resolve a valid drop parent",
          },
        });
      }
      return false;
    }
    if (parent === sourceElement || sourceElement.contains(parent)) {
      if (!silent) {
        postToEditor({
          type: "REL_MOVE_ERROR",
          payload: {
            sourceRelId,
            targetRelId,
            message: "Cannot move into a descendant container",
          },
        });
      }
      return false;
    }

    parent.insertBefore(sourceElement, referenceNode);
    const finalSourceRelId = ensureRelId(sourceElement, sourceRelId);
    const finalTargetRelId = ensureRelId(targetElement, targetRelId);
    const sourceStableSelector = buildStableSelector(sourceElement);
    const targetStableSelector = buildStableSelector(targetElement);

    if (!silent) {
      selectElement(sourceElement);
      postToEditor({
        type: "REL_NODE_MOVED",
        payload: {
          operation: {
            sourceRelId: finalSourceRelId,
            targetRelId: finalTargetRelId,
            placement,
            sourceFallbackSelector: sourceStableSelector,
            targetFallbackSelector: targetStableSelector,
            sourceStableSelector: sourceStableSelector,
            targetStableSelector: targetStableSelector,
            timestamp: Date.now(),
          },
        },
      });
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
    }

    return true;
  }

  function normalizeMovePlacement(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "before" || normalized === "after" || normalized === "inside") {
      return normalized;
    }
    return "inside";
  }

  function resolveElementByReference(relId, fallbackSelector) {
    const byRelId = findElementByRelIdOrFallback(relId, state.elementsMap);
    if (byRelId) {
      return byRelId;
    }
    const selector = String(fallbackSelector || "").trim();
    if (!selector) {
      return null;
    }
    try {
      return document.querySelector(selector);
    } catch {
      return null;
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
    state.quickActions.hiddenByEscape = false;
    state.quickActions.targetElement = element;
    notifyResizerSelectionChange(element);
    showQuickActionsToolbar(element);

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
      const priority = IMPORTANT_STYLE_PROPS.has(safeProperty) ? "important" : "";
      element.style.setProperty(safeProperty, value, priority);
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
          position: node.position,
          targetRelId: node.targetRelId,
          targetFallbackSelector: node.targetFallbackSelector,
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
          position: node.position,
          targetRelId: node.targetRelId,
          targetFallbackSelector: node.targetFallbackSelector,
          props: node.props,
          fallbackSelector: buildStableSelector(existingByRelId),
          stableSelector: buildStableSelector(existingByRelId),
        };
      }
    }

    const insertion = resolveInsertionForAddedNode(node);
    if (!insertion || !insertion.parent) {
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
    insertion.parent.insertBefore(element, insertion.referenceNode);
    state.appliedAddedNodeIds.add(finalNodeId);

    if (selectAfterCreate) {
      selectElement(element);
    }

    const parentElement = insertion.parent instanceof Element
      ? insertion.parent
      : (document.body || document.documentElement);
    const targetElement = insertion.targetElement instanceof Element
      ? insertion.targetElement
      : null;
    const finalPosition = normalizeAddedNodePosition(insertion.position || node.position);

    return {
      nodeId: finalNodeId,
      relId: finalRelId,
      parentRelId: ensureRelId(parentElement),
      type: node.type,
      position: finalPosition,
      targetRelId: targetElement ? ensureRelId(targetElement, node.targetRelId) : node.targetRelId,
      targetFallbackSelector: targetElement ? buildStableSelector(targetElement) : node.targetFallbackSelector,
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
      position: normalizeAddedNodePosition(nodeDescriptor.position),
      parentRelId: String(nodeDescriptor.parentRelId || "").trim(),
      parentFallbackSelector: String(nodeDescriptor.parentFallbackSelector || "").trim(),
      targetRelId: String(nodeDescriptor.targetRelId || "").trim(),
      targetFallbackSelector: String(nodeDescriptor.targetFallbackSelector || "").trim(),
      props: nodeDescriptor.props && typeof nodeDescriptor.props === "object" ? nodeDescriptor.props : {},
    };
  }

  function normalizeAddedNodePosition(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "before" || normalized === "after" || normalized === "inside") {
      return normalized;
    }
    return "append";
  }

  function resolveInsertionForAddedNode(node) {
    const position = normalizeAddedNodePosition(node.position);
    const target = resolveElementByReference(node.targetRelId, node.targetFallbackSelector);

    if (position === "before" || position === "after") {
      if (
        target instanceof Element
        && !isProtectedElement(target)
        && !isEditorSystemElement(target)
        && target.parentNode instanceof Node
      ) {
        return {
          parent: target.parentNode,
          referenceNode: position === "before" ? target : target.nextSibling,
          position,
          targetElement: target,
        };
      }
    }

    if (position === "inside") {
      const insideTarget = target instanceof Element
        ? target
        : resolveElementByReference(node.parentRelId, node.parentFallbackSelector);
      if (insideTarget instanceof Element && canContainChildren(insideTarget)) {
        return {
          parent: insideTarget,
          referenceNode: null,
          position: "inside",
          targetElement: insideTarget,
        };
      }
    }

    const fallbackParent = resolveParentForNode(node.parentRelId);
    if (!fallbackParent) {
      return null;
    }
    return {
      parent: fallbackParent,
      referenceNode: null,
      position: "append",
      targetElement: null,
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
    const safeProps = props && typeof props === "object" ? props : {};
    switch (type) {
      case "section":
        return createSectionElement(safeProps);
      case "container":
        return createTextNodeElement(
          "div",
          Object.prototype.hasOwnProperty.call(safeProps, "text")
            ? String(safeProps.text || "")
            : "Container"
        );
      case "heading-h1":
        return createTextNodeElement("h1", safeProps.text || "Heading H1");
      case "heading-h2":
        return createTextNodeElement("h2", safeProps.text || "Heading H2");
      case "heading-h3":
        return createTextNodeElement("h3", safeProps.text || "Heading H3");
      case "paragraph":
        return createTextNodeElement("p", safeProps.text || "Paragraph text");
      case "button": {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = safeProps.text || "Button";
        return button;
      }
      case "image": {
        const img = document.createElement("img");
        img.src = normalizeAssetSrc(safeProps.src || "https://via.placeholder.com/480x240.png?text=Image");
        img.alt = safeProps.alt || "Image";
        return img;
      }
      case "link": {
        const anchor = document.createElement("a");
        anchor.href = safeProps.href || "#";
        anchor.textContent = safeProps.text || "Link";
        return anchor;
      }
      case "card":
        return createBasicCard();
      case "spacer": {
        const spacer = document.createElement("div");
        spacer.style.height = safeProps.height || "24px";
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
        btn.textContent = safeProps.text || "Bootstrap Button";
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
        btn.textContent = safeProps.text || "Bulma Button";
        return btn;
      }
      case "bulma-card":
        return createBulmaCard();
      case "pico-button": {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "contrast";
        btn.textContent = safeProps.text || "Pico Button";
        return btn;
      }
      case "pico-link": {
        const link = document.createElement("a");
        link.href = safeProps.href || "#";
        link.className = "contrast";
        link.textContent = safeProps.text || "Pico Link";
        return link;
      }
      case "raw-html":
        return createRawHtmlElement(safeProps);
      default:
        return createTextNodeElement("div", safeProps.text || "New element");
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

  function createRawHtmlElement(props) {
    const html = String(props && props.html ? props.html : "").trim();
    if (!html) {
      return null;
    }

    const template = document.createElement("template");
    template.innerHTML = html;
    const first = template.content.firstElementChild;
    if (!(first instanceof Element)) {
      return null;
    }
    sanitizeRuntimeAttributes(first, { removeRelIds: true, removeIds: false });
    removeDisallowedNodes(first);
    return first;
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
      if (isEditorSystemElement(el)) {
        continue;
      }

      const relId = ensureRelId(el);
      const parentRelId = el.parentElement && !isEditorSystemElement(el.parentElement)
        ? ensureRelId(el.parentElement)
        : "";
      const children = Array.from(el.children).filter((child) => !SKIP_TAGS.has(child.tagName) && !isEditorSystemElement(child));
      result.push({
        relId,
        parentRelId,
        depth,
        tagName: el.tagName.toLowerCase(),
        id: el.id || "",
        className: getUserClassString(el),
        hasChildren: children.length > 0,
        canContainChildren: canContainChildren(el),
        isProtected: isProtectedElement(el),
        isSystem: false,
      });

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
    if (isEditorSystemElement(element)) {
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

  function isEditorSystemElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (element.dataset && (element.dataset.relWrapper || element.dataset.relLinkWrapperFor)) {
      return true;
    }
    if (element.dataset && element.dataset.relRuntime) {
      return true;
    }
    if (element.closest("[data-rel-runtime]")) {
      return true;
    }
    return false;
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

  function clamp(value, min, max) {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : safeMin;
    const numeric = Number.isFinite(value) ? value : safeMin;
    if (safeMax < safeMin) {
      return safeMin;
    }
    return Math.min(safeMax, Math.max(safeMin, numeric));
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
