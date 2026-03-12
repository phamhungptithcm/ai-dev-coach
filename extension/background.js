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

const DEFAULT_PROFILE = {
  role: "",
  roleKey: "",
  skill: "",
  habitGoals: ""
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

const DEFAULT_TEMPLATE = "debugging";
const VALID_TEMPLATES = new Set([
  "debugging",
  "code_review",
  "system_design",
  "refactoring",
  "performance_optimization",
  "learning"
]);

function mergeDefaults(defaults, current) {
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    return { ...defaults };
  }
  return { ...defaults, ...current };
}

function hasChanged(merged, current) {
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    return true;
  }
  return Object.keys(merged).some((key) => merged[key] !== current[key]);
}

async function ensureDefaults() {
  const data = await chrome.storage.local.get([
    "settings",
    "profile",
    "stats",
    "selectedTemplate"
  ]);

  const mergedSettings = mergeDefaults(DEFAULT_SETTINGS, data.settings);
  const mergedProfile = mergeDefaults(DEFAULT_PROFILE, data.profile);
  const mergedStats = mergeDefaults(DEFAULT_STATS, data.stats);

  const selectedTemplate = VALID_TEMPLATES.has(data.selectedTemplate)
    ? data.selectedTemplate
    : DEFAULT_TEMPLATE;

  const shouldUpdate =
    hasChanged(mergedSettings, data.settings) ||
    hasChanged(mergedProfile, data.profile) ||
    hasChanged(mergedStats, data.stats) ||
    selectedTemplate !== data.selectedTemplate;

  if (!shouldUpdate) {
    return;
  }

  const nextState = {
    settings: mergedSettings,
    profile: mergedProfile,
    stats: mergedStats,
    selectedTemplate
  };

  await chrome.storage.local.set(nextState);
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults()
    .then(() => {
      console.log("AI Dev Coach installed and initialized");
    })
    .catch((error) => {
      console.error("AI Dev Coach initialization error", error);
    });
});

chrome.runtime.onStartup.addListener(() => {
  ensureDefaults().catch((error) => {
    console.error("AI Dev Coach startup sync error", error);
  });
});
