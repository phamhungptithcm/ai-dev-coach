# Branching Strategy

## Branch Roles

- `staging`: integration branch for day-to-day pull requests and validation.
- `main`: stable release branch, updated by weekly sync from `staging`.

## Delivery Rules

- no direct commits to `staging` or `main` (except admin bypass)
- all changes must go through pull requests
- each pull request requires at least 1 approval
- admins can bypass branch protection when emergency fixes are needed
- release versions are never bumped in `staging` pull requests
- docs deployments are independent and never bump extension version
- release version bumps are proposed through an automated release PR on `main`
- release tag and publish steps run automatically only after the release PR merges into `main`

## Release Cadence

- feature work lands in `staging`
- weekly automation opens/reuses sync PR from `staging` to `main` when updates exist
- extension changes on `main` trigger an automated release PR
- after approval and merge, publish automation tags and releases the extension automatically
