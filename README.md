# optikí

**See your app the way an AI agent does.** optikí scans web pages for problems that stop AI agents and screen readers from using them. Examples: controls hidden from the accessibility tree, look-alike buttons, `aria-label`s that mask the visible text, and content carried only by graphics. It scores each page, shows the fix, and gates every pull request on regressions.

Built for **TestSprite Hackathon Season 4** ("One week. One loop. Every PR."). The full spec, roadmap and test plan are in [optiki.md](optiki.md).

- **API:** `https://optikiapi.tuliime.com`
- **Client:** deployed to Netlify from `main`

> **Status:** PR #1, the scaffold. Accounts, the app shell, deployment and the TestSprite loop are in place. The scan engine lands in PR #2 ([roadmap](optiki.md#13-pr-roadmap-and-schedule)).

## How changes ship

1. Merging to `main` runs **Build and Deploy To Contabo**. It builds one Docker image with the commit baked in, pushes it to Docker Hub, and rolls it out to the `optiki-backend` service on the shared Contabo server. It finishes once the service is running and port 8001 answers on the server.
2. The same merge deploys the client to Netlify (**Deploy Optiki Client to Netlify**).

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
deploy/    optiki.env.example, the template for ~/optiki.env on the server
scripts/   optiki-deploy.sh (run on the server by the deploy workflow)
.github/   contabo-deploy.yaml · netlify-deploy.yaml
.claude/   skills for the backend, frontend, engine and TestSprite conventions
```

## Deploying (one-time setup)

The backend runs on the Contabo server that also hosts tuliime-backend and content-agent. It is the `optiki-backend` service of their shared Docker Swarm stack, `app-stack`, which is defined by **tuliime-backend's `docker-compose.yaml`** (on the server at `~/docker-compose.yaml`). Tuliime's **Traefik** is the only ingress and gets certificates from Let's Encrypt. The service is limited to 2 CPUs and 3 GB RAM, listens on 8001, also published on the host. The database is an external Postgres (`OPTIKI_PROD_DSN`).

Each row carries an `env` tag (`production`, or `local` in development), every query filters on it, and migrations are additive only.

### 1. DNS

Point an A record for `optikiapi.tuliime.com` at the server.

### 2. The server

```bash
# From your machine
scp deploy/optiki.env.example <user>@<server>:~/optiki.env

# On the server: fill in OPTIKI_PROD_DSN, APP_BASE_URL, JWT_SECRET, Resend and the DEMO_* accounts
chmod 600 ~/optiki.env
mkdir -p ~/app/optiki && cp ~/optiki.env ~/app/optiki/.env
docker login                          # only if the Docker Hub repository is private
```

`~/app/optiki/.env` must exist before any `docker stack deploy` of a compose file that lists `optiki-backend`, tuliime's own deploys included. Both deploy scripts refresh it from `~/optiki.env`.

### 3. The stack

The `optiki-backend` service is defined in tuliime-backend's `docker-compose.yaml`, not in this repo. Get that file to `~/docker-compose.yaml` on the server (tuliime's deploy copies it, or `scp` it). `scripts/optiki-deploy.sh` refuses to run if the service isn't in it.

### 4. GitHub

```bash
gh secret set DOCKERHUB_USERNAME --body "tibzdankan"   # the compose file pulls tibzdankan/optiki-backend:latest
gh secret set DOCKERHUB_TOKEN                          # a Docker Hub access token with write access
gh secret set CONTABO_HOST --body "<server ip>"
gh secret set CONTABO_USERNAME --body "<user>"
gh secret set CONTABO_SSHKEY < <private key>
```

These are the same secrets content-agent uses. After that, every push to `main` deploys.

### 5. Email (Resend)

Verify a sending domain in Resend, then put the API key and an address on that domain in `~/optiki.env`. Resend's test sender only delivers to your own inbox. TestSprite never needs email: it signs in with the seeded, already-verified accounts.

### 6. TestSprite

- In the portal, create a project for the deployed client URL. Add the demo credentials and the PRD from [optiki.md §12](optiki.md#12-prd-paste-into-the-testsprite-portal).
- Install the GitHub App. *(Per-PR previews were removed with the move to the shared server, so its trigger needs re-pointing.)*
- Turn on **Block PR until tests pass**.

### 7. Branch protection on `main`

Require pull requests and the TestSprite check. A check can only be selected after it has run once, so open PR #1 first.

## Security notes

- Passwords are hashed with bcrypt. Sessions are `HttpOnly`, `SameSite=Lax` cookies, and the database stores only SHA-256 hashes of the tokens.
- Reset codes are random, single-use, expire after 20 minutes and burn after five wrong guesses. Forgot-password never reveals whether an account exists.
- Auth routes are rate-limited per IP and send `RateLimit-*` headers.
- No secrets are committed: only `*.example` env files are in git.

## optikí and Lighthouse

Google Lighthouse's experimental *Agentic Browsing* category audits a single page load for standards readiness (WebMCP, `llms.txt`, a subset of accessibility checks). optikí focuses on the failure modes logged in real AI test runs. It scores them per category with element-level fixes, and it's PR-native: it compares base vs. head and fails the check on regressions. Use both. The [comparison](optiki.md#1-pitch) has the details.
