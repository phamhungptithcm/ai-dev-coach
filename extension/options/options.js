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

const DEFAULT_STATS = {
  aiRequests: 0,
  manualAttempts: 0,
  largePastes: 0,
  aiCopies: 0,
  fastAiCopies: 0,
  badPrompts: 0,
  shortcutPrompts: 0
};

const enableCoach = document.getElementById("enableCoach");
const promptListenerEnabled = document.getElementById("promptListenerEnabled");
const behaviorMonitorEnabled = document.getElementById("behaviorMonitorEnabled");
const readPromptContentEnabled = document.getElementById("readPromptContentEnabled");
const readCopiedContentEnabled = document.getElementById("readCopiedContentEnabled");
const readBeforeCopyEnabled = document.getElementById("readBeforeCopyEnabled");
const showOutputCountdown = document.getElementById("showOutputCountdown");
const strictMode = document.getElementById("strictMode");
const dependencyThreshold = document.getElementById("dependencyThreshold");
const pasteThreshold = document.getElementById("pasteThreshold");
const longCopyThreshold = document.getElementById("longCopyThreshold");
const minReadBeforeCopySeconds = document.getElementById("minReadBeforeCopySeconds");
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

function syncControlAvailability() {
  const behaviorEnabled = behaviorMonitorEnabled.checked;
  const readBeforeEnabled = behaviorEnabled && readBeforeCopyEnabled.checked;

  readCopiedContentEnabled.disabled = !behaviorEnabled;
  readBeforeCopyEnabled.disabled = !behaviorEnabled;
  showOutputCountdown.disabled = !readBeforeEnabled;
  longCopyThreshold.disabled = !behaviorEnabled;
  minReadBeforeCopySeconds.disabled = !readBeforeEnabled;
  pasteThreshold.disabled = !behaviorEnabled;
}

async function loadSettings() {
  const data = await storageGet(["settings"]);
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

  enableCoach.checked = !!settings.enableCoach;
  promptListenerEnabled.checked = !!settings.promptListenerEnabled;
  behaviorMonitorEnabled.checked = !!settings.behaviorMonitorEnabled;
  readPromptContentEnabled.checked = !!settings.readPromptContentEnabled;
  readCopiedContentEnabled.checked = !!settings.readCopiedContentEnabled;
  readBeforeCopyEnabled.checked = !!settings.readBeforeCopyEnabled;
  showOutputCountdown.checked = !!settings.showOutputCountdown;
  strictMode.checked = !!settings.strictMode;
  dependencyThreshold.value = settings.dependencyWarningThreshold;
  pasteThreshold.value = settings.pasteThreshold;
  longCopyThreshold.value = settings.longCopyThreshold;
  minReadBeforeCopySeconds.value = settings.minReadBeforeCopySeconds;
  overlayDuration.value = settings.overlayDurationMs;
  syncControlAvailability();
}

async function saveSettings() {
  const settings = {
    enableCoach: enableCoach.checked,
    promptListenerEnabled: promptListenerEnabled.checked,
    behaviorMonitorEnabled: behaviorMonitorEnabled.checked,
    readPromptContentEnabled: readPromptContentEnabled.checked,
    readCopiedContentEnabled: readCopiedContentEnabled.checked,
    readBeforeCopyEnabled: readBeforeCopyEnabled.checked,
    showOutputCountdown: showOutputCountdown.checked,
    strictMode: strictMode.checked,
    dependencyWarningThreshold: clamp(
      dependencyThreshold.value,
      40,
      95,
      DEFAULT_SETTINGS.dependencyWarningThreshold
    ),
    pasteThreshold: clamp(pasteThreshold.value, 120, 2000, DEFAULT_SETTINGS.pasteThreshold),
    longCopyThreshold: clamp(longCopyThreshold.value, 180, 4000, DEFAULT_SETTINGS.longCopyThreshold),
    minReadBeforeCopySeconds: clamp(
      minReadBeforeCopySeconds.value,
      5,
      180,
      DEFAULT_SETTINGS.minReadBeforeCopySeconds
    ),
    overlayDurationMs: clamp(
      overlayDuration.value,
      9000,
      20000,
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
  behaviorMonitorEnabled.addEventListener("change", () => {
    syncControlAvailability();
  });

  readBeforeCopyEnabled.addEventListener("change", () => {
    syncControlAvailability();
  });

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
