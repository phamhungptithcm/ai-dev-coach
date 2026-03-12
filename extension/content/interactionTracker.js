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
  let lastWarningAt = 0;

  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function storageSet(payload) {
    return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
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

  async function incrementLargePasteCount() {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    stats.largePastes += 1;

    await storageSet({ stats });
    return stats.largePastes;
  }

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

    if (pastedText.length < settings.pasteThreshold || !looksLikeCode(pastedText)) {
      return;
    }

    const largePasteCount = await incrementLargePasteCount();

    showWarning(
      "Large code paste detected. Read, explain, and test the snippet before using it.",
      settings
    );

    if (largePasteCount >= 3) {
      showWarning(
        "Pattern alert: multiple large pastes detected. Switch to guided hints instead of copy-paste answers.",
        settings,
        { force: true }
      );
    }
  });
})();
