#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const managedConfig = require("../extension/shared/managedConfig.js");

const defaultSettings = {
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

const managedPolicy = managedConfig.normalizeManagedPolicy({
  AllowedHosts: ["chatgpt.com", "claude.ai"],
  PromptListenerEnabled: true,
  ReadPromptContentEnabled: true,
  LockMonitoringControls: true
});

assert.deepEqual(
  managedPolicy.allowedHosts,
  ["chatgpt.com", "claude.ai"],
  "managed policy should normalize allowed hosts"
);
assert.equal(
  managedPolicy.overrides.promptListenerEnabled,
  true,
  "managed policy should normalize boolean overrides"
);
assert.equal(
  managedConfig.getAllowedHostMatches(managedPolicy).includes("https://chatgpt.com/*"),
  true,
  "allowed host filtering should keep allowed platforms"
);
assert.equal(
  managedConfig.getAllowedHostMatches(managedPolicy).includes("https://gemini.google.com/*"),
  false,
  "allowed host filtering should exclude disallowed platforms"
);

const consentDenied = managedConfig.normalizeMonitoringConsent(null);
const effectiveWithoutConsent = managedConfig.buildEffectiveSettings(
  defaultSettings,
  {
    promptListenerEnabled: true,
    behaviorMonitorEnabled: true,
    readPromptContentEnabled: true,
    readCopiedContentEnabled: true
  },
  {},
  consentDenied
);

assert.equal(
  effectiveWithoutConsent.promptListenerEnabled,
  false,
  "consent gate should force prompt monitoring off"
);
assert.equal(
  effectiveWithoutConsent.behaviorMonitorEnabled,
  false,
  "consent gate should force behavior monitoring off"
);

const acceptedConsent = managedConfig.normalizeMonitoringConsent({
  version: managedConfig.CONSENT_VERSION,
  accepted: true,
  updatedAt: Date.now()
});
const enterpriseBundle = managedConfig.buildEnterpriseState(
  defaultSettings,
  {
    promptListenerEnabled: false,
    readPromptContentEnabled: false
  },
  {
    PromptListenerEnabled: true,
    ReadPromptContentEnabled: true,
    AllowedHosts: ["claude.ai"]
  },
  acceptedConsent
);

assert.equal(
  enterpriseBundle.effectiveSettings.promptListenerEnabled,
  true,
  "managed overrides should flow into effective settings"
);
assert.deepEqual(
  enterpriseBundle.enterpriseState.allowedHostLabels,
  ["Claude"],
  "enterprise state should expose human-readable host labels"
);
assert.equal(
  managedConfig.isUrlAllowed("https://claude.ai/chat", enterpriseBundle.enterpriseState),
  true,
  "enterprise state allowlist should accept allowed hosts"
);
assert.equal(
  managedConfig.isUrlAllowed("https://gemini.google.com/app", enterpriseBundle.enterpriseState),
  false,
  "enterprise state allowlist should reject disallowed hosts"
);

console.log("Managed config checks passed.");
