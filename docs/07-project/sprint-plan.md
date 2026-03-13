# Sprint Plan

## Planning Assumptions

- Sprint length: 2 weeks
- Capacity assumption: 1 full-stack engineer plus light design and review support
- Estimation model: story points with a rough engineering-day range
- Priority rule: security and prompt-quality guardrails come before analytics and platform expansion

## Sprint 1: V1.1 Security and Prompt Quality Foundation

Goal: harden the browser extension without rebuilding the MVP baseline.

- `#10 Sensitive Data Detection (Security Guardrail)` — 5 points — 2 to 3 days
- `#11 Prompt Quality Engine v2` — 8 points — 4 to 5 days
- `#13 SEO-Friendly Project Structure and Discoverability Docs` — 3 points — 1 to 2 days

Total: 16 points

Expected outcome:
- prompt submission can warn on likely secrets before AI send
- prompt scoring becomes more structured and more explainable
- docs and README improve discoverability for developer search traffic

## Sprint 2: Coaching Quality and Analytics Foundation

Goal: make coaching more actionable and start capturing local learning signals.

- `#12 Prompt Linter (ESLint for AI Prompts)` — 5 points — 2 to 3 days
- `#14 Prompt Session Tracking` — 5 points — 2 to 3 days
- `#15 Session Summary` — 5 points — 2 to 3 days
- `#17 Role-Based Coaching` — 5 points — 2 to 3 days

Total: 20 points

Expected outcome:
- users get lint-style prompt feedback before send
- local prompt event history exists for future insight features
- daily summary and role-aware coaching become visible product value

## Sprint 3: Trend Visibility and IDE Foundation

Goal: show progress over time and open the path into IDE workflows.

- `#16 Skill Trend Graph` — 5 points — 2 to 3 days
- `#18 VS Code Extension Scaffold` — 8 points — 4 to 5 days
- `#19 Debugging-First IDE Templates` — 5 points — 2 to 3 days

Total: 18 points

Expected outcome:
- users can see trend lines for prompt quality and warning frequency
- VS Code companion exists with shared prompt-analysis foundations
- debugging templates accelerate real developer workflows

## Sprint 4: Review Workflow and Policy Foundation

Goal: extend coaching into review flows and organizational guardrails.

- `#20 PR Coaching Hooks` — 8 points — 4 to 5 days
- `#23 Policy Packs` — 8 points — 4 to 5 days

Total: 16 points

Expected outcome:
- teams can start reviewing AI-assisted code more responsibly
- organizations gain early policy controls for risky AI usage

## Sprint 5: Team Insights

Goal: provide manager-facing visibility without losing privacy discipline.

- `#21 Team Dashboard` — 8 points — 4 to 5 days
- `#22 Manager Insights` — 5 points — 2 to 3 days

Total: 13 points

Expected outcome:
- managers can see aggregate prompt-quality and warning trends
- coaching reports highlight weak areas and improvement opportunities

## Current Execution Order

1. `#10 Sensitive Data Detection`
2. `#11 Prompt Quality Engine v2`
3. `#12 Prompt Linter`
4. `#14 Prompt Session Tracking`
5. `#15 Session Summary`

This ordering keeps the product safer first, then makes coaching smarter, then adds learning analytics on top of better-quality signals.
