# Manual QA Checklist

Use this checklist after loading the unpacked extension in Chrome.

## First-Run Consent

1. Open the popup before enabling any monitoring.
2. Confirm the consent card is visible.
3. Confirm monitoring toggles are disabled.
4. Open the settings page and confirm monitoring controls remain disabled there too.
5. Accept monitoring consent from popup or settings.
6. Confirm the consent card disappears and monitoring controls become available.

## Workspace Readiness

1. Open a normal non-AI tab such as `https://example.com`.
2. Open the popup.
3. Confirm the workspace status says Insert and Send require a supported AI chat page.
4. Confirm marketplace `Insert` and `Send` buttons are disabled.
5. Open ChatGPT, Claude, Gemini, Grok, or DeepSeek.
6. Reopen the popup and confirm workspace status changes to ready.
7. Confirm marketplace `Insert` and `Send` buttons are enabled.

## Monitoring Controls

1. Turn on `Prompt Listener` from the popup.
2. Open a supported AI chat page and type a structured prompt.
3. Confirm prompt coaching appears only after monitoring is enabled.
4. Turn `Prompt Listener` off and confirm draft/send analysis stops.
5. Turn on `Behavior Monitor`.
6. Confirm copy and paste warnings only appear after behavior monitoring is enabled.

## Enterprise Policy

1. Load a managed policy with `AllowedHosts` set to a subset such as `["claude.ai"]`.
2. Confirm popup workspace status marks other supported hosts as blocked by enterprise policy.
3. Confirm dynamic behavior only remains active on allowed hosts.
4. Load a policy with `LockMonitoringControls: true`.
5. Confirm popup and settings disable monitoring controls and explain that policy is active.
6. Load a policy override such as `PromptListenerEnabled: true`.
7. Confirm the effective setting is reflected in popup and settings UI.

## Marketplace Actions

1. Use `Copy` from the marketplace on any tab and confirm it succeeds.
2. Use `Insert` on a ready supported AI tab and confirm text is inserted into the composer.
3. Use `Send` on a ready supported AI tab and confirm the prompt is actually submitted, not only inserted.
4. Return to an unsupported tab and confirm `Insert` and `Send` stay unavailable.
