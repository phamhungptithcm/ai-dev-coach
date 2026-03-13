(() => {
  const STORAGE_KEY = "learningAnalytics";
  const SCHEMA_VERSION = 1;
  const MAX_PROMPT_EVENTS = 250;
  const DEFAULT_PLATFORM = "Unknown";
  const DEFAULT_SOURCE = "composer_submit";

  function clean(value) {
    return typeof value === "string" ? value.trim() : "";
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

  function makeCountMap(rawMap) {
    if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
      return {};
    }

    return Object.entries(rawMap).reduce((accumulator, [key, value]) => {
      const normalizedKey = clean(key);
      const normalizedValue = asNonNegativeInteger(Number(value));
      if (!normalizedKey || normalizedValue === null || normalizedValue === 0) {
        return accumulator;
      }
      accumulator[normalizedKey] = normalizedValue;
      return accumulator;
    }, {});
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
        dayCounts: {}
      },
      updatedAt: 0
    };
  }

  function normalizePromptEvent(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const timestamp = normalizeTimestamp(input.timestamp || input.at);
    const derivedPromptLength =
      Number.isFinite(input.promptLength)
        ? input.promptLength
        : typeof input.prompt === "string"
          ? input.prompt.length
          : null;

    return {
      id: clean(input.id) || `prompt_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type: "prompt_submitted",
      source: clean(input.source) || DEFAULT_SOURCE,
      platform: clean(input.platform) || DEFAULT_PLATFORM,
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
    const dayCounts = {};
    let scoreTotal = 0;
    let scoredPrompts = 0;
    let promptLengthTotal = 0;
    let promptLengthCount = 0;
    let latestEvent = null;

    events.forEach((event) => {
      const platform = clean(event.platform) || DEFAULT_PLATFORM;
      const source = clean(event.source) || DEFAULT_SOURCE;
      const dayKey = clean(event.dayKey) || buildDayKey(normalizeTimestamp(event.timestamp));

      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;

      if (Number.isFinite(event.score)) {
        scoreTotal += event.score;
        scoredPrompts += 1;
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
      platformCounts,
      sourceCounts,
      dayCounts
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
    createEmptyState,
    normalizePromptEvent,
    summarizePromptEvents,
    coerceState,
    appendPromptEvent,
    buildFutureSyncPayload,
    readState,
    writeState,
    trackPromptEvent,
    getSnapshot,
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
