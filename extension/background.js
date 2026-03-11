const DEFAULT_SETTINGS = {
  enableCoach: true,
  strictMode: true,
  dependencyWarningThreshold: 70,
  pasteThreshold: 320,
  overlayDurationMs: 6500
};

const DEFAULT_PROFILE = {
  role: "",
  skill: "",
  habitGoals: ""
};

const DEFAULT_STATS = {
  aiRequests: 0,
  manualAttempts: 0,
  largePastes: 0
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

async function ensureDefaults() {
  const data = await chrome.storage.local.get([
    "settings",
    "profile",
    "stats",
    "selectedTemplate"
  ]);

  const mergedSettings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const mergedProfile = { ...DEFAULT_PROFILE, ...(data.profile || {}) };
  const mergedStats = { ...DEFAULT_STATS, ...(data.stats || {}) };

  const selectedTemplate = VALID_TEMPLATES.has(data.selectedTemplate)
    ? data.selectedTemplate
    : DEFAULT_TEMPLATE;

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
