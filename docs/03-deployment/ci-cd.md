# CI/CD

## Workflows

- `ci.yml`: validates extension JavaScript and builds MkDocs with strict mode.
- `deploy-docs.yml`: builds and deploys MkDocs site to GitHub Pages from `main`.
- `release.yml`: on version tags (`v*`), creates a GitHub release and publishes to Chrome Web Store.

## Chrome Web Store Publish Flow

1. Git tag push triggers `release.yml`.
2. Workflow validates `extension/manifest.json` version matches tag.
3. Workflow packages `extension/` as a zip artifact.
4. Workflow uses OAuth refresh token to obtain access token.
5. Workflow uploads zip to Chrome Web Store API.
6. Workflow publishes the uploaded extension package.
