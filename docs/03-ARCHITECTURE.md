# Astralyn: architecture

## Principles

1. Static knowledge and client-side computation carry the public workload.
2. Canonical facts are versioned and cannot be mutated by user input.
3. User-owned state is separate from canonical character availability.
4. Account data is accessed through a session-scoped Worker API.
5. Recommendation work is deterministic and bounded.
6. Screenshot processing stays in the browser.
7. Missing data produces an explicit reduced or unavailable state.

## Workspace

| Area | Technology | Responsibility |
| --- | --- | --- |
| `apps/web` | React 19, Vite 8, TypeScript, Tailwind CSS 4, TanStack Router | UI, static knowledge loading, IndexedDB cache, local DU state, OCR |
| `apps/worker` | Cloudflare Workers, D1, Drizzle, Better Auth | Auth, profile, roster, saved teams, team recommendation endpoint, protected release export |
| `packages/shared` | TypeScript, Zod | Knowledge schemas, canonical fixtures, taxonomy overlay, team and DU scoring |
| `tools` | TypeScript scripts | Snapshot build/check, migration checks, production-boundary checks, asset checks |

## Local runtime

```text
Browser at localhost:5173
  |
  |-- React routes
  |-- /data/* static knowledge from apps/web/public
  |-- IndexedDB knowledge cache
  |-- localStorage DU run state
  |-- Tesseract.js OCR Web Worker
  |
  `-- /api/* through Vite proxy
          |
          `-- Worker at 127.0.0.1:8787
                |-- Better Auth
                |-- session-scoped API handlers
                `-- local D1
```

`pnpm dev` starts both workspace dev servers. `pnpm db:migrate:local` initializes the local D1 schema.

## Knowledge reads

The client loads `/data/manifest.json`, resolves the active release, verifies each file against `release.json`, parses it with shared Zod schemas, and replaces the Dexie cache transactionally.

The current release layout is:

```text
apps/web/public/data/
  manifest.json
  v1.0.0/
    release.json
    characters.json
    light-cones.json
    relics.json
    enemies.json
    stages.json
    divergent-universe.json
```

Cached data is used for fast repository queries and offline fallback. The static release remains authoritative. A matching version string is not sufficient for freshness; the cached source hash must also match.

## Recommendation execution

`POST /api/recommendations/teams` accepts an explicit scope:

- `all_characters` begins with canonical availability and may run without a session.
- `owned_only` requires a session and begins with the persisted user roster.

The shared engine deterministically prefilters to at most 16 candidates, then evaluates four-character combinations. The hard maximum is 1,820 teams without focus or 455 teams with a pinned focus character. The endpoint reads ownership data but never writes it.

## User data

D1 stores Better Auth tables plus Astralyn profiles, roster entries, saved teams, and saved-team members. Every protected handler derives `user.id` from the session and binds it in database queries.

Canonical game knowledge is delivered as static files. Normal client routes do not write canonical knowledge tables.

## Browser-local data

- Knowledge cache: Dexie / IndexedDB.
- Active DU run: validated Zustand persistence in `localStorage`.
- Screenshot: transient browser memory.
- OCR: dedicated browser Web Worker.

## Visual assets

Game artwork is a separate provenance domain. The repository contains 52 development-only PNG asset records marked `manual_review`. They are excluded from the production bundle. Production routes use accessible fallback silhouettes and do not hotlink third-party asset servers.

## Production topology

Cloudflare is the intended host, but no live origin exists. The repository has not yet selected or committed a production same-origin topology for the web build and `/api/*`. The required decision and smoke gates are documented in [Deployment](16-DEPLOYMENT.md).

## Failure behavior

- If the Worker or D1 is unavailable, public static knowledge and local DU state remain usable; account features report an error.
- If a knowledge update fails validation, the previous valid cache remains active.
- If OCR initialization or recognition fails, the user can select DU entities manually.
- If a roster has fewer than four eligible characters, the engine returns `insufficient_roster` without evaluating partial teams.
- If editorial data is missing, the UI reports it as unavailable rather than manufacturing a consensus.
