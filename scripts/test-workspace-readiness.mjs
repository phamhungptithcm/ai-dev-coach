#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const readiness = require("../extension/shared/workspaceReadiness.js");
const managedConfig = require("../extension/shared/managedConfig.js");

assert.equal(typeof readiness.findSupportedHostLabel, "function");
assert.equal(typeof readiness.describeWorkspaceState, "function");

assert.equal(
  readiness.findSupportedHostLabel(
    "https://chatgpt.com/c/123",
    managedConfig.SUPPORTED_HOSTS
  ),
  "ChatGPT",
  "workspace readiness should recognize supported hosts"
);

const unsupportedState = readiness.describeWorkspaceState({
  url: "https://example.com",
  enterpriseState: {},
  supportedHosts: managedConfig.SUPPORTED_HOSTS,
  isUrlAllowed: managedConfig.isUrlAllowed
});
assert.equal(unsupportedState.readyForInjection, false);
assert.match(
  unsupportedState.summary,
  /not a supported AI chat page/i,
  "unsupported tabs should produce a clear summary"
);

const blockedState = readiness.describeWorkspaceState({
  url: "https://claude.ai/chat",
  enterpriseState: {
    allowedHosts: ["chatgpt.com"],
    allowedHostLabels: ["ChatGPT"],
    managedKeys: [],
    managedSettingLabels: [],
    hasManagedPolicy: true
  },
  supportedHosts: managedConfig.SUPPORTED_HOSTS,
  isUrlAllowed: managedConfig.isUrlAllowed
});
assert.equal(blockedState.readyForInjection, false);
assert.match(
  blockedState.summary,
  /blocked by enterprise policy/i,
  "blocked hosts should explain enterprise policy"
);

const readyState = readiness.describeWorkspaceState({
  url: "https://chatgpt.com/c/123",
  enterpriseState: {
    allowedHosts: ["chatgpt.com"],
    allowedHostLabels: ["ChatGPT"],
    managedKeys: [],
    managedSettingLabels: [],
    hasManagedPolicy: true
  },
  supportedHosts: managedConfig.SUPPORTED_HOSTS,
  isUrlAllowed: managedConfig.isUrlAllowed
});
assert.equal(readyState.readyForInjection, true);
assert.match(
  readyState.summary,
  /Ready on ChatGPT/i,
  "allowed supported tabs should be marked ready"
);

console.log("Workspace readiness checks passed.");
