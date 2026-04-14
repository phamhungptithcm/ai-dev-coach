const path = require("node:path");

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}

const repoRoot = path.resolve(__dirname, "..");
const roleCoaching = require(path.join(repoRoot, "extension", "shared", "roleCoaching.js"));
globalThis.AIDevCoachRoleCoaching = roleCoaching;
require(path.join(repoRoot, "extension", "content", "secretDetection.js"));
const promptQualityEngine = require(path.join(repoRoot, "extension", "shared", "promptQualityEngine.js"));
globalThis.AIDevCoachPromptQualityEngine = promptQualityEngine;
const promptLinter = require(path.join(repoRoot, "extension", "shared", "promptLinter.js"));

const TEMPLATE_DEFINITIONS = {
  debugging: {
    label: "Debugging Prompt",
    taskPlaceholder: "Describe the failing behavior or runtime error you want help diagnosing.",
    contextPlaceholder: "Include the exact error, stack trace, file path, and expected vs actual behavior.",
    attemptPlaceholder: "List the debugging steps you already tried and what changed.",
    constraintsPlaceholder: "Mention runtime, framework, risk, or time constraints.",
    acceptancePlaceholder: "Define how you will verify the fix and guard against regression."
  },
  code_review: {
    label: "Code Review Prompt",
    taskPlaceholder: "Describe the review goal for this change or PR.",
    contextPlaceholder: "Summarize changed files, risk areas, and known constraints.",
    attemptPlaceholder: "List the issues or suspicions you already found in your own review.",
    constraintsPlaceholder: "Call out style guide, performance, or compatibility constraints.",
    acceptancePlaceholder: "Describe the kind of findings or test ideas you want back."
  },
  system_design: {
    label: "System Design Prompt",
    taskPlaceholder: "State the architecture or systems question you want to evaluate.",
    contextPlaceholder: "Include users, traffic, integrations, SLAs, and current architecture context.",
    attemptPlaceholder: "Describe the options or tradeoffs you already considered.",
    constraintsPlaceholder: "Include cost, reliability, compliance, and rollout constraints.",
    acceptancePlaceholder: "Define the decision, tradeoff analysis, or rollout plan you need."
  },
  refactoring: {
    label: "Refactoring Prompt",
    taskPlaceholder: "Describe the module or code path you want to refactor.",
    contextPlaceholder: "Include current pain points, smells, boundaries, and code context.",
    attemptPlaceholder: "List the refactor steps or design ideas you already considered.",
    constraintsPlaceholder: "Call out behavior-preservation, deadline, or team constraints.",
    acceptancePlaceholder: "Define how you will prove behavior stayed stable after the refactor."
  },
  performance_optimization: {
    label: "Performance Optimization Prompt",
    taskPlaceholder: "Describe the performance problem you want to improve.",
    contextPlaceholder: "Include current metrics, bottleneck symptoms, and workload details.",
    attemptPlaceholder: "List the profiling or benchmark work you already completed.",
    constraintsPlaceholder: "Include latency, throughput, memory, and cost constraints.",
    acceptancePlaceholder: "Define the target improvement and how you will measure it."
  },
  learning: {
    label: "Learning Prompt",
    taskPlaceholder: "State the concept or topic you want to understand better.",
    contextPlaceholder: "Describe your current understanding and where the confusion starts.",
    attemptPlaceholder: "List the examples, docs, or exercises you already tried.",
    constraintsPlaceholder: "Mention time limits, preferred examples, or depth constraints.",
    acceptancePlaceholder: "Define how you will know the concept finally clicked."
  }
};

const ROLE_ITEMS = [
  { key: "software_engineer", label: "Software Engineer" },
  { key: "solution_architecture", label: "Solution Architect" },
  { key: "manager", label: "Engineering Manager" },
  { key: "other", label: "Other Tech Role" }
];

function clean(value) {
  return (value || "").trim();
}

function normalizeRoleKey(value) {
  return roleCoaching.normalizeVisibleRoleKey
    ? roleCoaching.normalizeVisibleRoleKey(value)
    : roleCoaching.normalizeRoleKey(value);
}

function normalizeTemplateKey(value) {
  const key = clean(value).toLowerCase();
  return TEMPLATE_DEFINITIONS[key] ? key : "debugging";
}

function normalizeLevel(value) {
  return roleCoaching.normalizeLevel(value) || "Junior";
}

function buildProfile(options = {}) {
  const roleKey = normalizeRoleKey(options.roleKey || "software_engineer");
  const baseRole = ROLE_ITEMS.find((item) => item.key === roleKey);
  return roleCoaching.coerceToVisibleRoleProfile({
    roleKey,
    role: clean(options.role) || baseRole?.label || "Software Engineer",
    skill: normalizeLevel(options.level),
    habitGoals: clean(options.habitGoals)
  });
}

function buildPromptSkeleton(options = {}) {
  const profile = buildProfile(options);
  const templateKey = normalizeTemplateKey(options.templateKey);
  const template = TEMPLATE_DEFINITIONS[templateKey];
  const roleProfile = roleCoaching.getRoleProfile(profile);

  return [
    `Role: ${roleProfile.label}`,
    `Level: ${profile.skill}`,
    "",
    "Task:",
    template.taskPlaceholder,
    "",
    "Context:",
    `${template.contextPlaceholder} ${roleProfile.contextHint}`,
    "",
    "What I Tried:",
    `${template.attemptPlaceholder} ${roleProfile.attemptHint}`,
    "",
    "Constraints:",
    template.constraintsPlaceholder,
    "",
    "Acceptance Criteria:",
    template.acceptancePlaceholder
  ].join("\n");
}

function analyzePrompt(options = {}) {
  const profile = buildProfile(options);
  const templateKey = normalizeTemplateKey(options.templateKey);
  const prompt = clean(options.prompt);
  const secretGuard =
    typeof globalThis !== "undefined" &&
    globalThis.AIDevCoachSecretGuard &&
    typeof globalThis.AIDevCoachSecretGuard.inspectPromptForSecrets === "function"
      ? globalThis.AIDevCoachSecretGuard
      : null;
  const analysis = promptQualityEngine.calculatePromptScore({
    prompt,
    profile,
    templateKey
  });
  const secretInspection = secretGuard
    ? secretGuard.inspectPromptForSecrets(prompt)
    : { findings: [], highestSeverity: null, redactedPrompt: prompt };
  const lintReport = promptLinter.lintPrompt({
    prompt,
    profile,
    templateKey,
    analysis,
    secretInspection
  });
  const recommendedTemplate = roleCoaching.getRecommendedTemplateForProfile(profile, {
    templates: TEMPLATE_DEFINITIONS,
    defaultTemplate: "debugging"
  });

  return {
    profile,
    templateKey,
    template: TEMPLATE_DEFINITIONS[templateKey],
    recommendedTemplate,
    analysis,
    lintReport,
    secretInspection
  };
}

module.exports = {
  TEMPLATE_DEFINITIONS,
  ROLE_ITEMS,
  analyzePrompt,
  buildPromptSkeleton
};
