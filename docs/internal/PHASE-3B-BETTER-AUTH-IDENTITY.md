# Phase 3B — Better Auth + Identity

Status: Local implementation and smoke verification complete. Production deployment & remote migration deferred to Release Gate (Phase 9). Verification date: 2026-09-03.

## 1. Objective

Establish the smallest production-grade identity boundary needed before Phase 4: Better Auth on the Cloudflare Worker, D1-backed users/sessions/provider accounts, Google sign-in, secure session cookies, and a typed server-side auth context future APIs can consume.

Phase 3B must leave an authenticated user with no Astralyn profile or roster as a valid state. It must not create product data, fake identities, or fallback sessions.

## 2. Current Verified State

- Phase 3A owns database code under `apps/worker`; `packages/shared` has no ORM dependency.
- `apps/worker/src/db/schema.ts` exports no application tables. `apps/worker/drizzle/migrations/meta/_journal.json` has no migration entries.
- `apps/worker/src/db/client.ts` creates a Drizzle D1 client; `apps/worker/src/db/health.ts` performs only `SELECT 1`.
- `apps/worker/src/index.ts` exposes `GET /api/health` and a 404 fallback. There are no auth routes, auth dependencies, session resolvers, or authenticated product routes.
- `apps/worker/wrangler.jsonc` binds D1 as `DB`, names the database `astralyn-db`, and points Wrangler at `drizzle/migrations`.
- Drizzle Kit generates SQL through the Worker package. Wrangler applies it locally or remotely and owns D1's applied-migration history. `drizzle-kit migrate` is not an Astralyn execution path.
- Root scripts already provide `db:generate`, `db:check`, `db:migrate:local`, Phase 2/2.5 knowledge/data checks, lint, typecheck, tests, build, and E2E.
- `tools/check-migrations.ts` invokes generation but does not yet prove that regeneration leaves the committed schema and migration artifacts unchanged.
- `tools/check-production-data.ts` guards the web production tree but does not yet enforce the corresponding Worker production/test import boundary.
- `apps/web/vite.config.ts` proxies `/api` from local port 5173 to the Worker on port 8787. Production is intended to use same-origin `/api`; no deployed origin is recorded in tracked configuration.
- `.gitignore` excludes `.dev.vars`, `.dev.vars.*`, `.env`, and `.env.*`. `.env.example` predates the auth phase.
- Repository requirements place Better Auth and Google OAuth in Phase 3B. Historical auth SQL under `docs/d1/**` is non-runtime reference material, not a schema source.
- `docs/05-AUTH_ONBOARDING.md` describes profile creation after OAuth. That behavior conflicts with the current phase boundary and is deferred to Phase 4; Phase 3B must not implement it.
- The repository requires Node `>=24.19.0 <25` and pnpm `>=10`. The planning shell was Node 22.19.0, so prior user-reported Node 24.19.0 gate results are accepted as project state, but no implementation gate is inferred from this planning session.

## 3. Official Better Auth Findings

The executor must pin and verify Better Auth **1.7.2** APIs before implementation. Do not substitute `latest` during execution.

- Better Auth 1.5 introduced first-class Cloudflare D1 support: a Worker can pass its `D1Database` binding directly as `database`. The native dialect uses D1 query, batch, and introspection APIs. [Better Auth 1.5 release](https://better-auth.com/blog/1-5)
- Better Auth 1.7.2 is the current stable documentation/release assumption for this plan. The Worker must fail configuration if the pinned package exposes a materially different schema or API.
- The Drizzle adapter is a separate package. Its SQLite-compatible form is `drizzleAdapter(db, { provider: "sqlite" })`. Native D1 and the Drizzle adapter are alternative runtime database integrations; one auth instance must not use both. [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- Better Auth CLI `generate` can emit a Drizzle/SQLite schema without connecting to D1 by using the documented adapter and dialect flags. Its `migrate` command and programmatic migration APIs apply only to the built-in Kysely path; neither is an Astralyn migration executor. [Better Auth CLI](https://better-auth.com/docs/concepts/cli), [Better Auth database](https://better-auth.com/docs/concepts/database)
- Core persistence consists of `user`, `session`, `account`, and `verification`. Current generated output, including indexes, field widths, required fields, and plugin additions, is authoritative. Better Auth 1.7.2 account identity uses the generated issuer/accountId identity model. Astralyn is a fresh Better Auth database and must explicitly select `account.identityStrategy: "provider-id"`; it must not inherit v1.7 compatibility-mode behavior. [Better Auth database](https://better-auth.com/docs/concepts/database)
- The default handler base path is `/api/auth`; a Worker catch-all forwards `/api/auth/*` to `auth.handler(request)`. The returned response, especially separate `Set-Cookie` headers, must survive unchanged. [Better Auth installation](https://better-auth.com/docs/installation), [Cloudflare Headers API](https://developers.cloudflare.com/workers/runtime-apis/headers/)
- Better Auth uses origin and Fetch Metadata checks for CSRF defense. Session cookies are HttpOnly and `SameSite=Lax`; Secure is expected under HTTPS. Cross-subdomain cookies and origin-check bypasses are opt-ins and are not needed here. [Better Auth security](https://better-auth.com/docs/reference/security), [Better Auth options](https://better-auth.com/docs/reference/options)
- The documented defaults are a seven-day session expiry and one-day update age. This plan pins those values explicitly to make later changes deliberate. Cookie cache/secondary storage remains disabled.
- Google OAuth requires an exact authorized redirect URI. The callback is `<baseURL>/api/auth/callback/google`; scheme, host, port, path, case, and trailing slash must match the registered value. Separate non-production and production OAuth clients/projects are preferred. [Better Auth Google provider](https://better-auth.com/docs/authentication/google), [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- D1 is single-threaded and has no interactive transaction callback API. `batch()` executes statements sequentially and atomically for the batch; Better Auth's native D1 integration uses D1-native behavior and batch atomicity rather than emulating an interactive transaction. D1 also limits an invocation to six simultaneous D1 connections, queries to 30 seconds and 100 bound parameters, and Free-plan reads to 50 subrequests per invocation. Phase 3B therefore avoids transaction-dependent plugins, redundant session reads, and tests that assume unsupported interactive transaction semantics. [D1 batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- Worker secrets are runtime bindings. Secret values belong in untracked local secret files or Cloudflare secret storage, never Wrangler `vars`, logs, tests, or tracked examples. [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## 4. Phase Boundary

### In Scope

- Better Auth 1.7.2 server integration in `apps/worker`.
- Native D1 runtime persistence through the existing `DB` binding.
- Generated and committed Drizzle definitions for Better Auth's four core tables.
- Drizzle Kit SQL generation and Wrangler-only migration execution.
- `/api/auth/*`, server-side session resolution, and a typed `AuthContext` result.
- Google OAuth configuration, callback behavior, logout/revocation behavior, and configuration failures.
- Explicit session, cookie, origin, account-linking, token-at-rest, response-cache, and error policies.
- Isolated automated auth tests and regression checks for migration/schema drift and production/test import boundaries.
- Local smoke testing plus explicitly approved remote configuration and migration gates.

### Out of Scope

- Astralyn profiles, HSR UID, Trailblaze level, preferences, roster, Eidolons, teams, recommendations, DU state, OCR history, or any other Phase 4+ table or route.
- Automatic profile/roster creation after sign-in.
- Sign-in/onboarding UI, authenticated product pages, and frontend auth-client state.
- Email/password, magic link, passkeys, additional OAuth providers, organization/RBAC plugins, SCIM, admin tooling, and account deletion flows.
- Cross-origin deployments, cross-subdomain cookies, CORS middleware, cookie cache, KV/secondary session storage, and offline Google API access.
- Live Google OAuth in automated CI.
- Rewriting roadmap or architecture documentation; any stale narrative is recorded under deferred findings.

## 5. Better Auth Database Architecture Decision

| Option | Benefits | Risks | Migration Compatibility | Decision |
| --- | --- | --- | --- | --- |
| Native Cloudflare D1 runtime | First-class Better Auth support; uses D1-native prepared statements/batches; smallest Worker integration; no runtime adapter package | Runtime model and committed Drizzle representation can drift unless generation is gated | Compatible when Better Auth CLI generates the canonical Drizzle schema, Drizzle Kit generates SQL, and Wrangler alone applies it | **Selected** |
| Drizzle runtime adapter | Reuses the existing Drizzle client and one ORM vocabulary; generated schema maps directly to adapter models | Adds `@better-auth/drizzle-adapter`; D1 transaction semantics and adapter behavior add a runtime layer without a Phase 3B need | Compatible with the existing pipeline, but no migration advantage over native D1 when Wrangler remains executor | Rejected for Phase 3B |
| Better Auth native schema plus runtime auto-migration | Few setup steps in a disposable project | Creates a second schema/migration authority and can mutate production at runtime | Incompatible with Phase 3A ownership | Rejected |

**Decision:** use native D1 for Better Auth runtime access, while using Better Auth's pinned CLI to generate the approved Drizzle/SQLite schema representation. Drizzle remains the repository schema and SQL-generation layer; Wrangler remains the only migration executor.

This preserves one committed schema path without forcing Better Auth's runtime through Drizzle. It intentionally revises the adapter-specific detail in historical decision D-019 because native D1 is now first-class. The enduring parts of D-019—generated Better Auth schema, Drizzle-owned migration generation, and no automatic runtime migration—remain intact.

The executor must not add `@better-auth/drizzle-adapter`, call Better Auth migration APIs, call `drizzle-kit migrate`, or construct a second Better Auth instance with a different data model.

Native D1 runtime atomicity means Better Auth may use D1 prepared statements and `batch()` according to its own adapter implementation. Astralyn must not wrap auth work in, expose, or test against an interactive transaction callback that D1 does not support.

## 6. Auth Data Model

| Table | Better Auth Purpose | Source of Definition | Why Required |
| --- | --- | --- | --- |
| `user` | Stable authenticated identity and provider-independent user fields | Better Auth 1.7.2 CLI-generated Drizzle/SQLite schema | Parent identity for sessions and provider accounts; future Phase 4 tables may reference its generated primary key |
| `session` | Server-side session record, token, expiry, and request metadata | Same generated schema | Required for revocable D1-backed sessions; no fallback identity may replace a missing/expired record |
| `account` | Google provider account linkage and OAuth token metadata | Same generated schema | Required for OAuth identity and issuer/provider-scoped account uniqueness |
| `verification` | OAuth state and other Better Auth verification records | Same generated schema | Required by Better Auth's database-backed verification flow and CSRF/OAuth state handling |

Do not prescribe columns from memory. The checked-in generated file and its generated migration must match Better Auth 1.7.2 exactly after applying only the approved options below. No `profile`, `roster`, or product tables are allowed.

Approved schema-affecting configuration:

- Core tables only; no plugins.
- Default table/model names unless generated D1 incompatibility forces a documented stop.
- Explicit fresh-database identity strategy:

  ```ts
  account: {
    identityStrategy: "provider-id",
  }
  ```

- The generated issuer/accountId physical columns, composite identity/index rules, constraints, and names come only from Better Auth CLI 1.7.2 output.
- No additional user fields.

`accountLinking.disableImplicitLinking: true` and OAuth-token encryption are runtime security choices; the executor must regenerate and inspect schema if the pinned CLI shows either changes persistence.

After any real `account` row exists, changing `identityStrategy` is not a configuration-only edit. It becomes a separately reviewed data re-key migration with collision analysis, rollback planning, and explicit user approval. It is outside Phase 3B closure unless required before first production use.

## 7. Schema & Migration Flow

The only approved flow is:

```text
pinned Better Auth 1.7.2 + shared schema-affecting options
  -> Worker-package script invokes the workspace-pinned `auth` binary from `auth@1.7.2`
     `auth generate --config ./src/auth/schema-config.ts`
     `--adapter drizzle --dialect sqlite`
     `--output ./src/db/auth-schema.generated.ts --yes`
  -> apps/worker/src/db/auth-schema.generated.ts (committed; never hand-edited)
  -> apps/worker/src/db/schema.ts composes/re-exports the generated auth tables
  -> existing drizzle-kit generate
  -> apps/worker/drizzle/migrations/*.sql + meta/* (committed and reviewed)
  -> existing Wrangler migrations apply
  -> local or explicitly approved remote D1
```

Rules:

- `apps/worker/src/auth/schema-options.ts` owns every schema-affecting Better Auth option, including the explicit `provider-id` strategy and any future plugin that is separately approved. Both the CLI-safe config and runtime factory consume this same object; they must not duplicate it in unrelated configs. It must not contain credentials, D1 bindings, fake users, or product fields.
- `apps/worker/src/auth/schema-config.ts` is a tooling-only CLI entry point. It consumes the shared schema options but contains no `env.DB`, live D1 connection, production secret, Google credential, or fabricated credential. Production modules must not import it. Offline generation must use the CLI's documented adapter/dialect/output flags.
- `apps/worker/src/auth/server.ts` consumes the same shared schema options, then adds runtime-only `env.DB`, `BETTER_AUTH_SECRET`, explicit `BETTER_AUTH_URL`, Google client ID/secret, and the approved environment-specific trusted origins.
- `apps/worker/src/db/auth-schema.generated.ts` is the explicit CLI output target. The CLI must never target or overwrite `apps/worker/src/db/schema.ts`.
- `apps/worker/src/db/schema.ts` remains Astralyn's composition/source-of-truth entrypoint: it re-exports generated Better Auth tables now and may compose separately owned Astralyn application schema modules in later phases.
- A root `auth:schema:generate` script owns the exact pinned invocation. A separate `auth:schema:check` compares fresh generated output in an ignored temporary location with the committed generated schema and fails on drift without mutating tracked files.
- `tools/check-migrations.ts` must fail when Drizzle regeneration would create or change committed migration artifacts. A checker that merely runs generation and prints success is insufficient.
- The executor must inspect generated tables, indexes, foreign keys, and migration SQL before applying anything. Historical `docs/d1/**` SQL must not be copied or executed.
- Never run `auth migrate`, Better Auth `getMigrations`/`runMigrations`, `drizzle-kit migrate`, ad hoc DDL, or runtime DDL. They would violate single migration authority.

## 8. Worker Auth Architecture

```text
Request
  -> apps/worker/src/index.ts router
     -> /api/auth/*
        -> validate DB + auth environment
        -> create/reuse request-safe Better Auth instance
        -> auth.handler(request)
        -> preserve status/body/all Set-Cookie headers; Cache-Control: no-store
     -> future protected /api/* route
        -> resolveAuthContext(request, env)
        -> Better Auth getSession against native env.DB
        -> authenticated | anonymous | unavailable
     -> existing /api/health or 404
```

Required server boundaries:

- `createAuth(env)` is the sole production auth factory. It receives bindings explicitly for Worker testability and uses `env.DB` directly as Better Auth's native database.
- The factory consumes shared schema-affecting options and adds only runtime concerns: native D1, secrets, explicit base URL, Google provider credentials, and exact trusted origins.
- Auth route matching accepts all HTTP methods under `/api/auth/*`; non-auth routes retain current behavior.
- `resolveAuthContext(request, env)` returns a discriminated result:
  - `authenticated` with readonly `userId`, Better Auth `user`, and `session`;
  - `anonymous` when no valid session exists;
  - `unavailable` with a sanitized internal error code when configuration or D1 is unavailable.
- Anonymous and unavailable are distinct. Neither may return a guest/default/fake `userId`.
- Future routes must derive identity only from the resolved server session, never a client-supplied user ID. No protected product route is added in this phase.
- Preserve multiple `Set-Cookie` values as separate headers. If adding `Cache-Control: no-store` requires cloning a response, use the Workers multi-cookie API and regression-test it; otherwise return the Better Auth response intact.
- Local web traffic remains same-origin from the browser through Vite's `/api` proxy. Production must also be same-origin unless a future architecture decision explicitly introduces CORS.
- Phase 3B creates no `apps/web` module and imports no `better-auth/client` browser API. `better-auth@1.7.2` therefore remains a direct dependency of `apps/worker` only; pnpm workspace hoisting must not be used as implicit dependency ownership. If this scope changes, stop and add the exact version directly to `apps/web/package.json` before any web import.

## 9. Session & Cookie Policy

| Concern | Phase 3B policy |
| --- | --- |
| Persistence | Database-backed sessions in D1; no JWT-only, memory-only, or fallback sessions |
| Lifetime | Explicit seven-day expiry (`604800` seconds) |
| Refresh/update | Explicit one-day update age (`86400` seconds) |
| Cookie cache | Disabled; do not add secondary storage or cached session payloads |
| HttpOnly | Retain Better Auth secure default; automated test must prove session cookie is HttpOnly |
| Secure | Required for preview/production HTTPS; local insecure cookies permitted only for loopback HTTP through the configured local base URL |
| SameSite | `Lax`; do not weaken to `None` for a same-origin architecture |
| Domain/path | Host-only cookie, default auth cookie path behavior; no parent-domain sharing |
| CSRF | Keep origin and Fetch Metadata checks enabled; never set a skip/bypass option |
| Trusted origins | Exact local, preview, and production application origins only; no wildcard, reflected origin, or broad hostname pattern |
| Cache | Auth/session responses must be `no-store`; Cloudflare cache behavior must not be relied on implicitly |
| Revocation | Sign-out removes/revokes the persisted session and expires the browser cookie |
| OAuth tokens | Enable Better Auth account token encryption; request only sign-in scopes and do not request offline access/refresh behavior |
| Database atomicity | Rely on Better Auth's native D1 prepared-statement/`batch()` behavior; do not require interactive transaction callbacks |

Session renewal must not fixate an attacker-controlled token. Use Better Auth's generated tokens and normal session lifecycle; do not parse, create, or accept session IDs outside Better Auth.

## 10. Google OAuth Architecture

Google OAuth is in scope because `docs/02-MVP_SCOPE.md`, `docs/03-ARCHITECTURE.md`, `docs/13-ROADMAP.md`, and decision D-018 assign Google sign-in to Phase 3B.

- Configure the Better Auth Google social provider in the Worker using environment bindings only.
- Local base URL: `http://localhost:5173`; local callback: `http://localhost:5173/api/auth/callback/google`, using the existing Vite `/api` proxy.
- Preview base URL and callback: `https://<user-confirmed-preview-origin>/api/auth/callback/google`.
- Production base URL and callback: `https://<user-confirmed-production-origin>/api/auth/callback/google`.
- The values in angle brackets are not configuration values. The executor must stop until the user supplies exact deployed origins and registers exact redirect URIs.
- Use separate Google non-production and production OAuth clients/projects where practical. Never reuse a production secret in local automated tests.
- Use `provider-id` identity strategy and disable implicit same-email account linking. A later phase may design explicit linking after multiple providers exist.
- Keep OAuth state and PKCE protections enabled. Accept only Better Auth's callback path and validated state.
- Cancellation, denied consent, invalid state, provider error, and missing code must return a controlled auth failure/redirect without creating a user, account, session, or Astralyn product record.
- Automated tests use isolated request/database doubles or Better Auth test seams only. A live Google round trip is a manual smoke gate, not CI.

## 11. Secrets & Environment Matrix

| Value | Local | Preview | Production | Secret? | Storage |
| --- | --- | --- | --- | --- | --- |
| `DB` | Local Wrangler D1 binding | Dedicated confirmed preview binding | Existing `astralyn-db` binding | No | `apps/worker/wrangler.jsonc` binding metadata; never an environment variable |
| `BETTER_AUTH_SECRET` | Unique local value | Unique preview value | Unique production value | Yes | Local `.dev.vars`; Cloudflare secret store via repository-pinned Wrangler command |
| `BETTER_AUTH_URL` | `http://localhost:5173` | Exact confirmed preview origin | Exact confirmed production origin | No | Local `.dev.vars` or untracked local config; tracked Wrangler environment `vars` only after origin confirmation |
| `GOOGLE_CLIENT_ID` | Non-production client ID | Non-production/preview client ID | Production client ID | No, but deployment-specific | Local `.dev.vars`; tracked Wrangler environment `vars` only after user approval, or secret store if operational policy prefers |
| `GOOGLE_CLIENT_SECRET` | Non-production secret | Preview secret | Production secret | Yes | Local `.dev.vars`; Cloudflare secret store |
| Trusted origins | Local exact origin | Exact preview origin | Exact production origin | No | Derived from approved explicit configuration; never request headers or wildcards |

Rules:

- Required secrets are exactly `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET`. Required non-secret runtime configuration is `GOOGLE_CLIENT_ID`, explicit per-environment `BETTER_AUTH_URL`, and exact trusted origins when they are not derived from approved static config.
- `BETTER_AUTH_URL` must be explicit in every enabled environment. Do not infer it from the incoming request, proxy headers, or a fallback host. With the default auth base path, Google callbacks must resolve to `<BETTER_AUTH_URL>/api/auth/callback/google`.
- Do not put literal credentials or token-shaped examples in `.env.example`, Wrangler config, tests, fixtures, docs, logs, screenshots, commits, or chat.
- Production auth startup/request handling must return sanitized `503` behavior if DB or required auth configuration is absent; it must not use a development default secret or disable the provider.
- Local and remote secret commands must be package scripts or `pnpm --filter @astralyn/worker exec wrangler ...`; never bare `npx` and never command-line secret values.
- Secret rotation is a manual operation. Because OAuth tokens are encrypted with auth key material, the executor must verify the pinned Better Auth rotation guidance before rotating after real accounts exist.
- The current Wrangler file has no preview environment. Do not invent a preview database ID or origin. Add preview configuration only after the user supplies and approves those resources.

## 12. File Map

| File | Symbol / Area | Change | Reason |
| --- | --- | --- | --- |
| `package.json` | auth and validation scripts | Add repository-controlled schema generation/check and local auth smoke entry points | Avoid bare package-runner commands and make gates repeatable |
| `pnpm-lock.yaml` | resolved dependencies | Generated only by approved pnpm install | Reproducible pinned packages |
| `apps/worker/package.json` | dependencies/scripts | Add exact `better-auth@1.7.2` runtime dependency and exact `auth@1.7.2` dev CLI; expose pinned commands | Native D1 runtime and offline schema generation |
| `apps/worker/wrangler.jsonc` | vars/bindings/environments | Add only confirmed non-secret auth origins/client IDs and any user-provided preview binding | Explicit per-environment runtime configuration |
| `apps/worker/src/auth/schema-options.ts` | `AUTH_SCHEMA_OPTIONS` | **Create:** schema-affecting core configuration only | Keep runtime and CLI generation aligned |
| `apps/worker/src/auth/schema-config.ts` | tooling-only auth config | **Create:** Better Auth CLI entry without live D1 or credentials | Generate schema offline without fake runtime config |
| `apps/worker/src/auth/server.ts` | `createAuth`, env validation | **Create:** native D1 Better Auth factory, Google provider, session/security policy | Single production auth construction path |
| `apps/worker/src/auth/context.ts` | `AuthContext`, `resolveAuthContext` | **Create:** typed authenticated/anonymous/unavailable boundary | Reusable server identity seam for Phase 4 |
| `apps/worker/src/auth/index.ts` | public auth exports | **Create:** narrow server-auth module API | Prevent tooling/test internals leaking into production imports |
| `apps/worker/src/db/auth-schema.generated.ts` | generated auth tables | **Create via Better Auth CLI; never hand-edit** | Canonical Better Auth 1.7.2 Drizzle representation |
| `apps/worker/src/db/schema.ts` | Astralyn schema composition entrypoint | Compose/re-export only approved generated auth tables now; retain the entrypoint for separately owned future application schemas | Isolate generated auth output while keeping one Drizzle Kit schema entrypoint |
| `apps/worker/src/index.ts` | Worker routing and `Env` | Mount `/api/auth/*`, pass bindings, preserve auth responses | Expose Better Auth without product routes |
| `apps/worker/drizzle/migrations/*.sql` | first real migration | **Generated:** four-table auth migration | Version production D1 schema |
| `apps/worker/drizzle/migrations/meta/*` | Drizzle snapshots/journal | **Generated:** metadata for the auth migration | Deterministic drift/generation checks |
| `apps/worker/test/auth.test.ts` | route/session failure tests | **Create:** isolated Worker auth tests | Prove auth behavior without live Google or production identities |
| `apps/worker/test/auth-context.test.ts` | auth-context states | **Create:** typed boundary tests | Prove no fallback identity and distinguish unavailable from anonymous |
| `apps/worker/test/auth-test-helpers.ts` | test-only D1/auth doubles | **Create if needed:** synthetic auth data isolated under test | Deterministic tests without production reachability |
| `tools/check-auth-schema.ts` | schema drift checker | **Create:** compare pinned CLI output with committed generated schema | Prevent Better Auth/schema divergence |
| `tools/check-migrations.ts` | migration drift logic | Strengthen to fail on generated diff or missing artifacts | Make `db:check` a real blocking gate |
| `tools/check-production-data.ts` | Worker boundary rules | Extend import/dependency checks to `apps/worker/src` | Prevent test helpers, schema tooling config, and fake auth data from entering runtime |
| `.env.example` | variable names only | Document required names and local origins without values/secrets | Discoverable safe local setup |

Do not modify `apps/web/**`, `packages/shared/**`, `docs/d1/**`, canonical knowledge/assets, or product docs during Phase 3B unless a blocking compiler-owned type import makes a narrowly documented change unavoidable. Stop for approval before any such exception.

Dependency ownership is explicit: `better-auth@1.7.2` is Worker-only because this plan creates no browser client module. `apps/web/package.json` does not change. If a future implementation task imports `better-auth/client` or any Better Auth browser API, it must first revise this plan and add `better-auth@1.7.2` as a direct web dependency; a hoisted Worker dependency is never sufficient.

## 13. Implementation Tasks

### Task 1 — Pin the auth toolchain and repository commands

**Goal**

Make Better Auth and its schema CLI reproducible without choosing `latest` at execution time.

**Files**

`apps/worker/package.json`, `package.json`, `pnpm-lock.yaml`, `.env.example`.

**Changes**

- Under Node 24.19.x, add exact `better-auth@1.7.2` to Worker dependencies and exact `auth@1.7.2` to Worker devDependencies.
- Do not add `@better-auth/drizzle-adapter`; retain existing Drizzle versions unless peer resolution proves incompatible.
- Keep `better-auth` out of `apps/web/package.json`: Phase 3B has no browser auth client. If any planned implementation introduces `better-auth/client`, stop and revise dependency ownership instead of relying on workspace hoisting.
- Add root/Worker scripts for `auth:schema:generate` and `auth:schema:check`. Every invocation must resolve the workspace-pinned binary.
- Add variable names and safe comments to `.env.example`; no secret-shaped examples.

**Do not**

Install packages under another Node version, use a caret/range/`latest`, add a frontend auth dependency, or change production configuration.

**Validation**

`node --version`; `pnpm --version`; `pnpm install --frozen-lockfile`; inspect `pnpm why better-auth`; inspect the lockfile diff for only approved packages.

**Done when**

The pinned packages resolve under Node 24.19.x, scripts call local binaries, no adapter or unrelated dependency was introduced, and `apps/web` has no Better Auth import or dependency.

### Task 2 — Generate and approve the canonical auth schema

**Goal**

Create the four-table Drizzle representation from Better Auth itself.

**Files**

`apps/worker/src/auth/schema-options.ts`, `apps/worker/src/auth/schema-config.ts`, `apps/worker/src/db/auth-schema.generated.ts`, `apps/worker/src/db/schema.ts`, `tools/check-auth-schema.ts`.

**Changes**

- Define the approved schema options once, with no plugins/additional fields and explicit `account.identityStrategy: "provider-id"`.
- Configure the CLI-only offline generator and, from the Worker package directory, run workspace-pinned `auth generate --config ./src/auth/schema-config.ts --adapter drizzle --dialect sqlite --output ./src/db/auth-schema.generated.ts --yes` through the repository script.
- Commit generated output unchanged; re-export its tables from `schema.ts`.
- Implement a non-mutating drift check that generates into a temporary ignored location and byte/structure-compares normalized output.
- Verify exact core tables, generated issuer/accountId identity model and uniqueness, indexes, cascade behavior, and D1-compatible types.

**Do not**

Hand-write or patch generated fields, let the CLI overwrite `schema.ts`, copy `docs/d1` SQL, create a fake DB/secret/provider credential, duplicate schema options, or import the CLI config from production modules. If generated output needs customization, change Better Auth configuration and regenerate.

**Validation**

`pnpm auth:schema:generate`; `pnpm auth:schema:check`; `pnpm typecheck`; inspect the generated diff.

**Done when**

Exactly the current four core tables are generated at the isolated explicit path, `schema.ts` remains the composition entrypoint, a second check is clean, and production dependency traversal cannot reach `schema-config.ts`.

### Task 3 — Generate, review, and gate the first auth migration

**Goal**

Convert the approved auth schema into one committed Drizzle migration without applying it.

**Files**

`apps/worker/drizzle/migrations/*.sql`, `apps/worker/drizzle/migrations/meta/*`, `tools/check-migrations.ts`.

**Changes**

- Run the existing Drizzle generation path once.
- Harden `db:check` so clean regeneration cannot silently create/change migration output.
- Review all DDL against generated auth schema; confirm no product table, seed DML, credential, or historical SQL appears.
- Produce a human-readable migration summary for the user.

**Do not**

Apply locally/remotely, edit generated SQL to match memory, use Better Auth migration APIs, or use `drizzle-kit migrate`.

**Validation**

`pnpm db:generate`; `pnpm db:check`; repeat `pnpm db:generate`; `git diff --exit-code -- apps/worker/drizzle/migrations` after the approved generated artifacts are staged or otherwise compared against a clean baseline.

**Done when**

One deterministic migration contains only the four approved auth tables and `db:check` detects both missing and drifted artifacts.

**MANUAL GATE 1:** stop and obtain user approval of the generated schema and SQL before applying any migration.

### Task 4 — Prove local migration lifecycle

**Goal**

Verify Wrangler can apply and track the auth migration on a fresh local D1.

**Files**

No production source change expected; test/check files only if evidence exposes a defect.

**Changes**

- Apply through the existing `db:migrate:local` script to a fresh local Phase 3A database.
- Inspect Wrangler's applied migration list and D1 schema.
- Repeat application and prove no duplicate DDL/data occurs.
- Run negative checks for missing migration files and schema/migration drift through isolated test workspaces, never by corrupting committed artifacts.
- Keep migration and auth persistence tests within D1's native statements/`batch()` contract; do not construct an interactive transaction test harness that production D1 cannot satisfy.

**Do not**

Apply remotely, use the production database, delete user data, or invoke any other migration executor.

**Validation**

`pnpm db:migrate:local`; repository-pinned `wrangler d1 migrations list astralyn-db --local`; `pnpm db:migrate:local`; `pnpm db:check`; `pnpm auth:schema:check`.

**Done when**

Fresh apply succeeds, repeated apply is a no-op, four tables/indexes match the migration, and negative checks fail closed.

### Task 5 — Build the production Worker auth route

**Goal**

Serve Better Auth through native D1 with explicit production configuration and secure response handling.

**Files**

`apps/worker/src/auth/server.ts`, `apps/worker/src/auth/index.ts`, `apps/worker/src/index.ts`, `apps/worker/wrangler.jsonc` only for user-confirmed non-secret values.

**Changes**

- Validate `DB`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` before constructing auth.
- Consume the shared schema options, then pass `env.DB` directly as the Better Auth database and add only runtime secret/base-URL/provider/trusted-origin configuration.
- Require explicit `BETTER_AUTH_URL` and derive the default Google callback consistently as `<BETTER_AUTH_URL>/api/auth/callback/google`.
- Apply approved session, origin, account-linking, OAuth-token-encryption, and native-D1 atomicity policy.
- Configure Google without offline access or extra product scopes.
- Route all methods under `/api/auth/*` to the handler before the 404 branch.
- Preserve all auth response headers/cookies and enforce `Cache-Control: no-store`; sanitize unexpected errors.

**Do not**

Add CORS, wildcard origins, request-inferred base URLs, placeholder credentials, development fallbacks, automatic migrations, interactive transaction assumptions, auth UI/browser client imports, or product records/routes.

**Validation**

`pnpm --filter @astralyn/worker typecheck`; `pnpm --filter @astralyn/worker test`; `pnpm --filter @astralyn/worker build`.

**Done when**

The catch-all works through the local `/api` proxy, configuration failure is explicit, and no auth response loses a cookie or becomes cacheable.

### Task 6 — Establish the typed authenticated identity seam

**Goal**

Give future Worker APIs one safe way to resolve identity without adding a product endpoint.

**Files**

`apps/worker/src/auth/context.ts`, `apps/worker/src/auth/index.ts`, `apps/worker/test/auth-context.test.ts`.

**Changes**

- Implement the discriminated `authenticated | anonymous | unavailable` result.
- Resolve sessions only through Better Auth and return readonly identity/session data.
- Normalize infrastructure/configuration failures to sanitized internal codes while preserving server diagnostics that contain no secret, cookie, token, or provider payload.

**Do not**

Return a nullable fake user, trust IDs from headers/body/query, add `/api/me`, or create profile/roster state.

**Validation**

`pnpm --filter @astralyn/worker test`; `pnpm --filter @astralyn/worker typecheck`.

**Done when**

Tests prove all three states are distinct and no failure path yields an authenticated identity.

### Task 7 — Add auth security and isolation regression tests

**Goal**

Prove route, session, cookie, provider-error, and test-boundary behavior without live external OAuth.

**Files**

`apps/worker/test/auth.test.ts`, `apps/worker/test/auth-test-helpers.ts` if needed, `tools/check-production-data.ts`, relevant existing tool tests.

**Changes**

- Cover the Auth Test Matrix and required cookie/origin/cache assertions.
- Keep synthetic users, tokens, OAuth responses, and D1 doubles under `apps/worker/test/**` only.
- Extend production-boundary validation to reject runtime imports from Worker tests, test helpers, and `schema-config.ts`.
- Prove production build/typecheck succeeds when test files and synthetic data are unavailable to its module graph.

**Do not**

Keyword-ban legitimate fixtures, import production secrets, make network calls, or weaken Phase 2.5 checks.

**Validation**

`pnpm --filter @astralyn/worker test`; `pnpm data:check`; `pnpm test:tools`; `pnpm build`.

**Done when**

All matrix cases pass deterministically and the dependency-boundary checker catches a deliberate isolated forbidden-import fixture while allowing test-only synthetic data.

### Task 8 — Complete manual environment and OAuth gates

**Goal**

Connect approved local, preview, and production resources without exposing credentials.

**Files**

`apps/worker/wrangler.jsonc` only for confirmed non-secret values; no tracked secret file.

**Changes**

- User creates/chooses OAuth clients, confirms origins, and registers exact callbacks.
- User writes local secrets to `.dev.vars` and uses the repository-pinned Wrangler binary to enter remote secrets interactively.
- Executor performs local success/cancel/logout/manual-cookie smoke tests.
- User explicitly approves and performs or supervises remote Wrangler migration application after reviewing the migration list and backup posture.

**Do not**

Receive secret values in chat, put them on a command line, create a fake provider, apply to an unknown D1 database, or continue through an unmet gate.

**Validation**

Local manual sign-in/cancel/logout evidence; repository-pinned `wrangler d1 migrations list astralyn-db --remote`; after approval only, `pnpm --filter @astralyn/worker db:migrate:remote`; re-list migrations and perform preview/production smoke tests.

**Done when**

Each environment uses its intended client/origin/secrets, remote migration history shows the approved migration once, and real Google sign-in/logout works without creating product data.

### Task 9 — Run closure gates and produce evidence

**Goal**

Demonstrate Phase 3B readiness without weakening previous phases.

**Files**

No new files unless an existing approved test/check requires a task-scoped correction.

**Changes**

- Run the complete Section 17 sequence under Node 24.19.x.
- Confirm only Phase 3B files changed, no generated canonical data changed, and no secrets are tracked.
- Report exact package versions, migration name/hash, remote application status, automated results, manual OAuth results, and all deferred work.

**Do not**

Fix unrelated failures, update product docs, add Phase 4 code, or declare completion with skipped gates.

**Validation**

Every Section 17 command plus all completed manual gates.

**Done when**

Every automated gate passes, required manual evidence exists, repository diff stays in scope, and a valid authenticated user still has zero Astralyn profile/roster state.

## 14. Migration Test Matrix

| Case | Setup | Expected evidence |
| --- | --- | --- |
| Fresh empty Phase 3A D1 | New local Wrangler D1 with zero application tables/migrations | Exactly one approved auth migration applies and creates only `user`, `session`, `account`, `verification` plus generated indexes |
| Auth migration generated | Run Better Auth schema generation, then Drizzle generation | Generated schema and SQL match reviewed Better Auth 1.7.2 output; no DML or product table |
| Generated schema isolation | Run the pinned CLI with the repository script | Output changes only `auth-schema.generated.ts`; `schema.ts` remains the hand-owned composition entrypoint and is never overwritten |
| Auth migration applied locally | Apply with Wrangler local script | Wrangler history records the migration once; introspection matches committed SQL |
| Repeated apply/idempotency | Run the same Wrangler apply again | No pending migration, duplicate object, or changed data |
| Missing migration | Isolated checker fixture removes a referenced migration | `db:check` fails non-zero before build/deploy |
| Migration drift | Isolated fixture changes schema or generated metadata | `auth:schema:check` or `db:check` fails non-zero with actionable paths |
| Historical SQL ignored | Keep `docs/d1/**` present while generating/checking | No import, invocation, generated table, or migration input resolves from `docs/d1/**` |
| Remote preflight | List migrations against confirmed database before apply | Target database identity and exactly one pending reviewed migration are visible; otherwise stop |

## 15. Auth Test Matrix

| Case | Expected behavior |
| --- | --- |
| No session | Resolver returns `anonymous`; no user/session/product record is invented |
| Valid session | Resolver returns `authenticated` with the persisted Better Auth user ID and session |
| Expired/revoked session | Resolver returns `anonymous`; stale cookie cannot authenticate |
| Invalid/tampered cookie | Controlled anonymous/auth error response, fresh fixation-resistant lifecycle, no database identity creation |
| Provider callback failure/cancel | Controlled failure/redirect; no partial user/account/session and no leaked provider details |
| Invalid OAuth state/origin | Request rejected; CSRF/origin checks remain enabled |
| D1 unavailable | Auth route/resolver returns sanitized unavailable/503 behavior, never guest authentication |
| Missing DB binding | Explicit configuration failure; no in-memory database fallback |
| Unconfigured provider/secret/base URL | Explicit configuration failure; production does not start/serve fake-disabled auth |
| Successful sign-in route contract | Separate secure cookie headers, `no-store`, expected callback destination; automated test uses isolated doubles, not Google |
| Logout/revocation | Database session is revoked and cookie expires; replay remains anonymous |
| Account linking | Same email from an unlinked identity is not implicitly merged |
| Native D1 atomicity | Multi-statement auth behavior uses the native adapter's D1 `batch()` contract; no test requires an unsupported interactive transaction callback |
| No fake fallback identity | Every injected database/provider/config failure produces anonymous/unavailable, never an authenticated synthetic user |
| Production/test isolation | Production module graph cannot import test helper, synthetic token/user, or schema CLI config |

Automated tests must not require live Google OAuth or production credentials. Synthetic auth records are allowed only inside `apps/worker/test/**` and must be unreachable from `apps/worker/src/**`.

## 16. Security Review

- **Secret leakage:** scan tracked diffs for secret names with values, tokens, cookies, OAuth payloads, `.dev.vars`, and account data. Error/log tests must prove redaction.
- **Cookie settings:** assert HttpOnly, HTTPS Secure, SameSite Lax, host-only scope, expected path, expiry, separate `Set-Cookie`, and `no-store`. Do not relax settings for preview.
- **CSRF:** keep Better Auth origin and Fetch Metadata protections. Do not enable any skip flag.
- **Redirect/origin validation:** exact `BETTER_AUTH_URL`, exact callbacks, narrow explicit trusted origins, and no user-controlled post-auth external redirect.
- **SQL safety:** native Better Auth prepared D1 queries only. No interpolated session/user identifiers and no ad hoc auth SQL outside generated migrations/checks.
- **Atomicity model:** rely only on native D1 statements and `batch()` behavior used by Better Auth. Do not add a transaction shim or accept tests that pass only with an interactive transaction implementation unavailable in production.
- **Session fixation:** Better Auth creates/rotates tokens; application code never accepts a caller-selected session token.
- **OAuth state/PKCE:** keep defaults and the `verification` table. Reject missing, expired, replayed, or mismatched state.
- **Account linking:** use provider-scoped identity and disable implicit same-email linking. Explicit linking is deferred.
- **OAuth token storage:** encrypt stored provider tokens and avoid offline access/additional scopes. Do not expose tokens to the web client.
- **Error sanitization:** external responses distinguish anonymous/unavailable without stack traces, SQL, bindings, cookie/token values, provider bodies, or secrets. Internal diagnostics use stable codes and redacted context.
- **Availability/limits:** one session resolution per protected request; no unnecessary D1 fan-out or transaction-dependent plugins.
- **Production data integrity:** no seeded production users, demo sessions, default Trailblazer identity, fake OAuth response, or auto-created product record.

## 17. Validation Sequence

Run from repository root in PowerShell under exactly Node 24.19.x. Every line is a blocking gate; stop on first failure. Commands added by this plan do not exist until their corresponding task is complete.

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm auth:schema:check
pnpm db:check
pnpm data:check
pnpm assets:check
pnpm knowledge:build
git diff --exit-code -- apps/web/public/data
pnpm knowledge:check
pnpm knowledge:benchmark
pnpm test:tools
pnpm --filter @astralyn/worker test
pnpm test
pnpm build
pnpm test:e2e
git diff --check
git status --short --untracked-files=all
```

The executor must confirm `node --version` is `v24.19.x` and pnpm is `>=10` before dependency or generated-file work. `knowledge:build` is allowed to run only as a reproducibility check; the following `git diff` gate proves it did not alter canonical output. Do not run remote migration or deployment as part of this automated sequence.

## 18. Manual Actions / Gates

Execution must stop at each applicable gate:

1. **Environment confirmation, before tracked Wrangler environment changes:** user supplies exact preview and production application origins, confirms same-origin `/api`, and confirms whether a separate preview D1 exists. User also approves the exact non-secret ownership for `GOOGLE_CLIENT_ID`, explicit `BETTER_AUTH_URL`, and trusted origins. If deployment is cross-origin, stop and redesign; do not add permissive CORS.
2. **Schema/migration approval, after Task 3:** user reviews the isolated generated Better Auth schema, explicit `provider-id` issuer/accountId model, and complete first migration SQL. No local or remote application before approval.
3. **Google credentials, before live Task 8 tests:** user creates/selects separate non-production and production Google OAuth web clients, configures consent/test users if needed, and registers the exact local/preview/production callback URIs. Credential values are never sent to the executor/chat.
4. **Secret configuration:** user creates unique Better Auth secrets, writes local values to `.dev.vars`, and enters preview/production `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET` interactively through the repository-pinned Wrangler binary. User also supplies approved client IDs/base URLs through the selected non-secret configuration channel.
5. **Remote migration approval:** user confirms target Cloudflare account/database, acceptable backup/recovery posture, and output of the remote migration list. Then and only then may `db:migrate:remote` run.
6. **Live OAuth acceptance:** user completes real sign-in, denied/cancel, and logout checks in preview and production; confirms no profile/roster data was created.

Never continue by inventing a domain, D1 ID, credential, user, provider response, or fallback configuration.

## 19. Risks

- **Generated schema/runtime drift:** native D1 runtime does not consume Drizzle models. Mitigation: one schema-options module, pinned CLI, committed output, and a blocking schema drift check.
- **CLI/runtime configuration divergence:** a tooling-only Better Auth config can omit a future schema-affecting plugin. Mitigation: no plugins in Phase 3B, shared schema options, explicit regeneration rule, and stop on unexpected output.
- **Native-D1/Drizzle decision supersedes historical prose:** D-019 mentions the adapter. Mitigation: record this evidence-based decision here and defer broader docs synchronization; do not silently combine integrations.
- **D1 transaction/throughput limits:** future plugins may require unsupported interactive transactions or add query fan-out. Mitigation: core auth only and native D1 batch behavior.
- **Origin/cookie mismatch:** local proxy, preview, and production hosts can differ. Mitigation: explicit same-origin base URLs, exact callbacks, manual environment gate, and cookie assertions.
- **Remote migration irreversibility/data loss:** first production auth DDL becomes durable. Mitigation: review, list, backup/recovery gate, Wrangler-only execution, and local repetition first.
- **Identity strategy becomes durable:** changing provider identity/linking after real accounts exist can duplicate or merge identities. Mitigation: pin `provider-id`, disable implicit linking, and require a later migration/security decision before change.
- **Encrypted token key rotation:** losing/rotating key material can make stored OAuth tokens unreadable. Mitigation: secret custody and verify official rotation procedure before post-launch rotation.
- **Fixed dependency versions age:** pinning improves reproducibility but does not provide security updates. Mitigation: upgrade in a separately reviewed task with regenerated schema/migration diff.
- **Unknown preview resources:** the current repo has no confirmed preview origin or D1 binding. Mitigation: mandatory user gate; no invented environment.

## 20. Deferred Findings

- Phase 4 owns profile preferences, HSR UID, roster, Eidolons, onboarding persistence, and any foreign key from product tables to generated `user.id`.
- The automatic profile creation described in `docs/05-AUTH_ONBOARDING.md` is not Phase 3B behavior. A user with auth rows and no product rows is valid.
- Sign-in/onboarding UI and frontend auth-client state are deferred to Phase 4 unless the roadmap is separately revised.
- Explicit account-linking UX, multiple providers, email/password, passkeys, recovery, account deletion, admin/RBAC, and audit UI require later product/security decisions.
- Cross-origin API deployment, cross-subdomain cookies, secondary session storage, cookie cache, and offline Google API scopes are not justified now.
- Broader updates to D-019 and stale auth/data-model docs are documentation follow-up after implementation evidence exists, not part of code execution.
- Phase 5+ recommendation, OCR, DU, and gameplay work remains untouched.

## 21. Definition of Done

- [ ] Node 24.19.x and pnpm >=10 are used for every dependency/generation/validation command.
- [ ] `better-auth` and `auth` are pinned to verified 1.7.2 releases; no Drizzle adapter package is installed.
- [ ] `better-auth@1.7.2` is a direct Worker dependency only; `apps/web` contains no Better Auth client import and does not rely on workspace hoisting.
- [ ] Better Auth native D1 is the only auth runtime database integration.
- [ ] Exactly `user`, `session`, `account`, and `verification` are generated from current Better Auth configuration.
- [ ] Fresh-database account configuration explicitly sets `identityStrategy: "provider-id"`; the CLI-generated issuer/accountId columns and indexes are unmodified.
- [ ] Pinned CLI generation writes explicitly to `apps/worker/src/db/auth-schema.generated.ts` and never overwrites `apps/worker/src/db/schema.ts`.
- [ ] CLI generation requires no `env.DB`, live D1 connection, production secret, or fake credential, while runtime and CLI consume the same schema-affecting options.
- [ ] No Phase 4/product table, product route, profile, roster, or fake identity is created.
- [ ] Drizzle Kit generates the committed SQL and Wrangler alone applies/tracks it.
- [ ] Better Auth automatic migrations, `drizzle-kit migrate`, ad hoc DDL, and historical `docs/d1` SQL are unused.
- [ ] Schema and migration drift checks fail closed and pass on a clean regeneration.
- [ ] `/api/auth/*` preserves all cookies, rejects missing configuration, and is explicitly non-cacheable.
- [ ] Session cookies, lifetime, refresh, CSRF, origins, OAuth state, account linking, and token encryption match Sections 9 and 16.
- [ ] Auth persistence and tests use native D1/`batch()` semantics without assuming interactive transactions.
- [ ] Typed auth context distinguishes authenticated, anonymous, and unavailable without a fallback identity.
- [ ] Synthetic auth data remains test-only and cannot enter the production module graph/bundle.
- [ ] Automated tests cover every required auth and migration matrix case without live Google access.
- [ ] User-approved local, preview, and production configuration contains no tracked secret.
- [ ] User-approved remote migration is applied exactly once through Wrangler.
- [ ] Manual Google success/cancel/logout tests pass and create no Astralyn product data.
- [ ] Every Section 17 gate passes and previous Phase 2/2.5/3A gates remain intact.
- [ ] No Phase 4 feature is implemented.

## 22. Executor Handoff

**Target:** Gemini 3.7 Flash High.

Read first, in order:

1. `CONTEXT.md`
2. `docs/internal/PHASE-3B-BETTER-AUTH-IDENTITY.md`
3. `docs/internal/PHASE-3A-D1-DRIZZLE-FOUNDATION.md`
4. `docs/03-ARCHITECTURE.md`, `docs/05-AUTH_ONBOARDING.md`, `docs/11-SECURITY_HARNESS.md`, `docs/12-TESTING_STRATEGY.md`, `docs/14-DECISIONS.md`
5. Root and Worker `package.json`, `apps/worker/wrangler.jsonc`, `apps/worker/drizzle.config.ts`
6. `apps/worker/src/index.ts`, all `apps/worker/src/db/**`, all Worker tests
7. `tools/check-migrations.ts`, `tools/check-production-data.ts`

Execute Tasks **1 through 9 exactly in order**. Stop after Task 3 for Manual Gate 1; stop before any environment configuration, live OAuth, or remote D1 operation for the relevant Section 18 gate. Run each task's validation before moving forward. If generated Better Auth 1.7.2 output differs materially from this plan, repository/runtime APIs win: stop, show the diff, and request architecture approval rather than editing generated output.

File restrictions:

- Allowed only when named by the relevant task in Section 12/13.
- Forbidden without new approval: `apps/web/**`, `packages/shared/**`, `docs/d1/**`, `apps/web/public/data/**`, source knowledge/assets, unrelated docs, and any Phase 4+ file/table/route.
- `apps/web/package.json` must remain unchanged because Phase 3B contains no Better Auth browser client. If an executor proposes `better-auth/client`, stop, revise this plan, and add the exact package directly to the web package rather than consuming a hoisted Worker dependency.
- Never edit `auth-schema.generated.ts`, migration SQL, or Drizzle migration metadata by hand.
- Never commit `.dev.vars`, `.env*` values, Cloudflare/Google credentials, session cookies, OAuth tokens, user records, or deployment tokens.
- Preserve unrelated user changes. Stop if an allowed file already contains overlapping uncommitted work.

Migration restrictions:

- Generation: shared schema-affecting config -> Worker-local pinned `auth@1.7.2` binary running `auth generate --config ./src/auth/schema-config.ts --adapter drizzle --dialect sqlite --output ./src/db/auth-schema.generated.ts --yes` -> `apps/worker/src/db/schema.ts` composition -> existing Drizzle Kit generate.
- Execution/history: existing Wrangler scripts only.
- Forbidden: Better Auth `migrate`, `getMigrations`, `runMigrations`, `drizzle-kit migrate`, runtime DDL, dashboard/manual SQL, and `docs/d1/**` SQL.
- Runtime atomicity: native D1 prepared statements/`batch()` only; no interactive transaction shim or test requirement.

Stop conditions:

- Node is not 24.19.x; a new/unapproved dependency or version change appears necessary; Better Auth's pinned API/schema differs materially; offline schema generation requires a fabricated secret/DB/provider; the CLI cannot target the isolated generated-schema path; generated tables or SQL appear to require manual patching; native D1 cannot support the approved config or requires interactive transaction semantics; a browser client becomes necessary; production/test boundaries cannot be proven; an exact origin/D1 target/credential is missing; only fake data could unblock a path; a Phase 4 table/route is required; a gate fails for an unexplained reason; remote target or recovery posture is uncertain; or unrelated user work would be overwritten.

Final validation is the exact Section 17 sequence, followed by the approved remote migration list and manual OAuth evidence. Do not claim completion for skipped commands or gates.

Final executor report must state: changed files; pinned dependency versions; generated auth tables; migration filename/hash and local/remote status; automated command results; cookie/origin/session security evidence; manual OAuth results; confirmation of no secrets/fake identity/product data/Phase 4 work; risks; and deferred items.

---

## 20. Local Implementation & Smoke Verification Closure

- **Local Better Auth + D1 Integration:** Complete. Pinned to `better-auth@1.7.2` using native Cloudflare D1 runtime (`database: env.DB`) and shared canonical database field mappings in `apps/worker/src/auth/schema-options.ts`.
- **Baseline Migration:** `apps/worker/drizzle/migrations/0000_high_shape.sql` (SHA-256: `EE11D93857E58596AE3C895674D6122AC6A261452B5EF2B4E111FD92EF0F06AE`).
- **Core Tables (4 only):** `user`, `session`, `account`, `verification`. Zero Phase 4 tables or product data created.
- **Local OAuth Smoke Results:**
  - Google login: PASS
  - Session persistence: PASS (verified against Worker `:8787` and Vite proxy `:5173`)
  - Logout / session revocation: PASS (session row deleted in D1, subsequent requests return 200 null)
  - Cancel / deny: PASS (clean 302 redirect, no session created, table counts unchanged)
  - Branding observation: Google Cloud Console OAuth consent screen currently named "Lumina" (marked for manual rename to "Astralyn").
- **Verification Gates:** `pnpm auth:schema:check` (PASS), `pnpm db:check` (PASS), `pnpm --filter @astralyn/worker test` (20/20 PASS), `pnpm --filter @astralyn/web test` (100/100 PASS), `pnpm typecheck` (PASS), `pnpm lint` (PASS), `pnpm data:check` (PASS), `git diff --check` (PASS).
- **Deferred Production Scope:** Because Astralyn is in active development with no deployed production environment, production deployment gates (production application origin, production Google OAuth client credentials, remote secrets via `wrangler secret put`, remote D1 migration execution, and remote OAuth smoke) are deferred to the pre-release deployment gate (Phase 9).
- **Phase 4 Handoff:** Local development for Phase 4 (Authentication, Onboarding & User State) is unblocked and ready to proceed using the verified local Better Auth + D1 foundation.
