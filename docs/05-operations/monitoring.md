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

## Prompt Monitoring Modes

- `draft` analysis: runs on input debounce (500ms) for realtime score preview
- `submit` analysis: runs on send and updates counters

Draft analysis updates the live bubble but does not increment send-based counters.

## Product Quality Signals

- warning precision (low false positives)
- prompt quality score trend
- dependency score trend over time

## Operational Risks

- AI platform DOM changes can break input detection
- aggressive warning thresholds can cause alert fatigue

## Mitigation

- keep selectors configurable by release
- maintain conservative defaults
- provide strict mode as opt-in behavior tuning
- use evidence-based scoring rules to avoid over-rewarding long but vague prompts
- include bilingual hint dictionaries (EN + VI) for multilingual user input
