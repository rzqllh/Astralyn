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

## Core principle

LLM output is not a ranking primitive.

Ranking happens first. Optional AI only receives a grounded result object containing result, score, confidence, reason codes and source summary.

## Example tags

Mechanics:
- `memosprite`
- `hp_fluctuation`
- `break`
- `super_break`
- `follow_up`
- `debuff`
- `dot`
- `energy`
- `skill_point_hungry`
- `action_advance`
- `weakness_implant`

Roles:
- `main_dps`
- `sub_dps`
- `amplifier`
- `debuffer`
- `sustain`
- `breaker`

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
