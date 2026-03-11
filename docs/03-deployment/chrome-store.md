# Chrome Deployment

## Local Developer Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repository `extension/` folder.

## Chrome Web Store Release Checklist

1. Update `extension/manifest.json` version.
2. Verify extension behavior on all supported AI platforms.
3. Confirm privacy statement matches runtime behavior.
4. Zip `extension/` for submission.
5. Submit through the Chrome Web Store Developer Dashboard.

## Post-Release Tasks

- monitor user feedback for false-positive warnings
- tune thresholds in options defaults
- document known platform-specific input selector changes
