(() => {
  const CONSENT_VERSION = 1;

  const POLICY_TO_SETTING_KEY = {
    EnableCoach: "enableCoach",
    PromptListenerEnabled: "promptListenerEnabled",
    BehaviorMonitorEnabled: "behaviorMonitorEnabled",
    ReadPromptContentEnabled: "readPromptContentEnabled",
    ReadCopiedContentEnabled: "readCopiedContentEnabled",
    ReadBeforeCopyEnabled: "readBeforeCopyEnabled",
    ShowOutputCountdown: "showOutputCountdown",
    StrictMode: "strictMode",
    DependencyWarningThreshold: "dependencyWarningThreshold",
    PasteThreshold: "pasteThreshold",
    LongCopyThreshold: "longCopyThreshold",
    MinReadBeforeCopySeconds: "minReadBeforeCopySeconds",
    OverlayDurationMs: "overlayDurationMs"
  };

  const SETTING_METADATA = {
    enableCoach: { label: "Coaching overlays", kind: "boolean" },
    promptListenerEnabled: { label: "Prompt listener", kind: "boolean" },
    behaviorMonitorEnabled: { label: "Behavior monitor", kind: "boolean" },
    readPromptContentEnabled: { label: "Prompt content reading", kind: "boolean" },
    readCopiedContentEnabled: { label: "Copied content reading", kind: "boolean" },
    readBeforeCopyEnabled: { label: "Read-before-copy reminder", kind: "boolean" },
    showOutputCountdown: { label: "Output countdown reminder", kind: "boolean" },
    strictMode: { label: "Strict mode", kind: "boolean" },
    dependencyWarningThreshold: { label: "AI dependency threshold", kind: "number", min: 40, max: 95 },
    pasteThreshold: { label: "Large paste threshold", kind: "number", min: 120, max: 2000 },
    longCopyThreshold: { label: "Long copy threshold", kind: "number", min: 180, max: 4000 },
    minReadBeforeCopySeconds: { label: "Minimum read time", kind: "number", min: 5, max: 180 },
    overlayDurationMs: { label: "Overlay duration", kind: "number", min: 9000, max: 20000 }
  };

  const SETTING_KEYS = Object.values(POLICY_TO_SETTING_KEY);
  const MONITORING_SETTING_KEYS = [
    "promptListenerEnabled",
    "behaviorMonitorEnabled",
    "readPromptContentEnabled",
    "readCopiedContentEnabled",
    "readBeforeCopyEnabled",
    "showOutputCountdown"
  ];

  const SUPPORTED_HOSTS = [
    {
      label: "ChatGPT",
      hosts: ["chatgpt.com"],
      matchPattern: "https://chatgpt.com/*"
    },
    {
      label: "ChatGPT Legacy",
      hosts: ["chat.openai.com"],
      matchPattern: "https://chat.openai.com/*"
    },
    {
      label: "Claude",
      hosts: ["claude.ai"],
      matchPattern: "https://claude.ai/*"
    },
    {
      label: "Gemini",
      hosts: ["gemini.google.com"],
      matchPattern: "https://gemini.google.com/*"
    },
    {
      label: "Grok",
      hosts: ["grok.com"],
      matchPattern: "https://grok.com/*"
    },
    {
      label: "DeepSeek",
      hosts: ["chat.deepseek.com"],
      matchPattern: "https://chat.deepseek.com/*"
    }
  ];

  function clean(value) {
    return String(value || "").trim();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeSettingValue(rawValue, key) {
    const metadata = SETTING_METADATA[key];
    if (!metadata) {
      return undefined;
    }

    if (metadata.kind === "boolean") {
      return typeof rawValue === "boolean" ? rawValue : undefined;
    }

    if (metadata.kind === "number") {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        return undefined;
      }

      return clamp(numericValue, metadata.min, metadata.max);
    }

    return undefined;
  }

  function normalizeHostPattern(value) {
    let normalized = clean(value).toLowerCase();
    if (!normalized) {
      return "";
    }

    if (normalized === "*") {
      return "*";
    }

    if (/^https?:\/\//i.test(normalized)) {
      try {
        normalized = new URL(normalized).hostname.toLowerCase();
      } catch (error) {
        normalized = normalized.replace(/^https?:\/\//i, "");
      }
    }

    normalized = normalized.replace(/\/.*$/, "");
    normalized = normalized.replace(/^\.+/, "");

    if (normalized.startsWith("*.")) {
      return `*.${normalized.slice(2).replace(/^\.+/, "")}`;
    }

    return normalized;
  }

  function normalizeAllowedHosts(value) {
    const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
    const seen = new Set();
    const patterns = [];

    values.forEach((entry) => {
      const normalized = normalizeHostPattern(entry);
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      patterns.push(normalized);
    });

    return patterns;
  }

  function hostMatchesPattern(hostname, pattern) {
    const normalizedHost = clean(hostname).toLowerCase();
    const normalizedPattern = normalizeHostPattern(pattern);

    if (!normalizedHost || !normalizedPattern) {
      return false;
    }

    if (normalizedPattern === "*") {
      return true;
    }

    if (normalizedPattern.startsWith("*.")) {
      const suffix = normalizedPattern.slice(1);
      return normalizedHost.endsWith(suffix);
    }

    return normalizedHost === normalizedPattern;
  }

  function normalizeManagedPolicy(rawPolicy) {
    const policy = rawPolicy && typeof rawPolicy === "object" ? rawPolicy : {};
    const overrides = {};
    const managedKeys = new Set();

    if (policy.overrides && typeof policy.overrides === "object") {
      Object.entries(policy.overrides).forEach(([settingKey, rawValue]) => {
        const normalizedValue = normalizeSettingValue(rawValue, settingKey);
        if (typeof normalizedValue === "undefined") {
          return;
        }

        overrides[settingKey] = normalizedValue;
      });
    }

    if (Array.isArray(policy.managedKeys)) {
      policy.managedKeys.forEach((key) => {
        if (SETTING_KEYS.includes(key)) {
          managedKeys.add(key);
        }
      });
    }

    Object.entries(POLICY_TO_SETTING_KEY).forEach(([policyKey, settingKey]) => {
      if (!Object.prototype.hasOwnProperty.call(policy, policyKey)) {
        return;
      }

      const normalizedValue = normalizeSettingValue(policy[policyKey], settingKey);
      if (typeof normalizedValue === "undefined") {
        return;
      }

      overrides[settingKey] = normalizedValue;
      managedKeys.add(settingKey);
    });

    return {
      allowedHosts: normalizeAllowedHosts(
        Object.prototype.hasOwnProperty.call(policy, "allowedHosts")
          ? policy.allowedHosts
          : policy.AllowedHosts
      ),
      lockMonitoringControls:
        policy.lockMonitoringControls === true || policy.LockMonitoringControls === true,
      overrides,
      managedKeys: Array.from(managedKeys)
    };
  }

  function normalizeMonitoringConsent(rawConsent) {
    const consent = rawConsent && typeof rawConsent === "object" ? rawConsent : {};
    return {
      version: CONSENT_VERSION,
      accepted: consent.version === CONSENT_VERSION && consent.accepted === true,
      updatedAt: Number.isFinite(Number(consent.updatedAt)) ? Number(consent.updatedAt) : 0
    };
  }

  function applySettingDependencies(settings) {
    const merged = { ...(settings || {}) };

    if (!merged.behaviorMonitorEnabled) {
      merged.readCopiedContentEnabled = false;
      merged.readBeforeCopyEnabled = false;
      merged.showOutputCountdown = false;
    }

    if (!merged.readBeforeCopyEnabled) {
      merged.showOutputCountdown = false;
    }

    if (!merged.promptListenerEnabled) {
      merged.readPromptContentEnabled = false;
    }

    return merged;
  }

  function applyConsentGate(settings, consent) {
    const merged = { ...(settings || {}) };
    if (consent?.accepted) {
      return merged;
    }

    MONITORING_SETTING_KEYS.forEach((key) => {
      merged[key] = false;
    });

    return merged;
  }

  function buildEffectiveSettings(defaultSettings, localSettings, managedPolicy, rawConsent) {
    const consent = normalizeMonitoringConsent(rawConsent);
    const policy = normalizeManagedPolicy(managedPolicy);
    const merged = {
      ...(defaultSettings || {}),
      ...(localSettings || {}),
      ...policy.overrides
    };

    return applySettingDependencies(applyConsentGate(merged, consent));
  }

  function getAllowedHostMatches(managedPolicy) {
    const policy = normalizeManagedPolicy(managedPolicy);
    if (policy.allowedHosts.length === 0 || policy.allowedHosts.includes("*")) {
      return SUPPORTED_HOSTS.map((host) => host.matchPattern);
    }

    return SUPPORTED_HOSTS
      .filter((hostEntry) =>
        hostEntry.hosts.some((hostname) =>
          policy.allowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern))
        )
      )
      .map((hostEntry) => hostEntry.matchPattern);
  }

  function getAllowedHostLabels(managedPolicy) {
    const policy = normalizeManagedPolicy(managedPolicy);
    if (policy.allowedHosts.length === 0 || policy.allowedHosts.includes("*")) {
      return [];
    }

    return SUPPORTED_HOSTS
      .filter((hostEntry) =>
        hostEntry.hosts.some((hostname) =>
          policy.allowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern))
        )
      )
      .map((hostEntry) => hostEntry.label);
  }

  function isUrlAllowed(url, managedPolicy) {
    const policy = normalizeManagedPolicy(managedPolicy);
    if (policy.allowedHosts.length === 0 || policy.allowedHosts.includes("*")) {
      return true;
    }

    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return policy.allowedHosts.some((pattern) => hostMatchesPattern(hostname, pattern));
    } catch (error) {
      return false;
    }
  }

  function isSettingManaged(key, managedPolicy) {
    const policy = normalizeManagedPolicy(managedPolicy);
    return policy.managedKeys.includes(key);
  }

  function isMonitoringSettingKey(key) {
    return SETTING_KEYS.includes(key);
  }

  function getManagedSettingLabels(managedPolicy) {
    const policy = normalizeManagedPolicy(managedPolicy);
    return policy.managedKeys
      .map((key) => SETTING_METADATA[key]?.label)
      .filter(Boolean);
  }

  function buildEnterpriseState(defaultSettings, localSettings, rawManagedPolicy, rawConsent) {
    const managedPolicy = normalizeManagedPolicy(rawManagedPolicy);
    const monitoringConsent = normalizeMonitoringConsent(rawConsent);
    const effectiveSettings = buildEffectiveSettings(
      defaultSettings,
      localSettings,
      managedPolicy,
      monitoringConsent
    );

    return {
      effectiveSettings,
      monitoringConsent,
      enterpriseState: {
        consentAccepted: monitoringConsent.accepted,
        consentRequired: !monitoringConsent.accepted,
        consentVersion: monitoringConsent.version,
        lockMonitoringControls: managedPolicy.lockMonitoringControls,
        allowedHosts: managedPolicy.allowedHosts,
        allowedHostLabels: getAllowedHostLabels(managedPolicy),
        managedKeys: managedPolicy.managedKeys,
        managedSettingLabels: getManagedSettingLabels(managedPolicy),
        hasManagedPolicy:
          managedPolicy.lockMonitoringControls ||
          managedPolicy.allowedHosts.length > 0 ||
          managedPolicy.managedKeys.length > 0
      },
      managedPolicy
    };
  }

  const api = {
    CONSENT_VERSION,
    POLICY_TO_SETTING_KEY,
    SETTING_KEYS,
    MONITORING_SETTING_KEYS,
    SUPPORTED_HOSTS,
    normalizeManagedPolicy,
    normalizeMonitoringConsent,
    buildEffectiveSettings,
    buildEnterpriseState,
    getAllowedHostMatches,
    getAllowedHostLabels,
    getManagedSettingLabels,
    isUrlAllowed,
    isSettingManaged,
    isMonitoringSettingKey
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachManagedConfig = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachManagedConfig = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
