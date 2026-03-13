(() => {
  const PANEL_ID = "ai-dev-coach-builder-panel";
  const BUTTON_ID = "ai-dev-coach-builder-launcher";
  const COACH_OWNED_SELECTOR = '[data-ai-coach-owned="true"]';
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

  const DEFAULT_PROFILE = {
    role: "",
    roleKey: "",
    skill: "",
    habitGoals: ""
  };

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

  const DEFAULT_TEMPLATE = "debugging";
  const REQUIRED_FIELDS = ["task", "context", "attempt"];
  const DEFAULT_STATUS_MESSAGE = "Tip: press Ctrl/Cmd + O while focused in the AI chat to open this builder.";
  const INLINE_SUGGESTION_LIMIT = 5;
  const INLINE_SUGGESTION_MINIMUM = 3;
  const INLINE_SUGGESTION_DEBOUNCE_MS = 300;

  const TEMPLATES = {
    debugging: {
      label: "Debugging Prompt",
      hint: "Diagnose runtime errors, broken logic, and failing tests.",
      contextPlaceholder: "Error text, stack trace, file path, expected vs actual behavior",
      attemptPlaceholder: "What you already tried, hypotheses, and what changed",
      intro: "You are my debugging mentor.",
      defaultGoal: "Debug independently before asking for final code",
      defaultConstraints: "None",
      defaultAcceptance: "Confirm root cause, fix, and regression checks",
      taskLabel: "Debugging goal",
      responseRules: [
        "1) Start with diagnosis and probable causes.",
        "2) Suggest one minimal next check.",
        "3) Provide patch guidance only after reasoning.",
        "4) End with verification steps."
      ]
    },
    code_review: {
      label: "Code Review Prompt",
      hint: "Get structured review findings with impact and fix direction.",
      contextPlaceholder: "PR summary, changed files, risks, known constraints",
      attemptPlaceholder: "Your self-review findings so far",
      intro: "Act as a pragmatic senior reviewer and coach.",
      defaultGoal: "Improve code quality and review judgment",
      defaultConstraints: "None",
      defaultAcceptance: "Clear prioritized findings with test suggestions",
      taskLabel: "Review goal",
      responseRules: [
        "1) List findings by severity.",
        "2) Explain impact and fix direction.",
        "3) Include missing tests and edge cases.",
        "4) End with one learning takeaway."
      ]
    },
    system_design: {
      label: "System Design Prompt",
      hint: "Design architecture with tradeoffs, reliability, and scale.",
      contextPlaceholder: "Users, traffic profile, constraints, current architecture",
      attemptPlaceholder: "Your proposed architecture and open questions",
      intro: "Act as a staff engineer helping with system design.",
      defaultGoal: "Reason with tradeoffs before implementation",
      defaultConstraints: "Latency, cost, reliability, and team bandwidth",
      defaultAcceptance: "Architecture, tradeoffs, and rollout plan",
      taskLabel: "Design problem",
      responseRules: [
        "1) Clarify functional and non-functional requirements.",
        "2) Propose architecture with tradeoffs.",
        "3) Cover data model, scaling, failure handling.",
        "4) Provide phased rollout and risk mitigations."
      ]
    },
    refactoring: {
      label: "Refactoring Prompt",
      hint: "Improve structure and maintainability without behavior changes.",
      contextPlaceholder: "Current module pain points, code smells, boundaries",
      attemptPlaceholder: "Refactor directions you considered and blockers",
      intro: "Act as a refactoring coach.",
      defaultGoal: "Improve design while preserving behavior",
      defaultConstraints: "No functional regressions, limited time",
      defaultAcceptance: "Cleaner structure with tests proving unchanged behavior",
      taskLabel: "Refactoring target",
      responseRules: [
        "1) Identify core code smells first.",
        "2) Provide low-risk refactor sequence.",
        "3) Keep behavior stable and testable.",
        "4) Explain before/after design rationale."
      ]
    },
    performance_optimization: {
      label: "Performance Optimization Prompt",
      hint: "Optimize bottlenecks with metrics and measurable impact.",
      contextPlaceholder: "Current latency/CPU/memory metrics and bottleneck hints",
      attemptPlaceholder: "What profiling or measurement you already ran",
      intro: "Act as a performance optimization mentor.",
      defaultGoal: "Measure first, optimize second",
      defaultConstraints: "Throughput, latency, memory, cost",
      defaultAcceptance: "Measurable performance improvement with stable correctness",
      taskLabel: "Performance goal",
      responseRules: [
        "1) Validate baseline and bottleneck hypothesis.",
        "2) Propose top optimizations by expected impact.",
        "3) Explain tradeoffs and regression risks.",
        "4) Provide benchmark and rollback strategy."
      ]
    },
    learning: {
      label: "Learning Prompt",
      hint: "Learn concepts step-by-step without over-relying on final answers.",
      contextPlaceholder: "Topic background, confusion points, known concepts",
      attemptPlaceholder: "Your current understanding and where you get stuck",
      intro: "Teach me like a technical mentor.",
      defaultGoal: "Strengthen independent reasoning",
      defaultConstraints: "Use concise examples and avoid jargon overload",
      defaultAcceptance: "Clear understanding, practice task, and recap",
      taskLabel: "Learning goal",
      responseRules: [
        "1) Ask one guiding question first.",
        "2) Explain in progressive steps.",
        "3) Give one short exercise.",
        "4) End with recap and common mistakes."
      ]
    }
  };

  const state = {
    panelOpen: false,
    selectedTemplate: DEFAULT_TEMPLATE,
    selectedRoleKey: "software_engineer",
    profile: { ...DEFAULT_PROFILE },
    refs: null,
    layoutTicking: false,
    inlineSuggestions: {
      library: null,
      storageState: null,
      activeInput: null,
      debounceId: 0,
      items: [],
      activeIndex: 0,
      selectedPromptText: "",
      open: false,
      handlers: null
    }
  };

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }

  function clean(value) {
    return (value || "").trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getRoleCoaching() {
    const roleCoaching = window.AIDevCoachRoleCoaching;
    if (!roleCoaching || typeof roleCoaching.getRoleProfile !== "function") {
      throw new Error("Role coaching module is unavailable.");
    }
    return roleCoaching;
  }

  function getPromptMarketplace() {
    const marketplace = window.AIDevCoachPromptMarketplace;
    if (!marketplace || typeof marketplace.getPromptLibrary !== "function") {
      throw new Error("Prompt marketplace module is unavailable.");
    }
    return marketplace;
  }

  function getPromptSuggestionEngine() {
    const engine = window.AIDevCoachPromptSuggestionEngine;
    if (!engine || typeof engine.getInlinePromptSuggestions !== "function") {
      throw new Error("Prompt suggestion engine is unavailable.");
    }
    return engine;
  }

  function normalizeLevel(value) {
    return getRoleCoaching().normalizeLevel(value);
  }

  function isStudentLevel(value) {
    return getRoleCoaching().isStudentLevel(value);
  }

  function hasLegacyStudentRole(profile = {}) {
    return getRoleCoaching().hasLegacyStudentRole(profile);
  }

  function getRecommendedTemplateForProfile(profile, roleKey) {
    return getRoleCoaching().getRecommendedTemplateForProfile(
      {
        ...(profile || {}),
        roleKey: roleKey || profile?.roleKey || ""
      },
      {
        templates: TEMPLATES,
        defaultTemplate: DEFAULT_TEMPLATE
      }
    );
  }

  function normalizeRoleKey(value) {
    return getRoleCoaching().normalizeRoleKey(value);
  }

  function resolveRoleKey(rawProfile = {}) {
    return getRoleCoaching().resolveRoleKey(rawProfile);
  }

  function getRoleProfile(rawProfile = {}) {
    return getRoleCoaching().getRoleProfile(rawProfile);
  }

  function buildRoleHeaderLines(roleProfile) {
    return getRoleCoaching().buildRoleHeaderLines(roleProfile);
  }

  function isCoachOwnedElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    return !!element.closest(COACH_OWNED_SELECTOR);
  }

  function detectPlatform() {
    const href = window.location.href;
    return PLATFORM_CONFIG.find((platform) =>
      platform.matches.some((matcher) => matcher.test(href))
    );
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

  function findPromptInput(platform) {
    if (!platform) {
      return null;
    }

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      !isCoachOwnedElement(activeElement) &&
      platform.inputSelectors.some((selector) => activeElement.matches(selector)) &&
      isVisibleInput(activeElement)
    ) {
      const activeScore = scorePromptInputCandidate(activeElement);
      if (activeScore !== Number.NEGATIVE_INFINITY) {
        return activeElement;
      }
    }

    const matches = [];
    const seen = new Set();

    for (const selector of platform.inputSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      candidates.forEach((candidate) => {
        if (!(candidate instanceof HTMLElement) || seen.has(candidate) || !isVisibleInput(candidate)) {
          return;
        }
        seen.add(candidate);
        matches.push(candidate);
      });
    }

    const best = pickBestPromptInput(matches);
    if (best) {
      return best;
    }

    for (const candidate of matches) {
      if (!isExcludedContextInput(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  function resolvePromptInputFromElement(platform, element) {
    if (!platform || !(element instanceof Element)) {
      return null;
    }

    if (isCoachOwnedElement(element)) {
      return null;
    }

    for (const selector of platform.inputSelectors) {
      const candidate = element.closest(selector);
      if (candidate instanceof HTMLElement && isVisibleInput(candidate) && !isCoachOwnedElement(candidate)) {
        return candidate;
      }
    }

    const scoped = findComposerScope(element instanceof HTMLElement ? element : null);
    if (scoped instanceof Element) {
      const candidates = [];
      for (const selector of platform.inputSelectors) {
        scoped.querySelectorAll(selector).forEach((node) => {
          if (node instanceof HTMLElement && isVisibleInput(node) && !isCoachOwnedElement(node)) {
            candidates.push(node);
          }
        });
      }
      return pickBestPromptInput(candidates);
    }

    return null;
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

  function findSendButton(input) {
    if (!(input instanceof HTMLElement)) {
      return null;
    }

    const containers = [
      input.closest("form"),
      input.closest("[data-testid*='composer']"),
      input.closest("[class*='composer']"),
      input.closest("[class*='prompt']"),
      document
    ].filter(Boolean);

    for (const container of containers) {
      const candidates = Array.from(
        container.querySelectorAll("button,[role='button'],input[type='submit'],input[type='button']")
      ).slice(0, 120);

      const button = candidates.find((candidate) => {
        if (!(candidate instanceof HTMLElement)) {
          return false;
        }

        if (isCoachOwnedElement(candidate)) {
          return false;
        }

        if (!isVisibleInput(candidate)) {
          return false;
        }

        if (
          candidate.hasAttribute("disabled") ||
          candidate.getAttribute("aria-disabled") === "true"
        ) {
          return false;
        }

        return isLikelySendButton(candidate);
      });

      if (button) {
        return button;
      }
    }

    return null;
  }

  function setPromptInputValue(input, text) {
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
      input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      return true;
    }

    return false;
  }

  function readPromptInputValue(input) {
    if (!(input instanceof HTMLElement)) {
      return "";
    }

    if (input.tagName === "TEXTAREA") {
      return clean(input.value);
    }

    if (input.isContentEditable) {
      return clean((input.innerText || input.textContent || "").replace(/\u00a0/g, " "));
    }

    return "";
  }

  async function attemptSend(input) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const sendButton = findSendButton(input);
      if (sendButton) {
        sendButton.click();
        return true;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }

    if (!(input instanceof HTMLElement)) {
      return false;
    }

    const keyInit = {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    };

    input.dispatchEvent(new KeyboardEvent("keydown", keyInit));
    input.dispatchEvent(new KeyboardEvent("keyup", keyInit));
    input.dispatchEvent(new KeyboardEvent("keypress", keyInit));
    return true;
  }

  function emitQuickBuilderSendEvent(prompt) {
    if (!prompt) {
      return;
    }

    document.dispatchEvent(
      new CustomEvent("ai-dev-coach:quick-builder-submit", {
        detail: { prompt }
      })
    );
  }

  function showOverlayMessage(message, type = "info") {
    try {
      if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
        window.AIDevCoachOverlay.show(message, type);
      }
    } catch (error) {
      console.debug("AI Dev Coach overlay message skipped", error);
    }
  }

  function normalizeResponseRule(rule, index) {
    const normalized = clean(rule).replace(/^\d+[.)]\s*/, "");
    return `${index + 1}. ${normalized}`;
  }

  function buildPrettyPrompt({
    intro,
    profile,
    taskLabel,
    task,
    context,
    attempt,
    constraints,
    acceptance,
    rules,
    defaultGoal,
    defaultConstraints,
    defaultAcceptance
  }) {
    return [
      intro,
      "",
      "PROFILE",
      `- Role: ${profile.role || "Not provided"}`,
      `- Level: ${profile.skill || "Not provided"}`,
      `- Habit goal: ${profile.habitGoals || defaultGoal}`,
      "",
      "TASK",
      `${taskLabel}: ${task}`,
      "",
      "CONTEXT",
      context,
      "",
      "WHAT I TRIED",
      attempt,
      "",
      "CONSTRAINTS",
      constraints || defaultConstraints,
      "",
      "ACCEPTANCE CRITERIA",
      acceptance || defaultAcceptance,
      "",
      "HOW TO RESPOND",
      ...rules.map((rule, index) => normalizeResponseRule(rule, index))
    ].join("\n");
  }

  function buildPrompt(templateKey, profile, fields, roleProfile) {
    const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    const taskLabel = template.taskLabel || "Task";
    const basePrompt = buildPrettyPrompt({
      intro: template.intro,
      profile,
      taskLabel,
      task: fields.task,
      context: fields.context,
      attempt: fields.attempt,
      constraints: fields.constraints,
      acceptance: fields.acceptance,
      rules: template.responseRules || [],
      defaultGoal: template.defaultGoal,
      defaultConstraints: template.defaultConstraints,
      defaultAcceptance: template.defaultAcceptance
    });

    return [...buildRoleHeaderLines(roleProfile), "", basePrompt].join("\n");
  }

  function setStatus(message, ok) {
    if (!state.refs) {
      return;
    }

    const status = state.refs.status;
    status.textContent = message || DEFAULT_STATUS_MESSAGE;
    status.classList.remove("ai-coach-builder__status--ok", "ai-coach-builder__status--error");

    if (!message) {
      return;
    }

    status.classList.add(ok ? "ai-coach-builder__status--ok" : "ai-coach-builder__status--error");
  }

  function renderTemplateOptions() {
    if (!state.refs) {
      return;
    }

    const select = state.refs.templateSelect;
    select.innerHTML = "";
    const recommendedKey = getRecommendedTemplateForProfile(state.profile, state.selectedRoleKey);

    Object.entries(TEMPLATES).forEach(([key, template]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = key === recommendedKey ? `${template.label} (Recommended)` : template.label;
      option.selected = key === state.selectedTemplate;
      select.appendChild(option);
    });
  }

  function applyTemplateUI(templateKey) {
    if (!state.refs) {
      return;
    }

    const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    const roleOption = getRoleProfile({
      ...state.profile,
      roleKey: state.selectedRoleKey
    });
    const roleLabel = roleOption.label;
    const recommendedKey = getRecommendedTemplateForProfile(state.profile, state.selectedRoleKey);
    const recommendedTemplate = TEMPLATES[recommendedKey];
    state.refs.templateHint.textContent = template.hint;
    if (recommendedTemplate) {
      const recommendationNote =
        templateKey === recommendedKey
          ? `Recommended template applied: ${recommendedTemplate.label}.`
          : `Recommended template for this role: ${recommendedTemplate.label}.`;
      state.refs.templateHint.textContent = `${template.hint} ${recommendationNote}`;
    }
    state.refs.roleHint.textContent = `Role mode: ${roleLabel}. ${roleOption.builderHint}`;
    if (roleOption.specializationLabel) {
      state.refs.roleHint.textContent += ` Specialization: ${roleOption.specializationLabel}.`;
    }
    if (isStudentLevel(state.profile.skill)) {
      state.refs.roleHint.textContent += " Level mode: Student learning flow is active.";
    }
    state.refs.contextInput.placeholder = `${template.contextPlaceholder}. ${roleOption.contextHint}.`;
    state.refs.attemptInput.placeholder = `${template.attemptPlaceholder}. ${roleOption.attemptHint}.`;
    const coachingSnapshot = getRoleCoaching().buildRoleCoachingSnapshot({
      ...state.profile,
      roleKey: state.selectedRoleKey,
      role: roleLabel
    });
    const example = coachingSnapshot.examples[0];
    state.refs.roleCoachHint.textContent = example
      ? `Example ask: ${example}`
      : coachingSnapshot.warningHint || "";
  }

  function readFields() {
    return {
      task: clean(state.refs.taskInput.value),
      context: clean(state.refs.contextInput.value),
      attempt: clean(state.refs.attemptInput.value),
      constraints: clean(state.refs.constraintsInput.value),
      acceptance: clean(state.refs.acceptanceInput.value)
    };
  }

  function validateFields(fields) {
    return REQUIRED_FIELDS.filter((key) => !fields[key]);
  }

  async function loadProfileAndTemplate() {
    const data = await storageGet(["profile", "selectedTemplate", "quickBuilderRoleKey"]);
    const migratedProfile = getRoleCoaching().migrateLegacyStudentProfile({
      ...DEFAULT_PROFILE,
      ...(data.profile || {})
    });
    state.profile = migratedProfile.profile;
    if (migratedProfile.migrated) {
      storageSet({ profile: state.profile }).catch(() => {
        console.warn("AI Dev Coach quick builder legacy profile migration skipped");
      });
    }
    const profileHasExplicitRole = !!(clean(state.profile.role) || clean(state.profile.roleKey));
    const roleOptions = getRoleCoaching().JOB_ROLE_OPTIONS;
    state.selectedRoleKey = profileHasExplicitRole
      ? resolveRoleKey(state.profile)
      : roleOptions[data.quickBuilderRoleKey]
        ? data.quickBuilderRoleKey
        : resolveRoleKey(state.profile);
    const recommendedTemplate = getRecommendedTemplateForProfile(state.profile, state.selectedRoleKey);
    state.selectedTemplate = TEMPLATES[data.selectedTemplate]
      ? data.selectedTemplate
      : recommendedTemplate;
    const roleProfile = getRoleProfile({
      ...state.profile,
      roleKey: state.selectedRoleKey
    });
    state.profile.roleKey = state.selectedRoleKey;
    state.profile.role = roleProfile.label;

    if (state.refs) {
      renderTemplateOptions();
      state.refs.templateSelect.value = state.selectedTemplate;
      state.refs.roleSelect.value = state.selectedRoleKey;
      applyTemplateUI(state.selectedTemplate);
    }
  }

  async function handleBuildAndRun(sendAfterBuild) {
    const platform = detectPlatform();
    const promptInput = findPromptInput(platform);

    if (!platform || !promptInput) {
      setStatus("Cannot find AI prompt input on this page.", false);
      return;
    }

    const fields = readFields();
    const missing = validateFields(fields);
    if (missing.length > 0) {
      setStatus(`Required: ${missing.join(", ")}.`, false);
      return;
    }

    const roleOption = getRoleProfile({
      ...state.profile,
      roleKey: state.selectedRoleKey
    });
    const profile = {
      ...state.profile,
      roleKey: state.selectedRoleKey,
      role: roleOption.label
    };
    const roleProfile = getRoleProfile(profile);
    const prompt = buildPrompt(state.selectedTemplate, profile, fields, roleProfile);
    const inserted = setPromptInputValue(promptInput, prompt);
    if (!inserted) {
      setStatus("Failed to write prompt into AI input.", false);
      return;
    }

    if (sendAfterBuild) {
      const sent = await attemptSend(promptInput);
      if (sent) {
        emitQuickBuilderSendEvent(prompt);
      }
      setStatus(
        sent ? `Prompt built and sent to ${platform.name}.` : `Prompt built for ${platform.name}. Send it manually.`,
        sent
      );
      return;
    }

    setStatus(`Prompt built and inserted into ${platform.name}.`, true);
  }

  async function runMarketplacePrompt(prompt, action) {
    const platform = detectPlatform();
    const promptInput = findPromptInput(platform);
    const normalizedPrompt = clean(prompt);
    const mode = clean(action).toLowerCase() === "send" ? "send" : "insert";

    if (!platform || !promptInput) {
      return {
        ok: false,
        error: "Cannot find AI prompt input on this page."
      };
    }

    if (!normalizedPrompt) {
      return {
        ok: false,
        error: "Prompt text is empty."
      };
    }

    const inserted = setPromptInputValue(promptInput, normalizedPrompt);
    if (!inserted) {
      return {
        ok: false,
        error: "Failed to write prompt into AI input."
      };
    }

    if (mode === "send") {
      const sent = await attemptSend(promptInput);
      if (sent) {
        emitQuickBuilderSendEvent(normalizedPrompt);
      }
      const message = sent
        ? `Marketplace prompt sent to ${platform.name}.`
        : `Marketplace prompt inserted into ${platform.name}. Send it manually.`;
      showOverlayMessage(message, sent ? "success" : "warning");
      return {
        ok: true,
        action: sent ? "send" : "insert",
        platform: platform.name,
        message
      };
    }

    const message = `Marketplace prompt inserted into ${platform.name}.`;
    showOverlayMessage(message, "success");
    return {
      ok: true,
      action: "insert",
      platform: platform.name,
      message
    };
  }

  function hideInlineSuggestions() {
    if (!state.refs?.suggestionPanel || !state.refs?.suggestionList) {
      return;
    }

    state.inlineSuggestions.open = false;
    state.inlineSuggestions.items = [];
    state.inlineSuggestions.activeIndex = 0;
    state.refs.suggestionPanel.classList.add("ai-coach-builder__hidden");
    state.refs.suggestionList.innerHTML = "";
    if (state.refs.suggestionMeta) {
      state.refs.suggestionMeta.textContent = "";
    }
  }

  function positionInlineSuggestions() {
    if (!state.refs?.suggestionPanel || !state.inlineSuggestions.open) {
      return;
    }

    const input = state.inlineSuggestions.activeInput;
    if (!(input instanceof HTMLElement) || !document.contains(input)) {
      hideInlineSuggestions();
      return;
    }

    const rect = input.getBoundingClientRect();
    const maxWidth = Math.max(240, window.innerWidth - 16);
    const width = Math.min(maxWidth, Math.max(280, Math.min(420, rect.width || 320)));
    const panelHeight = state.refs.suggestionPanel.offsetHeight || 248;
    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }

    if (top + panelHeight > window.innerHeight - 8 && rect.top > panelHeight + 8) {
      top = rect.top - panelHeight - 8;
    }

    state.refs.suggestionPanel.style.width = `${width}px`;
    state.refs.suggestionPanel.style.left = `${Math.max(8, left)}px`;
    state.refs.suggestionPanel.style.top = `${Math.max(8, top)}px`;
  }

  function renderInlineSuggestions() {
    if (!state.refs?.suggestionPanel || !state.refs?.suggestionList) {
      return;
    }

    const { items, activeIndex } = state.inlineSuggestions;
    if (!Array.isArray(items) || items.length === 0) {
      hideInlineSuggestions();
      return;
    }

    state.refs.suggestionList.innerHTML = "";
    if (state.refs.suggestionMeta) {
      state.refs.suggestionMeta.textContent = `${items.length} suggestion${items.length === 1 ? "" : "s"}`;
    }

    items.forEach((prompt, index) => {
      const previewText = prompt.previewText || prompt.text || "";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `ai-coach-inline-suggestion${index === activeIndex ? " ai-coach-inline-suggestion--active" : ""}`;
      button.dataset.promptId = prompt.id;
      button.dataset.index = String(index);
      button.dataset.aiCoachOwned = "true";
      button.innerHTML = `
        <div class="ai-coach-inline-suggestion__head">
          <strong>${escapeHtml(prompt.title)}</strong>
          <span class="ai-coach-inline-suggestion__badge">${escapeHtml(prompt.categoryLabel)}</span>
        </div>
        <p class="ai-coach-inline-suggestion__text">${escapeHtml(previewText)}</p>
        ${
          Array.isArray(prompt.reasons) && prompt.reasons.length > 0
            ? `<div class="ai-coach-inline-suggestion__reasons">${prompt.reasons
                .map((reason) => `<span>${escapeHtml(reason)}</span>`)
                .join("")}</div>`
            : ""
        }
      `;
      state.refs.suggestionList.appendChild(button);
    });

    state.refs.suggestionPanel.classList.remove("ai-coach-builder__hidden");
    state.inlineSuggestions.open = true;
    positionInlineSuggestions();
  }

  async function loadInlineSuggestionResources(force = false) {
    if (state.inlineSuggestions.library && state.inlineSuggestions.storageState && !force) {
      return;
    }

    const marketplace = getPromptMarketplace();
    state.inlineSuggestions.library = marketplace.getPromptLibrary();
    state.inlineSuggestions.storageState = await marketplace.readState(chrome.storage.local);
  }

  async function recordInlineSuggestionUsage(prompt) {
    if (!prompt?.id) {
      return;
    }

    try {
      state.inlineSuggestions.storageState = await getPromptMarketplace().recordPromptUsage(chrome.storage.local, {
        promptId: prompt.id,
        action: "insert",
        source: "inline_suggestion",
        platform: detectPlatform()?.name || ""
      });
    } catch (error) {
      console.debug("AI Dev Coach inline suggestion usage tracking skipped", error);
    }
  }

  async function applyInlineSuggestion(prompt, input) {
    const targetInput =
      input instanceof HTMLElement ? input : state.inlineSuggestions.activeInput;
    if (!(targetInput instanceof HTMLElement) || !prompt) {
      return false;
    }

    const inserted = setPromptInputValue(targetInput, prompt.text);
    if (!inserted) {
      return false;
    }

    state.inlineSuggestions.selectedPromptText = prompt.text;
    hideInlineSuggestions();
    await recordInlineSuggestionUsage(prompt);
    return true;
  }

  async function refreshInlineSuggestions() {
    if (state.panelOpen) {
      hideInlineSuggestions();
      return;
    }

    const input = state.inlineSuggestions.activeInput;
    if (!(input instanceof HTMLElement) || !document.contains(input) || !isVisibleInput(input)) {
      hideInlineSuggestions();
      return;
    }

    const query = readPromptInputValue(input);
    if (!query || query.length < 2) {
      hideInlineSuggestions();
      return;
    }

    if (state.inlineSuggestions.selectedPromptText && query === state.inlineSuggestions.selectedPromptText) {
      hideInlineSuggestions();
      return;
    }

    await loadInlineSuggestionResources();
    const suggestions = getPromptSuggestionEngine().getInlinePromptSuggestions({
      query,
      roleKey: state.selectedRoleKey || resolveRoleKey(state.profile),
      library: state.inlineSuggestions.library,
      rawState: state.inlineSuggestions.storageState,
      limit: INLINE_SUGGESTION_LIMIT,
      minimum: INLINE_SUGGESTION_MINIMUM
    });

    if (!suggestions.length) {
      hideInlineSuggestions();
      return;
    }

    state.inlineSuggestions.items = suggestions;
    state.inlineSuggestions.activeIndex = 0;
    renderInlineSuggestions();
  }

  function scheduleInlineSuggestionUpdate(input) {
    if (input instanceof HTMLElement) {
      state.inlineSuggestions.activeInput = input;
    }

    const currentValue = readPromptInputValue(state.inlineSuggestions.activeInput);
    if (state.inlineSuggestions.selectedPromptText && currentValue !== state.inlineSuggestions.selectedPromptText) {
      state.inlineSuggestions.selectedPromptText = "";
    }

    window.clearTimeout(state.inlineSuggestions.debounceId);
    state.inlineSuggestions.debounceId = window.setTimeout(() => {
      refreshInlineSuggestions().catch((error) => {
        console.debug("AI Dev Coach inline suggestion refresh skipped", error);
      });
    }, INLINE_SUGGESTION_DEBOUNCE_MS);
  }

  function setInlineSuggestionIndex(nextIndex) {
    if (!state.inlineSuggestions.items.length) {
      return;
    }

    const itemCount = state.inlineSuggestions.items.length;
    state.inlineSuggestions.activeIndex = ((nextIndex % itemCount) + itemCount) % itemCount;
    renderInlineSuggestions();
  }

  function handleInlineSuggestionKeydown(event) {
    if (!state.inlineSuggestions.open || !state.inlineSuggestions.items.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setInlineSuggestionIndex(state.inlineSuggestions.activeIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setInlineSuggestionIndex(state.inlineSuggestions.activeIndex - 1);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      hideInlineSuggestions();
      return;
    }

    if (event.key === "Enter") {
      const selected = state.inlineSuggestions.items[state.inlineSuggestions.activeIndex];
      if (!selected) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      applyInlineSuggestion(selected, state.inlineSuggestions.activeInput).catch((error) => {
        console.debug("AI Dev Coach inline suggestion apply skipped", error);
      });
    }
  }

  function unbindInlineSuggestionInput() {
    const input = state.inlineSuggestions.activeInput;
    const handlers = state.inlineSuggestions.handlers;
    if (!(input instanceof HTMLElement) || !handlers) {
      return;
    }

    input.removeEventListener("input", handlers.input);
    input.removeEventListener("keydown", handlers.keydown, true);
    input.removeEventListener("blur", handlers.blur, true);
    state.inlineSuggestions.handlers = null;
  }

  function bindInlineSuggestionInput(input) {
    if (!(input instanceof HTMLElement)) {
      unbindInlineSuggestionInput();
      state.inlineSuggestions.activeInput = null;
      hideInlineSuggestions();
      return;
    }

    if (state.inlineSuggestions.activeInput === input && state.inlineSuggestions.handlers) {
      return;
    }

    unbindInlineSuggestionInput();
    state.inlineSuggestions.activeInput = input;

    const handlers = {
      input: () => scheduleInlineSuggestionUpdate(input),
      keydown: (event) => handleInlineSuggestionKeydown(event),
      blur: () => {
        window.setTimeout(() => {
          const focused = document.activeElement;
          if (focused instanceof HTMLElement && isCoachOwnedElement(focused)) {
            return;
          }
          hideInlineSuggestions();
        }, 120);
      }
    };

    input.addEventListener("input", handlers.input);
    input.addEventListener("keydown", handlers.keydown, true);
    input.addEventListener("blur", handlers.blur, true);
    state.inlineSuggestions.handlers = handlers;
    scheduleInlineSuggestionUpdate(input);
  }

  function syncInlineSuggestionInput(platform) {
    const activeElement = document.activeElement;
    const input =
      resolvePromptInputFromElement(platform, activeElement) ||
      findPromptInput(platform);

    bindInlineSuggestionInput(input);
  }

  function ensureUiAttached() {
    if (!state.refs || !document.body) {
      return false;
    }

    let reattached = false;

    if (state.refs.launcher && !document.contains(state.refs.launcher)) {
      document.body.appendChild(state.refs.launcher);
      reattached = true;
    }

    if (state.refs.panel && !document.contains(state.refs.panel)) {
      document.body.appendChild(state.refs.panel);
      reattached = true;
    }

    if (state.refs.suggestionPanel && !document.contains(state.refs.suggestionPanel)) {
      document.body.appendChild(state.refs.suggestionPanel);
      reattached = true;
    }

    return reattached;
  }

  function updateLauncherPosition() {
    if (!state.refs) {
      return;
    }

    ensureUiAttached();

    const platform = detectPlatform();
    syncInlineSuggestionInput(platform);
    const input = findPromptInput(platform);

    if (!platform) {
      hideInlineSuggestions();
      state.refs.launcher.classList.add("ai-coach-builder__hidden");
      return;
    }

    let desiredLeft = window.innerWidth - 160;
    let desiredTop = 16;

    if (input) {
      const rect = input.getBoundingClientRect();
      desiredLeft = rect.right - 154;
      desiredTop = rect.top - 44;
      if (desiredTop < 8) {
        desiredTop = rect.bottom + 8;
      }
    }

    const maxLeft = window.innerWidth - 170;
    const maxTop = window.innerHeight - 48;

    state.refs.launcher.style.left = `${Math.max(10, Math.min(maxLeft, desiredLeft))}px`;
    state.refs.launcher.style.top = `${Math.max(8, Math.min(maxTop, desiredTop))}px`;
    state.refs.launcher.classList.remove("ai-coach-builder__hidden");

    if (state.panelOpen && state.refs.panel) {
      const panelRect = state.refs.panel.getBoundingClientRect();
      const panelWidth = panelRect.width || 412;
      const panelHeight = panelRect.height || 620;
      const launcherRect = state.refs.launcher.getBoundingClientRect();
      let panelLeft = launcherRect.right - panelWidth;
      let panelTop = launcherRect.bottom + 8;

      if (panelTop + panelHeight > window.innerHeight - 8) {
        panelTop = launcherRect.top - panelHeight - 8;
      }

      panelLeft = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, panelLeft));
      panelTop = Math.max(8, Math.min(window.innerHeight - panelHeight - 8, panelTop));

      state.refs.panel.style.left = `${panelLeft}px`;
      state.refs.panel.style.top = `${panelTop}px`;
      state.refs.panel.style.right = "auto";
      state.refs.panel.style.bottom = "auto";
    }

    positionInlineSuggestions();
  }

  function scheduleLayoutUpdate() {
    if (state.layoutTicking) {
      return;
    }

    state.layoutTicking = true;
    window.requestAnimationFrame(() => {
      state.layoutTicking = false;
      updateLauncherPosition();
    });
  }

  function togglePanel(open) {
    if (!state.refs) {
      return;
    }

    ensureUiAttached();

    state.panelOpen = typeof open === "boolean" ? open : !state.panelOpen;
    state.refs.panel.classList.toggle("ai-coach-builder__hidden", !state.panelOpen);
    state.refs.launcher.classList.toggle("ai-coach-builder-launcher--active", state.panelOpen);

    if (state.panelOpen) {
      hideInlineSuggestions();
      setStatus("", true);
      state.refs.taskInput.focus();
      return;
    }

    scheduleInlineSuggestionUpdate(state.inlineSuggestions.activeInput);
  }

  function createUI() {
    const launcher = document.createElement("button");
    launcher.id = BUTTON_ID;
    launcher.type = "button";
    launcher.className = "ai-coach-builder-launcher ai-coach-builder__hidden";
    launcher.textContent = "Prompt Builder";
    launcher.dataset.aiCoachOwned = "true";

    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.className = "ai-coach-builder-panel ai-coach-builder__hidden";
    panel.dataset.aiCoachOwned = "true";
    panel.innerHTML = `
      <header class="ai-coach-builder__header">
        <div>
          <h3>Quick Prompt Builder</h3>
          <p class="ai-coach-builder__subhead">Build a clean prompt, place it in the active AI chat, and send it when you are ready.</p>
        </div>
        <button type="button" class="ai-coach-builder__close" aria-label="Close">×</button>
      </header>
      <section class="ai-coach-builder__section">
        <div class="ai-coach-builder__section-head">
          <span class="ai-coach-builder__section-kicker">Setup</span>
          <p class="ai-coach-builder__hint">Choose a template and role that match the conversation you want to have.</p>
        </div>
        <label class="ai-coach-builder__label" for="aiCoachTemplateSelect">Template</label>
        <select id="aiCoachTemplateSelect" class="ai-coach-builder__input"></select>
        <p id="aiCoachTemplateHint" class="ai-coach-builder__hint"></p>

        <label class="ai-coach-builder__label" for="aiCoachRoleSelect">Role</label>
        <select id="aiCoachRoleSelect" class="ai-coach-builder__input">
          <option value="teacher">Teacher</option>
          <option value="software_engineer" selected>Software Engineer</option>
          <option value="solution_architecture">Solution Architecture</option>
          <option value="manager">Manager</option>
          <option value="director">Director</option>
          <option value="doctor">Doctor</option>
          <option value="other">Other</option>
        </select>
        <p id="aiCoachRoleHint" class="ai-coach-builder__hint"></p>
        <p id="aiCoachRoleCoachHint" class="ai-coach-builder__hint"></p>
      </section>

      <section class="ai-coach-builder__section">
        <div class="ai-coach-builder__section-head">
          <span class="ai-coach-builder__section-kicker">Required Context</span>
          <p class="ai-coach-builder__hint">These fields help the AI reason from your evidence instead of guessing.</p>
        </div>
        <label class="ai-coach-builder__label" for="aiCoachTask">Task</label>
        <textarea id="aiCoachTask" class="ai-coach-builder__input" rows="2" placeholder="What do you need from AI?"></textarea>

        <label class="ai-coach-builder__label" for="aiCoachContext">Context</label>
        <textarea id="aiCoachContext" class="ai-coach-builder__input" rows="3" placeholder="Error text, stack trace, file path, expected vs actual behavior"></textarea>

        <label class="ai-coach-builder__label" for="aiCoachAttempt">What You Tried</label>
        <textarea id="aiCoachAttempt" class="ai-coach-builder__input" rows="3" placeholder="What you already tried, hypotheses, and what changed"></textarea>
      </section>

      <section class="ai-coach-builder__section">
        <div class="ai-coach-builder__section-head">
          <span class="ai-coach-builder__section-kicker">Optional Details</span>
          <p class="ai-coach-builder__hint">Add constraints or success criteria when you want tighter answers.</p>
        </div>
        <label class="ai-coach-builder__label" for="aiCoachConstraints">Constraints</label>
        <textarea id="aiCoachConstraints" class="ai-coach-builder__input" rows="2" placeholder="Tech stack, style guide, performance limits, timeline"></textarea>

        <label class="ai-coach-builder__label" for="aiCoachAcceptance">Acceptance Criteria</label>
        <textarea id="aiCoachAcceptance" class="ai-coach-builder__input" rows="2" placeholder="How should we know the solution is complete and correct?"></textarea>
      </section>

      <div class="ai-coach-builder__footer">
        <div class="ai-coach-builder__actions">
          <button type="button" id="aiCoachInsertBtn" class="ai-coach-builder__btn ai-coach-builder__btn--secondary">Build + Insert</button>
          <button type="button" id="aiCoachSendBtn" class="ai-coach-builder__btn ai-coach-builder__btn--primary">Build + Send</button>
        </div>
        <p id="aiCoachBuilderStatus" class="ai-coach-builder__status">Tip: press Ctrl/Cmd + O while focused in the AI chat to open this builder.</p>
      </div>
    `;

    const suggestionPanel = document.createElement("aside");
    suggestionPanel.id = "ai-dev-coach-inline-suggestions";
    suggestionPanel.className = "ai-coach-inline-suggestions ai-coach-builder__hidden";
    suggestionPanel.dataset.aiCoachOwned = "true";
    suggestionPanel.innerHTML = `
      <div class="ai-coach-inline-suggestions__header">
        <strong>Suggested Prompts</strong>
        <span id="aiCoachSuggestionMeta" class="ai-coach-inline-suggestions__meta"></span>
      </div>
      <div id="aiCoachSuggestionList" class="ai-coach-inline-suggestions__list"></div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    document.body.appendChild(suggestionPanel);

    state.refs = {
      launcher,
      panel,
      suggestionPanel,
      suggestionList: suggestionPanel.querySelector("#aiCoachSuggestionList"),
      suggestionMeta: suggestionPanel.querySelector("#aiCoachSuggestionMeta"),
      closeBtn: panel.querySelector(".ai-coach-builder__close"),
      templateSelect: panel.querySelector("#aiCoachTemplateSelect"),
      templateHint: panel.querySelector("#aiCoachTemplateHint"),
      roleSelect: panel.querySelector("#aiCoachRoleSelect"),
      roleHint: panel.querySelector("#aiCoachRoleHint"),
      roleCoachHint: panel.querySelector("#aiCoachRoleCoachHint"),
      taskInput: panel.querySelector("#aiCoachTask"),
      contextInput: panel.querySelector("#aiCoachContext"),
      attemptInput: panel.querySelector("#aiCoachAttempt"),
      constraintsInput: panel.querySelector("#aiCoachConstraints"),
      acceptanceInput: panel.querySelector("#aiCoachAcceptance"),
      insertBtn: panel.querySelector("#aiCoachInsertBtn"),
      sendBtn: panel.querySelector("#aiCoachSendBtn"),
      status: panel.querySelector("#aiCoachBuilderStatus")
    };

    launcher.addEventListener("click", () => {
      togglePanel();
    });

    state.refs.closeBtn.addEventListener("click", () => {
      togglePanel(false);
    });

    state.refs.templateSelect.addEventListener("change", async () => {
      state.selectedTemplate = state.refs.templateSelect.value;
      applyTemplateUI(state.selectedTemplate);
      await storageSet({ selectedTemplate: state.selectedTemplate });
    });

    state.refs.roleSelect.addEventListener("change", async () => {
      state.selectedRoleKey = state.refs.roleSelect.value;
      const recommendedTemplate = getRecommendedTemplateForProfile(state.profile, state.selectedRoleKey);
      state.selectedTemplate = TEMPLATES[recommendedTemplate] ? recommendedTemplate : DEFAULT_TEMPLATE;
      renderTemplateOptions();
      state.refs.templateSelect.value = state.selectedTemplate;
      applyTemplateUI(state.selectedTemplate);
      await storageSet({
        quickBuilderRoleKey: state.selectedRoleKey,
        selectedTemplate: state.selectedTemplate
      });
      const roleProfile = getRoleProfile({ ...state.profile, roleKey: state.selectedRoleKey });
      setStatus(`Role updated to ${roleProfile.label || "Other"}.`, true);
    });

    state.refs.insertBtn.addEventListener("click", () => {
      handleBuildAndRun(false).catch((error) => {
        console.error("AI Dev Coach quick builder insert error", error);
        setStatus("Failed to build prompt.", false);
      });
    });

    state.refs.sendBtn.addEventListener("click", () => {
      handleBuildAndRun(true).catch((error) => {
        console.error("AI Dev Coach quick builder send error", error);
        setStatus("Failed to build and send prompt.", false);
      });
    });

    state.refs.suggestionList.addEventListener("mousedown", (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-id][data-index]") : null;
      if (target) {
        event.preventDefault();
      }
    });

    state.refs.suggestionList.addEventListener("click", (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest("[data-prompt-id][data-index]") : null;
      if (!target) {
        return;
      }

      const index = Number(target.dataset.index);
      const prompt = state.inlineSuggestions.items[index];
      applyInlineSuggestion(prompt, state.inlineSuggestions.activeInput).catch((error) => {
        console.debug("AI Dev Coach inline suggestion click skipped", error);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.panelOpen) {
        togglePanel(false);
      }
    });
  }

  function startObservers() {
    const observer = new MutationObserver(() => {
      scheduleLayoutUpdate();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.addEventListener("resize", scheduleLayoutUpdate, { passive: true });
    window.addEventListener("scroll", scheduleLayoutUpdate, { passive: true, capture: true });
    document.addEventListener("focusin", scheduleLayoutUpdate, true);
    document.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && isCoachOwnedElement(target)) {
        return;
      }
      if (
        target &&
        state.inlineSuggestions.activeInput instanceof HTMLElement &&
        state.inlineSuggestions.activeInput.contains(target)
      ) {
        return;
      }
      hideInlineSuggestions();
    });
    document.addEventListener("visibilitychange", scheduleLayoutUpdate, true);
  }

  function wireStorageChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(changes, "promptMarketplace")) {
        state.inlineSuggestions.storageState = changes.promptMarketplace.newValue || null;
      }

      if (Object.prototype.hasOwnProperty.call(changes, "profile")) {
        const migratedProfile = getRoleCoaching().migrateLegacyStudentProfile({
          ...DEFAULT_PROFILE,
          ...(changes.profile?.newValue || {})
        });
        state.profile = migratedProfile.profile;
        state.selectedRoleKey = resolveRoleKey(state.profile);
      }

      if (changes.quickBuilderRoleKey?.newValue) {
        state.selectedRoleKey = normalizeRoleKey(changes.quickBuilderRoleKey.newValue);
      }

      if (state.inlineSuggestions.activeInput) {
        scheduleInlineSuggestionUpdate(state.inlineSuggestions.activeInput);
      }
    });
  }

  function isShortcutToggleEvent(event) {
    const hasPrimaryModifier = event.ctrlKey || event.metaKey;
    return (
      event.key &&
      event.key.toLowerCase() === "o" &&
      !event.altKey &&
      hasPrimaryModifier &&
      !event.isComposing &&
      !event.repeat
    );
  }

  function wireShortcut() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (!isShortcutToggleEvent(event)) {
          return;
        }

        const platform = detectPlatform();
        if (!platform) {
          return;
        }

        const activeElement = document.activeElement;
        const focusedInput =
          resolvePromptInputFromElement(platform, event.target) ||
          resolvePromptInputFromElement(platform, activeElement);

        if (!focusedInput) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        togglePanel(true);
        scheduleLayoutUpdate();
      },
      true
    );
  }

  function wireRuntimeMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message) {
        return undefined;
      }

      if (message.type === "ai-dev-coach:open-quick-builder") {
        const platform = detectPlatform();
        if (!platform) {
          return undefined;
        }

        togglePanel(true);
        scheduleLayoutUpdate();
        if (state.refs?.taskInput) {
          state.refs.taskInput.focus();
        }
        return undefined;
      }

      if (message.type === "ai-dev-coach:prompt-marketplace-run") {
        runMarketplacePrompt(message.prompt, message.action)
          .then((result) => sendResponse(result))
          .catch((error) => {
            console.error("AI Dev Coach marketplace action error", error);
            sendResponse({
              ok: false,
              error: "Failed to run marketplace prompt."
            });
          });
        return true;
      }

      return undefined;
    });
  }

  async function init() {
    createUI();
    renderTemplateOptions();
    await loadProfileAndTemplate();
    try {
      await loadInlineSuggestionResources();
    } catch (error) {
      console.debug("AI Dev Coach inline suggestion preload skipped", error);
    }
    applyTemplateUI(state.selectedTemplate);
    startObservers();
    wireShortcut();
    wireRuntimeMessages();
    wireStorageChanges();
    scheduleLayoutUpdate();
  }

  init().catch((error) => {
    console.error("AI Dev Coach quick builder init error", error);
  });
})();
