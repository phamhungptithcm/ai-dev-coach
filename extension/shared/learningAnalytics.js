(() => {
  const STORAGE_KEY = "learningAnalytics";
  const SCHEMA_VERSION = 2;
  const MAX_PROMPT_EVENTS = 250;
  const DEFAULT_PLATFORM = "Unknown";
  const DEFAULT_SOURCE = "composer_submit";
  const DEFAULT_CATEGORY = "unclassified";
  const DEFAULT_TREND_WINDOW_DAYS = 7;
  const CATEGORY_LABELS = {
    debugging: "Debugging",
    code_review: "Code Review",
    system_design: "System Design",
    refactoring: "Refactoring",
    performance_optimization: "Performance",
    learning: "Learning",
    unclassified: "Unclassified"
  };
  const PROMPT_CATEGORY_RULES = [
    {
      key: "debugging",
      patterns: [
        /\bdebug(?:ging)?\b/i,
        /\berror\b/i,
        /\bstack\s*trace\b/i,
        /\btraceback\b/i,
        /\bexception\b/i,
        /\bbug\b/i,
        /\bfail(?:ed|ing|ure)?\b/i,
        /\bcrash(?:ed)?\b/i,
        /\broot cause\b/i,
        /s[ửu]a\s+l[ỗo]i/i,
        /l[ỗo]i/i
      ]
    },
    {
      key: "code_review",
      patterns: [
        /\breview\b/i,
        /\bpull request\b/i,
        /\bpr\b/i,
        /\bregression\b/i,
        /\bsecurity\b/i,
        /\bmissing tests?\b/i,
        /\bcode review\b/i
      ]
    },
    {
      key: "system_design",
      patterns: [
        /\barchitecture\b/i,
        /\bsystem design\b/i,
        /\bscal(?:e|ability|ing)\b/i,
        /\bthroughput\b/i,
        /\bavailability\b/i,
        /\btrade-?off\b/i,
        /\bnfr\b/i,
        /\bsla\b/i,
        /\bintegration\b/i
      ]
    },
    {
      key: "refactoring",
      patterns: [
        /\brefactor(?:ing)?\b/i,
        /\bmaintainab(?:le|ility)\b/i,
        /\breadability\b/i,
        /\bcode smell\b/i,
        /\bcleanup\b/i,
        /\bstructure\b/i
      ]
    },
    {
      key: "performance_optimization",
      patterns: [
        /\bperformance\b/i,
        /\blatency\b/i,
        /\bthroughput\b/i,
        /\bmemory\b/i,
        /\bcpu\b/i,
        /\bbenchmark\b/i,
        /\boptimi(?:ze|sation|zation)\b/i,
        /\bslow query\b/i
      ]
    },
    {
      key: "learning",
      patterns: [
        /\blearn(?:ing)?\b/i,
        /\bteach\b/i,
        /\bexplain\b/i,
        /\bunderstand\b/i,
        /\bconcept\b/i,
        /\bguide(?:d)?\b/i,
        /\bexercise\b/i,
        /\bh[ọo]c/i,
        /gi[ảa]i\s+th[íi]ch/i
      ]
    }
  ];

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function getRoleCoachingModule() {
    if (
      typeof globalThis !== "undefined" &&
      globalThis.AIDevCoachRoleCoaching &&
      typeof globalThis.AIDevCoachRoleCoaching.buildRoleCoachingSnapshot === "function"
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

  function asNonNegativeInteger(value) {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.max(0, Math.round(value));
  }

  function asPercentScore(value) {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function normalizeTimestamp(value) {
    if (Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
    return Date.now();
  }

  function buildDayKey(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function shiftDay(timestamp, offsetDays) {
    const date = new Date(normalizeTimestamp(timestamp));
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    return date.getTime();
  }

  function buildDayKeys(endTimestamp, days) {
    const safeDays = Math.max(1, Math.min(30, asNonNegativeInteger(days) || DEFAULT_TREND_WINDOW_DAYS));
    const keys = [];
    for (let index = safeDays - 1; index >= 0; index -= 1) {
      keys.push(buildDayKey(shiftDay(endTimestamp, -index)));
    }
    return keys;
  }

  function formatDayLabel(dayKey) {
    const parsed = new Date(`${dayKey}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return dayKey;
    }
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  function makeCountMap(rawMap, normalizeKey = (key) => clean(key)) {
    if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
      return {};
    }

    return Object.entries(rawMap).reduce((accumulator, [key, value]) => {
      const normalizedKey = normalizeKey(key);
      const normalizedValue = asNonNegativeInteger(Number(value));
      if (!normalizedKey || normalizedValue === null || normalizedValue === 0) {
        return accumulator;
      }
      accumulator[normalizedKey] = normalizedValue;
      return accumulator;
    }, {});
  }

  function normalizeCategory(value) {
    const normalized = clean(value).toLowerCase();
    return CATEGORY_LABELS[normalized] ? normalized : DEFAULT_CATEGORY;
  }

  function getCategoryLabel(value) {
    const key = normalizeCategory(value);
    return CATEGORY_LABELS[key] || CATEGORY_LABELS[DEFAULT_CATEGORY];
  }

  function countRuleMatches(text, rule) {
    if (!rule || !Array.isArray(rule.patterns)) {
      return 0;
    }

    return rule.patterns.reduce((count, pattern) => count + Number(pattern.test(text)), 0);
  }

  function inferPromptCategory(input) {
    const options = typeof input === "string" ? { prompt: input } : { ...(input || {}) };
    const explicitCategory = normalizeCategory(options.category);
    if (explicitCategory !== DEFAULT_CATEGORY) {
      return explicitCategory;
    }

    const prompt = clean(options.prompt);
    if (!prompt) {
      return DEFAULT_CATEGORY;
    }

    let bestCategory = DEFAULT_CATEGORY;
    let bestScore = 0;

    PROMPT_CATEGORY_RULES.forEach((rule) => {
      const score = countRuleMatches(prompt, rule);
      if (score > bestScore) {
        bestCategory = rule.key;
        bestScore = score;
      }
    });

    return bestCategory;
  }

  function createEmptyState() {
    return {
      version: SCHEMA_VERSION,
      promptEvents: [],
      summary: {
        totalPrompts: 0,
        scoredPrompts: 0,
        averageScore: null,
        averagePromptLength: null,
        lastPromptAt: 0,
        lastPlatform: "",
        platformCounts: {},
        sourceCounts: {},
        categoryCounts: {},
        dayCounts: {},
        qualityCounts: {
          strong: 0,
          solid: 0,
          needsWork: 0
        },
        independentAttemptRate: null,
        shortcutPromptCount: 0,
        lintIssueEvents: 0,
        warningEvents: 0
      },
      updatedAt: 0
    };
  }

  function normalizePromptEvent(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const timestamp = normalizeTimestamp(input.timestamp || input.at);
    const prompt = clean(input.prompt);
    const derivedPromptLength =
      Number.isFinite(input.promptLength)
        ? input.promptLength
        : prompt
          ? prompt.length
          : null;
    const category = inferPromptCategory({
      prompt,
      category: input.category
    });

    return {
      id: clean(input.id) || `prompt_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type: "prompt_submitted",
      source: clean(input.source) || DEFAULT_SOURCE,
      platform: clean(input.platform) || DEFAULT_PLATFORM,
      category,
      timestamp,
      dayKey: buildDayKey(timestamp),
      promptLength: asNonNegativeInteger(derivedPromptLength),
      score: asPercentScore(input.score),
      grade: clean(input.grade),
      dependency: asPercentScore(input.dependency),
      hasIndependentAttempt: !!input.hasIndependentAttempt,
      hasShortcutIntent: !!input.hasShortcutIntent,
      warningCount: asNonNegativeInteger(Number(input.warningCount)) || 0,
      lintFailedCount: asNonNegativeInteger(Number(input.lintFailedCount)) || 0,
      roleKey: clean(input.roleKey),
      skillLevel: clean(input.skillLevel)
    };
  }

  function summarizePromptEvents(promptEvents) {
    const events = Array.isArray(promptEvents) ? promptEvents : [];
    const platformCounts = {};
    const sourceCounts = {};
    const categoryCounts = {};
    const dayCounts = {};
    const qualityCounts = {
      strong: 0,
      solid: 0,
      needsWork: 0
    };
    let scoreTotal = 0;
    let scoredPrompts = 0;
    let promptLengthTotal = 0;
    let promptLengthCount = 0;
    let latestEvent = null;
    let independentAttemptCount = 0;
    let shortcutPromptCount = 0;
    let lintIssueEvents = 0;
    let warningEvents = 0;

    events.forEach((event) => {
      const platform = clean(event.platform) || DEFAULT_PLATFORM;
      const source = clean(event.source) || DEFAULT_SOURCE;
      const category = normalizeCategory(event.category);
      const dayKey = clean(event.dayKey) || buildDayKey(normalizeTimestamp(event.timestamp));

      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

      if (event.hasIndependentAttempt) {
        independentAttemptCount += 1;
      }
      if (event.hasShortcutIntent) {
        shortcutPromptCount += 1;
      }
      if (event.lintFailedCount > 0) {
        lintIssueEvents += 1;
      }
      if (event.warningCount > 0) {
        warningEvents += 1;
      }

      if (Number.isFinite(event.score)) {
        scoreTotal += event.score;
        scoredPrompts += 1;
        if (event.score >= 85) {
          qualityCounts.strong += 1;
        } else if (event.score >= 60) {
          qualityCounts.solid += 1;
        } else {
          qualityCounts.needsWork += 1;
        }
      }

      if (Number.isFinite(event.promptLength)) {
        promptLengthTotal += event.promptLength;
        promptLengthCount += 1;
      }

      if (!latestEvent || event.timestamp > latestEvent.timestamp) {
        latestEvent = event;
      }
    });

    return {
      totalPrompts: events.length,
      scoredPrompts,
      averageScore: scoredPrompts > 0 ? Math.round(scoreTotal / scoredPrompts) : null,
      averagePromptLength: promptLengthCount > 0 ? Math.round(promptLengthTotal / promptLengthCount) : null,
      lastPromptAt: latestEvent ? latestEvent.timestamp : 0,
      lastPlatform: latestEvent ? latestEvent.platform : "",
      lastRoleKey: latestEvent ? clean(latestEvent.roleKey) : "",
      lastSkillLevel: latestEvent ? clean(latestEvent.skillLevel) : "",
      platformCounts,
      sourceCounts,
      categoryCounts,
      dayCounts,
      qualityCounts,
      independentAttemptRate:
        events.length > 0 ? Math.round((independentAttemptCount / events.length) * 100) : null,
      shortcutPromptCount,
      lintIssueEvents,
      warningEvents
    };
  }

  function coerceState(rawState) {
    if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
      return createEmptyState();
    }

    const promptEvents = Array.isArray(rawState.promptEvents)
      ? rawState.promptEvents
          .map((event) => normalizePromptEvent(event))
          .filter(Boolean)
          .sort((left, right) => left.timestamp - right.timestamp)
          .slice(-MAX_PROMPT_EVENTS)
      : [];

    return {
      version: SCHEMA_VERSION,
      promptEvents,
      summary: summarizePromptEvents(promptEvents),
      updatedAt: Number.isFinite(rawState.updatedAt) ? Math.round(rawState.updatedAt) : 0
    };
  }

  function appendPromptEvent(rawState, rawEvent) {
    const state = coerceState(rawState);
    const event = normalizePromptEvent(rawEvent);
    if (!event) {
      return state;
    }

    const promptEvents = [...state.promptEvents, event]
      .sort((left, right) => left.timestamp - right.timestamp)
      .slice(-MAX_PROMPT_EVENTS);

    return {
      version: SCHEMA_VERSION,
      promptEvents,
      summary: summarizePromptEvents(promptEvents),
      updatedAt: Date.now()
    };
  }

  function rankCountMap(countMap, total, labelResolver = (key) => key) {
    const safeTotal = Math.max(0, asNonNegativeInteger(total) || 0);
    return Object.entries(countMap || {})
      .filter(([, count]) => Number.isFinite(count) && count > 0)
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }
        return left[0].localeCompare(right[0]);
      })
      .map(([key, count]) => ({
        key,
        label: labelResolver(key),
        count,
        percentage: safeTotal > 0 ? Math.round((count / safeTotal) * 100) : 0
      }));
  }

  function pushUnique(target, message) {
    if (!message || target.includes(message)) {
      return;
    }
    target.push(message);
  }

  function buildSessionSuggestions(summary, topCategory) {
    const suggestions = [];
    const roleCoaching = getRoleCoachingModule();
    const roleSnapshot =
      roleCoaching && (summary?.lastRoleKey || summary?.lastSkillLevel)
        ? roleCoaching.buildRoleCoachingSnapshot({
            roleKey: summary.lastRoleKey || "",
            skill: summary.lastSkillLevel || ""
          })
        : null;

    if (!summary || summary.totalPrompts === 0) {
      pushUnique(suggestions, "Send a few prompts during a real task to unlock your first daily summary.");
      return suggestions;
    }

    if (!Number.isFinite(summary.averageScore) || summary.averageScore < 75) {
      pushUnique(suggestions, "Add stronger evidence: error details, expected vs actual behavior, and one concrete artifact.");
    }

    if (!Number.isFinite(summary.independentAttemptRate) || summary.independentAttemptRate < 50) {
      pushUnique(suggestions, "Describe what you already tried and where you are blocked before sending prompts to AI.");
    }

    if (summary.shortcutPromptCount > 0) {
      pushUnique(suggestions, "Ask AI for hints, review, or next steps before asking for a final answer or full code.");
    }

    if (summary.lintIssueEvents > 0) {
      pushUnique(suggestions, "Review prompt lint warnings before sending. They usually point to missing context or vague asks.");
    }

    if (Number.isFinite(summary.averagePromptLength) && summary.averagePromptLength < 120) {
      pushUnique(suggestions, "Prompts are short on average. Add file paths, logs, snippets, or success criteria.");
    }

    if (topCategory && topCategory.key === DEFAULT_CATEGORY && summary.totalPrompts >= 2) {
      pushUnique(suggestions, "Use clearer task framing so your sessions are easier to categorize and review over time.");
    }

    if (roleSnapshot && roleSnapshot.habitTip && suggestions.length < 3) {
      pushUnique(suggestions, roleSnapshot.habitTip);
    }

    if (suggestions.length === 0) {
      pushUnique(suggestions, "Strong session. Keep using Task, Context, and What You Tried in every prompt.");
    }

    return suggestions.slice(0, 3);
  }

  function buildSessionHeadline(dayKey, summary, topCategory) {
    if (!summary || summary.totalPrompts === 0) {
      return `No prompts tracked for ${dayKey} yet.`;
    }

    const averageScoreText = Number.isFinite(summary.averageScore)
      ? ` Average quality score: ${summary.averageScore}/100.`
      : "";
    const categoryText = topCategory && topCategory.key !== DEFAULT_CATEGORY
      ? ` Most prompts were ${topCategory.label.toLowerCase()}.`
      : "";

    return `You sent ${summary.totalPrompts} prompt${summary.totalPrompts === 1 ? "" : "s"} on ${dayKey}.${averageScoreText}${categoryText}`;
  }

  function buildSessionStatsLine(summary, topCategory) {
    if (!summary || summary.totalPrompts === 0) {
      return "Daily summaries appear after your first tracked prompt of the day.";
    }

    const parts = [];

    if (topCategory) {
      parts.push(`Top category: ${topCategory.label} (${topCategory.count})`);
    }
    if (Number.isFinite(summary.independentAttemptRate)) {
      parts.push(`Independent attempts: ${summary.independentAttemptRate}%`);
    }
    if (summary.lintIssueEvents > 0) {
      parts.push(`Lint issue events: ${summary.lintIssueEvents}`);
    }
    if (summary.shortcutPromptCount > 0) {
      parts.push(`Shortcut prompts: ${summary.shortcutPromptCount}`);
    }

    return parts.join(" | ") || "Keep building structured prompts to improve this summary.";
  }

  function buildDailySessionSummary(rawState, options = {}) {
    const state = coerceState(rawState);
    const targetTimestamp = normalizeTimestamp(options.timestamp || options.now);
    const dayKey = clean(options.dayKey) || buildDayKey(targetTimestamp);
    const promptEvents = state.promptEvents.filter((event) => event.dayKey === dayKey);
    const summary = summarizePromptEvents(promptEvents);
    const categories = rankCountMap(summary.categoryCounts, summary.totalPrompts, getCategoryLabel);
    const topCategory = categories[0] || null;
    const suggestions = buildSessionSuggestions(summary, topCategory);

    return {
      dayKey,
      generatedAt: Date.now(),
      isEmpty: summary.totalPrompts === 0,
      categories,
      topCategory,
      headline: buildSessionHeadline(dayKey, summary, topCategory),
      statsLine: buildSessionStatsLine(summary, topCategory),
      suggestions,
      ...summary
    };
  }

  function buildTrendDirection(firstValue, lastValue, options = {}) {
    const threshold = Math.max(1, asNonNegativeInteger(options.threshold) || 5);
    if (!Number.isFinite(firstValue) || !Number.isFinite(lastValue)) {
      return "steady";
    }

    const delta = Math.round(lastValue - firstValue);
    if (delta >= threshold) {
      return "up";
    }
    if (delta <= -threshold) {
      return "down";
    }
    return "steady";
  }

  function buildTrendSummaryLabel(metricLabel, direction, delta, options = {}) {
    const preferLower = !!options.preferLower;
    const unit = clean(options.unit) || "point";
    const pluralUnit = clean(options.pluralUnit) || `${unit}s`;
    if (!Number.isFinite(delta)) {
      return `${metricLabel} trend needs more activity before it can be compared.`;
    }
    const absoluteDelta = Math.abs(delta);
    const unitLabel = absoluteDelta === 1 ? unit : pluralUnit;

    if (direction === "up") {
      return preferLower
        ? `${metricLabel} increased by ${absoluteDelta} ${unitLabel} across the visible window.`
        : `${metricLabel} is improving by ${absoluteDelta} ${unitLabel} across the visible window.`;
    }
    if (direction === "down") {
      return preferLower
        ? `${metricLabel} improved by dropping ${absoluteDelta} ${unitLabel} across the visible window.`
        : `${metricLabel} dropped by ${absoluteDelta} ${unitLabel} across the visible window.`;
    }
    return `${metricLabel} stayed roughly stable across the visible window.`;
  }

  function buildTrendDashboard(rawState, options = {}) {
    const state = coerceState(rawState);
    const endTimestamp = normalizeTimestamp(options.timestamp || options.now);
    const days = Math.max(1, Math.min(30, asNonNegativeInteger(options.days) || DEFAULT_TREND_WINDOW_DAYS));
    const dayKeys = buildDayKeys(endTimestamp, days);
    const windowDaySet = new Set(dayKeys);
    const filteredEvents = state.promptEvents.filter((event) => windowDaySet.has(event.dayKey));
    const bucketByDay = dayKeys.reduce((accumulator, dayKey) => {
      accumulator[dayKey] = [];
      return accumulator;
    }, {});

    filteredEvents.forEach((event) => {
      if (bucketByDay[event.dayKey]) {
        bucketByDay[event.dayKey].push(event);
      }
    });

    const qualitySeries = dayKeys.map((dayKey) => {
      const events = bucketByDay[dayKey];
      const scoredEvents = events.filter((event) => Number.isFinite(event.score));
      const averageScore = scoredEvents.length > 0
        ? Math.round(scoredEvents.reduce((sum, event) => sum + event.score, 0) / scoredEvents.length)
        : null;

      return {
        dayKey,
        label: formatDayLabel(dayKey),
        totalPrompts: events.length,
        averageScore
      };
    });

    const warningSeries = dayKeys.map((dayKey) => {
      const events = bucketByDay[dayKey];
      const warningEventCount = events.filter((event) => event.warningCount > 0).length;
      return {
        dayKey,
        label: formatDayLabel(dayKey),
        totalPrompts: events.length,
        warningEventCount,
        warningRate: events.length > 0 ? Math.round((warningEventCount / events.length) * 100) : 0
      };
    });

    const categorySummary = summarizePromptEvents(filteredEvents);
    const categoryBreakdown = rankCountMap(
      categorySummary.categoryCounts,
      categorySummary.totalPrompts,
      getCategoryLabel
    );

    const scoredTrendPoints = qualitySeries.filter((entry) => Number.isFinite(entry.averageScore));
    const qualityFirst = scoredTrendPoints.length > 0 ? scoredTrendPoints[0].averageScore : null;
    const qualityLast = scoredTrendPoints.length > 0 ? scoredTrendPoints[scoredTrendPoints.length - 1].averageScore : null;
    const qualityDelta =
      Number.isFinite(qualityFirst) && Number.isFinite(qualityLast)
        ? Math.round(qualityLast - qualityFirst)
        : null;
    const qualityDirection = buildTrendDirection(qualityFirst, qualityLast, {
      threshold: 5
    });

    const warningFirst = warningSeries.length > 0 ? warningSeries[0].warningEventCount : null;
    const warningLast = warningSeries.length > 0 ? warningSeries[warningSeries.length - 1].warningEventCount : null;
    const warningDelta =
      Number.isFinite(warningFirst) && Number.isFinite(warningLast)
        ? Math.round(warningLast - warningFirst)
        : null;
    const warningDirection = buildTrendDirection(warningFirst, warningLast, {
      threshold: 1
    });

    return {
      days,
      totalPrompts: filteredEvents.length,
      activeDays: qualitySeries.filter((entry) => entry.totalPrompts > 0).length,
      qualitySeries,
      warningSeries,
      categoryBreakdown,
      topCategory: categoryBreakdown[0] || null,
      qualityTrend: {
        direction: qualityDirection,
        delta: qualityDelta,
        summary: buildTrendSummaryLabel("Prompt quality", qualityDirection, qualityDelta, {
          unit: "point"
        })
      },
      warningTrend: {
        direction: warningDirection,
        delta: warningDelta,
        summary: buildTrendSummaryLabel("Warning frequency", warningDirection, warningDelta, {
          preferLower: true,
          unit: "event"
        })
      },
      rules: {
        qualityOverTime: "Average prompt score per day across scored prompt events.",
        warningFrequency: "Count of prompt events per day that triggered one or more warnings.",
        categoryBreakdown: "Prompt category mix across the visible local history window."
      }
    };
  }

  function buildFutureSyncPayload(rawState, options = {}) {
    const state = coerceState(rawState);
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: Date.now(),
      cursor: clean(options.cursor) || null,
      promptEvents: state.promptEvents.map((event) => ({
        clientEventId: event.id,
        type: event.type,
        source: event.source,
        platform: event.platform,
        category: event.category,
        timestamp: event.timestamp,
        dayKey: event.dayKey,
        promptLength: event.promptLength,
        score: event.score,
        grade: event.grade,
        dependency: event.dependency,
        hasIndependentAttempt: event.hasIndependentAttempt,
        hasShortcutIntent: event.hasShortcutIntent,
        warningCount: event.warningCount,
        lintFailedCount: event.lintFailedCount,
        roleKey: event.roleKey,
        skillLevel: event.skillLevel
      }))
    };
  }

  function resolveStorageArea(storageArea) {
    if (storageArea && typeof storageArea.get === "function" && typeof storageArea.set === "function") {
      return storageArea;
    }
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    }
    return null;
  }

  function storageGet(storageArea, key) {
    return new Promise((resolve, reject) => {
      storageArea.get([key], (result) => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result ? result[key] : undefined);
      });
    });
  }

  function storageSet(storageArea, payload) {
    return new Promise((resolve, reject) => {
      storageArea.set(payload, () => {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  async function readState(storageArea) {
    const resolvedStorage = resolveStorageArea(storageArea);
    if (!resolvedStorage) {
      return createEmptyState();
    }
    const rawState = await storageGet(resolvedStorage, STORAGE_KEY);
    return coerceState(rawState);
  }

  async function writeState(storageArea, rawState) {
    const resolvedStorage = resolveStorageArea(storageArea);
    const nextState = coerceState(rawState);
    nextState.updatedAt = Date.now();
    if (!resolvedStorage) {
      return nextState;
    }
    await storageSet(resolvedStorage, { [STORAGE_KEY]: nextState });
    return nextState;
  }

  async function trackPromptEvent(storageArea, rawEvent) {
    const state = await readState(storageArea);
    const nextState = appendPromptEvent(state, rawEvent);
    return writeState(storageArea, nextState);
  }

  function getSnapshot(rawState) {
    return coerceState(rawState).summary;
  }

  const api = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    MAX_PROMPT_EVENTS,
    DEFAULT_TREND_WINDOW_DAYS,
    DEFAULT_CATEGORY,
    CATEGORY_LABELS,
    createEmptyState,
    normalizePromptEvent,
    summarizePromptEvents,
    coerceState,
    appendPromptEvent,
    buildDailySessionSummary,
    buildTrendDashboard,
    buildFutureSyncPayload,
    readState,
    writeState,
    trackPromptEvent,
    getSnapshot,
    getCategoryLabel,
    inferPromptCategory,
    makeCountMap
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachLearningAnalytics = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachLearningAnalytics = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
