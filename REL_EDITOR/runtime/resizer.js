(function () {
  if (window.__REL_RESIZER_LOADED__) {
    return;
  }
  window.__REL_RESIZER_LOADED__ = true;

  const DWELL_MS = 350;
  const MIN_WIDTH = 20;
  const MIN_HEIGHT = 20;
  const MOVABLE_POSITIONS = new Set(["relative", "absolute", "fixed"]);
  const HANDLE_DIRS = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  const state = {
    selectedElement: null,
    selectedRelId: "",
    overlayRoot: null,
    tooltip: null,
    visible: false,
    dwellTimer: 0,
    dragging: false,
    drag: null,
    rafId: 0,
    lastClientX: 0,
    lastClientY: 0,
    suppressClickUntil: 0,
  };

  init();

  function init() {
    ensureUi();
    window.addEventListener("click", onWindowClickCapture, true);
    document.addEventListener("mousemove", onDocumentMouseMove, true);
    document.addEventListener("mouseleave", onDocumentMouseLeave, true);
    document.addEventListener("scroll", onViewportChanged, true);
    window.addEventListener("resize", onViewportChanged, true);
    window.addEventListener("blur", onWindowBlur, true);
    window.addEventListener("beforeunload", cleanup, { once: true });
    window.addEventListener("rel-selection-change", onSelectionChanged, true);

    if (!state.overlayRoot) {
      window.addEventListener("DOMContentLoaded", ensureUi, { once: true });
    }
  }

  function cleanup() {
    window.removeEventListener("click", onWindowClickCapture, true);
    document.removeEventListener("mousemove", onDocumentMouseMove, true);
    document.removeEventListener("mouseleave", onDocumentMouseLeave, true);
    document.removeEventListener("scroll", onViewportChanged, true);
    window.removeEventListener("resize", onViewportChanged, true);
    window.removeEventListener("blur", onWindowBlur, true);
    window.removeEventListener("rel-selection-change", onSelectionChanged, true);
    clearDwellTimer();
    stopDrag(false);
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    if (state.overlayRoot) {
      state.overlayRoot.remove();
      state.overlayRoot = null;
    }
    if (state.tooltip) {
      state.tooltip.remove();
      state.tooltip = null;
    }
  }

  function onSelectionChanged(event) {
    if (state.dragging) {
      return;
    }

    const nextElement = event && event.detail && event.detail.element instanceof Element
      ? event.detail.element
      : null;
    setSelectedElement(nextElement);
    clearDwellTimer();
    hideHandles();
  }

  function onWindowBlur() {
    stopDrag(true);
  }

  function onWindowClickCapture(event) {
    if (state.dragging || Date.now() < state.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  function ensureUi() {
    if (state.overlayRoot && state.tooltip) {
      return true;
    }
    if (!document.body) {
      return false;
    }

    const overlay = document.createElement("div");
    overlay.className = "rel-resize-overlay";
    overlay.dataset.relRuntime = "overlay-ui";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.left = "-99999px";
    overlay.style.top = "-99999px";
    overlay.style.width = "0px";
    overlay.style.height = "0px";

    for (const dir of HANDLE_DIRS) {
      const handle = document.createElement("div");
      handle.className = "rel-resize-handle";
      handle.dataset.dir = dir;
      handle.dataset.relRuntime = "overlay-ui";
      handle.addEventListener("mousedown", onHandleMouseDown, true);
      overlay.appendChild(handle);
    }

    const tooltip = document.createElement("div");
    tooltip.className = "rel-resize-tooltip";
    tooltip.dataset.relRuntime = "overlay-ui";
    tooltip.setAttribute("aria-hidden", "true");

    document.body.appendChild(overlay);
    document.body.appendChild(tooltip);

    state.overlayRoot = overlay;
    state.tooltip = tooltip;
    return true;
  }

  function onViewportChanged() {
    if (!state.visible && !state.dragging) {
      return;
    }
    scheduleOverlayUpdate();
  }

  function onDocumentMouseLeave() {
    if (state.dragging) {
      return;
    }
    clearDwellTimer();
    hideHandles();
  }

  function onDocumentMouseMove(event) {
    state.lastClientX = Number(event.clientX) || 0;
    state.lastClientY = Number(event.clientY) || 0;

    if (state.dragging) {
      onDragMouseMove(event);
      return;
    }

    syncSelectedElement();
    if (!state.selectedElement || !state.selectedRelId) {
      clearDwellTimer();
      hideHandles();
      return;
    }

    if (isInResizeHotZone(event.target)) {
      startDwellTimer();
      if (state.visible) {
        scheduleOverlayUpdate();
      }
      return;
    }

    clearDwellTimer();
    hideHandles();
  }

  function onHandleMouseDown(event) {
    if (event.button !== 0) {
      return;
    }

    const target = event.currentTarget instanceof Element ? event.currentTarget : null;
    const dir = target ? String(target.dataset.dir || "") : "";
    if (!dir || !HANDLE_DIRS.includes(dir)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    syncSelectedElement();
    if (!state.selectedElement || !state.selectedRelId) {
      return;
    }

    startDrag(dir, event.clientX, event.clientY);
  }

  function startDrag(dir, startClientX, startClientY) {
    const element = state.selectedElement;
    if (!(element instanceof Element) || !element.isConnected) {
      return;
    }

    const computed = window.getComputedStyle(element);
    const position = String(computed.position || "static").trim().toLowerCase();
    const canMoveX = MOVABLE_POSITIONS.has(position);
    const canMoveY = MOVABLE_POSITIONS.has(position);

    const startRect = element.getBoundingClientRect();
    const startLeft = canMoveX ? readPxValue(element.style.getPropertyValue("left"), computed.left, 0) : null;
    const startTop = canMoveY ? readPxValue(element.style.getPropertyValue("top"), computed.top, 0) : null;
    const before = buildBeforeStyles(element, computed, canMoveX, canMoveY);
    const scale = resolvePointerScale();

    state.drag = {
      dir,
      relId: state.selectedRelId,
      element,
      startClientX: Number(startClientX) || 0,
      startClientY: Number(startClientY) || 0,
      startRect,
      canMoveX,
      canMoveY,
      startLeft,
      startTop,
      before,
      scaleX: scale.x,
      scaleY: scale.y,
      lastAfter: buildAfterStyles({
        width: startRect.width,
        height: startRect.height,
        left: startLeft,
        top: startTop,
      }, canMoveX, canMoveY),
    };

    state.dragging = true;
    ensureUi();
    showHandles(true);
    updateTooltip(state.lastClientX, state.lastClientY, startRect.width, startRect.height);
    setResizeModeClass(true);

    document.addEventListener("selectstart", preventSelection, true);
    window.addEventListener("mousemove", onDragMouseMove, true);
    window.addEventListener("mouseup", onDragMouseUp, true);
  }

  function onDragMouseMove(event) {
    if (!state.dragging || !state.drag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const drag = state.drag;
    if (!(drag.element instanceof Element) || !drag.element.isConnected) {
      stopDrag(true);
      return;
    }

    const dxRaw = (Number(event.clientX) || 0) - drag.startClientX;
    const dyRaw = (Number(event.clientY) || 0) - drag.startClientY;
    const dx = dxRaw / (drag.scaleX || 1);
    const dy = dyRaw / (drag.scaleY || 1);

    const nextRect = computeNextRect(drag, dx, dy);
    applyRectStyles(drag, nextRect);
    scheduleOverlayUpdate();
    updateTooltip(event.clientX, event.clientY, nextRect.width, nextRect.height);

    const after = buildAfterStyles(nextRect, drag.canMoveX, drag.canMoveY);
    drag.lastAfter = after;
    postResizeSync(drag.relId, drag.before, after, "preview");
  }

  function onDragMouseUp(event) {
    if (!state.dragging || !state.drag) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    stopDrag(true);
  }

  function stopDrag(shouldCommit) {
    if (!state.dragging || !state.drag) {
      return;
    }

    const drag = state.drag;
    const finalAfter = drag.lastAfter || {};

    document.removeEventListener("selectstart", preventSelection, true);
    window.removeEventListener("mousemove", onDragMouseMove, true);
    window.removeEventListener("mouseup", onDragMouseUp, true);
    setResizeModeClass(false);
    hideTooltip();

    state.drag = null;
    state.dragging = false;
    state.suppressClickUntil = Date.now() + 250;

    if (shouldCommit) {
      postResizeSync(drag.relId, drag.before, finalAfter, "commit");
    }

    const shouldStayVisible = shouldShowAfterDrag();
    if (!shouldStayVisible) {
      hideHandles();
    } else {
      showHandles(true);
    }
  }

  function shouldShowAfterDrag() {
    if (!state.selectedElement || !state.visible) {
      return false;
    }
    const x = state.lastClientX;
    const y = state.lastClientY;
    if (isPointInsideElement(state.selectedElement, x, y)) {
      return true;
    }
    if (state.overlayRoot && isPointInsideElement(state.overlayRoot, x, y)) {
      return true;
    }
    return false;
  }

  function preventSelection(event) {
    event.preventDefault();
  }

  function setResizeModeClass(isActive) {
    if (!document.body) {
      return;
    }
    document.body.classList.toggle("rel-resizing", Boolean(isActive));
  }

  function computeNextRect(drag, dx, dy) {
    const dir = drag.dir;
    const startWidth = drag.startRect.width;
    const startHeight = drag.startRect.height;
    let width = startWidth;
    let height = startHeight;

    if (dir.includes("e")) {
      width = startWidth + dx;
    }
    if (dir.includes("w")) {
      width = startWidth - dx;
    }
    if (dir.includes("s")) {
      height = startHeight + dy;
    }
    if (dir.includes("n")) {
      height = startHeight - dy;
    }

    width = Math.max(MIN_WIDTH, width);
    height = Math.max(MIN_HEIGHT, height);

    let left = null;
    let top = null;

    if (dir.includes("w") && drag.canMoveX) {
      const consumedX = startWidth - width;
      left = Number(drag.startLeft || 0) + consumedX;
    }

    if (dir.includes("n") && drag.canMoveY) {
      const consumedY = startHeight - height;
      top = Number(drag.startTop || 0) + consumedY;
    }

    return { width, height, left, top };
  }

  function applyRectStyles(drag, rectValue) {
    const element = drag.element;
    if (!(element instanceof Element)) {
      return;
    }

    element.style.setProperty("width", toPx(rectValue.width));
    element.style.setProperty("height", toPx(rectValue.height));
    element.style.setProperty("box-sizing", "border-box");

    if (drag.canMoveX && rectValue.left != null) {
      element.style.setProperty("left", toPx(rectValue.left));
    }
    if (drag.canMoveY && rectValue.top != null) {
      element.style.setProperty("top", toPx(rectValue.top));
    }
  }

  function buildBeforeStyles(element, computed, canMoveX, canMoveY) {
    const result = {
      width: normalizePxString(element.style.getPropertyValue("width"), computed.width, "0px"),
      height: normalizePxString(element.style.getPropertyValue("height"), computed.height, "0px"),
      "box-sizing": String(element.style.getPropertyValue("box-sizing") || computed.boxSizing || "").trim() || "content-box",
    };
    if (canMoveX) {
      result.left = normalizePxString(element.style.getPropertyValue("left"), computed.left, "0px");
    }
    if (canMoveY) {
      result.top = normalizePxString(element.style.getPropertyValue("top"), computed.top, "0px");
    }
    return result;
  }

  function buildAfterStyles(rectValue, canMoveX, canMoveY) {
    const result = {
      width: toPx(rectValue.width),
      height: toPx(rectValue.height),
      "box-sizing": "border-box",
    };
    if (canMoveX && rectValue.left != null) {
      result.left = toPx(rectValue.left);
    }
    if (canMoveY && rectValue.top != null) {
      result.top = toPx(rectValue.top);
    }
    return result;
  }

  function postResizeSync(relId, before, after, phase) {
    const safeRelId = String(relId || "").trim();
    if (!safeRelId) {
      return;
    }
    window.parent.postMessage({
      type: "REL_RESIZE_SYNC",
      payload: {
        relId: safeRelId,
        phase: phase === "commit" ? "commit" : "preview",
        before: ensurePlainObject(before),
        after: ensurePlainObject(after),
      },
    }, window.location.origin);
  }

  function syncSelectedElement() {
    if (state.dragging) {
      return;
    }
    const next = resolveSelectedElement();
    if (next === state.selectedElement) {
      if (next && !isResizableElement(next)) {
        setSelectedElement(null);
      }
      return;
    }
    setSelectedElement(next);
    clearDwellTimer();
    hideHandles();
  }

  function setSelectedElement(element) {
    if (!isResizableElement(element)) {
      state.selectedElement = null;
      state.selectedRelId = "";
      return;
    }

    state.selectedElement = element;
    state.selectedRelId = String(element.getAttribute("data-rel-id") || "").trim();
  }

  function resolveSelectedElement() {
    const selected = document.querySelector(".rel-editor-selected");
    return selected instanceof Element ? selected : null;
  }

  function isResizableElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    if (!element.isConnected) {
      return false;
    }
    const tag = String(element.tagName || "").toUpperCase();
    if (tag === "HTML" || tag === "BODY") {
      return false;
    }
    const relId = String(element.getAttribute("data-rel-id") || "").trim();
    if (!relId) {
      return false;
    }
    return true;
  }

  function isInResizeHotZone(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (state.overlayRoot && state.overlayRoot.contains(target)) {
      return true;
    }
    if (state.selectedElement && state.selectedElement.contains(target)) {
      return true;
    }
    return false;
  }

  function startDwellTimer() {
    if (state.visible || state.dragging || state.dwellTimer) {
      return;
    }
    state.dwellTimer = window.setTimeout(() => {
      state.dwellTimer = 0;
      showHandles(false);
    }, DWELL_MS);
  }

  function clearDwellTimer() {
    if (!state.dwellTimer) {
      return;
    }
    window.clearTimeout(state.dwellTimer);
    state.dwellTimer = 0;
  }

  function showHandles(force) {
    if (!state.selectedElement || !state.selectedRelId) {
      return;
    }
    if (!ensureUi()) {
      return;
    }
    if (!force && state.dragging) {
      return;
    }
    updateOverlayPosition();
    state.overlayRoot.classList.add("is-visible");
    state.visible = true;
  }

  function hideHandles() {
    if (!state.overlayRoot || !state.visible) {
      return;
    }
    state.overlayRoot.classList.remove("is-visible");
    state.visible = false;
    hideTooltip();
  }

  function scheduleOverlayUpdate() {
    if (!state.visible && !state.dragging) {
      return;
    }
    if (state.rafId) {
      return;
    }
    state.rafId = window.requestAnimationFrame(() => {
      state.rafId = 0;
      updateOverlayPosition();
    });
  }

  function updateOverlayPosition() {
    if (!state.overlayRoot) {
      return;
    }
    const element = state.dragging && state.drag && state.drag.element
      ? state.drag.element
      : state.selectedElement;
    if (!(element instanceof Element) || !element.isConnected) {
      hideHandles();
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      hideHandles();
      return;
    }

    state.overlayRoot.style.left = `${rect.left}px`;
    state.overlayRoot.style.top = `${rect.top}px`;
    state.overlayRoot.style.width = `${rect.width}px`;
    state.overlayRoot.style.height = `${rect.height}px`;
  }

  function updateTooltip(clientX, clientY, width, height) {
    if (!state.tooltip) {
      return;
    }
    const safeWidth = Math.max(MIN_WIDTH, Number(width) || 0);
    const safeHeight = Math.max(MIN_HEIGHT, Number(height) || 0);
    state.tooltip.textContent = `${Math.round(safeWidth)} x ${Math.round(safeHeight)}`;
    state.tooltip.style.left = `${(Number(clientX) || 0) + 14}px`;
    state.tooltip.style.top = `${(Number(clientY) || 0) + 14}px`;
    state.tooltip.classList.add("is-visible");
  }

  function hideTooltip() {
    if (!state.tooltip) {
      return;
    }
    state.tooltip.classList.remove("is-visible");
  }

  function readPxValue(primary, fallback, fallbackNumber) {
    const fromPrimary = parsePxValue(primary);
    if (fromPrimary != null) {
      return fromPrimary;
    }
    const fromFallback = parsePxValue(fallback);
    if (fromFallback != null) {
      return fromFallback;
    }
    return Number(fallbackNumber || 0);
  }

  function normalizePxString(primary, fallback, fallbackText) {
    const value = readPxValue(primary, fallback, null);
    if (value == null) {
      return String(fallbackText || "0px");
    }
    return toPx(value);
  }

  function parsePxValue(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
      return null;
    }
    const match = text.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toPx(value) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : 0;
    const rounded = Math.round(safe * 1000) / 1000;
    return `${rounded}px`;
  }

  function isPointInsideElement(element, clientX, clientY) {
    if (!(element instanceof Element)) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const x = Number(clientX) || 0;
    const y = Number(clientY) || 0;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function ensurePlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function resolvePointerScale() {
    // TODO: If iframe-level zoom/transform is introduced, compute actual pointer scale here.
    return { x: 1, y: 1 };
  }
})();
