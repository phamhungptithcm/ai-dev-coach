(() => {
  const PLATFORM_CONFIG = [
    {
      name: "ChatGPT",
      matches: [/chatgpt\.com/i, /chat\.openai\.com/i],
      inputSelectors: ["textarea", '[contenteditable="true"]']
    },
    {
      name: "Claude",
      matches: [/claude\.ai/i],
      inputSelectors: ["textarea", '[contenteditable="true"]']
    },
    {
      name: "Gemini",
      matches: [/gemini\.google\.com/i],
      inputSelectors: ["textarea", '[contenteditable="true"]']
    },
    {
      name: "Grok",
      matches: [/grok\.com/i],
      inputSelectors: ["textarea", '[contenteditable="true"]']
    },
    {
      name: "DeepSeek",
      matches: [/chat\.deepseek\.com/i, /deepseek\.com/i],
      inputSelectors: ["textarea", '[contenteditable="true"]']
    }
  ];

  const DEFAULT_SETTINGS = {
    enableCoach: true,
    strictMode: true,
    dependencyWarningThreshold: 70,
    pasteThreshold: 320,
    overlayDurationMs: 6500
  };

  const DEFAULT_PROFILE = {
    role: "",
    skill: "",
    habitGoals: ""
  };

  const DEFAULT_STATS = {
    aiRequests: 0,
    manualAttempts: 0,
    largePastes: 0
  };

  const ATTEMPT_HINTS = [
    /i tried/i,
    /i attempted/i,
    /i already/i,
    /my hypothesis/i,
    /stack trace/i,
    /expected/i,
    /actual/i,
    /repro(duce)?/i,
    /failing test/i
  ];

  const SHORTCUT_HINTS = [
    /give me full code/i,
    /do it for me/i,
    /just give me answer/i,
    /no explanation/i,
    /copy and paste/i,
    /urgent.*fix/i
  ];

  const attachedInputs = new WeakSet();
  const attachedForms = new WeakSet();
  let lastPromptSignature = "";
  let lastPromptAt = 0;
  let scanQueued = false;

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }

  function showCoachMessage(message, type, settings) {
    const duration = settings.overlayDurationMs || DEFAULT_SETTINGS.overlayDurationMs;

    if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
      window.AIDevCoachOverlay.show(message, type, duration);
      return;
    }

    console.log("AI Dev Coach:", message);
  }

  async function getState() {
    const data = await storageGet(["settings", "profile", "stats"]);

    return {
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
      profile: { ...DEFAULT_PROFILE, ...(data.profile || {}) },
      stats: { ...DEFAULT_STATS, ...(data.stats || {}) }
    };
  }

  function detectPlatform() {
    const locationValue = window.location.href;
    return PLATFORM_CONFIG.find((platform) =>
      platform.matches.some((matcher) => matcher.test(locationValue))
    );
  }

  function isVisibleInput(element) {
    if (!element) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    if (element.hasAttribute("disabled") || element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    if (element.tagName === "TEXTAREA" && element.readOnly) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isPlatformInput(platform, element) {
    return platform.inputSelectors.some((selector) => element.matches(selector));
  }

  function findPromptInputs(platform) {
    const matches = [];
    const seen = new Set();

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      isPlatformInput(platform, activeElement) &&
      isVisibleInput(activeElement)
    ) {
      matches.push(activeElement);
      seen.add(activeElement);
    }

    for (const selector of platform.inputSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      for (const candidate of candidates) {
        if (!(candidate instanceof HTMLElement)) {
          continue;
        }
        if (seen.has(candidate) || !isVisibleInput(candidate)) {
          continue;
        }
        matches.push(candidate);
        seen.add(candidate);
        if (matches.length >= 8) {
          return matches;
        }
      }
    }

    return matches;
  }

  function readPrompt(input) {
    if (!input) {
      return "";
    }

    if (input.tagName === "TEXTAREA") {
      return input.value || "";
    }

    return input.innerText || "";
  }

  function hasIndependentAttempt(prompt) {
    return ATTEMPT_HINTS.some((pattern) => pattern.test(prompt));
  }

  function hasShortcutIntent(prompt) {
    return SHORTCUT_HINTS.some((pattern) => pattern.test(prompt));
  }

  function hasConcreteContext(prompt) {
    const signals = [
      /```/,
      /error/i,
      /stack trace/i,
      /line\s*\d+/i,
      /function\s+[a-z0-9_]+/i,
      /file(s)?\s*:/i,
      /module/i,
      /expected/i,
      /actual/i,
      /steps to reproduce/i
    ];

    if (prompt.length > 170) {
      return true;
    }

    return signals.some((pattern) => pattern.test(prompt));
  }

  function hasStructuredSections(prompt) {
    return (
      /task\s*:/i.test(prompt) &&
      /context\s*:/i.test(prompt) &&
      /(what i (already )?tried|attempt)\s*:/i.test(prompt)
    );
  }

  function scoreGrade(score) {
    if (score >= 90) {
      return "A";
    }
    if (score >= 75) {
      return "B";
    }
    if (score >= 60) {
      return "C";
    }
    return "D";
  }

  function analyzePrompt(prompt, strictMode) {
    let score = 0;
    const warnings = [];
    const suggestions = [];

    if (prompt.length >= 40) {
      score += 18;
    } else if (prompt.length >= 20) {
      score += 10;
      suggestions.push("Add more detail so AI can reason about your exact context.");
    } else {
      warnings.push("Prompt is too short. Add context before asking AI.");
    }

    if (hasConcreteContext(prompt)) {
      score += 22;
    } else {
      suggestions.push("Add concrete details: error, expected behavior, and current behavior.");
    }

    const independentAttempt = hasIndependentAttempt(prompt);
    if (independentAttempt) {
      score += 20;
    } else {
      suggestions.push("Add what you already tried so AI can coach your reasoning.");
    }

    const shortcutIntent = hasShortcutIntent(prompt);
    if (shortcutIntent) {
      warnings.push("Prompt asks for shortcuts. Ask for guidance first, not full copy-paste code.");
      score -= 18;
    } else {
      score += 10;
    }

    if (hasStructuredSections(prompt)) {
      score += 20;
    } else {
      suggestions.push("Use a structured format: Task, Context, and What You Tried.");
    }

    if (strictMode && shortcutIntent && !independentAttempt) {
      score -= 12;
      warnings.push("Strict mode: include your attempt before asking for a final solution.");
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      grade: scoreGrade(score),
      warnings,
      suggestions,
      hasShortcutIntent: shortcutIntent,
      hasIndependentAttempt: independentAttempt
    };
  }

  async function updatePromptStats(prompt) {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };

    stats.aiRequests += 1;

    if (hasIndependentAttempt(prompt)) {
      stats.manualAttempts += 1;
    }

    await storageSet({ stats });

    const total = stats.aiRequests + stats.manualAttempts;
    const dependency = total > 0 ? Math.round((stats.aiRequests / total) * 100) : 0;

    return { stats, dependency };
  }

  function buildHabitTip(profile, analysis) {
    const normalizedRole = (profile.role || "").toLowerCase();
    const normalizedSkill = (profile.skill || "").toLowerCase();
    const normalizedGoals = (profile.habitGoals || "").toLowerCase();

    if (analysis.hasShortcutIntent) {
      return "Ask AI for a hint path or checklist first, then write the code yourself.";
    }

    if (normalizedGoals.includes("debug")) {
      return "Habit goal: debug first. Isolate one failing input before requesting fixes.";
    }

    if (normalizedGoals.includes("test")) {
      return "Habit goal: tests first. Add one failing test before asking AI to patch code.";
    }

    if (normalizedRole.includes("frontend")) {
      return "For frontend work, ask AI for edge cases (state, loading, and accessibility).";
    }

    if (normalizedRole.includes("backend")) {
      return "For backend work, ask AI for failure paths and data validation checks.";
    }

    if (normalizedSkill.includes("junior") || normalizedSkill.includes("beginner")) {
      return "Learning mode: request a step-by-step explanation before any full solution.";
    }

    return "State your goal, your attempt, and your blocker in every prompt for faster learning.";
  }

  function queueMessages(messages, settings) {
    const deduped = [];
    const seen = new Set();

    for (const message of messages) {
      if (!message || !message.text) {
        continue;
      }

      const key = `${message.type}:${message.text}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      deduped.push(message);
    }

    deduped.slice(0, 4).forEach((message, index) => {
      window.setTimeout(() => {
        showCoachMessage(message.text, message.type, settings);
      }, index * 350);
    });
  }

  async function handlePrompt(prompt) {
    if (!prompt || !prompt.trim()) {
      return;
    }

    const { settings, profile } = await getState();
    const analysis = analyzePrompt(prompt, settings.strictMode);
    const { dependency } = await updatePromptStats(prompt);

    if (!settings.enableCoach) {
      return;
    }

    const messages = [];

    analysis.warnings.forEach((warning) => {
      messages.push({ type: "warning", text: warning });
    });

    analysis.suggestions.slice(0, 2).forEach((suggestion) => {
      messages.push({ type: "info", text: suggestion });
    });

    messages.push({
      type: analysis.score < 60 ? "warning" : "success",
      text: `Prompt quality score: ${analysis.score}/100 (Grade ${analysis.grade})`
    });

    if (dependency >= settings.dependencyWarningThreshold) {
      messages.push({
        type: "warning",
        text: `AI dependency is ${dependency}%. Try one manual debugging pass first.`
      });
    }

    const habitTip = buildHabitTip(profile, analysis);
    messages.push({ type: "info", text: habitTip });

    queueMessages(messages, settings);
  }

  function shouldTrackEnter(event) {
    return event.key === "Enter" && !event.shiftKey && !event.isComposing;
  }

  function buildPromptSignature(prompt) {
    return `${prompt.length}:${prompt.slice(0, 160)}:${prompt.slice(-80)}`;
  }

  function shouldSkipPrompt(prompt) {
    const signature = buildPromptSignature(prompt);
    const now = Date.now();

    if (signature === lastPromptSignature && now - lastPromptAt < 1200) {
      return true;
    }

    lastPromptSignature = signature;
    lastPromptAt = now;
    return false;
  }

  function submitPromptFromInput(input) {
    const prompt = readPrompt(input).trim();
    if (!prompt || shouldSkipPrompt(prompt)) {
      return;
    }

    handlePrompt(prompt).catch((error) => {
      console.error("AI Dev Coach prompt handling error", error);
    });
  }

  function attachFormListener(input) {
    const form = input.closest("form");
    if (!form || attachedForms.has(form)) {
      return;
    }

    form.addEventListener(
      "submit",
      () => {
        submitPromptFromInput(input);
      },
      true
    );

    attachedForms.add(form);
  }

  function attachInputListener(input) {
    if (!input || attachedInputs.has(input)) {
      return;
    }

    input.addEventListener(
      "keydown",
      (event) => {
        if (!shouldTrackEnter(event)) {
          return;
        }

        submitPromptFromInput(input);
      },
      true
    );

    attachedInputs.add(input);
    attachFormListener(input);
  }

  function scanAndAttach() {
    const platform = detectPlatform();
    if (!platform) {
      return;
    }

    const inputs = findPromptInputs(platform);
    inputs.forEach((input) => attachInputListener(input));
  }

  function scheduleScan() {
    if (scanQueued) {
      return;
    }

    scanQueued = true;

    window.setTimeout(() => {
      scanQueued = false;
      scanAndAttach();
    }, 250);
  }

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener(
    "focusin",
    () => {
      scheduleScan();
    },
    true
  );

  scanAndAttach();
})();
