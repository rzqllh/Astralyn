# Astralyn — Auth & Onboarding

## Goal

Capture the user's roster with as little friction as possible because roster context is the foundation of personalization.

## MVP auth policy

Primary launch provider:
- Google OAuth via **Better Auth** running on Cloudflare Workers.

Session management:
- Signed, secure HTTP-only cookies managed by Better Auth.
- Worker API verifies sessions via `auth(env).api.getSession({ headers })`.

Do not add email/password, magic links, or extra social providers in MVP.

## First-run state machine & profile provisioning

```text
SIGNED_OUT
  ↓
[Google OAuth Callback via Better Auth]
  ↓
AUTHENTICATED_UNONBOARDED
  ↓ (Worker ensures Astralyn `profiles` record exists via idempotent upsert)
ROSTER_SELECTION
  ↓
ROSTER_CONFIRMATION
  ↓ (PUT /api/onboarding/complete -> sets onboarding_completed_at)
READY (Astralyn Home)
```

### Profile Provisioning
Upon successful Better Auth callback, the application/Worker ensures a corresponding row in `profiles` exists for `user.id` (idempotent `INSERT OR IGNORE INTO profiles (user_id, preferred_language) VALUES (?, ?)`).

### Roster selection
- search;
- filter by Path/element;
- tap/select portraits;
- optional screenshot OCR accelerator;
- at least one selected character required.

### Roster confirmation
Show selected count and optional level/Eidolon edits, then `Finish setup`.

On confirmation:
- Worker receives authenticated roster payload;
- writes records to `user_roster` within a D1 batch/transaction;
- sets `profiles.onboarding_completed_at` timestamp.

## After onboarding

Roster editing path:
`Settings → My Roster`

Actions:
- add newly pulled character;
- remove mistaken entry;
- change level;
- change Eidolon.

Recommendation results should refresh after roster changes.

## Trial characters

Trial availability is contextual and must never be stored as permanent ownership.

```ts
type Availability =
  | { type: "owned" }
  | { type: "trial"; source: "divergent_universe" }
  | { type: "unavailable" };
```

## Account deletion

Deleting the account removes user profile, roster, saved teams/preferences and optional synced runtime data. It never touches public Game Knowledge.
