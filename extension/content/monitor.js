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
    promptListenerEnabled: true,
    behaviorMonitorEnabled: true,
    readPromptContentEnabled: true,
    readCopiedContentEnabled: true,
    readBeforeCopyEnabled: true,
    showOutputCountdown: true,
    strictMode: true,
    dependencyWarningThreshold: 70,
    pasteThreshold: 320,
    longCopyThreshold: 360,
    minReadBeforeCopySeconds: 20,
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
    largePastes: 0,
    aiCopies: 0,
    fastAiCopies: 0
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

  const SEND_BUTTON_HINTS = [
    /\bsend\b/i,
    /\bsubmit\b/i,
    /\bask\b/i,
    /send message/i,
    /submit prompt/i,
    /arrow up/i
  ];

  const NON_SEND_BUTTON_HINTS = [
    /\bstop\b/i,
    /\bregenerate\b/i,
    /\bretry\b/i,
    /\bnew chat\b/i,
    /\battach\b/i,
    /\bupload\b/i,
    /\bcopy\b/i,
    /\bshare\b/i
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

  function mergeSettings(rawSettings) {
    return { ...DEFAULT_SETTINGS, ...(rawSettings || {}) };
  }

  async function getCurrentSettings() {
    const data = await storageGet(["settings"]);
    return mergeSettings(data.settings);
  }

  async function getState() {
    const data = await storageGet(["settings", "profile", "stats"]);
    return {
      settings: mergeSettings(data.settings),
      profile: { ...DEFAULT_PROFILE, ...(data.profile || {}) },
      stats: { ...DEFAULT_STATS, ...(data.stats || {}) }
    };
  }

  function showCoachMessage(message, type, settings) {
    const duration = settings.overlayDurationMs || DEFAULT_SETTINGS.overlayDurationMs;

    if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
      window.AIDevCoachOverlay.show(message, type, duration);
      return;
    }

    console.log("AI Dev Coach:", message);
  }

  function detectPlatform() {
    const locationValue = window.location.href;
    return PLATFORM_CONFIG.find((platform) =>
      platform.matches.some((matcher) => matcher.test(locationValue))
    );
  }

  function isVisibleInput(element) {
    if (!(element instanceof HTMLElement)) {
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

  function findVisibleInputInScope(scope, platform) {
    if (!(scope instanceof Element)) {
      return null;
    }

    for (const selector of platform.inputSelectors) {
      const candidates = Array.from(scope.querySelectorAll(selector));
      const visible = candidates.find(
        (candidate) => candidate instanceof HTMLElement && isVisibleInput(candidate)
      );
      if (visible) {
        return visible;
      }
    }

    return null;
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
    const statsPromise = updatePromptStats(prompt);

    if (!settings.enableCoach || !settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      await statsPromise;
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

    messages.push({ type: "info", text: buildHabitTip(profile, analysis) });
    queueMessages(messages, settings);

    const { dependency } = await statsPromise;
    if (dependency >= settings.dependencyWarningThreshold) {
      showCoachMessage(
        `AI dependency is ${dependency}%. Try one manual debugging pass first.`,
        "warning",
        settings
      );
    }
  }

  function shouldTrackEnter(event) {
    return event.key === "Enter" && !event.shiftKey && !event.isComposing;
  }

  function isLikelySendButton(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.matches("button[type='submit'],input[type='submit']")) {
      return true;
    }

    const attributes = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("data-testid"),
      element.getAttribute("name"),
      element.id,
      element.textContent
    ]
      .filter(Boolean)
      .join(" ");

    if (!attributes) {
      return false;
    }

    if (NON_SEND_BUTTON_HINTS.some((pattern) => pattern.test(attributes))) {
      return false;
    }

    return SEND_BUTTON_HINTS.some((pattern) => pattern.test(attributes));
  }

  function resolvePromptInputFromTrigger(trigger, platform) {
    if (!(trigger instanceof HTMLElement)) {
      return null;
    }

    const form = trigger.closest("form");
    if (form) {
      const formInput = findVisibleInputInScope(form, platform);
      if (formInput) {
        return formInput;
      }
    }

    const composer = trigger.closest("[data-testid*='composer'],[class*='composer'],[class*='prompt']");
    if (composer) {
      const composerInput = findVisibleInputInScope(composer, platform);
      if (composerInput) {
        return composerInput;
      }
    }

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      isPlatformInput(platform, activeElement) &&
      isVisibleInput(activeElement)
    ) {
      return activeElement;
    }

    const inputs = findPromptInputs(platform);
    return inputs[0] || null;
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

  async function submitPromptFromInput(input) {
    const settings = await getCurrentSettings();
    if (!settings.enableCoach || !settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      return;
    }

    const prompt = readPrompt(input).trim();
    if (!prompt || shouldSkipPrompt(prompt)) {
      return;
    }

    await handlePrompt(prompt);
  }

  function attachFormListener(input) {
    const form = input.closest("form");
    if (!form || attachedForms.has(form)) {
      return;
    }

    form.addEventListener(
      "submit",
      () => {
        submitPromptFromInput(input).catch((error) => {
          console.error("AI Dev Coach form submission error", error);
        });
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

        submitPromptFromInput(input).catch((error) => {
          console.error("AI Dev Coach prompt submission error", error);
        });
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
    "click",
    (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const button = event.target.closest("button,[role='button'],input[type='submit'],input[type='button']");
      if (!(button instanceof HTMLElement) || !isLikelySendButton(button)) {
        return;
      }

      const platform = detectPlatform();
      if (!platform) {
        return;
      }

      const input = resolvePromptInputFromTrigger(button, platform);
      if (!input) {
        return;
      }

      submitPromptFromInput(input).catch((error) => {
        console.error("AI Dev Coach send-button submission error", error);
      });
    },
    true
  );

  document.addEventListener(
    "focusin",
    () => {
      scheduleScan();
    },
    true
  );

  scanAndAttach();
})();
