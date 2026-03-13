# Monitoring and Metrics

The MVP focuses on local behavioral indicators rather than server analytics.

## Local Metrics

- `aiRequests`
- `manualAttempts`
- `largePastes`
- `aiCopies`
- `fastAiCopies`
- `badPrompts`
- `shortcutPrompts`

## Local Prompt Event Tracking

The V2 analytics foundation now stores prompt-session metadata locally under the `learningAnalytics` storage key.

It tracks:

- prompt source
- AI platform
- prompt category
- timestamp
- prompt length
- prompt score / grade
- dependency percentage
- warning count
- lint failed count

The event log does not store full prompt bodies. This keeps analytics useful for learning trends while preserving a conservative privacy boundary.

## Daily session summary

The popup derives a local daily session summary from the tracked prompt events.

Current summary fields include:

- total prompts for the selected day
- average quality score
- average prompt length
- prompt category mix
- independent-attempt rate
- shortcut and lint-issue counts
- up to three improvement suggestions

## Trend dashboard rules

The analytics popup also exposes a recent-window trend dashboard.

Current rules:

- quality trend = daily average of scored prompt events
- warning trend = daily count of prompt events with `warningCount > 0`
- category trend = prompt-category mix across the selected local window

These rules are derived in shared analytics code so popup visuals and future analytics surfaces stay consistent.

## Prompt Monitoring Modes

- `draft` analysis: runs on input debounce (500ms) for realtime score preview
- `submit` analysis: runs on send and updates counters

Draft analysis updates the live bubble but does not increment send-based counters.

## Product Quality Signals

- warning precision (low false positives)
- prompt quality score trend
- dependency score trend over time
- average prompt length trend
- platform/source usage mix

## Operational Risks

- AI platform DOM changes can break input detection
- aggressive warning thresholds can cause alert fatigue

## Mitigation

- keep selectors configurable by release
- maintain conservative defaults
- provide strict mode as opt-in behavior tuning
- use evidence-based scoring rules to avoid over-rewarding long but vague prompts
- include bilingual hint dictionaries (EN + VI) for multilingual user input
