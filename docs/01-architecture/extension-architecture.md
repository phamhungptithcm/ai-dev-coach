# Extension Architecture

The project uses a no-build architecture so it can be loaded directly into Chrome as an unpacked extension.

## Manifest Strategy

- Manifest Version: MV3
- Background worker initializes defaults
- Content scripts are loaded in order on supported AI domains
- Popup and options pages manage user configuration

## Script Order

1. `content/aiOverlay.js`
2. `content/monitor.js`
3. `content/interactionTracker.js`

This order ensures the overlay runtime exists before coaching and paste warnings run.

## Reliability Considerations

- MutationObserver re-attaches listeners when AI UI nodes rerender
- prompt deduping prevents duplicate warnings on fast UI updates
- all settings are merged with defaults to avoid corrupt local state
