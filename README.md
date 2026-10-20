# optikí

**See your app the way an AI agent does.** optikí scans web pages for problems that stop AI agents and screen readers from using them. Examples: controls hidden from the accessibility tree, look-alike buttons, `aria-label`s that mask the visible text, and content carried only by graphics. It scores each page, shows the fix, and gates every pull request on regressions.

Built for **TestSprite Hackathon Season 4** ("One week. One loop. Every PR."). The full spec, roadmap and test plan are in [optiki.md](optiki.md).

- **Live:** `https://<OPTIKI_DOMAIN>` *(set once the VPS is up)*
- **Every PR:** `https://pr-<n>.<OPTIKI_DOMAIN>`, tested by TestSprite before it can merge

> **Status:** PR #1, the scaffold. Accounts, the app shell, per-PR previews, CI and the TestSprite loop are in place. The scan engine lands in PR #2 ([roadmap](optiki.md#13-pr-roadmap-and-schedule)).

## How every PR is tested

1. Opening or pushing to a PR runs the **Preview** workflow. It builds one Docker image (Go API + React client), deploys it to `https://pr-<n>.<OPTIKI_DOMAIN>` behind Traefik, and finishes only when that URL's `/health` reports the PR's commit.
2. The **TestSprite GitHub App** triggers on that workflow, runs the suite against the preview, comments on the PR, and blocks the merge until the tests pass.
3. **CI** runs alongside it: gofmt, vet, build and Go tests; client lint and build; a syntax check of the deploy scripts; gitleaks.
4. Closing the PR removes its container and purges its rows from the database.

From PR #7, optikí also scans its own preview, so a change that makes optikí harder for agents to use blocks its own merge.

## What the suite covers

Built in the TestSprite portal and run on every PR. The last column links the PR where a test caught a real problem.

| Test | Type | What it proves | Caught something in |
|---|---|---|---|
| A12 OpenAPI spec and `/health` respond; health reports the deployed commit | API | The contract TestSprite reads exists, and the preview isn't stale | — |
| A13 Sign-up returns a session, and the new user stays unverified | API | Verified-only routes answer `403 EMAIL_NOT_VERIFIED` until the emailed link is used | — |
| A14 Forgot-password answers the same for unknown and known emails | API | No account enumeration | — |
| A15 A wrong reset code is rejected; after five wrong guesses even the right code is refused | API | Reset codes can't be brute-forced | — |
| U11 Signing up lands on the "Verify your email" gate | UI | The sign-up flow and the verification gate | — |
| U12 Signing in with the seeded account opens the dashboard; signing out returns to sign-in | UI | Session lifecycle in the browser | — |

Coming with the engine (PRs #2–#8): determinism, every rule on its broken and fixed Gym pages, input validation, SSRF blocking, rate limits, share links, the rules catalog, project tokens and PR deltas. See [optiki.md §10](optiki.md#10-test-strategy).

## Run it locally

You need Go 1.24+ (the 1.26 toolchain downloads itself), Node 24, pnpm 10 and Postgres.

```bash
# 1. A database (any Postgres works; this matches server/.env.example)
docker run -d --name optiki-pg -p 5432:5432 \
  -e POSTGRES_USER=optiki -e POSTGRES_PASSWORD=optiki -e POSTGRES_DB=optiki postgres:17-alpine

# 2. The API on http://localhost:8000
cd server
cp .env.example .env            # then set JWT_SECRET to the output of: openssl rand -hex 32
make run                        # tables are created on first boot

# 3. The client on http://localhost:5173 (proxies /api to :8000)
cd ../client
pnpm install
pnpm dev
```

- Without `RESEND_API_KEY`, the server prints each email to its console instead of sending it, so you can open verification links and read reset codes.
- To get a ready, verified account, set `SEED_DEMO=true` and the `DEMO_*` values in `server/.env`.
- `make test` runs the Go tests. `pnpm lint` and `pnpm build` check the client.
- Every row is tagged with `OPTIKI_ENV` (default `local`). `make purge ENV=<env>` deletes one env's rows and refuses `production`.

## Repository layout

```
server/    Go 1.26 · Fiber v2 · GORM/Postgres. cmd/main.go (API), cmd/purge (env cleanup), internal/{routes,handlers,middlewares,models,pkg,...}
client/    React 19 · Vite · TypeScript · TanStack Query · zustand · Formik/Yup · Tailwind v4 · shadcn/ui
deploy/    compose.yml for Traefik + Postgres on the VPS, and env-file templates
scripts/   deploy-preview.sh · destroy-preview.sh · deploy-prod.sh (run on the VPS by the workflows)
.github/   ci.yml · preview.yml · preview-cleanup.yml · deploy-prod.yml
.claude/   skills for the backend, frontend, engine and TestSprite conventions
```

## Deploying (one-time setup)

Previews and production run on one VPS. **Traefik** is the only thing listening on the internet. It routes each host to its container and gets certificates from Let's Encrypt. **Postgres** runs beside it on an internal network.

There's one database for everything. Each row carries an `env` tag (`pr-12`, `production`), every query filters on it, and migrations are additive only. Below, `optiki.example.com` stands for your `OPTIKI_DOMAIN`.

### 1. DNS

Point two A records at the VPS: `optiki.example.com` and `*.optiki.example.com`.

### 2. The VPS

```bash
# On the VPS (Ubuntu): Docker, and a user that can run it
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"      # log out and back in
sudo ufw allow 22,80,443/tcp && sudo ufw enable
mkdir -p ~/optiki/deploy

# From your machine
scp deploy/compose.yml deploy/.env.example deploy/*.env.example <user>@<vps>:~/optiki/deploy/

# On the VPS: Traefik + Postgres
cd ~/optiki/deploy
cp .env.example .env                  # ACME_EMAIL, POSTGRES_PASSWORD (openssl rand -hex 24)
docker compose up -d

# App env files, read by every preview and by production
cp preview.env.example ../preview.env # DSN (with the Postgres password), JWT_SECRET, Resend, DEMO_* accounts
cp prod.env.example ../prod.env       # same database, a different JWT_SECRET
chmod 600 .env ../preview.env ../prod.env
```

App containers publish no ports. That's deliberate: the rate limiter trusts the `X-Real-IP` header Traefik sets, which is only safe while Traefik is the only way in.

### 3. GitHub

```bash
ssh-keygen -t ed25519 -f optiki-deploy -N "" -C optiki-deploy   # then add optiki-deploy.pub to ~/.ssh/authorized_keys on the VPS
gh secret set VPS_HOST --body "<vps ip>"
gh secret set VPS_USERNAME --body "<user>"
gh secret set VPS_SSH_KEY < optiki-deploy
gh variable set OPTIKI_DOMAIN --body "optiki.example.com"
```

Images go to `ghcr.io/<owner>/optiki` using the workflow's own `GITHUB_TOKEN`; no registry secret is needed.

### 4. Email (Resend)

Verify a sending domain in Resend, then put the API key and an address on that domain in both env files. Resend's test sender only delivers to your own inbox. TestSprite never needs email: it signs in with the seeded, already-verified accounts.

### 5. TestSprite

- In the portal, create a project for `https://optiki.example.com`. Add the demo credentials and the PRD from [optiki.md §12](optiki.md#12-prd-paste-into-the-testsprite-portal).
- Install the GitHub App. Add a **PR trigger** that fires when the **Preview** workflow completes, with the Target URL pattern `https://pr-{pr}.optiki.example.com`.
- Turn on **Block PR until tests pass**.

### 6. Branch protection on `main`

Require pull requests and these checks: TestSprite, `Server (gofmt, vet, build, test)`, `Client (lint, build)`, `gitleaks` and `Build and deploy preview`. A check can only be selected after it has run once, so open PR #1 first.

## Security notes

- Passwords are hashed with bcrypt. Sessions are `HttpOnly`, `SameSite=Lax` cookies, and the database stores only SHA-256 hashes of the tokens.
- Reset codes are random, single-use, expire after 20 minutes and burn after five wrong guesses. Forgot-password never reveals whether an account exists.
- Auth routes are rate-limited per IP and send `RateLimit-*` headers.
- No secrets are committed: only `*.example` env files are in git, and gitleaks runs on every PR.

## optikí and Lighthouse

Google Lighthouse's experimental *Agentic Browsing* category audits a single page load for standards readiness (WebMCP, `llms.txt`, a subset of accessibility checks). optikí focuses on the failure modes logged in real AI test runs. It scores them per category with element-level fixes, and it's PR-native: it compares base vs. head and fails the check on regressions. Use both. The [comparison](optiki.md#1-pitch) has the details.
