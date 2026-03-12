# Feature Specification

## 1. Developer Profile

Users can store:

- job role
- skill level
- habit goal

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

See also: [Prompt Builder System](prompt-builder-system.md)

## 3. Prompt Quality Analyzer

Analyzes each submitted prompt for:

- context completeness
- independent attempt evidence
- shortcut intent signals

Outputs a quality score and targeted feedback.

Trigger behavior:

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

## 5. Copy-Paste Risk Alerts

When large multi-line code pastes are detected, the user gets coaching prompts to review and test before using pasted code.

If a user copies long AI-generated output and pastes it back into a prompt composer, the extension warns them to rewrite with their own reasoning before sending.

The extension also tracks AI output timestamp and copy timestamp. If copy happens faster than configured minimum read time, it triggers a \"read first\" warning.

## 6. Settings and Controls

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
