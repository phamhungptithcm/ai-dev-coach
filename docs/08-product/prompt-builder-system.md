# Prompt Builder System

## Supported Templates (6)

1. Debugging Prompt
2. Code Review Prompt
3. System Design Prompt
4. Refactoring Prompt
5. Performance Optimization Prompt
6. Learning Prompt

Each template uses the same required fields:

- task
- context
- what you tried

Optional fields:

- constraints
- acceptance criteria

Role modes available in Prompt Builder:

- Teacher
- Software Engineer
- Solution Architecture
- Manager
- Director
- Doctor
- Other

Level modes:

- Student
- Junior
- Middle
- Senior

Role coaching is now driven by a shared module so the popup builder, in-page quick builder, and live monitor stay aligned.

Current role-aware behavior includes:

- shared recommended template selection by role and level
- role-specific context and attempt hints
- role-specific example asks shown in the popup and quick builder
- role-specific warning copy during prompt scoring and send-time coaching
- software engineer specialization hints for frontend, backend, DevOps, and fullstack wording

Examples:

- Teacher: learner level, objective, misconception, assessment
- Software Engineer: failing command, file path, exact error, expected vs actual
- Solution Architecture: scale assumptions, NFRs, tradeoffs, rollout risk
- Manager: business impact, timeline, capacity, blockers, decision needed
- Director: KPI targets, dependencies, budget or portfolio constraints
- Doctor: symptoms timeline, history, red flags, tests already available, education-only guardrails

## Prompt Scoring Algorithm

The extension computes a score from 0 to 100 with these weighted dimensions:

1. Clarity (0-25)
- prompt length and task clarity
- structured sections (`Task`, `Context`, `What You Tried`)
- penalty for vague asks such as `fix this` or `help me`

2. Context (0-30)
- concrete error or failure signals
- expected vs actual behavior
- artifacts such as file paths, snippets, logs, endpoints, or stack traces
- framework or stack context

3. Specificity (0-30)
- action + result + blocker evidence
- constraints provided
- acceptance criteria quality
- measurable or role-specific signals

4. Risk Guardrails (0-15)
- penalties for shortcut language (`give me full code`, `no explanation`)
- penalties for explicit no-attempt phrases
- stricter deductions in strict mode
- small bonus for coaching-oriented language (`explain`, `step-by-step`)

Grade mapping:

- A: 90-100
- B: 75-89
- C: 60-74
- D: 0-59

## Extension UI Wireframe

```text
+---------------------------------------------------+
| AI Dev Coach                                      |
| Build better AI habits                            |
+---------------------------------------------------+
| Developer Profile                                 |
| Role: [____________________________]              |
| Level: [ Student v ]                              |
| Habit Goal: [_______________________]             |
| [ Save Profile ]                                  |
+---------------------------------------------------+
| Prompt Builder                                    |
| Template: [ Debugging v ]                         |
| Hint: Diagnose runtime errors...                  |
|                                                   |
| Task (Required)                                   |
| [______________________________________________]  |
| Context (Required)                                |
| [______________________________________________]  |
| What You Tried (Required)                         |
| [______________________________________________]  |
| Constraints (Optional)                            |
| [______________________________________________]  |
| Acceptance Criteria (Optional)                    |
| [______________________________________________]  |
| Required info: [x] Task [x] Context [ ] Tried     |
|                                                   |
| [ Generate Prompt ]  [ Copy Prompt ]              |
|                                                   |
| Generated Prompt                                  |
| [______________________________________________]  |
| [______________________________________________]  |
|                                                   |
| Prompt Score: 84/100   Grade: B                   |
| - Clarity: 21/25                                  |
| - Context: 24/30                                  |
| - Specificity: 25/30                              |
| - Risk Guardrails: 14/15                          |
| Tips: Add framework version and one regression test|
| Prompt Lint: 1 warning | 3 passed                 |
| - ⚠ Missing technical context                     |
| - ✓ No sensitive data detected                    |
+---------------------------------------------------+
| Habit Snapshot                                    |
| AI requests | Manual attempts | Dependency | Paste |
| [ Log Manual Attempt ] [ Open Settings ]          |
+---------------------------------------------------+
```

## Data Stored in Chrome Local Storage

- `selectedTemplate`
- `lastGeneratedPrompt`
- `lastPromptAnalysis`
- `profile`
- `stats`

## In-Page Quick Builder (Chat Window)

- The extension injects a floating `Prompt Builder` button beside the active AI chat composer.
- Press `Ctrl/Cmd + O` while focused in the chat composer to open the Prompt Builder instantly (browser-dependent).
- Use command shortcut `Ctrl/Cmd + Shift + O` for consistent opening across browsers.
- Clicking the button opens a compact form with the same template + required fields as popup builder.
- Role selector in the in-page builder adjusts guidance and prompt framing per job role.
- `Build + Insert` writes the generated prompt into the chat input.
- `Build + Send` writes the prompt and triggers send automatically.
- generated prompts now use cleaner document-style sections (`PROFILE`, `TASK`, `CONTEXT`, `WHAT I TRIED`, `CONSTRAINTS`, `ACCEPTANCE CRITERIA`, `HOW TO RESPOND`) for easier reading and copy/paste
- Works on ChatGPT, Claude, Gemini, Grok, and DeepSeek pages.

## Live Coaching Bubble (Realtime)

- A floating bubble shows realtime `Prompt Score`, grade, and send-time coaching summary.
- While user types in composer, draft scoring updates bubble in near realtime (500ms debounce).
- Bubble is kept mounted and auto-restored if the AI page rerenders or route changes.
- Habit snapshot in bubble updates immediately with AI requests, manual attempts, dependency, bad prompts, shortcut prompts, and copy/paste behavior.
- Bubble is driven by send-event listeners (`Enter`, submit, send-button click) and runtime analysis events.

## Runtime Prompt Detection Rules (Monitoring Engine)

- Context is scored from evidence, not length:
  - failure/error signal
  - expected vs actual signal
  - artifact signal (file/line/snippet/log/endpoint)
- Attempt quality is scored from:
  - action user took
  - result observed
  - blocker described
- Negative no-attempt phrases reduce score.
- Shortcut requests (copy-paste intent) reduce score and increase warnings.
- Dictionaries support English and Vietnamese phrasing.
- Popup scoring and live monitoring now use the same shared prompt-quality engine to keep results consistent.
- Popup also shows prompt lint results with pass/fail output for short prompts, missing technical context, missing failure signals, and sensitive data.

## Current Implementation Files

- `extension/popup/popup.html`
- `extension/popup/popup.css`
- `extension/popup/popup.js`
- `extension/content/liveCoachBubble.js`
- `extension/content/quickBuilder.js`
- `extension/content/monitor.js`
- `extension/shared/roleCoaching.js`
- `extension/shared/promptQualityEngine.js`
- `extension/shared/promptLinter.js`
