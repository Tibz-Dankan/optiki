# optikí

**See your app the way an AI agent does.** optikí scans web pages for the problems that stop AI agents and screen readers from using them. Examples: controls hidden from the accessibility tree, look-alike buttons, clickable elements that aren't real controls, `aria-label`s that mask the visible text, content carried only by graphics, and text too small to read from a screenshot. Each page gets a 0–100 score, overall and per category. Every finding points to the element and shows the fix.

- **Scan without an account.** Enter a URL and get a static scan with the 9 core rules. You get 3 free scans, kept in your browser and moved to your account when you sign in.
- **Sign in for the full scan.** All 17 rules, each page rendered in a real Chromium with a screenshot, multiple-page scans that crawl a site's public pages, private or public reports, and a fix report you can paste into a coding agent.
- **Scan from CI.** API tokens (`opt_<prefix>_<token>`) carry only the permissions they were given, so a pipeline can scan every pull request.
- **Try the Gym.** Every rule has an intentionally broken page and a fixed one, so you can see exactly what it catches.

Built for **TestSprite Hackathon Season 4**.

- **App:** https://optikii.netlify.app
- **API:** https://optikiapi.tuliime.com (OpenAPI at [`/api/v1/openapi.yaml`](https://optikiapi.tuliime.com/api/v1/openapi.yaml))

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
