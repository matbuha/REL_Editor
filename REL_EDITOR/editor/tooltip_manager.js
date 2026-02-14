(function () {
  const TOOLTIP_ID = "relTooltip";
  const SHOW_DELAY_MS = 600;
  const VIEWPORT_GAP = 10;

  const state = {
    initialized: false,
    enabled: true,
    registry: {},
    tooltipEl: null,
    pendingTarget: null,
    activeTarget: null,
    activeKey: "",
    showTimer: 0,
    touchMode: false,
  };

  function isTouchDevice() {
    const coarse = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
    return coarse || (navigator.maxTouchPoints || 0) > 0;
  }

  function init(options) {
    const opts = options && typeof options === "object" ? options : {};
    state.registry = opts.registry && typeof opts.registry === "object"
      ? opts.registry
      : (window.REL_TOOLTIPS_REGISTRY || {});
    state.touchMode = isTouchDevice();
    state.enabled = !state.touchMode;

    if (state.initialized) {
      return;
    }
    state.initialized = true;

    const tooltip = document.createElement("div");
    tooltip.id = TOOLTIP_ID;
    tooltip.className = "rel-tooltip hidden";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tooltip);
    state.tooltipEl = tooltip;

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
  }

  function onViewportChange() {
    if (!state.activeTarget || !state.tooltipEl || state.tooltipEl.classList.contains("hidden")) {
      return;
    }
    placeTooltip(state.activeTarget, state.tooltipEl);
  }

  function onMouseOver(event) {
    if (!state.enabled) {
      return;
    }
    const target = findTooltipTarget(event.target);
    if (!target) {
      return;
    }
    const from = event.relatedTarget;
    if (from instanceof Element && target.contains(from)) {
      return;
    }
    scheduleShow(target);
  }

  function onMouseOut(event) {
    if (!state.enabled) {
      return;
    }
    const from = findTooltipTarget(event.target);
    if (!from) {
      return;
    }
    const to = event.relatedTarget;
    if (to instanceof Element && from.contains(to)) {
      return;
    }
    if (state.pendingTarget === from || state.activeTarget === from) {
      hideTooltip();
    }
  }

  function onFocusIn(event) {
    if (!state.enabled) {
      return;
    }
    const target = findTooltipTarget(event.target);
    if (!target) {
      return;
    }
    scheduleShow(target);
  }

  function onFocusOut(event) {
    if (!state.enabled) {
      return;
    }
    const target = findTooltipTarget(event.target);
    if (!target) {
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Element && target.contains(next)) {
      return;
    }
    if (state.pendingTarget === target || state.activeTarget === target) {
      hideTooltip();
    }
  }

  function onKeyDown(event) {
    if (event.key !== "Escape") {
      return;
    }
    hideTooltip();
  }

  function scheduleShow(target) {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const key = String(target.getAttribute("data-tooltip-key") || "").trim();
    if (!key) {
      return;
    }
    if (target.disabled) {
      return;
    }

    if (state.activeTarget === target && state.activeKey === key) {
      return;
    }

    clearShowTimer();
    state.pendingTarget = target;
    state.showTimer = window.setTimeout(() => {
      state.showTimer = 0;
      if (state.pendingTarget !== target) {
        return;
      }
      showTooltip(target, key);
    }, SHOW_DELAY_MS);
  }

  function showTooltip(target, key) {
    const tooltip = state.tooltipEl;
    if (!tooltip) {
      return;
    }

    const data = mergeTooltipExtras(getTooltipData(key, target), target);
    if (!data) {
      hideTooltip();
      return;
    }

    renderTooltip(tooltip, data);
    tooltip.classList.remove("hidden");
    tooltip.setAttribute("aria-hidden", "false");
    placeTooltip(target, tooltip);

    if (state.activeTarget && state.activeTarget !== target) {
      clearDescribedBy(state.activeTarget);
    }

    const describedBy = String(target.getAttribute("aria-describedby") || "").trim();
    if (!describedBy) {
      target.setAttribute("aria-describedby", TOOLTIP_ID);
    } else if (!describedBy.split(/\s+/).includes(TOOLTIP_ID)) {
      target.setAttribute("aria-describedby", `${describedBy} ${TOOLTIP_ID}`.trim());
    }
    state.activeTarget = target;
    state.activeKey = key;
    state.pendingTarget = null;
  }

  function hideTooltip() {
    clearShowTimer();
    state.pendingTarget = null;
    if (!state.tooltipEl) {
      return;
    }
    state.tooltipEl.classList.add("hidden");
    state.tooltipEl.setAttribute("aria-hidden", "true");
    if (state.activeTarget) {
      clearDescribedBy(state.activeTarget);
    }
    state.activeTarget = null;
    state.activeKey = "";
  }

  function clearShowTimer() {
    if (!state.showTimer) {
      return;
    }
    clearTimeout(state.showTimer);
    state.showTimer = 0;
  }

  function clearDescribedBy(target) {
    if (!(target instanceof Element)) {
      return;
    }
    const describedBy = String(target.getAttribute("aria-describedby") || "").trim();
    if (!describedBy) {
      return;
    }
    const tokens = describedBy.split(/\s+/).filter((token) => token && token !== TOOLTIP_ID);
    if (tokens.length === 0) {
      target.removeAttribute("aria-describedby");
      return;
    }
    target.setAttribute("aria-describedby", tokens.join(" "));
  }

  function findTooltipTarget(node) {
    if (!(node instanceof Element)) {
      return null;
    }
    return node.closest("[data-tooltip-key]");
  }

  function renderTooltip(tooltip, data) {
    tooltip.innerHTML = "";

    const title = document.createElement("div");
    title.className = "rel-tooltip-title";
    title.textContent = String(data.title || "");
    tooltip.appendChild(title);

    if (data.description) {
      const desc = document.createElement("div");
      desc.className = "rel-tooltip-description";
      desc.textContent = String(data.description);
      tooltip.appendChild(desc);
    }

    appendListSection(tooltip, "Formats", data.formats);
    appendListSection(tooltip, "Examples", data.examples);
    appendListSection(tooltip, "Notes", data.notes);
  }

  function appendListSection(tooltip, labelText, values) {
    const items = Array.isArray(values)
      ? values.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    if (!items.length) {
      return;
    }

    const label = document.createElement("div");
    label.className = "rel-tooltip-label";
    label.textContent = labelText;
    tooltip.appendChild(label);

    const list = document.createElement("ul");
    list.className = "rel-tooltip-list";
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }
    tooltip.appendChild(list);
  }

  function placeTooltip(target, tooltip) {
    const targetRect = target.getBoundingClientRect();
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    tooltip.style.maxWidth = "320px";

    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const canPlaceAbove = targetRect.top >= rect.height + VIEWPORT_GAP;
    const canPlaceRight = (viewportWidth - targetRect.right) >= rect.width + VIEWPORT_GAP;
    const canPlaceBelow = (viewportHeight - targetRect.bottom) >= rect.height + VIEWPORT_GAP;
    const canPlaceLeft = targetRect.left >= rect.width + VIEWPORT_GAP;

    let left = targetRect.left;
    let top = targetRect.top - rect.height - VIEWPORT_GAP;

    if (canPlaceAbove) {
      left = targetRect.left;
      top = targetRect.top - rect.height - VIEWPORT_GAP;
    } else if (canPlaceRight) {
      left = targetRect.right + VIEWPORT_GAP;
      top = targetRect.top;
    } else if (canPlaceBelow) {
      left = targetRect.left;
      top = targetRect.bottom + VIEWPORT_GAP;
    } else if (canPlaceLeft) {
      left = targetRect.left - rect.width - VIEWPORT_GAP;
      top = targetRect.top;
    } else {
      left = Math.max(VIEWPORT_GAP, targetRect.left);
      top = Math.max(VIEWPORT_GAP, targetRect.bottom + VIEWPORT_GAP);
    }

    left = Math.min(viewportWidth - rect.width - VIEWPORT_GAP, Math.max(VIEWPORT_GAP, left));
    top = Math.min(viewportHeight - rect.height - VIEWPORT_GAP, Math.max(VIEWPORT_GAP, top));

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function getTooltipData(key, target) {
    const mapped = state.registry[key];
    if (mapped) {
      return mapped;
    }

    if (key.startsWith("style.")) {
      const propertyName = key.slice("style.".length).trim() || "property";
      return {
        title: propertyName,
        description: `Controls CSS ${propertyName} for the selected element.`,
        formats: ["Valid CSS value"],
        examples: [`${propertyName}: ...`],
      };
    }

    if (key.startsWith("add.")) {
      return state.registry["add.external"] || {
        title: "Component",
        description: "Drag this component into preview to insert it.",
        formats: ["Drag and drop"],
        examples: ["Drop into a container"],
      };
    }

    if (target instanceof HTMLSelectElement) {
      return state.registry["generic.select"] || null;
    }
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      return state.registry["generic.toggle"] || null;
    }
    if (target instanceof HTMLButtonElement) {
      return state.registry["generic.button"] || null;
    }
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return state.registry["generic.input"] || null;
    }
    return null;
  }

  function mergeTooltipExtras(baseData, target) {
    if (!baseData || !(target instanceof Element)) {
      return baseData;
    }
    const extraRaw = String(target.getAttribute("data-tooltip-extra") || "").trim();
    if (!extraRaw) {
      return baseData;
    }
    const extraLines = extraRaw.split("|").map((line) => String(line || "").trim()).filter(Boolean);
    if (extraLines.length === 0) {
      return baseData;
    }
    const next = {
      ...baseData,
      notes: Array.isArray(baseData.notes) ? [...baseData.notes] : [],
    };
    for (const line of extraLines) {
      if (!next.notes.includes(line)) {
        next.notes.push(line);
      }
    }
    return next;
  }

  window.REL_TOOLTIP_MANAGER = {
    init,
    hideTooltip,
  };
})();
