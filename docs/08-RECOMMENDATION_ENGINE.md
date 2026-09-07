# Astralyn — Recommendation Engine

## Goal

Produce reproducible Top 1–3 recommendations that can be tested, explained and used without an LLM.

## Inputs

Depending on request:
- official mechanics;
- user roster and character metadata;
- roles and mechanic tags;
- explicit synergy rules;
- team archetype;
- enemy/stage;
- game mode;
- source recommendations;
- DU run state.

## Team recommendation scope

`POST /api/recommendations/teams` requires one explicit scope:

- `all_characters`: defines availability from the full canonical release (92 characters in Version 4.5). Authentication is optional. It does not make all 92 characters simultaneous scoring candidates: the bounded prefilter below selects the eligible scoring subset. Actual owned progression is attached to matching characters for authenticated users and remains available to existing progression-aware scoring rules. Canonical-only characters remain `isOwned: false` and do not receive fabricated level or Eidolon values.
- `owned_only`: builds candidates only from the authenticated user's persisted roster. An unauthenticated request is rejected. An authenticated empty roster returns `status: "insufficient_roster"` with no teams.

The endpoint only reads roster state. Recommendation generation never inserts or updates ownership data.

## Bounded candidate evaluation

Team scoring is preceded by a deterministic candidate bound:

1. Deduplicate candidates and sort IDs with the D-028 code-unit comparator.
2. Pin an explicit focus character so every evaluated team can include that character.
3. Prefer characters with complete Astralyn role/mechanic taxonomy. A character marked `unknown` enters when explicitly focused. Other limited-taxonomy characters enter only when complete candidates cannot fill the remaining team slots (four without focus, three with focus).
4. Keep at most 16 candidates, then run D-028 scoring over their 4-character combinations. D-028 weights and composite formula stay unchanged; incomplete-taxonomy members cannot supply unsupported high-energy-consumer evidence for the existing battery synergy.

There is no random sampling and no runtime role or mechanic-tag inference. In the current release, canonical scope contains all 92 characters and all 92 have evidence-backed recommendation taxonomy. The unanchored scoring candidate pool is still only the deterministic, code-unit-ordered subset selected by the 16-candidate prefilter; it does not score all 92 characters simultaneously. An unanchored full-scope request therefore selects 16 candidates and evaluates `C(16, 4) = 1,820` teams. See [Phase 10C — Verified Character Taxonomy](./15-CHARACTER_TAXONOMY.md) for the per-character evidence matrix.

The original nine-character curated roster still produces its approved Top 3. Full-scope results can differ from the Phase 10B.1 release because verified candidate coverage expanded; the D-028 score weights and formula did not change.

The public contract exposes `evaluation.candidateCount`, `evaluation.evaluatedTeamCount`, `evaluation.maxCandidateCount`, and `evaluation.maxTeamEvaluations`.

- Maximum candidates: 16.
- Maximum unanchored evaluations: `C(16, 4) = 1,820`.
- Maximum focused evaluations: `C(15, 3) = 455`.

## Incomplete taxonomy

No current canonical character has `unknown` taxonomy. The fallback remains part of the engine contract for future or temporarily incomplete entries: a character whose `roles` or `mechanicTags` include `unknown` keeps that value, and no role/tag is inferred during prefiltering or scoring. A team containing one of these characters returns `taxonomyStatus: "limited_data"` plus `limitedDataCharacterIds`; the UI renders the established **Limited Data** state. Recommendation score and confidence remain separate concepts, and Astralyn does not claim high confidence from missing taxonomy.

## Core principle

LLM output is not a ranking primitive.

Ranking happens first. Optional AI only receives a grounded result object containing result, score, confidence, reason codes and source summary.

## Example tags

Mechanics:
- `memosprite`
- `hp_consumption`
- `break_effect`
- `super_break`
- `follow_up`
- `debuff`
- `dot`
- `energy_regen`
- `action_advance`
- `weakness_break_efficiency`

Roles:
- `hypercarry_dps`
- `sub_dps`
- `buffer`
- `debuffer`
- `shielder`
- `healer`
- `battery`
- `break_dps`

## Team score

Conceptual formula:

```text
team_score =
  role_coverage
+ mechanic_synergy
+ explicit_interactions
+ archetype_coherence
+ stage_match
+ game_mode_fit
+ availability_score
+ source_consensus
- anti_synergy_penalties
```

Weights live in versioned engine configuration, never scattered magic numbers.

## Availability

Owned: full availability.  
Trial allowed by selected mode: available with `trial` label.  
Unavailable: excluded from personalized “My Best Team”.

Theoretical meta pages may still show unavailable units but must label them.

## Explicit interactions

Generic tags are not enough for unique kits.

```json
{
  "id": "interaction.castorice.cyrene",
  "members": ["castorice", "cyrene"],
  "contexts": ["general"],
  "score": 24,
  "reasons": [
    "direct_character_synergy",
    "memosprite_support",
    "hp_fluctuation_support"
  ],
  "patchRange": {"from": "4.0"}
}
```

## Source consensus

For one candidate:

```text
consensus = Σ(rank_weight × freshness × trust × patch_compatibility)
```

Baseline rank weights: #1 1.00, #2 0.70, #3 0.45.

Normalize before blending with gameplay score.

## Astralyn Verdict

```text
source candidates
      ↓
normalize equivalents
      ↓
consensus score
      +
official-mechanics compatibility
      +
request context
      +
roster availability
      ↓
final candidate score
      ↓
Top 1–3
```

For builds, components may be recombined only if supported by source evidence or official mechanics and the combined build passes compatibility rules.

## Reason codes

Examples:
- `direct_character_synergy`
- `full_role_coverage`
- `best_owned_sustain`
- `source_consensus_strong`
- `stage_weakness_match`
- `game_mode_bonus`
- `equation_activation`
- `needed_path_progress`
- `low_synergy_dot`
- `duplicate_role`
- `skill_point_conflict`

Reason renderers handle language and brevity.

## Confidence

Confidence is separate from score.

A strong candidate can still have low confidence if source coverage is weak, patch compatibility is uncertain or user metadata is incomplete.

Conceptually:

```text
confidence =
  source_coverage
× source_agreement
× knowledge_freshness
× input_completeness
```

## DU scoring

Consider active team mechanics, Mask, Equations/activation requirements, Blessing counts by Path, Curios, current plane and survivability context when known.

Choice score includes immediate power, activation progress, long-run snowball, defensive need and opportunity cost.

Normal UI output: pick, why, why not alternatives.

## Versioning

Every recommendation records engine version, knowledge version, game patch and source-set identifiers.
