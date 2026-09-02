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
  Sha256HexSchema,
  SemVerCoreSchema,
  parseSemVerCore,
  compareSemVer,
  isAppCompatible,
  validateKnowledgeReleaseConsistency,
  assertKnowledgeReleaseConsistency,
  getKnowledgeEntityCounts,
  KnowledgeReleaseIntegrityError,
  REQUIRED_KNOWLEDGE_FILENAMES,
  type RequiredKnowledgeFilename,
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
import {
  createValidReleaseManifest,
  createValidRootManifest,
  createValidFileEntries,
  FAKE_VALID_HASH_1,
  FAKE_VALID_HASH_2,
} from "./helpers/knowledge-fixtures";

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
      element: "DarkMatter",
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects character with negative base stats", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      baseStats: {
        ...CANONICAL_CHARACTERS[0].baseStats,
        hp: -100,
      },
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects character with missing eidolons (< 6 eidolons)", () => {
    const invalidChar = {
      ...CANONICAL_CHARACTERS[0],
      eidolons: CANONICAL_CHARACTERS[0].eidolons.slice(0, 4),
    };
    const parsed = CharacterKnowledgeSchema.safeParse(invalidChar);
    expect(parsed.success).toBe(false);
  });

  it("rejects light cone with missing superimpositions (< 5 descriptions)", () => {
    const invalidLC = {
      ...CANONICAL_LIGHT_CONES[0],
      skill: {
        ...CANONICAL_LIGHT_CONES[0].skill,
        superimpositions: ["S1", "S2"],
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
        authorityTier: "invalid_tier",
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
      rotationId: "",
    };
    const parsed = StageKnowledgeSchema.safeParse(invalidStage);
    expect(parsed.success).toBe(false);
  });

  it("rejects release manifest with missing required fields or invalid status", () => {
    const invalidManifest = {
      knowledgeVersion: "v1.0.0",
      gameVersion: "4.5",
      status: "unapproved_status",
      files: [],
      checksums: {},
    };
    const parsed = KnowledgeReleaseManifestSchema.safeParse(invalidManifest);
    expect(parsed.success).toBe(false);
  });
});

describe("Phase 2 Exact Six-File Manifest & Checksum Contract", () => {
  it("defines exact 6-file tuple in canonical order", () => {
    expect(REQUIRED_KNOWLEDGE_FILENAMES).toEqual([
      "characters.json",
      "light-cones.json",
      "relics.json",
      "enemies.json",
      "stages.json",
      "divergent-universe.json",
    ]);
  });

  it("accepts a structurally valid release manifest with all 6 canonical files", () => {
    const valid = createValidReleaseManifest();
    const result = KnowledgeReleaseManifestSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects release manifest when any canonical file is missing from files array", () => {
    const files = createValidFileEntries().slice(0, 5); // 5 files instead of 6
    const manifest = createValidReleaseManifest({ files });
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when files array has duplicate filenames", () => {
    const files = createValidFileEntries();
    files[1] = { ...files[0] }; // duplicate characters.json
    const manifest = createValidReleaseManifest({ files });
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when files are out of canonical order", () => {
    const files = createValidFileEntries();
    const swapped = [files[1], files[0], ...files.slice(2)];
    const manifest = createValidReleaseManifest({ files: swapped });
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when a file entry has wrong relPath", () => {
    const files = createValidFileEntries("v1.0.0");
    files[0].relPath = "v2.0.0/characters.json"; // mismatch with knowledgeVersion v1.0.0
    const manifest = createValidReleaseManifest({ knowledgeVersion: "v1.0.0", files });
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when checksums record is missing a required file key", () => {
    const manifest = createValidReleaseManifest();
    delete (manifest.checksums as Record<string, string>)["characters.json"];
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when checksums record has an extra unknown key", () => {
    const manifest = createValidReleaseManifest();
    (manifest.checksums as Record<string, string>)["unknown.json"] = FAKE_VALID_HASH_1;
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("rejects release manifest when file entry checksum disagrees with checksums record", () => {
    const manifest = createValidReleaseManifest();
    manifest.files[0].checksum = FAKE_VALID_HASH_2; // record has HASH_1
    const result = KnowledgeReleaseManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });

  it("validates 64-character lowercase SHA-256 schema strictly", () => {
    expect(Sha256HexSchema.safeParse(FAKE_VALID_HASH_1).success).toBe(true);
    // Non-hex
    expect(Sha256HexSchema.safeParse("z".repeat(64)).success).toBe(false);
    // Uppercase
    expect(Sha256HexSchema.safeParse("A".repeat(64)).success).toBe(false);
    // Too short (63 chars)
    expect(Sha256HexSchema.safeParse("a".repeat(63)).success).toBe(false);
    // Too long (65 chars)
    expect(Sha256HexSchema.safeParse("a".repeat(65)).success).toBe(false);
    // Empty
    expect(Sha256HexSchema.safeParse("").success).toBe(false);
  });
});

describe("Phase 2 SemVer Core Schema & Version Compatibility", () => {
  it("accepts valid SemVer core strings", () => {
    expect(SemVerCoreSchema.safeParse("0.0.1").success).toBe(true);
    expect(SemVerCoreSchema.safeParse("0.1.0").success).toBe(true);
    expect(SemVerCoreSchema.safeParse("1.0.0").success).toBe(true);
    expect(SemVerCoreSchema.safeParse("10.20.30").success).toBe(true);
  });

  it("rejects non-SemVer-core formats", () => {
    expect(SemVerCoreSchema.safeParse("v1.0.0").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("1.0").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("1.0.0-beta").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("1.0.0+build").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("01.0.0").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("-1.0.0").success).toBe(false);
    expect(SemVerCoreSchema.safeParse("").success).toBe(false);
  });

  it("parses SemVer core numeric components", () => {
    expect(parseSemVerCore("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseSemVerCore("0.0.1")).toEqual({ major: 0, minor: 0, patch: 1 });
    expect(parseSemVerCore("invalid")).toBeNull();
  });

  it("compares SemVer versions numerically, not lexicographically", () => {
    expect(compareSemVer("0.10.0", "0.9.0")).toBe(1); // 10 > 9 numerically
    expect(compareSemVer("0.9.0", "0.10.0")).toBe(-1);
    expect(compareSemVer("1.0.0", "1.0.0")).toBe(0);
    expect(compareSemVer("0.0.1", "0.0.2")).toBe(-1);
    expect(compareSemVer("2.0.0", "1.99.99")).toBe(1);
  });

  it("correctly evaluates application compatibility", () => {
    expect(isAppCompatible("0.0.1", "0.0.1")).toBe(true);
    expect(isAppCompatible("0.0.2", "0.0.1")).toBe(true);
    expect(isAppCompatible("0.1.0", "0.0.1")).toBe(true);
    expect(isAppCompatible("1.0.0", "0.0.1")).toBe(true);
    expect(isAppCompatible("0.0.0", "0.0.1")).toBe(false);
  });
});

describe("Phase 2 Root Knowledge Manifest Strictness", () => {
  it("accepts a fully consistent root manifest", () => {
    const root = createValidRootManifest();
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(true);
  });

  it("rejects root manifest when currentKnowledgeVersion is not in availableReleases", () => {
    const root = createValidRootManifest({
      currentKnowledgeVersion: "v2.0.0",
      availableReleases: ["v1.0.0"],
    });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when currentKnowledgeVersion is not in releases map", () => {
    const root = createValidRootManifest({
      currentKnowledgeVersion: "v2.0.0",
      availableReleases: ["v2.0.0"],
      releases: {
        "v1.0.0": createValidReleaseManifest({ knowledgeVersion: "v1.0.0" }),
      },
    });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when availableReleases contains duplicates", () => {
    const root = createValidRootManifest({
      availableReleases: ["v1.0.0", "v1.0.0"],
    });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when availableReleases does not match releases keys", () => {
    const root = createValidRootManifest({
      availableReleases: ["v1.0.0", "v1.1.0"],
      releases: {
        "v1.0.0": createValidReleaseManifest({ knowledgeVersion: "v1.0.0" }),
      },
    });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when current release status is not published", () => {
    const root = createValidRootManifest({}, { status: "draft" });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when root gameVersion disagrees with current release gameVersion", () => {
    const root = createValidRootManifest({ gameVersion: "5.0" }, { gameVersion: "4.5" });
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });

  it("rejects root manifest when root schemaVersion disagrees with current release schemaVersion", () => {
    const root = createValidRootManifest(
      { schemaVersion: "2.0.0" },
      { schemaVersion: "1.0.0" }
    );
    const result = RootKnowledgeManifestSchema.safeParse(root);
    expect(result.success).toBe(false);
  });
});

describe("Phase 2 Consistency Validation Helper Seam", () => {
  it("validates entity counts computation from collections", () => {
    const counts = getKnowledgeEntityCounts({
      characters: CANONICAL_CHARACTERS,
      lightCones: CANONICAL_LIGHT_CONES,
      relics: CANONICAL_RELICS,
      enemies: CANONICAL_ENEMIES,
      stages: CANONICAL_STAGES,
      divergentUniverse: {
        blessings: CANONICAL_DU_BLESSINGS,
        equations: CANONICAL_DU_EQUATIONS,
        curios: CANONICAL_DU_CURIOS,
      },
    });

    expect(counts["characters.json"]).toBe(9);
    expect(counts["light-cones.json"]).toBe(9);
    expect(counts["relics.json"]).toBe(6);
    expect(counts["enemies.json"]).toBe(4);
    expect(counts["stages.json"]).toBe(4);
    expect(counts["divergent-universe.json"]).toBe(7); // 3 + 2 + 2
  });

  it("returns zero errors for a consistent release and compatible application", () => {
    const releaseManifest = createValidReleaseManifest({
      compatibility: { minAppVersion: "0.0.1" },
    });
    const rootManifest = createValidRootManifest({}, releaseManifest);
    const entityCounts = getKnowledgeEntityCounts({
      characters: CANONICAL_CHARACTERS,
      lightCones: CANONICAL_LIGHT_CONES,
      relics: CANONICAL_RELICS,
      enemies: CANONICAL_ENEMIES,
      stages: CANONICAL_STAGES,
      divergentUniverse: {
        blessings: CANONICAL_DU_BLESSINGS,
        equations: CANONICAL_DU_EQUATIONS,
        curios: CANONICAL_DU_CURIOS,
      },
    });

    const errors = validateKnowledgeReleaseConsistency({
      rootManifest,
      releaseManifest,
      entityCounts,
      appVersion: "0.0.1",
    });

    expect(errors).toEqual([]);
    expect(() =>
      assertKnowledgeReleaseConsistency({
        rootManifest,
        releaseManifest,
        entityCounts,
        appVersion: "0.0.1",
      })
    ).not.toThrow();
  });

  it("detects entity count mismatch and throws KnowledgeReleaseIntegrityError on assert", () => {
    const releaseManifest = createValidReleaseManifest();
    const rootManifest = createValidRootManifest({}, releaseManifest);
    const wrongCounts: Record<RequiredKnowledgeFilename, number> = {
      "characters.json": 999, // Mismatch
      "light-cones.json": 9,
      "relics.json": 6,
      "enemies.json": 4,
      "stages.json": 4,
      "divergent-universe.json": 7,
    };

    const errors = validateKnowledgeReleaseConsistency({
      rootManifest,
      releaseManifest,
      entityCounts: wrongCounts,
      appVersion: "0.0.1",
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Entity count mismatch for 'characters.json'");

    expect(() =>
      assertKnowledgeReleaseConsistency({
        rootManifest,
        releaseManifest,
        entityCounts: wrongCounts,
        appVersion: "0.0.1",
      })
    ).toThrow(KnowledgeReleaseIntegrityError);
  });

  it("detects application version below minimum required version", () => {
    const releaseManifest = createValidReleaseManifest({
      compatibility: { minAppVersion: "0.1.0" },
    });
    const rootManifest = createValidRootManifest({}, releaseManifest);
    const entityCounts = getKnowledgeEntityCounts({
      characters: CANONICAL_CHARACTERS,
      lightCones: CANONICAL_LIGHT_CONES,
      relics: CANONICAL_RELICS,
      enemies: CANONICAL_ENEMIES,
      stages: CANONICAL_STAGES,
      divergentUniverse: {
        blessings: CANONICAL_DU_BLESSINGS,
        equations: CANONICAL_DU_EQUATIONS,
        curios: CANONICAL_DU_CURIOS,
      },
    });

    const errors = validateKnowledgeReleaseConsistency({
      rootManifest,
      releaseManifest,
      entityCounts,
      appVersion: "0.0.1", // Incompatible: 0.0.1 < 0.1.0
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(
      errors.some((e) =>
        e.includes("incompatible with release minimum required version '0.1.0'")
      )
    ).toBe(true);
  });
});
