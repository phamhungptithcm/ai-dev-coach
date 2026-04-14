(() => {
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

  function clean(value) {
    return (value || "").trim();
  }

  function detectPlatformByUrl(url) {
    const href = clean(url);
    if (!href) {
      return null;
    }

    return (
      PLATFORM_CONFIG.find((platform) =>
        platform.matches.some((matcher) => matcher.test(href))
      ) || null
    );
  }

  function detectPlatform() {
    if (typeof window === "undefined" || !window.location) {
      return null;
    }
    return detectPlatformByUrl(window.location.href);
  }

  function isSupportedUrl(url) {
    return !!detectPlatformByUrl(url);
  }

  function isCoachOwnedElement(element) {
    if (typeof Element === "undefined" || !(element instanceof Element)) {
      return false;
    }
    return !!element.closest(COACH_OWNED_SELECTOR);
  }

  function isVisiblePromptInput(element) {
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
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
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
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
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
      return true;
    }

    const context = contextHintText(element);
    return CONTEXT_EXCLUSION_HINTS.some((pattern) => pattern.test(context));
  }

  function findComposerScope(element) {
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
      return null;
    }

    return element.closest(
      "form,[data-testid*='composer'],[data-testid*='prompt'],[class*='composer'],[class*='prompt'],[class*='chat-input']"
    );
  }

  function isLikelySendButton(element) {
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
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

  function hasNearbySendButton(element) {
    const scope = findComposerScope(element);
    if (!(scope instanceof Element)) {
      return false;
    }

    const candidates = Array.from(
      scope.querySelectorAll("button,[role='button'],input[type='submit'],input[type='button']")
    ).slice(0, 80);

    return candidates.some(
      (candidate) => candidate instanceof HTMLElement && isLikelySendButton(candidate)
    );
  }

  function scorePromptInputCandidate(element) {
    if (
      typeof HTMLElement === "undefined" ||
      !(element instanceof HTMLElement) ||
      !isVisiblePromptInput(element) ||
      isExcludedContextInput(element)
    ) {
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

  function collectPromptInputs(platform, scope = document) {
    if (!platform || !(scope instanceof Document || scope instanceof Element)) {
      return [];
    }

    const matches = [];
    const seen = new Set();

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      platform.inputSelectors.some((selector) => activeElement.matches(selector)) &&
      isVisiblePromptInput(activeElement)
    ) {
      const activeScore = scorePromptInputCandidate(activeElement);
      if (activeScore !== Number.NEGATIVE_INFINITY) {
        matches.push(activeElement);
        seen.add(activeElement);
      }
    }

    for (const selector of platform.inputSelectors) {
      const candidates = Array.from(scope.querySelectorAll(selector));
      for (const candidate of candidates) {
        if (!(candidate instanceof HTMLElement) || seen.has(candidate) || !isVisiblePromptInput(candidate)) {
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
    if (!(scope instanceof Element) || !platform) {
      return null;
    }

    return pickBestPromptInput(collectPromptInputs(platform, scope));
  }

  function resolvePromptInputFromElement(platform, element) {
    if (!platform || !(element instanceof Element) || isCoachOwnedElement(element)) {
      return null;
    }

    for (const selector of platform.inputSelectors) {
      const candidate = element.closest(selector);
      if (candidate instanceof HTMLElement && isVisiblePromptInput(candidate)) {
        return candidate;
      }
    }

    const scope = element.closest(
      "form,[data-testid*='composer'],[data-testid*='prompt'],[class*='composer'],[class*='prompt'],[class*='chat-input']"
    );
    return findVisibleInputInScope(scope, platform);
  }

  function resolveActivePromptInput(platform) {
    if (!platform) {
      return null;
    }

    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      platform.inputSelectors.some((selector) => activeElement.matches(selector)) &&
      isVisiblePromptInput(activeElement)
    ) {
      const activeScore = scorePromptInputCandidate(activeElement);
      if (activeScore !== Number.NEGATIVE_INFINITY) {
        return activeElement;
      }
    }

    return pickBestPromptInput(collectPromptInputs(platform));
  }

  function readPromptInputValue(input) {
    if (typeof HTMLElement === "undefined" || !(input instanceof HTMLElement)) {
      return "";
    }

    if (input.tagName === "TEXTAREA") {
      return (input.value || "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    }

    const placeholder = clean(
      input.getAttribute("aria-placeholder") ||
        input.getAttribute("data-placeholder") ||
        input.getAttribute("placeholder")
    ).toLowerCase();
    const text = clean(
      (input.innerText || input.textContent || "").replace(/[\u200B-\u200D\uFEFF]/g, "")
    );

    if (!text) {
      return "";
    }

    if (placeholder && text.toLowerCase() === placeholder) {
      return "";
    }

    return text;
  }

  function writePromptInputValue(input, text) {
    if (typeof HTMLElement === "undefined" || !(input instanceof HTMLElement)) {
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

  function findSendButton(input) {
    if (typeof HTMLElement === "undefined" || !(input instanceof HTMLElement)) {
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

        if (isCoachOwnedElement(candidate) || !isVisiblePromptInput(candidate)) {
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

  const api = {
    COACH_OWNED_SELECTOR,
    PLATFORM_CONFIG,
    clean,
    detectPlatform,
    detectPlatformByUrl,
    isSupportedUrl,
    isCoachOwnedElement,
    isVisiblePromptInput,
    contextHintText,
    isExcludedContextInput,
    findComposerScope,
    isLikelySendButton,
    scorePromptInputCandidate,
    pickBestPromptInput,
    collectPromptInputs,
    findVisibleInputInScope,
    resolvePromptInputFromElement,
    resolveActivePromptInput,
    readPromptInputValue,
    writePromptInputValue,
    findSendButton
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachPlatformAdapter = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachPlatformAdapter = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
