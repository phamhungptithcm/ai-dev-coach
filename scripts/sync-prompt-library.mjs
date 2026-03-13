#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(repoRoot, 'docs', 'prompts.md');
const targetPath = path.join(repoRoot, 'extension', 'shared', 'promptLibrarySource.js');

const markdown = await fs.readFile(sourcePath, 'utf8');

const output = `(() => {
  const markdown = ${JSON.stringify(markdown)};

  const api = {
    markdown
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachPromptLibrarySource = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachPromptLibrarySource = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
`;

await fs.writeFile(targetPath, output, 'utf8');
console.log(`Synced prompt library source to ${path.relative(repoRoot, targetPath)}`);
