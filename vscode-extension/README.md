# AI Dev Coach VS Code Companion

This is the first scaffold for bringing AI Dev Coach into editor workflows.

## Current Commands

- `AI Dev Coach: Analyze Selected Prompt`
- `AI Dev Coach: Insert Prompt Skeleton`

## What It Does Today

- analyzes the selected prompt using the shared prompt-quality engine
- runs the shared prompt linter
- adds inline diagnostics for prompt-like markdown and plaintext drafts
- offers quick fixes to expand weak prompts, add missing context, add failure signals, and redact detected secrets
- opens a side panel with score, warnings, and suggestions
- inserts a structured prompt skeleton for debugging, code review, system design, refactoring, performance, or learning

## Why This Exists

The Chrome extension is useful on AI chat pages, but developer workflow eventually needs IDE-native coaching. This scaffold is the first practical step toward that V3 direction.

## Local Development

1. Open the `vscode-extension/` folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. Open the command palette and run one of the AI Dev Coach commands.
4. Use the fixture files in `vscode-extension/fixtures/` to verify diagnostics and quick fixes quickly.

## Current Limitation

This scaffold reuses shared runtime files directly from the monorepo. Before publishing a standalone VS Code extension, those shared engines should be packaged more cleanly for IDE distribution.
