import { describe, it, expect } from "vitest";
import {
  CharacterKnowledgeSchema,
  LightConeKnowledgeSchema,
  RelicSetKnowledgeSchema,
  EnemyKnowledgeSchema,
  StageKnowledgeSchema,
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
  KnowledgeReleaseManifestSchema,
  RootKnowledgeManifestSchema,
  FactProvenanceSchema,
  CombatPathSchema,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  CANONICAL_GAME_VERSIONS,
} from "@astralyn/shared";

describe("Phase 2 Factual Integrity & Canonical Knowledge Acceptance", () => {
  it("accepts all 9 canonical character fixtures (8 Core + 1 Version 4.5 Elation fixture)", () => {
    expect(CANONICAL_CHARACTERS.length).toBe(9);
    for (const char of CANONICAL_CHARACTERS) {
      const parsed = CharacterKnowledgeSchema.safeParse(char);
      expect(parsed.success, `Character ${char.id} failed validation`).toBe(true);
      expect(char.provenance.authorityTier).toBe("tier_a_official");
    }
  });

  it("verifies CombatPath model includes all 9 official paths including Elation", () => {
    const paths = CombatPathSchema.options;
    expect(paths).toContain("Destruction");
    expect(paths).toContain("Hunt");
    expect(paths).toContain("Erudition");
    expect(paths).toContain("Harmony");
    expect(paths).toContain("Nihility");
    expect(paths).toContain("Preservation");
    expect(paths).toContain("Abundance");
    expect(paths).toContain("Remembrance");
    expect(paths).toContain("Elation");
    expect(paths.length).toBe(9);
  });

  it("verifies source-grounded character kit integrity and factual correctness", () => {
    // 1. Acheron (Slashed Dream / Crimson Knot, null maxEnergy)
    const acheron = CANONICAL_CHARACTERS.find((c) => c.id === "acheron");
    expect(acheron).toBeDefined();
    expect(acheron?.specialResourceType).toBe("Slashed Dream / Crimson Knot");
    expect(acheron?.baseStats.maxEnergy).toBeNull();
    expect(acheron?.path).toBe("Nihility");

    // 2. Castorice (Memosprite is Netherwing, not Polly)
    const castorice = CANONICAL_CHARACTERS.find((c) => c.id === "castorice");
    expect(castorice).toBeDefined();
    expect(castorice?.memosprite).toBeDefined();
    expect(castorice?.memosprite?.name).toBe("Netherwing");
    expect(castorice?.mechanicTags).toContain("memosprite");
    expect(castorice?.mechanicTags).toContain("hp_consumption");

    // 3. The Herta (Interpretation & Inspiration, not freeze synergy)
    const theHerta = CANONICAL_CHARACTERS.find((c) => c.id === "the-herta");
    expect(theHerta).toBeDefined();
    expect(theHerta?.path).toBe("Erudition");
    expect(theHerta?.mechanicTags).toContain("interpretation");
    expect(theHerta?.mechanicTags).toContain("inspiration");
    expect(theHerta?.mechanicTags).not.toContain("freeze");
    const enhancedSkill = theHerta?.abilities.find((a) => a.type === "enhanced_skill");
    expect(enhancedSkill?.name).toBe("Hear Me Out");

    // 4. Firefly (Complete Combustion & Super Break)
    const firefly = CANONICAL_CHARACTERS.find((c) => c.id === "firefly");
    expect(firefly).toBeDefined();
    expect(firefly?.transformation).toBeDefined();
    expect(firefly?.transformation?.stanceName).toBe("Complete Combustion");
    expect(firefly?.mechanicTags).toContain("super_break");

    // 5. Aventurine • Waveflair (Version 4.5 Elation character)
    const waveflair = CANONICAL_CHARACTERS.find((c) => c.id === "aventurine-waveflair");
    expect(waveflair).toBeDefined();
    expect(waveflair?.path).toBe("Elation");
    expect(waveflair?.element).toBe("Quantum");
    expect(waveflair?.releaseVersion).toBe("4.5");
    expect(waveflair?.specialResourceType).toBe("Punchline / Fervor");
    expect(waveflair?.mechanicTags).toContain("elation");
    expect(waveflair?.mechanicTags).toContain("punchline");
    expect(waveflair?.mechanicTags).toContain("fervor");
  });

  it("accepts all 9 representative light cone fixtures including Elation signature", () => {
    expect(CANONICAL_LIGHT_CONES.length).toBe(9);
    for (const lc of CANONICAL_LIGHT_CONES) {
      const parsed = LightConeKnowledgeSchema.safeParse(lc);
      expect(parsed.success, `Light cone ${lc.id} failed validation`).toBe(true);
      expect(lc.provenance.authorityTier).toBe("tier_a_official");
    }

    const elationLC = CANONICAL_LIGHT_CONES.find((lc) => lc.id === "flame-of-carnival");
    expect(elationLC).toBeDefined();
    expect(elationLC?.path).toBe("Elation");
    expect(elationLC?.releaseVersion).toBe("4.5");
  });

  it("accepts all representative relic set fixtures (Cavern Relics & Planar Ornaments)", () => {
    expect(CANONICAL_RELICS.length).toBe(6);
    const cavernRelics = CANONICAL_RELICS.filter((r) => r.type === "cavern_relic");
    const planarOrnaments = CANONICAL_RELICS.filter((r) => r.type === "planar_ornament");

    expect(cavernRelics.length).toBe(3);
    expect(planarOrnaments.length).toBe(3);

    for (const r of CANONICAL_RELICS) {
      const parsed = RelicSetKnowledgeSchema.safeParse(r);
      expect(parsed.success, `Relic ${r.id} failed validation`).toBe(true);
      expect(r.provenance.authorityTier).toBe("tier_a_official");
    }
  });

  it("accepts all representative enemy and stage fixtures with rotation temporality", () => {
    expect(CANONICAL_ENEMIES.length).toBe(4);
    for (const enemy of CANONICAL_ENEMIES) {
      const parsed = EnemyKnowledgeSchema.safeParse(enemy);
      expect(parsed.success).toBe(true);
      expect(enemy.provenance.authorityTier).toBe("tier_a_official");
    }

    expect(CANONICAL_STAGES.length).toBe(4);
    for (const stage of CANONICAL_STAGES) {
      const parsed = StageKnowledgeSchema.safeParse(stage);
      expect(parsed.success).toBe(true);
      expect(stage.rotationId).toBeDefined();
      expect(stage.rotationId.length).toBeGreaterThan(0);
      expect(stage.provenance.authorityTier).toBe("tier_a_official");
    }
  });

  it("accepts all representative Divergent Universe entities with correct Path grounding", () => {
    expect(CANONICAL_DU_BLESSINGS.length).toBe(3);
    expect(CANONICAL_DU_EQUATIONS.length).toBe(2);
    expect(CANONICAL_DU_CURIOS.length).toBe(2);

    // Celestial Annihilation must be strictly Path of The Hunt
    const celestialAnnihilation = CANONICAL_DU_BLESSINGS.find(
      (b) => b.id === "celestial-annihilation"
    );
    expect(celestialAnnihilation).toBeDefined();
    expect(celestialAnnihilation?.path).toBe("Hunt");

    for (const b of CANONICAL_DU_BLESSINGS) {
      expect(DUBlessingKnowledgeSchema.safeParse(b).success).toBe(true);
    }
    for (const eq of CANONICAL_DU_EQUATIONS) {
      expect(DUEquationKnowledgeSchema.safeParse(eq).success).toBe(true);
    }
    for (const c of CANONICAL_DU_CURIOS) {
      expect(DUCurioKnowledgeSchema.safeParse(c).success).toBe(true);
    }
  });

  it("verifies game versions contract baseline is Version 4.5", () => {
    expect(CANONICAL_GAME_VERSIONS.length).toBeGreaterThan(0);
    const activeVersion = CANONICAL_GAME_VERSIONS.find((v) => v.isActive);
    expect(activeVersion).toBeDefined();
    expect(activeVersion?.versionNumber).toBe("4.5");
    expect(activeVersion?.title).toBe("To Roll the Stars in Astropolis");
  });
});

describe("Phase 2 Schema Rejection & Negative Tests", () => {
  it("rejects character with invalid element or path", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      element: "DarkMatter", // Invalid element
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects character with negative base stats", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      baseStats: {
        ...CANONICAL_CHARACTERS[0].baseStats,
        hp: -100, // Invalid negative HP
      },
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects character with missing eidolons (< 6 eidolons)", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      eidolons: CANONICAL_CHARACTERS[0].eidolons.slice(0, 4), // only 4 eidolons instead of 6
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects light cone with missing superimpositions (< 5 descriptions)", () => {
    const invalidLC = {
      ...CANONICAL_LIGHT_CONES[0],
      skill: {
        ...CANONICAL_LIGHT_CONES[0].skill,
        superimpositions: ["S1", "S2"], // only 2 instead of 5
      },
    };
    const parsed = LightConeKnowledgeSchema.safeParse(invalidLC);
    expect(parsed.success).toBe(false);
  });

  it("rejects entity with missing or non-Tier A provenance", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      provenance: {
        sourceId: "fake_source",
        authorityTier: "invalid_tier", // not tier_a_official / tier_b / tier_c
        sourceUrl: "not_a_url",
        gameVersion: "1.0",
        verifiedAt: "2026-08-27",
      },
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);

    const provParsed = FactProvenanceSchema.safeParse(invalidChar.provenance);
    expect(provParsed.success).toBe(false);
  });

  it("rejects stage with missing rotationId", () => {
    const invalidStage = {
      ...CANONICAL_STAGES[0],
      rotationId: "", // empty rotation ID
    };
    const parsed = StageKnowledgeSchema.safeParse(invalidStage);
    expect(parsed.success).toBe(false);
  });

  it("rejects release manifest with missing required fields or invalid status", () => {
    const invalidManifest = {
      knowledgeVersion: "v1.0.0",
      gameVersion: "4.5",
      status: "unapproved_status", // invalid enum
      files: [],
      checksums: {},
    };
    const parsed = KnowledgeReleaseManifestSchema.safeParse(invalidManifest);
    expect(parsed.success).toBe(false);
  });

  it("rejects root manifest with missing availableReleases", () => {
    const invalidRoot = {
      currentKnowledgeVersion: "v1.0.0",
      gameVersion: "4.5",
      schemaVersion: "1.0.0",
      publishedAt: "2026-08-27T00:00:00Z",
      // missing availableReleases
      releases: {},
    };
    const parsed = RootKnowledgeManifestSchema.safeParse(invalidRoot);
    expect(parsed.success).toBe(false);
  });
});
