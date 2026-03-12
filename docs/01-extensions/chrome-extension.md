# Chrome Extension

The Chrome extension is the current production implementation of AI Dev Coach.

## Core Capabilities

- prompt quality coaching on AI chat pages
- in-page Quick Prompt Builder button beside AI chat composer
- keyboard shortcut `F1` to open Prompt Builder when composer is focused
- live coach bubble with realtime prompt score and habit snapshot
- top-right coaching toasts with longer visibility
- copy/paste behavior warnings
- dependency tracking (AI requests vs manual attempts)
- prompt builder with 6 templates
- bilingual prompt analysis hints (English + Vietnamese)

## Supported Sites

- chat.openai.com / chatgpt.com
- claude.ai
- gemini.google.com
- grok.com
- chat.deepseek.com

## Local Run

1. Open `chrome://extensions`
2. Enable Developer mode
3. Load unpacked extension from `extension/`
