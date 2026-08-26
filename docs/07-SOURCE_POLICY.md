# Astralyn — Source & Provenance Policy

## Source classes

### Tier A — official factual
Examples: official HSR website and official HoYoLAB HSR updates/game information.

Use for patch version, mechanics, official names and release information.

### Tier B — established editorial
Recognized build/theorycraft guide services where ingestion/curation is permitted.

Use for builds, teams, Light Cone priority, Relics and tier opinions.

### Tier C — community evidence
Community guides, Reddit and creator/theorycrafter material.

Use for emergent strategy, DU-specific tricks and experience-based context.

Tier C never silently overrides Tier A mechanics.

## Recommendation display

Target at least three independent editorial sources where trustworthy/current data is available.

Each source exposes:
- source name;
- last update;
- patch;
- Top 1–3;
- optional short normalized notes.

If fewer than three suitable sources exist, show the available sources and label coverage incomplete. Do not invent a third source.

## Astralyn Verdict

Inputs:
- source ranks;
- freshness;
- trust weight;
- official mechanic compatibility;
- roster availability;
- game mode/stage context;
- engine rules.

The result may combine compatible components from multiple sources. The UI labels this clearly as an Astralyn-derived verdict.

## Consensus baseline

Initial rank weights:
- #1 = 1.00
- #2 = 0.70
- #3 = 0.45

Adjust by freshness, patch compatibility, source confidence and mechanic compatibility. All weights are regression-tested configuration.

## Freshness states

- current;
- compatible but older;
- stale;
- incompatible.

Do not merge incompatible patch recommendations without an explicit compatibility rule.

## Attribution

Every source-derived recommendation retains source identity.

Astralyn does not copy long guide text, hide sources, or present editorial opinions as official fact.

Store structured ranks, entities and short normalized notes instead of reproducing full pages.

## Access policy

Every automated source adapter has `terms_review_status`:
- approved;
- manual-only;
- blocked;
- review-needed.

A technically scrapeable page is not automatically approved for automated ingestion.

## Disagreement

If sources strongly disagree:
- lower confidence;
- surface disagreement;
- use mechanics/context to break ties;
- never pretend consensus exists.

## Best Characters

Ranking pages are contextual. Required dimensions where applicable: patch, role, game mode and assumptions.
