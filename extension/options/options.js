const DEFAULT_SETTINGS = {
  enableCoach: true,
  promptListenerEnabled: false,
  behaviorMonitorEnabled: false,
  readPromptContentEnabled: false,
  readCopiedContentEnabled: false,
  readBeforeCopyEnabled: false,
  showOutputCountdown: false,
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
const monitoringConsentCard = document.getElementById("monitoringConsentCard");
const acceptMonitoringConsentBtn = document.getElementById("acceptMonitoringConsentBtn");
const monitoringConsentStatus = document.getElementById("monitoringConsentStatus");
const enterprisePolicyCard = document.getElementById("enterprisePolicyCard");
const enterprisePolicySummary = document.getElementById("enterprisePolicySummary");
const enterprisePolicyDetails = document.getElementById("enterprisePolicyDetails");
const statusNode = document.getElementById("status");

const CONTROL_MAP = {
  enableCoach,
  promptListenerEnabled,
  behaviorMonitorEnabled,
  readPromptContentEnabled,
  readCopiedContentEnabled,
  readBeforeCopyEnabled,
  showOutputCountdown,
  strictMode,
  dependencyWarningThreshold: dependencyThreshold,
  pasteThreshold,
  longCopyThreshold,
  minReadBeforeCopySeconds,
  overlayDurationMs: overlayDuration
};

let currentEnterpriseState = null;
let currentMonitoringConsent = null;

function getManagedConfig() {
  const config = window.AIDevCoachManagedConfig;
  if (!config || typeof config.normalizeMonitoringConsent !== "function") {
    throw new Error("Managed config module is unavailable.");
  }

  return config;
}

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

function normalizeEnterpriseState(rawState) {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  return {
    consentAccepted: state.consentAccepted === true,
    consentRequired: state.consentRequired !== false,
    lockMonitoringControls: state.lockMonitoringControls === true,
    allowedHostLabels: Array.isArray(state.allowedHostLabels) ? state.allowedHostLabels : [],
    managedKeys: Array.isArray(state.managedKeys) ? state.managedKeys : [],
    managedSettingLabels: Array.isArray(state.managedSettingLabels)
      ? state.managedSettingLabels
      : [],
    hasManagedPolicy: state.hasManagedPolicy === true
  };
}

function fillSettings(settings) {
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
}

function applyControlAvailability(enterpriseState, monitoringConsent) {
  const config = getManagedConfig();
  const managedState = normalizeEnterpriseState(enterpriseState);
  const consent = config.normalizeMonitoringConsent(monitoringConsent);
  const managedKeys = new Set(managedState.managedKeys);
  const baseDisabled = {};

  Object.entries(CONTROL_MAP).forEach(([key, element]) => {
    const disabled =
      managedState.lockMonitoringControls ||
      managedKeys.has(key) ||
      (!consent.accepted && config.isMonitoringSettingKey(key));

    baseDisabled[key] = disabled;
    element.disabled = disabled;
  });

  const behaviorEnabled = behaviorMonitorEnabled.checked;
  const readBeforeEnabled = behaviorEnabled && readBeforeCopyEnabled.checked;

  readCopiedContentEnabled.disabled =
    baseDisabled.readCopiedContentEnabled || !behaviorEnabled;
  readBeforeCopyEnabled.disabled =
    baseDisabled.readBeforeCopyEnabled || !behaviorEnabled;
  showOutputCountdown.disabled =
    baseDisabled.showOutputCountdown || !behaviorEnabled || !readBeforeEnabled;
  longCopyThreshold.disabled =
    baseDisabled.longCopyThreshold || !behaviorEnabled;
  minReadBeforeCopySeconds.disabled =
    baseDisabled.minReadBeforeCopySeconds || !behaviorEnabled || !readBeforeEnabled;
  pasteThreshold.disabled =
    baseDisabled.pasteThreshold || !behaviorEnabled;

  monitoringConsentCard.classList.toggle("hidden", consent.accepted);
  if (!consent.accepted) {
    monitoringConsentStatus.textContent =
      "Monitoring controls stay locked until you explicitly allow them in this browser profile.";
    monitoringConsentStatus.className = "status status--error";
  } else {
    monitoringConsentStatus.textContent = "";
    monitoringConsentStatus.className = "status";
  }

  enterprisePolicyCard.classList.toggle("hidden", !managedState.hasManagedPolicy);
  if (managedState.hasManagedPolicy) {
    const summaryParts = [];
    if (managedState.allowedHostLabels.length > 0) {
      summaryParts.push(`Allowed hosts: ${managedState.allowedHostLabels.join(", ")}.`);
    }
    if (managedState.lockMonitoringControls) {
      summaryParts.push("All monitoring controls are locked by enterprise policy.");
    }

    enterprisePolicySummary.textContent =
      summaryParts.join(" ") || "Enterprise policy is active for this extension.";
    enterprisePolicyDetails.textContent =
      managedState.managedSettingLabels.length > 0
        ? `Admin-managed settings: ${managedState.managedSettingLabels.join(", ")}.`
        : "";
  } else {
    enterprisePolicySummary.textContent = "";
    enterprisePolicyDetails.textContent = "";
  }
}

async function loadSettings() {
  const data = await storageGet([
    "settings",
    "effectiveSettings",
    "enterpriseState",
    "monitoringConsent"
  ]);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings || {}),
    ...(data.effectiveSettings || {})
  };

  currentEnterpriseState = data.enterpriseState;
  currentMonitoringConsent = data.monitoringConsent;
  fillSettings(settings);
  applyControlAvailability(currentEnterpriseState, currentMonitoringConsent);
}

function buildEditableSettings() {
  return {
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
    longCopyThreshold: clamp(
      longCopyThreshold.value,
      180,
      4000,
      DEFAULT_SETTINGS.longCopyThreshold
    ),
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
}

async function acceptMonitoringConsent() {
  const config = getManagedConfig();
  const consent = config.normalizeMonitoringConsent({
    version: config.CONSENT_VERSION,
    accepted: true,
    updatedAt: Date.now()
  });

  await storageSet({ monitoringConsent: consent });
  monitoringConsentStatus.textContent = "Monitoring controls unlocked for this browser profile.";
  monitoringConsentStatus.className = "status status--ok";
}

async function saveSettings() {
  const config = getManagedConfig();
  const data = await storageGet(["settings", "enterpriseState", "monitoringConsent"]);
  const enterpriseState = normalizeEnterpriseState(data.enterpriseState);
  const monitoringConsent = config.normalizeMonitoringConsent(data.monitoringConsent);

  if (!monitoringConsent.accepted) {
    setStatus("Accept monitoring consent before changing coaching settings.", false);
    return;
  }

  if (enterpriseState.lockMonitoringControls) {
    setStatus("Settings are locked by enterprise policy.", false);
    return;
  }

  const previousSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const editableSettings = buildEditableSettings();
  const nextSettings = { ...previousSettings, ...editableSettings };

  enterpriseState.managedKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(previousSettings, key)) {
      nextSettings[key] = previousSettings[key];
    }
  });

  await storageSet({ settings: nextSettings });
  await loadSettings();
  setStatus("Settings saved.", true);
}

async function resetStats() {
  await storageSet({ stats: { ...DEFAULT_STATS } });
  setStatus("Habit stats reset.", true);
}

function wireEvents() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName !== "local" ||
      (!changes.settings &&
        !changes.effectiveSettings &&
        !changes.enterpriseState &&
        !changes.monitoringConsent)
    ) {
      return;
    }

    loadSettings().catch(() => {
      setStatus("Failed to refresh settings.", false);
    });
  });

  [behaviorMonitorEnabled, readBeforeCopyEnabled].forEach((control) => {
    control.addEventListener("change", () => {
      applyControlAvailability(currentEnterpriseState, currentMonitoringConsent);
    });
  });

  acceptMonitoringConsentBtn.addEventListener("click", () => {
    acceptMonitoringConsent()
      .then(() => loadSettings())
      .catch(() => {
        monitoringConsentStatus.textContent = "Failed to store monitoring consent.";
        monitoringConsentStatus.className = "status status--error";
      });
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
