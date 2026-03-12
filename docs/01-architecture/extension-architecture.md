# Extension Architecture

The project uses a no-build architecture so it can be loaded directly into Chrome as an unpacked extension.

## Manifest Strategy

- Manifest Version: MV3
- Background worker initializes defaults
- Content scripts are loaded in order on supported AI domains
- Popup and options pages manage user configuration

## Script Order

1. `content/aiOverlay.js`
2. `content/liveCoachBubble.js`
3. `content/quickBuilder.js`
4. `content/monitor.js`
5. `content/interactionTracker.js`

This order ensures toast runtime exists first, UI surfaces are injected, then prompt and behavior monitors run.

## Main Runtime Components

- `content/quickBuilder.js`: in-page Prompt Builder launcher + panel, `Build + Insert`, `Build + Send`, keyboard shortcut (`F1`) when focused in chat composer
- `content/monitor.js`: prompt capture, send detection, realtime scoring, bad-prompt detection, dependency metrics
- `content/liveCoachBubble.js`: floating realtime HUD for prompt score + habit snapshot, draggable and persisted
- `content/interactionTracker.js`: copy/paste monitoring, fast-copy detection, large-paste warnings
- `content/aiOverlay.js`: toast rendering layer (top-right notifications)

## Reliability Considerations

- MutationObserver re-attaches listeners when AI UI nodes rerender
- prompt deduping prevents duplicate warnings on fast UI updates
- prompt snapshot is captured before send clears the composer
- live draft scoring runs on debounced input updates without inflating send counters
- all settings are merged with defaults to avoid corrupt local state
