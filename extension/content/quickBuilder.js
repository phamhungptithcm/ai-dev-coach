(() => {
  const PANEL_ID = "ai-dev-coach-builder-panel";
  const BUTTON_ID = "ai-dev-coach-builder-launcher";
  const COACH_OWNED_SELECTOR = '[data-ai-coach-owned="true"]';

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
    skill: "",
    habitGoals: ""
  };

  const DEFAULT_TEMPLATE = "debugging";
  const REQUIRED_FIELDS = ["task", "context", "attempt"];

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
    profile: { ...DEFAULT_PROFILE },
    refs: null,
    layoutTicking: false
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
      return activeElement;
    }

    for (const selector of platform.inputSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      const visible = candidates.find((candidate) => isVisibleInput(candidate));
      if (visible) {
        return visible;
      }
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

  function buildPrompt(templateKey, profile, fields) {
    const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];

    return [
      template.intro,
      `Role: ${profile.role || "Not provided"}`,
      `Skill level: ${profile.skill || "Not provided"}`,
      `Habit goal: ${profile.habitGoals || template.defaultGoal}`,
      "",
      `Task: ${fields.task}`,
      `Context: ${fields.context}`,
      `What I already tried: ${fields.attempt}`,
      `Constraints: ${fields.constraints || template.defaultConstraints}`,
      `Acceptance criteria: ${fields.acceptance || template.defaultAcceptance}`,
      "",
      "Response rules:",
      ...template.responseRules
    ].join("\n");
  }

  function setStatus(message, ok) {
    if (!state.refs) {
      return;
    }

    const status = state.refs.status;
    status.textContent = message || "";
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

    Object.entries(TEMPLATES).forEach(([key, template]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = template.label;
      option.selected = key === state.selectedTemplate;
      select.appendChild(option);
    });
  }

  function applyTemplateUI(templateKey) {
    if (!state.refs) {
      return;
    }

    const template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
    state.refs.templateHint.textContent = template.hint;
    state.refs.contextInput.placeholder = template.contextPlaceholder;
    state.refs.attemptInput.placeholder = template.attemptPlaceholder;
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
    const data = await storageGet(["profile", "selectedTemplate"]);
    state.profile = { ...DEFAULT_PROFILE, ...(data.profile || {}) };
    state.selectedTemplate = TEMPLATES[data.selectedTemplate] ? data.selectedTemplate : DEFAULT_TEMPLATE;

    if (state.refs) {
      state.refs.templateSelect.value = state.selectedTemplate;
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

    const prompt = buildPrompt(state.selectedTemplate, state.profile, fields);
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
      setStatus(sent ? "Prompt sent to AI." : "Prompt inserted. Send manually.", sent);
      return;
    }

    setStatus("Prompt inserted into chat box.", true);
  }

  function updateLauncherPosition() {
    if (!state.refs) {
      return;
    }

    const platform = detectPlatform();
    const input = findPromptInput(platform);

    if (!platform || !input) {
      state.refs.launcher.classList.add("ai-coach-builder__hidden");
      return;
    }

    const rect = input.getBoundingClientRect();
    const desiredLeft = rect.right + 8;
    const desiredTop = rect.bottom - 34;
    const maxLeft = window.innerWidth - 170;
    const maxTop = window.innerHeight - 42;

    state.refs.launcher.style.left = `${Math.max(10, Math.min(maxLeft, desiredLeft))}px`;
    state.refs.launcher.style.top = `${Math.max(8, Math.min(maxTop, desiredTop))}px`;
    state.refs.launcher.classList.remove("ai-coach-builder__hidden");
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

    state.panelOpen = typeof open === "boolean" ? open : !state.panelOpen;
    state.refs.panel.classList.toggle("ai-coach-builder__hidden", !state.panelOpen);
    state.refs.launcher.classList.toggle("ai-coach-builder-launcher--active", state.panelOpen);

    if (state.panelOpen) {
      setStatus("", true);
      state.refs.taskInput.focus();
    }
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
        <h3>Quick Prompt Builder</h3>
        <button type="button" class="ai-coach-builder__close" aria-label="Close">×</button>
      </header>
      <label class="ai-coach-builder__label" for="aiCoachTemplateSelect">Template</label>
      <select id="aiCoachTemplateSelect" class="ai-coach-builder__input"></select>
      <p id="aiCoachTemplateHint" class="ai-coach-builder__hint"></p>

      <label class="ai-coach-builder__label" for="aiCoachTask">Task (Required)</label>
      <textarea id="aiCoachTask" class="ai-coach-builder__input" rows="2" placeholder="What do you need from AI?"></textarea>

      <label class="ai-coach-builder__label" for="aiCoachContext">Context (Required)</label>
      <textarea id="aiCoachContext" class="ai-coach-builder__input" rows="3" placeholder="Error text, stack trace, file path, expected vs actual behavior"></textarea>

      <label class="ai-coach-builder__label" for="aiCoachAttempt">What You Tried (Required)</label>
      <textarea id="aiCoachAttempt" class="ai-coach-builder__input" rows="3" placeholder="What you already tried, hypotheses, and what changed"></textarea>

      <label class="ai-coach-builder__label" for="aiCoachConstraints">Constraints (Optional)</label>
      <textarea id="aiCoachConstraints" class="ai-coach-builder__input" rows="2" placeholder="Tech stack, style guide, performance limits, timeline"></textarea>

      <label class="ai-coach-builder__label" for="aiCoachAcceptance">Acceptance Criteria (Optional)</label>
      <textarea id="aiCoachAcceptance" class="ai-coach-builder__input" rows="2" placeholder="How should we know the solution is complete and correct?"></textarea>

      <div class="ai-coach-builder__actions">
        <button type="button" id="aiCoachInsertBtn" class="ai-coach-builder__btn ai-coach-builder__btn--secondary">Build + Insert</button>
        <button type="button" id="aiCoachSendBtn" class="ai-coach-builder__btn ai-coach-builder__btn--primary">Build + Send</button>
      </div>
      <p id="aiCoachBuilderStatus" class="ai-coach-builder__status"></p>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    state.refs = {
      launcher,
      panel,
      closeBtn: panel.querySelector(".ai-coach-builder__close"),
      templateSelect: panel.querySelector("#aiCoachTemplateSelect"),
      templateHint: panel.querySelector("#aiCoachTemplateHint"),
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
  }

  async function init() {
    createUI();
    renderTemplateOptions();
    await loadProfileAndTemplate();
    applyTemplateUI(state.selectedTemplate);
    startObservers();
    scheduleLayoutUpdate();
  }

  init().catch((error) => {
    console.error("AI Dev Coach quick builder init error", error);
  });
})();
