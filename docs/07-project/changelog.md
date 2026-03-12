# Changelog

## v1.2.6

- added in-page Quick Prompt Builder launcher beside AI chat input on supported sites
- added Build + Insert and Build + Send actions to auto-write prompt into chat composer
- hardened auto-send behavior with retry logic and fallback Enter dispatch
- isolated extension-owned UI from prompt/copy/paste monitors to prevent false tracking
- connected quick-builder submit events to prompt analysis pipeline for reliable scoring/stats

## v1.2.5

- added toggle controls for prompt listener and behavior monitor in popup and settings
- added privacy controls for prompt-content and copied-content reading
- added read-before-copy timing monitor with countdown reminders and fast-copy alerts
- added stats for AI copy events and fast copy behavior
- added bad-prompt and shortcut-prompt counters in habit snapshot
- improved send detection with global Enter/submit fallback listeners

## v1.2.4

- added immediate prompt analysis on send-button click across supported AI chat UIs
- improved send-time responsiveness by decoupling coach feedback from stats write latency
- added long AI-output copy tracking and warning when pasted back into composer

## v1.2.3

- added production validator script for extension package integrity
- hardened prompt monitoring and paste detection for better real-world behavior
- improved release packaging and Chrome publish workflow reliability
- expanded Chrome Web Store deployment guide with listing/privacy/assets checklist

## v1.2.2

- switched docs to MkDocs Material workflow
- aligned docs/nav for extension-focused scope
- CI/CD and release pipeline improvements

## v1.2.1

- prompt builder and scoring enhancements
- docs deployment improvements

## v1.2.0

- initial extension MVP release
