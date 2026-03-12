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

## Prompt Scoring Algorithm

The extension computes a score from 0 to 100 with these weighted dimensions:

1. Completeness (0-40)
- task quality and length
- context quality and length
- attempt details and blockers
- profile context (role + skill)

2. Specificity (0-25)
- technical signals (error/trace/file/metric keywords)
- constraints provided
- acceptance criteria quality
- overall prompt depth

3. Reasoning Evidence (0-20)
- hypothesis/debug/test/analysis language
- tradeoff and validation framing

4. Learning Safety (0-15)
- penalty for shortcut language ("give full code", "just answer")
- bonus for coach-style language ("explain", "step-by-step")

5. Template Fit (0-5)
- checks if content vocabulary matches selected template intent

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
| - Completeness: 33/40                             |
| - Specificity: 20/25                              |
| - Reasoning Evidence: 16/20                       |
| - Learning Safety: 11/15                          |
| - Template Fit: 4/5                               |
| Tips: Add benchmark and acceptance criteria        |
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

## Current Implementation Files

- `extension/popup/popup.html`
- `extension/popup/popup.css`
- `extension/popup/popup.js`
- `extension/content/liveCoachBubble.js`
- `extension/content/quickBuilder.js`
- `extension/content/monitor.js`
