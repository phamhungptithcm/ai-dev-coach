#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const extensionDir = path.join(repoRoot, "extension");
const manifestPath = path.join(extensionDir, "manifest.json");

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function relativeToExtension(filePath) {
  return path.relative(extensionDir, filePath) || ".";
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    fail("Missing extension/manifest.json");
    return null;
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid manifest.json: ${error.message}`);
    return null;
  }
}

function assertFileExists(relativePath, label) {
  if (!relativePath || typeof relativePath !== "string") {
    fail(`${label} is not configured`);
    return;
  }

  const normalized = relativePath.replace(/\\/g, "/");
  const absolutePath = path.join(extensionDir, normalized);
  const relativeFromExtension = path.relative(extensionDir, absolutePath);

  if (relativeFromExtension.startsWith("..") || path.isAbsolute(relativeFromExtension)) {
    fail(`${label} points outside extension directory: ${relativePath}`);
    return;
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`${label} file not found: ${relativePath}`);
  }
}

function validateManifestCore(manifest) {
  if (manifest.manifest_version !== 3) {
    fail("manifest_version must be 3");
  }

  if (!manifest.name || typeof manifest.name !== "string") {
    fail("manifest.name is required");
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    fail("manifest.version must follow semantic version format (x.y.z)");
  }

  if (!Array.isArray(manifest.permissions) || !manifest.permissions.includes("storage")) {
    fail("manifest.permissions must include 'storage'");
  }

  if (!Array.isArray(manifest.host_permissions) || manifest.host_permissions.length === 0) {
    fail("manifest.host_permissions must include at least one host");
  }

  if (!manifest.background || !manifest.background.service_worker) {
    fail("manifest.background.service_worker is required");
  } else {
    assertFileExists(manifest.background.service_worker, "background.service_worker");
  }

  if (!manifest.action || !manifest.action.default_popup) {
    fail("manifest.action.default_popup is required");
  } else {
    assertFileExists(manifest.action.default_popup, "action.default_popup");
  }

  if (!manifest.options_page) {
    fail("manifest.options_page is required");
  } else {
    assertFileExists(manifest.options_page, "options_page");
  }
}

function validateIcons(manifest) {
  const iconSets = [
    { source: "icons", value: manifest.icons },
    { source: "action.default_icon", value: manifest.action?.default_icon }
  ];

  for (const iconSet of iconSets) {
    if (!iconSet.value || typeof iconSet.value !== "object") {
      warn(`No ${iconSet.source} entries found`);
      continue;
    }

    for (const [size, iconPath] of Object.entries(iconSet.value)) {
      if (!/^\d+$/.test(String(size))) {
        fail(`${iconSet.source} key must be numeric size, got: ${size}`);
        continue;
      }
      assertFileExists(iconPath, `${iconSet.source}[${size}]`);
    }
  }
}

function validateContentScripts(manifest) {
  if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
    fail("manifest.content_scripts must contain at least one entry");
    return;
  }

  manifest.content_scripts.forEach((entry, index) => {
    const prefix = `content_scripts[${index}]`;

    if (!Array.isArray(entry.matches) || entry.matches.length === 0) {
      fail(`${prefix}.matches must contain at least one match pattern`);
    }

    if (!Array.isArray(entry.js) || entry.js.length === 0) {
      fail(`${prefix}.js must contain at least one file`);
    } else {
      entry.js.forEach((filePath, fileIndex) => {
        assertFileExists(filePath, `${prefix}.js[${fileIndex}]`);
      });
    }

    if (Array.isArray(entry.css)) {
      entry.css.forEach((filePath, fileIndex) => {
        assertFileExists(filePath, `${prefix}.css[${fileIndex}]`);
      });
    }
  });
}

function walkFiles(directory, collector) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, collector);
      continue;
    }
    collector(absolutePath);
  }
}

function validateJunkFiles() {
  const junkFiles = [];

  walkFiles(extensionDir, (filePath) => {
    if (path.basename(filePath) === ".DS_Store") {
      junkFiles.push(relativeToExtension(filePath));
    }
  });

  if (junkFiles.length > 0) {
    fail(`Remove .DS_Store files from extension/: ${junkFiles.join(", ")}`);
  }
}

function run() {
  if (!fs.existsSync(extensionDir) || !fs.statSync(extensionDir).isDirectory()) {
    fail("Missing extension/ directory");
  }

  const manifest = readManifest();
  if (manifest) {
    validateManifestCore(manifest);
    validateIcons(manifest);
    validateContentScripts(manifest);
  }

  if (fs.existsSync(extensionDir) && fs.statSync(extensionDir).isDirectory()) {
    validateJunkFiles();
  }

  if (warnings.length > 0) {
    warnings.forEach((message) => {
      console.warn(`Warning: ${message}`);
    });
  }

  if (failures.length > 0) {
    failures.forEach((message) => {
      console.error(`Error: ${message}`);
    });
    process.exit(1);
  }

  console.log("Extension validation passed.");
}

run();
