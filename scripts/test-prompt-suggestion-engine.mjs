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
  query: "summarize this document",
  roleKey: "teacher",
  library,
  rawState: null,
  limit: 5,
  minimum: 3
});

assert.ok(summarizeSuggestions.length >= 3, "should provide at least three inline suggestions");
assert.match(
  summarizeSuggestions[0].title,
  /Executive Summary|Book Summary/i,
  "summarize query should surface a structured summarization prompt first"
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

const rewritePrompt = library.prompts.find((prompt) => prompt.title === "Rewrite for Clarity");
const welcomeSequencePrompt = library.prompts.find((prompt) => prompt.title === "Email Welcome Sequence");
assert.ok(rewritePrompt, "rewrite prompt should exist in the library");
assert.ok(welcomeSequencePrompt, "welcome sequence prompt should exist in the library");

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
    promptId: rewritePrompt.id,
    categoryKey: rewritePrompt.categoryKey,
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
    promptId: welcomeSequencePrompt.id,
    categoryKey: welcomeSequencePrompt.categoryKey,
    action: "send",
    source: "inline_suggestion"
  }
);

const emailSuggestions = suggestionEngine.getInlinePromptSuggestions({
  query: "welcome email sequence",
  roleKey: "manager",
  library,
  rawState: storageState,
  limit: 5,
  minimum: 3
});

assert.match(
  emailSuggestions[0].title,
  /Email Welcome Sequence/i,
  "manager email query should surface a structured email workflow prompt"
);
assert.ok(
  emailSuggestions.some(
    (entry) =>
      entry.id === welcomeSequencePrompt.id &&
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
