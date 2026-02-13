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

  const SNAP_CONFIG = {
    enableSnap: true,
    gridSize: 8,
    snapThreshold: 6,
    showGuides: true,
    snapToGrid: true,
    snapToElements: true,
    candidatesLimit: 120,
  };

  const state = {
    selectedElement: null,
    selectedRelId: "",
    overlayRoot: null,
    tooltip: null,
    guidesRoot: null,
    guideX: null,
    guideY: null,
    visible: false,
    dwellTimer: 0,
    dragging: false,
    drag: null,
    overlayRafId: 0,
    dragRafId: 0,
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

    if (state.overlayRafId) {
      window.cancelAnimationFrame(state.overlayRafId);
      state.overlayRafId = 0;
    }
    if (state.dragRafId) {
      window.cancelAnimationFrame(state.dragRafId);
      state.dragRafId = 0;
    }

    if (state.overlayRoot) {
      state.overlayRoot.remove();
      state.overlayRoot = null;
    }
    if (state.tooltip) {
      state.tooltip.remove();
      state.tooltip = null;
    }
    if (state.guidesRoot) {
      state.guidesRoot.remove();
      state.guidesRoot = null;
      state.guideX = null;
      state.guideY = null;
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
    if (state.overlayRoot && state.tooltip && state.guidesRoot && state.guideX && state.guideY) {
      return true;
    }
    if (!document.body) {
      return false;
    }

    const guidesRoot = document.createElement("div");
    guidesRoot.className = "rel-snap-guides";
    guidesRoot.dataset.relRuntime = "overlay-ui";

    const guideX = document.createElement("div");
    guideX.className = "rel-snap-guide rel-snap-guide-x";
    guideX.dataset.relRuntime = "overlay-ui";

    const guideY = document.createElement("div");
    guideY.className = "rel-snap-guide rel-snap-guide-y";
    guideY.dataset.relRuntime = "overlay-ui";

    guidesRoot.appendChild(guideX);
    guidesRoot.appendChild(guideY);

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

    document.body.appendChild(guidesRoot);
    document.body.appendChild(overlay);
    document.body.appendChild(tooltip);

    state.guidesRoot = guidesRoot;
    state.guideX = guideX;
    state.guideY = guideY;
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

    startDrag(dir, event.clientX, event.clientY, event.shiftKey);
  }

  function startDrag(dir, startClientX, startClientY, shiftKey) {
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
      startLeft,
      startTop,
      startRatio: startRect.height > 0 ? startRect.width / startRect.height : 1,
      canMoveX,
      canMoveY,
      before,
      scaleX: scale.x,
      scaleY: scale.y,
      pendingClientX: Number(startClientX) || 0,
      pendingClientY: Number(startClientY) || 0,
      pendingShift: Boolean(shiftKey),
      snapCache: buildSnapCache(element, startRect),
      lastAfter: buildAfterStyles(
        { width: startRect.width, height: startRect.height, left: startLeft, top: startTop },
        canMoveX,
        canMoveY
      ),
    };

    state.dragging = true;
    state.suppressClickUntil = 0;

    ensureUi();
    showHandles(true);
    hideGuides();
    updateTooltip(startClientX, startClientY, startRect.width, startRect.height, {
      shiftActive: false,
      shiftHint: false,
      snapped: false,
    });
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

    state.lastClientX = Number(event.clientX) || 0;
    state.lastClientY = Number(event.clientY) || 0;
    queueDragPointer(event.clientX, event.clientY, event.shiftKey);
  }

  function queueDragPointer(clientX, clientY, shiftKey) {
    if (!state.drag || !state.dragging) {
      return;
    }

    state.drag.pendingClientX = Number(clientX) || 0;
    state.drag.pendingClientY = Number(clientY) || 0;
    state.drag.pendingShift = Boolean(shiftKey);
    requestDragFrame();
  }

  function requestDragFrame() {
    if (state.dragRafId) {
      return;
    }

    state.dragRafId = window.requestAnimationFrame(() => {
      state.dragRafId = 0;
      if (!state.dragging || !state.drag) {
        return;
      }
      applyDragFromPointer(state.drag.pendingClientX, state.drag.pendingClientY, state.drag.pendingShift);
    });
  }

  function applyDragFromPointer(clientX, clientY, shiftKey) {
    if (!state.dragging || !state.drag) {
      return;
    }

    const drag = state.drag;
    if (!(drag.element instanceof Element) || !drag.element.isConnected) {
      stopDrag(true);
      return;
    }

    const dxRaw = (Number(clientX) || 0) - drag.startClientX;
    const dyRaw = (Number(clientY) || 0) - drag.startClientY;
    const dx = dxRaw / (drag.scaleX || 1);
    const dy = dyRaw / (drag.scaleY || 1);

    let nextRect = computeNextRect(drag, dx, dy);

    const shiftPressed = Boolean(shiftKey);
    const shiftActive = shiftPressed && isCornerDirection(drag.dir);
    if (shiftActive) {
      nextRect = applyAspectRatioLock(drag, nextRect, dx, dy);
    }

    const snapResult = applySnapping(drag, nextRect);
    nextRect = snapResult.rect;
    if (shiftActive) {
      nextRect = applyAspectRatioLock(drag, nextRect, dx, dy);
    }

    applyRectStyles(drag, nextRect);
    scheduleOverlayUpdate();

    if (SNAP_CONFIG.showGuides && snapResult.snapped) {
      showGuides(snapResult.guides);
    } else {
      hideGuides();
    }

    updateTooltip(clientX, clientY, nextRect.width, nextRect.height, {
      shiftActive,
      shiftHint: shiftPressed && !shiftActive,
      snapped: snapResult.snapped,
    });

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

    state.lastClientX = Number(event.clientX) || 0;
    state.lastClientY = Number(event.clientY) || 0;
    applyDragFromPointer(event.clientX, event.clientY, event.shiftKey);
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

    if (state.dragRafId) {
      window.cancelAnimationFrame(state.dragRafId);
      state.dragRafId = 0;
    }

    setResizeModeClass(false);
    hideTooltip();
    hideGuides();

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
    const active = Boolean(isActive);
    if (document.body) {
      document.body.classList.toggle("rel-resizing", active);
    }
    if (document.documentElement) {
      document.documentElement.classList.toggle("rel-resizing", active);
    }
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

  function isCornerDirection(dir) {
    const safe = String(dir || "");
    return safe.length === 2 && /[ns]/.test(safe) && /[ew]/.test(safe);
  }

  function applyAspectRatioLock(drag, rectValue, dx, dy) {
    const ratio = Number(drag.startRatio) > 0 ? Number(drag.startRatio) : 1;

    let width = Math.max(MIN_WIDTH, Number(rectValue.width) || drag.startRect.width);
    let height = Math.max(MIN_HEIGHT, Number(rectValue.height) || drag.startRect.height);

    if (Math.abs(dx) >= Math.abs(dy)) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }

    width = Math.max(MIN_WIDTH, width);
    height = Math.max(MIN_HEIGHT, height);

    if (width === MIN_WIDTH) {
      height = Math.max(MIN_HEIGHT, width / ratio);
    }
    if (height === MIN_HEIGHT) {
      width = Math.max(MIN_WIDTH, height * ratio);
    }

    const result = {
      width,
      height,
      left: rectValue.left,
      top: rectValue.top,
    };

    if (drag.dir.includes("w") && drag.canMoveX) {
      result.left = Number(drag.startLeft || 0) + (drag.startRect.width - width);
    }
    if (drag.dir.includes("n") && drag.canMoveY) {
      result.top = Number(drag.startTop || 0) + (drag.startRect.height - height);
    }

    return result;
  }

  function applySnapping(drag, rectValue) {
    if (!SNAP_CONFIG.enableSnap) {
      return { rect: rectValue, snapped: false, guides: { x: null, y: null } };
    }

    let viewportRect = toViewportRect(drag, rectValue);
    const guides = { x: null, y: null };
    let snapped = false;

    const elementSnapX = SNAP_CONFIG.snapToElements && drag.snapCache
      ? findElementSnapTarget(
        drag.snapCache.xLines,
        getMovingLineDescriptor(viewportRect, drag, "x"),
        SNAP_CONFIG.snapThreshold
      )
      : null;
    const gridSnapX = SNAP_CONFIG.snapToGrid
      ? findGridSizeTarget(viewportRect.width, SNAP_CONFIG.gridSize, SNAP_CONFIG.snapThreshold)
      : null;

    if (elementSnapX || gridSnapX) {
      const useElementX = Boolean(elementSnapX && (!gridSnapX || elementSnapX.distance <= gridSnapX.distance));
      if (useElementX) {
        viewportRect = applyAxisTarget(viewportRect, drag, "x", elementSnapX.target);
        guides.x = elementSnapX.target;
      } else if (gridSnapX) {
        viewportRect = applySizeTarget(viewportRect, drag, "x", gridSnapX.target);
        const movingX = getMovingLineDescriptor(viewportRect, drag, "x");
        guides.x = movingX ? movingX.value : guides.x;
      }
      snapped = true;
    }

    const elementSnapY = SNAP_CONFIG.snapToElements && drag.snapCache
      ? findElementSnapTarget(
        drag.snapCache.yLines,
        getMovingLineDescriptor(viewportRect, drag, "y"),
        SNAP_CONFIG.snapThreshold
      )
      : null;
    const gridSnapY = SNAP_CONFIG.snapToGrid
      ? findGridSizeTarget(viewportRect.height, SNAP_CONFIG.gridSize, SNAP_CONFIG.snapThreshold)
      : null;

    if (elementSnapY || gridSnapY) {
      const useElementY = Boolean(elementSnapY && (!gridSnapY || elementSnapY.distance <= gridSnapY.distance));
      if (useElementY) {
        viewportRect = applyAxisTarget(viewportRect, drag, "y", elementSnapY.target);
        guides.y = elementSnapY.target;
      } else if (gridSnapY) {
        viewportRect = applySizeTarget(viewportRect, drag, "y", gridSnapY.target);
        const movingY = getMovingLineDescriptor(viewportRect, drag, "y");
        guides.y = movingY ? movingY.value : guides.y;
      }
      snapped = true;
    }

    const snappedRect = fromViewportRect(drag, viewportRect);
    return {
      rect: snappedRect,
      snapped,
      guides,
    };
  }

  function toViewportRect(drag, rectValue) {
    const width = Math.max(MIN_WIDTH, Number(rectValue.width) || drag.startRect.width);
    const height = Math.max(MIN_HEIGHT, Number(rectValue.height) || drag.startRect.height);

    let left = drag.startRect.left;
    let top = drag.startRect.top;

    if (drag.dir.includes("w") && drag.canMoveX) {
      left = drag.startRect.right - width;
    }
    if (drag.dir.includes("n") && drag.canMoveY) {
      top = drag.startRect.bottom - height;
    }

    const right = left + width;
    const bottom = top + height;

    return {
      left,
      top,
      right,
      bottom,
      width,
      height,
      centerX: left + width / 2,
      centerY: top + height / 2,
    };
  }

  function fromViewportRect(drag, viewportRect) {
    const width = Math.max(MIN_WIDTH, Number(viewportRect.width) || drag.startRect.width);
    const height = Math.max(MIN_HEIGHT, Number(viewportRect.height) || drag.startRect.height);

    const result = {
      width,
      height,
      left: null,
      top: null,
    };

    if (drag.dir.includes("w") && drag.canMoveX) {
      result.left = Number(drag.startLeft || 0) + (drag.startRect.width - width);
    }
    if (drag.dir.includes("n") && drag.canMoveY) {
      result.top = Number(drag.startTop || 0) + (drag.startRect.height - height);
    }

    return result;
  }

  function getMovingLineDescriptor(viewportRect, drag, axis) {
    if (axis === "x") {
      if (drag.dir.includes("e")) {
        return { axis: "x", mode: "right", value: viewportRect.right };
      }
      if (drag.dir.includes("w")) {
        if (drag.canMoveX) {
          return { axis: "x", mode: "left", value: viewportRect.left };
        }
        return { axis: "x", mode: "right", value: viewportRect.right };
      }
      return null;
    }

    if (drag.dir.includes("s")) {
      return { axis: "y", mode: "bottom", value: viewportRect.bottom };
    }
    if (drag.dir.includes("n")) {
      if (drag.canMoveY) {
        return { axis: "y", mode: "top", value: viewportRect.top };
      }
      return { axis: "y", mode: "bottom", value: viewportRect.bottom };
    }
    return null;
  }

  function applyAxisTarget(viewportRect, drag, axis, target) {
    const descriptor = getMovingLineDescriptor(viewportRect, drag, axis);
    if (!descriptor || !Number.isFinite(target)) {
      return viewportRect;
    }

    const next = { ...viewportRect };

    if (axis === "x") {
      if (descriptor.mode === "right") {
        const fixedLeft = next.left;
        let width = Math.max(MIN_WIDTH, Number(target) - fixedLeft);
        if (!Number.isFinite(width)) {
          width = next.width;
        }
        next.width = width;
        next.right = fixedLeft + width;
        next.left = fixedLeft;
      } else {
        const fixedRight = next.right;
        let width = Math.max(MIN_WIDTH, fixedRight - Number(target));
        if (!Number.isFinite(width)) {
          width = next.width;
        }
        next.width = width;
        next.left = fixedRight - width;
        next.right = fixedRight;
      }
      next.centerX = next.left + next.width / 2;
      return next;
    }

    if (descriptor.mode === "bottom") {
      const fixedTop = next.top;
      let height = Math.max(MIN_HEIGHT, Number(target) - fixedTop);
      if (!Number.isFinite(height)) {
        height = next.height;
      }
      next.height = height;
      next.bottom = fixedTop + height;
      next.top = fixedTop;
    } else {
      const fixedBottom = next.bottom;
      let height = Math.max(MIN_HEIGHT, fixedBottom - Number(target));
      if (!Number.isFinite(height)) {
        height = next.height;
      }
      next.height = height;
      next.top = fixedBottom - height;
      next.bottom = fixedBottom;
    }
    next.centerY = next.top + next.height / 2;
    return next;
  }

  function applySizeTarget(viewportRect, drag, axis, targetSize) {
    const next = { ...viewportRect };

    if (axis === "x") {
      const width = Math.max(MIN_WIDTH, Number(targetSize) || next.width);
      if (drag.dir.includes("w") && drag.canMoveX) {
        const fixedRight = next.right;
        next.width = width;
        next.left = fixedRight - width;
        next.right = fixedRight;
      } else {
        const fixedLeft = next.left;
        next.width = width;
        next.left = fixedLeft;
        next.right = fixedLeft + width;
      }
      next.centerX = next.left + next.width / 2;
      return next;
    }

    const height = Math.max(MIN_HEIGHT, Number(targetSize) || next.height);
    if (drag.dir.includes("n") && drag.canMoveY) {
      const fixedBottom = next.bottom;
      next.height = height;
      next.top = fixedBottom - height;
      next.bottom = fixedBottom;
    } else {
      const fixedTop = next.top;
      next.height = height;
      next.top = fixedTop;
      next.bottom = fixedTop + height;
    }
    next.centerY = next.top + next.height / 2;
    return next;
  }

  function findElementSnapTarget(referenceLines, movingDescriptor, threshold) {
    if (!movingDescriptor || !Array.isArray(referenceLines) || referenceLines.length === 0) {
      return null;
    }

    let best = null;
    for (const value of referenceLines) {
      const safeValue = Number(value);
      if (!Number.isFinite(safeValue)) {
        continue;
      }
      const diff = safeValue - movingDescriptor.value;
      const distance = Math.abs(diff);
      if (distance > threshold) {
        continue;
      }
      if (!best || distance < best.distance) {
        best = {
          target: safeValue,
          distance,
        };
      }
    }
    return best;
  }

  function findGridSizeTarget(sizeValue, gridSize, threshold) {
    const source = Number(sizeValue);
    if (!Number.isFinite(source)) {
      return null;
    }
    const safeGrid = Number(gridSize);
    if (!Number.isFinite(safeGrid) || safeGrid <= 0) {
      return null;
    }

    const target = Math.round(source / safeGrid) * safeGrid;
    if (!Number.isFinite(target)) {
      return null;
    }
    const distance = Math.abs(target - source);
    if (distance > threshold) {
      return null;
    }
    return { target, distance };
  }

  function buildSnapCache(selectedElement, selectedRect) {
    const cache = {
      xLines: [],
      yLines: [],
    };

    if (!SNAP_CONFIG.enableSnap || !SNAP_CONFIG.snapToElements || !document.body) {
      return cache;
    }

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return cache;
    }

    const selectedCenterX = selectedRect.left + selectedRect.width / 2;
    const selectedCenterY = selectedRect.top + selectedRect.height / 2;

    const collected = [];
    const allNodes = document.body.querySelectorAll("*");
    for (const node of allNodes) {
      if (!(node instanceof Element)) {
        continue;
      }
      if (node === selectedElement) {
        continue;
      }
      if (selectedElement.contains(node) || node.contains(selectedElement)) {
        continue;
      }
      if (node.closest("[data-rel-runtime='overlay-ui']")) {
        continue;
      }

      const tag = String(node.tagName || "").toUpperCase();
      if (tag === "HTML" || tag === "BODY") {
        continue;
      }

      const rect = node.getBoundingClientRect();
      if (!isUsableRect(rect)) {
        continue;
      }
      if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
        continue;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.pow(centerX - selectedCenterX, 2) + Math.pow(centerY - selectedCenterY, 2);

      collected.push({
        rect,
        distance,
      });
    }

    collected.sort((a, b) => a.distance - b.distance);

    const limited = collected.slice(0, SNAP_CONFIG.candidatesLimit);
    for (const item of limited) {
      const rect = item.rect;
      cache.xLines.push(rect.left, rect.left + rect.width / 2, rect.right);
      cache.yLines.push(rect.top, rect.top + rect.height / 2, rect.bottom);
    }

    return cache;
  }

  function isUsableRect(rect) {
    if (!rect) {
      return false;
    }
    if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) {
      return false;
    }
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) {
      return false;
    }
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }
    return true;
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

    window.parent.postMessage(
      {
        type: "REL_RESIZE_SYNC",
        payload: {
          relId: safeRelId,
          phase: phase === "commit" ? "commit" : "preview",
          before: ensurePlainObject(before),
          after: ensurePlainObject(after),
        },
      },
      window.location.origin
    );
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
    hideGuides();
  }

  function scheduleOverlayUpdate() {
    if (!state.visible && !state.dragging) {
      return;
    }
    if (state.overlayRafId) {
      return;
    }

    state.overlayRafId = window.requestAnimationFrame(() => {
      state.overlayRafId = 0;
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

  function showGuides(guides) {
    if (!state.guideX || !state.guideY) {
      return;
    }

    const x = Number(guides && guides.x);
    const y = Number(guides && guides.y);

    if (Number.isFinite(x)) {
      state.guideX.style.left = `${x}px`;
      state.guideX.classList.add("is-visible");
    } else {
      state.guideX.classList.remove("is-visible");
    }

    if (Number.isFinite(y)) {
      state.guideY.style.top = `${y}px`;
      state.guideY.classList.add("is-visible");
    } else {
      state.guideY.classList.remove("is-visible");
    }
  }

  function hideGuides() {
    if (state.guideX) {
      state.guideX.classList.remove("is-visible");
    }
    if (state.guideY) {
      state.guideY.classList.remove("is-visible");
    }
  }

  function updateTooltip(clientX, clientY, width, height, options) {
    if (!state.tooltip) {
      return;
    }

    const info = options && typeof options === "object" ? options : {};
    const safeWidth = Math.max(MIN_WIDTH, Number(width) || 0);
    const safeHeight = Math.max(MIN_HEIGHT, Number(height) || 0);

    const parts = [
      `W: ${Math.round(safeWidth)}px`,
      `H: ${Math.round(safeHeight)}px`,
    ];

    if (info.shiftActive) {
      parts.push("SHIFT");
    } else if (info.shiftHint) {
      parts.push("SHIFT-corner");
    }
    if (info.snapped) {
      parts.push("SNAP");
    }

    state.tooltip.textContent = parts.join(" ");
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
