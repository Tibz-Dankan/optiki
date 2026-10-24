---
name: testsprite
description: >-
  How optikí is verified with TestSprite (Hackathon Season 4): the
  portal-built suite, where it runs (the trigger is still to be decided —
  there are no per-PR previews), how to write test plans an AI testing agent
  executes reliably (lessons from the Season 3 winners), seeded test accounts,
  the A/U test map (anonymous vs signed-in scans, API tokens and permissions,
  projects, accounts), credit hygiene, sabotage PRs, and keeping the README
  "What the suite covers" table current. Use when adding or changing a feature
  that needs a test, writing or fixing a TestSprite plan, debugging a blocked
  or failed run, or preparing the submission.
---

# TestSprite

## Where the suite runs

| | URL |
|---|---|
| Client | `https://optikii.netlify.app` (Netlify, deployed from `main`) |
| API | `https://optikiapi.tuliime.com` (Contabo, deployed from `main`) |
| OpenAPI for API mode | `https://optikiapi.tuliime.com/api/v1/openapi.yaml` |

There are **no per-PR preview URLs** and no subdomain-per-PR DNS. Both deploy workflows run on push to `main` only.

> **TODO — trigger and target not decided yet.** Until they are, don't write workflow steps, Target URL patterns or "Block PR until tests pass" settings into plans or docs. Open questions:
> - Does the TestSprite GitHub App run on PRs against the production URLs above (testing `main`, not the PR)?
> - Should it run after each deploy to `main`?
> - Or should the client move to Netlify deploy previews?
>
> Once decided, record the trigger here and in the README.

Later, the optikí GitHub Action will scan each PR using an API token. It is a second gate beside TestSprite, built after the core features.

Judges read **the PRs, the TestSprite portal, and the commit history**. The PR history is the evidence: small PRs, one feature each, each linking the tests it adds, with at least one real red → fix → green → merge.

S4 rules that bite:

- The suite is built in the **TestSprite 3.0 portal**.
- **No secrets committed**.
- The README must say **what the suite covers**.
- At least one PR has a passing TestSprite check.
- Submissions close **Mon Oct 26, 11:59 PM PT** (extended).

## Test accounts and data

- The API boots with `SEED_DEMO=true` and creates **verified** accounts from `DEMO_EMAIL`/`DEMO_PASSWORD` (and `_2`) if they don't exist. Store those credentials only in the TestSprite portal and `~/optiki.env` on the server.
- There is **one production database** shared by every run, and nothing is reset between runs. Tests must tolerate leftovers:
  - Use unique emails (with a timestamp) when a test signs up.
  - Use unique names for projects and tokens.
  - Assert on what this run created, never on a total count.
- Tests that create a token **revoke or delete it** at the end. A user can hold at most 25 active tokens, and leaked test tokens would hit that limit.
- TestSprite can't read inboxes. Tests that need a verified user sign in with a seeded account; sign-up tests assert the "Verify your email" gate; password-reset tests assert the generic forgot-password response and that a wrong code is rejected.
- Anonymous scan tests need no account. They must *not* send the seeded account's cookies, or they get the `FULL` rule set.

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
- **Never assert a token's full value in UI tests.** Assert that the created dialog shows a value starting with `opt_`, and that the table shows it masked.
- A `blocked` verdict whose own evidence says PASS is a platform bug (S3: testsprite-cli #208) — rerun once, then record what the evidence shows.

The UI makes this easier by following the frontend skill's agent-legibility rules: real buttons, unique accessible names, labelled fields, no `role="img"` over controls.

## The suite map

Keep this in step with `optiki.md` §10 and the README table.

| # | Type | Scenario (named as a behavior) | Proves |
|---|---|---|---|
| A1 | API | An anonymous scan of the kitchen-sink fixture runs `ruleSet CORE` and fails exactly the 9 P0 rules | Engine correctness, anonymous tier |
| A2 | API | Scanning the perfect fixture scores 100 with zero findings | No false positives |
| A3 | API | Each broken/fixed pair fails and then passes its own rule | Every rule, both directions |
| A4 | API | Scanning the same HTML twice returns the same `reportHash` | Determinism |
| A5 | API | Empty body, both `html` and `url`, HTML over 2 MB, or the wrong content type is rejected (400 / 400 / 413 / 415) | Validation |
| A6 | API | Scanning the API's own `/gym/pages/perfect.html` URL returns a completed report | Real fetch path |
| A7 | API | `127.0.0.1`, `localhost`, `169.254.169.254`, `[::1]`, `10.0.0.1`, `2130706433`, `file://` and `/gym/redirect-private` are all blocked with `SSRF_BLOCKED` | SSRF defense |
| A8 | API | Exceeding the anonymous scan limit returns 429 with `RateLimit-*` headers | Rate limiter |
| A9 | API | A scan by the signed-in seeded user runs `ruleSet FULL`, returns 17 rule results, and is `PRIVATE` | Signed-in tier |
| A10 | API | A token with only `scan:create:own` scans (201), gets 403 `MISSING_PERMISSION` listing scans, and gets 401 `TOKEN_REVOKED` once revoked; listing tokens never returns the secret | Token scoping |
| A11 | API | User B gets 404 on user A's private scan, project and token; an anonymous scan's link is readable by anyone | Ownership / IDOR |
| A12 | API | The OpenAPI spec and `/health` respond; health reports the deployed commit | Contract |
| A13 | API | Sign-up returns a session, and the new user stays unverified (verified-only routes answer `403 EMAIL_NOT_VERIFIED`) | Verification gate |
| A14 | API | Forgot-password gives the same answer for an unknown email and a known one | No account enumeration |
| A15 | API | A wrong reset code is rejected, and after five wrong guesses even the right code is refused | OTP brute-force defense |
| A16 | API | A token with project permissions creates a project and a scan linked to it; deleting the project keeps the scan | Projects via token |
| U1 | UI | "Try a demo scan" shows an overall score and four category scores as text | First-run experience |
| U2 | UI | Loading the "Ring" example and scanning lists OPT-101 with a "How to fix" snippet | Core flow |
| U3 | UI | Switching to the fixed variant makes OPT-101 pass and raises the score | Feedback loop |
| U4 | UI | Scanning a private address shows "This address isn't allowed" | Error UX |
| U5 | UI | A shared report link opens the same score and findings | Persistence |
| U6 | UI | The rules catalog page for OPT-201 shows WCAG 2.5.3 and its origin note | Docs |
| U7 | UI | A signed-out scan shows the "9 core rules" banner and Stable as "needs rendered scan" | Honest tiers and modes |
| U8 | UI | The Gym index lists the pairs, and a broken page shows its banner | Gym |
| U9 | UI | Creating an API token shows it once, the table then shows it masked, and revoking marks it Revoked | Token flow |
| U10 | UI | Creating a project from the dashboard and scanning into it lists the scan on the project page | Project flow |
| U11 | UI | Signing up lands on the "Verify your email" gate | Account flow |
| U12 | UI | Signing in with the seeded account opens the dashboard; signing out returns to sign-in | Session flow |

A12–A15, U11 and U12 cover what exists today. The rest land with their features.

## Credit hygiene

S3 teams burned through credits (Timeora: ~150 → ~74) and one deleted tests by mistake. While iterating, rerun only the failing test; run the full suite at milestones and before submitting. Never delete a test to make a run green — fix the plan or the product, and record why.

## Sabotage PRs (proof that the gate holds)

These need a PR-level gate, so they wait for the trigger decision above. Open each, let it fail, and close it unmerged — then link it from the README:

1. **S1 engine:** disable OPT-101's ancestor check → A1/A3 go red → merge blocked.
2. **S2 UI:** wrap the score gauge in `role="img"` and drop its text → U1 goes red (and, once it exists, the optikí Action) → merge blocked.

## README "What the suite covers"

Required by S4. One row per test: test · UI/API · what it proves · the PR where it caught something. Update it in the same PR that adds or changes a test.
