# Learning Analytics

AI Dev Coach now includes the first V2 analytics foundation for prompt-session tracking and daily session summaries.

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
- `category`: Debugging, Code Review, System Design, Refactoring, Performance, Learning, or `Unclassified`
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

## Daily session summary

The popup now also builds a local daily session summary from tracked prompt events.

Each daily summary includes:

- total prompts for the day
- average quality score
- prompt category breakdown
- independent-attempt rate
- key improvement suggestions in friendly language

Daily suggestions now also respect the most recent tracked role and level metadata so a manager, teacher, student, or software engineer does not get the same generic follow-up advice.

This keeps the analytics useful for day-to-day reflection before the later trend-chart stories arrive.

## Trend dashboard

The popup now includes a lightweight local trend dashboard for the recent activity window.

Current trend views:

- quality over time: daily average prompt score
- warning frequency trend: number of prompt events per day that triggered warnings
- prompt type breakdown: category mix across the visible window

Trend rules stay explicit and local-first:

- quality trend uses the average score of scored prompt events for each day
- warning trend counts prompt events that emitted one or more warnings
- category bars group events into Debugging, Code Review, System Design, Refactoring, Performance, Learning, or Unclassified

The first release keeps the dashboard lightweight and fully local in the popup.

## Role-based coaching

Role-based coaching is now shared across popup scoring, quick-builder hints, live monitoring, and analytics summaries.

Current behavior:

- builder hints and examples change by role
- low-quality prompt warnings include role-aware advice
- daily summary suggestions can include role-aware habit tips from the latest tracked role/level
- student and junior levels bias the coaching toward explanation-first and exercise-oriented learning

## Storage model

The local analytics state is stored under the `learningAnalytics` key.

```json
{
  "version": 2,
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
    "categoryCounts": {},
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
  "schemaVersion": 2,
  "exportedAt": 1760000000000,
  "cursor": null,
  "promptEvents": [
    {
      "clientEventId": "prompt_1760000000000_ab12cd",
      "type": "prompt_submitted",
      "source": "composer_submit",
      "platform": "ChatGPT",
      "category": "debugging",
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
