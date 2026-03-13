#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const marketplace = require('../extension/shared/promptMarketplace.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptsPath = path.resolve(__dirname, '../docs/prompts.md');
const markdown = fs.readFileSync(promptsPath, 'utf8');

const library = marketplace.parsePromptLibraryMarkdown(markdown);
assert.ok(library.summary.rawPromptCount >= library.summary.promptCount, 'raw prompt count should be >= unique prompt count');
assert.ok(library.summary.promptCount > 0, 'prompt marketplace should parse at least one prompt');
assert.equal(library.categories[0].key, 'all', 'library should expose an all category');
assert.ok(library.categories.some((category) => category.key === 'developer'), 'developer category should exist');
assert.ok(library.categories.some((category) => category.key === 'business'), 'business category should exist');
assert.ok(library.summary.promptCount >= 25, 'rich prompt library should expose a meaningful prompt set');
assert.equal(library.summary.duplicatePromptCount, 0, 'refactored source should not require duplicate normalization');
assert.ok(
  library.prompts.some((prompt) => prompt.title === 'Debug This Error' && /Root cause/i.test(prompt.text)),
  'developer prompts should preserve structured multi-line bodies'
);
assert.ok(
  library.prompts.every((prompt) => typeof prompt.previewText === 'string' && prompt.previewText.length > 0),
  'each prompt should expose a preview text for compact UI rendering'
);

const developerSearch = marketplace.filterPrompts(library, {
  query: 'debug bug root cause',
  categoryKey: 'developer'
});
assert.ok(developerSearch.total > 0, 'developer search should return results');
assert.equal(developerSearch.results[0].categoryKey, 'developer');
assert.equal(developerSearch.results[0].title, 'Debug This Error');

const writingSearch = marketplace.filterPrompts(library, {
  query: 'passive voice concise flow',
  categoryKey: 'writing'
});
assert.ok(
  writingSearch.results.some((prompt) => prompt.title === 'Rewrite for Clarity'),
  'writing search should match richer rewriting prompts'
);

function createMockStorage(initialValue) {
  let state = initialValue;
  return {
    get(keys, callback) {
      const key = Array.isArray(keys) ? keys[0] : keys;
      callback({ [key]: state });
    },
    set(payload, callback) {
      state = payload[marketplace.STORAGE_KEY];
      callback();
    },
    read() {
      return state;
    }
  };
}

const mockStorage = createMockStorage(undefined);
const cachedState = await marketplace.syncLibraryCache(mockStorage, marketplace.getPromptLibrary(markdown));
assert.equal(cachedState.library.promptCount, marketplace.getPromptLibrary(markdown).summary.promptCount, 'sync should cache prompt count');

const firstPrompt = developerSearch.results[0];
await marketplace.recordPromptUsage(mockStorage, {
  promptId: firstPrompt.id,
  categoryKey: firstPrompt.categoryKey,
  action: 'copy',
  timestamp: Date.parse('2026-03-13T10:00:00Z')
});
await marketplace.recordPromptUsage(mockStorage, {
  promptId: firstPrompt.id,
  categoryKey: firstPrompt.categoryKey,
  action: 'send',
  timestamp: Date.parse('2026-03-13T10:05:00Z')
});

const trending = marketplace.getTrendingPrompts(marketplace.getPromptLibrary(markdown), mockStorage.read(), {
  limit: 3
});
assert.equal(trending.length, 3, 'trending should respect the requested limit');
assert.equal(trending[0].id, firstPrompt.id, 'used prompt should rank first in trending');
assert.equal(trending[0].usage.sendUses, 1, 'trending prompt should expose send counts');
assert.equal(trending[0].previewText, firstPrompt.previewText, 'trending prompts should preserve preview text');

console.log('Prompt marketplace checks passed.');
