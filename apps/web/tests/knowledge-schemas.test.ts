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

describe("Phase 2 Canonical Knowledge Schemas & Fixture Acceptance", () => {
  it("accepts all 8 canonical character fixtures", () => {
    expect(CANONICAL_CHARACTERS.length).toBe(8);
    for (const char of CANONICAL_CHARACTERS) {
      const parsed = CharacterKnowledgeSchema.safeParse(char);
      expect(parsed.success).toBe(true);
    }
  });

  it("verifies character archetype variety (Castorice memosprite, Firefly stance, Acheron special resource)", () => {
    const acheron = CANONICAL_CHARACTERS.find((c) => c.id === "acheron");
    expect(acheron).toBeDefined();
    expect(acheron?.specialResourceType).toBe("Slashed Dream / Crimson Knot");
    expect(acheron?.baseStats.maxEnergy).toBeNull();

    const castorice = CANONICAL_CHARACTERS.find((c) => c.id === "castorice");
    expect(castorice).toBeDefined();
    expect(castorice?.memosprite).toBeDefined();
    expect(castorice?.memosprite?.name).toBe("Polly");

    const firefly = CANONICAL_CHARACTERS.find((c) => c.id === "firefly");
    expect(firefly).toBeDefined();
    expect(firefly?.transformation).toBeDefined();
    expect(firefly?.transformation?.stanceName).toBe("Complete Combustion");
  });

  it("accepts all representative light cone fixtures", () => {
    expect(CANONICAL_LIGHT_CONES.length).toBe(8);
    for (const lc of CANONICAL_LIGHT_CONES) {
      const parsed = LightConeKnowledgeSchema.safeParse(lc);
      expect(parsed.success).toBe(true);
    }
  });

  it("accepts all representative relic set fixtures (Cavern Relics & Planar Ornaments)", () => {
    expect(CANONICAL_RELICS.length).toBe(6);
    const cavernRelics = CANONICAL_RELICS.filter((r) => r.type === "cavern_relic");
    const planarOrnaments = CANONICAL_RELICS.filter((r) => r.type === "planar_ornament");

    expect(cavernRelics.length).toBe(3);
    expect(planarOrnaments.length).toBe(3);

    for (const r of CANONICAL_RELICS) {
      const parsed = RelicSetKnowledgeSchema.safeParse(r);
      expect(parsed.success).toBe(true);
    }
  });

  it("accepts all representative enemy and stage fixtures", () => {
    expect(CANONICAL_ENEMIES.length).toBe(4);
    for (const enemy of CANONICAL_ENEMIES) {
      const parsed = EnemyKnowledgeSchema.safeParse(enemy);
      expect(parsed.success).toBe(true);
    }

    expect(CANONICAL_STAGES.length).toBe(4);
    for (const stage of CANONICAL_STAGES) {
      const parsed = StageKnowledgeSchema.safeParse(stage);
      expect(parsed.success).toBe(true);
    }
  });

  it("accepts all representative Divergent Universe entities", () => {
    expect(CANONICAL_DU_BLESSINGS.length).toBe(3);
    expect(CANONICAL_DU_EQUATIONS.length).toBe(2);
    expect(CANONICAL_DU_CURIOS.length).toBe(2);

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

  it("verifies game versions contract", () => {
    expect(CANONICAL_GAME_VERSIONS.length).toBeGreaterThan(0);
    const activeVersion = CANONICAL_GAME_VERSIONS.find((v) => v.isActive);
    expect(activeVersion).toBeDefined();
    expect(activeVersion?.versionNumber).toBe("3.0");
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

  it("rejects release manifest with missing required fields or invalid status", () => {
    const invalidManifest = {
      knowledgeVersion: "v1.0.0",
      gameVersion: "3.0.x",
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
      gameVersion: "3.0.x",
      schemaVersion: "1.0.0",
      publishedAt: "2026-08-27T00:00:00Z",
      // missing availableReleases
      releases: {},
    };
    const parsed = RootKnowledgeManifestSchema.safeParse(invalidRoot);
    expect(parsed.success).toBe(false);
  });
});
