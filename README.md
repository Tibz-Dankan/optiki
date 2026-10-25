# optikí

**See your app the way an AI agent does.** optikí scans web pages for problems that stop AI agents and screen readers from using them. Examples: controls hidden from the accessibility tree, look-alike buttons, `aria-label`s that mask the visible text, and content carried only by graphics. It scores each page and shows the fix. With an API token, it scans every pull request from CI.

Built for **TestSprite Hackathon Season 4** ("One week. One loop. Every PR."). The full spec, roadmap and test plan are in [optiki.md](optiki.md).

- **App:** https://optikii.netlify.app
- **API:** https://optikiapi.tuliime.com (OpenAPI at [`/api/v1/openapi.yaml`](https://optikiapi.tuliime.com/api/v1/openapi.yaml))

> **Status:** accounts and both deploys are live. Scans (all 17 rules, static and rendered, with screenshots), API tokens, the rules catalog and the Gym are built on `feat/scans-and-tokens` and being split into PRs. Projects come next ([roadmap](optiki.md#13-pr-roadmap)).

## What you'll be able to do

| | Signed out | Signed in (verified) | API token |
|---|---|---|---|
| Scan pasted HTML, a URL or a Gym example | ✓ — the 9 core rules | ✓ — all 17 rules | ✓ — all 17 rules |
| URL scans in a real browser (Chromium) | — (static) | ✓ | ✓ |
| Scan history, sharing, delete | link only | ✓ | ✓ (with `scan:*` permissions) |
| Projects | — | ✓ | ✓ (with `project:*` permissions) |

API tokens look like `opt_<prefix>_<token>`. Each one is shown once, belongs to a user, and carries only the permissions it was given (`scan:create:own`, `scan:view:own`, …). A GitHub Action that scans each PR with a token comes after the core features.

## How changes ship

1. Merging to `main` runs **Build and Deploy To Contabo**. It builds one Docker image with the commit baked in, pushes it to Docker Hub, and rolls it out to the `optiki-backend` service on the shared Contabo server. It finishes once the service is running and `/health` answers through Traefik on the server.
2. The same merge deploys the client to Netlify (**Deploy Optiki Client to Netlify**).

There are no per-PR preview deployments.

## What the suite covers

Built in the TestSprite portal. *Where and when it runs is still being decided* (see [optiki.md §10](optiki.md#10-test-strategy)). The last column links the PR where a test caught a real problem.

| Test | Type | What it proves | Caught something in |
|---|---|---|---|
| A12 OpenAPI spec and `/health` respond; health reports the deployed commit | API | The contract TestSprite reads exists, and the deploy isn't stale | — |
| A13 Sign-up returns a session, and the new user stays unverified | API | Verified-only routes answer `403 EMAIL_NOT_VERIFIED` until the emailed link is used | — |
| A14 Forgot-password answers the same for unknown and known emails | API | No account enumeration | — |
| A15 A wrong reset code is rejected; after five wrong guesses even the right code is refused | API | Reset codes can't be brute-forced | — |
| U11 Signing up lands on the "Verify your email" gate | UI | The sign-up flow and the verification gate | — |
| U12 Signing in with the seeded account opens the dashboard; signing out returns to sign-in | UI | Session lifecycle in the browser | — |

Coming with the engine:

- determinism, and every rule on its broken and fixed Gym pages
- the core vs full rule sets
- input validation, SSRF blocking and rate limits
- sharing and the rules catalog
- API token permissions and revocation, ownership, and projects

See [optiki.md §10](optiki.md#10-test-strategy).

## Run it locally

You need Go 1.24+ (the 1.26 toolchain downloads itself), Node 24, pnpm 10, Postgres, and Chrome or Chromium installed. No Docker: every feature works locally, through the same code paths as production.

```bash
# 1. A local database (any Postgres install works)
createdb optiki

# 2. The API on http://localhost:8000
cd server
cp .env.example .env            # set JWT_SECRET (openssl rand -hex 32), OPTIKI_DEV_DSN_LOCAL to your database,
                                # and the production bucket's S3_* values for screenshots
make run                        # tables are created and the demo accounts seeded on first boot

# 3. The client on http://localhost:5173, talking to the local API
cd ../client
pnpm install
pnpm dev:local                  # plain `pnpm dev` talks to the production API
```

Out of the box:

- **Demo accounts:** sign in as `demo@example.com` / `optiki-demo-1` (or `demo2@example.com` / `optiki-demo-2`). Both are verified, so they get FULL rendered scans and API tokens.
- **Rendered scans** use your installed Chromium or Chrome. Leave `CHROME_BIN` empty and the server finds it on your PATH; only the Docker image sets it.
- **Screenshots** go to the real S3 bucket, just like production, once its `S3_*` values are in `server/.env`. Without them, scans are stored without screenshots.
- **Emails** are printed to the server console when `RESEND_API_KEY` is empty, so you can open verification links and read reset codes.
- At boot, the server warns about a missing Chrome, S3 or Resend setup.

Notes:

- `make test` runs the Go tests; the rendered-scan tests drive your local Chrome/Chromium and skip without one. `make golden` rewrites the engine's golden reports. `pnpm lint` and `pnpm build` check the client.
- Locally, URL scans can't reach `localhost` (the SSRF guard blocks it, as intended); scan a public URL or use the Gym examples.

## Repository layout

```
server/    Go 1.26 · Fiber v2 · GORM/Postgres. cmd/main.go (API), internal/{routes,handlers,middlewares,models,pkg,...}
client/    React 19 · Vite · TypeScript · TanStack Query · zustand · Formik/Yup · Tailwind v4 · shadcn/ui
scripts/   optiki-deploy.sh (run on the server by the deploy workflow)
.github/   contabo-deploy.yaml · netlify-deploy.yaml
.claude/   skills (SKILL.md + references/) for the backend, frontend, engine and TestSprite conventions
```

## Deploying (one-time setup)

The backend runs on the Contabo server that also hosts tuliime-backend and content-agent. It is the `optiki-backend` service of their shared Docker Swarm stack, `app-stack`, which is defined by **tuliime-backend's `docker-compose.yaml`** (on the server at `~/docker-compose.yaml`).

- Tuliime's **Traefik** is the only ingress and gets certificates from Let's Encrypt.
- The service is limited to 2 CPUs and 3 GB RAM and listens on 8001. **That port is not published on the host.** Traefik reaches it over the stack's overlay network, and only Traefik's 80/443 are open, so nothing bypasses Traefik.
- The database is an external Postgres (`OPTIKI_PROD_DSN`). The client is a static build on Netlify.

### 1. DNS

Point an A record for `optikiapi.tuliime.com` at the server. There are no preview subdomains.

### 2. The server

```bash
# From your machine
scp server/.env.example <user>@<server>:~/optiki.env

# On the server: fill in OPTIKI_PROD_DSN, JWT_SECRET and Resend,
# replace the template's public DEMO_* accounts with your own,
# and, for scan screenshots, S3_ACCESS_KEY_ID, S3_ACCESS_KEY, S3_BUCKET_NAME and AWS_REGION
# (a private bucket; scans work without it, just without screenshots)
chmod 600 ~/optiki.env
mkdir -p ~/app/optiki && cp ~/optiki.env ~/app/optiki/.env
docker login                          # only if the Docker Hub repository is private
```

`~/app/optiki/.env` must exist before any `docker stack deploy` of a compose file that lists `optiki-backend`, tuliime's own deploys included. Both deploy scripts refresh it from `~/optiki.env`.

If the production database was created before the `env` column was removed, run the one-off SQL in [`.claude/skills/backend/references/data-model.md`](.claude/skills/backend/references/data-model.md#migrations) before deploying.

### 3. The stack

The `optiki-backend` service is defined in tuliime-backend's `docker-compose.yaml`, not in this repo. Get that file to `~/docker-compose.yaml` on the server (tuliime's deploy copies it, or `scp` it). `scripts/optiki-deploy.sh` refuses to run if the service isn't in it.

### 4. GitHub

```bash
gh secret set DOCKERHUB_USERNAME --body "tibzdankan"   # the compose file pulls tibzdankan/optiki-backend:latest
gh secret set DOCKERHUB_TOKEN                          # a Docker Hub access token with write access
gh secret set CONTABO_HOST --body "<server ip>"
gh secret set CONTABO_USERNAME --body "<user>"
gh secret set CONTABO_SSHKEY < <private key>

gh secret set NETLIFY_AUTH_TOKEN                       # client deploy (netlify-deploy.yaml)
gh secret set NETLIFY_SITE_ID
gh secret set ACCESS_TOKEN_GITHUB                      # lets the Netlify action report the deploy on the commit
```

The Docker Hub and Contabo secrets are the same ones content-agent uses. After that, every push to `main` deploys.

### 5. Email (Resend)

Verify a sending domain in Resend, then put the API key and an address on that domain in `~/optiki.env`. Resend's test sender only delivers to your own inbox. TestSprite never needs email: it signs in with the seeded, already-verified accounts.

### 6. TestSprite

- In the portal, create a project for `https://optikii.netlify.app`. Add the demo credentials and the PRD from [optiki.md §12](optiki.md#12-prd-paste-into-the-testsprite-portal).
- **TODO:** decide where and when the suite runs (there are no per-PR previews), then install the GitHub App and set branch protection to match.

## Security notes

- Passwords are hashed with bcrypt. Sessions are `HttpOnly`, `Secure`, `SameSite=None` cookies, because the client and API are on different sites. Sessions can be listed and revoked.
- Reset codes are random, single-use, expire after 20 minutes and burn after five wrong guesses. Forgot-password never reveals whether an account exists.
- Auth routes are rate-limited per IP and send `RateLimit-*` headers.
- API tokens are shown once and stored only as a SHA-256 hash of their secret. They can expire and be revoked, and they carry only the permissions they were given.
- URL scans only ever reach public addresses. Rendered scans send every browser request through the same check.
- No secrets are committed: only `*.example` env files are in git.
- Known limit: browsers that block third-party cookies (Safari) won't keep a session across the two sites. Serving the client from a `*.tuliime.com` domain fixes it.

## optikí and Lighthouse

Google Lighthouse's experimental *Agentic Browsing* category audits a single page load for standards readiness (WebMCP, `llms.txt`, a subset of accessibility checks). optikí focuses on the failure modes logged in real AI test runs, and scores them per category with element-level fixes. It's built for CI: an API token scans each PR, and findings carry stable fingerprints for base-vs-head comparison. Use both. The [comparison](optiki.md#1-pitch) has the details.
