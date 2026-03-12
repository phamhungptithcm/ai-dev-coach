(() => {
  const BUBBLE_ID = "ai-dev-coach-live-bubble";
  const BUBBLE_EVENT = "ai-dev-coach:prompt-analyzed";
  const BUBBLE_POSITION_KEY = "liveCoachBubblePosition";
  const VIEWPORT_PADDING = 8;

  const DEFAULT_SETTINGS = {
    enableCoach: true,
    promptListenerEnabled: true,
    behaviorMonitorEnabled: true
  };

  const DEFAULT_STATS = {
    aiRequests: 0,
    manualAttempts: 0,
    largePastes: 0,
    aiCopies: 0,
    fastAiCopies: 0,
    badPrompts: 0,
    shortcutPrompts: 0
  };

  const DEFAULT_RUNTIME = {
    score: null,
    grade: "N/A",
    warnings: [],
    suggestions: [],
    hasShortcutIntent: false,
    hasIndependentAttempt: false,
    promptPreview: "",
    isDraft: false,
    at: 0
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS },
    runtime: { ...DEFAULT_RUNTIME },
    bubblePosition: null,
    refs: null,
    minimized: false,
    drag: {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      moved: false
    }
  };

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeBubblePosition(rawPosition) {
    if (!rawPosition || typeof rawPosition !== "object") {
      return null;
    }

    const left = Number(rawPosition.left);
    const top = Number(rawPosition.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) {
      return null;
    }

    return { left, top };
  }

  function getBubbleDimensions() {
    if (!state.refs?.root) {
      return { width: 340, height: 220 };
    }

    const rect = state.refs.root.getBoundingClientRect();
    const width = rect.width || state.refs.root.offsetWidth || 340;
    const height = rect.height || state.refs.root.offsetHeight || 220;
    return { width, height };
  }

  function clampPositionToViewport(position) {
    const normalized = normalizeBubblePosition(position);
    if (!normalized) {
      return null;
    }

    const { width, height } = getBubbleDimensions();
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
    const maxTop = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);

    return {
      left: clamp(normalized.left, VIEWPORT_PADDING, maxLeft),
      top: clamp(normalized.top, VIEWPORT_PADDING, maxTop)
    };
  }

  function applyBubblePosition(position, options = {}) {
    if (!state.refs?.root) {
      return;
    }

    const clamped = clampPositionToViewport(position);
    if (!clamped) {
      return;
    }

    state.bubblePosition = clamped;
    state.refs.root.style.left = `${clamped.left}px`;
    state.refs.root.style.top = `${clamped.top}px`;
    state.refs.root.style.right = "auto";
    state.refs.root.style.bottom = "auto";

    if (options.persist) {
      storageSet({ [BUBBLE_POSITION_KEY]: clamped }).catch((error) => {
        console.error("AI Dev Coach live bubble position save error", error);
      });
    }
  }

  function computeDependency(stats) {
    const total = stats.aiRequests + stats.manualAttempts;
    if (total === 0) {
      return 0;
    }
    return Math.round((stats.aiRequests / total) * 100);
  }

  function mergeRuntime(rawRuntime) {
    if (!rawRuntime || typeof rawRuntime !== "object") {
      return { ...DEFAULT_RUNTIME };
    }

    return {
      ...DEFAULT_RUNTIME,
      ...rawRuntime,
      isDraft: !!rawRuntime.isDraft,
      warnings: Array.isArray(rawRuntime.warnings) ? rawRuntime.warnings : [],
      suggestions: Array.isArray(rawRuntime.suggestions) ? rawRuntime.suggestions : []
    };
  }

  function gradeClass(score) {
    if (!Number.isFinite(score)) {
      return "ai-coach-live-bubble__grade--na";
    }
    if (score >= 90) {
      return "ai-coach-live-bubble__grade--a";
    }
    if (score >= 75) {
      return "ai-coach-live-bubble__grade--b";
    }
    if (score >= 60) {
      return "ai-coach-live-bubble__grade--c";
    }
    return "ai-coach-live-bubble__grade--d";
  }

  function formatEventTime(runtime) {
    const timestamp = runtime?.at;
    if (!timestamp || !Number.isFinite(timestamp)) {
      return "Waiting for first send event";
    }

    const label = runtime?.isDraft ? "Live typing update" : "Last send update";
    return `${label}: ${new Date(timestamp).toLocaleTimeString()}`;
  }

  function formatScoreSummary(runtime) {
    if (!Number.isFinite(runtime.score)) {
      return "No scored prompt yet. Send a prompt to see realtime coaching.";
    }

    if (runtime.score < 60) {
      return runtime.warnings[0] || "Low-quality prompt detected. Add context and your attempt.";
    }

    if (runtime.score < 75) {
      return runtime.suggestions[0] || "Prompt is fair. Add more concrete context to improve results.";
    }

    return "Prompt quality looks good. Keep using structured prompting.";
  }

  function render() {
    if (!state.refs) {
      return;
    }

    state.refs.root.classList.remove("ai-coach-live-bubble__hidden");
    state.refs.root.style.display = "block";

    const score = Number.isFinite(state.runtime.score) ? state.runtime.score : null;
    state.refs.scoreValue.textContent = score === null ? "--/100" : `${score}/100`;
    state.refs.gradeValue.textContent = score === null ? "N/A" : state.runtime.grade;
    state.refs.gradeValue.className = "ai-coach-live-bubble__grade";
    state.refs.gradeValue.classList.add(gradeClass(score));
    state.refs.scoreSummary.textContent = formatScoreSummary(state.runtime);

    const dependency = computeDependency(state.stats);
    state.refs.habitSummary.textContent =
      `AI: ${state.stats.aiRequests} | Manual: ${state.stats.manualAttempts} | ` +
      `Dependency: ${dependency}% | Bad: ${state.stats.badPrompts} | Shortcut: ${state.stats.shortcutPrompts}`;
    state.refs.behaviorSummary.textContent =
      `Large pastes: ${state.stats.largePastes} | AI copies: ${state.stats.aiCopies} | Fast copies: ${state.stats.fastAiCopies}`;

    const preview = state.runtime.promptPreview ? `Prompt: ${state.runtime.promptPreview}` : "";
    state.refs.preview.textContent = preview;
    state.refs.preview.classList.toggle("ai-coach-live-bubble__muted", !preview);

    state.refs.meta.textContent = formatEventTime(state.runtime);
  }

  function toggleMinimize() {
    if (!state.refs) {
      return;
    }

    state.minimized = !state.minimized;
    state.refs.root.classList.toggle("ai-coach-live-bubble--minimized", state.minimized);
    state.refs.toggleBtn.textContent = state.minimized ? "+" : "–";
    state.refs.toggleBtn.setAttribute("aria-label", state.minimized ? "Expand live coach" : "Collapse live coach");
  }

  function handleDragStart(event) {
    if (!state.refs?.root || !state.refs?.header) {
      return;
    }

    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest(".ai-coach-live-bubble__toggle")) {
      return;
    }

    const rect = state.refs.root.getBoundingClientRect();
    state.drag.active = true;
    state.drag.pointerId = event.pointerId;
    state.drag.startX = event.clientX;
    state.drag.startY = event.clientY;
    state.drag.startLeft = rect.left;
    state.drag.startTop = rect.top;
    state.drag.moved = false;
    state.refs.root.classList.add("ai-coach-live-bubble--dragging");

    if (typeof state.refs.header.setPointerCapture === "function") {
      try {
        state.refs.header.setPointerCapture(event.pointerId);
      } catch (error) {
        console.debug("AI Dev Coach live bubble pointer capture skipped", error);
      }
    }

    event.preventDefault();
  }

  function handleDragMove(event) {
    if (!state.drag.active || event.pointerId !== state.drag.pointerId) {
      return;
    }

    const deltaX = event.clientX - state.drag.startX;
    const deltaY = event.clientY - state.drag.startY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) {
      state.drag.moved = true;
    }

    applyBubblePosition({
      left: state.drag.startLeft + deltaX,
      top: state.drag.startTop + deltaY
    });
  }

  function resetDragState() {
    state.drag.active = false;
    state.drag.pointerId = null;
    state.drag.startX = 0;
    state.drag.startY = 0;
    state.drag.startLeft = 0;
    state.drag.startTop = 0;
    state.drag.moved = false;
  }

  function handleDragEnd(event) {
    if (!state.drag.active) {
      return;
    }

    if (
      event &&
      typeof event.pointerId === "number" &&
      state.drag.pointerId !== null &&
      event.pointerId !== state.drag.pointerId
    ) {
      return;
    }

    if (state.refs?.root) {
      state.refs.root.classList.remove("ai-coach-live-bubble--dragging");
    }

    if (
      state.refs?.header &&
      state.drag.pointerId !== null &&
      typeof state.refs.header.releasePointerCapture === "function"
    ) {
      try {
        state.refs.header.releasePointerCapture(state.drag.pointerId);
      } catch (error) {
        console.debug("AI Dev Coach live bubble pointer release skipped", error);
      }
    }

    const shouldPersist = state.drag.moved && !!state.bubblePosition;
    resetDragState();

    if (shouldPersist) {
      storageSet({ [BUBBLE_POSITION_KEY]: state.bubblePosition }).catch((error) => {
        console.error("AI Dev Coach live bubble position persist error", error);
      });
    }
  }

  function createBubble() {
    const root = document.createElement("section");
    root.id = BUBBLE_ID;
    root.className = "ai-coach-live-bubble";
    root.dataset.aiCoachOwned = "true";
    root.innerHTML = `
      <header class="ai-coach-live-bubble__header">
        <strong>AI Dev Coach Live</strong>
        <button type="button" class="ai-coach-live-bubble__toggle" aria-label="Collapse live coach">–</button>
      </header>
      <div class="ai-coach-live-bubble__body">
        <div class="ai-coach-live-bubble__score-line">
          <span class="ai-coach-live-bubble__label">Prompt Score</span>
          <span class="ai-coach-live-bubble__score">--/100</span>
          <span class="ai-coach-live-bubble__grade ai-coach-live-bubble__grade--na">N/A</span>
        </div>
        <p class="ai-coach-live-bubble__summary">No scored prompt yet. Send a prompt to see realtime coaching.</p>
        <p class="ai-coach-live-bubble__habit"></p>
        <p class="ai-coach-live-bubble__behavior"></p>
        <p class="ai-coach-live-bubble__preview ai-coach-live-bubble__muted"></p>
        <p class="ai-coach-live-bubble__meta">Waiting for first send event</p>
      </div>
    `;

    document.body.appendChild(root);

    state.refs = {
      root,
      header: root.querySelector(".ai-coach-live-bubble__header"),
      toggleBtn: root.querySelector(".ai-coach-live-bubble__toggle"),
      scoreValue: root.querySelector(".ai-coach-live-bubble__score"),
      gradeValue: root.querySelector(".ai-coach-live-bubble__grade"),
      scoreSummary: root.querySelector(".ai-coach-live-bubble__summary"),
      habitSummary: root.querySelector(".ai-coach-live-bubble__habit"),
      behaviorSummary: root.querySelector(".ai-coach-live-bubble__behavior"),
      preview: root.querySelector(".ai-coach-live-bubble__preview"),
      meta: root.querySelector(".ai-coach-live-bubble__meta")
    };

    state.refs.toggleBtn.addEventListener("click", toggleMinimize);
  }

  function applyPromptEvent(detail) {
    if (!detail || typeof detail !== "object") {
      return;
    }

    if (detail.stats && typeof detail.stats === "object") {
      state.stats = { ...DEFAULT_STATS, ...detail.stats };
    }

    if (detail.analysis && typeof detail.analysis === "object") {
      state.runtime = mergeRuntime(detail.analysis);
      state.runtime.isDraft = !!detail.draft;
      if (!state.runtime.at) {
        state.runtime.at = detail.at || Date.now();
      }
      if (!state.runtime.promptPreview && detail.promptPreview) {
        state.runtime.promptPreview = detail.promptPreview;
      }
    } else if (detail.sendOnly) {
      state.runtime = {
        ...state.runtime,
        isDraft: false,
        at: detail.at || Date.now()
      };
    }

    render();
  }

  function ensureBubbleMounted() {
    if (!state.refs?.root) {
      return;
    }

    if (document.body && !document.body.contains(state.refs.root)) {
      document.body.appendChild(state.refs.root);
      render();
      if (state.bubblePosition) {
        applyBubblePosition(state.bubblePosition);
      }
    }
  }

  async function hydrateFromStorage() {
    const data = await storageGet(["settings", "stats", "lastRuntimePromptEvaluation", BUBBLE_POSITION_KEY]);
    state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    state.stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    state.runtime = mergeRuntime(data.lastRuntimePromptEvaluation);
    state.bubblePosition = normalizeBubblePosition(data[BUBBLE_POSITION_KEY]);
  }

  function wireRuntimeEvents() {
    document.addEventListener(
      BUBBLE_EVENT,
      (event) => {
        applyPromptEvent(event?.detail || {});
      },
      true
    );
  }

  function wireStorageUpdates() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes.settings) {
        state.settings = { ...DEFAULT_SETTINGS, ...(changes.settings.newValue || {}) };
      }
      if (changes.stats) {
        state.stats = { ...DEFAULT_STATS, ...(changes.stats.newValue || {}) };
      }
      if (changes.lastRuntimePromptEvaluation) {
        state.runtime = mergeRuntime(changes.lastRuntimePromptEvaluation.newValue);
      }
      if (changes[BUBBLE_POSITION_KEY]) {
        state.bubblePosition = normalizeBubblePosition(changes[BUBBLE_POSITION_KEY].newValue);
        if (state.bubblePosition) {
          applyBubblePosition(state.bubblePosition);
        }
      }

      render();
    });
  }

  function wireDragBehavior() {
    if (!state.refs?.header) {
      return;
    }

    state.refs.header.addEventListener("pointerdown", handleDragStart);
    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
    window.addEventListener("pointercancel", handleDragEnd);
  }

  function wireViewportResize() {
    window.addEventListener(
      "resize",
      () => {
        if (state.bubblePosition) {
          applyBubblePosition(state.bubblePosition);
        }
      },
      { passive: true }
    );
  }

  function wireMountObserver() {
    const observer = new MutationObserver(() => {
      ensureBubbleMounted();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  async function init() {
    createBubble();
    await hydrateFromStorage();
    wireRuntimeEvents();
    wireStorageUpdates();
    wireDragBehavior();
    wireViewportResize();
    wireMountObserver();
    render();

    if (state.bubblePosition) {
      window.requestAnimationFrame(() => {
        applyBubblePosition(state.bubblePosition);
      });
    }

    window.setInterval(() => {
      ensureBubbleMounted();
    }, 1500);
  }

  init().catch((error) => {
    console.error("AI Dev Coach live bubble init error", error);
  });
})();
