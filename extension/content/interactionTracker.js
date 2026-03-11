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

  function showWarning(message, settings) {
    if (window.AIDevCoachOverlay && typeof window.AIDevCoachOverlay.show === "function") {
      window.AIDevCoachOverlay.show(message, "warning", settings.overlayDurationMs || 6500);
      return;
    }

    alert(message);
  }

  async function incrementLargePasteCount() {
    const data = await storageGet(["stats"]);
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
    stats.largePastes += 1;

    await storageSet({ stats });
    return stats.largePastes;
  }

  document.addEventListener("paste", async (event) => {
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
        settings
      );
    }
  });
})();
