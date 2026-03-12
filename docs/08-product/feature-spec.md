# Feature Specification

## 1. Developer Profile

Users can store:

- job role
- skill level
- habit goal

Job role options:

- Student
- Teacher
- Software Engineer
- Solution Architecture
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
- keyboard shortcut `Ctrl + O` to open Prompt Builder when chat input is focused

See also: [Prompt Builder System](prompt-builder-system.md)

## 3. Prompt Quality Analyzer

Analyzes each submitted prompt for:

- context evidence completeness (error/failure + expected/actual + artifact)
- independent attempt quality (action + result + blocker)
- negative attempt phrases (for example, \"I didn't try\", \"chua thu\") as penalties
- shortcut intent signals

Outputs a quality score and targeted feedback.

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

- bubble stays visible when monitoring is enabled (`prompt listener` or `behavior monitor`)
- bubble updates from both draft typing analysis and send-time analysis

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

Notification behavior:

- coaching toasts render in top-right
- default toast duration is longer than baseline and can be tuned in settings
