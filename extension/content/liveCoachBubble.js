(() => {
  const BUBBLE_ID = "ai-dev-coach-live-bubble";
  const BUBBLE_EVENT = "ai-dev-coach:prompt-analyzed";

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
    at: 0
  };

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...DEFAULT_STATS },
    runtime: { ...DEFAULT_RUNTIME },
    refs: null,
    minimized: false
  };

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
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

  function shouldShowBubble() {
    return (
      !!state.settings.enableCoach &&
      (!!state.settings.promptListenerEnabled || !!state.settings.behaviorMonitorEnabled)
    );
  }

  function formatEventTime(timestamp) {
    if (!timestamp || !Number.isFinite(timestamp)) {
      return "Waiting for first send event";
    }

    return `Last update: ${new Date(timestamp).toLocaleTimeString()}`;
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

    const visible = shouldShowBubble();
    state.refs.root.classList.toggle("ai-coach-live-bubble__hidden", !visible);
    if (!visible) {
      return;
    }

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

    state.refs.meta.textContent = formatEventTime(state.runtime.at);
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
      if (!state.runtime.at) {
        state.runtime.at = detail.at || Date.now();
      }
      if (!state.runtime.promptPreview && detail.promptPreview) {
        state.runtime.promptPreview = detail.promptPreview;
      }
    } else if (detail.sendOnly) {
      state.runtime = {
        ...state.runtime,
        at: detail.at || Date.now()
      };
    }

    render();
  }

  async function hydrateFromStorage() {
    const data = await storageGet(["settings", "stats", "lastRuntimePromptEvaluation"]);
    state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    state.stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    state.runtime = mergeRuntime(data.lastRuntimePromptEvaluation);
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

      render();
    });
  }

  async function init() {
    createBubble();
    await hydrateFromStorage();
    wireRuntimeEvents();
    wireStorageUpdates();
    render();
  }

  init().catch((error) => {
    console.error("AI Dev Coach live bubble init error", error);
  });
})();
