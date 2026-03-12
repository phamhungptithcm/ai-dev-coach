# Changelog

## v1.2.13

- added `F1` shortcut to open in-page Prompt Builder when AI composer is focused
- moved toast notifications to top-right and increased default display duration
- upgraded prompt monitor scoring to evidence-based context checks (error + expected/actual + artifact)
- upgraded independent-attempt detection to quality model (action + result + blocker) with explicit no-attempt penalties
- added bilingual (EN + VI) prompt hint dictionaries for context, attempt quality, and shortcut detection
- added debounced pre-send draft scoring (500ms) for realtime live bubble updates while typing
- fixed live bubble visibility behavior when monitoring is enabled

## v1.2.12

- fixed prompt capture reliability on ChatGPT by snapshotting composer content before send clears input
- expanded composer selectors for modern editable chat inputs across supported AI platforms
- fixed Live Coach bubble visibility so monitoring HUD remains visible when monitoring toggles are enabled
- improved popup monitoring save flow to auto-enable coach overlays when monitoring is turned on

## v1.2.11

- improved in-page Prompt Builder launcher visibility with fallback fixed position when chat input is not detected
- launcher now remains available on supported AI pages without requiring extension toolbar click

## v1.2.10

- added drag-to-reposition behavior for the in-page Live Coach bubble
- persisted bubble position in local storage and restored placement after reload
- clamped drag position to viewport to keep bubble visible on resize

## v1.2.9

- redesigned popup Live Monitoring into compact switch toggles with immediate auto-save
- improved monitoring section labels for clearer hierarchy and faster scanning
- updated docs home to show latest release tag and author profile summary

## v1.2.8

- refreshed popup, settings, and in-page coaching UI with pastel design system
- introduced unified primary/secondary palette (`#9DCAEB`, `#C3EEFA`) across all extension surfaces
- improved flow with cleaner button grouping, section hints, and elevated visual hierarchy
- added smooth motion for entry/hover states with reduced-motion accessibility fallback

## v1.2.7

- added in-page Live Coach bubble with realtime prompt score and habit snapshot on AI chat sites
- added prompt-analyzed runtime event bridge so UI updates immediately when user sends a prompt
- persisted last runtime prompt evaluation in storage for stable state after page refresh
- improved send-only tracking path to update live habit stats even when prompt-content reading is disabled

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
