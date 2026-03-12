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
        `Skill level: ${profile.skill || "Not provided"}`,
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
        `Skill level: ${profile.skill || "Not provided"}`,
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
        `Skill level: ${profile.skill || "Not provided"}`,
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
        `Skill level: ${profile.skill || "Not provided"}`,
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
        `Skill level: ${profile.skill || "Not provided"}`,
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
        `Skill level: ${profile.skill || "Not provided"}`,
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
const REASONING_HINTS = [/tried/i, /attempt/i, /hypothesis/i, /debug/i, /test/i, /measure/i, /analy/i];
const CONTEXT_HINTS = [/error/i, /stack/i, /file/i, /endpoint/i, /metric/i, /latency/i, /throughput/i, /trace/i];
const SHORTCUT_PATTERNS = [/give me full code/i, /do it for me/i, /just answer/i, /no explanation/i, /copy paste/i];

const roleInput = document.getElementById("roleInput");
const skillInput = document.getElementById("skillInput");
const habitInput = document.getElementById("habitInput");
const templateSelect = document.getElementById("templateSelect");
const templateHint = document.getElementById("templateHint");
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

  templateHint.textContent = template.hint;
  contextInput.placeholder = template.contextPlaceholder;
  attemptInput.placeholder = template.attemptPlaceholder;
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
  return {
    role: clean(roleInput.value),
    skill: clean(skillInput.value),
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
  roleInput.value = profile.role || "";
  skillInput.value = profile.skill || "";
  habitInput.value = profile.habitGoals || "";
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
    profileSummary.textContent = `Role: ${role} | Skill: ${skill} | Goal: ${goal}`;
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

function gradeFromScore(score) {
  if (score >= 90) {
    return "A";
  }
  if (score >= 75) {
    return "B";
  }
  if (score >= 60) {
    return "C";
  }
  return "D";
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

function countKeywordMatches(text, patterns) {
  return patterns.filter((pattern) => pattern.test(text)).length;
}

function scorePrompt({ templateKey, profile, fields, prompt }) {
  const joined = `${fields.task}\n${fields.context}\n${fields.attempt}\n${fields.constraints}\n${fields.acceptance}`;

  const breakdown = [];
  const tips = [];
  const warnings = [];

  let completeness = 0;
  if (fields.task.length >= 20) {
    completeness += 12;
  } else if (fields.task.length >= 8) {
    completeness += 6;
    tips.push("Make the task more specific with expected output and scope.");
  } else {
    warnings.push("Task is too short.");
  }

  if (fields.context.length >= 40) {
    completeness += 12;
  } else if (fields.context.length >= 15) {
    completeness += 6;
    tips.push("Add richer context (files, errors, expected vs actual behavior).");
  } else {
    warnings.push("Context is too thin.");
  }

  if (fields.attempt.length >= 30) {
    completeness += 10;
  } else if (fields.attempt.length >= 12) {
    completeness += 5;
    tips.push("Describe your attempts and blockers more clearly.");
  } else {
    warnings.push("What you tried needs more detail.");
  }

  if (profile.role) {
    completeness += 3;
  }
  if (profile.skill) {
    completeness += 3;
  }

  completeness = Math.min(40, completeness);
  breakdown.push({ label: "Completeness", score: completeness, max: 40 });

  let specificity = 0;
  const contextSignalCount = countKeywordMatches(joined, CONTEXT_HINTS);
  specificity += Math.min(10, contextSignalCount * 2);

  if (fields.constraints.length >= 16) {
    specificity += 6;
  }

  if (fields.acceptance.length >= 16) {
    specificity += 5;
  }

  if (prompt.length >= 450) {
    specificity += 4;
  }

  specificity = Math.min(25, specificity);
  if (specificity < 12) {
    tips.push("Add concrete technical context (metrics, paths, traces, API details).");
  }
  breakdown.push({ label: "Specificity", score: specificity, max: 25 });

  let reasoning = 0;
  const reasoningSignalCount = countKeywordMatches(fields.attempt, REASONING_HINTS);
  reasoning += Math.min(12, reasoningSignalCount * 3);

  if (/why|trade-?off|because|assumption/i.test(joined)) {
    reasoning += 4;
  }

  if (/test|verify|benchmark|validate/i.test(joined)) {
    reasoning += 4;
  }

  reasoning = Math.min(20, reasoning);
  if (reasoning < 10) {
    tips.push("Include reasoning: assumptions, hypotheses, and validation plan.");
  }
  breakdown.push({ label: "Reasoning Evidence", score: reasoning, max: 20 });

  let safety = 15;
  const shortcutHit = SHORTCUT_PATTERNS.some((pattern) => pattern.test(joined));
  if (shortcutHit) {
    safety -= 8;
    warnings.push("Shortcut language detected. Ask for guidance before final code.");
  }

  if (/step-?by-?step|explain|coach|review/i.test(prompt)) {
    safety += 2;
  }

  if (/just.*answer|only.*code/i.test(joined)) {
    safety -= 4;
  }

  safety = Math.max(0, Math.min(15, safety));
  breakdown.push({ label: "Learning Safety", score: safety, max: 15 });

  let templateFit = 0;
  const templateSignals = {
    debugging: /error|stack|trace|bug|failing/i,
    code_review: /review|regression|security|test/i,
    system_design: /architecture|scal|throughput|availability|trade-?off/i,
    refactoring: /refactor|maintain|readability|structure/i,
    performance_optimization: /latency|cpu|memory|throughput|benchmark|optimi/i,
    learning: /learn|explain|exercise|understand|concept/i
  };

  if (templateSignals[templateKey] && templateSignals[templateKey].test(joined)) {
    templateFit = 5;
  } else {
    tips.push("Add terms that match the selected template objective.");
  }
  breakdown.push({ label: "Template Fit", score: templateFit, max: 5 });

  const total = breakdown.reduce((sum, item) => sum + item.score, 0);
  const score = Math.max(0, Math.min(100, total));
  const grade = gradeFromScore(score);

  let summary = "Strong prompt. Ready to use with AI.";
  if (grade === "B") {
    summary = "Good prompt. A bit more context can improve answer quality.";
  } else if (grade === "C") {
    summary = "Fair prompt. Improve context and reasoning before sending.";
  } else if (grade === "D") {
    summary = "Weak prompt. Add details and attempt notes first.";
  }

  return {
    score,
    grade,
    summary,
    warnings,
    tips,
    breakdown
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
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...(data.settings || {}),
    ...readMonitoringForm()
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

  const prompt = template.build({
    profile,
    ...fields
  });

  const analysis = scorePrompt({ templateKey, profile, fields, prompt });

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
  const profile = { ...DEFAULT_PROFILE, ...(data.profile || {}) };
  const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
  const selectedTemplate = TEMPLATES[data.selectedTemplate]
    ? data.selectedTemplate
    : DEFAULT_TEMPLATE_KEY;

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
    roleInput.focus();
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
