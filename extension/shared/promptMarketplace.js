(() => {
  const STORAGE_KEY = "promptMarketplace";
  const SCHEMA_VERSION = 1;
  const DEFAULT_CATEGORY = "all";
  const DEFAULT_TREND_LIMIT = 6;
  const CATEGORY_ORDER = [
    "developer",
    "learning",
    "writing",
    "productivity",
    "image_generation",
    "business",
    "daily_life"
  ];
  const CATEGORY_LABELS = {
    all: "All prompts",
    developer: "Developer",
    learning: "Learning",
    writing: "Writing",
    productivity: "Productivity",
    image_generation: "Image Generation",
    business: "Business",
    daily_life: "Daily Life"
  };

  let libraryCache = null;
  let libraryCacheKey = "";

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function slugify(value) {
    return clean(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "prompt";
  }

  function normalizeCategory(value) {
    const normalized = clean(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (normalized === "image_generation" || normalized === "image") {
      return "image_generation";
    }
    if (normalized === "daily_life" || normalized === "life") {
      return "daily_life";
    }

    return CATEGORY_LABELS[normalized] ? normalized : DEFAULT_CATEGORY;
  }

  function getCategoryLabel(categoryKey) {
    return CATEGORY_LABELS[normalizeCategory(categoryKey)] || CATEGORY_LABELS[DEFAULT_CATEGORY];
  }

  function normalizePromptText(value) {
    return clean(value)
      .replace(/\s+/g, " ")
      .replace(/[.?!]+$/g, "")
      .toLowerCase();
  }

  function buildTitle(promptText) {
    const normalized = clean(promptText).replace(/[.?!]+$/g, "");
    if (normalized.length <= 72) {
      return normalized;
    }
    return `${normalized.slice(0, 69).trimEnd()}...`;
  }

  function splitKeywords(promptText, categoryKey) {
    const parts = `${categoryKey} ${promptText}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3);

    return Array.from(new Set(parts)).slice(0, 16);
  }

  function getPromptSourceMarkdown() {
    if (
      typeof globalThis !== "undefined" &&
      globalThis.AIDevCoachPromptLibrarySource &&
      typeof globalThis.AIDevCoachPromptLibrarySource.markdown === "string"
    ) {
      return globalThis.AIDevCoachPromptLibrarySource.markdown;
    }

    if (typeof require === "function") {
      try {
        const source = require("./promptLibrarySource.js");
        if (source && typeof source.markdown === "string") {
          return source.markdown;
        }
      } catch (error) {
        return "";
      }
    }

    return "";
  }

  function parsePromptLibraryMarkdown(markdown) {
    const source = typeof markdown === "string" ? markdown : "";
    const lines = source.split(/\r?\n/);
    const prompts = [];
    const categories = [];
    const categoryCounts = {};
    const dedupeMap = new Map();
    const categorySeen = new Set();
    let currentCategoryKey = DEFAULT_CATEGORY;
    let currentCategoryLabel = getCategoryLabel(DEFAULT_CATEGORY);
    let rawPromptCount = 0;

    lines.forEach((line) => {
      const categoryMatch = line.match(/^##\s+(.+)$/);
      if (categoryMatch) {
        currentCategoryKey = normalizeCategory(categoryMatch[1]);
        currentCategoryLabel = getCategoryLabel(currentCategoryKey);
        if (!categorySeen.has(currentCategoryKey)) {
          categorySeen.add(currentCategoryKey);
          categories.push({
            key: currentCategoryKey,
            label: currentCategoryLabel,
            rawCount: 0,
            promptCount: 0
          });
        }
        return;
      }

      const promptMatch = line.match(/^\s*(\d+)\.\s+(.+?)\s*$/);
      if (!promptMatch || currentCategoryKey === DEFAULT_CATEGORY) {
        return;
      }

      const rawNumber = Number(promptMatch[1]);
      const promptText = clean(promptMatch[2]);
      if (!promptText) {
        return;
      }

      rawPromptCount += 1;
      const dedupeKey = `${currentCategoryKey}::${normalizePromptText(promptText)}`;
      const categoryEntry = categories.find((entry) => entry.key === currentCategoryKey);
      if (categoryEntry) {
        categoryEntry.rawCount += 1;
      }

      if (dedupeMap.has(dedupeKey)) {
        const existing = dedupeMap.get(dedupeKey);
        existing.duplicateCount += 1;
        existing.sourceNumbers.push(rawNumber);
        return;
      }

      const prompt = {
        id: `${currentCategoryKey}-${String(prompts.length + 1).padStart(3, "0")}-${slugify(promptText)}`,
        title: buildTitle(promptText),
        text: promptText,
        categoryKey: currentCategoryKey,
        categoryLabel: currentCategoryLabel,
        duplicateCount: 1,
        sourceNumbers: [rawNumber],
        keywords: splitKeywords(promptText, currentCategoryKey)
      };

      prompts.push(prompt);
      dedupeMap.set(dedupeKey, prompt);
      categoryCounts[currentCategoryKey] = (categoryCounts[currentCategoryKey] || 0) + 1;
      if (categoryEntry) {
        categoryEntry.promptCount += 1;
      }
    });

    const sortedCategories = categories.sort((left, right) => {
      const leftIndex = CATEGORY_ORDER.indexOf(left.key);
      const rightIndex = CATEGORY_ORDER.indexOf(right.key);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });

    return {
      prompts,
      categories: [
        {
          key: DEFAULT_CATEGORY,
          label: CATEGORY_LABELS[DEFAULT_CATEGORY],
          rawCount: rawPromptCount,
          promptCount: prompts.length
        },
        ...sortedCategories
      ],
      summary: {
        rawPromptCount,
        promptCount: prompts.length,
        duplicatePromptCount: Math.max(0, rawPromptCount - prompts.length),
        categoryCounts
      }
    };
  }

  function buildLibrary(markdown) {
    const parsed = parsePromptLibraryMarkdown(markdown);
    return {
      ...parsed,
      generatedAt: Date.now()
    };
  }

  function getPromptLibrary(markdown) {
    const resolvedMarkdown = typeof markdown === "string" ? markdown : getPromptSourceMarkdown();
    const cacheKey = `${resolvedMarkdown.length}:${resolvedMarkdown.slice(0, 64)}`;
    if (libraryCache && libraryCacheKey === cacheKey) {
      return libraryCache;
    }
    libraryCache = buildLibrary(resolvedMarkdown);
    libraryCacheKey = cacheKey;
    return libraryCache;
  }

  function scorePromptMatch(prompt, queryTokens) {
    if (!Array.isArray(queryTokens) || queryTokens.length === 0) {
      return 0;
    }

    const haystack = `${prompt.title} ${prompt.text} ${prompt.categoryLabel} ${prompt.keywords.join(" ")}`.toLowerCase();
    return queryTokens.reduce((score, token) => {
      if (prompt.title.toLowerCase().includes(token)) {
        return score + 6;
      }
      if (prompt.text.toLowerCase().includes(token)) {
        return score + 4;
      }
      if (prompt.keywords.some((keyword) => keyword.includes(token))) {
        return score + 2;
      }
      return score;
    }, 0);
  }

  function filterPrompts(library, options = {}) {
    const resolvedLibrary = library && Array.isArray(library.prompts) ? library : getPromptLibrary();
    const query = clean(options.query).toLowerCase();
    const queryTokens = query.split(/\s+/).filter(Boolean);
    const categoryKey = normalizeCategory(options.categoryKey || DEFAULT_CATEGORY);

    const matches = resolvedLibrary.prompts
      .filter((prompt) => categoryKey === DEFAULT_CATEGORY || prompt.categoryKey === categoryKey)
      .map((prompt) => ({ prompt, score: scorePromptMatch(prompt, queryTokens) }))
      .filter((entry) => queryTokens.length === 0 || entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (right.prompt.duplicateCount !== left.prompt.duplicateCount) {
          return right.prompt.duplicateCount - left.prompt.duplicateCount;
        }
        return left.prompt.title.localeCompare(right.prompt.title);
      })
      .map((entry) => entry.prompt);

    return {
      query,
      categoryKey,
      results: matches,
      total: matches.length
    };
  }

  function createEmptyState() {
    return {
      version: SCHEMA_VERSION,
      library: {
        promptCount: 0,
        rawPromptCount: 0,
        duplicatePromptCount: 0,
        categoryCounts: {}
      },
      usage: {},
      updatedAt: 0
    };
  }

  function normalizeUsageEntry(promptId, rawEntry = {}) {
    const safePromptId = clean(promptId);
    if (!safePromptId) {
      return null;
    }

    return {
      promptId: safePromptId,
      totalUses: Number.isFinite(rawEntry.totalUses) ? Math.max(0, Math.round(rawEntry.totalUses)) : 0,
      copyUses: Number.isFinite(rawEntry.copyUses) ? Math.max(0, Math.round(rawEntry.copyUses)) : 0,
      insertUses: Number.isFinite(rawEntry.insertUses) ? Math.max(0, Math.round(rawEntry.insertUses)) : 0,
      sendUses: Number.isFinite(rawEntry.sendUses) ? Math.max(0, Math.round(rawEntry.sendUses)) : 0,
      lastUsedAt: Number.isFinite(rawEntry.lastUsedAt) ? Math.max(0, Math.round(rawEntry.lastUsedAt)) : 0,
      categoryKey: normalizeCategory(rawEntry.categoryKey)
    };
  }

  function coerceState(rawState) {
    const state = createEmptyState();
    if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
      return state;
    }

    state.library = {
      promptCount: Number.isFinite(rawState.library?.promptCount) ? Math.max(0, Math.round(rawState.library.promptCount)) : 0,
      rawPromptCount: Number.isFinite(rawState.library?.rawPromptCount) ? Math.max(0, Math.round(rawState.library.rawPromptCount)) : 0,
      duplicatePromptCount: Number.isFinite(rawState.library?.duplicatePromptCount)
        ? Math.max(0, Math.round(rawState.library.duplicatePromptCount))
        : 0,
      categoryCounts: rawState.library && typeof rawState.library.categoryCounts === "object" && !Array.isArray(rawState.library.categoryCounts)
        ? { ...rawState.library.categoryCounts }
        : {}
    };
    state.updatedAt = Number.isFinite(rawState.updatedAt) ? Math.max(0, Math.round(rawState.updatedAt)) : 0;

    if (rawState.usage && typeof rawState.usage === "object" && !Array.isArray(rawState.usage)) {
      Object.entries(rawState.usage).forEach(([promptId, entry]) => {
        const normalized = normalizeUsageEntry(promptId, entry);
        if (normalized) {
          state.usage[promptId] = normalized;
        }
      });
    }

    return state;
  }

  function resolveStorageArea(storageArea) {
    if (!storageArea) {
      return null;
    }
    if (storageArea.storage && storageArea.storage.local) {
      return storageArea.storage.local;
    }
    return storageArea;
  }

  function storageGet(storageArea, key) {
    return new Promise((resolve) => {
      storageArea.get([key], (result) => resolve(result[key]));
    });
  }

  function storageSet(storageArea, payload) {
    return new Promise((resolve) => {
      storageArea.set(payload, resolve);
    });
  }

  async function readState(storageArea) {
    const resolvedStorage = resolveStorageArea(storageArea);
    if (!resolvedStorage) {
      return createEmptyState();
    }
    const raw = await storageGet(resolvedStorage, STORAGE_KEY);
    return coerceState(raw);
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

  async function syncLibraryCache(storageArea, libraryInput) {
    const library = libraryInput && Array.isArray(libraryInput.prompts) ? libraryInput : getPromptLibrary();
    const state = await readState(storageArea);
    state.library = {
      promptCount: library.summary.promptCount,
      rawPromptCount: library.summary.rawPromptCount,
      duplicatePromptCount: library.summary.duplicatePromptCount,
      categoryCounts: { ...library.summary.categoryCounts }
    };
    return writeState(storageArea, state);
  }

  async function recordPromptUsage(storageArea, payload = {}) {
    const promptId = clean(payload.promptId);
    if (!promptId) {
      return readState(storageArea);
    }

    const action = clean(payload.action).toLowerCase();
    const categoryKey = normalizeCategory(payload.categoryKey);
    const timestamp = Number.isFinite(payload.timestamp) ? Math.round(payload.timestamp) : Date.now();
    const state = await readState(storageArea);
    const current = normalizeUsageEntry(promptId, state.usage[promptId] || {}) || normalizeUsageEntry(promptId, {});

    current.totalUses += 1;
    if (action === "copy") {
      current.copyUses += 1;
    } else if (action === "insert") {
      current.insertUses += 1;
    } else if (action === "send") {
      current.sendUses += 1;
    }
    current.lastUsedAt = timestamp;
    current.categoryKey = categoryKey;
    state.usage[promptId] = current;

    return writeState(storageArea, state);
  }

  function buildUsageLookup(rawState) {
    return coerceState(rawState).usage;
  }

  function getTrendingPrompts(libraryInput, rawState, options = {}) {
    const library = libraryInput && Array.isArray(libraryInput.prompts) ? libraryInput : getPromptLibrary();
    const usageLookup = buildUsageLookup(rawState);
    const limit = Number.isFinite(options.limit) ? Math.max(1, Math.round(options.limit)) : DEFAULT_TREND_LIMIT;

    return library.prompts
      .map((prompt) => {
        const usage = usageLookup[prompt.id] || normalizeUsageEntry(prompt.id, {});
        const freshnessBoost = usage.lastUsedAt > 0 ? Math.max(0, 14 - Math.floor((Date.now() - usage.lastUsedAt) / 86400000)) : 0;
        const trendScore =
          usage.totalUses * 10 +
          usage.sendUses * 8 +
          usage.insertUses * 5 +
          usage.copyUses * 3 +
          freshnessBoost +
          Math.min(4, prompt.duplicateCount - 1);

        return {
          ...prompt,
          trendScore,
          usage
        };
      })
      .sort((left, right) => {
        if (right.trendScore !== left.trendScore) {
          return right.trendScore - left.trendScore;
        }
        return left.title.localeCompare(right.title);
      })
      .slice(0, limit);
  }

  function getLibrarySnapshot(libraryInput, rawState) {
    const library = libraryInput && Array.isArray(libraryInput.prompts) ? libraryInput : getPromptLibrary();
    const state = coerceState(rawState);
    return {
      promptCount: library.summary.promptCount,
      rawPromptCount: library.summary.rawPromptCount,
      duplicatePromptCount: library.summary.duplicatePromptCount,
      categoryCounts: library.summary.categoryCounts,
      usageCount: Object.keys(state.usage).length
    };
  }

  const api = {
    STORAGE_KEY,
    SCHEMA_VERSION,
    DEFAULT_CATEGORY,
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    getCategoryLabel,
    parsePromptLibraryMarkdown,
    getPromptLibrary,
    filterPrompts,
    createEmptyState,
    coerceState,
    readState,
    writeState,
    syncLibraryCache,
    recordPromptUsage,
    getTrendingPrompts,
    getLibrarySnapshot
  };

  if (typeof window !== "undefined") {
    window.AIDevCoachPromptMarketplace = api;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.AIDevCoachPromptMarketplace = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
