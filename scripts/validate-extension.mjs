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
    return null;
  }

  const normalized = relativePath.replace(/\\/g, "/");
  const absolutePath = path.join(extensionDir, normalized);
  const relativeFromExtension = path.relative(extensionDir, absolutePath);

  if (relativeFromExtension.startsWith("..") || path.isAbsolute(relativeFromExtension)) {
    fail(`${label} points outside extension directory: ${relativePath}`);
    return null;
  }

  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`${label} file not found: ${relativePath}`);
    return null;
  }

  return absolutePath;
}

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Invalid ${label}: ${error.message}`);
    return null;
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
    if (Array.isArray(manifest.permissions) && manifest.permissions.includes("scripting")) {
      warn("No static content_scripts found. Assuming dynamic scripting registration via background worker.");
      return;
    }

    fail("manifest must provide content_scripts or the 'scripting' permission for dynamic injection");
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

function validateManagedStorage(manifest) {
  if (!manifest.storage || typeof manifest.storage !== "object") {
    return;
  }

  if (!manifest.storage.managed_schema) {
    return;
  }

  const schemaPath = assertFileExists(manifest.storage.managed_schema, "storage.managed_schema");
  if (!schemaPath) {
    return;
  }

  const schema = readJsonFile(schemaPath, "storage.managed_schema");
  if (!schema) {
    return;
  }

  validateManagedStorageSchemaNode(schema, "storage.managed_schema", true);
}

function validateManagedStorageSchemaNode(schemaNode, label, isRoot = false) {
  if (!schemaNode || typeof schemaNode !== "object" || Array.isArray(schemaNode)) {
    fail(`${label} must be a schema object`);
    return;
  }

  const hasRef = Object.prototype.hasOwnProperty.call(schemaNode, "$ref");
  const hasType = Object.prototype.hasOwnProperty.call(schemaNode, "type");

  if (hasRef && typeof schemaNode.$ref !== "string") {
    fail(`${label}.$ref must be a string`);
  }

  if (hasRef && hasType) {
    fail(`${label} must use either $ref or type, not both`);
  } else if (!hasRef && !hasType) {
    fail(`${label} must provide either $ref or exactly one type`);
  } else if (hasType && typeof schemaNode.type !== "string") {
    fail(`${label}.type must be a single string`);
  }

  if (isRoot) {
    if (schemaNode.type !== "object") {
      fail("storage.managed_schema top-level type must be object");
    }

    if (Object.prototype.hasOwnProperty.call(schemaNode, "additionalProperties")) {
      fail("storage.managed_schema top-level object cannot include additionalProperties");
    }
  } else if (Object.prototype.hasOwnProperty.call(schemaNode, "additionalProperties")) {
    const additionalProperties = schemaNode.additionalProperties;
    if (
      !additionalProperties ||
      typeof additionalProperties !== "object" ||
      Array.isArray(additionalProperties)
    ) {
      fail(`${label}.additionalProperties must be a schema object`);
    } else {
      validateManagedStorageSchemaNode(
        additionalProperties,
        `${label}.additionalProperties`
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(schemaNode, "properties")) {
    if (
      !schemaNode.properties ||
      typeof schemaNode.properties !== "object" ||
      Array.isArray(schemaNode.properties)
    ) {
      fail(`${label}.properties must be an object`);
    } else {
      Object.entries(schemaNode.properties).forEach(([propertyName, propertySchema]) => {
        validateManagedStorageSchemaNode(
          propertySchema,
          `${label}.properties.${propertyName}`
        );
      });
    }
  }

  if (Object.prototype.hasOwnProperty.call(schemaNode, "items")) {
    validateManagedStorageSchemaNode(schemaNode.items, `${label}.items`);
  }
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
validateManagedStorage(manifest);
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
