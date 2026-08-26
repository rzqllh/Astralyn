# Astralyn — Product Requirements Document

## 1. Product overview

Astralyn is a personalized Honkai: Star Rail assistant that combines official game mechanics and patch knowledge, the user's actual character roster, multi-source editorial recommendations, deterministic team/build/content scoring, screenshot OCR for fast in-game decisions, and optional free-tier AI for explanation or fallback only.

The product is designed for players who want a trustworthy answer quickly without repeatedly searching several guide sites or re-explaining account context to a chatbot.

## 2. Product goals

### Primary goals

1. Make recommendations that respect the user's roster.
2. Keep factual game knowledge current with the latest official patch.
3. Show transparent provenance for builds, teams and character rankings.
4. Produce concise Top 1–3 recommendations rather than long unranked lists.
5. Work on a free-first architecture.
6. Let screenshot-based workflows function without requiring a paid vision API.
7. Keep the assistant useful even when optional AI providers are unavailable.

### Secondary goals

- Reduce repeated setup by remembering roster and preferences.
- Make game-mode decisions faster, starting with Divergent Universe.
- Make source disagreement visible instead of silently hiding it.
- Allow Astralyn to combine strong parts of several source recommendations into one verdict.

## 3. Target users

### Primary persona

A regular HSR player who owns a mixed roster, wants direct recommendations, checks build/team guides, plays endgame or roguelike content, and values “best available for my account” more than theoretical whale teams.

### Secondary persona

A newer player who wants clear build priority, best teammates from available characters, and understandable explanations without advanced theorycraft jargon.

## 4. Core modules

### Home
- current patch / knowledge freshness;
- roster readiness;
- recent recommendations;
- resume active DU run;
- quick character/team/content search.

### Roster
- view owned characters;
- filter by Path, element, rarity, level;
- edit level and Eidolon;
- optional Light Cone/build metadata later;
- persistent edits live under Settings after onboarding.

### Characters
Each character page may contain overview, kit/abilities, trace priority, Eidolons, Best Light Cones Top 1–3, Best Relic + Planar combinations Top 1–3, Best Builds, Best Teams Top 1–3, Best Teammates, gameplay notes, source comparison, and Astralyn Verdict.

### Best Characters
Contextual rankings by patch, role, archetype and game mode. A ranking always exposes patch and source freshness.

### Teams
- Best Team From My Roster;
- Best Team Around Character X;
- Best Team for a stage;
- alternatives when key units are missing;
- Top 1–3 with role breakdown and reasons.

### Content Advisor
Initial categories: General, Divergent Universe, Memory of Chaos, Pure Fiction, Apocalyptic Shadow. Limited-event support comes later.

### Assistant
Screenshot-first entry point for roster screenshots, stage/enemy screenshots, and Divergent Universe choice screenshots. Results include recognized context, ranked options, brief reasoning, and correction when OCR/entity matching is wrong.

### Settings
- My Roster;
- language;
- display preferences;
- OCR preferences;
- source visibility;
- optional AI fallback toggle;
- account management.

## 5. Onboarding

1. Sign up / log in.
2. Confirm language.
3. Select owned characters.
4. Optional: set levels/Eidolons.
5. Confirm roster.
6. Enter Astralyn Home.

Rules:
- onboarding is incomplete until roster selection is confirmed;
- optional build details may be skipped;
- roster is editable later from Settings;
- recommendations must handle incomplete roster metadata gracefully.

## 6. Recommendation presentation

Every editorial recommendation page separates:

### Source recommendations
- Source A: Top 1–3
- Source B: Top 1–3
- Source C: Top 1–3

### Astralyn Verdict
One final recommendation generated from source consensus, official mechanics, current context, roster availability, and deterministic scoring. The verdict may combine compatible components from multiple sources.

The UI shows result, confidence, short reasons, patch, source freshness and alternatives.

## 7. Divergent Universe assistant

Tracked run state:
- difficulty/protocol;
- party;
- owned/trial status;
- Mask;
- Equations;
- Blessings by Path;
- Curios / Miracles;
- current plane;
- prior selections.

Supported choice screens:
- Mask;
- Equation;
- Blessing;
- Curio;
- event choice;
- domain/zone choice;
- rewards.

Expected response normally fits one mobile viewport:

**Pick: X**

Why:
- one or two decisive reasons.

Not Y/Z:
- one short reason each.

## 8. Knowledge freshness

Astralyn displays current official game version, knowledge version, and last verified timestamp.

Game facts are never updated by user prompts.

If current-patch ingestion is incomplete, show a stale-data warning, avoid unsupported “latest” claims, and retain the last known published snapshot.

## 9. AI behavior

AI is optional.

AI may rewrite reason codes into natural language, summarize source disagreement, and help when OCR confidence is low if a free-tier provider is enabled.

AI may not be the only source of factual mechanics, directly change canonical knowledge, overwrite provenance, or silently invent an unsupported build/team/effect.

If AI is unavailable, deterministic recommendation output remains available.

## 10. MVP success criteria

Product:
- user finishes onboarding and saves roster;
- character pages expose 3-source comparison when data exists;
- Astralyn Verdict returns a grounded recommendation with reason codes;
- Team Recommender returns Top 1–3 from owned roster;
- DU assistant remembers run state;
- screenshot OCR recognizes curated HSR UI fixtures with acceptable accuracy;
- core app requires no paid API calls.

Quality:
- no client-side path mutates canonical Game Knowledge;
- every published recommendation has patch metadata;
- regression fixtures cover key team/build cases;
- UI works on common desktop and mobile widths.
