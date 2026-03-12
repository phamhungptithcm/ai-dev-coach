# Branching Strategy

## Branch Roles

- `staging`: integration branch for day-to-day pull requests and validation.
- `main`: stable core branch, updated by scheduled merges from `staging` every 2 weeks.

## Delivery Rules

- no direct commits to `staging` or `main` (except admin bypass)
- all changes must go through pull requests
- each pull request requires at least 1 approval
- admins can bypass branch protection when emergency fixes are needed

## Release Cadence

- feature work lands in `staging`
- every 2 weeks, `staging` is merged into `main`
- release workflow runs from `main`
