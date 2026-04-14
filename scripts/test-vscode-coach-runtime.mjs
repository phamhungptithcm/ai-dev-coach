#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const runtime = require("../vscode-extension/coachRuntime.js");

assert.equal(typeof runtime.analyzePrompt, "function");
assert.equal(typeof runtime.buildPromptSkeleton, "function");

const skeleton = runtime.buildPromptSkeleton({
  roleKey: "software_engineer",
  level: "Junior",
  templateKey: "debugging"
});

assert.match(skeleton, /Task:/, "skeleton should include a task section");
assert.match(skeleton, /Context:/, "skeleton should include a context section");
assert.match(skeleton, /What I Tried:/, "skeleton should include an attempt section");

const analysis = runtime.analyzePrompt({
  roleKey: "software_engineer",
  level: "Junior",
  templateKey: "debugging",
  prompt: [
    "Task: Debug a failing Node.js API request.",
    "Context: POST /orders returns 500 in src/orders/service.js and expected 201 instead.",
    "What I Tried: I checked the payload mapping, replayed the request, and now I am blocked on a null customer id."
  ].join("\n")
});

assert.ok(analysis.analysis.score > 0, "analysis should produce a prompt score");
assert.equal(analysis.profile.roleKey, "software_engineer", "analysis should keep the visible role key");
assert.ok(
  analysis.lintReport.results.some((entry) => entry.title === "Technical context" && entry.passed),
  "technical context lint rule should pass for a structured debug prompt"
);

const secretAnalysis = runtime.analyzePrompt({
  roleKey: "software_engineer",
  level: "Senior",
  templateKey: "code_review",
  prompt: "Task: Review this prompt. Context: api_key='sk-1234567890123456789012345' leaked in config."
});

assert.ok(
  secretAnalysis.lintReport.results.some(
    (entry) => entry.title === "Sensitive data" && entry.passed === false
  ),
  "runtime should surface sensitive-data lint failures inside the VS Code scaffold"
);

console.log("VS Code coach runtime checks passed.");
