#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const popupSource = fs.readFileSync("extension/popup/popup.js", "utf8");

assert.match(
  popupSource,
  /function\s+resolveRoleKey\s*\(/,
  "popup should define the role-key resolver used during prompt generation"
);

assert.doesNotMatch(
  popupSource,
  /\bresolvedRoleKey\s*\(/,
  "popup prompt generation should not call the undefined resolvedRoleKey helper"
);

assert.match(
  popupSource,
  /roleKey:\s*resolveRoleKey\(profile\)/,
  "prompt linter payload should use the defined resolveRoleKey helper"
);

console.log("Popup prompt builder checks passed.");
