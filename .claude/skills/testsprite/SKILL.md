---
name: testsprite
description: >-
  How optikí is verified with TestSprite (Hackathon Season 4): the
  portal-built suite, where it runs (the UI suite runs on every PR against
  its Netlify deploy preview), how to write test plans an AI testing agent
  executes reliably (lessons from the Season 3 winners), seeded test accounts,
  the UI test map (signed-out and signed-in scanning, kept in
  testsprite/ui-test-plan.md), credit hygiene, sabotage PRs, and keeping the README
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

**The trigger.** On every PR to `main`, `ci-previews.yaml` deploys the PR's server to Contabo (the same full deployment as `contabo-deploy.yaml`). Then it deploys the client as a Netlify draft under the alias `deploy-preview-<PR number>`. When the preview is live, the action posts a `Netlify` commit status. `contabo-deploy.yaml` and `netlify-deploy.yaml` run only on merges to `main`. The TestSprite GitHub App has a **Pull Request** trigger on the UI project:

- It fires on that `Netlify` status.
- Its Target URL pattern is `https://deploy-preview-{pr}--optikii.netlify.app`.
- **Block PR until tests pass** is on, and **Include draft PRs** is off.

TestSprite re-runs the portal suite against each preview and comments the results on the PR. It doesn't write new tests: add them in the portal.

Rules that follow from it:

- **The preview calls the production API, which runs the PR's own server by then.** Its CORS allow-list admits `https://*--optikii.netlify.app` (`server/internal/pkg/isAllowedOrigin.go`).
  - Until the next merge, production runs whichever PR deployed last. With two PRs open, the last deploy wins, so keep one PR active while testing.
  - A PR closed unmerged (sabotage PRs included) leaves its server live. Restore `main` by re-running the last **Build and Deploy To Contabo** run on `main` from the Actions tab.
  - A PR's GORM AutoMigrate runs against the production database, so schema changes stay additive.
- **Draft PRs don't run TestSprite** (credit control). Mark the PR "Ready for review" to run the suite; each push to a ready PR re-runs it. CI Previews still deploys on drafts.
- **UI test plans navigate by path** ("Navigate to /scan"), never a full `https://optikii.netlify.app/…` URL. Otherwise a PR run silently tests production.
- **The suite is UI only.** There is no API project; API tests were dropped.
- **Run Behavior: "Log in once per run" is off** (signed-out cases need a fresh browser) **and "Always use planned steps" is on.**

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
- There is **one production database** shared by every run, and nothing is reset between runs. Tests must tolerate leftovers: assert on the scan this case just created, never on history order or a total count. Signed-in cases can run at once on the same account.
- **No sign-up or password-reset tests** (TestSprite can't read inboxes). Signed-in cases sign in with the seeded account.
- Signed-out scan cases need no account. They must *not* carry the seeded account's session, or they get the `FULL` rule set.
- Scanning is URL-only. Rule cases scan the Gym fixtures by URL (`https://optikiapi.tuliime.com/gym/pages/<id>.html`); U4 and U8 scan `https://docease-v2.netlify.app`, a client-rendered app: static signed out, rendered with a screenshot signed in.
- Anonymous URL scans are limited to 10 a minute per IP, and a signed-out browser gets 3 free scans. Every signed-out case makes at most one scan in its own fresh browser; never chain more than 3 signed-out scans in one case.

## Writing plans the AI tester executes reliably (Season 3 lessons)

- **One verb per step, one decisive assertion.** Never "verify A or B" — verbose either/or assertions block verdicts even when the page is right (Nora).
- **`Navigate to` only on step 1.** Everything after is clicks and typing.
- **Describe outcomes, not selectors** — the agent locates targets by accessible name; a guessed CSS selector or literal label defeats it.
- **Name the test as a behavior** ("Scanning the Perfect page example scores 100"), and rename it when its scope changes — a stale name steers the agent (Nora).
- **Name look-alike controls by widget type and exclude the sibling** ("the Sign out button in the confirmation dialog, not the menu item") (Ouroboros L5).
- **Assert settled end-states, never animation** (Ouroboros L2). **Assume a desktop viewport** — the runner doesn't resize (Nora).
- **Type a Gym page URL**, never make the agent type long HTML.
- **Seed data instead of loosening assertions** when a page renders an empty state (Nora).
- **Keep plans short.** Long navigation burns the agent's step budget and comes back `blocked`.
- **Never assert a token's full value in UI tests.** Assert that the created dialog shows a value starting with `opt_`, and that the table shows it masked.
- A `blocked` verdict whose own evidence says PASS is a platform bug (S3: testsprite-cli #208) — rerun once, then record what the evidence shows.

The UI makes this easier by following the frontend skill's agent-legibility rules: real buttons, unique accessible names, labelled fields, no `role="img"` over controls.

## The suite map

The steps for every case live in **`testsprite/ui-test-plan.md`**, the reviewed copy of what's in the portal. Change a case there and in the portal in the same PR, and keep this table, `optiki.md` §10 and the README table in step.

| # | Scenario (named as a behavior) | Proves |
|---|---|---|
| U1 | Scanning the OPT-101 broken Gym page fails OPT-101 and shows how to fix it | A rule fails on its broken page; the fix is shown |
| U2 | Scanning the OPT-101 fixed Gym page passes OPT-101 | The rule passes once fixed |
| U3 | Scanning the Perfect Gym page scores 100 | No false positives |
| U4 | A signed-out URL scan of docease-v2 runs statically with the 9 core rules | Anonymous tier, real fetch |
| U5 | Scanning a private address shows "This address isn't allowed" | SSRF blocking in the UI |
| U6 | An address without https:// is rejected before scanning | Form validation |
| U7 | Signing in with the demo account opens the home page | Session flow |
| U8 | A signed-in URL scan of docease-v2 renders in a real browser | Signed-in tier: rendered + screenshot |
| U9 | Making a signed-in scan public updates its visibility | Private by default; sharing |
| U10 | Deleting a scan from its report returns to the Scans page | Owner delete |
| U11 | A signed-out scan's report asks the visitor to sign in to keep their history | Guest history prompt |

## Credit hygiene

S3 teams burned through credits (Timeora: ~150 → ~74) and one deleted tests by mistake. While iterating, rerun only the failing test; run the full suite at milestones and before submitting. Never delete a test to make a run green — fix the plan or the product, and record why.

## Sabotage PRs (proof that the gate holds)

Open each as a ready (non-draft) PR, let it fail, and close it unmerged — then link it from the README:

1. **S1 engine:** disable OPT-101's ancestor check (`HiddenBy`) → the broken page passes → U1 goes red → merge blocked. CI Previews deploys the sabotaged server first, so re-run the last **Build and Deploy To Contabo** on `main` after closing it.
2. **S2 UI:** wrap the score gauge in `role="img"` and drop its text → U3 goes red (and, once it exists, the optikí Action) → merge blocked.

## README "What the suite covers"

Required by S4. One row per test: test · UI · what it proves · the PR where it caught something. Update it in the same PR that adds or changes a test.
