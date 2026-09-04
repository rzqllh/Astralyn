import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPathCompatibleLightCones,
  getRecommendedRelicSets,
  getCharacterTeammateSynergies,
} from "../src/builds";
import {
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
} from "../src/knowledge/fixtures/canonical-fixtures";

describe("Phase 6 Build & Synergy Association Helpers", () => {
  const acheron = CANONICAL_CHARACTERS.find((c) => c.id === "acheron")!;
  const firefly = CANONICAL_CHARACTERS.find((c) => c.id === "firefly")!;
  const castorice = CANONICAL_CHARACTERS.find((c) => c.id === "castorice")!;

  it("filters Path-Compatible Light Cones strictly by character path", () => {
    const nihilityCones = getPathCompatibleLightCones("Nihility", CANONICAL_LIGHT_CONES);
    assert.ok(nihilityCones.length > 0);
    for (const cone of nihilityCones) {
      assert.equal(cone.path, "Nihility");
    }

    // Verify deterministic sorting: rarity DESC, then id ASC
    for (let i = 0; i < nihilityCones.length - 1; i++) {
      const a = nihilityCones[i];
      const b = nihilityCones[i + 1];
      if (a.rarity === b.rarity) {
        assert.ok(a.id <= b.id);
      } else {
        assert.ok(a.rarity > b.rarity);
      }
    }
  });

  it("associates mechanically synergistic Relic & Planar sets without arbitrary fallbacks", () => {
    // Acheron: debuff / slashed dream
    const acheronRelics = getRecommendedRelicSets(acheron, CANONICAL_RELICS);
    const cavernIds = acheronRelics.cavernRelics.map((r) => r.id);
    const planarIds = acheronRelics.planarOrnaments.map((r) => r.id);
    assert.ok(cavernIds.includes("pioneer-diver"));
    assert.ok(planarIds.includes("izumo-gensei"));

    // Firefly: break_effect / super_break
    const fireflyRelics = getRecommendedRelicSets(firefly, CANONICAL_RELICS);
    const ffCavernIds = fireflyRelics.cavernRelics.map((r) => r.id);
    const ffPlanarIds = fireflyRelics.planarOrnaments.map((r) => r.id);
    assert.ok(ffCavernIds.includes("iron-cavalry"));
    assert.ok(ffPlanarIds.includes("forge-of-the-kalpagni-lantern"));

    // Artificial test character with no matching tags returns honest empty results (no arbitrary fallback)
    const dummyChar = {
      ...acheron,
      id: "dummy-test-character",
      element: "Physical" as const,
      path: "Abundance" as const,
      mechanicTags: ["unrelated_mechanic"],
    };
    const emptyRelics = getRecommendedRelicSets(dummyChar, CANONICAL_RELICS);
    assert.equal(emptyRelics.cavernRelics.length, 0);
    assert.equal(emptyRelics.planarOrnaments.length, 0);
  });

  it("evaluates kit synergy teammates as non-scoring mechanical associations", () => {
    // Acheron should have synergies with debuff inflictor teammates
    const acheronSynergies = getCharacterTeammateSynergies(acheron, CANONICAL_CHARACTERS);
    assert.ok(acheronSynergies.length > 0);
    const teammateIds = acheronSynergies.map((s) => s.teammateId);
    assert.ok(teammateIds.includes("aventurine") || teammateIds.includes("gallagher"));

    // Confirm no scoring delta property exists
    for (const s of acheronSynergies) {
      assert.equal("scoreDelta" in s, false);
      assert.ok(s.reasonCode);
      assert.ok(s.explanation);
    }

    // Firefly should have synergy with Gallagher (Break support)
    const fireflySynergies = getCharacterTeammateSynergies(firefly, CANONICAL_CHARACTERS);
    const ffGallagher = fireflySynergies.find((s) => s.teammateId === "gallagher");
    assert.ok(ffGallagher !== undefined);
    assert.equal(ffGallagher.reasonCode, "SYNERGY_SUPER_BREAK_CORE");

    // Castorice should synergize with Robin/Tingyun (Memosprite acceleration)
    const castoriceSynergies = getCharacterTeammateSynergies(castorice, CANONICAL_CHARACTERS);
    const robinSynergy = castoriceSynergies.find((s) => s.teammateId === "robin");
    assert.ok(robinSynergy !== undefined);
    assert.equal(robinSynergy.reasonCode, "SYNERGY_MEMOSPRITE_ACCEL");

    // Synergies are sorted deterministically by teammateId (lexical code-unit)
    for (let i = 0; i < castoriceSynergies.length - 1; i++) {
      assert.ok(castoriceSynergies[i].teammateId <= castoriceSynergies[i + 1].teammateId);
    }
  });
});
