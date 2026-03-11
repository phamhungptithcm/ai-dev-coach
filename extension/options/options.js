const DEFAULT_SETTINGS = {
  enableCoach: true,
  strictMode: true,
  dependencyWarningThreshold: 70,
  pasteThreshold: 320,
  overlayDurationMs: 6500
};

const DEFAULT_STATS = {
  aiRequests: 0,
  manualAttempts: 0,
  largePastes: 0
};

const enableCoach = document.getElementById("enableCoach");
const strictMode = document.getElementById("strictMode");
const dependencyThreshold = document.getElementById("dependencyThreshold");
const pasteThreshold = document.getElementById("pasteThreshold");
const overlayDuration = document.getElementById("overlayDuration");
const statusNode = document.getElementById("status");

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

function setStatus(message, ok) {
  statusNode.textContent = message || "";
  statusNode.classList.remove("status--ok", "status--error");

  if (!message) {
    return;
  }

  statusNode.classList.add(ok ? "status--ok" : "status--error");
}

function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

async function loadSettings() {
  const data = await storageGet(["settings"]);
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

  enableCoach.checked = !!settings.enableCoach;
  strictMode.checked = !!settings.strictMode;
  dependencyThreshold.value = settings.dependencyWarningThreshold;
  pasteThreshold.value = settings.pasteThreshold;
  overlayDuration.value = settings.overlayDurationMs;
}

async function saveSettings() {
  const settings = {
    enableCoach: enableCoach.checked,
    strictMode: strictMode.checked,
    dependencyWarningThreshold: clamp(
      dependencyThreshold.value,
      40,
      95,
      DEFAULT_SETTINGS.dependencyWarningThreshold
    ),
    pasteThreshold: clamp(pasteThreshold.value, 120, 2000, DEFAULT_SETTINGS.pasteThreshold),
    overlayDurationMs: clamp(
      overlayDuration.value,
      2500,
      15000,
      DEFAULT_SETTINGS.overlayDurationMs
    )
  };

  await storageSet({ settings });
  await loadSettings();
  setStatus("Settings saved.", true);
}

async function resetStats() {
  await storageSet({ stats: { ...DEFAULT_STATS } });
  setStatus("Habit stats reset.", true);
}

function wireEvents() {
  document.getElementById("saveBtn").addEventListener("click", () => {
    saveSettings().catch(() => setStatus("Failed to save settings.", false));
  });

  document.getElementById("resetStatsBtn").addEventListener("click", () => {
    resetStats().catch(() => setStatus("Failed to reset stats.", false));
  });
}

async function init() {
  wireEvents();
  await loadSettings();
}

init().catch(() => {
  setStatus("Failed to initialize settings page.", false);
});
