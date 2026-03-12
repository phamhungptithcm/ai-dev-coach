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
- In-page Quick Prompt Builder button beside AI chat composer (`Build + Insert`, `Build + Send`)
- Keyboard shortcut `F1` to open Prompt Builder while focused in AI chat composer
- In-page Live Coach bubble with realtime prompt score and habit snapshot
- 6 prompt templates: debugging, code review, system design, refactoring, performance optimization, learning
- Prompt scoring algorithm with grade + breakdown (`completeness`, `specificity`, `reasoning`, `learning safety`, `template fit`)
- Real-time prompt quality scoring on AI chat websites (draft + submit paths)
- Warning overlays in top-right for shortcut prompts and risky copy-paste behavior
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

### 2. Run Production Validation Locally

```bash
node scripts/validate-extension.mjs
find extension -type f -name '*.js' -print0 | xargs -0 -n1 node --check
python3 -m mkdocs build --strict
```

### 3. Documentation Format

- All documentation is Markdown under `docs/`.
- Docs site is built with MkDocs Material using `mkdocs.yml`.

## CI/CD: Deploy Docs to GitHub Pages

This repository includes [`.github/workflows/deploy-docs.yml`](.github/workflows/deploy-docs.yml).

On push to `staging`, the workflow:

1. Installs `mkdocs-material`
2. Builds docs with `mkdocs build --strict`
3. Deploys automatically to GitHub Pages

### One-Time GitHub Setup

1. Open repository **Settings** > **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `staging` or run the workflow manually.

## Release Process

- Version is defined in `extension/manifest.json`.
- Pushing to `main` triggers `.github/workflows/release.yml` to:
  - auto-create tag `v<manifest-version>` if it does not exist
  - package the extension zip
  - publish a GitHub Release with auto-generated release notes
  - upload and publish the package to Chrome Web Store

### Chrome Web Store Secrets

Configure these repository secrets before a `main` release run:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`
- `CWS_EXTENSION_ID`

Optional:

- `CWS_PUBLISH_TARGET` (`default` or `trustedTesters`)

The release workflow exchanges the refresh token for an access token using OAuth, then calls the Chrome Web Store API upload and publish endpoints.

## Branching Strategy

- `staging` is the integration branch for pull requests.
- `main` is the stable core branch.
- Every 2 weeks, merge `staging` into `main`.
- Branch protections enforce PR flow with 1 approval (admins can bypass for emergencies).

See [docs/07-project/branching-strategy.md](docs/07-project/branching-strategy.md).

## Repository Structure

```text
extension/
docs/
.github/workflows/ci.yml
.github/workflows/deploy-docs.yml
.github/workflows/release.yml
mkdocs.yml
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
