# Astralyn v0.1 — MVP Scope

## MVP statement

Astralyn v0.1 proves that a roster-aware, source-grounded HSR assistant can produce useful recommendations and screenshot guidance without requiring paid AI infrastructure.

## Must ship

### Account + onboarding
- account creation/login;
- first-run roster selection;
- onboarding completion state;
- roster editing from Settings.

### Roster
- owned character selection;
- level;
- Eidolon;
- owned/trial runtime flags for supported modes.

### Character knowledge
- overview;
- Path / element / rarity;
- skill/mechanic data required by the engine;
- Best Build;
- Best Team;
- Best Light Cone;
- Best Relic/Planar;
- source attribution.

### Recommendation sources
- target at least 3 independent sources per editorial category where legally/technically available;
- per-source Top 1–3;
- patch/freshness metadata;
- Astralyn Verdict.

### Team recommender
- best team from owned roster;
- character-focused team;
- Top 1–3;
- role labels;
- short reasons;
- unavailable-character handling.

### Divergent Universe
- active run creation;
- party;
- Mask;
- Equation;
- Blessings;
- Curios/Miracles;
- choice recommendation;
- run persistence.

### Screenshot assistant
- paste/upload screenshot;
- client-side OCR;
- entity matching;
- confidence;
- manual correction;
- recommendation handoff.

### Free-first infrastructure
- static client delivery / Cloudflare CDN;
- Cloudflare Workers + D1 database free tier;
- Better Auth with Google OAuth;
- no paid API dependency;
- optional free AI fallback is clearly optional.

## Should ship if schedule allows

- stage screenshot recognition;
- enemy weakness extraction;
- basic MoC/PF/AS contextual recommendation;
- PWA installability;
- offline access to last published knowledge snapshot;
- source disagreement visualization.

## Explicitly not v0.1

- relic substat optimizer;
- damage simulator;
- inventory/relic screenshot scanner;
- HoYoLAB credential/session scraping;
- automatic account sync;
- warp history;
- achievement tracker;
- social/community features;
- comments/leaderboards;
- general conversational chatbot;
- paid AI integration;
- server-side screenshot storage;
- real-time shared runs.

## Scope guard

A proposed feature enters v0.1 only if it materially improves roster-aware recommendations, source trust/freshness, screenshot/game-mode decisions, or validation of the core product. Otherwise it goes to the roadmap.
