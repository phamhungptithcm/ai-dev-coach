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

const JOB_ROLE_OPTIONS = {
  teacher: {
    label: "Teacher",
    builderHint: "Focus on pedagogy, learner outcomes, and assessment quality.",
    contextHint: "Learner level, lesson objective, class constraints",
    attemptHint: "What teaching approach you tried and observed outcome",
    roleSignals: [/learning objective/i, /lesson plan/i, /assessment/i, /classroom/i, /pedagogy/i]
  },
  software_engineer: {
    label: "Software Engineer",
    builderHint: "Focus on reproducible technical context and verification.",
    contextHint: "Error, stack trace, file path, expected vs actual",
    attemptHint: "Debug steps, hypotheses, and blocker",
    roleSignals: [/stack/i, /trace/i, /api/i, /repo/i, /commit/i, /test/i, /bug/i]
  },
  solution_architecture: {
    label: "Solution Architecture",
    builderHint: "Focus on constraints, tradeoffs, scalability, and risk.",
    contextHint: "NFRs, integration points, compliance, cost and latency constraints",
    attemptHint: "Architecture option explored and tradeoff concerns",
    roleSignals: [/nfr/i, /latency/i, /throughput/i, /sla/i, /integration/i, /trade-?off/i]
  },
  manager: {
    label: "Manager",
    builderHint: "Focus on delivery risk, prioritization, and team execution clarity.",
    contextHint: "Business impact, timeline, team capacity, and blockers",
    attemptHint: "What has been tried, what is blocked, and decision options",
    roleSignals: [/timeline/i, /milestone/i, /risk/i, /scope/i, /priority/i, /resource/i, /stakeholder/i]
  },
  director: {
    label: "Director",
    builderHint: "Focus on strategy, cross-team alignment, and measurable outcomes.",
    contextHint: "Org constraints, KPI targets, dependencies, and governance",
    attemptHint: "Options explored, tradeoffs, and escalation points",
    roleSignals: [/strategy/i, /kpi/i, /roadmap/i, /governance/i, /portfolio/i, /budget/i, /alignment/i]
  },
  doctor: {
    label: "Doctor",
    builderHint: "Use AI as an educational support tool, not a diagnostic authority.",
    contextHint: "Symptoms timeline, relevant history, red flags, tests already available",
    attemptHint: "Clinical reasoning done, differential considered, current uncertainty",
    safetyGuardrail: "For educational support only. Do not request final diagnosis, treatment, or dosage instructions.",
    roleSignals: [/symptom/i, /history/i, /differential/i, /red flag/i, /clinical/i, /exam/i]
  },
  other: {
    label: "Other",
    builderHint: "Define your domain context clearly and ask for reasoning-first guidance.",
    contextHint: "Domain constraints, available evidence, expected outcome",
    attemptHint: "What you already tried and where you are blocked",
    roleSignals: [/constraint/i, /evidence/i, /outcome/i, /risk/i]
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
const ROLE_TEMPLATE_RECOMMENDATIONS = {
  teacher: "learning",
  software_engineer: "debugging",
  solution_architecture: "system_design",
  manager: "system_design",
  director: "system_design",
  doctor: "learning",
  other: "debugging"
};
const LEVEL_OPTIONS = new Set(["Student", "Junior", "Middle", "Senior"]);
const REQUIRED_KEYS = ["task", "context", "attempt"];

const roleSelect = document.getElementById("roleSelect");
const customRoleInput = document.getElementById("customRoleInput");
const skillInput = document.getElementById("skillInput");
const habitInput = document.getElementById("habitInput");
const templateSelect = document.getElementById("templateSelect");
const templateHint = document.getElementById("templateHint");
const rolePromptHint = document.getElementById("rolePromptHint");
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

function normalizeLevel(value) {
  const raw = clean(value);
  if (!raw) {
    return "";
  }

  if (/^student$/i.test(raw)) {
    return "Student";
  }
  if (/^junior$/i.test(raw)) {
    return "Junior";
  }
  if (/^(middle|mid)$/i.test(raw)) {
    return "Middle";
  }
  if (/^senior$/i.test(raw)) {
    return "Senior";
  }

  return LEVEL_OPTIONS.has(raw) ? raw : "";
}

function isStudentLevel(value) {
  return normalizeLevel(value) === "Student";
}

function migrateLegacyStudentProfile(rawProfile = {}) {
  const roleKey = normalizeRoleKey(rawProfile.roleKey);
  const roleText = clean(rawProfile.role).toLowerCase();
  const isLegacyStudent = roleKey === "student" || /student|sinh vien|hoc sinh/.test(roleText);

  if (!isLegacyStudent) {
    return {
      profile: {
        ...rawProfile,
        skill: normalizeLevel(rawProfile.skill)
      },
      migrated: false
    };
  }

  return {
    profile: {
      ...rawProfile,
      roleKey: "other",
      role: "Other",
      skill: normalizeLevel(rawProfile.skill) || "Student"
    },
    migrated: true
  };
}

function normalizeRoleKey(value) {
  return clean(value).toLowerCase().replace(/\s+/g, "_");
}

function resolveRoleKey(rawProfile = {}) {
  const fromKey = normalizeRoleKey(rawProfile.roleKey);
  if (JOB_ROLE_OPTIONS[fromKey]) {
    return fromKey;
  }

  const roleText = clean(rawProfile.role).toLowerCase();
  if (!roleText) {
    return "software_engineer";
  }

  if (/teacher|giang vien|giao vien/.test(roleText)) {
    return "teacher";
  }
  if (/software|engineer|developer|frontend|backend|fullstack|devops/.test(roleText)) {
    return "software_engineer";
  }
  if (/solution architect|architecture|kien truc/.test(roleText)) {
    return "solution_architecture";
  }
  if (/manager|lead|quan ly/.test(roleText)) {
    return "manager";
  }
  if (/director|giam doc/.test(roleText)) {
    return "director";
  }
  if (/doctor|bac si|physician|medical/.test(roleText)) {
    return "doctor";
  }

  return "other";
}

function getRoleProfile(rawProfile = {}) {
  const key = resolveRoleKey(rawProfile);
  const base = JOB_ROLE_OPTIONS[key] || JOB_ROLE_OPTIONS.other;
  const customRole = clean(rawProfile.role);
  const label = key === "other" ? customRole || base.label : base.label;
  return { key, label, ...base };
}

function setCustomRoleVisibility(roleKey) {
  customRoleInput.classList.toggle("hidden", roleKey !== "other");
}

function buildRoleHeaderLines(roleProfile) {
  const lines = [
    `Primary job role: ${roleProfile.label}`,
    `Role guidance: ${roleProfile.builderHint}`
  ];

  if (roleProfile.safetyGuardrail) {
    lines.push(`Safety guardrail: ${roleProfile.safetyGuardrail}`);
  }

  return lines;
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
  const selectedRoleProfile = JOB_ROLE_OPTIONS[selectedRoleKey] || JOB_ROLE_OPTIONS.software_engineer;
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
  if (isStudentLevel(profile.skill)) {
    return "learning";
  }
  const roleProfile = getRoleProfile(profile);
  const templateKey = ROLE_TEMPLATE_RECOMMENDATIONS[roleProfile.key] || DEFAULT_TEMPLATE_KEY;
  return TEMPLATES[templateKey] ? templateKey : DEFAULT_TEMPLATE_KEY;
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

  generatedPrompt.value = prompt;
  renderScore(analysis);

  await storageSet({
    selectedTemplate: templateKey,
    profile,
    lastGeneratedPrompt: prompt,
    lastPromptAnalysis: analysis
  });

  setStatus(promptStatus, `Prompt generated (${analysis.score}/100, grade ${analysis.grade}).`, true);
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
}

async function loadState() {
  const data = await storageGet([
    "settings",
    "profile",
    "stats",
    "selectedTemplate",
    "lastGeneratedPrompt",
    "lastPromptAnalysis"
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
  renderChecklist(readPromptForm());

  if (data.lastGeneratedPrompt) {
    generatedPrompt.value = data.lastGeneratedPrompt;
  }

  if (data.lastPromptAnalysis) {
    renderScore(data.lastPromptAnalysis);
  } else {
    resetScoreCard();
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
