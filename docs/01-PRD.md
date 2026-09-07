# Astralyn: product requirements

## Document role

This file records the product contract. It distinguishes the current local MVP from later product direction. For a runnable feature matrix, use the root [README](../README.md).

## Product statement

Astralyn helps Honkai: Star Rail players inspect canonical character data, manage an owned roster, build deterministic teams, and make Divergent Universe choices without requiring a paid AI service.

The product favors traceable inputs and concise results. It must not present missing editorial coverage, incomplete knowledge, or synthetic ownership as verified game guidance.

## Users

- Players who want a team recommendation from their actual roster.
- Players who want to explore team options across the complete canonical character scope.
- Players making quick Divergent Universe choices from a screenshot or manual selection.
- Evaluators checking whether data provenance, recommendation bounds, and account isolation are explicit.

## Current user journeys

### Guest

1. Open the 92-character catalog.
2. Search and filter by Path, element, and rarity.
3. Open a character dossier and inspect kit provenance.
4. Request deterministic teams with `All Characters` scope.
5. Optionally focus the recommendation on one canonical character.
6. Configure a Divergent Universe party and target equation.
7. submit one to three manual or OCR-derived choices and commit the ranked result to local run state.

Guest mode does not create ownership records. `Owned Only` and `My Roster` require an authenticated user.

### Authenticated player

1. Sign in through Google OAuth.
2. Complete onboarding by selecting at least one owned character.
3. Add, edit, or remove roster entries from `/roster`.
4. Request `All Characters` or `My Roster` teams.
5. Save and manage four-character teams.
6. Sign out without losing public knowledge or local DU state.

An authenticated user may later remove every roster entry. `My Roster` then returns an explicit insufficient-roster result instead of substituting canonical characters.

## Functional requirements

### Knowledge

- Publish immutable, versioned static knowledge files.
- Verify downloaded bytes against release SHA-256 values before caching.
- Preserve a previously valid IndexedDB cache when an update is invalid.
- Keep source facts separate from Astralyn role and mechanic-tag mappings.
- Show limited or unavailable states instead of filling gaps with invented data.

### Recommendations

- Return reproducible Top 1 to 3 team results.
- Require an explicit `all_characters` or `owned_only` scope.
- Keep canonical availability separate from user ownership.
- Preserve a focused character in the candidate stage when a valid focus is provided.
- Bound candidate and combination evaluation before scoring.
- Keep score weights versioned and testable in `@astralyn/shared`.
- Emit reason codes and taxonomy state with each result.

### Account data

- Derive user identity from the Better Auth session, never request payload identity.
- Scope every roster and saved-team query to the authenticated user.
- Store roster progression only for characters the user explicitly owns.
- Reject unauthenticated writes.

### Divergent Universe

- Keep screenshot processing in the browser.
- Match OCR text only against canonical DU entities.
- Allow manual correction and fully manual selection.
- Rank one to three choices deterministically.
- Persist active run state locally and validate it during hydration.

## Product limits in this build

- The Content and Settings routes are placeholders.
- Production OAuth, remote D1, and a live public origin are not configured.
- Editorial multi-source comparison is unavailable in the public UI.
- Light cone, relic, enemy, stage, and DU datasets are representative subsets, not complete catalogs.
- Production-approved game artwork is not shipped.
- AI explanation providers are an architectural seam, not a required or active ranking dependency.

## Quality bar

- No paid API is required for core ranking.
- Public requests cannot trigger unbounded team enumeration.
- Repeated equivalent requests produce the same ordered results.
- Auth errors, empty roster, short roster, unavailable editorial data, offline cache, and failed OCR have explicit states.
- Primary routes remain usable with keyboard navigation and responsive layouts.
- Repository validation gates pass under Node 24.19.x before release.

## Non-goals

Astralyn is not currently a damage simulator, relic substat optimizer, HoYoLAB credential scraper, automatic account-sync service, warp tracker, achievement tracker, social network, or general chatbot.
