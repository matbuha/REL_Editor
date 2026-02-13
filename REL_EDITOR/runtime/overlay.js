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
  ];

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "META", "NOSCRIPT"]);

  const state = {
    selectedElement: null,
    idCounter: 1,
    editMode: true,
  };

  document.addEventListener("click", onDocumentClick, true);
  window.addEventListener("message", onMessageFromEditor);

  blockTopNavigation();

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

    if (message.type === "REL_REQUEST_TREE") {
      postToEditor({ type: "REL_TREE_SNAPSHOT", payload: getTreeSnapshot() });
      return;
    }

    if (message.type === "REL_SELECT_BY_REL_ID") {
      const relId = message.payload && message.payload.relId;
      if (!relId) {
        return;
      }
      const element = document.querySelector(`[data-rel-id="${cssEscape(relId)}"]`);
      if (element) {
        selectElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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
      state.selectedElement.classList.remove("rel-editor-selected");
    }

    const relId = ensureRelId(element);
    element.classList.add("rel-editor-selected");
    state.selectedElement = element;

    const payload = buildSelectionPayload(element, relId);
    postToEditor({ type: "REL_SELECTION", payload });
  }

  function applyStyle(relId, property, value) {
    if (!relId || !property) {
      return;
    }

    const element = document.querySelector(`[data-rel-id="${cssEscape(relId)}"]`);
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

  function ensureRelId(element) {
    if (element.dataset.relId) {
      return element.dataset.relId;
    }

    const generated = `rel-${Date.now().toString(36)}-${state.idCounter++}`;
    element.dataset.relId = generated;
    return generated;
  }

  function buildSelectionPayload(element, relId) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    const computedSubset = {};
    for (const key of TRACKED_STYLES) {
      computedSubset[key] = computed.getPropertyValue(key);
    }

    return {
      relId,
      fallbackSelector: buildFallbackSelector(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || "",
      className: element.className || "",
      srcOrHref: element.getAttribute("src") || element.getAttribute("href") || "",
      alt: element.getAttribute("alt") || "",
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      computed: computedSubset,
    };
  }

  function buildFallbackSelector(element) {
    if (element.id) {
      return `#${cssEscape(element.id)}`;
    }

    const parts = [];
    let current = element;
    let depth = 0;

    while (current && current.nodeType === 1 && depth < 4) {
      let part = current.tagName.toLowerCase();

      if (current.classList && current.classList.length > 0) {
        const className = current.classList[0];
        if (className) {
          part += `.${cssEscape(className)}`;
        }
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
        className: (el.className || "").toString(),
      });

      const children = Array.from(el.children).filter((child) => !SKIP_TAGS.has(child.tagName));
      for (let i = children.length - 1; i >= 0; i -= 1) {
        stack.push({ element: children[i], depth: depth + 1 });
      }
    }

    return result;
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

  function postToEditor(message) {
    window.parent.postMessage(message, "*");
  }

  function cssEscape(value) {
    return String(value).replace(/(["\\])/g, "\\$1");
  }
})();
