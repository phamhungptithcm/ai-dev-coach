#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const adapter = require("../extension/shared/platformAdapter.js");

assert.equal(typeof adapter.detectPlatformByUrl, "function");
assert.equal(typeof adapter.detectPlatform, "function");
assert.equal(typeof adapter.isSupportedUrl, "function");
assert.equal(typeof adapter.resolveActivePromptInput, "function");

assert.equal(
  adapter.detectPlatformByUrl("https://chatgpt.com/c/123")?.name,
  "ChatGPT",
  "ChatGPT URLs should resolve to the ChatGPT adapter"
);

assert.equal(
  adapter.detectPlatformByUrl("https://claude.ai/chat")?.name,
  "Claude",
  "Claude URLs should resolve to the Claude adapter"
);

assert.equal(
  adapter.detectPlatformByUrl("https://gemini.google.com/app")?.name,
  "Gemini",
  "Gemini URLs should resolve to the Gemini adapter"
);

assert.equal(
  adapter.isSupportedUrl("https://example.com"),
  false,
  "Non-chat URLs should not be treated as supported platforms"
);

console.log("Platform adapter checks passed.");
