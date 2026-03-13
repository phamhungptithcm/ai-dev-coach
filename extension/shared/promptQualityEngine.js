(() => {
  const DIMENSION_MAX = {
    clarity: 25,
    context: 30,
    specificity: 30,
    risk: 15
  };

  const CONTEXT_ERROR_HINTS = [
    /\berror\b/i,
    /\b(?:type|reference|syntax|runtime|range)error\b/i,
    /\bexception\b/i,
    /\btraceback\b/i,
    /\bstack\s*trace\b/i,
    /\bfailed?\b/i,
    /\bfailure\b/i,
    /\bcrash(ed)?\b/i,
    /\bbug\b/i,
    /l[ôo]i/i,
    /ngo[ạa]i\s*l[ệe]/i,
    /kh[ôo]ng\s+ch[ạa]y/i,
    /b[ịi]\s*l[ôo]i/i
  ];

  const CONTEXT_EXPECTED_HINTS = [
    /\bexpected\b/i,
    /\bshould\b/i,
    /\bintend(ed)?\b/i,
    /\btarget behavior\b/i,
    /mong\s*[đd]?[ợo]i/i,
    /k[ỳy]\s*v[ọo]ng/i,
    /\bmu[ốo]n\b/i,
    /[đd][aá]ng\s*l[ẽe]/i
  ];

  const CONTEXT_ACTUAL_HINTS = [
    /\bactual\b/i,
    /\bcurrently\b/i,
    /\binstead\b/i,
    /\bobserved\b/i,
    /\breturns?\b/i,
    /\bhappens?\b/i,
    /th[ựu]c\s*t[ếe]/i,
    /hi[ệe]n\s*t[ạa]i/i,
    /nh[ưu]ng/i,
    /\bv[ẫa]n\b/i
  ];

  const CONTEXT_ARTIFACT_HINTS = [
    /```/,
    /line\s*\d+/i,
    /[a-z0-9_./-]+\.[a-z0-9]+(:\d{1,5})?/i,
    /\bfile\b/i,
    /\bpath\b/i,
    /\bmodule\b/i,
    /\bclass\b/i,
    /\bfunction\b/i,
    /\bmethod\b/i,
    /\bendpoint\b/i,
    /\bsql\b/i,
    /\blog\b/i,
    /\brepo\b/i,
    /\bbranch\b/i,
    /\bcommit\b/i,
    /\bdiff\b/i,
    /\bpayload\b/i,
    /\brequest\b/i,
    /\bresponse\b/i,
    /t[ệe]p/i,
    /d[òo]ng\s*\d+/i,
    /h[àa]m/i,
    /nh[áa]nh/i,
    /[ảa]nh\s*(m[àa]n\s*h[ìi]nh)?/i
  ];

  const ATTEMPT_ACTION_HINTS = [
    /\bi tried\b/i,
    /\bi attempted\b/i,
    /\bi tested\b/i,
    /\bi changed\b/i,
    /\bi debugged\b/i,
    /\bi ran\b/i,
    /\bi checked\b/i,
    /\bi profiled\b/i,
    /[đd][aã]\s*th[ửu]/i,
    /\bt[ôo]i\s*th[ửu]\b/i,
    /\bem\s*th[ửu]\b/i,
    /[đd][aã]\s*ch[ạa]y/i,
    /[đd][aã]\s*ki[ểe]m\s*tra/i,
    /[đd][aã]\s*debug/i
  ];

  const ATTEMPT_RESULT_HINTS = [
    /\bit still\b/i,
    /\bstill fails?\b/i,
    /\bi got\b/i,
    /\bresult(ed)?\b/i,
    /\boutputs?\b/i,
    /\bthrows?\b/i,
    /\bnow\b/i,
    /k[ếe]t\s*qu[ảa]/i,
    /b[ịi]\s*l[ôo]i/i,
    /ra\s*l[ôo]i/i,
    /kh[ôo]ng\s*[đd][ổo]i/i,
    /\bv[ẫa]n\b/i
  ];

  const ATTEMPT_BLOCKER_HINTS = [
    /\bstuck\b/i,
    /\bblocked\b/i,
    /\bnot sure\b/i,
    /\bdon'?t understand\b/i,
    /\bcannot\b/i,
    /\bcan'?t\b/i,
    /\bunsure\b/i,
    /\bneed help\b/i,
    /\bb[íi]\b/i,
    /v[ưu][ớo]ng/i,
    /kh[ôo]ng\s*bi[ếe]t/i,
    /ch[ưu]a\s*hi[ểe]u/i,
    /kh[óo]\s*kh[ăa]n/i
  ];

  const ATTEMPT_NEGATIVE_HINTS = [
    /\bi (did not|didn'?t|have not|haven'?t) (try|attempt)\b/i,
    /\bi didn'?t do anything\b/i,
    /\bch[ưu]a\s*th[ửu]\b/i,
    /kh[ôo]ng\s*th[ửu]/i,
    /ch[ưu]a\s*l[aà]m\s*g[ìi]/i
  ];

  const SHORTCUT_HINTS = [
    /give me full code/i,
    /do it for me/i,
    /just give me answer/i,
    /no explanation/i,
    /copy and paste/i,
    /urgent.*fix/i,
    /vi[ếe]t.*full\s*code/i,
    /l[aà]m\s+h[ộo]\s*t[ôo]i/i,
    /cho\s*t[ôo]i\s*[đd][aá]p\s*[aá]n\s*ngay/i,
    /kh[ôo]ng\s*c[ầa]n\s*gi[ảa]i\s*th[íi]ch/i
  ];

  const TASK_SECTION_HINTS = [
    /task\s*:/i,
    /goal\s*:/i,
    /nhi[ệe]m\s*v[ụu]\s*:/i,
    /m[ụu]c\s*ti[êe]u\s*:/i,
    /y[êe]u\s*c[ầa]u\s*:/i
  ];

  const CONTEXT_SECTION_HINTS = [
    /context\s*:/i,
    /background\s*:/i,
    /b[ốo]i\s*c[ảa]nh\s*:/i,
    /ng[ữu]\s*c[ảa]nh\s*:/i
  ];

  const ATTEMPT_SECTION_HINTS = [
    /(what i (already )?tried|attempt)\s*:/i,
    /[đd][aã]\s*th[ửu]\s*:/i,
    /t[ôo]i\s*[đd][aã]\s*th[ửu]\s*:/i,
    /em\s*[đd][aã]\s*th[ửu]\s*:/i
  ];

  const FRAMEWORK_HINTS = [
    { label: "React", regex: /\breact\b/i },
    { label: "Next.js", regex: /\bnext(?:\.js)?\b/i },
    { label: "Vue", regex: /\bvue\b/i },
    { label: "Angular", regex: /\bangular\b/i },
    { label: "Node.js", regex: /\bnode(?:\.js)?\b/i },
    { label: "Express", regex: /\bexpress\b/i },
    { label: "Spring Boot", regex: /\bspring\s*boot\b/i },
    { label: "Java", regex: /\bjava\b/i },
    { label: "Python", regex: /\bpython\b/i },
    { label: "Django", regex: /\bdjango\b/i },
    { label: "Flask", regex: /\bflask\b/i },
    { label: "SQL", regex: /\bsql\b/i },
    { label: "PostgreSQL", regex: /\bpostgres(?:ql)?\b/i },
    { label: "MySQL", regex: /\bmysql\b/i },
    { label: "MongoDB", regex: /\bmongo(?:db)?\b/i },
    { label: "Redis", regex: /\bredis\b/i },
    { label: "Docker", regex: /\bdocker\b/i },
    { label: "Kubernetes", regex: /\b(?:kubernetes|k8s)\b/i },
    { label: "AWS", regex: /\baws\b/i },
    { label: "GCP", regex: /\b(?:gcp|google cloud)\b/i },
    { label: "Azure", regex: /\bazure\b/i },
    { label: "Terraform", regex: /\bterraform\b/i },
    { label: "Kafka", regex: /\bkafka\b/i },
    { label: "Jest", regex: /\bjest\b/i },
    { label: "Vitest", regex: /\bvitest\b/i },
    { label: "Playwright", regex: /\bplaywright\b/i },
    { label: "Cypress", regex: /\bcypress\b/i }
  ];

  const VAGUE_PHRASE_HINTS = [
    { label: "fix this", regex: /\bfix this\b/i },
    { label: "help me", regex: /\bhelp me\b/i },
    { label: "why broken", regex: /\bwhy\s+(?:is\s+it\s+)?broken\b/i },
    { label: "not working", regex: /\bnot working\b/i },
    { label: "please solve", regex: /\b(?:please\s+)?solve (?:this|it)\b/i },
    { label: "do it for me", regex: /\bdo it for me\b/i },
    { label: "full code", regex: /\bfull code\b/i },
    { label: "giup toi", regex: /gi[uú]p\s+t[ôo]i/i },
    { label: "sua loi", regex: /s[ửu]a\s+l[ỗo]i/i },
    { label: "khong hoat dong", regex: /kh[ôo]ng\s+ho[ạa]t\s+[đd][ộo]ng/i },
    { label: "tai sao hong", regex: /t[ạa]i\s+sao\s+h[ỏo]ng/i }
  ];

  const TEMPLATE_SIGNALS = {
    debugging: /error|stack|trace|bug|failing/i,
    code_review: /review|regression|security|test/i,
    system_design: /architecture|scal|throughput|availability|trade-?off/i,
    refactoring: /refactor|maintain|readability|structure/i,
    performance_optimization: /latency|cpu|memory|throughput|benchmark|optimi/i,
    learning: /learn|explain|exercise|understand|concept/i
  };

  function clean(value) {
    return (value || "").trim();
  }

  function getRoleCoachingModule() {
    if (
      typeof globalThis !== "undefined" &&
      globalThis.AIDevCoachRoleCoaching &&
      typeof globalThis.AIDevCoachRoleCoaching.getRoleProfile === "function"
    ) {
      return globalThis.AIDevCoachRoleCoaching;
    }

    if (typeof require === "function") {
      try {
        return require("./roleCoaching.js");
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function uniquePush(list, value) {
    if (!value || list.includes(value)) {
      return;
    }
    list.push(value);
  }

  function countRegexMatches(text, patterns) {
    return patterns.filter((pattern) => pattern.test(text)).length;
  }

  function findLabeledMatches(text, patterns) {
    const matches = [];
    patterns.forEach((pattern) => {
      if (pattern.regex.test(text)) {
        matches.push(pattern.label);
      }
    });
    return matches;
  }

  function hasAnyHint(prompt, patterns) {
    return patterns.some((pattern) => pattern.test(prompt));
  }

  function hasStructuredSections(prompt, fields) {
    if (fields && clean(fields.task) && clean(fields.context) && clean(fields.attempt)) {
      return true;
    }

    return (
      hasAnyHint(prompt, TASK_SECTION_HINTS) &&
      hasAnyHint(prompt, CONTEXT_SECTION_HINTS) &&
      hasAnyHint(prompt, ATTEMPT_SECTION_HINTS)
    );
  }

  function evaluateContextEvidence(prompt, fields) {
    const contextSource = clean(fields && fields.context ? fields.context : prompt);
    const fullSource = clean(prompt);
    const hasErrorSignal = hasAnyHint(contextSource || fullSource, CONTEXT_ERROR_HINTS);
    const hasExpectedSignal = hasAnyHint(contextSource || fullSource, CONTEXT_EXPECTED_HINTS);
    const hasActualSignal = hasAnyHint(contextSource || fullSource, CONTEXT_ACTUAL_HINTS);
    const hasExpectedActualPair = hasExpectedSignal && hasActualSignal;
    const hasArtifactSignal = hasAnyHint(contextSource || fullSource, CONTEXT_ARTIFACT_HINTS);
    const hasCodeBlock = /```|`[^`\n]+`/.test(fullSource);
    const frameworkMatches = findLabeledMatches(fullSource, FRAMEWORK_HINTS);

    return {
      hasErrorSignal,
      hasExpectedActualPair,
      hasArtifactSignal,
      hasCodeBlock,
      frameworkMatches
    };
  }

  function evaluateAttemptQuality(prompt, fields) {
    const attemptSource = clean(fields && fields.attempt ? fields.attempt : prompt);
    const source = attemptSource || clean(prompt);
    const hasActionSignal = hasAnyHint(source, ATTEMPT_ACTION_HINTS);
    const hasResultSignal = hasAnyHint(source, ATTEMPT_RESULT_HINTS);
    const hasBlockerSignal = hasAnyHint(source, ATTEMPT_BLOCKER_HINTS);
    const hasNegativeAttemptSignal = hasAnyHint(source, ATTEMPT_NEGATIVE_HINTS);
    const hasIndependentAttempt = !hasNegativeAttemptSignal && hasActionSignal && hasResultSignal;

    return {
      hasActionSignal,
      hasResultSignal,
      hasBlockerSignal,
      hasNegativeAttemptSignal,
      hasIndependentAttempt
    };
  }

  function hasShortcutIntent(prompt) {
    return hasAnyHint(prompt, SHORTCUT_HINTS);
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

  function buildSummary(total, dimensionScores) {
    if (total >= 90) {
      return "Strong prompt. It has enough detail for a focused, teachable answer.";
    }
    if (total >= 75) {
      return "Good prompt. A little more evidence can make the response sharper.";
    }

    const ranked = [
      { key: "clarity", label: "clarity", score: dimensionScores.clarity / DIMENSION_MAX.clarity },
      { key: "context", label: "context", score: dimensionScores.context / DIMENSION_MAX.context },
      { key: "specificity", label: "specificity", score: dimensionScores.specificity / DIMENSION_MAX.specificity },
      { key: "risk", label: "safe prompting habits", score: dimensionScores.risk / DIMENSION_MAX.risk }
    ].sort((left, right) => left.score - right.score);

    const weakest = ranked[0];
    if (weakest.key === "context") {
      return "Prompt needs stronger evidence. Add error details, expected vs actual behavior, and artifacts.";
    }
    if (weakest.key === "specificity") {
      return "Prompt needs more specifics. Add what you tried, constraints, and success criteria.";
    }
    if (weakest.key === "risk") {
      return "Prompt is relying too much on shortcuts. Ask for guidance, not just final output.";
    }
    return "Prompt is still vague. Tighten the ask and explain the exact outcome you want.";
  }

  function calculatePromptScore(input) {
    const options = typeof input === "string" ? { prompt: input } : { ...(input || {}) };
    const fields = options.fields || {};
    const prompt = clean(options.prompt || "");
    const taskText = clean(fields.task || prompt.split(/\n+/)[0] || "");
    const constraintsText = clean(fields.constraints);
    const acceptanceText = clean(fields.acceptance);
    const roleCoaching = getRoleCoachingModule();
    const strictMode = !!options.strictMode;
    const templateKey = options.templateKey || "";
    const roleKey = options.profile && options.profile.roleKey ? options.profile.roleKey : "";
    const roleProfile = roleCoaching ? roleCoaching.getRoleProfile(options.profile || {}) : null;
    const roleSignals = Array.isArray(options.roleSignals) && options.roleSignals.length > 0
      ? options.roleSignals
      : roleProfile && Array.isArray(roleProfile.roleSignals)
        ? roleProfile.roleSignals
        : [];

    const warnings = [];
    const suggestions = [];
    const vagueMatches = findLabeledMatches(prompt, VAGUE_PHRASE_HINTS);
    const contextEvidence = evaluateContextEvidence(prompt, fields);
    const attemptQuality = evaluateAttemptQuality(prompt, fields);
    const shortcutIntent = hasShortcutIntent(prompt);
    const structuredSections = hasStructuredSections(prompt, fields);
    const roleSignalCount = countRegexMatches(prompt, roleSignals);
    const templateAligned = templateKey && TEMPLATE_SIGNALS[templateKey] ? TEMPLATE_SIGNALS[templateKey].test(prompt) : false;
    const numericSpecificity = /\b\d+(?:ms|s|sec|seconds|%|x|kb|mb|gb|qps|rps|rpm)?\b/i.test(prompt);
    const explicitAsk = /\b(debug|diagnos|explain|review|design|refactor|optimi|learn|teach|compare|analy[sz]e|help)\b/i.test(taskText || prompt);

    let clarity = 0;
    if (prompt.length >= 180) {
      clarity += 8;
    } else if (prompt.length >= 60) {
      clarity += 6;
    } else if (prompt.length >= 20) {
      clarity += 3;
      uniquePush(suggestions, "Add a bit more detail so AI has enough context to reason well.");
    } else {
      uniquePush(warnings, "Prompt is too short. Add a clearer task before sending.");
    }

    if (taskText.length >= 30) {
      clarity += 8;
    } else if (taskText.length >= 12) {
      clarity += 5;
      uniquePush(suggestions, "State the task more clearly, including the exact outcome you want.");
    } else {
      uniquePush(warnings, "Task is vague. Explain what you want AI to help you do.");
    }

    if (structuredSections) {
      clarity += 5;
    } else {
      uniquePush(suggestions, "Use clear sections such as Task, Context, and What You Tried.");
    }

    if (explicitAsk) {
      clarity += 2;
    }

    if (vagueMatches.length > 0) {
      clarity -= Math.min(6, vagueMatches.length * 2);
      uniquePush(
        warnings,
        `Vague phrasing detected (${vagueMatches.slice(0, 2).join(", ")}). Replace it with a concrete technical ask.`
      );
    } else {
      clarity += 2;
    }
    clarity = Math.max(0, Math.min(DIMENSION_MAX.clarity, clarity));

    let context = 0;
    const contextEvidenceCount =
      Number(contextEvidence.hasErrorSignal) +
      Number(contextEvidence.hasExpectedActualPair) +
      Number(contextEvidence.hasArtifactSignal);

    if (contextEvidenceCount === 3) {
      context += 18;
    } else if (contextEvidenceCount === 2) {
      context += 12;
    } else if (contextEvidenceCount === 1) {
      context += 6;
    }

    if (!contextEvidence.hasErrorSignal) {
      uniquePush(suggestions, "Include the concrete error, failure, or symptom you are seeing.");
    }
    if (!contextEvidence.hasExpectedActualPair) {
      uniquePush(suggestions, "Include both expected behavior and actual behavior.");
    }
    if (!contextEvidence.hasArtifactSignal) {
      uniquePush(suggestions, "Add artifacts like file paths, logs, snippets, endpoints, or stack traces.");
    }

    if (contextEvidence.hasCodeBlock) {
      context += 4;
    } else if (/code|query|component|function|class|api/i.test(prompt)) {
      uniquePush(suggestions, "Add a small code snippet or exact artifact when the issue is code-related.");
    }

    if (contextEvidence.frameworkMatches.length > 0) {
      context += Math.min(6, 3 + contextEvidence.frameworkMatches.length);
    } else {
      uniquePush(suggestions, "Include framework or stack context (for example React, Spring Boot, SQL, Docker)." );
    }

    if (clean(fields.context).length >= 40) {
      context += 2;
    }

    if (roleSignalCount > 0) {
      context += Math.min(2, roleSignalCount);
    }
    context = Math.max(0, Math.min(DIMENSION_MAX.context, context));

    let specificity = 0;
    if (
      attemptQuality.hasActionSignal &&
      attemptQuality.hasResultSignal &&
      attemptQuality.hasBlockerSignal &&
      !attemptQuality.hasNegativeAttemptSignal
    ) {
      specificity += 14;
    } else if (
      attemptQuality.hasActionSignal &&
      attemptQuality.hasResultSignal &&
      !attemptQuality.hasNegativeAttemptSignal
    ) {
      specificity += 10;
      uniquePush(suggestions, "Add the current blocker so AI can continue from where you got stuck.");
    } else if (attemptQuality.hasActionSignal && !attemptQuality.hasNegativeAttemptSignal) {
      specificity += 6;
      uniquePush(suggestions, "Add what happened after your attempt and why it did not solve the problem.");
    } else if (!attemptQuality.hasNegativeAttemptSignal) {
      uniquePush(suggestions, "Describe what you already tried, what happened, and where you are blocked.");
    }

    if (constraintsText.length >= 16) {
      specificity += 4;
    }
    if (acceptanceText.length >= 16) {
      specificity += 4;
    }
    if (numericSpecificity) {
      specificity += 4;
    }
    if (templateAligned) {
      specificity += 4;
    } else if (templateKey) {
      uniquePush(suggestions, "Add details that match the chosen template objective.");
    }
    if (roleSignalCount > 0) {
      specificity += Math.min(4, roleSignalCount);
    }
    specificity = Math.max(0, Math.min(DIMENSION_MAX.specificity, specificity));

    let risk = DIMENSION_MAX.risk;
    if (shortcutIntent) {
      risk -= 7;
      uniquePush(warnings, "Shortcut language detected. Ask for reasoning or next steps before asking for full code.");
    }
    if (attemptQuality.hasNegativeAttemptSignal) {
      risk -= 5;
      uniquePush(warnings, "Prompt says no attempt was made. Try one step first, then ask AI.");
    }
    if (/just.*answer|only.*code|no explanation/i.test(prompt)) {
      risk -= 3;
      uniquePush(warnings, "Prompt asks for an answer without explanation. Prefer coaching and verification guidance.");
    }
    if (strictMode && shortcutIntent && !attemptQuality.hasIndependentAttempt) {
      risk -= 3;
      uniquePush(warnings, "Strict mode: include your attempt and blocker before asking for final output.");
    }
    if (roleKey === "doctor" && /\bdiagnos(e|is)|prescrib|dosage|treatment plan|medical advice\b/i.test(prompt)) {
      risk -= 4;
      uniquePush(
        warnings,
        "Doctor mode safety: ask for educational reasoning and differential guidance, not direct diagnosis or prescriptions."
      );
    }
    if (/step-?by-?step|explain|teach|coach|review|why/i.test(prompt)) {
      risk += 1;
    }
    if (vagueMatches.length > 0) {
      risk -= Math.min(4, vagueMatches.length);
    }
    risk = Math.max(0, Math.min(DIMENSION_MAX.risk, risk));

    if (specificity < 12) {
      uniquePush(suggestions, "Add constraints, acceptance criteria, or measurable targets to narrow the answer.");
    }

    const roleAdvice = roleCoaching
      ? roleCoaching.buildRoleCoachingAdvice({
          profile: options.profile || {},
          prompt,
          fields,
          templateKey,
          signals: {
            contextEvidence,
            attemptQuality,
            roleSignalCount,
            shortcutIntent
          }
        })
      : null;

    if (roleAdvice) {
      roleAdvice.warnings.forEach((warning) => uniquePush(warnings, warning));
      roleAdvice.suggestions.forEach((suggestion) => uniquePush(suggestions, suggestion));
    }

    const total = clarity + context + specificity + risk;
    const grade = gradeFromScore(total);
    const breakdown = [
      { label: "Clarity", score: clarity, max: DIMENSION_MAX.clarity },
      { label: "Context", score: context, max: DIMENSION_MAX.context },
      { label: "Specificity", score: specificity, max: DIMENSION_MAX.specificity },
      { label: "Risk Guardrails", score: risk, max: DIMENSION_MAX.risk }
    ];

    return {
      clarity,
      context,
      specificity,
      risk,
      total,
      score: total,
      grade,
      summary: buildSummary(total, { clarity, context, specificity, risk }),
      warnings,
      suggestions,
      breakdown,
      hasShortcutIntent: shortcutIntent,
      hasIndependentAttempt: attemptQuality.hasIndependentAttempt,
      signals: {
        promptLength: prompt.length,
        vagueMatches,
        structuredSections,
        contextEvidence,
        attemptQuality,
        frameworkMatches: contextEvidence.frameworkMatches,
        roleSignalCount,
        templateAligned,
        roleProfileKey: roleProfile ? roleProfile.key : roleKey || "",
        specialization: roleProfile ? roleProfile.specialization || "" : ""
      }
    };
  }

  const api = {
    DIMENSION_MAX,
    gradeFromScore,
    calculatePromptScore
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachPromptQualityEngine = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachPromptQualityEngine = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
