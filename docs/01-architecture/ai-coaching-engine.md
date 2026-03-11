# AI Coaching Engine

The coaching engine combines prompt analysis, habit heuristics, and dependency signals to generate feedback.

## Input Signals

- prompt length and structure
- evidence of independent attempt
- shortcut intent patterns (for example, asking for full copy-paste code)
- large code paste events
- user profile (role, skill level, habit goals)

## Decision Rules

- low-quality prompt => warning + context suggestion
- shortcut prompt => stricter warning in strict mode
- high dependency score => recommendation to run manual debugging first
- repeated large pastes => pattern-level alert

## Output

Coaching messages are displayed as short overlays with severity types:

- `info`
- `success`
- `warning`
