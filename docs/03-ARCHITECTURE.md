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
10. Game factual knowledge and visual game assets are strictly separate domains.

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

### CI / Ingestion & Asset Sync
- GitHub Actions
- scheduled source polling
- manual workflow dispatch for patch-day sync
- versioned static game asset pipeline (`tools/sync-assets.ts`)

## 3. Runtime topology

```text
User Browser
│
├── Static Astralyn App (Cloudflare CDN / Static Assets)
│   ├── React UI
│   ├── Recommendation Engine (Deterministic)
│   ├── OCR Worker (In-Browser Web Worker)
│   ├── IndexedDB Cache (Dexie)
│   ├── Published Knowledge Snapshots (/data/<version>/...)
│   └── Versioned Static Game Assets (/game-assets/<release>/...)
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

Do not query D1/Postgres for every character card, relic, build or DU entry.

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

- **Cloudflare Static Assets:** Keep static traffic static. Deliver all immutable knowledge releases and game visual assets directly via CDN edge cache. Avoid per-request SSR or Worker proxying for static files.
- **Cloudflare D1:** Keep public Game Knowledge delivery off database reads. Use D1 strictly for authenticated user state (profiles, roster, saved teams) and canonical ingestion persistence. Index all user foreign keys (`user_id`) to minimize scanned rows.
- **Cloudflare Workers:** API operations are scoped strictly to authenticated user endpoints. Session verification uses signed cookies to minimize unnecessary roundtrips.

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

## 8. Versioned Static Game Asset Delivery Architecture

Visual game assets (icons, character previews, portraits, element badges, path symbols) are decoupled from factual game knowledge:

```text
/public/game-assets/<release>/
  ├── manifest.json
  ├── characters/
  ├── elements/
  ├── paths/
  ├── light-cones/
  ├── relics/
  └── du/
```

- **Manifest Schema:** Strongly typed via Zod (`AssetManifestSchema`, `AssetRecordSchema`), tracking entity type, entity ID, variant, local path, source URL, license, copyright owner, and SHA-256 checksum.
- **Asset Loading Semantics:**
  - Same-origin static image loading;
  - Reserved dimensions and aspect-ratio containers to guarantee zero layout shift;
  - In-memory manifest lookups via `getAssetUrl(type, id, variant)` / `getAssetRecord()`;
  - Controlled asynchronous decode with automatic vector fallback rendering upon load error.
- **Cache Strategy Distinction:**
  - *Target Production Cache Policy:*
    - Versioned immutable asset binaries: `Cache-Control: public, max-age=31536000, immutable` (long-lived 1-year edge caching).
    - Release manifest (`manifest.json`): `Cache-Control: public, max-age=300, stale-while-revalidate=3600`.
  - *Verified Deployed Cache Behavior:*
    - Local development and preview environments verified via Vite same-origin static file serving.
    - Remote Cloudflare CDN edge header verification is deferred to Phase 9 production deployment.
- **Runtime Hotlinking Exclusion:** Third-party remote URLs are never accessed at client runtime.
- **Graceful Fallback Guarantees:** Missing or invalid asset references render accessible, zero-layout-shift Astralyn vector fallback silhouettes (`<GameAssetImage>`).
- **Provenance & Legal Boundary:** Repository automation licenses (e.g. AGPL-3.0) do not relicense underlying game artwork (© COGNOSPHERE / HoYoverse). All visual assets are managed conservatively under the HoYoverse Fan Content Policy without asserting fair use as a settled conclusion.

## 9. Failure behavior

If Cloudflare Worker or D1 daily quota is exhausted, cached public knowledge and local DU state remain fully usable; account cloud writes show an explicit retry/sync state without corrupting local state.

If official ingestion fails, the last published snapshot remains active; partial invalid knowledge is never auto-published.

If optional AI is rate-limited or unavailable, deterministic explanation templates are used automatically.

If OCR is slow or fails on a device, manual search and entity selection remain available.
