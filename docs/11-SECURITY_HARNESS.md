# Astralyn: security boundaries

## Core rule

Browser input can read published knowledge and request recommendations. It cannot mutate canonical knowledge.

```text
browser and OCR input       read-only canonical knowledge
team and DU scoring         read-only canonical knowledge
authenticated user routes  scoped user-data writes
trusted release tooling     controlled knowledge publication
```

## Browser boundary

The web client receives public static JSON and public application configuration. It has no D1 credentials, OAuth client secret, Better Auth secret, or release-export secret.

Screenshots are processed in the browser. The current Worker API has no screenshot upload route.

## Worker authorization

Protected handlers resolve a Better Auth session and derive `session.user.id`. User identity is not accepted from request bodies or query parameters.

Every roster and saved-team query is scoped to that verified ID. D1 statements use parameter binding. Saved-team mutations verify ownership before reading or changing members.

Unauthenticated public access is limited to health and bounded `all_characters` recommendation behavior. `owned_only` requires a session.

## Recommendation safety

- Public requests select at most 16 candidates.
- Unanchored requests evaluate at most 1,820 teams.
- Focused requests evaluate at most 455 teams.
- Requests do not persist synthetic ownership.
- Invalid character IDs, duplicate team members, invalid slots, and malformed contexts are rejected.
- Unknown taxonomy cannot provide unsupported scoring evidence.

## Knowledge publication

Published files include hashes and schema metadata. The browser verifies raw bytes before parsing and caching. Invalid updates do not replace the previous valid cache.

`/api/_internal/export-release` fails closed without `INTERNAL_BUILDER_SECRET`. It is tooling infrastructure, not a browser feature.

The ingestion orchestrator is not currently configured with live production adapters. Enabling it requires source allowlists, response limits, timeouts, schema validation, and operator review.

## Secrets

Worker or release environments may require:

- `BETTER_AUTH_SECRET`;
- `BETTER_AUTH_URL`;
- `GOOGLE_CLIENT_ID`;
- `GOOGLE_CLIENT_SECRET`;
- `INTERNAL_BUILDER_SECRET`.

Cloudflare deployment credentials belong in the operator or CI secret store, not application source. Local Worker secrets belong in ignored `apps/worker/.dev.vars`.

## Logging

Do not log cookies, authorization headers, OAuth secrets, raw session tokens, or `.dev.vars` content. Operational errors returned to the browser must avoid exposing internal stack traces or secret names beyond actionable missing-configuration diagnostics.

## Deployment boundary

Production auth security is not proven by local tests alone. A live release must verify HTTPS, secure cookie behavior, exact trusted origins, OAuth callback registration, remote D1 migrations, cross-user isolation, and sanitized logs. See [Deployment](16-DEPLOYMENT.md).
