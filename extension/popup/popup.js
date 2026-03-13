const TEMPLATES = {
  debugging: {
    label: "Debugging Prompt",
    hint: "Diagnose runtime errors, broken logic, and failing tests.",
    contextPlaceholder: "Error text, stack trace, file path, expected vs actual behavior",
    attemptPlaceholder: "What you already tried, hypotheses, and what changed",
    rules: [
      "Start with a diagnosis path and likely root causes.",
      "Ask one clarifying question if context is missing.",
      "Give one smallest safe next step before full code.",
      "Explain why the fix works and what to test."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "You are my debugging mentor.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Debug independently before asking for final code"}`,
        "",
        `Debug task: ${task}`,
        `Context: ${context}`,
        `What I already tried: ${attempt}`,
        `Constraints: ${constraints || "None"}`,
        `Acceptance criteria: ${acceptance || "Confirm root cause, fix, and regression checks"}`,
        "",
        "Response rules:",
        "1) Start with diagnosis and probable causes.",
        "2) Suggest one minimal next check.",
        "3) Provide patch guidance only after reasoning.",
        "4) End with verification steps."
      ].join("\n");
    }
  },
  code_review: {
    label: "Code Review Prompt",
    hint: "Get structured review findings with impact and fix direction.",
    contextPlaceholder: "PR summary, changed files, risks, known constraints",
    attemptPlaceholder: "Your self-review findings so far",
    rules: [
      "Prioritize bugs, regressions, security, and data integrity issues.",
      "Explain impact and confidence for each finding.",
      "Suggest practical fixes and missing tests.",
      "Keep advice specific to the given code context."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "Act as a pragmatic senior reviewer and coach.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Improve code quality and review judgment"}`,
        "",
        `Review goal: ${task}`,
        `Code context: ${context}`,
        `My self-review first pass: ${attempt}`,
        `Constraints: ${constraints || "None"}`,
        `Acceptance criteria: ${acceptance || "Clear prioritized findings with test suggestions"}`,
        "",
        "Response rules:",
        "1) List findings by severity.",
        "2) Explain impact and fix direction.",
        "3) Include missing tests and edge cases.",
        "4) End with one learning takeaway."
      ].join("\n");
    }
  },
  system_design: {
    label: "System Design Prompt",
    hint: "Design architecture with tradeoffs, reliability, and scale.",
    contextPlaceholder: "Users, traffic profile, constraints, current architecture",
    attemptPlaceholder: "Your proposed architecture and open questions",
    rules: [
      "Define requirements and constraints first.",
      "Present architecture with tradeoffs and failure modes.",
      "Include data flow, scaling, and observability.",
      "Recommend phased implementation if needed."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "Act as a staff engineer helping with system design.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Reason with tradeoffs before implementation"}`,
        "",
        `Design problem: ${task}`,
        `System context: ${context}`,
        `My current design attempt: ${attempt}`,
        `Constraints: ${constraints || "Latency, cost, reliability, and team bandwidth"}`,
        `Acceptance criteria: ${acceptance || "Architecture, tradeoffs, and rollout plan"}`,
        "",
        "Response rules:",
        "1) Clarify functional and non-functional requirements.",
        "2) Propose architecture with tradeoffs.",
        "3) Cover data model, scaling, failure handling.",
        "4) Provide phased rollout and risk mitigations."
      ].join("\n");
    }
  },
  refactoring: {
    label: "Refactoring Prompt",
    hint: "Improve structure and maintainability without behavior changes.",
    contextPlaceholder: "Current module pain points, code smells, boundaries",
    attemptPlaceholder: "Refactor directions you considered and blockers",
    rules: [
      "Preserve behavior first.",
      "Prioritize readability and maintainability.",
      "Suggest safe refactor sequence.",
      "Include regression test strategy."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "Act as a refactoring coach.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Improve design while preserving behavior"}`,
        "",
        `Refactoring target: ${task}`,
        `Current code context: ${context}`,
        `My initial refactor attempt: ${attempt}`,
        `Constraints: ${constraints || "No functional regressions, limited time"}`,
        `Acceptance criteria: ${acceptance || "Cleaner structure with tests proving unchanged behavior"}`,
        "",
        "Response rules:",
        "1) Identify core code smells first.",
        "2) Provide low-risk refactor sequence.",
        "3) Keep behavior stable and testable.",
        "4) Explain before/after design rationale."
      ].join("\n");
    }
  },
  performance_optimization: {
    label: "Performance Optimization Prompt",
    hint: "Optimize bottlenecks with metrics and measurable impact.",
    contextPlaceholder: "Current latency/CPU/memory metrics and bottleneck hints",
    attemptPlaceholder: "What profiling or measurement you already ran",
    rules: [
      "Use measurements before optimization decisions.",
      "Focus highest-impact bottlenecks first.",
      "Describe tradeoffs and risk of each change.",
      "Define benchmark and regression guardrails."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "Act as a performance optimization mentor.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Measure first, optimize second"}`,
        "",
        `Performance goal: ${task}`,
        `Metrics and context: ${context}`,
        `What I measured or tried: ${attempt}`,
        `Constraints: ${constraints || "Throughput, latency, memory, cost"}`,
        `Acceptance criteria: ${acceptance || "Measurable performance improvement with stable correctness"}`,
        "",
        "Response rules:",
        "1) Validate baseline and bottleneck hypothesis.",
        "2) Propose top optimizations by expected impact.",
        "3) Explain tradeoffs and regression risks.",
        "4) Provide benchmark and rollback strategy."
      ].join("\n");
    }
  },
  learning: {
    label: "Learning Prompt",
    hint: "Learn concepts step-by-step without over-relying on final answers.",
    contextPlaceholder: "Topic background, confusion points, known concepts",
    attemptPlaceholder: "Your current understanding and where you get stuck",
    rules: [
      "Guide with questions before giving final answer.",
      "Use progressive explanation from simple to advanced.",
      "Add a small exercise to validate understanding.",
      "Call out common mistakes and anti-patterns."
    ],
    build({ profile, task, context, attempt, constraints, acceptance }) {
      return [
        "Teach me like a technical mentor.",
        `Role: ${profile.role || "Not provided"}`,
        `Level: ${profile.skill || "Not provided"}`,
        `Habit goal: ${profile.habitGoals || "Strengthen independent reasoning"}`,
        "",
        `Learning goal: ${task}`,
        `Current context: ${context}`,
        `My current understanding: ${attempt}`,
        `Constraints: ${constraints || "Use concise examples and avoid jargon overload"}`,
        `Acceptance criteria: ${acceptance || "Clear understanding, practice task, and recap"}`,
        "",
        "Response rules:",
        "1) Ask one guiding question first.",
        "2) Explain in progressive steps.",
        "3) Give one short exercise.",
        "4) End with recap and common mistakes."
      ].join("\n");
    }
  }
};

const DEFAULT_PROFILE = {
  role: "",
  roleKey: "",
  skill: "",
  habitGoals: ""
};

const DEFAULT_SETTINGS = {
  promptListenerEnabled: true,
  behaviorMonitorEnabled: true
};

const DEFAULT_STATS = {
  aiRequests: 0,
  manualAttempts: 0,
  largePastes: 0,
  aiCopies: 0,
  fastAiCopies: 0,
  badPrompts: 0,
  shortcutPrompts: 0
};

const DEFAULT_TEMPLATE_KEY = "debugging";
const REQUIRED_KEYS = ["task", "context", "attempt"];

const roleSelect = document.getElementById("roleSelect");
const customRoleInput = document.getElementById("customRoleInput");
const skillInput = document.getElementById("skillInput");
const habitInput = document.getElementById("habitInput");
const templateSelect = document.getElementById("templateSelect");
const templateHint = document.getElementById("templateHint");
const rolePromptHint = document.getElementById("rolePromptHint");
const roleCoachingLabel = document.getElementById("roleCoachingLabel");
const roleCoachingFocus = document.getElementById("roleCoachingFocus");
const roleCoachingList = document.getElementById("roleCoachingList");
const taskInput = document.getElementById("taskInput");
const contextInput = document.getElementById("contextInput");
const attemptInput = document.getElementById("attemptInput");
const constraintsInput = document.getElementById("constraintsInput");
const acceptanceInput = document.getElementById("acceptanceInput");
const requiredChecklist = document.getElementById("requiredChecklist");
const generatedPrompt = document.getElementById("generatedPrompt");
const profileStatus = document.getElementById("profileStatus");
const promptStatus = document.getElementById("promptStatus");
const monitorStatus = document.getElementById("monitorStatus");
const habitStats = document.getElementById("habitStats");
const profileBadge = document.getElementById("profileBadge");
const profileForm = document.getElementById("profileForm");
const profileSummary = document.getElementById("profileSummary");
const editProfileBtn = document.getElementById("editProfileBtn");
const promptListenerToggle = document.getElementById("promptListenerToggle");
const behaviorMonitorToggle = document.getElementById("behaviorMonitorToggle");
const promptScoreValue = document.getElementById("promptScoreValue");
const promptScoreGrade = document.getElementById("promptGrade");
const promptScoreSummary = document.getElementById("promptScoreSummary");
const scoreBreakdown = document.getElementById("scoreBreakdown");
const scoreTips = document.getElementById("scoreTips");
const promptLintSummary = document.getElementById("promptLintSummary");
const lintResults = document.getElementById("lintResults");
const analyticsPromptCount = document.getElementById("analyticsPromptCount");
const analyticsAverageScore = document.getElementById("analyticsAverageScore");
const analyticsAverageLength = document.getElementById("analyticsAverageLength");
const analyticsSummary = document.getElementById("analyticsSummary");
const analyticsMeta = document.getElementById("analyticsMeta");
const sessionSummaryScore = document.getElementById("sessionSummaryScore");
const sessionSummaryDay = document.getElementById("sessionSummaryDay");
const sessionSummaryHeadline = document.getElementById("sessionSummaryHeadline");
const sessionSummaryStats = document.getElementById("sessionSummaryStats");
const sessionCategoryList = document.getElementById("sessionCategoryList");
const sessionSuggestionList = document.getElementById("sessionSuggestionList");
const trendWindowLabel = document.getElementById("trendWindowLabel");
const trendActiveDays = document.getElementById("trendActiveDays");
const qualityTrendDelta = document.getElementById("qualityTrendDelta");
const qualityTrendChart = document.getElementById("qualityTrendChart");
const qualityTrendSummary = document.getElementById("qualityTrendSummary");
const warningTrendDelta = document.getElementById("warningTrendDelta");
const warningTrendChart = document.getElementById("warningTrendChart");
const warningTrendSummary = document.getElementById("warningTrendSummary");
const trendTopCategory = document.getElementById("trendTopCategory");
const categoryTrendBars = document.getElementById("categoryTrendBars");
const trendRulesSummary = document.getElementById("trendRulesSummary");

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(payload) {
  return new Promise((resolve) => chrome.storage.local.set(payload, resolve));
}

function clean(value) {
  return (value || "").trim();
}

function getPromptQualityEngine() {
  const engine = window.AIDevCoachPromptQualityEngine;
  if (!engine || typeof engine.calculatePromptScore !== "function") {
    throw new Error("Prompt quality engine is unavailable.");
  }
  return engine;
}

function getRoleCoaching() {
  const roleCoaching = window.AIDevCoachRoleCoaching;
  if (!roleCoaching || typeof roleCoaching.getRoleProfile !== "function") {
    throw new Error("Role coaching module is unavailable.");
  }
  return roleCoaching;
}

function getPromptLinter() {
  const linter = window.AIDevCoachPromptLinter;
  if (!linter || typeof linter.lintPrompt !== "function") {
    throw new Error("Prompt linter is unavailable.");
  }
  return linter;
}

function getLearningAnalytics() {
  const analytics = window.AIDevCoachLearningAnalytics;
  if (
    !analytics ||
    typeof analytics.getSnapshot !== "function" ||
    typeof analytics.buildTrendDashboard !== "function"
  ) {
    throw new Error("Learning analytics engine is unavailable.");
  }
  return analytics;
}

function normalizeLevel(value) {
  return getRoleCoaching().normalizeLevel(value);
}

function isStudentLevel(value) {
  return getRoleCoaching().isStudentLevel(value);
}

function migrateLegacyStudentProfile(rawProfile = {}) {
  return getRoleCoaching().migrateLegacyStudentProfile(rawProfile);
}

function normalizeRoleKey(value) {
  return getRoleCoaching().normalizeRoleKey(value);
}

function resolveRoleKey(rawProfile = {}) {
  return getRoleCoaching().resolveRoleKey(rawProfile);
}

function getRoleProfile(rawProfile = {}) {
  return getRoleCoaching().getRoleProfile(rawProfile);
}

function setCustomRoleVisibility(roleKey) {
  customRoleInput.classList.toggle("hidden", roleKey !== "other");
}

function buildRoleHeaderLines(roleProfile) {
  return getRoleCoaching().buildRoleHeaderLines(roleProfile);
}

function setStatus(target, message, ok) {
  target.textContent = message || "";
  target.classList.remove("status--ok", "status--error");

  if (!message) {
    return;
  }

  target.classList.add(ok ? "status--ok" : "status--error");
}

function computeDependency(stats) {
  const total = stats.aiRequests + stats.manualAttempts;
  if (total === 0) {
    return 0;
  }
  return Math.round((stats.aiRequests / total) * 100);
}

function applyTemplateUI(template) {
  if (!template) {
    return;
  }

  const currentProfile = readProfileForm();
  const roleProfile = getRoleProfile(currentProfile);
  const recommendedTemplateKey = getRecommendedTemplateForProfile(currentProfile);
  const recommendedTemplate = TEMPLATES[recommendedTemplateKey];
  templateHint.textContent = template.hint;
  rolePromptHint.textContent = `Role mode: ${roleProfile.label}. ${roleProfile.builderHint}`;
  if (roleProfile.specializationLabel) {
    rolePromptHint.textContent += ` Specialization: ${roleProfile.specializationLabel}.`;
  }
  if (isStudentLevel(currentProfile.skill)) {
    rolePromptHint.textContent += " Level mode: Student learning flow is active.";
  }
  if (recommendedTemplate) {
    const recommendationNote =
      templateSelect.value === recommendedTemplateKey
        ? `Recommended template applied: ${recommendedTemplate.label}.`
        : `Recommended template for this role: ${recommendedTemplate.label}.`;
    templateHint.textContent = `${template.hint} ${recommendationNote}`;
  }
  contextInput.placeholder = `${template.contextPlaceholder}. ${roleProfile.contextHint}.`;
  attemptInput.placeholder = `${template.attemptPlaceholder}. ${roleProfile.attemptHint}.`;
  renderRoleCoaching(currentProfile);
}

function renderTemplates(selectedTemplate) {
  templateSelect.innerHTML = "";

  Object.entries(TEMPLATES).forEach(([key, template]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = template.label;
    option.selected = key === selectedTemplate;
    templateSelect.appendChild(option);
  });

  applyTemplateUI(TEMPLATES[templateSelect.value]);
}

function readProfileForm() {
  const selectedRoleKey = roleSelect.value || "software_engineer";
  const roleOptions = getRoleCoaching().JOB_ROLE_OPTIONS;
  const selectedRoleProfile = roleOptions[selectedRoleKey] || roleOptions.software_engineer;
  const customRole = clean(customRoleInput.value);
  const resolvedRoleLabel = selectedRoleKey === "other" ? customRole || "Other" : selectedRoleProfile.label;

  return {
    roleKey: selectedRoleKey,
    role: resolvedRoleLabel,
    skill: normalizeLevel(skillInput.value),
    habitGoals: clean(habitInput.value)
  };
}

function readMonitoringForm() {
  return {
    promptListenerEnabled: !!promptListenerToggle.checked,
    behaviorMonitorEnabled: !!behaviorMonitorToggle.checked
  };
}

function readPromptForm() {
  return {
    task: clean(taskInput.value),
    context: clean(contextInput.value),
    attempt: clean(attemptInput.value),
    constraints: clean(constraintsInput.value),
    acceptance: clean(acceptanceInput.value)
  };
}

function validatePromptFields(fields) {
  return REQUIRED_KEYS.filter((key) => !fields[key]);
}

function fillProfile(profile) {
  const roleKey = resolveRoleKey(profile);
  roleSelect.value = roleKey;
  setCustomRoleVisibility(roleKey);
  customRoleInput.value =
    roleKey === "other" && clean(profile.role).toLowerCase() !== "other" ? clean(profile.role) : "";
  skillInput.value = normalizeLevel(profile.skill);
  habitInput.value = profile.habitGoals || "";
}

function getRecommendedTemplateForProfile(profile) {
  return getRoleCoaching().getRecommendedTemplateForProfile(profile, {
    templates: TEMPLATES,
    defaultTemplate: DEFAULT_TEMPLATE_KEY
  });
}

function renderRoleCoaching(profile) {
  const roleCoaching = getRoleCoaching();
  const snapshot = roleCoaching.buildRoleCoachingSnapshot(profile);
  roleCoachingLabel.textContent = snapshot.roleProfile.label;
  roleCoachingFocus.textContent = snapshot.focusLine;

  const coachingLines = [];
  (snapshot.examples || []).slice(0, 2).forEach((example) => {
    coachingLines.push(`Example ask: ${example}`);
  });
  if (snapshot.warningHint) {
    coachingLines.push(`Watch for: ${snapshot.warningHint}`);
  }
  if (snapshot.safetyGuardrail) {
    coachingLines.push(`Guardrail: ${snapshot.safetyGuardrail}`);
  }

  renderList(
    roleCoachingList,
    coachingLines,
    "Role-specific examples will appear after you choose a role."
  );
}

function hasProfileData(profile) {
  return !!(clean(profile.role) || clean(profile.skill) || clean(profile.habitGoals));
}

function renderProfileBadge(profile) {
  if (!hasProfileData(profile)) {
    profileBadge.textContent = "Profile: Not set";
    profileBadge.classList.add("profile-badge--empty");
    return;
  }

  const role = clean(profile.role) || "Developer";
  const skill = clean(profile.skill);
  const badgeParts = [role];
  if (skill) {
    badgeParts.push(skill);
  }

  profileBadge.textContent = badgeParts.join(" • ");
  profileBadge.classList.remove("profile-badge--empty");
}

function renderProfileView(profile, forceEditMode = false) {
  const hasData = hasProfileData(profile);
  const showForm = forceEditMode || !hasData;

  profileForm.classList.toggle("hidden", !showForm);
  editProfileBtn.classList.toggle("hidden", showForm || !hasData);

  if (!showForm && hasData) {
    const role = clean(profile.role) || "Not set";
    const skill = clean(profile.skill) || "Not set";
    const goal = clean(profile.habitGoals) || "Not set";
    profileSummary.textContent = `Role: ${role} | Level: ${skill} | Goal: ${goal}`;
    profileSummary.classList.remove("hidden");
  } else {
    profileSummary.textContent = "";
    profileSummary.classList.add("hidden");
  }

  renderProfileBadge(profile);
}

function fillMonitoring(settings) {
  promptListenerToggle.checked = !!settings.promptListenerEnabled;
  behaviorMonitorToggle.checked = !!settings.behaviorMonitorEnabled;
}

function renderStats(stats) {
  const dependency = computeDependency(stats);
  habitStats.textContent = `AI requests: ${stats.aiRequests} | Manual attempts: ${stats.manualAttempts} | Dependency: ${dependency}% | Bad prompts: ${stats.badPrompts} | Shortcut prompts: ${stats.shortcutPrompts} | Large pastes: ${stats.largePastes} | AI copies: ${stats.aiCopies} | Fast copies: ${stats.fastAiCopies}`;
}

function formatAnalyticsValue(value, suffix = "") {
  return Number.isFinite(value) ? `${value}${suffix}` : "--";
}

function formatAnalyticsTime(timestamp) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "No prompt tracked yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function pickTopEntry(countMap) {
  const entries = Object.entries(countMap || {});
  if (entries.length === 0) {
    return null;
  }

  entries.sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return left[0].localeCompare(right[0]);
  });

  const [label, count] = entries[0];
  return { label, count };
}

function renderEmptyTrendChart(target, message) {
  target.innerHTML = `<text x="110" y="46" text-anchor="middle" font-size="11" fill="#6b8597">${message}</text>`;
}

function buildLineChartMarkup(series, getValue, options = {}) {
  const width = 220;
  const height = 84;
  const paddingX = 14;
  const paddingTop = 10;
  const paddingBottom = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Number.isFinite(options.maxValue) ? options.maxValue : 100;
  const validSeries = series.filter((entry) => Number.isFinite(getValue(entry)));

  if (validSeries.length === 0) {
    return null;
  }

  const xForIndex = (index) =>
    series.length === 1 ? width / 2 : paddingX + (index * (width - paddingX * 2)) / (series.length - 1);
  const yForValue = (value) =>
    height - paddingBottom - (Math.max(0, Math.min(maxValue, value)) / maxValue) * chartHeight;

  const guides = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const y = paddingTop + chartHeight * ratio;
      return `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="rgba(123, 170, 204, 0.18)" stroke-width="1" />`;
    })
    .join("");

  const segments = [];
  let currentSegment = [];

  series.forEach((entry, index) => {
    const value = getValue(entry);
    if (!Number.isFinite(value)) {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
      return;
    }
    currentSegment.push(`${xForIndex(index)},${yForValue(value)}`);
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  const polylines = segments
    .map(
      (segment) =>
        `<polyline fill="none" stroke="${options.stroke || "#4b8fbe"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${segment.join(" ")}" />`
    )
    .join("");

  const dots = series
    .map((entry, index) => {
      const value = getValue(entry);
      if (!Number.isFinite(value)) {
        return "";
      }
      return `<circle cx="${xForIndex(index)}" cy="${yForValue(value)}" r="3.2" fill="${options.dotFill || "#2a648f"}" />`;
    })
    .join("");

  const labels = series
    .map((entry, index) => {
      const dayLabel = entry.dayKey ? entry.dayKey.slice(8) : String(index + 1);
      return `<text x="${xForIndex(index)}" y="${height - 5}" text-anchor="middle" font-size="9" fill="#6b8597">${dayLabel}</text>`;
    })
    .join("");

  return `${guides}${polylines}${dots}${labels}`;
}

function buildBarChartMarkup(series, getValue, options = {}) {
  const width = 220;
  const height = 84;
  const paddingX = 14;
  const paddingTop = 10;
  const paddingBottom = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = series.map((entry) => getValue(entry)).filter((value) => Number.isFinite(value));
  const maxValue = Math.max(Number.isFinite(options.maxValue) ? options.maxValue : 0, ...values, 1);

  if (values.length === 0) {
    return null;
  }

  const gap = 6;
  const barWidth = Math.max(10, (width - paddingX * 2 - gap * Math.max(0, series.length - 1)) / Math.max(1, series.length));

  const guides = [0.25, 0.5, 0.75]
    .map((ratio) => {
      const y = paddingTop + chartHeight * ratio;
      return `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="rgba(123, 170, 204, 0.18)" stroke-width="1" />`;
    })
    .join("");

  const bars = series
    .map((entry, index) => {
      const value = getValue(entry);
      const x = paddingX + index * (barWidth + gap);
      const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
      const barHeight = maxValue > 0 ? (normalized / maxValue) * chartHeight : 0;
      const y = height - paddingBottom - barHeight;
      const dayLabel = entry.dayKey ? entry.dayKey.slice(8) : String(index + 1);
      return [
        `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${options.fill || "rgba(125, 183, 227, 0.88)"}" />`,
        `<text x="${x + barWidth / 2}" y="${height - 5}" text-anchor="middle" font-size="9" fill="#6b8597">${dayLabel}</text>`
      ].join("");
    })
    .join("");

  return `${guides}${bars}`;
}

function setTrendDelta(node, direction, delta, options = {}) {
  node.className = "trend-delta";
  if (!Number.isFinite(delta)) {
    node.textContent = "--";
    node.classList.add("trend-delta--steady");
    return;
  }

  const preferLower = !!options.preferLower;
  let visualDirection = direction;
  if (preferLower && direction === "up") {
    visualDirection = "down";
  } else if (preferLower && direction === "down") {
    visualDirection = "up";
  }

  node.classList.add(`trend-delta--${visualDirection}`);
  const unit = clean(options.unit) || "";
  const sign = delta > 0 ? "+" : delta < 0 ? "" : "±";
  node.textContent = `${sign}${delta}${unit ? ` ${unit}` : ""}`;
}

function renderCategoryTrendBars(categories) {
  categoryTrendBars.innerHTML = "";

  if (!Array.isArray(categories) || categories.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Category mix will appear after more prompts are tracked.";
    categoryTrendBars.appendChild(empty);
    return;
  }

  categories.slice(0, 4).forEach((category) => {
    const wrapper = document.createElement("div");
    wrapper.className = "category-bar";
    wrapper.innerHTML = `
      <div class="category-bar__meta">
        <span>${category.label}</span>
        <span>${category.count} • ${category.percentage}%</span>
      </div>
      <div class="category-bar__track">
        <div class="category-bar__fill" style="width: ${category.percentage}%"></div>
      </div>
    `;
    categoryTrendBars.appendChild(wrapper);
  });
}

function renderTrendDashboard(dashboard) {
  trendWindowLabel.textContent = `${dashboard.days} days`;
  trendActiveDays.textContent = `${dashboard.activeDays} active`;
  trendActiveDays.className = `grade ${dashboard.activeDays > 0 ? "grade--b" : "grade--na"}`;

  setTrendDelta(qualityTrendDelta, dashboard.qualityTrend.direction, dashboard.qualityTrend.delta, {
    unit: "pts"
  });
  qualityTrendSummary.textContent = dashboard.qualityTrend.summary;

  const qualityMarkup = buildLineChartMarkup(dashboard.qualitySeries, (entry) => entry.averageScore, {
    maxValue: 100,
    stroke: "#4b8fbe",
    dotFill: "#215d8b"
  });
  if (qualityMarkup) {
    qualityTrendChart.innerHTML = qualityMarkup;
  } else {
    renderEmptyTrendChart(qualityTrendChart, "Need more scored prompts");
  }

  setTrendDelta(warningTrendDelta, dashboard.warningTrend.direction, dashboard.warningTrend.delta, {
    unit: "events",
    preferLower: true
  });
  warningTrendSummary.textContent = dashboard.warningTrend.summary;

  const warningMarkup = buildBarChartMarkup(
    dashboard.warningSeries,
    (entry) => entry.warningEventCount,
    {
      fill: "rgba(186, 47, 38, 0.68)"
    }
  );
  if (warningMarkup) {
    warningTrendChart.innerHTML = warningMarkup;
  } else {
    renderEmptyTrendChart(warningTrendChart, "No warning history yet");
  }

  trendTopCategory.textContent = dashboard.topCategory ? dashboard.topCategory.label : "--";
  renderCategoryTrendBars(dashboard.categoryBreakdown);
  trendRulesSummary.textContent = `Quality: ${dashboard.rules.qualityOverTime} Warnings: ${dashboard.rules.warningFrequency}`;
}

function renderAnalyticsSnapshot(rawState) {
  let snapshot = null;
  let dailySummary = null;
  let trendDashboard = null;

  try {
    const analytics = getLearningAnalytics();
    snapshot = analytics.getSnapshot(rawState);
    dailySummary = analytics.buildDailySessionSummary(rawState);
    trendDashboard = analytics.buildTrendDashboard(rawState);
  } catch (error) {
    analyticsPromptCount.textContent = "--";
    analyticsAverageScore.textContent = "--";
    analyticsAverageLength.textContent = "--";
    analyticsSummary.textContent = "Learning analytics is unavailable in this popup build.";
    analyticsMeta.textContent = "";
    sessionSummaryScore.textContent = "--/100";
    sessionSummaryDay.textContent = "Today";
    sessionSummaryDay.className = "grade grade--na";
    sessionSummaryHeadline.textContent = "";
    sessionSummaryStats.textContent = "";
    sessionCategoryList.innerHTML = "";
    sessionSuggestionList.innerHTML = "";
    trendWindowLabel.textContent = "--";
    trendActiveDays.textContent = "0 active";
    trendActiveDays.className = "grade grade--na";
    qualityTrendDelta.textContent = "--";
    qualityTrendDelta.className = "trend-delta trend-delta--steady";
    qualityTrendChart.innerHTML = "";
    qualityTrendSummary.textContent = "";
    warningTrendDelta.textContent = "--";
    warningTrendDelta.className = "trend-delta trend-delta--steady";
    warningTrendChart.innerHTML = "";
    warningTrendSummary.textContent = "";
    trendTopCategory.textContent = "--";
    categoryTrendBars.innerHTML = "";
    trendRulesSummary.textContent = "";
    return;
  }

  analyticsPromptCount.textContent = String(snapshot.totalPrompts || 0);
  analyticsAverageScore.textContent = formatAnalyticsValue(snapshot.averageScore, "/100");
  analyticsAverageLength.textContent = formatAnalyticsValue(snapshot.averagePromptLength, " chars");

  const topPlatform = pickTopEntry(snapshot.platformCounts);
  const topSource = pickTopEntry(snapshot.sourceCounts);
  const lastSeen = formatAnalyticsTime(snapshot.lastPromptAt);

  analyticsSummary.textContent =
    snapshot.totalPrompts > 0
      ? `Last tracked prompt: ${snapshot.lastPlatform || "Unknown"} on ${lastSeen}.`
      : "No prompt events tracked yet. Send a prompt from ChatGPT, Claude, Gemini, Grok, or DeepSeek to start analytics.";

  const metaParts = [];
  if (snapshot.scoredPrompts > 0) {
    metaParts.push(`${snapshot.scoredPrompts} scored prompt${snapshot.scoredPrompts === 1 ? "" : "s"}`);
  }
  if (topPlatform) {
    metaParts.push(`Top platform: ${topPlatform.label} (${topPlatform.count})`);
  }
  if (topSource) {
    metaParts.push(`Top source: ${topSource.label.replace(/_/g, " ")} (${topSource.count})`);
  }

  analyticsMeta.textContent = metaParts.join(" | ") || "Stored locally for now. Future sync will build from this event history.";

  renderDailySessionSummary(dailySummary);
  renderTrendDashboard(trendDashboard);
}

function renderList(target, items, emptyText) {
  target.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const item = document.createElement("li");
    item.textContent = emptyText;
    target.appendChild(item);
    return;
  }

  items.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    target.appendChild(item);
  });
}

function renderDailySessionSummary(summary) {
  sessionSummaryDay.textContent = "Today";

  if (!summary || summary.isEmpty) {
    sessionSummaryScore.textContent = "--/100";
    sessionSummaryDay.className = "grade grade--na";
    sessionSummaryHeadline.textContent = "No prompts tracked today yet.";
    sessionSummaryStats.textContent = "Send a prompt on a supported AI page to build your first daily summary.";
    renderList(sessionCategoryList, [], "Prompt categories will appear here once today has activity.");
    renderList(sessionSuggestionList, [], "Your next coaching suggestions will appear after the first prompt.");
    return;
  }

  sessionSummaryScore.textContent = formatAnalyticsValue(summary.averageScore, "/100");
  const summaryGrade = Number.isFinite(summary.averageScore)
    ? summary.averageScore >= 85
      ? "A"
      : summary.averageScore >= 75
        ? "B"
        : summary.averageScore >= 60
          ? "C"
          : "D"
    : "N/A";
  sessionSummaryDay.className = `grade ${gradeClass(summaryGrade)}`;
  sessionSummaryDay.textContent = summaryGrade;
  sessionSummaryHeadline.textContent = summary.headline || "";
  sessionSummaryStats.textContent = summary.statsLine || "";

  renderList(
    sessionCategoryList,
    (summary.categories || []).slice(0, 3).map(
      (category) => `${category.label}: ${category.count} prompt${category.count === 1 ? "" : "s"} (${category.percentage}%)`
    ),
    "Prompt categories will appear here once enough signals are available."
  );
  renderList(
    sessionSuggestionList,
    summary.suggestions || [],
    "Great session. Keep using structured prompts with clear context and attempts."
  );
}

function gradeClass(grade) {
  if (grade === "A") {
    return "grade--a";
  }
  if (grade === "B") {
    return "grade--b";
  }
  if (grade === "C") {
    return "grade--c";
  }
  if (grade === "D") {
    return "grade--d";
  }
  return "grade--na";
}

function scorePrompt({ templateKey, profile, fields, prompt, roleProfile }) {
  const resolvedRoleProfile = roleProfile || getRoleProfile(profile);
  const engine = getPromptQualityEngine();
  const analysis = engine.calculatePromptScore({
    prompt,
    fields,
    templateKey,
    roleSignals: resolvedRoleProfile.roleSignals || [],
    profile: {
      roleKey: resolvedRoleProfile.key || profile.roleKey || "",
      role: profile.role || "",
      skill: profile.skill || ""
    }
  });

  return {
    ...analysis,
    tips: analysis.suggestions
  };
}

function renderScore(analysis) {
  promptScoreValue.textContent = `${analysis.score}/100`;
  promptScoreGrade.textContent = analysis.grade;
  promptScoreGrade.className = `grade ${gradeClass(analysis.grade)}`;
  promptScoreSummary.textContent = analysis.summary;

  scoreBreakdown.innerHTML = "";
  analysis.breakdown.forEach((part) => {
    const item = document.createElement("li");
    item.textContent = `${part.label}: ${part.score}/${part.max}`;
    scoreBreakdown.appendChild(item);
  });

  const tipLines = [...analysis.warnings, ...analysis.tips].slice(0, 4);
  scoreTips.innerHTML = "";

  if (tipLines.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No major gaps detected.";
    scoreTips.appendChild(item);
    return;
  }

  tipLines.forEach((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    scoreTips.appendChild(item);
  });
}

function lintClassForResult(result) {
  if (result.passed) {
    return result.severity === "info" ? "lint-result--info" : "lint-result--pass";
  }
  return result.severity === "error" ? "lint-result--error" : "lint-result--warning";
}

function renderLintResults(report) {
  if (!report || !Array.isArray(report.results)) {
    promptLintSummary.textContent = "--";
    lintResults.innerHTML = "";
    return;
  }

  const summaryParts = [];
  if (report.summary.errors > 0) {
    summaryParts.push(`${report.summary.errors} error`);
  }
  if (report.summary.warnings > 0) {
    summaryParts.push(`${report.summary.warnings} warning`);
  }
  if (report.summary.passed > 0) {
    summaryParts.push(`${report.summary.passed} passed`);
  }
  promptLintSummary.textContent = summaryParts.join(" | ") || "Clear";

  lintResults.innerHTML = "";
  report.results.forEach((result) => {
    const item = document.createElement("li");
    item.className = lintClassForResult(result);
    const prefix = result.passed ? "✓" : result.severity === "error" ? "⛔" : "⚠";
    item.textContent = `${prefix} ${result.message}`;
    lintResults.appendChild(item);
  });
}

function renderChecklist(fields) {
  const checks = REQUIRED_KEYS.map((key) => {
    const ok = fields[key] && fields[key].length > 0;
    const label = key === "task" ? "Task" : key === "context" ? "Context" : "What You Tried";
    return `${ok ? "[x]" : "[ ]"} ${label}`;
  });

  requiredChecklist.textContent = `Required info: ${checks.join(" | ")}`;
}

async function saveProfile() {
  const profile = readProfileForm();
  await storageSet({ profile });
  renderProfileView(profile, false);
  setStatus(profileStatus, "", true);
}

async function saveMonitoring() {
  const data = await storageGet(["settings"]);
  const monitoring = readMonitoringForm();
  const hasMonitoringEnabled = monitoring.promptListenerEnabled || monitoring.behaviorMonitorEnabled;
  const previousSettings = data.settings || {};
  const previousEnableCoach =
    typeof previousSettings.enableCoach === "boolean"
      ? previousSettings.enableCoach
      : DEFAULT_SETTINGS.enableCoach;
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...previousSettings,
    ...monitoring,
    enableCoach: hasMonitoringEnabled ? true : previousEnableCoach
  };
  await storageSet({ settings: nextSettings });
  setStatus(monitorStatus, "Monitoring settings saved.", true);
}

async function logManualAttempt() {
  const data = await storageGet(["stats"]);
  const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };

  stats.manualAttempts += 1;

  await storageSet({ stats });
  renderStats(stats);
  setStatus(promptStatus, "Manual attempt logged.", true);
}

async function generatePrompt() {
  const profile = readProfileForm();
  const roleProfile = getRoleProfile(profile);
  const fields = readPromptForm();
  const missing = validatePromptFields(fields);

  renderChecklist(fields);

  if (missing.length > 0) {
    setStatus(
      promptStatus,
      `Required: ${missing.join(", ")}. Fill these fields before generating a prompt.`,
      false
    );
    return;
  }

  const templateKey = templateSelect.value;
  const template = TEMPLATES[templateKey];

  if (!template) {
    setStatus(promptStatus, "Select a valid template.", false);
    return;
  }

  const basePrompt = template.build({
    profile,
    ...fields
  });
  const prompt = [...buildRoleHeaderLines(roleProfile), "", basePrompt].join("\n");

  const analysis = scorePrompt({ templateKey, profile, fields, prompt, roleProfile });
  const lintReport = getPromptLinter().lintPrompt({
    prompt,
    analysis,
    fields,
    templateKey,
    profile: {
      roleKey: resolvedRoleKey(profile),
      role: profile.role || "",
      skill: profile.skill || ""
    }
  });

  generatedPrompt.value = prompt;
  renderScore(analysis);
  renderLintResults(lintReport);

  await storageSet({
    selectedTemplate: templateKey,
    profile,
    lastGeneratedPrompt: prompt,
    lastPromptAnalysis: analysis,
    lastPromptLintReport: lintReport
  });

  setStatus(
    promptStatus,
    `Prompt generated (${analysis.score}/100, grade ${analysis.grade}, ${lintReport.summary.failed} lint issue(s)).`,
    true
  );
}

async function copyGeneratedPrompt() {
  const prompt = clean(generatedPrompt.value);

  if (!prompt) {
    setStatus(promptStatus, "Generate a prompt first.", false);
    return;
  }

  try {
    await navigator.clipboard.writeText(prompt);
    setStatus(promptStatus, "Prompt copied to clipboard.", true);
  } catch (error) {
    setStatus(promptStatus, "Clipboard blocked. Copy manually from the text area.", false);
  }
}

function resetScoreCard() {
  promptScoreValue.textContent = "--/100";
  promptScoreGrade.textContent = "N/A";
  promptScoreGrade.className = "grade grade--na";
  promptScoreSummary.textContent = "Generate a prompt to calculate quality score.";
  scoreBreakdown.innerHTML = "";
  scoreTips.innerHTML = "";
  promptLintSummary.textContent = "--";
  lintResults.innerHTML = "";
}

async function loadState() {
  const data = await storageGet([
    "settings",
    "profile",
    "stats",
    "learningAnalytics",
    "selectedTemplate",
    "lastGeneratedPrompt",
    "lastPromptAnalysis",
    "lastPromptLintReport"
  ]);

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const { profile, migrated } = migrateLegacyStudentProfile({
    ...DEFAULT_PROFILE,
    ...(data.profile || {})
  });
  const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
  const selectedTemplate = TEMPLATES[data.selectedTemplate]
    ? data.selectedTemplate
    : getRecommendedTemplateForProfile(profile);

  if (migrated) {
    await storageSet({ profile });
  }

  fillMonitoring(settings);
  fillProfile(profile);
  renderProfileView(profile, false);
  renderTemplates(selectedTemplate);
  renderStats(stats);
  renderAnalyticsSnapshot(data.learningAnalytics);
  renderChecklist(readPromptForm());

  if (data.lastGeneratedPrompt) {
    generatedPrompt.value = data.lastGeneratedPrompt;
  }

  if (data.lastPromptAnalysis) {
    renderScore(data.lastPromptAnalysis);
  } else {
    resetScoreCard();
  }

  if (data.lastPromptLintReport) {
    renderLintResults(data.lastPromptLintReport);
  }
}

function wireEvents() {
  [promptListenerToggle, behaviorMonitorToggle].forEach((toggle) => {
    toggle.addEventListener("change", () => {
      saveMonitoring().catch(() => {
        setStatus(monitorStatus, "Unable to save monitoring settings.", false);
      });
    });
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    saveProfile().catch(() => setStatus(profileStatus, "Unable to save profile.", false));
  });

  editProfileBtn.addEventListener("click", () => {
    const profile = readProfileForm();
    renderProfileView(profile, true);
    setStatus(profileStatus, "", true);
    roleSelect.focus();
  });

  document.getElementById("manualAttemptBtn").addEventListener("click", () => {
    logManualAttempt().catch(() => setStatus(promptStatus, "Unable to log manual attempt.", false));
  });

  document.getElementById("generatePromptBtn").addEventListener("click", () => {
    generatePrompt().catch(() => setStatus(promptStatus, "Prompt generation failed.", false));
  });

  document.getElementById("copyPromptBtn").addEventListener("click", () => {
    copyGeneratedPrompt();
  });

  document.getElementById("openOptionsBtn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  templateSelect.addEventListener("change", async () => {
    const template = TEMPLATES[templateSelect.value];
    applyTemplateUI(template);
    await storageSet({ selectedTemplate: templateSelect.value });
  });

  roleSelect.addEventListener("change", () => {
    setCustomRoleVisibility(roleSelect.value);
    const recommendedTemplate = getRecommendedTemplateForProfile(readProfileForm());
    templateSelect.value = recommendedTemplate;
    applyTemplateUI(TEMPLATES[templateSelect.value]);
    storageSet({ selectedTemplate: recommendedTemplate }).catch(() => {
      setStatus(promptStatus, "Unable to store template preference.", false);
    });
  });

  skillInput.addEventListener("change", () => {
    const recommendedTemplate = getRecommendedTemplateForProfile(readProfileForm());
    templateSelect.value = recommendedTemplate;
    applyTemplateUI(TEMPLATES[templateSelect.value]);
    storageSet({ selectedTemplate: recommendedTemplate }).catch(() => {
      setStatus(promptStatus, "Unable to store template preference.", false);
    });
  });

  customRoleInput.addEventListener("input", () => {
    applyTemplateUI(TEMPLATES[templateSelect.value]);
  });

  [taskInput, contextInput, attemptInput].forEach((input) => {
    input.addEventListener("input", () => {
      renderChecklist(readPromptForm());
    });
  });
}

async function init() {
  wireEvents();
  await loadState();
}

init().catch(() => {
  setStatus(promptStatus, "Failed to initialize popup.", false);
});
