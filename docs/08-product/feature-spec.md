# Feature Specification

## 1. Developer Profile

Users can store:

- job role
- level (`Student`, `Junior`, `Middle`, `Senior`)
- habit goal

Job role options:

- Teacher
- Software Engineer
- Solution Architecture
- Manager
- Director
- Doctor
- Other

This profile personalizes coaching tips.

## 2. Prompt Builder

Templates are provided for:

- debugging
- code review
- system design
- refactoring
- performance optimization
- learning

Required fields:

- task
- context
- what user already tried

The extension generates a structured prompt and provides copy-to-clipboard.

In-page access:

- floating launcher beside composer on supported AI pages
- keyboard shortcut `Ctrl/Cmd + O` to open Prompt Builder when chat input is focused (browser-dependent)
- command shortcut `Ctrl/Cmd + Shift + O` to open Prompt Builder reliably

See also: [Prompt Builder System](prompt-builder-system.md)

## 3. Prompt Quality Analyzer

Analyzes each submitted prompt for:

- task clarity and vague-language detection
- context evidence completeness (error/failure + expected/actual + artifact)
- framework or stack context
- independent attempt quality (action + result + blocker)
- negative attempt phrases (for example, \"I didn't try\", \"chua thu\") as penalties
- shortcut intent signals

Outputs a shared quality score and targeted feedback across both popup prompt builder and live monitoring.

## 3.1 Prompt Linter

The extension also runs a lint-style ruleset to make feedback easier to scan before sending.

Initial lint rules:

- prompt too short
- missing technical context
- missing concrete error message for failure-oriented prompts
- possible sensitive data

Lint output:

- shows pass and fail states in popup prompt builder
- reuses the same rules in live monitoring
- only blocks normal prompting when a severe rule is triggered, such as sensitive data detection

Trigger behavior:

- run in draft mode while typing with 500ms debounce (live bubble updates)
- run immediately when user presses `Enter`
- run immediately when user clicks AI platform send/submit button

## 4. Habit and Dependency Coaching

Tracks local counters:

- AI requests
- manual attempts
- large code pastes
- long AI output copies
- fast copies (copied too soon after AI response)

Displays warning when dependency exceeds configured threshold.

Live bubble behavior:

- bubble stays visible on supported AI pages and auto-remounts if site UI rerenders
- bubble updates from both draft typing analysis and send-time analysis

## 4.1 Learning Analytics (V2 Foundation)

The first V2 analytics slice tracks prompt-session metadata locally.

Tracked prompt-event fields currently include:

- prompt source (`composer_submit`, `quick_builder`, send-only variants)
- platform
- timestamp
- prompt length
- prompt score and grade
- dependency percentage at send time
- independent-attempt flag
- shortcut-intent flag
- warning count
- lint failed count
- role and level metadata

Privacy defaults:

- analytics history is stored locally in `chrome.storage.local`
- prompt text is not stored in the analytics event log
- future backend sync is documented but not enabled yet

## 5. Sensitive Data Guardrail

Before a prompt is sent, the extension can scan for likely secrets such as:

- AWS access keys
- JWT tokens
- private keys
- database URLs
- API keys

If sensitive content is detected:

- the user gets a top-right warning before send
- the prompt can be redacted locally in the chat input
- the user is asked to review the prompt before sending again

All secret scanning and redaction runs locally in the browser extension.

## 6. Copy-Paste Risk Alerts

When large multi-line code pastes are detected, the user gets coaching prompts to review and test before using pasted code.

If a user copies long AI-generated output and pastes it back into a prompt composer, the extension warns them to rewrite with their own reasoning before sending.

The extension also tracks AI output timestamp and copy timestamp. If copy happens faster than configured minimum read time, it triggers a \"read first\" warning.

## 7. Settings and Controls

User can configure:

- enable/disable coaching
- enable/disable prompt listener
- enable/disable behavior monitor
- allow/disallow prompt content reading
- allow/disallow copied AI content reading
- strict mode
- dependency warning threshold
- large paste threshold
- long AI copy threshold
- minimum read time before copy
- enable/disable output countdown reminders
- overlay duration

Notification behavior:

- coaching toasts render in top-right
- default toast duration is longer than baseline and can be tuned in settings
