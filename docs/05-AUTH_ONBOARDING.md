# Astralyn: auth and onboarding

## Current policy

Google OAuth through Better Auth is the only account provider in the current build. Cloudflare D1 stores identity, profile, roster, and saved-team records.

Public knowledge, `All Characters` recommendations, and local DU tools do not require an account. `My Roster`, onboarding, roster persistence, and saved teams do.

## Local configuration

Run migrations before testing account flows:

```sh
pnpm db:migrate:local
```

Copy `.env.example` to `apps/worker/.dev.vars` and provide:

```text
BETTER_AUTH_SECRET=<development-only random secret>
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
```

The registered callback URI must be:

```text
http://localhost:5173/api/auth/callback/google
```

Wrangler reads `apps/worker/.dev.vars`. The file is ignored by Git and must never be committed.

## State transitions

```text
signed out
  | Google OAuth
  v
authenticated, onboarding incomplete
  | select at least one character and finish setup
  v
authenticated, ready
  | add, update, or remove entries at /roster
  v
authenticated roster, including a possible empty roster
```

Onboarding requires at least one initial selection. After onboarding, roster deletion may produce an empty roster. That is a valid account state; `owned_only` recommendations respond with `insufficient_roster` and do not borrow characters from the canonical pool.

## API ownership boundary

| Endpoint | Method | Session required |
| --- | --- | --- |
| `/api/auth/*` | Better Auth methods | Depends on method |
| `/api/me` | `GET` | Yes |
| `/api/onboarding/complete` | `PUT` | Yes |
| `/api/roster` | `GET`, `PUT` | Yes |
| `/api/roster/:characterId` | `DELETE` | Yes |
| `/api/saved-teams` | `GET`, `POST` | Yes |
| `/api/saved-teams/:id` | `GET`, `PUT`, `DELETE` | Yes |
| `/api/recommendations/teams` with `owned_only` | `POST` | Yes |

Handlers ignore client attempts to claim a different `user_id`. Identity comes from the verified session.

## Roster semantics

- Canonical character data describes what exists in the game snapshot.
- A roster record describes what the signed-in user explicitly saved.
- Level and Eidolon values belong only to saved roster records.
- Trial availability is contextual and must not be persisted as ownership.
- `all_characters` does not create, update, or imply roster ownership.

## Expected errors

- Missing Worker auth variables: account control reports auth configuration failure; guest surfaces remain usable.
- Missing or invalid session on protected endpoints: HTTP 401.
- Empty authenticated roster on `owned_only`: successful structured response with `status: "insufficient_roster"`.
- Fewer than four owned characters: the same insufficient-roster state.

Production sign-in remains unverified until a live HTTPS origin, remote secrets, remote D1 migrations, and the production OAuth callback are configured.

Account deletion is not implemented in the current UI or Worker API.
