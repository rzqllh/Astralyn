import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CharacterKnowledgeSchema } from "../src/knowledge/character";
import { FactProvenanceSchema } from "../src/knowledge/provenance";
import { CANONICAL_CHARACTERS_DATA } from "../src/knowledge/fixtures/canonical-characters";
import { CANONICAL_CHARACTERS } from "../src/knowledge/fixtures/canonical-fixtures";
import {
  CHARACTER_TAXONOMY_ENRICHMENTS,
  LAUNCH_AND_1X_TAXONOMY,
  TRAILBLAZER_TAXONOMY,
  VERSION_2X_TAXONOMY,
  VERSION_3X_TAXONOMY,
  VERSION_4X_AND_ALTERNATE_TAXONOMY,
} from "../src/knowledge/fixtures/character-taxonomy";

const ORIGINAL_CURATED_TAXONOMY = {
  acheron: {
    roles: ["hypercarry_dps", "debuffer"],
    mechanicTags: ["special_resource_cost", "debuff", "res_penetration", "aoe"],
  },
  aventurine: {
    roles: ["shielder", "sub_dps", "debuffer"],
    mechanicTags: [
      "shield",
      "follow_up",
      "stat_conversion",
      "debuff",
      "vulnerability",
      "bounce",
    ],
  },
  "aventurine-waveflair": {
    roles: ["elation_dps", "sub_dps"],
    mechanicTags: [
      "elation",
      "punchline",
      "fervor",
      "follow_up",
      "aoe",
      "single_target",
      "bounce",
    ],
  },
  castorice: {
    roles: ["summon_dps", "hypercarry_dps"],
    mechanicTags: [
      "memosprite",
      "summon",
      "hp_consumption",
      "action_advance",
      "single_target",
      "blast",
    ],
  },
  firefly: {
    roles: ["break_dps", "hypercarry_dps"],
    mechanicTags: [
      "super_break",
      "break_effect",
      "weakness_break_efficiency",
      "hp_consumption",
      "action_advance",
      "blast",
      "single_target",
    ],
  },
  gallagher: {
    roles: ["healer", "break_dps", "debuffer"],
    mechanicTags: [
      "heal",
      "break_effect",
      "debuff",
      "vulnerability",
      "action_advance",
      "enhanced_basic",
      "single_target",
      "aoe",
    ],
  },
  robin: {
    roles: ["buffer", "battery"],
    mechanicTags: [
      "action_advance",
      "energy_regen",
      "stat_conversion",
      "buff",
      "follow_up",
    ],
  },
  "the-herta": {
    roles: ["hypercarry_dps", "sub_dps"],
    mechanicTags: [
      "aoe",
      "interpretation",
      "inspiration",
      "enhanced_skill",
      "bounce",
      "stat_conversion",
    ],
  },
  tingyun: {
    roles: ["buffer", "battery"],
    mechanicTags: ["energy_regen", "buff", "stat_conversion", "single_target"],
  },
} as const;

describe("Phase 10C evidence-backed Astralyn taxonomy enrichment", () => {
  it("covers each of the 83 previously limited-data characters exactly once", () => {
    assert.equal(LAUNCH_AND_1X_TAXONOMY.length, 39);
    assert.equal(VERSION_2X_TAXONOMY.length, 14);
    assert.equal(VERSION_3X_TAXONOMY.length, 15);
    assert.equal(VERSION_4X_AND_ALTERNATE_TAXONOMY.length, 10);
    assert.equal(TRAILBLAZER_TAXONOMY.length, 5);
    assert.equal(CHARACTER_TAXONOMY_ENRICHMENTS.length, 83);

    const enrichmentIds = CHARACTER_TAXONOMY_ENRICHMENTS.map(
      (entry) => entry.characterId
    );
    assert.equal(new Set(enrichmentIds).size, 83);

    const previouslyLimitedIds = CANONICAL_CHARACTERS_DATA.filter(
      (character) =>
        character.roles.includes("unknown") ||
        character.mechanicTags.includes("unknown")
    ).map((character) => character.id);
    assert.deepEqual(enrichmentIds.toSorted(), previouslyLimitedIds.toSorted());
  });

  it("requires official current-patch provenance and explainable evidence for every assignment", () => {
    const sourceIds = new Set<string>();

    for (const entry of CHARACTER_TAXONOMY_ENRICHMENTS) {
      assert.ok(entry.evidence.length >= 40, `${entry.characterId} needs specific evidence`);
      assert.ok(!entry.roles.includes("unknown"));
      assert.ok(!entry.mechanicTags.includes("unknown"));
      assert.equal(entry.provenance.authorityTier, "tier_a_official");
      assert.equal(entry.provenance.gameVersion, "4.5");
      assert.match(
        entry.provenance.sourceUrl,
        /^https:\/\/wiki\.hoyolab\.com\/pc\/hsr\/entry\/\d+$/
      );
      const sourceEntityId = entry.provenance.sourceId.match(
        /^hoyowiki_character_(\d+)$/
      )?.[1];
      const urlEntityId = entry.provenance.sourceUrl.match(/\/entry\/(\d+)$/)?.[1];
      assert.ok(sourceEntityId);
      assert.equal(sourceEntityId, urlEntityId);
      assert.match(entry.provenance.verifiedAt, /^\d{4}-\d{2}-\d{2}T/);
      FactProvenanceSchema.parse(entry.provenance);
      assert.ok(!sourceIds.has(entry.provenance.sourceId));
      sourceIds.add(entry.provenance.sourceId);
    }
  });

  it("publishes only the taxonomy attached to the evidence records", () => {
    const publishedById = new Map(
      CANONICAL_CHARACTERS.map((character) => [character.id, character])
    );

    for (const entry of CHARACTER_TAXONOMY_ENRICHMENTS) {
      const published = publishedById.get(entry.characterId);
      assert.ok(published);
      assert.deepEqual(published.roles, entry.roles);
      assert.deepEqual(published.mechanicTags, entry.mechanicTags);
    }
  });

  it("publishes taxonomy provenance separately from the generated entity provenance", () => {
    const arlan = CANONICAL_CHARACTERS.find((character) => character.id === "arlan");
    assert.ok(arlan);
    const published = arlan as unknown as {
      taxonomyEvidence?: {
        evidence: string;
        provenance: { authorityTier: string; sourceUrl: string };
      };
    };

    assert.ok(published.taxonomyEvidence);
    assert.ok(published.taxonomyEvidence.evidence.includes("Skill spends Arlan's HP"));
    assert.equal(
      published.taxonomyEvidence.provenance.authorityTier,
      "tier_a_official"
    );
    assert.equal(
      published.taxonomyEvidence.provenance.sourceUrl,
      "https://wiki.hoyolab.com/pc/hsr/entry/11"
    );
    assert.equal(arlan.provenance.authorityTier, "tier_b_structured_community");
    CharacterKnowledgeSchema.parse(arlan);
  });

  it("preserves the original curated role and mechanic-tag arrays exactly", () => {
    for (const [id, expected] of Object.entries(ORIGINAL_CURATED_TAXONOMY)) {
      const published = CANONICAL_CHARACTERS.find((character) => character.id === id);
      assert.ok(published);
      assert.deepEqual(published.roles, expected.roles);
      assert.deepEqual(published.mechanicTags, expected.mechanicTags);
      assert.equal(
        CHARACTER_TAXONOMY_ENRICHMENTS.some((entry) => entry.characterId === id),
        false
      );
    }
  });

  it("keeps representative assignments tied to explicit kit mechanics instead of Path", () => {
    const byId = new Map(
      CHARACTER_TAXONOMY_ENRICHMENTS.map((entry) => [entry.characterId, entry])
    );

    assert.deepEqual(byId.get("arlan")?.roles, ["hypercarry_dps"]);
    assert.ok(byId.get("arlan")?.mechanicTags.includes("hp_consumption"));
    assert.deepEqual(byId.get("black-swan")?.roles, ["dot_dps", "debuffer"]);
    assert.ok(byId.get("aglaea")?.mechanicTags.includes("memosprite"));
    assert.ok(byId.get("sparxie")?.mechanicTags.includes("elation"));
    assert.ok(
      byId.get("trailblazer-preservation")?.mechanicTags.includes("shield")
    );
  });
});
