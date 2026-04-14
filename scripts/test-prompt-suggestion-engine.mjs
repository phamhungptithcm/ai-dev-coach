#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const marketplace = require("../extension/shared/promptMarketplace.js");
const suggestionEngine = require("../extension/shared/promptSuggestionEngine.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const markdown = fs.readFileSync(path.resolve(__dirname, "../docs/prompts.md"), "utf8");
const library = marketplace.getPromptLibrary(markdown);

const summarizeSuggestions = suggestionEngine.getInlinePromptSuggestions({
  query: "explain async await step by step",
  roleKey: "software_engineer",
  library,
  rawState: null,
  limit: 5,
  minimum: 3
});

assert.ok(summarizeSuggestions.length >= 3, "should provide at least three inline suggestions");
assert.match(
  summarizeSuggestions[0].title,
  /Explain Like I'm 10|Learning Roadmap|Book Summary/i,
  "learning query should surface a developer-friendly learning prompt first"
);

const debugSuggestions = suggestionEngine.getInlinePromptSuggestions({
  query: "debug code error",
  roleKey: "software_engineer",
  library,
  rawState: null,
  limit: 5,
  minimum: 3
});

assert.equal(
  debugSuggestions[0].categoryKey,
  "developer",
  "engineer debug query should prioritize developer prompts"
);
assert.match(
  debugSuggestions[0].title,
  /Debug This Error/i,
  "debug query should surface the direct debugging prompt"
);

const codeReviewPrompt = library.prompts.find((prompt) => prompt.title === "Code Review");
const systemDesignPrompt = library.prompts.find((prompt) => prompt.title === "System Design Prompt");
assert.ok(codeReviewPrompt, "code review prompt should exist in the focused library");
assert.ok(systemDesignPrompt, "system design prompt should exist in the focused library");

let storageState = marketplace.createEmptyState();
storageState = await marketplace.recordPromptUsage(
  {
    get(_keys, callback) {
      callback({ [marketplace.STORAGE_KEY]: storageState });
    },
    set(payload, callback) {
      storageState = payload[marketplace.STORAGE_KEY];
      callback?.();
    }
  },
  {
    promptId: codeReviewPrompt.id,
    categoryKey: codeReviewPrompt.categoryKey,
    action: "insert",
    source: "inline_suggestion"
  }
);
storageState = await marketplace.recordPromptUsage(
  {
    get(_keys, callback) {
      callback({ [marketplace.STORAGE_KEY]: storageState });
    },
    set(payload, callback) {
      storageState = payload[marketplace.STORAGE_KEY];
      callback?.();
    }
  },
  {
    promptId: systemDesignPrompt.id,
    categoryKey: systemDesignPrompt.categoryKey,
    action: "send",
    source: "inline_suggestion"
  }
);

const emailSuggestions = suggestionEngine.getInlinePromptSuggestions({
  query: "system design rollout risk",
  roleKey: "manager",
  library,
  rawState: storageState,
  limit: 5,
  minimum: 3
});

assert.match(
  emailSuggestions[0].title,
  /System Design Prompt/i,
  "manager system-design query should surface a technical rollout prompt"
);
assert.ok(
  emailSuggestions.some(
    (entry) =>
      entry.id === systemDesignPrompt.id &&
      Array.isArray(entry.reasons) &&
      entry.reasons.includes("Popular locally")
  ),
  "popular prompt usage should be reflected in suggestion reasons"
);

const shortQuerySuggestions = suggestionEngine.getInlinePromptSuggestions({
  query: "a",
  roleKey: "software_engineer",
  library,
  rawState: null,
  limit: 5,
  minimum: 3
});

assert.equal(shortQuerySuggestions.length, 0, "very short queries should not open inline suggestions");

console.log("Prompt suggestion engine checks passed.");
