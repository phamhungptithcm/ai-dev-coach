(() => {
  const DEFAULT_SETTINGS = {
    enableCoach: true,
    pasteThreshold: 320,
    overlayDurationMs: 6500
  };

  const DEFAULT_STATS = {
    aiRequests: 0,
    manualAttempts: 0,
    largePastes: 0
  };

  const WARNING_COOLDOWN_MS = 3000;
  const LONG_COPY_THRESHOLD = 360;
  const COPY_TRACE_TTL_MS = 8 * 60 * 1000;
  let lastWarningAt = 0;
  let recentAiCopy = {
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

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function buildTextSignature(text) {
    const normalized = normalizeText(text);
    return `${normalized.length}:${normalized.slice(0, 90)}:${normalized.slice(-50)}`;
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

  function hasLargeCopiedAiOutput(text) {
    if (!text || text.length < LONG_COPY_THRESHOLD) {
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

  function showWarning(message, settings, options = {}) {
    const force = !!options.force;
    const now = Date.now();
    if (!force && now - lastWarningAt < WARNING_COOLDOWN_MS) {
      return;
    }
    lastWarningAt = now;

    if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
      window.AIDevCoachOverlay.show(message, "warning", settings.overlayDurationMs || 6500);
      return;
    }

    console.warn("AI Dev Coach warning:", message);
  }

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
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
    const allowedTypes = new Set([
      "text",
      "search",
      "email",
      "url",
      "tel",
      "number",
      "password"
    ]);

    return (
      allowedTypes.has(inputType) &&
      !target.hasAttribute("disabled") &&
      !target.hasAttribute("readonly")
    );
  }

  function isLikelyAssistantOutputSelection(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    if (isEditableTarget(target)) {
      return false;
    }

    if (target.closest("form,[data-testid*='composer'],[class*='composer']")) {
      return false;
    }

    const assistantMarkers = [
      "[data-message-author-role='assistant']",
      "[data-author='assistant']",
      "[data-role='assistant']",
      "[data-testid*='assistant']",
      "[class*='assistant']",
      "[class*='response']"
    ];

    if (assistantMarkers.some((selector) => !!target.closest(selector))) {
      return true;
    }

    // Fallback: on AI chat pages, long copies from non-editable regions are typically model output.
    return true;
  }

  function rememberAiCopy(text) {
    recentAiCopy = {
      at: Date.now(),
      signature: buildTextSignature(text),
      chars: text.length
    };
  }

  async function incrementLargePasteCount() {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    stats.largePastes += 1;

    await storageSet({ stats });
    return stats.largePastes;
  }

  document.addEventListener(
    "copy",
    (event) => {
      const selectedText = normalizeText(window.getSelection()?.toString() || "");
      if (!selectedText || selectedText.length < LONG_COPY_THRESHOLD) {
        return;
      }

      const sourceElement =
        event.target instanceof HTMLElement
          ? event.target
          : window.getSelection()?.anchorNode?.parentElement;

      if (!(sourceElement instanceof HTMLElement)) {
        return;
      }

      if (!isLikelyAssistantOutputSelection(sourceElement)) {
        return;
      }

      rememberAiCopy(selectedText);
    },
    true
  );

  document.addEventListener("paste", async (event) => {
    if (!isEditableTarget(event.target)) {
      return;
    }

    const clipboard = event.clipboardData;
    if (!clipboard) {
      return;
    }

    const pastedText = clipboard.getData("text") || "";

    const data = await storageGet(["settings"]);
    const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

    if (!settings.enableCoach) {
      return;
    }

    const isLargePaste = pastedText.length >= settings.pasteThreshold;
    if (!isLargePaste) {
      return;
    }

    const pastedCopiedAiOutput = hasLargeCopiedAiOutput(pastedText);
    const pastedCode = looksLikeCode(pastedText);

    if (!pastedCopiedAiOutput && !pastedCode) {
      return;
    }

    const largePasteCount = await incrementLargePasteCount();

    if (pastedCopiedAiOutput) {
      showWarning(
        "You pasted a long AI answer. Pause and rewrite it in your own words before sending.",
        settings
      );

      showWarning(
        "Before send: add your reasoning, assumptions, and one verification step.",
        settings,
        { force: true }
      );
    } else {
      showWarning(
        "Large code paste detected. Read, explain, and test the snippet before using it.",
        settings
      );
    }

    if (largePasteCount >= 3) {
      showWarning(
        "Pattern alert: multiple large pastes detected. Switch to guided hints instead of copy-paste answers.",
        settings,
        { force: true }
      );
    }
  });
})();
