try {
  importScripts("shared/managedConfig.js");
} catch (error) {
  console.error("AI Dev Coach managed config bootstrap failed", error);
}

const managedConfig = globalThis.AIDevCoachManagedConfig;

const HOST_MATCHES = [
  "https://chat.openai.com/*",
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
  "https://grok.com/*",
  "https://chat.deepseek.com/*"
];

const SUPPORTED_URL_PATTERNS = [
  /https:\/\/chat\.openai\.com\//i,
  /https:\/\/chatgpt\.com\//i,
  /https:\/\/claude\.ai\//i,
  /https:\/\/gemini\.google\.com\//i,
  /https:\/\/grok\.com\//i,
  /https:\/\/chat\.deepseek\.com\//i
];

const STORAGE_KEYS = {
  effectiveSettings: "effectiveSettings",
  enterpriseState: "enterpriseState",
  monitoringConsent: "monitoringConsent"
};

const DYNAMIC_SCRIPT_IDS = {
  style: "ai-dev-coach-style",
  promptTools: "ai-dev-coach-prompt-tools",
  promptMonitor: "ai-dev-coach-prompt-monitor",
  behaviorMonitor: "ai-dev-coach-behavior-monitor",
  liveBubble: "ai-dev-coach-live-bubble"
};

const QUICK_BUILDER_BUNDLE = {
  css: ["styles/overlay.css"],
  js: [
    "content/aiOverlay.js",
    "shared/platformAdapter.js",
    "shared/roleCoaching.js",
    "shared/promptLibrarySource.js",
    "shared/promptMarketplace.js",
    "shared/promptSuggestionEngine.js",
    "content/quickBuilder.js"
  ]
};

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
const DEFAULT_MONITORING_CONSENT = managedConfig
  ? managedConfig.normalizeMonitoringConsent(null)
  : { version: 1, accepted: false, updatedAt: 0 };

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

function hasStructuralChange(nextValue, currentValue) {
  return JSON.stringify(nextValue) !== JSON.stringify(currentValue);
}

async function ensureDefaults() {
  const data = await chrome.storage.local.get([
    "settings",
    "profile",
    "stats",
    "selectedTemplate",
    STORAGE_KEYS.monitoringConsent,
    STORAGE_KEYS.effectiveSettings,
    STORAGE_KEYS.enterpriseState
  ]);

  const mergedSettings = mergeDefaults(DEFAULT_SETTINGS, data.settings);
  const mergedProfile = mergeDefaults(DEFAULT_PROFILE, data.profile);
  const mergedStats = mergeDefaults(DEFAULT_STATS, data.stats);
  const mergedConsent = managedConfig
    ? managedConfig.normalizeMonitoringConsent(data[STORAGE_KEYS.monitoringConsent])
    : { ...DEFAULT_MONITORING_CONSENT };

  const selectedTemplate = VALID_TEMPLATES.has(data.selectedTemplate)
    ? data.selectedTemplate
    : DEFAULT_TEMPLATE;

  const shouldUpdate =
    hasChanged(mergedSettings, data.settings) ||
    hasChanged(mergedProfile, data.profile) ||
    hasChanged(mergedStats, data.stats) ||
    hasStructuralChange(mergedConsent, data[STORAGE_KEYS.monitoringConsent]) ||
    selectedTemplate !== data.selectedTemplate;

  const nextState = {
    settings: mergedSettings,
    profile: mergedProfile,
    stats: mergedStats,
    selectedTemplate,
    [STORAGE_KEYS.monitoringConsent]: mergedConsent,
    [STORAGE_KEYS.effectiveSettings]: data[STORAGE_KEYS.effectiveSettings],
    [STORAGE_KEYS.enterpriseState]: data[STORAGE_KEYS.enterpriseState]
  };

  if (shouldUpdate) {
    await chrome.storage.local.set({
      settings: mergedSettings,
      profile: mergedProfile,
      stats: mergedStats,
      selectedTemplate,
      [STORAGE_KEYS.monitoringConsent]: mergedConsent
    });
  }

  return nextState;
}

async function readManagedPolicy() {
  try {
    return await chrome.storage.managed.get(null);
  } catch (error) {
    console.warn("AI Dev Coach managed policy read skipped", error);
    return {};
  }
}

function buildDynamicContentScripts(settings, enterpriseState) {
  const scripts = [];
  const matches = managedConfig
    ? managedConfig.getAllowedHostMatches({ allowedHosts: enterpriseState?.allowedHosts || [] })
    : HOST_MATCHES;

  if (!matches.length) {
    return scripts;
  }

  const promptToolsEnabled = settings.enableCoach !== false;
  const promptMonitorEnabled = !!settings.promptListenerEnabled;
  const behaviorMonitorEnabled = !!settings.behaviorMonitorEnabled;
  const styleEnabled =
    promptToolsEnabled || promptMonitorEnabled || (!!settings.enableCoach && behaviorMonitorEnabled);

  if (styleEnabled) {
    scripts.push({
      id: DYNAMIC_SCRIPT_IDS.style,
      matches,
      css: ["styles/overlay.css"],
      runAt: "document_idle",
      persistAcrossSessions: true
    });
  }

  if (promptToolsEnabled) {
    scripts.push({
      id: DYNAMIC_SCRIPT_IDS.promptTools,
      matches,
      js: QUICK_BUILDER_BUNDLE.js,
      runAt: "document_idle",
      persistAcrossSessions: true
    });
  }

  if (promptMonitorEnabled) {
    scripts.push({
      id: DYNAMIC_SCRIPT_IDS.promptMonitor,
      matches,
      js: [
        "content/aiOverlay.js",
        "shared/platformAdapter.js",
        "shared/roleCoaching.js",
        "shared/promptQualityEngine.js",
        "shared/learningAnalytics.js",
        "content/secretDetection.js",
        "shared/promptLinter.js",
        "content/monitor.js"
      ],
      runAt: "document_idle",
      persistAcrossSessions: true
    });
  }

  if (behaviorMonitorEnabled) {
    scripts.push({
      id: DYNAMIC_SCRIPT_IDS.behaviorMonitor,
      matches,
      js: ["content/aiOverlay.js", "content/interactionTracker.js"],
      runAt: "document_idle",
      persistAcrossSessions: true
    });
  }

  if (!!settings.enableCoach && (promptMonitorEnabled || behaviorMonitorEnabled)) {
    scripts.push({
      id: DYNAMIC_SCRIPT_IDS.liveBubble,
      matches,
      js: ["content/liveCoachBubble.js"],
      runAt: "document_idle",
      persistAcrossSessions: true
    });
  }

  return scripts;
}

async function syncDynamicContentScripts(rawSettings, enterpriseState) {
  if (!chrome.scripting?.registerContentScripts) {
    return;
  }

  const scriptIds = Object.values(DYNAMIC_SCRIPT_IDS);
  const desiredScripts = buildDynamicContentScripts(
    mergeDefaults(DEFAULT_SETTINGS, rawSettings),
    enterpriseState
  );

  try {
    const registeredScripts = await chrome.scripting.getRegisteredContentScripts({
      ids: scriptIds
    });

    if (registeredScripts.length > 0) {
      await chrome.scripting.unregisterContentScripts({
        ids: registeredScripts.map((script) => script.id)
      });
    }

    if (desiredScripts.length > 0) {
      await chrome.scripting.registerContentScripts(desiredScripts);
    }
  } catch (error) {
    console.error("AI Dev Coach content script sync error", error);
  }
}

async function syncEnterpriseState() {
  const localState = await ensureDefaults();
  const rawManagedPolicy = await readManagedPolicy();

  const enterpriseBundle = managedConfig
    ? managedConfig.buildEnterpriseState(
        DEFAULT_SETTINGS,
        localState.settings,
        rawManagedPolicy,
        localState[STORAGE_KEYS.monitoringConsent]
      )
    : {
        effectiveSettings: localState.settings,
        monitoringConsent: localState[STORAGE_KEYS.monitoringConsent] || DEFAULT_MONITORING_CONSENT,
        enterpriseState: {
          consentAccepted: true,
          consentRequired: false,
          consentVersion: DEFAULT_MONITORING_CONSENT.version,
          lockMonitoringControls: false,
          allowedHosts: [],
          allowedHostLabels: [],
          managedKeys: [],
          managedSettingLabels: [],
          hasManagedPolicy: false
        }
      };

  const { effectiveSettings, enterpriseState, monitoringConsent } = enterpriseBundle;
  const payload = {};

  if (hasStructuralChange(effectiveSettings, localState[STORAGE_KEYS.effectiveSettings])) {
    payload[STORAGE_KEYS.effectiveSettings] = effectiveSettings;
  }

  if (hasStructuralChange(enterpriseState, localState[STORAGE_KEYS.enterpriseState])) {
    payload[STORAGE_KEYS.enterpriseState] = enterpriseState;
  }

  if (hasStructuralChange(monitoringConsent, localState[STORAGE_KEYS.monitoringConsent])) {
    payload[STORAGE_KEYS.monitoringConsent] = monitoringConsent;
  }

  if (Object.keys(payload).length > 0) {
    await chrome.storage.local.set(payload);
  }

  await syncDynamicContentScripts(effectiveSettings, enterpriseState);

  return {
    ...localState,
    [STORAGE_KEYS.effectiveSettings]: effectiveSettings,
    [STORAGE_KEYS.enterpriseState]: enterpriseState,
    [STORAGE_KEYS.monitoringConsent]: monitoringConsent
  };
}

function isSupportedUrl(url) {
  return typeof url === "string" && SUPPORTED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function isAllowedUrl(url, enterpriseState) {
  if (!isSupportedUrl(url)) {
    return false;
  }

  if (!managedConfig) {
    return true;
  }

  return managedConfig.isUrlAllowed(url, { allowedHosts: enterpriseState?.allowedHosts || [] });
}

async function getRuntimeContext() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.effectiveSettings,
    STORAGE_KEYS.enterpriseState,
    STORAGE_KEYS.monitoringConsent
  ]);

  if (!data[STORAGE_KEYS.effectiveSettings] || !data[STORAGE_KEYS.enterpriseState]) {
    return syncEnterpriseState();
  }

  return {
    [STORAGE_KEYS.effectiveSettings]: mergeDefaults(
      DEFAULT_SETTINGS,
      data[STORAGE_KEYS.effectiveSettings]
    ),
    [STORAGE_KEYS.enterpriseState]: data[STORAGE_KEYS.enterpriseState],
    [STORAGE_KEYS.monitoringConsent]: data[STORAGE_KEYS.monitoringConsent] || DEFAULT_MONITORING_CONSENT
  };
}

async function getActiveSupportedTabContext() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const [activeTab] = tabs || [];

  if (!activeTab || typeof activeTab.id !== "number") {
    return {
      tab: null,
      error: "Open a supported AI chat page first."
    };
  }

  if (!isSupportedUrl(activeTab.url || "")) {
    return {
      tab: null,
      error: "Open a supported AI chat page first."
    };
  }

  const runtimeContext = await getRuntimeContext();
  if (!isAllowedUrl(activeTab.url || "", runtimeContext[STORAGE_KEYS.enterpriseState])) {
    return {
      tab: null,
      error: "This AI host is disabled by enterprise policy."
    };
  }

  return {
    tab: activeTab,
    error: ""
  };
}

async function ensureQuickBuilderInjected(tabId) {
  if (typeof tabId !== "number" || !chrome.scripting?.executeScript) {
    return;
  }

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: QUICK_BUILDER_BUNDLE.css
  });

  await chrome.scripting.executeScript({
    target: { tabId },
    files: QUICK_BUILDER_BUNDLE.js
  });
}

async function openQuickBuilderOnActiveTab() {
  const { tab } = await getActiveSupportedTabContext();
  if (!tab) {
    return;
  }

  await ensureQuickBuilderInjected(tab.id);
  await chrome.tabs.sendMessage(tab.id, {
    type: "ai-dev-coach:open-quick-builder"
  });
}

async function runMarketplacePromptOnActiveTab(message) {
  const { tab, error } = await getActiveSupportedTabContext();
  if (!tab) {
    return {
      ok: false,
      error: error || "Open a supported AI chat page first."
    };
  }

  await ensureQuickBuilderInjected(tab.id);

  try {
    return (
      (await chrome.tabs.sendMessage(tab.id, {
        type: "ai-dev-coach:prompt-marketplace-run",
        prompt: message.prompt || "",
        action: message.action || "insert"
      })) || {
        ok: false,
        error: "No response from the active tab."
      }
    );
  } catch (errorResponse) {
    return {
      ok: false,
      error: errorResponse?.message || "Unable to reach the current tab."
    };
  }
}

async function initializeExtension(reason) {
  try {
    await syncEnterpriseState();
    console.log(`AI Dev Coach ${reason} complete`);
  } catch (error) {
    console.error(`AI Dev Coach ${reason} error`, error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension("install");
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension("startup");
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle_prompt_builder") {
    return;
  }

  openQuickBuilderOnActiveTab().catch((error) => {
    console.error("AI Dev Coach quick builder command error", error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "ai-dev-coach:run-marketplace-prompt") {
    return undefined;
  }

  runMarketplacePromptOnActiveTab(message)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error?.message || "Unable to run marketplace prompt."
      });
    });

  return true;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  const shouldSync =
    (areaName === "local" &&
      (changes.settings || changes[STORAGE_KEYS.monitoringConsent])) ||
    areaName === "managed";

  if (!shouldSync) {
    return;
  }

  syncEnterpriseState().catch((error) => {
    console.error("AI Dev Coach enterprise sync error", error);
  });
});
