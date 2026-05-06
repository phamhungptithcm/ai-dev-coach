#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const managedConfig = require("../extension/shared/managedConfig.js");
const backgroundSource = fs.readFileSync("extension/background.js", "utf8");

function makeEvent() {
  return {
    addListener() {}
  };
}

const sandbox = {
  console,
  importScripts() {},
  AIDevCoachManagedConfig: managedConfig,
  chrome: {
    runtime: {
      onInstalled: makeEvent(),
      onStartup: makeEvent(),
      onMessage: makeEvent()
    },
    commands: {
      onCommand: makeEvent()
    },
    storage: {
      onChanged: makeEvent(),
      local: {
        async get() {
          return {};
        },
        async set() {}
      },
      managed: {
        async get() {
          return {};
        }
      }
    },
    scripting: {
      async getRegisteredContentScripts() {
        return [];
      },
      async registerContentScripts() {},
      async unregisterContentScripts() {},
      async executeScript() {},
      async insertCSS() {}
    },
    tabs: {
      async query() {
        return [];
      },
      async sendMessage() {}
    }
  }
};

sandbox.globalThis = sandbox;

vm.runInNewContext(
  `${backgroundSource}
globalThis.__buildDynamicContentScripts = buildDynamicContentScripts;
`,
  sandbox,
  { filename: "extension/background.js" }
);

function scriptIdsFor(settings) {
  return Array.from(
    sandbox.__buildDynamicContentScripts(settings, { allowedHosts: [] }),
    (script) => script.id
  );
}

const defaultScriptIds = scriptIdsFor({
  enableCoach: true,
  promptListenerEnabled: false,
  behaviorMonitorEnabled: false
});

assert.deepEqual(
  defaultScriptIds,
  ["ai-dev-coach-style", "ai-dev-coach-prompt-tools"],
  "Quick Prompt Builder should register by default without enabling monitoring"
);

const monitoringScriptIds = scriptIdsFor({
  enableCoach: true,
  promptListenerEnabled: true,
  behaviorMonitorEnabled: false
});

assert.deepEqual(
  monitoringScriptIds,
  [
    "ai-dev-coach-style",
    "ai-dev-coach-prompt-tools",
    "ai-dev-coach-prompt-monitor",
    "ai-dev-coach-live-bubble"
  ],
  "prompt monitoring should add monitor and live bubble scripts after opt-in"
);

const disabledScriptIds = scriptIdsFor({
  enableCoach: false,
  promptListenerEnabled: false,
  behaviorMonitorEnabled: false
});

assert.deepEqual(
  disabledScriptIds,
  [],
  "disabling coaching should also hide the default in-page Prompt Builder"
);

console.log("Background dynamic script checks passed.");
