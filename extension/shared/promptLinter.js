(() => {
  const TECHNICAL_PROMPT_HINTS = [
    /\bcode\b/i,
    /\bapi\b/i,
    /\bendpoint\b/i,
    /\bfunction\b/i,
    /\bclass\b/i,
    /\bcomponent\b/i,
    /\bquery\b/i,
    /\bsql\b/i,
    /\bbug\b/i,
    /\berror\b/i,
    /\btrace\b/i,
    /\bstack\b/i,
    /\bbuild\b/i,
    /\bdeploy\b/i,
    /\btest\b/i,
    /\bdebug\b/i,
    /m[ãa]\s*ngu[ồo]n/i,
    /l[ỗo]i/i,
    /truy\s*v[ấa]n/i,
    /h[àa]m/i,
    /api/i
  ];

  const FAILURE_PROMPT_HINTS = [
    /\berror\b/i,
    /\bexception\b/i,
    /\btraceback\b/i,
    /\bstack\s*trace\b/i,
    /\bbug\b/i,
    /\bfailed?\b/i,
    /\bcrash(ed)?\b/i,
    /\bbroken\b/i,
    /\bnot working\b/i,
    /\bissue\b/i,
    /\bproblem\b/i,
    /l[ỗo]i/i,
    /kh[ôo]ng\s+ch[ạa]y/i,
    /h[ỏo]ng/i
  ];

  const TECHNICAL_TEMPLATES = new Set([
    'debugging',
    'code_review',
    'system_design',
    'refactoring',
    'performance_optimization'
  ]);

  const TECHNICAL_ROLE_KEYS = new Set(['software_engineer', 'solution_architecture']);

  function clean(value) {
    return (value || '').trim();
  }

  function getPromptQualityEngine() {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.AIDevCoachPromptQualityEngine &&
      typeof globalThis.AIDevCoachPromptQualityEngine.calculatePromptScore === 'function'
    ) {
      return globalThis.AIDevCoachPromptQualityEngine;
    }

    if (typeof require === 'function') {
      try {
        return require('./promptQualityEngine.js');
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function getSecretGuard() {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.AIDevCoachSecretGuard &&
      typeof globalThis.AIDevCoachSecretGuard.inspectPromptForSecrets === 'function'
    ) {
      return globalThis.AIDevCoachSecretGuard;
    }

    if (typeof require === 'function') {
      try {
        return require('../content/secretDetection.js');
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function hasAnyHint(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function buildContext(input) {
    const options = typeof input === 'string' ? { prompt: input } : { ...(input || {}) };
    const prompt = clean(options.prompt);
    const qualityEngine = getPromptQualityEngine();
    const analysis = options.analysis || (qualityEngine ? qualityEngine.calculatePromptScore(options) : null);
    const secretGuard = getSecretGuard();
    const secretInspection = options.secretInspection || (
      secretGuard && typeof secretGuard.inspectPromptForSecrets === 'function'
        ? secretGuard.inspectPromptForSecrets(prompt)
        : { findings: [] }
    );
    const signals = analysis && analysis.signals ? analysis.signals : {};
    const roleKey = clean(options.profile && options.profile.roleKey);
    const isTechnicalPrompt =
      TECHNICAL_TEMPLATES.has(options.templateKey) ||
      TECHNICAL_ROLE_KEYS.has(roleKey) ||
      hasAnyHint(prompt, TECHNICAL_PROMPT_HINTS);
    const isFailurePrompt = options.templateKey === 'debugging' || hasAnyHint(prompt, FAILURE_PROMPT_HINTS);

    return {
      options,
      prompt,
      analysis,
      signals,
      secretInspection,
      isTechnicalPrompt,
      isFailurePrompt
    };
  }

  function makeResult(rule, passed, message, severity = rule.severity) {
    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      severity,
      passed,
      message,
      blocking: !passed && severity === 'error'
    };
  }

  const PROMPT_LINT_RULES = [
    {
      id: 'prompt-too-short',
      title: 'Prompt length',
      description: 'Prompt should include enough detail to reason about the request.',
      severity: 'warning',
      check(context) {
        const promptLength = context.signals.promptLength || context.prompt.length;
        const structuredSections = !!context.signals.structuredSections;
        if (promptLength >= 60 || structuredSections) {
          return makeResult(this, true, 'Prompt length looks healthy.');
        }
        return makeResult(this, false, 'Prompt shorter than recommended length.');
      }
    },
    {
      id: 'missing-technical-context',
      title: 'Technical context',
      description: 'Technical prompts should include stack or artifact context.',
      severity: 'warning',
      check(context) {
        if (!context.isTechnicalPrompt) {
          return makeResult(this, true, 'Technical context rule not triggered for this prompt.', 'info');
        }

        const evidence = context.signals.contextEvidence || {};
        const frameworkMatches = context.signals.frameworkMatches || [];
        const hasTechnicalContext = !!evidence.hasArtifactSignal || frameworkMatches.length > 0;
        if (hasTechnicalContext) {
          return makeResult(this, true, 'Technical context is present.');
        }
        return makeResult(this, false, 'Missing technical context such as stack, file path, snippet, or endpoint.');
      }
    },
    {
      id: 'missing-error-message',
      title: 'Failure signal',
      description: 'Failure-oriented prompts should include the exact error or symptom.',
      severity: 'warning',
      check(context) {
        if (!context.isFailurePrompt) {
          return makeResult(this, true, 'No explicit failure flow detected.', 'info');
        }

        const evidence = context.signals.contextEvidence || {};
        if (evidence.hasErrorSignal) {
          return makeResult(this, true, 'Concrete error or failure signal detected.');
        }
        return makeResult(this, false, 'Missing concrete error message or runtime failure signal.');
      }
    },
    {
      id: 'possible-sensitive-data',
      title: 'Sensitive data',
      description: 'Prompts should not contain credentials, secrets, or private keys.',
      severity: 'error',
      check(context) {
        const findings = (context.secretInspection && context.secretInspection.findings) || [];
        if (findings.length === 0) {
          return makeResult(this, true, 'No sensitive data detected.');
        }

        const labels = Array.from(new Set(findings.map((finding) => finding.name))).slice(0, 2).join(', ');
        return makeResult(this, false, `Possible sensitive data detected: ${labels}.`);
      }
    }
  ];

  function lintPrompt(input) {
    const context = buildContext(input);
    const results = PROMPT_LINT_RULES.map((rule) => rule.check(context));
    const failing = results.filter((result) => !result.passed);
    const passing = results.filter((result) => result.passed);
    const errors = failing.filter((result) => result.severity === 'error');
    const warnings = failing.filter((result) => result.severity !== 'error');

    return {
      results,
      summary: {
        total: results.length,
        passed: passing.length,
        failed: failing.length,
        errors: errors.length,
        warnings: warnings.length
      },
      hasBlockingFailure: errors.length > 0,
      failingResults: failing,
      passingResults: passing
    };
  }

  const api = {
    PROMPT_LINT_RULES,
    lintPrompt
  };

  if (typeof window !== 'undefined') {
    window.AIDevCoachPromptLinter = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.AIDevCoachPromptLinter = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
