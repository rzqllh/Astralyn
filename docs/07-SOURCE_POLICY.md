# Astralyn: source and provenance policy

## Purpose

Astralyn keeps source facts, internal taxonomy, editorial opinion, and visual assets in separate evidence domains. A higher source tier does not turn an Astralyn-derived label into an official HoYoverse classification.

## Authority tiers

### Tier A: `tier_a_official`

Official HoYoverse material such as HoYoWiki, game notices, and official game text.

Suitable for character identity, Path, element, kit behavior, traces, Eidolons, resource behavior, and patch facts. Tier A may verify the facts used to map Astralyn taxonomy, but HoYoverse does not thereby endorse labels such as `hypercarry_dps`, `battery`, or `debuffer`.

### Tier B: `tier_b_structured_community`

Structured community repositories such as StarRailRes or game-data mappings.

Suitable for entity IDs, structured text, asset paths, and cross-reference work after validation. It is not treated as official balance or editorial authority.

### Tier C: `tier_c_editorial`

Independent build guides, theorycraft, and ranking sources.

Suitable for explicit editorial comparisons when patch compatibility and provenance are retained. Tier C never silently overwrites Tier A facts.

## Fact provenance

Canonical records retain:

- `sourceId`;
- `authorityTier`;
- `sourceUrl`;
- `gameVersion`;
- `verifiedAt`;
- optional notes describing scope or derivation.

Character taxonomy evidence separately stores the official kit fact used by Astralyn. Its note states that role and mechanic-tag labels are Astralyn mappings, not HoYoverse classifications. See [Character taxonomy](15-CHARACTER_TAXONOMY.md).

## Evidence rules

1. Use Path and element only as official metadata, not as sufficient proof of a gameplay role.
2. Do not assign taxonomy from a character name, release version, or an isolated keyword.
3. Require mechanical context such as who receives an effect, what triggers it, and what resource or action changes.
4. Keep uncertain taxonomy as `unknown` and surface Limited Data behavior.
5. Do not upgrade confidence merely because a record has many labels.
6. Do not claim current editorial consensus when the current release has no qualifying source set.

## Editorial policy

The product target is up to three independent editorial sources per supported comparison. Independence matters: a mirror of the same upstream is not another source.

When fewer suitable sources exist, display only what exists and label coverage as incomplete. In the current public UI, editorial comparison is unavailable. The deterministic team engine therefore does not present its output as third-party consensus.

Freshness vocabulary:

- `current`: reviewed for the active patch;
- `compatible`: older publication with mechanics still judged applicable;
- `stale`: needs review after relevant changes;
- `incompatible`: excluded because it conflicts with current facts.

## Visual asset policy

Source-code repository licenses do not grant copyright over underlying game artwork. Honkai: Star Rail artwork remains owned by COGNOSPHERE / HoYoverse.

Current repository behavior:

- 52 PNG records are stored under `apps/web/src/dev/game-assets/v1.0.0/`;
- every record is marked `manual_review`;
- development-only assets are excluded from the production bundle;
- production routes use Astralyn fallback silhouettes;
- the browser does not hotlink GitHub, wiki, or third-party asset hosts.

Any future production asset release must record its source, original URL where available, repository-license context, copyright owner, usage status, attribution, and checksum. This policy documents provenance handling and is not legal advice.

## Source operations

Automated access requires an explicit adapter, accepted URL boundary, parser fixtures, validation contract, rate limit, and terms review. Do not bypass anti-bot controls. If automation is unreliable or disallowed, use reviewed manual input with provenance.

The current repository has ingestion scaffolding but no configured live production adapters. See [Data ingestion](06-DATA_INGESTION.md).
