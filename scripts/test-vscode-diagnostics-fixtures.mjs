#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const diagnosticsRuntime = require("../vscode-extension/diagnosticsRuntime.js");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturesDir = path.join(repoRoot, "vscode-extension", "fixtures");

const FIXTURE_EXPECTATIONS = {
  "weak-debug-prompt.md": {
    shouldAnalyze: true,
    codes: [
      diagnosticsRuntime.DIAGNOSTIC_CODES.PROMPT_TOO_SHORT,
      diagnosticsRuntime.DIAGNOSTIC_CODES.LOW_SCORE
    ]
  },
  "missing-context-prompt.md": {
    shouldAnalyze: true,
    codes: [
      diagnosticsRuntime.DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT
    ]
  },
  "secret-leak-prompt.md": {
    shouldAnalyze: true,
    codes: [
      diagnosticsRuntime.DIAGNOSTIC_CODES.POSSIBLE_SENSITIVE_DATA
    ]
  },
  "healthy-debug-prompt.md": {
    shouldAnalyze: true,
    codes: []
  }
};

for (const [fixtureName, expectation] of Object.entries(FIXTURE_EXPECTATIONS)) {
  const text = fs.readFileSync(path.join(fixturesDir, fixtureName), "utf8");
  const report = diagnosticsRuntime.analyzePromptDocument({
    text,
    languageId: "markdown",
    roleKey: "software_engineer",
    level: "Senior",
    templateKey: "debugging"
  });

  assert.equal(report.shouldAnalyze, expectation.shouldAnalyze, `${fixtureName} analysis gate mismatch`);
  const actualCodes = new Set(report.diagnostics.map((entry) => entry.code));

  expectation.codes.forEach((code) => {
    assert.ok(actualCodes.has(code), `${fixtureName} should include diagnostic ${code}`);
  });

  if (expectation.codes.length === 0) {
    assert.equal(report.diagnostics.length, 0, `${fixtureName} should stay diagnostic-clean`);
  }
}

console.log("VS Code diagnostics fixture checks passed.");
