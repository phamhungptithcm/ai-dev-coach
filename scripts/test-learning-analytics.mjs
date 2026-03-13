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

await analytics.trackPromptEvent(mockStorage, {
  prompt: [
    "Debug task: fix a failing React checkout form submit.",
    "Context: clicking submit throws TypeError in CheckoutForm.tsx:87.",
    "Expected: create an order and redirect.",
    "Actual: request never reaches POST /api/orders.",
    "What I tried: logged the payload and added a guard.",
    "Blocker: not sure whether the bug is in form state or mapper."
  ].join("\n"),
  source: "composer_submit",
  platform: "ChatGPT",
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

const secondState = await analytics.trackPromptEvent(mockStorage, {
  prompt: [
    "Learning goal: explain the JavaScript event loop.",
    "Context: I understand promises but still confuse macrotasks vs microtasks.",
    "What I tried: I read docs and ran a simple example.",
    "Acceptance criteria: give one short exercise and a recap."
  ].join("\n"),
  source: "quick_builder",
  platform: "Claude",
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

await analytics.trackPromptEvent(mockStorage, {
  prompt: [
    "System design question: design a queue-backed notification pipeline.",
    "Context: high throughput, retries, observability, and cost constraints."
  ].join("\n"),
  source: "composer_submit",
  platform: "Gemini",
  score: 79,
  grade: "B",
  dependency: 65,
  hasIndependentAttempt: true,
  hasShortcutIntent: false,
  warningCount: 0,
  lintFailedCount: 0,
  roleKey: "solution_architecture",
  skillLevel: "Senior",
  timestamp: Date.parse("2026-03-12T12:00:00Z")
});

assert.equal(secondState.summary.totalPrompts, 2, "second tracked event should increment total prompts");

const payload = analytics.buildFutureSyncPayload(mockStorage.read(), { cursor: "cursor_123" });
assert.equal(payload.schemaVersion, analytics.SCHEMA_VERSION);
assert.equal(payload.cursor, "cursor_123");
assert.equal(payload.promptEvents.length, 3, "sync payload should include stored prompt events");
assert.equal(payload.promptEvents[0].clientEventId.startsWith("prompt_"), true);
const quickBuilderEvent = payload.promptEvents.find((event) => event.source === "quick_builder");
const systemDesignEvent = payload.promptEvents.find((event) => event.category === "system_design");
assert.ok(quickBuilderEvent, "payload should include the quick builder event");
assert.ok(systemDesignEvent, "payload should include the system design event");
assert.equal(quickBuilderEvent.platform, "Claude");
assert.equal(quickBuilderEvent.category, "learning");
assert.equal(systemDesignEvent.platform, "Gemini");

const snapshot = analytics.getSnapshot(mockStorage.read());
assert.equal(snapshot.totalPrompts, 3, "snapshot should summarize the stored state");
assert.equal(snapshot.scoredPrompts, 3, "all events have scores in this smoke test");
assert.equal(snapshot.lastPlatform, "Claude", "latest event should still define last platform");
assert.equal(snapshot.categoryCounts.debugging, 1, "debugging category should be tracked");
assert.equal(snapshot.categoryCounts.learning, 1, "learning category should be tracked");
assert.equal(snapshot.categoryCounts.system_design, 1, "system design category should be tracked");

const currentDayKey = quickBuilderEvent.dayKey;
const dailySummary = analytics.buildDailySessionSummary(mockStorage.read(), { dayKey: currentDayKey });

assert.equal(dailySummary.dayKey, currentDayKey);
assert.equal(dailySummary.totalPrompts, 2, "daily summary should filter to the requested day");
assert.equal(dailySummary.averageScore, 65, "daily summary should average only selected-day prompts");
assert.equal(dailySummary.topCategory.key, "debugging", "daily summary should rank categories by usage");
assert.ok(
  dailySummary.categories.some((category) => category.key === "learning"),
  "daily summary should include per-category counts"
);
assert.ok(
  dailySummary.suggestions.some((message) => message.includes("Add stronger evidence")),
  "daily summary should include coaching suggestions when quality is weak"
);
assert.ok(
  dailySummary.headline.includes("Average quality score: 65/100"),
  "daily summary headline should be readable for end users"
);

const trendDashboard = analytics.buildTrendDashboard(mockStorage.read(), {
  timestamp: Date.parse("2026-03-13T23:59:00Z"),
  days: 3
});

assert.equal(trendDashboard.days, 3, "trend dashboard should respect the requested window size");
assert.equal(trendDashboard.activeDays, 2, "trend dashboard should count active days with prompts");
assert.equal(trendDashboard.qualitySeries.length, 3, "quality trend should include one point per day in the window");
assert.equal(
  trendDashboard.qualitySeries[2].averageScore,
  65,
  "quality trend should use the daily average score for the most recent day"
);
assert.equal(
  trendDashboard.warningSeries[2].warningEventCount,
  2,
  "warning trend should count prompt events that emitted warnings"
);
assert.equal(trendDashboard.topCategory.key, "debugging", "trend dashboard should rank prompt categories");
assert.equal(trendDashboard.qualityTrend.direction, "down", "quality trend should compare first vs last scored day");
assert.equal(trendDashboard.warningTrend.direction, "up", "warning trend should compare first vs last warning count");
assert.ok(
  trendDashboard.rules.qualityOverTime.includes("Average prompt score per day"),
  "trend dashboard should expose explainable calculation rules"
);

console.log("Learning analytics checks passed.");
