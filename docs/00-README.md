# Astralyn Documentation Pack

Status: Planning baseline  
Planning date: 2026-08-26  
Product: Astralyn — Honkai: Star Rail assistant  
Primary principle: free-first, source-grounded, roster-aware, deterministic at the core.

## Product thesis

Astralyn is a personalized Honkai: Star Rail assistant built around the user's actual roster. It helps users answer practical questions such as:

- What are the best characters right now?
- What is the best build for this character?
- What are the best 1–3 teams I can actually build?
- Which teammates are best for a selected character?
- What should I use for a specific stage or game mode?
- Which Divergent Universe option should I pick right now?
- What can Astralyn infer from a screenshot without requiring a paid vision API?

Divergent Universe is the first deep interactive game-mode implementation, not the identity of the product.

## Locked product decisions

1. App name: **Astralyn**.
2. Account is part of MVP personalization.
3. First-time onboarding asks the user to select owned characters.
4. Later roster changes happen in **Settings → My Roster**.
5. Core recommendation features must remain usable without a paid AI API.
6. Official game facts come from a trusted, patch-aware ingestion pipeline.
7. Prompting, OCR, and recommendation requests can never mutate canonical Game Knowledge.
8. Editorial recommendations show at least three independent sources when available.
9. Each source may expose its own Top 1–3.
10. Astralyn produces one **Astralyn Verdict** from source consensus + official mechanics + context.
11. Ranking logic is deterministic; AI may synthesize the explanation but must not be the sole ranking authority.
12. UI/UX should feel strongly native to Honkai: Star Rail's information hierarchy and presentation patterns while keeping Astralyn's own implementation, branding, and assets.
13. Divergent Universe screenshot guidance uses short answers: **pick X, why X, why not Y/Z**.

## Documentation map

- `01-PRD.md` — product requirements and user flows
- `02-MVP_SCOPE.md` — strict v0.1 boundary
- `03-ARCHITECTURE.md` — runtime, frontend, backend and deployment architecture
- `04-DATA_MODEL.md` — conceptual and relational data model
- `05-AUTH_ONBOARDING.md` — account creation and roster onboarding
- `06-DATA_INGESTION.md` — official patch-aware knowledge ingestion
- `07-SOURCE_POLICY.md` — recommendation source provenance and consensus policy
- `08-RECOMMENDATION_ENGINE.md` — scoring, confidence and Astralyn Verdict
- `09-OCR_PIPELINE.md` — screenshot processing and local OCR
- `10-DESIGN.md` — visual system and UX behavior
- `11-SECURITY_HARNESS.md` — write boundaries and prompt/AI isolation
- `12-TESTING_STRATEGY.md` — regression, OCR, source and E2E testing
- `13-ROADMAP.md` — staged delivery
- `14-DECISIONS.md` — ADR-lite decision log
- `d1/migrations/0001_initial.sql` — initial database schema / D1 migration baseline
- `templates/` — reusable ADR, source adapter, recommendation rule, fixture and design spec templates

## Non-goals for v0.1

Astralyn v0.1 is not a relic substat optimizer, HoYoLAB account scraper, warp tracker, achievement tracker, social network, general chatbot, or paid-API wrapper.

Those features can exist later only if the core assistant works first.
