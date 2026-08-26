# Astralyn — Architecture

## 1. Principles

1. Free-first.
2. Static/client-heavy.
3. Canonical game facts are server-controlled.
4. User personalization is account-backed.
5. Client caches aggressively.
6. Recommendations are deterministic at the core.
7. AI is optional synthesis/fallback.
8. Game knowledge is versioned and published as immutable snapshots.
9. One ingestion event serves all users; never fetch official sources per user request.

## 2. Primary stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Radix UI
- TanStack Router
- Zustand
- Zod
- Dexie / IndexedDB
- Fuse.js
- Canvas / OffscreenCanvas
- PaddleOCR.js / PP-OCRv5

### Backend / Account & API
Primary:
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Drizzle ORM (D1 driver)
- Better Auth (Google OAuth for MVP)
- Worker-level Invariant Authorization

### Hosting & CDN
Primary:
- Cloudflare Pages / Cloudflare Workers Static Assets (Global Edge CDN)

### Testing
- Vitest
- Testing Library
- Playwright

### CI / Ingestion
- GitHub Actions
- scheduled source polling
- manual workflow dispatch for patch-day sync

## 3. Runtime topology

```text
User Browser
│
├── Static Astralyn App (Cloudflare CDN / Static Assets)
│   ├── React UI
│   ├── Recommendation Engine (Deterministic)
│   ├── OCR Worker (In-Browser Web Worker)
│   ├── IndexedDB Cache (Dexie)
│   └── Published Knowledge Snapshots (/data/<version>/...)
│
└── Authenticated Worker API (/api/...)
    ├── Better Auth Handler (/api/auth/*)
    ├── Session Verification (auth.api.getSession)
    ├── Worker Authorization (user_id = session.user.id)
    └── D1 Database (User Roster, Profiles, Saved Teams)

Trusted CI / Ingestion Pipeline (GitHub Actions)
│
├── official source adapters
├── editorial source adapters
├── validation & normalization
├── consensus precomputation
└── D1 Canonical Database Ingestion (Privileged / Direct)
      ↓
Snapshot build
      ↓
Static versioned JSON (/public/data/<version>/...)
      ↓
Cloudflare CDN / Static Cache
```

## 4. Data read strategy

Client reads game knowledge in this order:
1. IndexedDB cache;
2. versioned static snapshot;
3. database/API only for small dynamic metadata if required.

Do not query Postgres for every character card, relic, build or DU entry.

Example:

```text
/data/manifest.json
/data/<knowledge-version>/characters/index.json
/data/<knowledge-version>/characters/castorice.json
/data/<knowledge-version>/recommendations/castorice.json
/data/<knowledge-version>/du/equations.json
/data/<knowledge-version>/du/blessings.json
```

`manifest.json` includes current game version, knowledge version, release hash, published timestamp, and minimum compatible app version.

## 5. User data strategy

Server:
- identity;
- onboarding state;
- roster;
- saved teams/preferences.

Local:
- latest knowledge snapshot;
- OCR state/cache where supported;
- current DU run;
- transient screenshot data;
- immediate UI preferences.

Screenshots are not uploaded by default.

## 6. Free-tier containment

Cloudflare Static Assets: keep static traffic static. Deliver all immutable knowledge releases directly via CDN edge cache with aggressive cache headers. Avoid per-request SSR or Worker proxying for static files.

Cloudflare D1: keep public Game Knowledge delivery off database reads. Use D1 strictly for authenticated user state (profiles, roster, saved teams) and canonical ingestion persistence. Index all user foreign keys (`user_id`) to minimize scanned rows.

Cloudflare Workers: API operations are scoped strictly to authenticated user endpoints. Session verification uses signed cookies to minimize unnecessary roundtrips.

## 7. AI provider abstraction

```ts
interface ExplanationProvider {
  explain(input: ExplanationInput): Promise<ExplanationOutput>;
}
```

Implementations:
- deterministic template provider — default, always available;
- Gemini free-tier adapter — optional;
- Cloudflare Workers AI adapter — optional.

Ranking is produced before this layer.

## 8. Suggested source tree

```text
src/
  app/
  modules/
    auth/
    onboarding/
    roster/
    characters/
    teams/
    content/
    assistant/
    divergent-universe/
  engine/
    scoring/
    consensus/
    reasons/
  knowledge/
    schemas/
    client/
  ocr/
    preprocess/
    recognition/
    matching/
  shared/
    types/
    validation/

server/
  auth/
  routes/
  db/
    schema.ts
    client.ts
  middleware/

ingestion/
  official/
  editorial/
  normalize/
  validate/
  publish/
  fixtures/
```

## 9. Failure behavior

If Cloudflare Worker or D1 daily quota is exhausted, cached public knowledge and local DU state remain fully usable; account cloud writes show an explicit retry/sync state without corrupting local state.

If official ingestion fails, the last published snapshot remains active; partial invalid knowledge is never auto-published.

If optional AI is rate-limited or unavailable, deterministic explanation templates are used automatically.

If OCR is slow or fails on a device, manual search and entity selection remain available.
