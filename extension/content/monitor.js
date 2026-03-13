(() => {
  const COACH_OWNED_SELECTOR = '[data-ai-coach-owned="true"]';
  const PROMPT_ANALYZED_EVENT = "ai-dev-coach:prompt-analyzed";
  const PLATFORM_INPUT_SELECTORS = [
    "#prompt-textarea",
    "[data-testid='prompt-textarea']",
    "[data-testid*='prompt-textarea']",
    "[data-testid*='composer'] textarea",
    "[data-testid*='composer'] [contenteditable='true']",
    "[role='textbox'][contenteditable='true']",
    "div.ProseMirror[contenteditable='true']",
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
    roleKey: "",
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
    lintResults: [],
    lintSummary: null,
    secretFindings: [],
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
  const CONTEXT_EXCLUSION_HINTS = [
    /\bsearch\b/i,
    /\bfilter\b/i,
    /\bfind\b/i,
    /\bhistory\b/i,
    /\brename\b/i,
    /\btitle\b/i,
    /\bsetting(s)?\b/i,
    /\bmemory\b/i
  ];

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
  let cachedSettings = { ...DEFAULT_SETTINGS };
  let cachedProfile = { ...DEFAULT_PROFILE };
  let lastSecretBlockSignature = "";
  let lastSecretBlockAt = 0;
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

  function getSecretGuard() {
    if (
      window.AIDevCoachSecretGuard &&
      typeof window.AIDevCoachSecretGuard.inspectPromptForSecrets === "function"
    ) {
      return window.AIDevCoachSecretGuard;
    }

    return null;
  }

  function getPromptQualityEngine() {
    if (
      window.AIDevCoachPromptQualityEngine &&
      typeof window.AIDevCoachPromptQualityEngine.calculatePromptScore === "function"
    ) {
      return window.AIDevCoachPromptQualityEngine;
    }

    return null;
  }

  function getPromptLinter() {
    if (
      window.AIDevCoachPromptLinter &&
      typeof window.AIDevCoachPromptLinter.lintPrompt === "function"
    ) {
      return window.AIDevCoachPromptLinter;
    }

    return null;
  }

  function getLearningAnalytics() {
    if (
      window.AIDevCoachLearningAnalytics &&
      typeof window.AIDevCoachLearningAnalytics.trackPromptEvent === "function"
    ) {
      return window.AIDevCoachLearningAnalytics;
    }

    return null;
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

  function syncCachedSettings(nextSettings) {
    cachedSettings = mergeSettings(nextSettings);
  }

  function syncCachedProfile(nextProfile) {
    cachedProfile = { ...DEFAULT_PROFILE, ...(nextProfile || {}) };
  }

  async function getCurrentSettings() {
    const data = await storageGet(["settings"]);
    const settings = mergeSettings(data.settings);
    syncCachedSettings(settings);
    return settings;
  }

  async function getState() {
    const data = await storageGet(["settings", "profile", "stats"]);
    syncCachedSettings(data.settings);
    syncCachedProfile(data.profile);
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

  function writePrompt(input, text) {
    if (!(input instanceof HTMLElement)) {
      return false;
    }

    const value = text || "";

    if (input.tagName === "TEXTAREA") {
      input.focus();
      const prototype = window.HTMLTextAreaElement?.prototype;
      const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, "value") : null;
      if (descriptor && typeof descriptor.set === "function") {
        descriptor.set.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if (input.isContentEditable) {
      input.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      range.deleteContents();
      const textNode = document.createTextNode(value);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      input.dispatchEvent(
        new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" })
      );
      return true;
    }

    return false;
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

  function contextHintText(element) {
    if (!(element instanceof HTMLElement)) {
      return "";
    }

    return [
      element.id,
      element.getAttribute("name"),
      element.getAttribute("data-testid"),
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.className
    ]
      .filter(Boolean)
      .join(" ");
  }

  function isExcludedContextInput(element) {
    if (!(element instanceof HTMLElement)) {
      return true;
    }
    const context = contextHintText(element);
    return CONTEXT_EXCLUSION_HINTS.some((pattern) => pattern.test(context));
  }

  function findComposerScope(element) {
    if (!(element instanceof HTMLElement)) {
      return null;
    }

    return element.closest(
      "form,[data-testid*='composer'],[data-testid*='prompt'],[class*='composer'],[class*='prompt'],[class*='chat-input']"
    );
  }

  function hasNearbySendButton(element) {
    const scope = findComposerScope(element);
    if (!(scope instanceof Element)) {
      return false;
    }

    const candidates = Array.from(
      scope.querySelectorAll("button,[role='button'],input[type='submit'],input[type='button']")
    ).slice(0, 80);
    return candidates.some((candidate) => candidate instanceof HTMLElement && isLikelySendButton(candidate));
  }

  function scorePromptInputCandidate(element) {
    if (!(element instanceof HTMLElement) || !isVisibleInput(element) || isExcludedContextInput(element)) {
      return Number.NEGATIVE_INFINITY;
    }

    const context = contextHintText(element);
    const rect = element.getBoundingClientRect();
    let score = 0;

    if (/#prompt-textarea|prompt-textarea|composer|chat-input/i.test(context)) {
      score += 80;
    }
    if (findComposerScope(element)) {
      score += 36;
    }
    if (hasNearbySendButton(element)) {
      score += 30;
    }
    if (rect.bottom >= window.innerHeight * 0.45) {
      score += 16;
    }
    if (rect.width >= 200) {
      score += 10;
    }

    return score;
  }

  function pickBestPromptInput(candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return null;
    }

    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    candidates.forEach((candidate) => {
      const score = scorePromptInputCandidate(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    });

    return bestScore === Number.NEGATIVE_INFINITY ? null : best;
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
      const activeScore = scorePromptInputCandidate(activeElement);
      if (activeScore !== Number.NEGATIVE_INFINITY) {
        matches.push(activeElement);
        seen.add(activeElement);
      }
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
        if (scorePromptInputCandidate(candidate) === Number.NEGATIVE_INFINITY) {
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

    const candidates = [];
    for (const selector of platform.inputSelectors) {
      scope.querySelectorAll(selector).forEach((node) => {
        if (node instanceof HTMLElement && isVisibleInput(node)) {
          candidates.push(node);
        }
      });
    }

    return pickBestPromptInput(candidates);
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

    const scope = target.closest(
      "form,[data-testid*='composer'],[data-testid*='prompt'],[class*='composer'],[class*='prompt'],[class*='chat-input']"
    );
    const scoped = findVisibleInputInScope(scope, platform);
    if (scoped) {
      return scoped;
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
      const activeScore = scorePromptInputCandidate(activeElement);
      if (activeScore !== Number.NEGATIVE_INFINITY) {
        return activeElement;
      }
    }

    const inputs = findPromptInputs(platform);
    return pickBestPromptInput(inputs);
  }

  function readPrompt(input) {
    if (!input) {
      return "";
    }

    if (input.tagName === "TEXTAREA") {
      return (input.value || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    }

    const placeholder = clean(
      input.getAttribute("aria-placeholder") ||
        input.getAttribute("data-placeholder") ||
        input.getAttribute("placeholder")
    ).toLowerCase();
    const text = clean((input.innerText || input.textContent || "").replace(/[\u200B-\u200D\uFEFF]/g, ""));

    if (!text) {
      return "";
    }

    if (placeholder && text.toLowerCase() === placeholder) {
      return "";
    }

    return text;
  }

  function summarizeSecretFindings(findings) {
    const labels = Array.from(new Set((findings || []).map((finding) => finding.name))).slice(0, 3);
    if (labels.length === 0) {
      return "Sensitive data";
    }
    return labels.join(", ");
  }

  function buildSecretWarningText(findings, wasRedacted) {
    const prefix = wasRedacted
      ? "Possible secret detected. AI Dev Coach redacted sensitive values."
      : "Possible secret detected in this prompt.";
    return `${prefix} Review before sending to AI tools.`;
  }

  function buildSecretDetailText(findings) {
    return `Detected: ${summarizeSecretFindings(findings)}. Remove credentials or private material before sending.`;
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
    const engine = getPromptQualityEngine();
    if (engine && typeof engine.gradeFromScore === "function") {
      return engine.gradeFromScore(score);
    }

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
      lintResults: Array.isArray(analysis.lintResults) ? analysis.lintResults.slice(0, 4) : [],
      lintSummary: analysis.lintSummary || null,
      secretFindings: Array.isArray(analysis.secretFindings) ? analysis.secretFindings.slice(0, 4) : [],
      hasShortcutIntent: analysis.hasShortcutIntent,
      hasIndependentAttempt: analysis.hasIndependentAttempt,
      promptPreview: buildPromptPreview(prompt),
      at: Date.now()
    };
  }

  function analyzePrompt(prompt, strictMode, profile = DEFAULT_PROFILE) {
    const engine = getPromptQualityEngine();
    if (!engine) {
      return {
        score: 0,
        grade: "D",
        warnings: ["Prompt quality engine is unavailable."],
        suggestions: [],
        secretFindings: [],
        hasShortcutIntent: false,
        hasIndependentAttempt: false
      };
    }

    const analysis = engine.calculatePromptScore({
      prompt,
      strictMode,
      profile: {
        roleKey: clean(profile.roleKey || ""),
        role: clean(profile.role || ""),
        skill: clean(profile.skill || "")
      }
    });

    return {
      ...analysis,
      lintResults: [],
      lintSummary: null,
      secretFindings: []
    };
  }

  function appendUniqueMessages(target, messages) {
    messages.forEach((message) => {
      if (!message || target.includes(message)) {
        return;
      }
      target.push(message);
    });
  }

  function applyLintResultsToAnalysis(prompt, analysis, profile = DEFAULT_PROFILE, templateKey = "") {
    const linter = getPromptLinter();
    if (!linter || !analysis || !prompt) {
      return analysis;
    }

    const report = linter.lintPrompt({
      prompt,
      analysis,
      templateKey,
      profile: {
        roleKey: clean(profile.roleKey || ""),
        role: clean(profile.role || ""),
        skill: clean(profile.skill || "")
      }
    });

    const warnings = analysis.warnings.slice();
    const suggestions = analysis.suggestions.slice();

    appendUniqueMessages(
      warnings,
      report.failingResults
        .filter((result) => result.severity === "error" || result.severity === "warning")
        .map((result) => result.message)
    );

    appendUniqueMessages(
      suggestions,
      report.failingResults
        .filter((result) => result.severity !== "error")
        .map((result) => result.description)
    );

    return {
      ...analysis,
      warnings,
      suggestions,
      lintResults: report.results,
      lintSummary: report.summary
    };
  }

  function applySecretFindingsToAnalysis(prompt, analysis) {
    const secretGuard = getSecretGuard();
    if (!secretGuard || !prompt) {
      return analysis;
    }

    const secretScan = secretGuard.inspectPromptForSecrets(prompt);
    if (!secretScan.findings.length) {
      return analysis;
    }

    const warnings = analysis.warnings.slice();
    const suggestions = analysis.suggestions.slice();

    warnings.unshift(buildSecretWarningText(secretScan.findings, secretScan.redactedPrompt !== prompt));
    suggestions.unshift("Remove or redact credentials, tokens, and private material before sending.");

    const riskPenalty = Math.min(24, secretScan.findings.length * 8);
    const score = Math.max(0, analysis.score - riskPenalty);
    const nextRisk = Math.max(0, (analysis.risk || 0) - Math.min(riskPenalty, analysis.risk || 0));
    const nextBreakdown = Array.isArray(analysis.breakdown)
      ? analysis.breakdown.map((part) =>
          part.label === "Risk Guardrails"
            ? { ...part, score: nextRisk }
            : part
        )
      : analysis.breakdown;

    return {
      ...analysis,
      risk: nextRisk,
      total: score,
      score,
      grade: scoreGrade(score),
      warnings,
      suggestions,
      breakdown: nextBreakdown,
      secretFindings: secretScan.findings.map((finding) => ({
        name: finding.name,
        severity: finding.severity
      }))
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

  function countFailedLintChecks(analysis) {
    if (!analysis || !analysis.lintSummary) {
      return 0;
    }

    return Number.isFinite(analysis.lintSummary.failed)
      ? Math.max(0, Math.round(analysis.lintSummary.failed))
      : 0;
  }

  async function trackPromptAnalyticsEvent(prompt, analysis, dependency, profile, options = {}) {
    const learningAnalytics = getLearningAnalytics();
    if (!learningAnalytics) {
      return null;
    }

    const platform = detectPlatform();

    try {
      const nextState = await learningAnalytics.trackPromptEvent(chrome.storage.local, {
        prompt,
        source: clean(options.source) || "composer_submit",
        platform: clean(options.platform) || clean(platform?.name) || "Unknown",
        timestamp: Date.now(),
        score: analysis && Number.isFinite(analysis.score) ? analysis.score : null,
        grade: clean(analysis?.grade || ""),
        dependency,
        hasIndependentAttempt: !!analysis?.hasIndependentAttempt,
        hasShortcutIntent: !!analysis?.hasShortcutIntent,
        warningCount: Array.isArray(analysis?.warnings) ? analysis.warnings.length : 0,
        lintFailedCount: countFailedLintChecks(analysis),
        roleKey: clean(profile?.roleKey || ""),
        skillLevel: clean(profile?.skill || "")
      });

      return nextState && nextState.summary ? nextState.summary : null;
    } catch (error) {
      console.error("AI Dev Coach analytics tracking error", error);
      return null;
    }
  }

  async function handleSendOnly(options = {}) {
    if (shouldSkipSendPulse()) {
      return;
    }

    const { stats, dependency } = await updateSendOnlyStats();
    const analyticsSummary = await trackPromptAnalyticsEvent("", null, dependency, cachedProfile, {
      source: clean(options.source) || "composer_send_only"
    });

    emitPromptAnalyzed({
      at: Date.now(),
      sendOnly: true,
      stats,
      dependency,
      analyticsSummary
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

    if (normalizedRole.includes("manager")) {
      return "Manager mode: ask AI for options, risks, and a concrete decision recommendation.";
    }

    if (normalizedRole.includes("director")) {
      return "Director mode: ask AI for strategic options with KPI impact and dependency risk.";
    }

    if (normalizedSkill.includes("student")) {
      return "Student mode: ask AI for guided steps and one short exercise before final answers.";
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

  async function handlePrompt(prompt, options = {}) {
    if (!prompt || !prompt.trim()) {
      return;
    }

    const { settings, profile } = await getState();
    const analysis = applyLintResultsToAnalysis(
      prompt,
      applySecretFindingsToAnalysis(
        prompt,
        analyzePrompt(prompt, settings.strictMode, profile)
      ),
      profile
    );
    const runtimeEvaluation = buildRuntimeEvaluation(prompt, analysis);
    const statsPromise = updatePromptStats(analysis);
    const runtimePromise = persistRuntimeEvaluation(runtimeEvaluation);

    if (!settings.enableCoach || !settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      const { stats, dependency } = await statsPromise;
      await runtimePromise;
      const analyticsSummary = await trackPromptAnalyticsEvent(prompt, analysis, dependency, profile, {
        source: clean(options.source) || "composer_submit"
      });
      emitPromptAnalyzed({
        at: runtimeEvaluation.at,
        promptPreview: runtimeEvaluation.promptPreview,
        analysis: runtimeEvaluation,
        stats,
        dependency,
        analyticsSummary
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
    const analyticsSummary = await trackPromptAnalyticsEvent(prompt, analysis, dependency, profile, {
      source: clean(options.source) || "composer_submit"
    });

    emitPromptAnalyzed({
      at: runtimeEvaluation.at,
      promptPreview: runtimeEvaluation.promptPreview,
      analysis: runtimeEvaluation,
      stats,
      dependency,
      analyticsSummary
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
    return pickBestPromptInput(inputs);
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

  function buildPromptSubmissionContext(input, promptSnapshot = "") {
    const initialPrompt = clean(promptSnapshot || readPrompt(input));
    if (initialPrompt) {
      rememberDraftPrompt(initialPrompt);
    }

    return {
      settings: cachedSettings,
      prompt: initialPrompt || getRecentDraftPrompt()
    };
  }

  function rememberSecretBlock(prompt) {
    lastSecretBlockSignature = buildPromptSignature(prompt);
    lastSecretBlockAt = Date.now();
  }

  function wasRecentlyBlockedBySecret(prompt) {
    if (!prompt) {
      return false;
    }

    return (
      buildPromptSignature(prompt) === lastSecretBlockSignature &&
      Date.now() - lastSecretBlockAt < 2000
    );
  }

  function blockNativeSubmission(event) {
    if (!event) {
      return;
    }

    if (typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    if (typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  }

  function maybeBlockSecretSubmission(event, input, submissionContext) {
    const prompt = submissionContext?.prompt || "";
    const settings = submissionContext?.settings || cachedSettings;

    if (!settings.promptListenerEnabled || !settings.readPromptContentEnabled || !prompt) {
      return false;
    }

    const secretGuard = getSecretGuard();
    if (!secretGuard) {
      return false;
    }

    const secretScan = secretGuard.inspectPromptForSecrets(prompt);
    if (!secretScan.findings.length) {
      return false;
    }

    blockNativeSubmission(event);

    const redactedPrompt = secretScan.redactedPrompt || prompt;
    const wasRedacted = redactedPrompt !== prompt;

    if (wasRedacted && input) {
      writePrompt(input, redactedPrompt);
    }

    rememberDraftPrompt(redactedPrompt);
    rememberSecretBlock(prompt);

    const analysis = applyLintResultsToAnalysis(
      redactedPrompt,
      applySecretFindingsToAnalysis(
        redactedPrompt,
        analyzePrompt(redactedPrompt, settings.strictMode, cachedProfile)
      ),
      cachedProfile
    );
    const runtimeEvaluation = buildRuntimeEvaluation(redactedPrompt, analysis);

    persistRuntimeEvaluation(runtimeEvaluation).catch((error) => {
      console.error("AI Dev Coach secret runtime persistence error", error);
    });

    emitPromptAnalyzed({
      at: runtimeEvaluation.at,
      promptPreview: runtimeEvaluation.promptPreview,
      analysis: runtimeEvaluation,
      draft: true
    });

    showCoachMessage(buildSecretWarningText(secretScan.findings, wasRedacted), "warning", settings);
    showCoachMessage(buildSecretDetailText(secretScan.findings), "info", settings);

    if (wasRedacted) {
      showCoachMessage("The chat input was redacted for you. Review it, then send again.", "success", settings);
    }

    return true;
  }

  async function runLivePromptScoring(promptSnapshot) {
    const prompt = clean(promptSnapshot || getRecentDraftPrompt());
    if (!prompt) {
      return;
    }

    if (shouldSkipLivePrompt(prompt)) {
      return;
    }

    const { settings, profile } = await getState();
    if (!settings.promptListenerEnabled || !settings.readPromptContentEnabled) {
      return;
    }

    const analysis = applyLintResultsToAnalysis(
      prompt,
      applySecretFindingsToAnalysis(
        prompt,
        analyzePrompt(prompt, settings.strictMode, profile)
      ),
      profile
    );
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

  async function submitPromptFromInput(input, promptSnapshotOrContext = "") {
    const submissionContext =
      promptSnapshotOrContext &&
      typeof promptSnapshotOrContext === "object" &&
      Object.prototype.hasOwnProperty.call(promptSnapshotOrContext, "settings")
        ? promptSnapshotOrContext
        : buildPromptSubmissionContext(input, promptSnapshotOrContext);

    const settings = submissionContext.settings || (await getCurrentSettings());
    const prompt = submissionContext.prompt || "";

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
      (event) => {
        const submissionContext = buildPromptSubmissionContext(input, readPrompt(input));
        if (maybeBlockSecretSubmission(event, input, submissionContext)) {
          return;
        }

        submitPromptFromInput(input, submissionContext).catch((error) => {
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

        const submissionContext = buildPromptSubmissionContext(input, readPrompt(input));
        if (maybeBlockSecretSubmission(event, input, submissionContext)) {
          return;
        }

        submitPromptFromInput(input, submissionContext).catch((error) => {
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

      const submissionContext = buildPromptSubmissionContext(input, readPrompt(input));
      if (maybeBlockSecretSubmission(event, input, submissionContext)) {
        return;
      }

      submitPromptFromInput(input, submissionContext).catch((error) => {
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

      const submissionContext = buildPromptSubmissionContext(input, readPrompt(input));
      if (maybeBlockSecretSubmission(event, input, submissionContext)) {
        return;
      }

      submitPromptFromInput(input, submissionContext).catch((error) => {
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

      const submissionContext = buildPromptSubmissionContext(input, readPrompt(input));
      if (maybeBlockSecretSubmission(event, input, submissionContext)) {
        return;
      }

      submitPromptFromInput(input, submissionContext).catch((error) => {
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
      if (wasRecentlyBlockedBySecret(prompt)) {
        return;
      }

      const analyzeFromBuilder = async () => {
        const settings = await getCurrentSettings();
        if (!settings.promptListenerEnabled) {
          return;
        }

        if (!settings.readPromptContentEnabled) {
          await handleSendOnly({ source: "quick_builder_send_only" });
          return;
        }

        if (maybeBlockSecretSubmission(null, null, { settings, prompt })) {
          return;
        }

        if (shouldSkipPrompt(prompt)) {
          return;
        }

        await handlePrompt(prompt, { source: "quick_builder" });
      };

      analyzeFromBuilder().catch((error) => {
        console.error("AI Dev Coach quick-builder submission error", error);
      });
    },
    true
  );

  getCurrentSettings().catch((error) => {
    console.error("AI Dev Coach settings hydration error", error);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.settings) {
      return;
    }

    syncCachedSettings(changes.settings.newValue);
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
