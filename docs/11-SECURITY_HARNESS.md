# Astralyn — Security Harness

## Core boundary

Only trusted ingestion/admin processes can mutate canonical Game Knowledge.

```text
User prompt          READ ONLY
OCR result           READ ONLY
Recommendation       READ ONLY
Normal client        READ ONLY game knowledge

Trusted ingestion    WRITE
Trusted publisher    WRITE
Authorized admin     CONTROLLED WRITE
```

## Access and Execution Boundaries

### 1. Browser Client (Untrusted)
- Reads published public knowledge exclusively from static immutable JSON snapshots (`/data/<version>/...`).
- Accesses user data strictly via authenticated Cloudflare Worker API endpoints (`/api/...`).
- Transmits Better Auth session cookies over HTTPS.
- Has zero direct database connection credentials or direct D1 access.
- Cannot mutate Game Knowledge, source snapshots, or consensus caches under any condition.

### 2. Cloudflare Worker API (Application Enforcement Boundary)
- Authenticates session using Better Auth (`auth(env).api.getSession({ headers })`).
- Extracts verified `session.user.id` on every protected endpoint.
- **Worker-Level Authorization Invariant:** All D1 queries for user data are strictly scoped to the authenticated `session.user.id`.
- Rejects any client request attempting to supply `user_id` in body/query parameters to claim ownership of another user's data.

### 3. Trusted CI / Ingestion / Admin
- Can ingest, validate, write canonical D1 tables, and build static release snapshots.
- Executes via GitHub Actions or privileged Worker script using encrypted secrets (`PUBLISH_SECRET` / Cloudflare API Token).
- Never exposes privileged publishing credentials to browser bundles.

## Worker-Level Authorization Invariants (Replacing DB RLS)

Since Cloudflare D1 / SQLite does not provide PostgreSQL-style Row Level Security (RLS), **authorization is strictly enforced as an application-level invariant at the Cloudflare Worker layer**.

```text
HTTP Request
     ↓
Better Auth Session Extraction (auth.api.getSession)
     ↓ Valid Session?
  [No]  → 401 Unauthorized
  [Yes] → Extract session.user.id
     ↓
Route Handler (e.g. GET /api/roster)
     ↓
D1 Query with Bound Parameter (SELECT ... WHERE user_id = ?)
     ↓
Return Scoped User Data
```

### Invariant Rules:
1. **Never Trust Client-Supplied Identity:** `user_id` is always derived from `session.user.id`, never from `req.body.user_id` or `req.query.user_id`.
2. **Parameterized Queries Only:** All queries use D1 prepared statements with parameter binding (`.bind(session.user.id, ...)`). Raw string concatenation in SQL is strictly prohibited.
3. **Canonical Table Isolation:** No public API endpoint exists that executes `INSERT`, `UPDATE`, or `DELETE` on canonical game tables (`game_characters`, `character_knowledge`, `du_entities`, `recommendation_sets`, `consensus_results`).
4. **Ownership Verification Before Mutations:** Modifying sub-resources (such as `saved_teams` or `saved_team_members`) validates that `saved_teams.user_id = session.user.id` before executing the mutation.

## Prompt injection containment

Text from screenshots, guide pages and community content is untrusted data.

Explanation AI never receives service secrets, DB write tools, publishing actions or ingestion credentials.

It receives a closed structured object such as:

```json
{
  "verdict": "...",
  "reasonCodes": ["..."],
  "sources": [{"name": "...", "rank": 1}]
}
```

## Publication

Published knowledge releases are immutable.

Corrections create another release and move the manifest pointer. This enables rollback and prevents silent history rewriting.

## Screenshot privacy

Default screenshots are processed locally and not persisted.

If optional cloud fallback is enabled, clearly disclose that the image is sent to the selected provider and do not include unrelated local/account secrets.

## Source ingestion security

Adapters use:
- strict source allowlist;
- timeouts;
- response size limits;
- parser validation;
- no arbitrary user-supplied URL fetching;
- no source-provided code execution.

## Secrets
 
Server / CI secret store (Wrangler / GitHub Actions Secrets):
- `BETTER_AUTH_SECRET` (session encryption key);
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`;
- `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID` (CI D1 migration and deployment);
- `PUBLISH_SECRET` (internal ingestion publish authorization);
- optional AI provider API keys (isolated server-side).
 
Client:
- public application configuration only;
- no secret API keys or database tokens in the client bundle.
 
## Audit
 
Record ingestion job, source snapshot hashes, parser version, publish actor/job, knowledge release and rollback.
 
## Abuse limits
 
Keep OCR client-side. Avoid public unauthenticated expensive endpoints. If an optional server AI endpoint is enabled, enforce per-user rate limits and a hard free-tier ceiling.
