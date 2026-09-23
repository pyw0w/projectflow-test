# Repo Search · pyw0w

A lightweight search page over the **public GitHub repositories of
[pyw0w](https://github.com/pyw0w)**. Type a query — the list filters instantly
by repository name, description, language and topics. No backend, no tokens,
fully static. Includes a second test page — **Projects** (`#/projects`): a
locally stored list of your own repositories (public *and* private) with a
create form.

**Live:** <https://pyw0w.github.io/projectflow-test/>

## Features

- 🔎 **Instant client-side search** — filtering happens in memory, zero API
  calls per keystroke.
- ⚡ **Cache-first loading** — the list is persisted to `localStorage`; a repeat
  visit renders instantly from cache and refreshes quietly in the background.
- ↻ **Manual refresh** button that force-re-fetches from GitHub.
- 🗂 **Sorting** by last update (default), stars, or name.
- 🎨 **Custom design system** — indigo/sky/emerald accents, neutral scale,
  Inter-like type scale, all defined once in `src/styles/tokens.css`.
- 🌗 **Light/dark theme** following the device preference.
- 💀 **Skeleton shimmer** on the very first load instead of a blank screen.
- 📱 **Mobile-first toolbar** — search and buttons sit in one row on desktop
  and stack into a column below 420px (no overlap), with safe-area insets.
- 📄 **Pagination** — the list shows 20 repositories at a time with a
  "Show more" button and an `N of M` counter; resets on query/sort change.
- 🗂 **Projects page** (`#/projects`) — test list of your own repos: live
  search, **create form in a modal** (name, description, language, URL,
  Private flag), saved to `localStorage` (survives reload), delete support.
  Private repositories are added manually — the anonymous API never exposes
  them and the app contains no tokens.
- 🚦 **Rate-limit awareness** — badge shows the remaining anonymous quota
  (60 req/hour) and the UI degrades softly instead of white-screening.

## Stack

React 18 + Vite 5, CSS Modules with a single token file, Vitest + React
Testing Library + MSW for tests, GitHub Actions for deployment.
For a full architecture guide (aimed at AI agents) see [AGENT.md](AGENT.md).

**Why Vite and not Next.js?** GitHub Pages serves a plain folder of static
files — Vite produces exactly that with a one-line `base: '/projectflow-test/'`
config. Next.js static export would work too, but adds routing/SSG machinery
this single-page app doesn't need.

## Getting started

```bash
npm ci            # install dependencies
npm run dev       # dev server → http://localhost:5173/projectflow-test/
npm test          # run the test suite (70 tests, no network access)
npm run build     # production bundle → dist/
npm run preview   # serve the production bundle locally
```

## UI overview

```text
┌──────────────────────────────────────────────┐
│  Repo Search                      55/60 API  │  ← header + rate-limit badge
│  Public repositories of pyw0w                │
│  ┌────────────────────────┐ ┌──────┐ ┌─────┐ │
│  │ 🔍 Search repositories │ │ Sort │ │ ⟳   │ │  ← toolbar: one row ≥420px
│  └────────────────────────┘ └──────┘ └─────┘ │
│  ┌──────────────────────────────────────────┐│
│  │ repo-name                          ★ 12  ││  ← card: name (link), desc,
│  │ Description text…                        ││     topics, language dot,
│  │ javascript · Updated Jun 12, 2025        ││     stars, updated date
│  └──────────────────────────────────────────┘│
│  … more cards (20 per page, "Show more" below)                       │
└──────────────────────────────────────────────┘
     <420px: search / sort / refresh stack vertically
```

States: skeleton shimmer on first load → list; "No repositories found" when a
query matches nothing; an error card with a retry button if the API is down or
rate-limited; an amber warning banner when a refresh failed but cached data is
still shown.

Top tabs switch pages without a reload (hash routing):

```text
[ Repo Search | Projects ]

#/projects:
┌──────────────────────────────────────────────┐
│  Projects                             (2)    │
│  ┌────────────────────────┐ ┌──────────────┐ │
│  │ 🔍 Search projects…    │ │ + New project│ │  ← column below 420px
│  └────────────────────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │ my-private-repo        [🔒 Private]   × ││  ← × = delete
│  │ Internal tool…                          ││
│  │ TypeScript · Added Jun 12, 2025         ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘

+ New project → modal form:
  Name* | Description | Language | URL | [ ] Private repository
  [Cancel] [Create project]
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`: it runs tests, builds
the bundle and publishes **only `dist/`** to the `web` branch. GitHub Pages is
configured to serve from `web`. See AGENT.md for the full workflow description
and a manual deploy recipe.

## Checks

- `npm test` — 70 automated tests covering components, the API layer
  (pagination, cache, rate limit, error paths) and the Projects page;
  MSW blocks real network calls.
- `scripts/manual-check.mjs` — Playwright layout checks at 375px and desktop.
- `scripts/pagination-check.mjs` — Playwright pagination checks (8).
- `scripts/projects-check.mjs` — Playwright E2E for the Projects page (19):
  routing, form validation/create/private flag, reload persistence, delete,
  live search, 375px column toolbar.
- Full check log and fixed bugs: [bugs.md](bugs.md).
