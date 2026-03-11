# AI Dev Coach

AI Dev Coach is a Chrome extension that helps new developers use AI tools without building bad habits.

It does not block AI. It coaches behavior in real time.

## Why This Project Exists

AI can accelerate coding, but beginners can become dependent on copy-paste workflows before they build core engineering skills.

AI Dev Coach is designed to protect the learning loop:

- break down ambiguous problems
- explain attempts before requesting solutions
- debug with intent instead of skipping to answers
- use AI as a mentor, not a replacement for thinking

## What You Get (Current MVP)

- Profile onboarding in popup (`job`, `skill`, `habit goal`)
- Prompt Builder with required fields (`task`, `context`, `what you tried`)
- 6 prompt templates: debugging, code review, system design, refactoring, performance optimization, learning
- Prompt scoring algorithm with grade + breakdown (`completeness`, `specificity`, `reasoning`, `learning safety`, `template fit`)
- Real-time prompt quality scoring on AI chat websites
- Warning overlays for shortcut prompts and risky copy-paste behavior
- AI dependency tracking (`ai requests`, `manual attempts`, `large pastes`)
- Settings page for strict mode and warning thresholds

## Supported Platforms

- ChatGPT (`chatgpt.com`, `chat.openai.com`)
- Claude (`claude.ai`)
- Gemini (`gemini.google.com`)
- Grok (`grok.com`)
- DeepSeek (`chat.deepseek.com`)

## Local Setup

### 1. Load the Extension

1. Clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` directory.

### 2. Documentation Format

- All documentation is Markdown under `docs/`.
- No MkDocs or custom docs UI framework is used.

## CI/CD: Deploy Docs to GitHub Pages

This repository includes [`.github/workflows/deploy-docs.yml`](.github/workflows/deploy-docs.yml).

On push to `main`, the workflow:

1. Reads Markdown from `docs/`
2. Builds plain static HTML
3. Deploys automatically to GitHub Pages

### One-Time GitHub Setup

1. Open repository **Settings** > **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually.

## Release Process

- Version is defined in `extension/manifest.json`.
- Create a tag matching the version: `v<manifest-version>` (example: `v1.2.0`).
- Pushing the tag triggers `.github/workflows/release.yml` to:
  - validate tag-version match
  - package the extension zip
  - publish a GitHub Release with auto-generated release notes

## Repository Structure

```text
extension/
docs/
.github/scripts/build_markdown_site.py
.github/workflows/deploy-docs.yml
```

## Product Roadmap

See [docs/07-project/roadmap.md](docs/07-project/roadmap.md).

Prompt Builder details and wireframe: [docs/08-product/prompt-builder-system.md](docs/08-product/prompt-builder-system.md)

## Privacy

- Analysis runs locally in browser content scripts
- No prompt or code is sent to external servers
- No remote analytics in MVP

## License

MIT
