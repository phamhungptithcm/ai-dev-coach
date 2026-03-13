# Privacy Model

AI Dev Coach follows a local-first privacy model.

## Current Guarantees (MVP)

- no external API calls
- no remote storage of prompts or source code
- no telemetry export
- all analysis runs in browser content scripts

## Stored Data

Only local extension data is saved:

- profile settings
- coaching settings
- local behavior counters

## Security Notes

- minimum required Chrome permissions
- host access limited to supported AI chat domains
- no dynamic code loading in runtime
- secret detection and redaction run locally before prompt submission
- no detected secret values are sent to external services by the extension
