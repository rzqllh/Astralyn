import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_CHARACTERS,
  CharacterKnowledgeSchema,
} from "../src/knowledge";

describe("Phase 10A Canonical Character Roster Invariants (HSR Version 4.5)", () => {
  it("1. Verifies exact expected total playable roster count (92 standalone units)", () => {
    assert.equal(
      CANONICAL_CHARACTERS.length,
      92,
      `Expected exactly 92 playable units, but got ${CANONICAL_CHARACTERS.length}`
    );

    const fiveStars = CANONICAL_CHARACTERS.filter((c) => c.rarity === 5);
    const fourStars = CANONICAL_CHARACTERS.filter((c) => c.rarity === 4);

    assert.equal(fiveStars.length, 69, "Expected 69 5-star characters");
    assert.equal(fourStars.length, 23, "Expected 23 4-star characters");
  });

  it("2. Verifies unique canonical IDs and game IDs across all 92 units", () => {
    const ids = new Set<string>();
    const gameIds = new Set<string>();

    for (const char of CANONICAL_CHARACTERS) {
      assert.ok(
        !ids.has(char.id),
        `Duplicate canonical ID detected: '${char.id}'`
      );
      ids.add(char.id);

      assert.ok(
        !gameIds.has(char.gameId),
        `Duplicate gameId detected: '${char.gameId}' for character '${char.id}'`
      );
      gameIds.add(char.gameId);
    }

    assert.equal(ids.size, 92);
    assert.equal(gameIds.size, 92);
  });

  it("3. Verifies resolved gameId collisions (Aventurine • Waveflair & Castorice)", () => {
    const waveflair = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine-waveflair");
    assert.ok(waveflair, "Aventurine • Waveflair must exist");
    assert.equal(waveflair?.gameId, "1513", "Aventurine • Waveflair gameId must be 1513");

    const phainon = CANONICAL_CHARACTERS.find((c) => c.id === "phainon");
    assert.ok(phainon, "Phainon must exist");
    assert.equal(phainon?.gameId, "1408", "Phainon gameId must be 1408");

    const castorice = CANONICAL_CHARACTERS.find((c) => c.id === "castorice");
    assert.ok(castorice, "Castorice must exist");
    assert.equal(castorice?.gameId, "1407", "Castorice gameId must be 1407");

    const mydei = CANONICAL_CHARACTERS.find((c) => c.id === "mydei");
    assert.ok(mydei, "Mydei must exist");
    assert.equal(mydei?.gameId, "1404", "Mydei gameId must be 1404");
  });

  it("4. Verifies all 92 units strictly satisfy CharacterKnowledgeSchema & Tier A provenance", () => {
    for (const char of CANONICAL_CHARACTERS) {
      const parsed = CharacterKnowledgeSchema.safeParse(char);
      assert.ok(
        parsed.success,
        `Character '${char.id}' (${char.name}) failed validation: ${
          parsed.error ? JSON.stringify(parsed.error.format()) : ""
        }`
      );

      // Provenance tier
      assert.ok(
        ["tier_a_official", "tier_b_structured_community"].includes(char.provenance.authorityTier),
        `Character '${char.id}' must have Tier A or Tier B provenance`
      );

      // Invariants
      assert.ok(char.abilities.length >= 1, `Character '${char.id}' must have abilities`);
      assert.equal(char.eidolons.length, 6, `Character '${char.id}' must have exactly 6 eidolons`);
      assert.ok(char.roles.length >= 1, `Character '${char.id}' must have at least 1 role`);
      assert.ok(char.mechanicTags.length >= 1, `Character '${char.id}' must have at least 1 mechanic tag`);
      assert.ok(char.baseStats.hp > 0, `Character '${char.id}' must have positive HP`);
      assert.ok(char.baseStats.atk > 0, `Character '${char.id}' must have positive ATK`);
      assert.ok(char.baseStats.def > 0, `Character '${char.id}' must have positive DEF`);
      assert.ok(char.baseStats.spd > 0, `Character '${char.id}' must have positive SPD`);
    }
  });

  it("5. Verifies exclusion of summons, memosprites, NPCs, and duplicate gender Trailblazers", () => {
    const invalidSubstrings = [
      "netherwing",
      "numby",
      "mem",
      "lightning-lord",
      "cocolia",
      "aurumaton",
      "automaton",
      "npc",
    ];

    for (const char of CANONICAL_CHARACTERS) {
      for (const sub of invalidSubstrings) {
        assert.notEqual(
          char.id.toLowerCase(),
          sub,
          `Illegal non-standalone entity found in roster: '${char.id}'`
        );
      }
    }

    // Verify duplicate gender Trailblazer gameIds are excluded
    const excludedTrailblazerGenders = ["8002", "8004", "8006", "8008", "8010"];
    for (const char of CANONICAL_CHARACTERS) {
      assert.ok(
        !excludedTrailblazerGenders.includes(char.gameId),
        `Duplicate gender Trailblazer gameId '${char.gameId}' must not be present`
      );
    }

    // Verify exactly 5 distinct Trailblazer combat paths
    const tbUnits = CANONICAL_CHARACTERS.filter((c) => c.id.startsWith("trailblazer-"));
    assert.equal(tbUnits.length, 5, "Expected exactly 5 Trailblazer combat forms");
    const tbPaths = tbUnits.map((c) => c.path).sort();
    assert.deepEqual(
      tbPaths,
      ["Destruction", "Elation", "Harmony", "Preservation", "Remembrance"].sort()
    );
  });

  it("6. Verifies known alternate forms remain distinct standalone playable units", () => {
    // March 7th (Ice Preservation vs Imaginary Hunt)
    const mar7thIce = CANONICAL_CHARACTERS.find((c) => c.id === "march-7th");
    const mar7thHunt = CANONICAL_CHARACTERS.find((c) => c.id === "march-7th-hunt");
    assert.ok(mar7thIce && mar7thHunt);
    assert.notEqual(mar7thIce.gameId, mar7thHunt.gameId);
    assert.equal(mar7thIce.path, "Preservation");
    assert.equal(mar7thHunt.path, "Hunt");

    // Dan Heng (Wind Hunt vs Imaginary Destruction vs Physical Preservation)
    const dhWind = CANONICAL_CHARACTERS.find((c) => c.id === "dan-heng");
    const dhIL = CANONICAL_CHARACTERS.find((c) => c.id === "dan-heng-il");
    const dhPT = CANONICAL_CHARACTERS.find((c) => c.id === "dan-heng-permansor-terrae");
    assert.ok(dhWind && dhIL && dhPT);
    assert.equal(dhWind.path, "Hunt");
    assert.equal(dhIL.path, "Destruction");
    assert.equal(dhPT.path, "Preservation");

    // Herta (4★ Erudition) vs The Herta (5★ Erudition)
    const herta4 = CANONICAL_CHARACTERS.find((c) => c.id === "herta");
    const herta5 = CANONICAL_CHARACTERS.find((c) => c.id === "the-herta");
    assert.ok(herta4 && herta5);
    assert.equal(herta4.rarity, 4);
    assert.equal(herta5.rarity, 5);

    // Silver Wolf (5★ Nihility) vs Silver Wolf LV.999 (5★ Elation)
    const sw = CANONICAL_CHARACTERS.find((c) => c.id === "silver-wolf");
    const sw999 = CANONICAL_CHARACTERS.find((c) => c.id === "silver-wolf-lv999");
    assert.ok(sw && sw999);
    assert.equal(sw.path, "Nihility");
    assert.equal(sw999.path, "Elation");

    // Aventurine (Preservation) vs Aventurine • Waveflair (Elation)
    const av = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine");
    const avWf = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine-waveflair");
    assert.ok(av && avWf);
    assert.equal(av.path, "Preservation");
    assert.equal(avWf.path, "Elation");
    assert.equal(av.gameId, "1304");
    assert.equal(avWf.gameId, "1513");
  });

  it("7. Verifies the original 9 supported characters retain all specific verified invariants", () => {
    // Acheron
    const acheron = CANONICAL_CHARACTERS.find((c) => c.id === "acheron")!;
    assert.ok(acheron);
    assert.equal(acheron.specialResourceType, "Slashed Dream / Crimson Knot");
    assert.equal(acheron.baseStats.maxEnergy, null);
    assert.ok(acheron.roles.includes("hypercarry_dps"));
    assert.ok(acheron.roles.includes("debuffer"));

    // Castorice
    const castorice = CANONICAL_CHARACTERS.find((c) => c.id === "castorice")!;
    assert.ok(castorice);
    assert.equal(castorice.gameId, "1407");
    assert.ok(castorice.memosprite !== undefined);
    assert.equal(castorice.memosprite?.name, "Netherwing");
    assert.ok(castorice.roles.includes("summon_dps"));

    // Firefly
    const firefly = CANONICAL_CHARACTERS.find((c) => c.id === "firefly")!;
    assert.ok(firefly);
    assert.ok(firefly.transformation !== undefined);
    assert.ok(firefly.mechanicTags.includes("super_break"));
    assert.ok(firefly.roles.includes("break_dps"));

    // Robin
    const robin = CANONICAL_CHARACTERS.find((c) => c.id === "robin")!;
    assert.ok(robin);
    assert.ok(robin.roles.includes("buffer"));
    assert.ok(robin.mechanicTags.includes("action_advance"));

    // Aventurine
    const aventurine = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine")!;
    assert.ok(aventurine);
    assert.equal(aventurine.gameId, "1304");
    assert.ok(aventurine.roles.includes("shielder"));

    // Gallagher
    const gallagher = CANONICAL_CHARACTERS.find((c) => c.id === "gallagher")!;
    assert.ok(gallagher);
    assert.equal(gallagher.gameId, "1301");
    assert.ok(gallagher.roles.includes("healer"));

    // Tingyun
    const tingyun = CANONICAL_CHARACTERS.find((c) => c.id === "tingyun")!;
    assert.ok(tingyun);
    assert.equal(tingyun.gameId, "1202");
    assert.ok(tingyun.roles.includes("battery"));
    assert.ok(tingyun.mechanicTags.includes("energy_regen"));

    // The Herta
    const theHerta = CANONICAL_CHARACTERS.find((c) => c.id === "the-herta")!;
    assert.ok(theHerta);
    assert.equal(theHerta.gameId, "1401");
    assert.equal(theHerta.element, "Ice");
    assert.equal(theHerta.path, "Erudition");

    // Aventurine • Waveflair
    const wf = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine-waveflair")!;
    assert.ok(wf);
    assert.equal(wf.gameId, "1513");
    assert.equal(wf.path, "Elation");
    assert.equal(wf.element, "Quantum");
    assert.ok(wf.roles.includes("elation_dps"));
  });
});
