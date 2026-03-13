#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const analytics = require("../extension/shared/learningAnalytics.js");

function createMockStorage(initialValue) {
  let state = initialValue;
  return {
    get(keys, callback) {
      const key = Array.isArray(keys) ? keys[0] : keys;
      callback({ [key]: state });
    },
    set(payload, callback) {
      state = payload[analytics.STORAGE_KEY];
      callback();
    },
    read() {
      return state;
    }
  };
}

const mockStorage = createMockStorage(undefined);

const weakEventState = await analytics.trackPromptEvent(mockStorage, {
  source: "composer_submit",
  platform: "ChatGPT",
  promptLength: 18,
  score: 42,
  grade: "D",
  dependency: 90,
  hasIndependentAttempt: false,
  hasShortcutIntent: true,
  warningCount: 3,
  lintFailedCount: 2,
  roleKey: "software_engineer",
  skillLevel: "Junior",
  timestamp: Date.parse("2026-03-13T12:00:00Z")
});

const strongEventState = await analytics.trackPromptEvent(mockStorage, {
  source: "quick_builder",
  platform: "Claude",
  promptLength: 420,
  score: 88,
  grade: "B",
  dependency: 58,
  hasIndependentAttempt: true,
  hasShortcutIntent: false,
  warningCount: 1,
  lintFailedCount: 0,
  roleKey: "software_engineer",
  skillLevel: "Senior",
  timestamp: Date.parse("2026-03-13T12:05:00Z")
});

assert.equal(weakEventState.summary.totalPrompts, 1, "first tracked event should increment total prompts");
assert.equal(strongEventState.summary.totalPrompts, 2, "second tracked event should increment total prompts");
assert.equal(strongEventState.summary.scoredPrompts, 2, "scored prompts should count numeric scores");
assert.equal(strongEventState.summary.lastPlatform, "Claude", "last platform should reflect newest event");
assert.equal(
  strongEventState.summary.averageScore,
  65,
  "average score should round across stored prompt events"
);
assert.equal(
  strongEventState.summary.platformCounts.ChatGPT,
  1,
  "platform counts should include the first platform"
);
assert.equal(
  strongEventState.summary.sourceCounts.quick_builder,
  1,
  "source counts should include quick builder events"
);

const payload = analytics.buildFutureSyncPayload(mockStorage.read(), { cursor: "cursor_123" });
assert.equal(payload.schemaVersion, analytics.SCHEMA_VERSION);
assert.equal(payload.cursor, "cursor_123");
assert.equal(payload.promptEvents.length, 2, "sync payload should include stored prompt events");
assert.equal(payload.promptEvents[0].clientEventId.startsWith("prompt_"), true);
assert.equal(payload.promptEvents[1].source, "quick_builder");
assert.equal(payload.promptEvents[1].platform, "Claude");
assert.equal(payload.promptEvents[1].skillLevel, "Senior");

const snapshot = analytics.getSnapshot(mockStorage.read());
assert.equal(snapshot.totalPrompts, 2, "snapshot should summarize the stored state");
assert.equal(snapshot.averagePromptLength, 219, "average prompt length should be rounded");

console.log("Learning analytics checks passed.");
