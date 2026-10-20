---
name: testsprite
description: >-
  How optikí is verified on every pull request with TestSprite (Hackathon
  Season 4): the GitHub App PR trigger against the per-PR preview URL, the
  portal-built suite, how to write test plans an AI testing agent executes
  reliably (lessons from the Season 3 winners), seeded test accounts, the
  A/U test map, credit hygiene, sabotage PRs, and keeping the README "What
  the suite covers" table current. Use when adding or changing a feature that
  needs a test, writing or fixing a TestSprite plan, debugging a blocked or
  failed run, or preparing the submission.
---

# TestSprite on every PR

## How the loop runs

1. A PR is opened or pushed → `.github/workflows/preview.yml` builds the image, deploys container `optiki-pr-<n>` behind Traefik at **`https://pr-<n>.<OPTIKI_DOMAIN>`** (e.g. `pr-12.optiki.example.com`), and finishes only once that public URL's `/health` reports the PR's commit SHA.
2. The **TestSprite GitHub App** trigger fires when that "Preview" workflow completes, runs the suite against the Target URL pattern `https://pr-{pr}.<OPTIKI_DOMAIN>`, comments on the PR (`testsprite-dev` bot), and — with **Block PR until tests pass** plus branch protection — holds the merge.
3. In parallel, `ci.yml` runs Go tests, the client build/lint and gitleaks; later `optiki-gate` (PR #7) scans the preview with optikí itself.

Judges read **the PRs, the TestSprite portal, and the commit history**. The PR history is the evidence: small PRs, one feature each, each linking the tests it adds, with at least one real red → fix → green → merge.

S4 rules that bite: suite built in the **TestSprite 3.0 portal**; **no secrets committed**; the README must say **what the suite covers**; at least one PR with a passing TestSprite check. Submissions close **Thu Oct 22, 11:59 PM PT**.

## Test accounts and data

- Every preview boots with `SEED_DEMO=true` and creates **verified** accounts from `DEMO_EMAIL`/`DEMO_PASSWORD` (and `_2`) in its own env. Store those credentials only in the TestSprite portal and the VPS env files.
- Each preview has its own data (env tag `pr-<n>`); rows survive pushes to the same PR and are purged when it closes — tests must tolerate leftovers (use unique emails, e.g. with a timestamp, when a test signs up).
- TestSprite can't read inboxes. Tests that need a verified user sign in with the seeded account; sign-up tests assert the "Verify your email" gate; password-reset tests assert the generic forgot-password response and that a wrong code is rejected.

## Writing plans the AI tester executes reliably (Season 3 lessons)

- **One verb per step, one decisive assertion.** Never "verify A or B" — verbose either/or assertions block verdicts even when the page is right (Nora).
- **`Navigate to` only on step 1.** Everything after is clicks and typing.
- **Describe outcomes, not selectors** — the agent locates targets by accessible name; a guessed CSS selector or literal label defeats it.
- **Name the test as a behavior** ("Signing up lands on the verify-email gate"), and rename it when its scope changes — a stale name steers the agent (Nora).
- **Name look-alike controls by widget type and exclude the sibling** ("the Sign out button in the confirmation dialog, not the menu item") (Ouroboros L5).
- **Assert settled end-states, never animation** (Ouroboros L2). **Assume a desktop viewport** — the runner doesn't resize (Nora).
- **Use "Load example" buttons**, never make the agent type long HTML.
- **Seed data instead of loosening assertions** when a page renders an empty state (Nora).
- **Keep plans short.** Long navigation burns the agent's step budget and comes back `blocked`.
- A `blocked` verdict whose own evidence says PASS is a platform bug (S3: testsprite-cli #208) — rerun once, then record what the evidence shows.

The UI makes this easier by following the frontend skill's agent-legibility rules: real buttons, unique accessible names, labelled fields, no `role="img"` over controls.

## The suite map

Keep this in step with `optiki.md` §10 and the README table.

| # | Type | Scenario | Lands with |
|---|---|---|---|
| A12 | API | OpenAPI spec and `/health` respond; health reports the commit | PR #1 |
| A13 | API | Sign-up returns a session and the user is unverified until the emailed link is used | PR #1 |
| A14 | API | Forgot-password gives the same answer for unknown and known emails | PR #1 |
| A15 | API | A wrong reset code is rejected, and after five wrong guesses even the right code is refused | PR #1 |
| U11 | UI | Signing up lands on the "Verify your email" gate | PR #1 |
| U12 | UI | Signing in with the seeded account opens the dashboard; signing out returns to sign-in | PR #1 |
| A1–A8, U1–U8 | API/UI | Engine, Gym, URL scans and SSRF, rate limit, sharing, rules catalog | PRs #2–#6 |
| A9–A11, U9–U10 | API/UI | Projects, tokens, ingest, compare | PR #8 |

## Credit hygiene

S3 teams burned through credits (Timeora: ~150 → ~74) and one deleted tests by mistake. While iterating, rerun only the failing test; run the full suite at milestones and before submitting. Never delete a test to make a run green — fix the plan or the product, and record why.

## Sabotage PRs (proof that the gate holds)

Open, let fail, and close unmerged — then link them from the README:

1. **S1 engine:** disable OPT-101's ancestor check → A1/A3 go red → merge blocked.
2. **S2 UI:** wrap the score gauge in `role="img"` and drop its text → the optiki gate (and likely U1) go red → merge blocked.

## README "What the suite covers"

Required by S4. One row per test: test · UI/API · what it proves · the PR where it caught something. Update it in the same PR that adds or changes a test.
