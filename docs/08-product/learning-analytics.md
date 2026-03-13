# Learning Analytics

AI Dev Coach now includes the first V2 analytics foundation for prompt-session tracking.

This release is intentionally privacy-first:

- prompt events are stored locally in `chrome.storage.local`
- prompt text is not stored in analytics history
- only prompt metadata is kept for summaries and future trend views

## What is tracked

Each tracked event represents a submitted AI prompt.

Current event fields:

- `type`: `prompt_submitted`
- `source`: for example `composer_submit`, `composer_send_only`, `quick_builder`, `quick_builder_send_only`
- `platform`: ChatGPT, Claude, Gemini, Grok, DeepSeek, or `Unknown`
- `timestamp`
- `promptLength`
- `score`
- `grade`
- `dependency`
- `hasIndependentAttempt`
- `hasShortcutIntent`
- `warningCount`
- `lintFailedCount`
- `roleKey`
- `skillLevel`

## Local summary

The popup now reads the local analytics store and shows a compact snapshot:

- tracked prompts
- average prompt score
- average prompt length
- last platform used
- top source / top platform

This is the first step toward daily summaries and trend views in later V2 stories.

## Storage model

The local analytics state is stored under the `learningAnalytics` key.

```json
{
  "version": 1,
  "promptEvents": [],
  "summary": {
    "totalPrompts": 0,
    "scoredPrompts": 0,
    "averageScore": null,
    "averagePromptLength": null,
    "lastPromptAt": 0,
    "lastPlatform": "",
    "platformCounts": {},
    "sourceCounts": {},
    "dayCounts": {}
  },
  "updatedAt": 0
}
```

The extension keeps only the latest bounded event history locally to avoid unbounded storage growth.

## Future sync contract

Backend sync is not enabled yet, but the shared analytics module already exposes a payload contract for future rollout.

Example payload:

```json
{
  "schemaVersion": 1,
  "exportedAt": 1760000000000,
  "cursor": null,
  "promptEvents": [
    {
      "clientEventId": "prompt_1760000000000_ab12cd",
      "type": "prompt_submitted",
      "source": "composer_submit",
      "platform": "ChatGPT",
      "timestamp": 1760000000000,
      "dayKey": "2026-03-13",
      "promptLength": 312,
      "score": 82,
      "grade": "B",
      "dependency": 63,
      "hasIndependentAttempt": true,
      "hasShortcutIntent": false,
      "warningCount": 1,
      "lintFailedCount": 0,
      "roleKey": "software_engineer",
      "skillLevel": "Senior"
    }
  ]
}
```

Planned V2 rollout:

1. local prompt-session tracking
2. daily session summaries
3. trend charts
4. optional backend sync

## Privacy boundary

Analytics does not store:

- full prompt body
- copied AI output body
- secrets or redacted values

This keeps the analytics foundation useful for learning insights without introducing unnecessary content retention.
