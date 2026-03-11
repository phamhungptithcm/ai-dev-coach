# Monitoring and Metrics

The MVP focuses on local behavioral indicators rather than server analytics.

## Local Metrics

- `aiRequests`
- `manualAttempts`
- `largePastes`

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
