# Privacy Model

AI Dev Coach follows a local-first privacy model.

## Current Guarantees (MVP)

- no external API calls
- no remote storage of prompts or source code
- no telemetry export
- all analysis runs in browser content scripts
- monitoring is disabled until the user explicitly grants local consent
- enterprise admins can narrow supported hosts and lock monitoring settings through managed policy

## Stored Data

Only local extension data is saved:

- profile settings
- coaching settings
- local behavior counters
- effective settings derived from local preferences, consent state, and managed policy

## Security Notes

- minimum required Chrome permissions
- host access limited to supported AI chat domains
- optional enterprise host allowlists can reduce access further
- no dynamic code loading in runtime
- secret detection and redaction run locally before prompt submission
- no detected secret values are sent to external services by the extension
