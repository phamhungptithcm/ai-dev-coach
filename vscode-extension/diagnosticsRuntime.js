const runtime = require("./coachRuntime");

const SUPPORTED_LANGUAGE_IDS = new Set(["markdown", "plaintext"]);
const SECTION_ORDER = [
  "role",
  "level",
  "task",
  "context",
  "what_i_tried",
  "constraints",
  "acceptance_criteria"
];
const SECTION_TITLES = {
  role: "Role",
  level: "Level",
  task: "Task",
  context: "Context",
  what_i_tried: "What I Tried",
  constraints: "Constraints",
  acceptance_criteria: "Acceptance Criteria"
};
const HEADING_TO_KEY = new Map(
  Object.entries(SECTION_TITLES).map(([key, title]) => [title.toLowerCase(), key])
);
const DIAGNOSTIC_CODES = {
  LOW_SCORE: "low-prompt-score",
  PROMPT_TOO_SHORT: "prompt-too-short",
  MISSING_TECHNICAL_CONTEXT: "missing-technical-context",
  MISSING_ERROR_MESSAGE: "missing-error-message",
  POSSIBLE_SENSITIVE_DATA: "possible-sensitive-data"
};

function clean(value) {
  return String(value || "").trim();
}

function normalizeTemplateKey(value) {
  return runtime.TEMPLATE_DEFINITIONS[value] ? value : "debugging";
}

function cloneHeadingRegex() {
  return /^(Role|Level|Task|Context|What I Tried|Constraints|Acceptance Criteria)\s*:/gim;
}

function extractPromptSections(text) {
  const source = String(text || "");
  const matches = [];
  const regex = cloneHeadingRegex();
  let match;

  while ((match = regex.exec(source)) !== null) {
    const key = HEADING_TO_KEY.get(String(match[1] || "").toLowerCase());
    if (!key || matches.some((entry) => entry.key === key)) {
      continue;
    }

    matches.push({
      key,
      title: SECTION_TITLES[key],
      start: match.index
    });
  }

  return matches.reduce((sections, entry, index) => {
    const next = matches[index + 1];
    const end = next ? next.start : source.length;
    const headingEnd = source.indexOf("\n", entry.start);
    const contentStart = headingEnd === -1 ? end : headingEnd + 1;
    sections[entry.key] = {
      key: entry.key,
      title: entry.title,
      start: entry.start,
      end,
      contentStart,
      content: clean(source.slice(contentStart, end))
    };
    return sections;
  }, {});
}

function inferTemplateKey(text, fallback) {
  const source = clean(text).toLowerCase();
  if (/code review|pull request|review this|review goal|review feedback/.test(source)) {
    return "code_review";
  }
  if (/system design|architecture|scalability|scaling|sla|tradeoff/.test(source)) {
    return "system_design";
  }
  if (/refactor|cleanup|clean up|restructure/.test(source)) {
    return "refactoring";
  }
  if (/performance|latency|throughput|benchmark|profil/.test(source)) {
    return "performance_optimization";
  }
  if (/learning|learn|understand|teach|explain/.test(source)) {
    return "learning";
  }
  return normalizeTemplateKey(fallback);
}

function looksLikePromptDocument(options = {}) {
  const text = String(options.text || "");
  const languageId = clean(options.languageId).toLowerCase();
  const maxPromptLength = Number.isFinite(options.maxPromptLength) ? options.maxPromptLength : 6000;
  const sections = extractPromptSections(text);
  const sectionCount = Object.keys(sections).length;

  if (!clean(text) || text.length > maxPromptLength) {
    return false;
  }

  if (sectionCount >= 2) {
    return true;
  }

  if (!SUPPORTED_LANGUAGE_IDS.has(languageId)) {
    return false;
  }

  const lineCount = text.split(/\r?\n/).filter((line) => clean(line)).length;
  const promptHints = [
    /\bprompt\b/i,
    /\bdebug\b/i,
    /\bcode review\b/i,
    /\bsystem design\b/i,
    /\brefactor/i,
    /\bperformance\b/i,
    /\blearn(ing)?\b/i,
    /\btask:\b/i,
    /\bcontext:\b/i
  ];

  return text.length >= 20 && lineCount >= 1 && promptHints.some((pattern) => pattern.test(text));
}

function buildSkeletonSections(options = {}) {
  return extractPromptSections(
    runtime.buildPromptSkeleton({
      roleKey: options.roleKey,
      level: options.level,
      templateKey: normalizeTemplateKey(options.templateKey)
    })
  );
}

function firstMeaningfulRange(text) {
  const source = String(text || "");
  const trimmed = source.trimStart();
  const start = source.length - trimmed.length;
  const newlineIndex = source.indexOf("\n", start);
  const end = newlineIndex === -1 ? Math.max(source.length, start + 1) : Math.max(newlineIndex, start + 1);
  return { start, end };
}

function rangeFromSectionOrIntro(text, sections, sectionKey) {
  if (sections[sectionKey]) {
    return { start: sections[sectionKey].start, end: sections[sectionKey].end };
  }
  return firstMeaningfulRange(text);
}

function buildDiagnosticDescriptor(code, severity, message, range, data) {
  return {
    code,
    severity,
    message,
    start: range.start,
    end: range.end,
    data: data || null
  };
}

function hasDiagnosticCode(diagnostics, code) {
  return diagnostics.some((entry) => entry.code === code);
}

function analyzePromptDocument(options = {}) {
  const text = String(options.text || "");
  const languageId = clean(options.languageId).toLowerCase();
  const maxPromptLength = Number.isFinite(options.maxPromptLength) ? options.maxPromptLength : 6000;

  if (!looksLikePromptDocument({ text, languageId, maxPromptLength })) {
    return {
      shouldAnalyze: false,
      sections: extractPromptSections(text),
      diagnostics: []
    };
  }

  const templateKey = inferTemplateKey(text, options.templateKey);
  const analysisResult = runtime.analyzePrompt({
    prompt: text,
    roleKey: options.roleKey,
    level: options.level,
    templateKey
  });
  const sections = extractPromptSections(text);
  const diagnostics = [];

  analysisResult.lintReport.failingResults.forEach((result) => {
    if (result.id === DIAGNOSTIC_CODES.POSSIBLE_SENSITIVE_DATA) {
      return;
    }

    if (result.id === DIAGNOSTIC_CODES.PROMPT_TOO_SHORT) {
      diagnostics.push(
        buildDiagnosticDescriptor(
          DIAGNOSTIC_CODES.PROMPT_TOO_SHORT,
          "warning",
          result.message,
          firstMeaningfulRange(text)
        )
      );
      return;
    }

    if (result.id === DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT) {
      diagnostics.push(
        buildDiagnosticDescriptor(
          DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT,
          "warning",
          result.message,
          rangeFromSectionOrIntro(text, sections, "context")
        )
      );
      return;
    }

    if (result.id === DIAGNOSTIC_CODES.MISSING_ERROR_MESSAGE) {
      diagnostics.push(
        buildDiagnosticDescriptor(
          DIAGNOSTIC_CODES.MISSING_ERROR_MESSAGE,
          "warning",
          result.message,
          rangeFromSectionOrIntro(text, sections, "context")
        )
      );
    }
  });

  if (sections.task && !sections.context && !hasDiagnosticCode(diagnostics, DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT)) {
    diagnostics.push(
      buildDiagnosticDescriptor(
        DIAGNOSTIC_CODES.MISSING_TECHNICAL_CONTEXT,
        "warning",
        "Structured prompt is missing a Context section with stack, file path, endpoint, or failing artifact details.",
        rangeFromSectionOrIntro(text, sections, "task")
      )
    );
  }

  (analysisResult.secretInspection.findings || []).forEach((finding) => {
    diagnostics.push(
      buildDiagnosticDescriptor(
        DIAGNOSTIC_CODES.POSSIBLE_SENSITIVE_DATA,
        "error",
        `Possible sensitive data detected: ${finding.name}.`,
        {
          start: finding.start,
          end: finding.end
        },
        {
          findingName: finding.name,
          redacted: finding.redacted
        }
      )
    );
  });

  if (analysisResult.analysis.score < 70) {
    const severity = analysisResult.analysis.score < 60 ? "warning" : "information";
    diagnostics.push(
      buildDiagnosticDescriptor(
        DIAGNOSTIC_CODES.LOW_SCORE,
        severity,
        `Prompt score ${analysisResult.analysis.score}/100. ${analysisResult.analysis.summary}`,
        firstMeaningfulRange(text)
      )
    );
  }

  return {
    shouldAnalyze: true,
    templateKey,
    sections,
    analysisResult,
    diagnostics
  };
}

function composePrompt(sections) {
  return SECTION_ORDER.map((key) => `${SECTION_TITLES[key]}:\n${clean(sections[key])}`).join("\n\n");
}

function buildStructuredPromptFromText(text, options = {}) {
  const defaults = buildSkeletonSections(options);
  return composePrompt({
    role: defaults.role ? defaults.role.content : "Software Engineer",
    level: defaults.level ? defaults.level.content : "Junior",
    task: clean(text) || (defaults.task ? defaults.task.content : ""),
    context: defaults.context ? defaults.context.content : "",
    what_i_tried: defaults.what_i_tried ? defaults.what_i_tried.content : "",
    constraints: defaults.constraints ? defaults.constraints.content : "",
    acceptance_criteria: defaults.acceptance_criteria ? defaults.acceptance_criteria.content : ""
  });
}

function appendSection(text, title, content) {
  const source = String(text || "");
  const trimmed = source.replace(/\s*$/, "");
  const prefix = trimmed ? "\n\n" : "";
  return `${trimmed}${prefix}${title}:\n${content}`.trimEnd();
}

function insertIntoSection(text, section, snippet) {
  const before = text.slice(0, section.end).replace(/\s*$/, "");
  const after = text.slice(section.end).replace(/^\s*/, "");
  const boundary = after ? "\n\n" : "";
  return `${before}\n${snippet}${boundary}${after}`.trimEnd();
}

function applyPromptFix(options = {}) {
  const text = String(options.text || "");
  const fixId = clean(options.fixId);
  const templateKey = inferTemplateKey(text, options.templateKey);
  const defaults = buildSkeletonSections({
    roleKey: options.roleKey,
    level: options.level,
    templateKey
  });
  const sections = extractPromptSections(text);

  if (fixId === "expand-structured-prompt") {
    return buildStructuredPromptFromText(text, {
      roleKey: options.roleKey,
      level: options.level,
      templateKey
    });
  }

  if (fixId === "add-context-section") {
    if (!sections.context) {
      return appendSection(text, SECTION_TITLES.context, defaults.context ? defaults.context.content : "");
    }
    const snippet = [
      "Technical context to add:",
      "- File/module/path:",
      "- Framework/runtime/service:",
      "- Endpoint/snippet/artifact:"
    ].join("\n");
    return insertIntoSection(text, sections.context, snippet);
  }

  if (fixId === "add-failure-signal") {
    const snippet = [
      "Exact failure signal to add:",
      "- Literal error, stack trace, failing test, or observed symptom:"
    ].join("\n");

    if (!sections.context) {
      return appendSection(text, SECTION_TITLES.context, snippet);
    }
    return insertIntoSection(text, sections.context, snippet);
  }

  if (fixId === "add-what-i-tried-section") {
    if (sections.what_i_tried) {
      return text;
    }
    return appendSection(
      text,
      SECTION_TITLES.what_i_tried,
      defaults.what_i_tried ? defaults.what_i_tried.content : ""
    );
  }

  if (fixId === "redact-sensitive-data") {
    if (options.analysisResult && options.analysisResult.secretInspection) {
      return options.analysisResult.secretInspection.redactedPrompt || text;
    }
    return runtime.analyzePrompt({
      prompt: text,
      roleKey: options.roleKey,
      level: options.level,
      templateKey
    }).secretInspection.redactedPrompt;
  }

  return text;
}

module.exports = {
  DIAGNOSTIC_CODES,
  SECTION_ORDER,
  SECTION_TITLES,
  SUPPORTED_LANGUAGE_IDS,
  analyzePromptDocument,
  applyPromptFix,
  extractPromptSections,
  looksLikePromptDocument
};
