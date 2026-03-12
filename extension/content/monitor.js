(() => {
  const COACH_OWNED_SELECTOR = '[data-ai-coach-owned="true"]';
  const PROMPT_ANALYZED_EVENT = "ai-dev-coach:prompt-analyzed";
  const PLATFORM_INPUT_SELECTORS = [
    "textarea",
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]',
    '[contenteditable=""]',
    '[contenteditable]:not([contenteditable="false"])'
  ];

  const PLATFORM_CONFIG = [
    {
      name: "ChatGPT",
      matches: [/chatgpt\.com/i, /chat\.openai\.com/i],
      inputSelectors: PLATFORM_INPUT_SELECTORS
    },
    {
      name: "Claude",
      matches: [/claude\.ai/i],
      inputSelectors: PLATFORM_INPUT_SELECTORS
    },
    {
      name: "Gemini",
      matches: [/gemini\.google\.com/i],
      inputSelectors: PLATFORM_INPUT_SELECTORS
    },
    {
      name: "Grok",
      matches: [/grok\.com/i],
      inputSelectors: PLATFORM_INPUT_SELECTORS
    },
    {
      name: "DeepSeek",
      matches: [/chat\.deepseek\.com/i, /deepseek\.com/i],
      inputSelectors: PLATFORM_INPUT_SELECTORS
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
    overlayDurationMs: 9000
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
    fastAiCopies: 0,
    badPrompts: 0,
    shortcutPrompts: 0
  };

  const DEFAULT_RUNTIME_EVALUATION = {
    score: null,
    grade: "N/A",
    warnings: [],
    suggestions: [],
    hasShortcutIntent: false,
    hasIndependentAttempt: false,
    promptPreview: "",
    at: 0
  };

  const CONTEXT_ERROR_HINTS = [
    /\berror\b/i,
    /\bexception\b/i,
    /\btraceback\b/i,
    /\bstack\s*trace\b/i,
    /\bfailed?\b/i,
    /\bfailure\b/i,
    /\bcrash(ed)?\b/i,
    /\bbug\b/i,
    /l[ôo]i/i,
    /ngo[ạa]i\s*l[ệe]/i,
    /kh[ôo]ng\s+ch[ạa]y/i,
    /b[ịi]\s*l[ôo]i/i
  ];

  const CONTEXT_EXPECTED_HINTS = [
    /\bexpected\b/i,
    /\bshould\b/i,
    /\bintend(ed)?\b/i,
    /\btarget behavior\b/i,
    /mong\s*[đd]?[ợo]i/i,
    /k[ỳy]\s*v[ọo]ng/i,
    /\bmu[ốo]n\b/i,
    /[đd][aá]ng\s*l[ẽe]/i
  ];

  const CONTEXT_ACTUAL_HINTS = [
    /\bactual\b/i,
    /\bcurrently\b/i,
    /\binstead\b/i,
    /\bobserved\b/i,
    /\breturns?\b/i,
    /\bhappens?\b/i,
    /th[ựu]c\s*t[ếe]/i,
    /hi[ệe]n\s*t[ạa]i/i,
    /nh[ưu]ng/i,
    /\bv[ẫa]n\b/i
  ];

  const CONTEXT_ARTIFACT_HINTS = [
    /```/,
    /line\s*\d+/i,
    /[a-z0-9_./-]+\.[a-z0-9]+(:\d{1,5})?/i,
    /\bfile\b/i,
    /\bpath\b/i,
    /\bmodule\b/i,
    /\bclass\b/i,
    /\bfunction\b/i,
    /\bmethod\b/i,
    /\bendpoint\b/i,
    /\bsql\b/i,
    /\blog\b/i,
    /\brepo\b/i,
    /\bbranch\b/i,
    /\bcommit\b/i,
    /\bdiff\b/i,
    /\bpayload\b/i,
    /\brequest\b/i,
    /\bresponse\b/i,
    /t[ệe]p/i,
    /d[òo]ng\s*\d+/i,
    /h[àa]m/i,
    /nh[áa]nh/i,
    /[ảa]nh\s*(m[àa]n\s*h[ìi]nh)?/i
  ];

  const ATTEMPT_ACTION_HINTS = [
    /\bi tried\b/i,
    /\bi attempted\b/i,
    /\bi tested\b/i,
    /\bi changed\b/i,
    /\bi debugged\b/i,
    /\bi ran\b/i,
    /\bi checked\b/i,
    /\bi profiled\b/i,
    /[đd][aã]\s*th[ửu]/i,
    /\bt[ôo]i\s*th[ửu]\b/i,
    /\bem\s*th[ửu]\b/i,
    /[đd][aã]\s*ch[ạa]y/i,
    /[đd][aã]\s*ki[ểe]m\s*tra/i,
    /[đd][aã]\s*debug/i
  ];

  const ATTEMPT_RESULT_HINTS = [
    /\bit still\b/i,
    /\bstill fails?\b/i,
    /\bi got\b/i,
    /\bresult(ed)?\b/i,
    /\boutputs?\b/i,
    /\bthrows?\b/i,
    /\bnow\b/i,
    /k[ếe]t\s*qu[ảa]/i,
    /b[ịi]\s*l[ôo]i/i,
    /ra\s*l[ôo]i/i,
    /kh[ôo]ng\s*[đd][ổo]i/i,
    /\bv[ẫa]n\b/i
  ];

  const ATTEMPT_BLOCKER_HINTS = [
    /\bstuck\b/i,
    /\bblocked\b/i,
    /\bnot sure\b/i,
    /\bdon'?t understand\b/i,
    /\bcannot\b/i,
    /\bcan'?t\b/i,
    /\bunsure\b/i,
    /\bneed help\b/i,
    /\bb[íi]\b/i,
    /v[ưu][ớo]ng/i,
    /kh[ôo]ng\s*bi[ếe]t/i,
    /ch[ưu]a\s*hi[ểe]u/i,
    /kh[óo]\s*kh[ăa]n/i
  ];

  const ATTEMPT_NEGATIVE_HINTS = [
    /\bi (did not|didn'?t|have not|haven'?t) (try|attempt)\b/i,
    /\bi didn'?t do anything\b/i,
    /\bch[ưu]a\s*th[ửu]\b/i,
    /kh[ôo]ng\s*th[ửu]/i,
    /ch[ưu]a\s*l[aà]m\s*g[ìi]/i
  ];

  const SHORTCUT_HINTS = [
    /give me full code/i,
    /do it for me/i,
    /just give me answer/i,
    /no explanation/i,
    /copy and paste/i,
    /urgent.*fix/i,
    /vi[ếe]t.*full\s*code/i,
    /l[aà]m\s+h[ộo]\s*t[ôo]i/i,
    /cho\s*t[ôo]i\s*[đd][aá]p\s*[aá]n\s*ngay/i,
    /kh[ôo]ng\s*c[ầa]n\s*gi[ảa]i\s*th[íi]ch/i
  ];

  const TASK_SECTION_HINTS = [
    /task\s*:/i,
    /goal\s*:/i,
    /nhi[ệe]m\s*v[ụu]\s*:/i,
    /m[ụu]c\s*ti[êe]u\s*:/i,
    /y[êe]u\s*c[ầa]u\s*:/i
  ];

  const CONTEXT_SECTION_HINTS = [
    /context\s*:/i,
    /background\s*:/i,
    /b[ốo]i\s*c[ảa]nh\s*:/i,
    /ng[ữu]\s*c[ảa]nh\s*:/i
  ];

  const ATTEMPT_SECTION_HINTS = [
    /(what i (already )?tried|attempt)\s*:/i,
    /[đd][aã]\s*th[ửu]\s*:/i,
    /t[ôo]i\s*[đd][aã]\s*th[ửu]\s*:/i,
    /em\s*[đd][aã]\s*th[ửu]\s*:/i
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
  const DRAFT_PROMPT_TTL_MS = 15000;
  const LIVE_SCORE_DEBOUNCE_MS = 500;

  const attachedInputs = new WeakSet();
  const attachedForms = new WeakSet();
  let lastPromptSignature = "";
  let lastPromptAt = 0;
  let lastSendPulseAt = 0;
  let liveScoreTimer = null;
  let lastLiveSignature = "";
  let lastLiveAt = 0;
  let lastDraftPrompt = "";
  let lastDraftPromptAt = 0;
  let scanQueued = false;

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }

  function clean(value) {
    return (value || "").trim();
  }

  function rememberDraftPrompt(prompt) {
    const normalized = clean(prompt);
    if (!normalized) {
      return;
    }

    lastDraftPrompt = normalized;
    lastDraftPromptAt = Date.now();
  }

  function getRecentDraftPrompt() {
    if (!lastDraftPrompt) {
      return "";
    }

    if (Date.now() - lastDraftPromptAt > DRAFT_PROMPT_TTL_MS) {
      return "";
    }

    return lastDraftPrompt;
  }

  function buildPromptPreview(prompt) {
    return clean(prompt).replace(/\s+/g, " ").slice(0, 220);
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

  function isCoachOwnedElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    return !!element.closest(COACH_OWNED_SELECTOR);
  }

  function isVisibleInput(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (isCoachOwnedElement(element)) {
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

  function resolvePromptInputFromEventTarget(target, platform) {
    if (!(target instanceof Element)) {
      return null;
    }

    if (isCoachOwnedElement(target)) {
      return null;
    }

    for (const selector of platform.inputSelectors) {
      const candidate = target.closest(selector);
      if (candidate instanceof HTMLElement && isVisibleInput(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  function resolveActivePromptInput(platform) {
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

  function readPrompt(input) {
    if (!input) {
      return "";
    }

    if (input.tagName === "TEXTAREA") {
      return input.value || "";
    }

    return input.innerText || "";
  }

  function hasAnyHint(prompt, patterns) {
    return patterns.some((pattern) => pattern.test(prompt));
  }

  function hasShortcutIntent(prompt) {
    return hasAnyHint(prompt, SHORTCUT_HINTS);
  }

  function evaluateContextEvidence(prompt) {
    const hasErrorSignal = hasAnyHint(prompt, CONTEXT_ERROR_HINTS);
    const hasExpectedSignal = hasAnyHint(prompt, CONTEXT_EXPECTED_HINTS);
    const hasActualSignal = hasAnyHint(prompt, CONTEXT_ACTUAL_HINTS);
    const hasExpectedActualPair = hasExpectedSignal && hasActualSignal;
    const hasArtifactSignal = hasAnyHint(prompt, CONTEXT_ARTIFACT_HINTS);

    return {
      hasErrorSignal,
      hasExpectedActualPair,
      hasArtifactSignal
    };
  }

  function evaluateAttemptQuality(prompt) {
    const hasActionSignal = hasAnyHint(prompt, ATTEMPT_ACTION_HINTS);
    const hasResultSignal = hasAnyHint(prompt, ATTEMPT_RESULT_HINTS);
    const hasBlockerSignal = hasAnyHint(prompt, ATTEMPT_BLOCKER_HINTS);
    const hasNegativeAttemptSignal = hasAnyHint(prompt, ATTEMPT_NEGATIVE_HINTS);

    const hasIndependentAttempt =
      !hasNegativeAttemptSignal && hasActionSignal && hasResultSignal;

    return {
      hasActionSignal,
      hasResultSignal,
      hasBlockerSignal,
      hasNegativeAttemptSignal,
      hasIndependentAttempt
    };
  }

  function hasStructuredSections(prompt) {
    return (
      hasAnyHint(prompt, TASK_SECTION_HINTS) &&
      hasAnyHint(prompt, CONTEXT_SECTION_HINTS) &&
      hasAnyHint(prompt, ATTEMPT_SECTION_HINTS)
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

  function computeDependency(stats) {
    const total = stats.aiRequests + stats.manualAttempts;
    if (total === 0) {
      return 0;
    }
    return Math.round((stats.aiRequests / total) * 100);
  }

  function emitPromptAnalyzed(payload) {
    document.dispatchEvent(
      new CustomEvent(PROMPT_ANALYZED_EVENT, {
        detail: payload
      })
    );
  }

  function buildRuntimeEvaluation(prompt, analysis) {
    if (!analysis) {
      return {
        ...DEFAULT_RUNTIME_EVALUATION,
        promptPreview: buildPromptPreview(prompt),
        at: Date.now()
      };
    }

    return {
      score: analysis.score,
      grade: analysis.grade,
      warnings: analysis.warnings.slice(0, 4),
      suggestions: analysis.suggestions.slice(0, 4),
      hasShortcutIntent: analysis.hasShortcutIntent,
      hasIndependentAttempt: analysis.hasIndependentAttempt,
      promptPreview: buildPromptPreview(prompt),
      at: Date.now()
    };
  }

  function analyzePrompt(prompt, strictMode) {
    let score = 0;
    const warnings = [];
    const suggestions = [];

    if (prompt.length >= 25) {
      score += 10;
      if (prompt.length >= 80) {
        score += 6;
      }
    } else if (prompt.length >= 12) {
      score += 4;
      suggestions.push("Prompt is brief. Add more specifics before sending.");
    } else {
      warnings.push("Prompt is too short. Add context before asking AI.");
    }

    const contextEvidence = evaluateContextEvidence(prompt);
    const hasStrongContext =
      contextEvidence.hasErrorSignal &&
      contextEvidence.hasExpectedActualPair &&
      contextEvidence.hasArtifactSignal;

    if (hasStrongContext) {
      score += 28;
    } else {
      const evidenceCount =
        Number(contextEvidence.hasErrorSignal) +
        Number(contextEvidence.hasExpectedActualPair) +
        Number(contextEvidence.hasArtifactSignal);

      if (evidenceCount === 2) {
        score += 12;
      } else if (evidenceCount === 1) {
        score += 5;
      }

      if (!contextEvidence.hasErrorSignal) {
        suggestions.push("Add the concrete error/failure signal you see.");
      }
      if (!contextEvidence.hasExpectedActualPair) {
        suggestions.push("Add both expected result and actual result.");
      }
      if (!contextEvidence.hasArtifactSignal) {
        suggestions.push("Add artifacts: file path, line, snippet, log, or endpoint.");
      }
    }

    const attemptQuality = evaluateAttemptQuality(prompt);
    if (attemptQuality.hasNegativeAttemptSignal) {
      score -= 16;
      warnings.push("Prompt says no attempt was made. Try one step first, then ask AI.");
    }

    if (
      attemptQuality.hasActionSignal &&
      attemptQuality.hasResultSignal &&
      attemptQuality.hasBlockerSignal &&
      !attemptQuality.hasNegativeAttemptSignal
    ) {
      score += 26;
    } else if (
      attemptQuality.hasActionSignal &&
      attemptQuality.hasResultSignal &&
      !attemptQuality.hasNegativeAttemptSignal
    ) {
      score += 16;
      suggestions.push("Good progress. Add your current blocker to improve coaching quality.");
    } else if (attemptQuality.hasActionSignal && !attemptQuality.hasNegativeAttemptSignal) {
      score += 8;
      suggestions.push("Add result of your attempt and where you are blocked.");
    } else if (!attemptQuality.hasNegativeAttemptSignal) {
      suggestions.push("Add what you tried, what happened, and where you got stuck.");
    }

    const shortcutIntent = hasShortcutIntent(prompt);
    if (shortcutIntent) {
      warnings.push("Prompt asks for shortcuts. Ask for guidance first, not full copy-paste code.");
      score -= 20;
    } else {
      score += 8;
    }

    if (hasStructuredSections(prompt)) {
      score += 18;
    } else {
      suggestions.push("Use structured sections: Task/Context/Attempt (or Nhiem vu/Boi canh/Da thu).");
    }

    if (strictMode && shortcutIntent && !attemptQuality.hasIndependentAttempt) {
      score -= 14;
      warnings.push("Strict mode: include your attempt and blocker before asking for final code.");
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      grade: scoreGrade(score),
      warnings,
      suggestions,
      hasShortcutIntent: shortcutIntent,
      hasIndependentAttempt: attemptQuality.hasIndependentAttempt
    };
  }

  async function updatePromptStats(analysis) {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };

    stats.aiRequests += 1;
    if (analysis && analysis.hasIndependentAttempt) {
      stats.manualAttempts += 1;
    }
    if (analysis && analysis.score < 60) {
      stats.badPrompts += 1;
    }
    if (analysis && analysis.hasShortcutIntent) {
      stats.shortcutPrompts += 1;
    }

    await storageSet({ stats });

    return { stats, dependency: computeDependency(stats) };
  }

  async function updateSendOnlyStats() {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    stats.aiRequests += 1;
    await storageSet({ stats });
    return { stats, dependency: computeDependency(stats) };
  }

  async function persistRuntimeEvaluation(runtimeEvaluation) {
    await storageSet({ lastRuntimePromptEvaluation: runtimeEvaluation });
  }

  async function handleSendOnly() {
    if (shouldSkipSendPulse()) {
      return;
    }

    const { stats, dependency } = await updateSendOnlyStats();
    emitPromptAnalyzed({
      at: Date.now(),
      sendOnly: true,
      stats,
      dependency
    });
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
    const runtimeEvaluation = buildRuntimeEvaluation(prompt, analysis);
    const statsPromise = updatePromptStats(analysis);
    const runtimePromise = persistRuntimeEvaluation(runtimeEvaluation);

    if (!settings.enableCoach || !settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      const { stats, dependency } = await statsPromise;
      await runtimePromise;
      emitPromptAnalyzed({
        at: runtimeEvaluation.at,
        promptPreview: runtimeEvaluation.promptPreview,
        analysis: runtimeEvaluation,
        stats,
        dependency
      });
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

    const { stats, dependency } = await statsPromise;
    await runtimePromise;

    emitPromptAnalyzed({
      at: runtimeEvaluation.at,
      promptPreview: runtimeEvaluation.promptPreview,
      analysis: runtimeEvaluation,
      stats,
      dependency
    });

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

    if (isCoachOwnedElement(trigger)) {
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

  function shouldSkipSendPulse() {
    const now = Date.now();
    if (now - lastSendPulseAt < 900) {
      return true;
    }

    lastSendPulseAt = now;
    return false;
  }

  function buildLivePromptSignature(prompt) {
    return `${prompt.length}:${prompt.slice(0, 120)}:${prompt.slice(-60)}`;
  }

  function shouldSkipLivePrompt(prompt) {
    const signature = buildLivePromptSignature(prompt);
    const now = Date.now();

    if (signature === lastLiveSignature && now - lastLiveAt < 700) {
      return true;
    }

    lastLiveSignature = signature;
    lastLiveAt = now;
    return false;
  }

  async function runLivePromptScoring(promptSnapshot) {
    const prompt = clean(promptSnapshot || getRecentDraftPrompt());
    if (!prompt) {
      return;
    }

    if (shouldSkipLivePrompt(prompt)) {
      return;
    }

    const settings = await getCurrentSettings();
    if (!settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      return;
    }

    const analysis = analyzePrompt(prompt, settings.strictMode);
    const runtimeEvaluation = buildRuntimeEvaluation(prompt, analysis);

    emitPromptAnalyzed({
      at: runtimeEvaluation.at,
      promptPreview: runtimeEvaluation.promptPreview,
      analysis: runtimeEvaluation,
      draft: true
    });
  }

  function scheduleLivePromptScoring(input) {
    const promptSnapshot = readPrompt(input);
    rememberDraftPrompt(promptSnapshot);

    if (liveScoreTimer) {
      window.clearTimeout(liveScoreTimer);
    }

    liveScoreTimer = window.setTimeout(() => {
      liveScoreTimer = null;
      runLivePromptScoring(promptSnapshot).catch((error) => {
        console.error("AI Dev Coach live prompt scoring error", error);
      });
    }, LIVE_SCORE_DEBOUNCE_MS);
  }

  async function submitPromptFromInput(input, promptSnapshot = "") {
    const initialPrompt = clean(promptSnapshot || readPrompt(input));
    if (initialPrompt) {
      rememberDraftPrompt(initialPrompt);
    }
    const prompt = initialPrompt || getRecentDraftPrompt();

    const settings = await getCurrentSettings();
    if (!settings.promptListenerEnabled) {
      return;
    }

    if (!settings.readPromptContentEnabled) {
      await handleSendOnly();
      return;
    }

    if (!prompt) {
      await handleSendOnly();
      return;
    }

    if (shouldSkipPrompt(prompt)) {
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
      "input",
      () => {
        scheduleLivePromptScoring(input);
      },
      true
    );

    input.addEventListener(
      "keydown",
      (event) => {
        if (!shouldTrackEnter(event)) {
          return;
        }

        submitPromptFromInput(input, readPrompt(input)).catch((error) => {
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
    "keydown",
    (event) => {
      if (!shouldTrackEnter(event)) {
        return;
      }

      const platform = detectPlatform();
      if (!platform) {
        return;
      }

      const inputFromTarget = resolvePromptInputFromEventTarget(event.target, platform);
      const input = inputFromTarget || resolveActivePromptInput(platform);
      if (!input) {
        return;
      }

      submitPromptFromInput(input, readPrompt(input)).catch((error) => {
        console.error("AI Dev Coach global keydown submission error", error);
      });
    },
    true
  );

  document.addEventListener(
    "submit",
    (event) => {
      const platform = detectPlatform();
      if (!platform) {
        return;
      }

      const formTarget = event.target instanceof Element ? event.target : null;
      if (formTarget && isCoachOwnedElement(formTarget)) {
        return;
      }
      const scopedInput = formTarget ? findVisibleInputInScope(formTarget, platform) : null;
      const input = scopedInput || resolveActivePromptInput(platform);

      submitPromptFromInput(input, readPrompt(input)).catch((error) => {
        console.error("AI Dev Coach global form submission error", error);
      });
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (isCoachOwnedElement(event.target)) {
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

      const input = resolvePromptInputFromTrigger(button, platform) || resolveActivePromptInput(platform);
      if (!input) {
        return;
      }

      submitPromptFromInput(input, readPrompt(input)).catch((error) => {
        console.error("AI Dev Coach send-button submission error", error);
      });
    },
    true
  );

  document.addEventListener(
    "ai-dev-coach:quick-builder-submit",
    (event) => {
      const prompt = clean(event?.detail?.prompt || "");
      if (!prompt) {
        return;
      }

      const analyzeFromBuilder = async () => {
        const settings = await getCurrentSettings();
        if (!settings.promptListenerEnabled) {
          return;
        }

        if (!settings.readPromptContentEnabled) {
          await handleSendOnly();
          return;
        }

        if (shouldSkipPrompt(prompt)) {
          return;
        }

        await handlePrompt(prompt);
      };

      analyzeFromBuilder().catch((error) => {
        console.error("AI Dev Coach quick-builder submission error", error);
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
