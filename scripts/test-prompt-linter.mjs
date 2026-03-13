#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const qualityEngine = require('../extension/shared/promptQualityEngine.js');
const linter = require('../extension/shared/promptLinter.js');

const weakPrompt = 'help me fix this not working';
const weakReport = linter.lintPrompt({
  prompt: weakPrompt,
  analysis: qualityEngine.calculatePromptScore({ prompt: weakPrompt }),
  templateKey: 'debugging',
  profile: { roleKey: 'software_engineer' }
});

const strongPrompt = [
  'Task: Debug failing React API form submit.',
  'Context: In Next.js, clicking submit throws TypeError in src/app/api/orders/route.ts:42.',
  'Expected: POST /api/orders should return 201.',
  'Actual: it returns 500 and the UI stays on the same page.',
  'What I tried: I logged the payload and checked zod parsing.',
  'Result: customerId is undefined in the mapper.',
  'Blocker: I am not sure whether the bug is in form state or API mapping.'
].join('\n');
const strongReport = linter.lintPrompt({
  prompt: strongPrompt,
  analysis: qualityEngine.calculatePromptScore({ prompt: strongPrompt }),
  templateKey: 'debugging',
  profile: { roleKey: 'software_engineer' }
});

const secretReport = linter.lintPrompt({
  prompt: 'Task: review this key\nContext: api_key=sk-1234567890abcdefghijklmnop',
  analysis: qualityEngine.calculatePromptScore({ prompt: 'Task: review this key\nContext: api_key=sk-1234567890abcdefghijklmnop' }),
  secretInspection: {
    findings: [{ name: 'API Key', severity: 'high' }]
  },
  profile: { roleKey: 'software_engineer' }
});

assert.equal(weakReport.results.length, 4);
assert.ok(weakReport.failingResults.length >= 2, 'weak prompt should fail multiple lint rules');
assert.ok(
  weakReport.failingResults.some((result) => result.id === 'prompt-too-short'),
  'weak prompt should fail prompt-too-short'
);
assert.ok(
  weakReport.failingResults.some((result) => result.id === 'missing-technical-context'),
  'weak prompt should fail missing technical context'
);
assert.ok(
  strongReport.failingResults.every((result) => result.id !== 'prompt-too-short'),
  'strong prompt should pass prompt length rule'
);
assert.ok(
  strongReport.passingResults.some((result) => result.id === 'missing-error-message'),
  'strong prompt should pass error signal rule'
);
assert.ok(secretReport.hasBlockingFailure, 'secret lint report should block on sensitive data');
assert.ok(
  secretReport.failingResults.some((result) => result.id === 'possible-sensitive-data'),
  'secret lint report should fail sensitive data rule'
);

console.log('Prompt linter checks passed.');
