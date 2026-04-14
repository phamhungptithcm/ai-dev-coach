#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const diagnosticsRuntime = require("../vscode-extension/diagnosticsRuntime.js");

assert.equal(typeof diagnosticsRuntime.looksLikePromptDocument, "function");
assert.equal(typeof diagnosticsRuntime.analyzePromptDocument, "function");
assert.equal(typeof diagnosticsRuntime.applyPromptFix, "function");

const weakPrompt = "Debug this API bug for me";
const weakReport = diagnosticsRuntime.analyzePromptDocument({
  text: weakPrompt,
  languageId: "markdown",
  roleKey: "software_engineer",
  level: "Junior",
  templateKey: "debugging"
});

assert.equal(weakReport.shouldAnalyze, true, "short markdown prompt should be analyzed");
assert.ok(
  weakReport.diagnostics.some((entry) => entry.code === diagnosticsRuntime.DIAGNOSTIC_CODES.PROMPT_TOO_SHORT),
  "short prompt should surface prompt-length diagnostics"
);
assert.ok(
  weakReport.diagnostics.some((entry) => entry.code === diagnosticsRuntime.DIAGNOSTIC_CODES.LOW_SCORE),
  "weak prompt should surface low-score coaching diagnostics"
);

const expandedPrompt = diagnosticsRuntime.applyPromptFix({
  text: weakPrompt,
  fixId: "expand-structured-prompt",
  roleKey: "software_engineer",
  level: "Junior",
  templateKey: "debugging"
});

assert.match(expandedPrompt, /^Role:/, "expanded prompt should start with a role section");
assert.match(expandedPrompt, /Task:\nDebug this API bug for me/, "expanded prompt should reuse original task text");
assert.match(expandedPrompt, /What I Tried:/, "expanded prompt should add the attempt section");

const missingContextPrompt = [
  "Task:",
  "Review this failing endpoint.",
  "",
  "What I Tried:",
  "I replayed the request and checked the logs."
].join("\n");
const contextReport = diagnosticsRuntime.analyzePromptDocument({
  text: missingContextPrompt,
  languageId: "markdown",
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "debugging"
});

assert.ok(
  contextReport.diagnostics.some(
    (entry) => entry.code === diagnosticsRuntime.DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT
  ),
  "missing context should be flagged"
);

const withContextFix = diagnosticsRuntime.applyPromptFix({
  text: missingContextPrompt,
  fixId: "add-context-section",
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "debugging"
});

assert.match(withContextFix, /Context:/, "context fix should add a context section");
assert.match(withContextFix, /stack trace|endpoint|artifact/i, "context fix should add technical-context placeholders");

const secretPrompt = "Task: Review config.\nContext: api_key='sk-1234567890123456789012345'.";
const secretReport = diagnosticsRuntime.analyzePromptDocument({
  text: secretPrompt,
  languageId: "markdown",
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "code_review"
});

assert.ok(
  secretReport.diagnostics.some(
    (entry) => entry.code === diagnosticsRuntime.DIAGNOSTIC_CODES.POSSIBLE_SENSITIVE_DATA
  ),
  "secret prompt should emit exact secret diagnostics"
);

const redactedPrompt = diagnosticsRuntime.applyPromptFix({
  text: secretPrompt,
  fixId: "redact-sensitive-data",
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "code_review",
  analysisResult: secretReport.analysisResult
});

assert.doesNotMatch(redactedPrompt, /sk-1234567890123456789012345/, "redaction should remove raw key material");
assert.match(redactedPrompt, /\*\*\*\*\*/, "redaction should keep a masked placeholder");

const codeSnippetReport = diagnosticsRuntime.analyzePromptDocument({
  text: "const total = lineItems.reduce((sum, item) => sum + item.price, 0);",
  languageId: "javascript",
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "debugging"
});

assert.equal(codeSnippetReport.shouldAnalyze, false, "regular code files should not get prompt diagnostics");

console.log("VS Code diagnostics runtime checks passed.");
