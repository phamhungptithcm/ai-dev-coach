# AI Coaching Engine

The coaching engine combines prompt analysis, habit heuristics, and dependency signals to generate feedback.

## Input Signals

- prompt structure (`Task/Context/Attempt` style sections)
- context evidence (error/failure + expected/actual + artifact such as file path/snippet/log)
- attempt quality evidence (action + result + blocker)
- negative attempt phrases (`I didn't try`, `chua thu`, `khong thu`)
- shortcut intent patterns (for example, asking for full copy-paste code)
- large code paste events
- user profile (role, skill level, habit goals)
- bilingual phrase detection (English + Vietnamese)

## Prompt Analysis Modes

- Draft mode (pre-send): runs with 500ms debounce while user types and updates the live bubble only
- Submit mode: runs on send (`Enter`, form submit, send button click, quick-builder send), updates stats and triggers warnings

## Decision Rules

- missing context evidence => suggest concrete evidence gaps
- missing attempt quality => suggest adding action/result/blocker
- explicit no-attempt phrase => hard warning and score penalty
- shortcut prompt => stricter warning in strict mode
- high dependency score => recommendation to run manual debugging first
- repeated large pastes => pattern-level alert

## Output

Coaching messages are displayed as short overlays with severity types:

- `info`
- `success`
- `warning`

Overlays are shown in the top-right corner, and prompt/habit state is also reflected in the live coach bubble.
