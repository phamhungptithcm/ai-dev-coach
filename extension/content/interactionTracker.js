(() => {
  const COACH_OWNED_SELECTOR = '[data-ai-coach-owned="true"]';

  const DEFAULT_SETTINGS = {
    enableCoach: true,
    promptListenerEnabled: true,
    behaviorMonitorEnabled: true,
    readPromptContentEnabled: true,
    readCopiedContentEnabled: true,
    readBeforeCopyEnabled: true,
    showOutputCountdown: true,
    pasteThreshold: 320,
    longCopyThreshold: 360,
    minReadBeforeCopySeconds: 20,
    overlayDurationMs: 9000
  };

  const DEFAULT_STATS = {
    aiRequests: 0,
    manualAttempts: 0,
    largePastes: 0,
    aiCopies: 0,
    fastAiCopies: 0
  };

  const ASSISTANT_SELECTORS = [
    "[data-message-author-role='assistant']",
    "[data-author='assistant']",
    "[data-role='assistant']",
    "[data-testid*='assistant']",
    "[class*='assistant']",
    "[class*='response']"
  ];

  const ASSISTANT_SELECTOR_QUERY = ASSISTANT_SELECTORS.join(",");
  const COPY_TRACE_TTL_MS = 8 * 60 * 1000;
  const WARNING_COOLDOWN_MS = 3000;

  let currentSettings = { ...DEFAULT_SETTINGS };
  let lastWarningAt = 0;
  let recentAiCopy = {
    at: 0,
    signature: "",
    chars: 0
  };
  let latestAiOutput = {
    at: 0,
    signature: "",
    chars: 0
  };

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
  }

  function mergeSettings(rawSettings) {
    return { ...DEFAULT_SETTINGS, ...(rawSettings || {}) };
  }

  async function refreshSettingsCache() {
    const data = await storageGet(["settings"]);
    currentSettings = mergeSettings(data.settings);
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function buildTextSignature(text) {
    const normalized = normalizeText(text);
    return `${normalized.length}:${normalized.slice(0, 90)}:${normalized.slice(-50)}`;
  }

  function showCoachMessage(message, type = "warning", settings = currentSettings, options = {}) {
    const force = !!options.force;
    const isWarning = type === "warning";

    if (isWarning && !force) {
      const now = Date.now();
      if (now - lastWarningAt < WARNING_COOLDOWN_MS) {
        return;
      }
      lastWarningAt = now;
    }

    if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
      window.AIDevCoachOverlay.show(message, type, settings.overlayDurationMs || 9000);
      return;
    }

    const logger = type === "warning" ? console.warn : console.log;
    logger("AI Dev Coach:", message);
  }

  function isCoachOwnedElement(element) {
    if (!(element instanceof Element)) {
      return false;
    }
    return !!element.closest(COACH_OWNED_SELECTOR);
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (isCoachOwnedElement(target)) {
      return false;
    }

    if (target.isContentEditable) {
      return true;
    }

    if (target.tagName === "TEXTAREA") {
      return !target.hasAttribute("disabled") && !target.hasAttribute("readonly");
    }

    if (target.tagName !== "INPUT") {
      return false;
    }

    const inputType = (target.getAttribute("type") || "text").toLowerCase();
    const allowedTypes = new Set(["text", "search", "email", "url", "tel", "number", "password"]);

    return (
      allowedTypes.has(inputType) &&
      !target.hasAttribute("disabled") &&
      !target.hasAttribute("readonly")
    );
  }

  function looksLikeCode(text) {
    if (!text) {
      return false;
    }

    const lines = text.split("\n");
    const hasMultiLine = lines.length >= 4;
    const codeSignals = [/[{};]/, /function\s+\w+/i, /const\s+\w+\s*=/, /class\s+\w+/i, /=>/, /import\s+.+from\s+/i];

    return hasMultiLine && codeSignals.some((pattern) => pattern.test(text));
  }

  function isLikelyAssistantOutputSelection(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (isCoachOwnedElement(target)) {
      return false;
    }

    if (isEditableTarget(target)) {
      return false;
    }

    if (target.closest("form,[data-testid*='composer'],[class*='composer']")) {
      return false;
    }

    if (ASSISTANT_SELECTORS.some((selector) => !!target.closest(selector))) {
      return true;
    }

    // Conservative fallback on AI chat pages: long non-editable selection is likely model output.
    return true;
  }

  function hasLargeCopiedAiOutput(text) {
    if (!text || text.length < currentSettings.longCopyThreshold) {
      return false;
    }

    if (!recentAiCopy.signature || !recentAiCopy.at) {
      return false;
    }

    if (Date.now() - recentAiCopy.at > COPY_TRACE_TTL_MS) {
      return false;
    }

    const sameSignature = buildTextSignature(text) === recentAiCopy.signature;
    const similarLength = Math.abs(text.length - recentAiCopy.chars) <= 24;
    return sameSignature || similarLength;
  }

  function rememberAiCopy(text) {
    recentAiCopy = {
      at: Date.now(),
      signature: buildTextSignature(text),
      chars: text.length
    };
  }

  function registerAiOutput(text) {
    if (!text || text.length < Math.max(120, Math.floor(currentSettings.longCopyThreshold * 0.75))) {
      return;
    }

    const signature = buildTextSignature(text);
    if (signature === latestAiOutput.signature) {
      return;
    }

    latestAiOutput = {
      at: Date.now(),
      signature,
      chars: text.length
    };

    if (
      currentSettings.enableCoach &&
      currentSettings.behaviorMonitorEnabled &&
      currentSettings.readBeforeCopyEnabled &&
      currentSettings.showOutputCountdown
    ) {
      showCoachMessage(
        `AI output detected. Read for at least ${currentSettings.minReadBeforeCopySeconds}s before copying.`,
        "info",
        currentSettings,
        { force: true }
      );
    }
  }

  function pickLongestAssistantText(node) {
    if (!(node instanceof HTMLElement)) {
      return "";
    }

    if (isCoachOwnedElement(node)) {
      return "";
    }

    const candidates = [];

    const nodeText = normalizeText(node.innerText || node.textContent || "");
    if (nodeText) {
      const hasAssistantMarker = ASSISTANT_SELECTORS.some(
        (selector) => node.matches(selector) || !!node.closest(selector)
      );
      if (hasAssistantMarker || nodeText.length >= Math.max(200, currentSettings.longCopyThreshold)) {
        candidates.push(nodeText);
      }
    }

    const marked = Array.from(node.querySelectorAll(ASSISTANT_SELECTOR_QUERY)).slice(0, 8);
    marked.forEach((element) => {
      const text = normalizeText(element.innerText || element.textContent || "");
      if (text.length >= Math.max(120, Math.floor(currentSettings.longCopyThreshold * 0.75))) {
        candidates.push(text);
      }
    });

    if (candidates.length === 0) {
      return "";
    }

    return candidates.sort((a, b) => b.length - a.length)[0];
  }

  async function mutateStats(mutator) {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    mutator(stats);
    await storageSet({ stats });
    return stats;
  }

  async function evaluateCopyTimingAndStats(copiedTextLength) {
    const now = Date.now();
    const thresholdMs = currentSettings.minReadBeforeCopySeconds * 1000;
    const elapsedMs = latestAiOutput.at ? now - latestAiOutput.at : null;
    const tooFast =
      currentSettings.readBeforeCopyEnabled &&
      typeof elapsedMs === "number" &&
      elapsedMs >= 0 &&
      elapsedMs < thresholdMs;

    await mutateStats((stats) => {
      stats.aiCopies += 1;
      if (tooFast) {
        stats.fastAiCopies += 1;
      }
    });

    if (tooFast) {
      const remainingSeconds = Math.ceil((thresholdMs - elapsedMs) / 1000);
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      showCoachMessage(
        `Copied ${elapsedSeconds}s after AI output. Wait ${remainingSeconds}s, then summarize in your own words.`,
        "warning",
        currentSettings,
        { force: true }
      );
      return;
    }

    if (currentSettings.readBeforeCopyEnabled && copiedTextLength >= currentSettings.longCopyThreshold) {
      showCoachMessage(
        "Good habit: verify and adapt copied AI output before reusing it.",
        "success",
        currentSettings,
        { force: true }
      );
    }
  }

  async function handleLargePasteEvent(pastedText) {
    const isLargePaste = pastedText.length >= currentSettings.pasteThreshold;
    if (!isLargePaste) {
      return;
    }

    const pastedCopiedAiOutput = hasLargeCopiedAiOutput(pastedText);
    const pastedCode = looksLikeCode(pastedText);

    if (!pastedCopiedAiOutput && !pastedCode) {
      return;
    }

    const stats = await mutateStats((nextStats) => {
      nextStats.largePastes += 1;
    });

    if (pastedCopiedAiOutput) {
      showCoachMessage(
        "You pasted a long AI answer. Rewrite with your own reasoning before sending.",
        "warning",
        currentSettings
      );

      showCoachMessage(
        "Before send: include your assumptions and one verification step.",
        "warning",
        currentSettings,
        { force: true }
      );
    } else {
      showCoachMessage(
        "Large code paste detected. Read, explain, and test the snippet before using it.",
        "warning",
        currentSettings
      );
    }

    if (stats.largePastes >= 3) {
      showCoachMessage(
        "Pattern alert: multiple large pastes detected. Ask for hints and implement yourself.",
        "warning",
        currentSettings,
        { force: true }
      );
    }
  }

  function isLikelyCopyButton(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const attrs = [
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("data-testid"),
      element.textContent
    ]
      .filter(Boolean)
      .join(" ");

    if (!attrs) {
      return false;
    }

    return /\bcopy\b/i.test(attrs) && !/\blink\b|\bshare\b/i.test(attrs);
  }

  function tryResolveAssistantTextFromCopyButton(button) {
    if (!(button instanceof HTMLElement)) {
      return "";
    }

    const assistantRoot = button.closest(ASSISTANT_SELECTOR_QUERY);
    if (assistantRoot) {
      return normalizeText(assistantRoot.innerText || assistantRoot.textContent || "");
    }

    const nearAssistant = button.parentElement?.closest(ASSISTANT_SELECTOR_QUERY);
    if (nearAssistant) {
      return normalizeText(nearAssistant.innerText || nearAssistant.textContent || "");
    }

    return "";
  }

  function wireCopyListener() {
    document.addEventListener(
      "copy",
      (event) => {
        if (
          !currentSettings.enableCoach ||
          !currentSettings.behaviorMonitorEnabled ||
          !currentSettings.readCopiedContentEnabled
        ) {
          return;
        }

        const selectedText = normalizeText(window.getSelection()?.toString() || "");
        if (selectedText.length < currentSettings.longCopyThreshold) {
          return;
        }

        const sourceElement =
          event.target instanceof HTMLElement
            ? event.target
            : window.getSelection()?.anchorNode?.parentElement;

        if (!(sourceElement instanceof HTMLElement)) {
          return;
        }

        if (isCoachOwnedElement(sourceElement)) {
          return;
        }

        if (!isLikelyAssistantOutputSelection(sourceElement)) {
          return;
        }

        rememberAiCopy(selectedText);
        evaluateCopyTimingAndStats(selectedText.length).catch((error) => {
          console.error("AI Dev Coach copy handling error", error);
        });
      },
      true
    );

    document.addEventListener(
      "click",
      (event) => {
        if (
          !currentSettings.enableCoach ||
          !currentSettings.behaviorMonitorEnabled ||
          !currentSettings.readCopiedContentEnabled
        ) {
          return;
        }

        if (!(event.target instanceof Element)) {
          return;
        }

        if (isCoachOwnedElement(event.target)) {
          return;
        }

        const button = event.target.closest("button,[role='button']");
        if (!(button instanceof HTMLElement) || !isLikelyCopyButton(button)) {
          return;
        }

        const copiedText = tryResolveAssistantTextFromCopyButton(button);
        if (copiedText.length < currentSettings.longCopyThreshold) {
          return;
        }

        rememberAiCopy(copiedText);
        evaluateCopyTimingAndStats(copiedText.length).catch((error) => {
          console.error("AI Dev Coach copy-button handling error", error);
        });
      },
      true
    );
  }

  function wirePasteListener() {
    document.addEventListener("paste", (event) => {
      if (
        !currentSettings.enableCoach ||
        !currentSettings.behaviorMonitorEnabled ||
        !currentSettings.readCopiedContentEnabled
      ) {
        return;
      }

      if (!isEditableTarget(event.target)) {
        return;
      }

      if (event.target instanceof HTMLElement && isCoachOwnedElement(event.target)) {
        return;
      }

      const clipboard = event.clipboardData;
      if (!clipboard) {
        return;
      }

      const pastedText = clipboard.getData("text") || "";
      handleLargePasteEvent(pastedText).catch((error) => {
        console.error("AI Dev Coach paste handling error", error);
      });
    });
  }

  function wireOutputObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!currentSettings.behaviorMonitorEnabled || !currentSettings.readBeforeCopyEnabled) {
        return;
      }

      let processed = 0;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (processed >= 12) {
            return;
          }

          if (!(node instanceof HTMLElement)) {
            continue;
          }

          if (isCoachOwnedElement(node)) {
            continue;
          }

          const text = pickLongestAssistantText(node);
          if (!text) {
            continue;
          }

          registerAiOutput(text);
          processed += 1;
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function wireSettingsUpdates() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes.settings) {
        return;
      }
      currentSettings = mergeSettings(changes.settings.newValue);
    });
  }

  async function init() {
    await refreshSettingsCache();
    wireSettingsUpdates();
    wireOutputObserver();
    wireCopyListener();
    wirePasteListener();
  }

  init().catch((error) => {
    console.error("AI Dev Coach interaction tracker initialization error", error);
  });
})();
