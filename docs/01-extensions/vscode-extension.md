# VS Code Extension

The repository now includes an early VS Code companion scaffold in `vscode-extension/`.

## Current Scope

- analyze the selected prompt with the shared prompt-quality engine
- run the shared lint rules inside VS Code
- surface inline diagnostics for prompt-like markdown and plaintext drafts
- provide quick fixes for missing structure, missing context, missing failure signals, and secret redaction
- open a side panel with score, warnings, and suggestions
- insert a structured prompt skeleton for technical workflows

## Why It Matters

The Chrome extension is a good acquisition surface, but editor-native coaching is a more credible long-term product direction for daily engineering workflow.

## Current Status

Scaffolded. Not yet packaged or published.

## QA Fixtures

Use the markdown fixtures in `vscode-extension/fixtures/` together with the operations checklist in `docs/05-operations/vscode-manual-qa.md` to verify diagnostics and quick fixes inside an Extension Development Host.

## Next Steps

- package shared coaching engines cleanly for IDE distribution
- connect prompt analysis to PR-review and debugging workflows
- add richer editor surfaces such as review comments, walkthroughs, and PR-aware coaching
