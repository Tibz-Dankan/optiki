---
name: testsprite
description: >-
  How optikí is verified with TestSprite (Hackathon Season 4): the
  portal-built suite, where it runs (the UI suite runs on every PR against
  its Netlify deploy preview), how to write test plans an AI testing agent
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
| Client, per PR | `https://deploy-preview-<PR number>--optikii.netlify.app` (Netlify draft deploy) |
| API | `https://optikiapi.tuliime.com` (Contabo, deployed from `main`) |
| OpenAPI for API mode | `https://optikiapi.tuliime.com/api/v1/openapi.yaml` |

**The trigger.** `netlify-deploy.yaml` also runs on every PR and deploys a preview under the alias `deploy-preview-<PR number>`. When it is live, the action posts a `Netlify` commit status. The TestSprite GitHub App has a **Pull Request** trigger on the UI project:

- It fires on that `Netlify` status.
- Its Target URL pattern is `https://deploy-preview-{pr}--optikii.netlify.app`.
- **Block PR until tests pass** is on, and **Include draft PRs** is off.

TestSprite re-runs the portal suite against each preview and comments the results on the PR. It doesn't write new tests: add them in the portal.

Rules that follow from it:

- **The preview client talks to the production API.** The API has no previews. Its CORS allow-list admits `https://*--optikii.netlify.app` (`server/internal/pkg/isAllowedOrigin.go`). A PR is therefore tested against `main`'s API, so a feature that needs a new endpoint ships as a backend PR first (merged and deployed), then the frontend PR.
- **Draft PRs don't run TestSprite** (credit control). Open WIP as a draft, and mark it "Ready for review" to run the suite. Each push to a ready PR re-runs it.
- **UI test plans navigate by path** ("Navigate to /scan"), never a full `https://optikii.netlify.app/…` URL. Otherwise a PR run silently tests production.
- **The API project (A-tests) isn't on the PR trigger.** It would only re-test production. Run it from the portal at milestones.

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
| A17 | API | `POST /api/v1/sitevisit` with path `/scans/<any id>` answers 201 with `page: "Scan Report"`; a bad `capturedAt` or `anonymousID` is 400; `POST /api/v1/auth/user/<another user's id>/anony-reconcile` is 403 | Site visit capture and reconcile ownership |
| U1 | UI | "Try a demo scan" shows an overall score and four category scores as text | First-run experience |
| U2 | UI | On /scan, pressing "Load example OPT-101 broken" opens a report listing OPT-101 with a "How to fix OPT-101" section | Core flow |
| U3 | UI | Pressing "Load example OPT-101 fixed" opens a report where OPT-101 passes and the score is higher | Feedback loop |
| U4 | UI | Scanning a private address shows "This address isn't allowed" | Error UX |
| U5 | UI | A shared report link opens the same score and findings | Persistence |
| U6 | UI | The rules catalog page for OPT-201 shows WCAG 2.5.3 and its origin note | Docs |
| U7 | UI | A signed-out scan shows the "9 core rules" banner and Stable as "needs rendered scan" | Honest tiers and modes |
| U8 | UI | The Gym index lists the pairs, and a broken page shows its banner | Gym |
| U9 | UI | Creating an API token shows it once ("Copy your new API token"), the table then shows `opt_…_••••`, and "Revoke token <name>" marks it Revoked | Token flow |
| U10 | UI | Creating a project from the dashboard and scanning into it lists the scan on the project page | Project flow |
| U11 | UI | Signing up lands on the "Verify your email" gate | Account flow |
| U12 | UI | Signing in with the seeded account opens the dashboard; signing out returns to sign-in | Session flow |

A1–A15 and U1–U9, U11, U12 cover what exists today; A16 and U10 wait for projects. Rendered-scan tests (A9's rendered half, U-tests on screenshots) need a public URL the production API can reach, such as `https://example.com/` or the API's own `/gym/pages/…`.

## Credit hygiene

S3 teams burned through credits (Timeora: ~150 → ~74) and one deleted tests by mistake. While iterating, rerun only the failing test; run the full suite at milestones and before submitting. Never delete a test to make a run green — fix the plan or the product, and record why.

## Sabotage PRs (proof that the gate holds)

Open each as a ready (non-draft) PR, let it fail, and close it unmerged — then link it from the README:

1. **S1 engine:** disable OPT-101's ancestor check → A1/A3 go red → merge blocked. **Not caught by the PR trigger:** server code never reaches a preview, and the A-tests aren't on it. S1 needs a backend gate (e.g. a workflow running `make test` on PRs) — not decided yet.
2. **S2 UI:** wrap the score gauge in `role="img"` and drop its text → U1 goes red (and, once it exists, the optikí Action) → merge blocked.

## README "What the suite covers"

Required by S4. One row per test: test · UI/API · what it proves · the PR where it caught something. Update it in the same PR that adds or changes a test.
