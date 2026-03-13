#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const engine = require("../extension/shared/promptQualityEngine.js");

const weakPrompt = engine.calculatePromptScore({
  prompt: "help me fix this not working"
});

const strongPrompt = engine.calculatePromptScore({
  prompt: [
    "Task: Debug a failing React checkout form submit.",
    "Context: In React 18 with Next.js, clicking submit throws `TypeError: cannot read properties of undefined` in src/components/CheckoutForm.tsx:87.",
    "Expected: the form should create an order and redirect to /success.",
    "Actual: the request never reaches POST /api/orders and the UI stays on the same page.",
    "What I tried: I logged the payload, added a guard around formData.customer, and reran the flow.",
    "Result: the payload is present, but `customer.id` is undefined when handleSubmit maps the DTO.",
    "Blocker: I am not sure whether the bug is in the form state or the API mapper.",
    "Constraints: Keep the fix small and avoid changing the API contract.",
    "Acceptance criteria: identify root cause, suggest the smallest safe fix, and list one regression test."
  ].join("\n"),
  strictMode: true
});

const shortcutPrompt = engine.calculatePromptScore({
  prompt: "Give me full code and no explanation. I didn't try anything yet.",
  strictMode: true
});

assert.equal(typeof engine.calculatePromptScore, "function");
assert.equal(typeof engine.gradeFromScore, "function");
assert.ok(strongPrompt.score > weakPrompt.score, "strong prompt should outscore vague prompt");
assert.ok(strongPrompt.context > weakPrompt.context, "strong prompt should have better context score");
assert.ok(strongPrompt.specificity > weakPrompt.specificity, "strong prompt should have better specificity score");
assert.ok(shortcutPrompt.hasShortcutIntent, "shortcut prompt should be flagged");
assert.ok(shortcutPrompt.warnings.length > 0, "shortcut prompt should emit warnings");
assert.ok(shortcutPrompt.risk < strongPrompt.risk, "shortcut prompt should have lower risk guardrail score");
assert.ok(strongPrompt.signals.frameworkMatches.includes("React"), "framework detection should find React");

console.log("Prompt quality engine checks passed.");
