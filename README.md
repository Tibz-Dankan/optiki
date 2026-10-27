# optikí

**See your app the way an AI agent does.** optikí scans web pages for the problems that stop AI agents and screen readers from using them. Examples: controls hidden from the accessibility tree, look-alike buttons, clickable elements that aren't real controls, `aria-label`s that mask the visible text, content carried only by graphics, and text too small to read from a screenshot. Each page gets a 0–100 score, overall and per category. Every finding points to the element and shows the fix.

- **Scan without an account.** Enter a URL and get a static scan with the 9 core rules. You get 3 free scans, kept in your browser and moved to your account when you sign in.
- **Sign in for the full scan.** All 17 rules, each page rendered in a real Chromium with a screenshot, multiple-page scans that crawl a site's public pages, private or public reports, and a fix report you can paste into a coding agent.
- **Scan from CI.** API tokens (`opt_<prefix>_<token>`) carry only the permissions they were given, so a pipeline can scan every pull request.
- **Try the Gym.** Every rule has an intentionally broken page and a fixed one, so you can see exactly what it catches.

Built for **TestSprite Hackathon Season 4**.

- **App:** https://optikii.netlify.app
- **API:** https://optikiapi.tuliime.com (OpenAPI at [`/api/v1/openapi.yaml`](https://optikiapi.tuliime.com/api/v1/openapi.yaml))
- **GitHub Action:** https://github.com/Tibz-Dankan/optiki-gh-action

## Docs - Usage

You can use optikí in two ways: on the web at [optikii.netlify.app](https://optikii.netlify.app), or from your CI with the [GitHub Action](https://github.com/Tibz-Dankan/optiki-gh-action).

### On the web

1. **Scan without an account.** Open [optikii.netlify.app/scan](https://optikii.netlify.app/scan), enter a full address that starts with `https://` under **Page address**, and press **Scan**. The page is fetched as static HTML and checked against the 9 core rules, and its report opens. Each browser gets 3 free scans, and they move to your account when you sign in.
2. **Create an account.** Sign up at [optikii.netlify.app/auth/signup](https://optikii.netlify.app/auth/signup) and open the verification link in the email you receive. Once you're verified, signing in takes you to **Scan**.
3. **Run the full scan.** On **Scan**, every scan runs all 17 rules on the page rendered in a real Chromium browser, with a screenshot. To scan a whole site, check **Automatically discover and scan other pages on this site** before pressing **Scan**. optikí then follows same-site links from that page, scans up to 25 pages in the background, and shows its progress until the report is ready.
4. **Read the report.** The page gets a 0–100 score, overall and for each category: Operable, Perceivable, Stable and Discoverable. Each finding points to the element and shows how to fix it.
5. **Hand the fixes to your coding agent.** For a scan with findings, the **Fix report** section holds a prompt for Claude Code, Codex, Cursor or any other coding agent. If it hasn't been generated yet, press **Generate report**. Then press **Copy prompt** or **Download .md**.
6. **Share or delete a scan.** **Scans** lists every scan you've run. A scan is private when it's created. From the report's **Scan actions** menu, choose **Make scan public** to let anyone with the link open it, **Copy link** to copy that link, or **Delete scan** to delete it.
7. **Look up a rule.** [Rules](https://optikii.netlify.app/rules) explains all 17 rules. The [Gym](https://optikii.netlify.app/gym) has a broken page and a fixed page for each one, so you can see what each rule catches.
8. **Create an API token for CI.** Go to **Settings → API tokens** and press **Create API token**. Name the token (for example `GitHub Action`), pick its permissions and when it expires (30 days, 90 days, 1 year or never), and press **Create token**. The default permissions, **Create scans** and **View scans**, are all CI needs. Copy the token (`opt_<prefix>_<token>`) right away: it's shown only once. You can edit, revoke or delete it later on the same page.

Only public addresses can be scanned. `localhost` and private addresses are refused with "This address isn't allowed".

### In GitHub Actions

[`Tibz-Dankan/optiki-gh-action`](https://github.com/Tibz-Dankan/optiki-gh-action) scans a URL on every push or pull request. It writes the scores, failed rules and findings to the workflow run's summary, and it can fail the job when the score drops below a threshold.

**1. Create an API token** on the web, as in step 8 above.

**2. Save it as a secret.** In your repository, go to **Settings → Secrets and variables → Actions → New repository secret**. Name it `OPTIKI_API_TOKEN` and paste the token.

**3. Add a workflow,** for example `.github/workflows/optiki.yml`:

```yaml
name: AI legibility

on:
  push:
    branches: [main]
  pull_request:

jobs:
  optiki:
    runs-on: ubuntu-latest
    steps:
      - uses: Tibz-Dankan/optiki-gh-action@v1
        with:
          url: https://example.com
        env:
          OPTIKI_API_TOKEN: ${{ secrets.OPTIKI_API_TOKEN }}
```

Push it, and open the workflow run to see the report in its summary.

**Scan each pull request's preview.** optikí can only reach public URLs, so to check a pull request before it merges, scan its preview deployment. The preview has to be live first, so make the scan job `need` the job that deploys it. With Netlify previews named `deploy-preview-<number>`:

```yaml
on:
  pull_request:

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy this pull request's preview here"

  optiki:
    needs: preview
    runs-on: ubuntu-latest
    steps:
      - uses: Tibz-Dankan/optiki-gh-action@v1
        with:
          url: https://deploy-preview-${{ github.event.number }}--your-site.netlify.app
          minScore: 75
        env:
          OPTIKI_API_TOKEN: ${{ secrets.OPTIKI_API_TOKEN }}
```

**Scan the whole site.** Set `multiplePageScan: true` to crawl from `url` and scan up to 25 of the site's pages. The overall score is the average of the pages scanned:

```yaml
      - uses: Tibz-Dankan/optiki-gh-action@v1
        with:
          url: https://example.com
          multiplePageScan: true
        env:
          OPTIKI_API_TOKEN: ${{ secrets.OPTIKI_API_TOKEN }}
```

**Fail the build on a low score.** Set `minScore` to fail the job when the overall score is below it. The job also fails when the scan itself fails, for example when the page can't be loaded or the token is invalid.

**Use the results in later steps.** Give the step an `id`:

```yaml
      - uses: Tibz-Dankan/optiki-gh-action@v1
        id: optiki
        with:
          url: https://example.com
        env:
          OPTIKI_API_TOKEN: ${{ secrets.OPTIKI_API_TOKEN }}

      - run: echo "Scored ${{ steps.optiki.outputs.score }}/100, see ${{ steps.optiki.outputs.reportUrl }}"
```

| Input | Required | Default | What it does |
|---|---|---|---|
| `url` | yes | | The page to scan. With `multiplePageScan`, the page the crawl starts from. It must be public. |
| `multiplePageScan` | no | `false` | Crawl and scan up to 25 pages of the same site. |
| `minScore` | no | `0` | Fail the job when the overall score (0–100) is below this. `0` never fails on score. |
| `token` | no | `$OPTIKI_API_TOKEN` | The API token, if you'd rather pass it as an input: `token: ${{ secrets.OPTIKI_API_TOKEN }}`. |

| Output | What it holds |
|---|---|
| `scanId` | The ID of the scan. |
| `status` | `COMPLETED` or `FAILED`. |
| `score` | The overall score (0–100). Empty when no rule applied to the page. |
| `findings` | The number of findings. |
| `reportUrl` | The full report on optikí. Sign in as the token's owner to open it. |

Good to know:

- **Reports are private.** They're saved under **Scans** in the token owner's account.
- **Timing.** A single page takes up to about 30 seconds. A multiple-page scan is queued and usually takes a few minutes, and the log shows its progress.
- **Rate limits.** Each token can start 60 scans per 10 minutes. When optikí is busy, the action waits and retries.

The [action's README](https://github.com/Tibz-Dankan/optiki-gh-action#readme) has the full reference.

## Run it locally

You need:

- Go 1.26 (any Go 1.21+ downloads the 1.26 toolchain by itself)
- Node 22+ and pnpm 11
- PostgreSQL
- Chrome or Chromium, for rendered scans

No Docker needed.

```bash
git clone https://github.com/Tibz-Dankan/optiki.git
cd optiki
```

### Backend (`server/`)

```bash
createdb optiki                 # any Postgres install works
cd server
cp .env.example .env            # then fill it in (see below)
make install                    # downloads the Go modules
make run                        # the API on http://localhost:8000
```

In `server/.env`, two values are required:

- `OPTIKI_DEV_DSN_LOCAL`: the DSN of the database you just created.
- `JWT_SECRET`: at least 32 characters. Generate one with `openssl rand -hex 32`.

The rest are optional. If one is missing, the server says so at boot, and everything else keeps working:

| Variable | What it enables | Without it |
|---|---|---|
| `CHROME_BIN` | Rendered scans | Leave it empty to use the Chrome or Chromium on your PATH |
| `S3_ACCESS_KEY_ID`, `S3_ACCESS_KEY`, `S3_BUCKET_NAME`, `AWS_REGION` | Screenshots of rendered scans | Scans are stored without screenshots |
| `RESEND_API_KEY`, `RESEND_SENDER_EMAIL` | Sending emails | Emails are printed to the server console, so you can still open verification links and read reset codes |
| `GEMINI_API_KEY` | Fix reports for coding agents | Scans get no fix report |

The first boot creates the tables and seeds two verified demo accounts: `demo@example.com` / `optiki-demo-1` and `demo2@example.com` / `optiki-demo-2`. Both get the full scan and can create API tokens.

`make test` runs the Go tests. The rendered-scan tests use your local Chrome or Chromium and are skipped without one.

### Frontend (`client/`)

In a second terminal, from the repository root:

```bash
cd client
pnpm install
pnpm dev                        # the app on http://localhost:5173, talking to the API on :8000
```

`pnpm lint` and `pnpm build` check the client.

URL scans can't reach `localhost`: the SSRF guard blocks private addresses, as intended. Scan a public URL instead, such as a Gym page on the production API (`https://optikiapi.tuliime.com/gym/pages/perfect.html`).

## What the suite covers

UI tests only, built in the TestSprite portal. They run on every ready (non-draft) PR against its Netlify preview, and a red run blocks the merge. The steps for each case are in [testsprite/ui-test-plan.md](testsprite/ui-test-plan.md). The last column links the PR where a test caught a real problem.

| Test | Type | What it proves | Caught something in |
|---|---|---|---|
| U1 Scanning the OPT-101 broken Gym page fails OPT-101 and shows how to fix it | UI | A rule fails on its broken Gym page, and the finding explains the fix | — |
| U2 Scanning the OPT-101 fixed Gym page passes OPT-101 | UI | The same rule passes once the page is fixed | — |
| U3 Scanning the Perfect Gym page scores 100 | UI | No false positives | — |
| U4 A signed-out URL scan of docease-v2 runs statically with the 9 core rules | UI | The anonymous tier, and a real fetch of a public site | — |
| U5 Scanning a private address shows "This address isn't allowed" | UI | SSRF blocking, surfaced in the UI | — |
| U6 An address without https:// is rejected before scanning | UI | URL validation in the form | — |
| U7 Signing in with the demo account opens the scan page | UI | The session flow for the seeded account | — |
| U8 A signed-in URL scan of docease-v2 renders in a real browser | UI | The signed-in tier: rendered scans with a screenshot | — |
| U9 Making a signed-in scan public updates its visibility | UI | Signed-in scans start private; the owner can share them | — |
| U10 Deleting a scan from its report returns to the Scans page | UI | The owner can delete a scan | — |
| U11 A signed-out scan's report asks the visitor to sign in to keep their history | UI | Signed-out scans are kept in the browser, with a prompt to sign in | — |
| U12 A signed-in multiple-page scan lists the pages it scanned | UI | `multiplePageScan` crawls a site's public pages in the background and reports each one | — |
| U13 A scan with findings gets a fix report for coding agents | UI | A completed scan with findings queues its Gemini fix report and shows it on the report | — |
| U14 Editing an API token renames it and changes its permissions | UI | The owner can rename a token and change its permissions, and the table shows both | — |
| U15 A signed-in rendered scan shows its progress until the report opens | UI | A running scan disables the Scan button and shows its status until the report opens | — |
