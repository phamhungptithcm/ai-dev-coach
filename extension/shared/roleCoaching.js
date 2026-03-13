(() => {
  const JOB_ROLE_ORDER = [
    "teacher",
    "software_engineer",
    "solution_architecture",
    "manager",
    "director",
    "doctor",
    "other"
  ];

  const LEVEL_OPTIONS = ["Student", "Junior", "Middle", "Senior"];

  const ENGINEERING_SPECIALIZATIONS = {
    frontend: {
      label: "Frontend",
      signals: [/\bfrontend\b/i, /\bui\b/i, /\bux\b/i, /\breact\b/i, /\bvue\b/i, /\bangular\b/i],
      suggestion:
        "Frontend mode: include component state, user interaction, browser/device context, and expected vs actual UI behavior.",
      examplePrompts: [
        "Review why a React modal closes unexpectedly after async state updates and suggest the smallest safe fix.",
        "Help debug a Vue form where validation errors never render on mobile Safari."
      ],
      shortcutWarning:
        "Frontend mode: ask for diagnosis, edge cases, and accessibility checks before asking for final UI code.",
      habitTip:
        "For frontend work, ask AI to review state transitions, loading states, and accessibility edge cases."
    },
    backend: {
      label: "Backend",
      signals: [/\bbackend\b/i, /\bapi\b/i, /\bservice\b/i, /\bnode\b/i, /\bspring\b/i, /\bdatabase\b/i],
      suggestion:
        "Backend mode: include endpoint, payload, status codes, logs, and any data or queue side effects.",
      examplePrompts: [
        "Debug why POST /orders returns 500 after a Spring Boot service maps the DTO to a null customer id.",
        "Review a Node.js retry worker that duplicates jobs after Redis reconnect events."
      ],
      shortcutWarning:
        "Backend mode: ask for root-cause analysis, failure paths, and validation checks before asking for a final patch.",
      habitTip:
        "For backend work, ask AI to validate failure modes, data integrity, and rollback safety."
    },
    devops: {
      label: "DevOps",
      signals: [/\bdevops\b/i, /\bsre\b/i, /\bterraform\b/i, /\bkubernetes\b/i, /\bk8s\b/i, /\bhelm\b/i, /\bdeploy\b/i],
      suggestion:
        "DevOps mode: include environment, deploy step, logs or metrics, infra resources, and rollback constraints.",
      examplePrompts: [
        "Investigate why a Kubernetes rollout enters CrashLoopBackOff after a config map change and list the safest next checks.",
        "Compare two Terraform module designs for managing shared network policies across staging and production."
      ],
      shortcutWarning:
        "DevOps mode: ask AI for blast radius, rollback steps, and observability checks before applying infra changes.",
      habitTip:
        "For DevOps work, ask AI to walk through rollout risk, observability, and rollback strategy."
    },
    fullstack: {
      label: "Fullstack",
      signals: [/\bfullstack\b/i],
      suggestion:
        "Fullstack mode: connect the UI symptom to the API, data model, and deployment context so AI can reason end to end.",
      examplePrompts: [
        "Trace a checkout failure from a React submit button through the Node API to the PostgreSQL write path.",
        "Review a fullstack refactor plan that moves validation from the UI into shared API contracts."
      ],
      shortcutWarning:
        "Fullstack mode: ask AI to map the failing layer first before asking for end-to-end replacement code.",
      habitTip:
        "For fullstack work, ask AI to separate UI, API, and data-layer risks before proposing fixes."
    }
  };

  const JOB_ROLE_OPTIONS = {
    teacher: {
      label: "Teacher",
      builderHint: "Focus on pedagogy, learner outcomes, and assessment quality.",
      contextHint: "Learner level, lesson objective, class constraints",
      attemptHint: "What teaching approach you tried and observed outcome",
      roleSignals: [/learning objective/i, /lesson plan/i, /assessment/i, /classroom/i, /pedagogy/i],
      focusAreas: ["learner level", "learning objective", "misconceptions", "assessment"],
      examplePrompts: [
        "Design a 30-minute lesson to teach junior developers how to debug API failures, including one formative check.",
        "Review this rubric for a database indexing exercise and suggest clearer success criteria."
      ],
      roleSuggestion:
        "Teacher mode: include learner level, learning objective, current misconception, and how you will assess understanding.",
      shortcutWarning:
        "Teacher mode: do not ask AI to replace your lesson planning. Ask for scaffolding, misconceptions, and assessment ideas.",
      habitTip:
        "For teaching prompts, ask AI to surface misconceptions, check-for-understanding ideas, and differentiated support."
    },
    software_engineer: {
      label: "Software Engineer",
      builderHint: "Focus on reproducible technical context and verification.",
      contextHint: "Error, stack trace, file path, expected vs actual",
      attemptHint: "Debug steps, hypotheses, and blocker",
      roleSignals: [/stack/i, /trace/i, /api/i, /repo/i, /commit/i, /test/i, /bug/i],
      focusAreas: ["repro steps", "exact failure", "artifact evidence", "verification"],
      examplePrompts: [
        "Debug why a failing Playwright test passes locally but flakes in GitHub Actions after login redirects.",
        "Review this refactor plan for a service class and call out regression risks plus missing tests."
      ],
      roleSuggestion:
        "Engineer mode: include the failing command or test, exact error, file path, and one expected vs actual behavior.",
      shortcutWarning:
        "Engineer mode: ask for diagnosis or the next debugging step before asking for full code.",
      habitTip:
        "For engineering prompts, keep using Task, Context, What You Tried, and a clear verification target."
    },
    solution_architecture: {
      label: "Solution Architecture",
      builderHint: "Focus on constraints, tradeoffs, scalability, and risk.",
      contextHint: "NFRs, integration points, compliance, cost and latency constraints",
      attemptHint: "Architecture option explored and tradeoff concerns",
      roleSignals: [/nfr/i, /latency/i, /throughput/i, /sla/i, /integration/i, /trade-?off/i],
      focusAreas: ["non-functional requirements", "tradeoffs", "integration constraints", "rollout risk"],
      examplePrompts: [
        "Compare two event-driven integration patterns for order sync under a 200ms SLA and strict audit requirements.",
        "Review this migration plan from a monolith to services and highlight reliability and observability gaps."
      ],
      roleSuggestion:
        "Architecture mode: include scale assumptions, NFRs, compliance or cost constraints, and the tradeoff you are unsure about.",
      shortcutWarning:
        "Architecture mode: ask for tradeoffs, failure modes, and rollout options instead of a single best design answer.",
      habitTip:
        "For architecture prompts, ask AI to compare options, failure modes, and rollout phases before implementation details."
    },
    manager: {
      label: "Manager",
      builderHint: "Focus on delivery risk, prioritization, and team execution clarity.",
      contextHint: "Business impact, timeline, team capacity, and blockers",
      attemptHint: "What has been tried, what is blocked, and decision options",
      roleSignals: [/timeline/i, /milestone/i, /risk/i, /scope/i, /priority/i, /resource/i, /stakeholder/i],
      focusAreas: ["business impact", "delivery risk", "team capacity", "decision needed"],
      examplePrompts: [
        "Help frame three delivery options for a slipping milestone, including risks, dependencies, and recommended next decision.",
        "Review this sprint recovery plan and identify the clearest tradeoff between scope, timeline, and quality."
      ],
      roleSuggestion:
        "Manager mode: include business impact, delivery date, available capacity, current blockers, and the decision you need from AI.",
      shortcutWarning:
        "Manager mode: ask AI for options, risks, and a recommendation with tradeoffs, not just a one-line answer.",
      habitTip:
        "For manager prompts, ask AI to separate options, risks, owners, and immediate next actions."
    },
    director: {
      label: "Director",
      builderHint: "Focus on strategy, cross-team alignment, and measurable outcomes.",
      contextHint: "Org constraints, KPI targets, dependencies, and governance",
      attemptHint: "Options explored, tradeoffs, and escalation points",
      roleSignals: [/strategy/i, /kpi/i, /roadmap/i, /governance/i, /portfolio/i, /budget/i, /alignment/i],
      focusAreas: ["KPI impact", "cross-team dependencies", "budget or portfolio constraints", "governance"],
      examplePrompts: [
        "Compare two roadmap options for improving onboarding conversion while staying within the current platform budget.",
        "Review this cross-team dependency plan and highlight the highest-risk alignment gaps before exec review."
      ],
      roleSuggestion:
        "Director mode: include KPI targets, portfolio or budget constraints, dependencies, and the strategic tradeoff under discussion.",
      shortcutWarning:
        "Director mode: ask AI for scenario comparisons, KPI impact, and dependency risk instead of a single directive.",
      habitTip:
        "For director prompts, ask AI to compare scenarios with measurable outcomes and dependency risk."
    },
    doctor: {
      label: "Doctor",
      builderHint: "Use AI as an educational support tool, not a diagnostic authority.",
      contextHint: "Symptoms timeline, relevant history, red flags, tests already available",
      attemptHint: "Clinical reasoning done, differential considered, current uncertainty",
      safetyGuardrail: "For educational support only. Do not request final diagnosis, treatment, or dosage instructions.",
      roleSignals: [/symptom/i, /history/i, /differential/i, /red flag/i, /clinical/i, /exam/i],
      focusAreas: ["timeline", "history", "red flags", "differential reasoning"],
      examplePrompts: [
        "For education, help compare differential reasoning paths for chest pain using the symptoms timeline and red flags already observed.",
        "Summarize how to explain this lab trend to a trainee and what additional educational questions they should ask."
      ],
      roleSuggestion:
        "Doctor mode: include symptoms timeline, relevant history, red flags, and tests already available, and keep the ask educational.",
      shortcutWarning:
        "Doctor mode: keep AI in education mode. Do not ask for diagnosis, treatment plans, or dosage decisions.",
      habitTip:
        "For doctor prompts, ask AI to support reasoning, differential comparison, and trainee education rather than final decisions."
    },
    other: {
      label: "Other",
      builderHint: "Define your domain context clearly and ask for reasoning-first guidance.",
      contextHint: "Domain constraints, available evidence, expected outcome",
      attemptHint: "What you already tried and where you are blocked",
      roleSignals: [/constraint/i, /evidence/i, /outcome/i, /risk/i],
      focusAreas: ["domain context", "available evidence", "constraints", "expected outcome"],
      examplePrompts: [
        "Explain the best way to structure this request so AI can reason from my available evidence instead of guessing.",
        "Review these constraints and suggest the clearest decision framework for my domain-specific problem."
      ],
      roleSuggestion:
        "Other mode: include your domain context, available evidence, constraints, and the exact outcome you want.",
      shortcutWarning:
        "Domain mode: ask AI to reason from your evidence and constraints before asking for a final output.",
      habitTip:
        "For non-engineering prompts, define the domain, evidence, and success criteria before asking AI for help."
    }
  };

  const ROLE_TEMPLATE_RECOMMENDATIONS = {
    teacher: "learning",
    software_engineer: "debugging",
    solution_architecture: "system_design",
    manager: "system_design",
    director: "system_design",
    doctor: "learning",
    other: "debugging"
  };

  function clean(value) {
    return (value || "").trim();
  }

  function uniquePush(list, value) {
    if (!value || list.includes(value)) {
      return;
    }
    list.push(value);
  }

  function hasAnyHint(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function normalizeRoleKey(value) {
    return clean(value).toLowerCase().replace(/\s+/g, "_");
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

    return LEVEL_OPTIONS.includes(raw) ? raw : "";
  }

  function isStudentLevel(value) {
    return normalizeLevel(value) === "Student";
  }

  function hasLegacyStudentRole(profile = {}) {
    const roleKey = normalizeRoleKey(profile.roleKey);
    const roleText = clean(profile.role).toLowerCase();
    return roleKey === "student" || /student|sinh vien|hoc sinh/.test(roleText);
  }

  function migrateLegacyStudentProfile(rawProfile = {}) {
    if (!hasLegacyStudentRole(rawProfile)) {
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

  function detectEngineeringSpecialization(rawProfile = {}) {
    const roleText = clean(rawProfile.role).toLowerCase();
    const goalText = clean(rawProfile.habitGoals).toLowerCase();
    const source = `${roleText} ${goalText}`;

    if (!source) {
      return "";
    }

    if (hasAnyHint(source, ENGINEERING_SPECIALIZATIONS.devops.signals)) {
      return "devops";
    }
    if (hasAnyHint(source, ENGINEERING_SPECIALIZATIONS.frontend.signals)) {
      return "frontend";
    }
    if (hasAnyHint(source, ENGINEERING_SPECIALIZATIONS.backend.signals)) {
      return "backend";
    }
    if (hasAnyHint(source, ENGINEERING_SPECIALIZATIONS.fullstack.signals)) {
      return "fullstack";
    }

    return "";
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
    if (/software|engineer|developer|frontend|backend|fullstack|devops|sre|platform/.test(roleText)) {
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
    const specialization = key === "software_engineer" ? detectEngineeringSpecialization(rawProfile) : "";
    const specializationMeta = specialization ? ENGINEERING_SPECIALIZATIONS[specialization] : null;
    const label = key === "other" ? customRole || base.label : base.label;

    return {
      key,
      label,
      specialization,
      specializationLabel: specializationMeta ? specializationMeta.label : "",
      ...base
    };
  }

  function buildRoleHeaderLines(roleProfile) {
    const lines = [
      "ROLE CONTEXT",
      `- Primary role: ${roleProfile.label}`,
      `- Coaching focus: ${roleProfile.builderHint}`
    ];

    if (roleProfile.specializationLabel) {
      lines.push(`- Technical specialization: ${roleProfile.specializationLabel}`);
    }
    if (roleProfile.safetyGuardrail) {
      lines.push(`- Safety guardrail: ${roleProfile.safetyGuardrail}`);
    }

    return lines;
  }

  function getRecommendedTemplateForProfile(profile = {}, options = {}) {
    const defaultTemplate = clean(options.defaultTemplate) || "debugging";
    const templates = options.templates || null;

    if (isStudentLevel(profile.skill)) {
      return templates && !templates.learning ? defaultTemplate : "learning";
    }

    const roleProfile = getRoleProfile(profile);
    let recommendedTemplate = ROLE_TEMPLATE_RECOMMENDATIONS[roleProfile.key] || defaultTemplate;

    if (roleProfile.key === "software_engineer" && roleProfile.specialization === "devops") {
      recommendedTemplate = templates && templates.system_design ? "system_design" : recommendedTemplate;
    }

    if (templates && !templates[recommendedTemplate]) {
      return defaultTemplate;
    }

    return recommendedTemplate;
  }

  function getRoleExamplePrompts(roleProfile, level) {
    const examples = roleProfile.examplePrompts ? roleProfile.examplePrompts.slice(0, 2) : [];

    if (roleProfile.key === "software_engineer" && roleProfile.specialization) {
      const specializationMeta = ENGINEERING_SPECIALIZATIONS[roleProfile.specialization];
      specializationMeta?.examplePrompts?.forEach((example) => uniquePush(examples, example));
    }

    if (level === "Student") {
      uniquePush(
        examples,
        "Explain this concept step by step, then give me one short exercise so I can check my understanding myself."
      );
    } else if (level === "Junior") {
      uniquePush(
        examples,
        "Review my current approach, tell me what is weak, and suggest the smallest next step instead of a full solution."
      );
    }

    return examples.slice(0, 2);
  }

  function buildRoleCoachingSnapshot(rawProfile = {}) {
    const roleProfile = getRoleProfile(rawProfile);
    const level = normalizeLevel(rawProfile.skill);
    const focusAreas = Array.isArray(roleProfile.focusAreas) ? roleProfile.focusAreas : [];
    const examples = getRoleExamplePrompts(roleProfile, level);
    const specializationMeta =
      roleProfile.key === "software_engineer" && roleProfile.specialization
        ? ENGINEERING_SPECIALIZATIONS[roleProfile.specialization]
        : null;

    let focusLine = focusAreas.length > 0
      ? `Focus on ${focusAreas.join(", ")}.`
      : roleProfile.builderHint;

    if (specializationMeta) {
      focusLine += ` ${specializationMeta.label} specialization is active.`;
    }

    if (level === "Student") {
      focusLine += " Student mode keeps the coaching step-by-step and exercise-oriented.";
    } else if (level === "Junior") {
      focusLine += " Junior mode emphasizes small next steps and explanation-first coaching.";
    }

    const warningHint = specializationMeta?.shortcutWarning || roleProfile.shortcutWarning;
    const habitTip =
      level === "Student"
        ? "Student mode: ask AI to teach step by step and end with one short exercise before any final answer."
        : level === "Junior"
          ? "Junior mode: ask AI to explain why the next step matters before you accept a patch or final answer."
          : specializationMeta?.habitTip || roleProfile.habitTip;

    return {
      roleProfile,
      level,
      focusLine,
      examples,
      warningHint,
      habitTip,
      safetyGuardrail: roleProfile.safetyGuardrail || ""
    };
  }

  function buildRoleCoachingAdvice(input = {}) {
    const profile = input.profile || {};
    const prompt = clean(input.prompt);
    const fields = input.fields || {};
    const signals = input.signals || {};
    const snapshot = buildRoleCoachingSnapshot(profile);
    const roleProfile = snapshot.roleProfile;
    const specializationMeta =
      roleProfile.key === "software_engineer" && roleProfile.specialization
        ? ENGINEERING_SPECIALIZATIONS[roleProfile.specialization]
        : null;

    const suggestions = [];
    const warnings = [];
    const roleSignals = roleProfile.roleSignals || [];
    const roleSignalCount = Number.isFinite(signals.roleSignalCount)
      ? signals.roleSignalCount
      : roleSignals.filter((pattern) => pattern.test(prompt)).length;
    const contextEvidence = signals.contextEvidence || {};
    const attemptQuality = signals.attemptQuality || {};
    const shortcutIntent = !!signals.shortcutIntent;
    const contextText = clean(fields.context) || prompt;
    const attemptText = clean(fields.attempt) || prompt;

    if (roleSignalCount === 0 || prompt.length < 140) {
      uniquePush(suggestions, specializationMeta?.suggestion || roleProfile.roleSuggestion);
    }

    if (shortcutIntent) {
      uniquePush(warnings, specializationMeta?.shortcutWarning || roleProfile.shortcutWarning);
    }

    if (roleProfile.key === "teacher") {
      if (!/learner|student|class|objective|assessment|rubric|lesson/i.test(contextText)) {
        uniquePush(suggestions, "Teacher mode: name the learner level, lesson objective, and assessment signal you care about.");
      }
      if (!attemptQuality.hasActionSignal) {
        uniquePush(suggestions, "Teacher mode: describe what teaching approach or explanation you already tried and what students struggled with.");
      }
    }

    if (roleProfile.key === "software_engineer") {
      if (!contextEvidence.hasArtifactSignal || !contextEvidence.hasExpectedActualPair) {
        uniquePush(
          suggestions,
          specializationMeta?.suggestion || "Engineer mode: include repo or file path, exact failure, and expected vs actual behavior."
        );
      }
    }

    if (roleProfile.key === "solution_architecture") {
      if (!/latency|throughput|availability|reliability|scale|cost|compliance|integration|sla/i.test(contextText)) {
        uniquePush(suggestions, "Architecture mode: include scale assumptions, NFRs, integration constraints, and the tradeoff you need help evaluating.");
      }
      if (!attemptQuality.hasActionSignal) {
        uniquePush(suggestions, "Architecture mode: show the option you already considered and where the tradeoff still feels unclear.");
      }
    }

    if (roleProfile.key === "manager") {
      if (!/timeline|date|deadline|capacity|owner|risk|scope|priority|stakeholder/i.test(contextText)) {
        uniquePush(suggestions, "Manager mode: include business impact, timeline, staffing or owner context, and the decision you need.");
      }
    }

    if (roleProfile.key === "director") {
      if (!/kpi|metric|budget|portfolio|dependency|alignment|governance|roadmap/i.test(contextText)) {
        uniquePush(suggestions, "Director mode: include KPI targets, budget or portfolio limits, cross-team dependencies, and strategic tradeoffs.");
      }
    }

    if (roleProfile.key === "doctor") {
      if (!/history|timeline|red flag|symptom|lab|exam|differential/i.test(contextText)) {
        uniquePush(suggestions, "Doctor mode: include symptoms timeline, relevant history, red flags, and tests already available.");
      }
      if (/diagnos(e|is)|prescrib|dosage|treatment plan|medical advice/i.test(prompt)) {
        uniquePush(warnings, roleProfile.shortcutWarning);
      }
    }

    if (roleProfile.key === "other" && !/constraint|evidence|outcome|risk/i.test(contextText)) {
      uniquePush(suggestions, "Domain mode: give AI the relevant evidence, constraints, and the exact outcome you want it to reason toward.");
    }

    if (snapshot.level === "Student") {
      uniquePush(suggestions, "Student mode: ask AI for step-by-step reasoning and one short exercise before any final answer.");
    }

    if (snapshot.level === "Junior") {
      if (!attemptQuality.hasActionSignal) {
        uniquePush(suggestions, "Junior mode: include one manual attempt first so AI can coach your reasoning instead of replacing it.");
      }
      uniquePush(suggestions, "Junior mode: prefer next steps and explanation over full copy-paste answers.");
    }

    return {
      roleProfile,
      focusLine: snapshot.focusLine,
      examplePrompts: snapshot.examples,
      warningHint: snapshot.warningHint,
      habitTip: snapshot.habitTip,
      suggestions,
      warnings
    };
  }

  const api = {
    JOB_ROLE_ORDER,
    JOB_ROLE_OPTIONS,
    ROLE_TEMPLATE_RECOMMENDATIONS,
    LEVEL_OPTIONS,
    normalizeLevel,
    isStudentLevel,
    normalizeRoleKey,
    hasLegacyStudentRole,
    migrateLegacyStudentProfile,
    resolveRoleKey,
    getRoleProfile,
    buildRoleHeaderLines,
    getRecommendedTemplateForProfile,
    buildRoleCoachingSnapshot,
    buildRoleCoachingAdvice
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachRoleCoaching = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachRoleCoaching = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
