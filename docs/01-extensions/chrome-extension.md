# Chrome Extension

The Chrome extension is the current production implementation of AI Dev Coach.

## Core Capabilities

- prompt quality coaching on AI chat pages
- in-page Quick Prompt Builder button beside AI chat composer
- keyboard shortcut `Ctrl/Cmd + O` to open Prompt Builder when composer is focused (browser-dependent)
- reliable command shortcut `Ctrl/Cmd + Shift + O` for opening Prompt Builder
- live coach bubble with realtime prompt score and habit snapshot
- top-right coaching toasts with longer visibility
- copy/paste behavior warnings
- dependency tracking (AI requests vs manual attempts)
- prompt builder with 6 templates
- role-aware prompting modes (Teacher, Software Engineer, Solution Architecture, Manager, Director, Doctor, Other)
- level-aware coaching modes (`Student`, `Junior`, `Middle`, `Senior`)
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
