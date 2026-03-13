(() => {
  const DEFAULT_LIMIT = 5;
  const MINIMUM_RESULTS = 3;
  const STOPWORDS = new Set([
    "a",
    "an",
    "and",
    "for",
    "from",
    "how",
    "i",
    "in",
    "into",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "please",
    "that",
    "the",
    "this",
    "to",
    "with"
  ]);

  const ROLE_CATEGORY_WEIGHTS = {
    teacher: { learning: 18, writing: 12, productivity: 8 },
    software_engineer: { developer: 20, learning: 9, productivity: 4 },
    solution_architecture: { developer: 18, business: 10, productivity: 6 },
    manager: { business: 18, productivity: 14, writing: 8 },
    director: { business: 20, productivity: 12, writing: 10 },
    doctor: { learning: 14, daily_life: 10, writing: 6 },
    other: {}
  };

  const ROLE_KEYWORD_WEIGHTS = {
    teacher: [/teach/i, /lesson/i, /learn/i, /quiz/i, /flashcard/i],
    software_engineer: [/debug/i, /review/i, /stack/i, /sql/i, /test/i, /api/i, /architect/i],
    solution_architecture: [/architecture/i, /scalable/i, /system/i, /integration/i, /strategy/i],
    manager: [/plan/i, /email/i, /analysis/i, /pitch/i, /strategy/i, /market/i],
    director: [/pitch/i, /strategy/i, /pricing/i, /investor/i, /analysis/i],
    doctor: [/explain/i, /plan/i, /routine/i, /stress/i, /focus/i],
    other: []
  };

  const INTENT_RULES = [
    {
      id: "summarize",
      patterns: [/\bsummar(y|ize|ise)\b/i, /\bkey points?\b/i, /\binsights?\b/i, /\bbullet points?\b/i],
      categories: { learning: 18, writing: 10, business: 8 },
      keywords: [/summar/i, /key learning/i, /conclusion/i]
    },
    {
      id: "debug",
      patterns: [/\bdebug\b/i, /\bbug\b/i, /\berror\b/i, /\bstack trace\b/i, /\bbroken\b/i],
      categories: { developer: 22 },
      keywords: [/debug/i, /stack trace/i, /error/i]
    },
    {
      id: "review",
      patterns: [/\breview\b/i, /\bfeedback\b/i, /\bimprove\b/i, /\brefactor\b/i],
      categories: { developer: 16, writing: 10 },
      keywords: [/review/i, /rewrite/i, /refactor/i, /improve/i]
    },
    {
      id: "write",
      patterns: [/\bwrite\b/i, /\brewrite\b/i, /\bemail\b/i, /\barticle\b/i, /\bblog\b/i],
      categories: { writing: 20, business: 8 },
      keywords: [/write/i, /rewrite/i, /email/i, /article/i, /headline/i]
    },
    {
      id: "plan",
      patterns: [/\bplan\b/i, /\bschedule\b/i, /\broadmap\b/i, /\broutine\b/i, /\bpriorit/i],
      categories: { productivity: 18, business: 8, learning: 6 },
      keywords: [/plan/i, /schedule/i, /routine/i, /roadmap/i]
    },
    {
      id: "learn",
      patterns: [/\blearn\b/i, /\bteach\b/i, /\bexplain\b/i, /\bpractice\b/i, /\bquiz\b/i],
      categories: { learning: 20, developer: 6 },
      keywords: [/explain/i, /teach/i, /quiz/i, /practice/i, /flashcard/i]
    },
    {
      id: "business",
      patterns: [/\bstartup\b/i, /\bbusiness\b/i, /\bmarket\b/i, /\bpitch\b/i, /\bpricing\b/i],
      categories: { business: 20, writing: 6, productivity: 4 },
      keywords: [/startup/i, /business/i, /pitch/i, /pricing/i, /market/i]
    },
    {
      id: "image",
      patterns: [/\bimage\b/i, /\bdesign\b/i, /\blogo\b/i, /\bconcept art\b/i, /\bportrait\b/i],
      categories: { image_generation: 22 },
      keywords: [/design/i, /logo/i, /portrait/i, /concept/i, /cinematic/i]
    }
  ];

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function tokenizeQuery(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
  }

  function getPromptMarketplace() {
    const marketplace = globalThis.AIDevCoachPromptMarketplace;
    if (!marketplace || typeof marketplace.getPromptLibrary !== "function") {
      throw new Error("Prompt marketplace module is unavailable.");
    }
    return marketplace;
  }

  function normalizeRoleKey(value) {
    const roleCoaching = globalThis.AIDevCoachRoleCoaching;
    if (roleCoaching && typeof roleCoaching.normalizeRoleKey === "function") {
      return roleCoaching.normalizeRoleKey(value);
    }
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "_") || "other";
  }

  function detectIntents(query) {
    const source = clean(query);
    return INTENT_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(source)));
  }

  function scoreTokenMatch(prompt, token) {
    let score = 0;
    if (prompt.title.toLowerCase().includes(token)) {
      score += 14;
    }
    if (prompt.text.toLowerCase().includes(token)) {
      score += 10;
    }
    if (prompt.keywords.some((keyword) => keyword.includes(token))) {
      score += 6;
    }
    return score;
  }

  function buildUsageLookup(rawState) {
    return getPromptMarketplace().coerceState(rawState).usage || {};
  }

  function getPopularityScore(promptId, usageLookup) {
    const usage = usageLookup[promptId] || {};
    const totalUses = Number.isFinite(usage.totalUses) ? usage.totalUses : 0;
    const sendUses = Number.isFinite(usage.sendUses) ? usage.sendUses : 0;
    const insertUses = Number.isFinite(usage.insertUses) ? usage.insertUses : 0;
    return Math.min(24, totalUses * 4 + sendUses * 6 + insertUses * 3);
  }

  function buildReasonLabels({ tokenScore, roleScore, intentScore, popularityScore }) {
    const reasons = [];

    if (tokenScore > 0) {
      reasons.push("Matched your text");
    }
    if (popularityScore > 0) {
      reasons.push("Popular locally");
    }
    if (intentScore > 0) {
      reasons.push("Intent match");
    }
    if (roleScore > 0) {
      reasons.push("Fits your role");
    }

    return reasons.slice(0, 3);
  }

  function scorePrompt(prompt, query, roleKey, usageLookup) {
    const queryTokens = tokenizeQuery(query);
    const normalizedQuery = clean(query).toLowerCase();
    const intents = detectIntents(query);
    const roleWeights = ROLE_CATEGORY_WEIGHTS[roleKey] || ROLE_CATEGORY_WEIGHTS.other;
    const roleKeywordWeights = ROLE_KEYWORD_WEIGHTS[roleKey] || [];

    let tokenScore = 0;
    queryTokens.forEach((token) => {
      tokenScore += scoreTokenMatch(prompt, token);
    });

    if (normalizedQuery && prompt.text.toLowerCase().includes(normalizedQuery)) {
      tokenScore += 18;
    }

    let roleScore = roleWeights[prompt.categoryKey] || 0;
    if (roleKeywordWeights.some((pattern) => pattern.test(prompt.text))) {
      roleScore += 10;
    }

    let intentScore = 0;
    intents.forEach((intent) => {
      intentScore += intent.categories[prompt.categoryKey] || 0;
      if (intent.keywords.some((pattern) => pattern.test(prompt.text))) {
        intentScore += 10;
      }
    });

    const popularityScore = getPopularityScore(prompt.id, usageLookup);
    const duplicateBoost = Math.min(4, Math.max(0, (prompt.duplicateCount || 1) - 1));
    const totalScore = tokenScore + roleScore + intentScore + popularityScore + duplicateBoost;

    return {
      tokenScore,
      roleScore,
      intentScore,
      popularityScore,
      totalScore
    };
  }

  function fallbackSuggestions(library, roleKey, usageLookup, limit, excludedIds) {
    const roleWeights = ROLE_CATEGORY_WEIGHTS[roleKey] || ROLE_CATEGORY_WEIGHTS.other;
    const excluded = new Set(excludedIds || []);

    return library.prompts
      .filter((prompt) => !excluded.has(prompt.id))
      .map((prompt) => {
        const popularityScore = getPopularityScore(prompt.id, usageLookup);
        const roleScore = roleWeights[prompt.categoryKey] || 0;
        return {
          prompt,
          score: roleScore + popularityScore,
          reasonLabels: buildReasonLabels({
            tokenScore: 0,
            roleScore,
            intentScore: 0,
            popularityScore
          })
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.prompt.title.localeCompare(right.prompt.title);
      })
      .slice(0, limit);
  }

  function getInlinePromptSuggestions(options = {}) {
    const marketplace = getPromptMarketplace();
    const library = options.library && Array.isArray(options.library.prompts)
      ? options.library
      : marketplace.getPromptLibrary();
    const rawState = options.rawState || null;
    const roleKey = normalizeRoleKey(options.roleKey || "other");
    const query = clean(options.query);
    const usageLookup = buildUsageLookup(rawState);
    const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(8, Math.round(options.limit))) : DEFAULT_LIMIT;
    const minimum = Number.isFinite(options.minimum) ? Math.max(1, Math.min(limit, Math.round(options.minimum))) : Math.min(limit, MINIMUM_RESULTS);

    if (query.length < 2) {
      return [];
    }

    const primary = library.prompts
      .map((prompt) => {
        const score = scorePrompt(prompt, query, roleKey, usageLookup);
        return {
          ...prompt,
          matchScore: score.totalScore,
          reasons: buildReasonLabels(score),
          usage: usageLookup[prompt.id] || {}
        };
      })
      .filter((prompt) => prompt.matchScore > 0)
      .sort((left, right) => {
        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }
        return left.title.localeCompare(right.title);
      })
      .slice(0, limit);

    if (primary.length >= minimum) {
      return primary.slice(0, limit);
    }

    const fallback = fallbackSuggestions(
      library,
      roleKey,
      usageLookup,
      limit - primary.length,
      primary.map((prompt) => prompt.id)
    ).map((entry) => ({
      ...entry.prompt,
      matchScore: entry.score,
      reasons: entry.reasonLabels,
      usage: usageLookup[entry.prompt.id] || {}
    }));

    return [...primary, ...fallback].slice(0, limit);
  }

  const api = {
    tokenizeQuery,
    detectIntents,
    getInlinePromptSuggestions
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachPromptSuggestionEngine = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachPromptSuggestionEngine = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
