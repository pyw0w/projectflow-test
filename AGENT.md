# AGENT.md — GitHub Repo Search (pyw0w)

> This file is written for AI agents (and humans) who need to understand and
> continue development of this project **without reading all the code first**.

## What this project is

A fully static single-page React application that searches the **public
repositories of the GitHub account `pyw0w`**. The user types a query and the
page filters already-loaded repositories by name, description, language and
topics in real time. There is no backend: everything runs in the browser and
talks directly to the public GitHub REST API (unauthenticated, 60 req/hour).

Live URL after deployment: `https://pyw0w.github.io/projectflow-test/`

### Data flow

```text
GitHub REST API (GET /users/pyw0w/repos, paginated)
        │
        ▼
  src/api/githubApi.js ── fetchAllRepos(): pagination, rate-limit headers,
        │                  GitHubApiError on failures
        ▼
  src/hooks/useRepos.js ── orchestrates: on mount read localStorage cache
        │                   first (instant render), then quiet background
        │                   refresh; on success write cache; on failure keep
        │                   showing cache (soft degradation) or ErrorState
        ▼
  src/api/cache.js ── localStorage persistence { repos, fetchedAt }
        │
        ▼
  src/App.jsx ── client-side filter (matchesQuery) + sort (SORTERS) via
        │        useMemo — NO API calls per keystroke
        ▼
  components (RepoList → RepoCard, EmptyState / ErrorState / Skeleton …)
```

Key invariant: **the network layer is only touched on mount / manual refresh;
typing only re-filters the in-memory array.**

## Repository structure

```text
projectflow-test/
├── .github/workflows/deploy.yml   # CI/CD: test + build + push dist to `web` branch
├── index.html                     # Vite entry HTML (mounts #root)
├── package.json                   # scripts: dev / build / preview / test
├── vite.config.js                 # base: '/projectflow-test/' + React plugin
├── vitest.config.js               # jsdom env, setup file, test globs
├── AGENT.md                       # this file (for agents)
├── README.md                      # human-facing readme
├── bugs.md                        # found/fixed bugs + full list of checks
├── scripts/
│   └── manual-check.mjs           # Playwright layout/UX verification (dev-only, not shipped)
└── src/
    ├── main.jsx                   # ReactDOM entry; imports token/global CSS
    ├── App.jsx                    # composition root: state (query, sort) + layout
    ├── App.module.css
    ├── styles/
    │   ├── tokens.css             # ★ single source of design tokens
    │   └── global.css             # resets/base styles, all values from tokens
    ├── api/
    │   ├── githubApi.js           # REST client: pagination, rate limit, errors
    │   ├── cache.js               # localStorage read/write/clear with timestamp
    │   └── *.test.js
    ├── hooks/
    │   ├── useRepos.js            # cache-first + background refresh lifecycle
    │   └── useRepos.test.js
    ├── components/                # one component + one CSS module per file
    │   ├── SearchBar/…            # (flat files: X.jsx + X.module.css + X.test.jsx)
    │   ├── Toolbar                # row→column layout wrapper (breakpoint 420px)
    │   ├── RepoCard               # card: name/link, desc, language dot, stars, date, topics
    │   ├── RepoList               # maps repos → RepoCard
    │   ├── EmptyState             # no search matches
    │   ├── ErrorState             # API failure / rate limit + retry
    │   ├── SortControl            # updated | stars | name
    │   ├── Skeleton               # shimmer placeholders on first load
    │   └── RateLimitBadge         # remaining anonymous quota (60/h)
    └── test/
        ├── setup.js               # jest-dom, cleanup, MSW, localStorage shim
        └── mswServer.js           # MSW handlers + makeRepo() factory
```

## Components and responsibilities

| Component | Responsibility |
|---|---|
| `App` | Owns `query`/`sort` state, computes filtered+sorted list, picks the right state view (Skeleton/Error/Empty/List), header + warning banner + footer. |
| `Toolbar` | Layout only: search+actions row on desktop, column below 420px (CSS `max-width: 419.98px`). |
| `SearchBar` | Controlled search input with icon and clear button; emits raw query via `onChange`. |
| `SortControl` | Native select (updated/stars/name); emits sort key. |
| `RepoList` | Maps the visible array to `RepoCard` with `repo.id` keys; fade-in animation. |
| `RepoCard` | One repository: external link title, description, topics chips, language dot (GitHub colors), stars, updated date; hover lift. |
| `EmptyState` | "No repositories found" with the query echoed. |
| `ErrorState` | Blocking error (message, rate-limit reset time, retry button). Never a blank screen. |
| `Skeleton` | 4 shimmering placeholder cards during the very first load (no cache). |
| `RateLimitBadge` | `remaining/60` quota chip; amber ≤10, red at 0. |

Non-visual core:

| Module | Responsibility |
|---|---|
| `api/githubApi.js` | `fetchAllRepos()` — GET /users/pyw0w/repos with `per_page=100` pagination (max 10 pages), reads `X-RateLimit-*`, throws typed `GitHubApiError`. |
| `api/cache.js` | `readCache/writeCache/clearCache` — localStorage key `pyw0w:repos-cache:v1`, shape `{repos[], fetchedAt}`, tolerant of corrupt data/quota errors. |
| `hooks/useRepos.js` | Lifecycle: cache-first render → background refresh → `status` (loading/ready/error), non-blocking `error` banner when cache exists, `refresh()` for the button. |

## Design tokens

All colors, typography, spacing, radii, shadows, motion and layout values live
in **`src/styles/tokens.css`** (`:root` variables + dark theme via
`@media (prefers-color-scheme: dark)`). Components use only `var(--…)` — no
magic numbers. To restyle the app, edit this file only.

Breakpoints: the single layout breakpoint is **420px** (`max-width: 419.98px`
→ column toolbar). Safe areas use `env(safe-area-inset-*)` mapped to `--safe-*` tokens.

## Local development

```bash
npm ci            # install (package-lock.json is committed)
npm run dev       # dev server → http://localhost:5173/projectflow-test/
npm test          # vitest run (jsdom + MSW, no real network)
npm run build     # static bundle → dist/ (base path baked in)
npm run preview   # serve dist/ locally
```

Node ≥ 18 recommended (CI uses Node 20).

## Deployment

Two-branch model:

- **`main`** — sources, workflow, docs. Never contains built files.
- **`web`** — *only* the contents of `dist/` (created/updated by CI).

### CI (`.github/workflows/deploy.yml`) — full description

Triggers: `push` to `main` and `workflow_dispatch` (manual run).
`permissions: contents: write`; concurrency group `deploy-web` (no cancels mid-deploy).

Job `build-and-deploy` on `ubuntu-latest`, steps in order:

1. **Checkout source** — `actions/checkout@v4` (branch `main`).
2. **Set up Node.js** — `actions/setup-node@v4`, `node-version: 20`, `cache: npm`.
3. **Install dependencies** — `npm ci` (exact lockfile install).
4. **Run tests** — `npm test`; the job (and deploy) fails if any test fails.
5. **Build** — `npm run build` (Vite, base `/projectflow-test/` from `vite.config.js`).
6. **Deploy dist to web branch** — shell step using the built-in `GITHUB_TOKEN`
   (no secrets anywhere):
   - configure `github-actions[bot]` git identity;
   - `git fetch origin web 2>/dev/null` — decides the path:
     - **branch exists** (2nd+ deploy): `git worktree add <tmp> --force -B web FETCH_HEAD`
       → worktree continues from the remote `web` tip;
     - **branch missing** (first deploy): `git worktree add <tmp> --force --detach`
       then `git -C <tmp> switch --orphan web` → creates the unborn branch
       (the previous version failed here: `FETCH_HEAD` did not exist and the
       orphan fallback ran outside a git repo → `fatal: not a git repository`,
       exit 128 — see bugs.md #9);
   - wipe everything except `.git`, copy `dist/.` in;
   - `git add -A`, skip if no changes, else commit
     `deploy: $GITHUB_SHA` and `git push origin HEAD:web`.

   All three paths (first deploy / update / no changes) are covered by a local
   simulation of the exact `run:` script extracted from the YAML.

**Manual deploy** (without Actions):

```bash
npm test && npm run build
if git fetch origin web; then
  git worktree add /tmp/web --force -B web FETCH_HEAD
else
  git worktree add /tmp/web --force --detach
  git -C /tmp/web switch --orphan web
fi
find /tmp/web -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/. /tmp/web/
cd /tmp/web && git add -A && git commit -m "deploy: manual" && git push origin HEAD:web
```

**One-time GitHub repo settings**: Settings → Pages → Source: *Deploy from a
branch* → branch **`web`** / root. Base path must match the repo name — if the
repository is renamed, change `base` in `vite.config.js` and this URL in docs.

## All checks (tests & verification)

### Automated — `npm test` (Vitest + React Testing Library + MSW)

MSW runs with `onUnhandledRequest: 'error'` → **any real network call in a test fails the test**.
`src/test/setup.js` installs a `localStorage` shim (Node 26's experimental
global getter otherwise shadows jsdom's storage).

API layer (`src/api/`):
- `githubApi.test.js` — happy path + rate-limit headers; `per_page=100` & page param; **pagination stops after a short page** (100+1 case); 403 rate-limit → typed error with `rateLimitRemaining=0`; 500 → typed error; fetch failure → `status: 0` network error.
- `cache.test.js` — round-trip with timestamp; absent cache → null; corrupt JSON → null; wrong shape → null; `clearCache`.

Hook (`src/hooks/useRepos.test.js`):
- loads on mount (`loading → ready`) and writes cache;
- cache-first: instant data + `isRefreshing` background refresh that replaces the list;
- API fails **with** cache → stays `ready` with error object (soft degradation);
- API fails **without** cache → `status: 'error'`;
- `refresh()` refetches and updates rate limit;
- 403 exhaustion → error + `rateLimit.remaining = 0`.

Components (`src/components/*.test.jsx`):
- `SearchBar` — controlled value, onChange per keystroke, clear button shown only with query.
- `RepoCard` — external link (`target=_blank`, `rel=noopener`), description/language/stars/date render, language→color map, missing description/language handled, max 5 topics, Private badge.
- `RepoList` — one row per repo, empty list renders nothing.
- `EmptyState` — echoes the query; generic hint without query.
- `ErrorState` — generic failure + retry click, rate-limit wording + reset time, fallback message (never blank).
- `SortControl` — all options present, current value selected, emits new key.
- `Skeleton` — N placeholders, no real content.
- `RateLimitBadge` — hidden without data, shows quota, `low` ≤10, `critical` = 0.

### Manual — `scripts/manual-check.mjs` (Playwright, dev-only)

Run dev server, then `node scripts/manual-check.mjs` (requires
`npm i --no-save playwright && npx playwright install chromium`).
Verifies at **375px** and **1280px**: no overlap of search/sort/refresh,
toolbar `flex-direction` column/row per breakpoint, all elements inside
viewport, safe-area top padding, **0 API calls while typing**, filter+empty
state < 1000ms, query clearing restores list, cards link externally.

See `bugs.md` for the log of all checks and found/fixed issues.

## Extension points (where to add features)

| Feature | Where |
|---|---|
| Filter by language | Add a `language` state in `App.jsx`; option list can come from `repos` (unique `language`); apply in `matchesQuery`/`useMemo`. UI → new `LanguageFilter.jsx` in `components/`. |
| Pagination / virtual scroll | `App.jsx` `visible` slice + a `Pagination` component; or windowing in `RepoList.jsx`. Data layer already loads all pages. |
| Authorized requests (token) | `src/api/githubApi.js`: add `Authorization: Bearer …` header — but a static public app must not embed tokens; use a user-supplied token stored in sessionStorage, surfaced via a settings UI. Also update rate-limit handling (5000/h). |
| Manual theme toggle | Tokens already switch via `prefers-color-scheme`; add a toggle that sets `data-theme="dark|light"` on `<html>` and extend `tokens.css` with `[data-theme]` overrides; mount control in `App` header. |
| Debounced server-side search | Would contradict the current design (client-side by requirement); if needed, modify `useRepos.js`/`App.jsx` to query `GET /search/repositories?q=user:pyw0w+<q>` — mind the stricter search rate limit. |
| New visual style | Edit only `src/styles/tokens.css`. |
| Extra checks | `src/**/*.test.jsx` pattern is picked up automatically by `vitest.config.js`. |

## Known limitations

- **No backend / fully static** — data is only what GitHub serves publicly.
- **Anonymous rate limit 60 req/hour** shared per IP; the UI degrades softly
  (badge, banner, cached data) but cannot lift the limit without a token.
- **No auth** — private repos are never fetched (a `private` badge exists only
  for completeness of the model).
- **No E2E in CI** — `scripts/manual-check.mjs` needs a local Playwright
  install and is not run by the workflow (only unit/component tests are).
- **No visual regression / accessibility audits** automated.
- **Forks**: `base` in `vite.config.js` is hardcoded to `/projectflow-test/`;
  rename → update it.
- **Repo count cap**: GitHub's endpoint caps at 1000 repos (10 pages × 100).
