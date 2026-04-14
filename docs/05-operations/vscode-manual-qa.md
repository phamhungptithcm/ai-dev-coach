# VS Code Companion Manual QA

Use this checklist after opening `vscode-extension/` in VS Code and launching an Extension Development Host with `F5`.

Fixture files live in `vscode-extension/fixtures/`.

## Setup

1. Open the repo in VS Code.
2. Open the `vscode-extension/` folder as the extension workspace or keep it in the current multi-root workspace.
3. Press `F5` to launch an Extension Development Host.
4. In the Extension Development Host, open the fixture files from `vscode-extension/fixtures/`.

## Weak Prompt Draft

Open `weak-debug-prompt.md`.

Expected result:
- inline diagnostics appear for a short prompt and low prompt score
- quick fixes include `Expand into structured prompt`
- quick fixes include `Add What I Tried section`
- `AI Dev Coach: Analyze Prompt` opens the analysis panel without asking for a different template

## Missing Context Draft

Open `missing-context-prompt.md`.

Expected result:
- inline diagnostics flag missing technical context
- quick fix `Add technical context` inserts a `Context:` section with concrete placeholders
- the draft stays in markdown/plaintext only; JS/TS files should not show these prompt diagnostics

## Secret Redaction

Open `secret-leak-prompt.md`.

Expected result:
- the leaked token is highlighted as an error diagnostic
- quick fix `Redact detected sensitive data` replaces the raw key with a masked value
- rerunning `AI Dev Coach: Analyze Prompt` after redaction removes the secret diagnostic

## Healthy Prompt

Open `healthy-debug-prompt.md`.

Expected result:
- no prompt diagnostics are shown
- `AI Dev Coach: Analyze Prompt` produces a strong score with detailed context and attempt guidance already satisfied

## Regression Checks

1. Disable `AI Dev Coach › Enable Diagnostics` in settings and confirm diagnostics disappear after the document refreshes.
2. Lower `AI Dev Coach › Max Prompt Length` below the healthy fixture size and confirm diagnostics stop running for that file.
3. Re-enable diagnostics and restore the default max length.
