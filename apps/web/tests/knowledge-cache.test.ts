import { describe, it, expect, beforeEach } from "vitest";
import { AstralynKnowledgeDB } from "../src/lib/knowledge/db";
import {
  KnowledgeSnapshotLoader,
  ChecksumMismatchError,
  ByteSizeMismatchError,
} from "../src/lib/knowledge/loader";
import { KnowledgeCacheSyncer } from "../src/lib/knowledge/syncer";
import { KnowledgeRepository } from "../src/lib/knowledge/repository";
import {
  CharacterKnowledgeSchema,
  KnowledgeReleaseIntegrityError,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  type RootKnowledgeManifest,
} from "@astralyn/shared";
import {
  createValidRootManifest,
  createValidReleaseManifest,
  createValidLoadedRelease,
  FAKE_VALID_HASH_1,
  FAKE_VALID_HASH_2,
} from "./helpers/knowledge-fixtures";

const MOCK_ROOT_MANIFEST_V1 = createValidRootManifest({
  currentKnowledgeVersion: "v1.0.0",
});

const MOCK_ROOT_MANIFEST_V2 = createValidRootManifest({
  currentKnowledgeVersion: "v1.1.0",
  availableReleases: ["v1.0.0", "v1.1.0"],
  releases: {
    "v1.0.0": createValidReleaseManifest({ knowledgeVersion: "v1.0.0" }),
    "v1.1.0": createValidReleaseManifest({ knowledgeVersion: "v1.1.0" }),
  },
});

function createMockLoader(
  rootManifest: RootKnowledgeManifest = MOCK_ROOT_MANIFEST_V1,
  appVersion = "0.0.1"
): KnowledgeSnapshotLoader {
  const loader = new KnowledgeSnapshotLoader("/data", appVersion);

  loader.fetchRootManifest = async () => rootManifest;
  loader.fetchReleaseManifest = async (ver) => {
    return (
      rootManifest.releases[ver] ??
      createValidReleaseManifest({
        knowledgeVersion: ver,
        gameVersion: rootManifest.gameVersion,
      })
    );
  };
  loader.loadFullRelease = async (version, manifest) => {
    return createValidLoadedRelease(
      { currentKnowledgeVersion: version },
      { knowledgeVersion: version, gameVersion: manifest.gameVersion }
    );
  };

  return loader;
}

describe("Phase 2 Dexie Client Knowledge Cache & Syncer State Machine", () => {
  let db: AstralynKnowledgeDB;

  beforeEach(async () => {
    const testDbName = `AstralynTestDB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db = new AstralynKnowledgeDB(testDbName);
    await db.open();
  });

  it("initializes empty cache and successfully performs initial sync", async () => {
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);

    expect(syncer.getStatus()).toBe("uninitialized");

    const result = await syncer.sync();
    expect(result.status).toBe("updated");
    expect(result.activeKnowledgeVersion).toBe("v1.0.0");
    expect(result.isOffline).toBe(false);

    // Verify Dexie tables populated
    expect(await db.characters.count()).toBe(92);
    expect(await db.lightCones.count()).toBe(9);
    expect(await db.relicSets.count()).toBe(6);
    expect(await db.enemies.count()).toBe(4);
    expect(await db.stages.count()).toBe(4);
    expect(await db.duBlessings.count()).toBe(3);
    expect(await db.duEquations.count()).toBe(2);
    expect(await db.duCurios.count()).toBe(2);

    // Verify metadata records including entityCounts
    const metaVer = await db.metadata.get("activeKnowledgeVersion");
    expect(metaVer?.value).toBe("v1.0.0");

    const countMeta = await db.metadata.get("entityCounts");
    expect(countMeta).toBeDefined();
    const counts = JSON.parse(countMeta!.value);
    expect(counts.characters).toBe(92);
    expect(counts.relicSets).toBe(6);
  });

  it("detects same version on subsequent sync and returns status: fresh", async () => {
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);

    await syncer.sync(); // Initial population
    const secondSync = await syncer.sync(); // Second sync check

    expect(secondSync.status).toBe("fresh");
    expect(secondSync.activeKnowledgeVersion).toBe("v1.0.0");
  });

  it("refreshes a same-version cache when the published snapshot hash changes", async () => {
    const oldManifest = createValidRootManifest(
      {},
      { sourceSnapshotHash: FAKE_VALID_HASH_1 }
    );
    const oldLoader = createMockLoader(oldManifest);
    oldLoader.loadFullRelease = async () => ({
      ...createValidLoadedRelease(
        { currentKnowledgeVersion: "v1.0.0" },
        { knowledgeVersion: "v1.0.0", sourceSnapshotHash: FAKE_VALID_HASH_1 }
      ),
      characters: CANONICAL_CHARACTERS.slice(0, 9),
    });

    await new KnowledgeCacheSyncer(db, oldLoader).sync();
    expect(await db.characters.count()).toBe(9);

    const currentManifest = createValidRootManifest(
      {},
      { sourceSnapshotHash: FAKE_VALID_HASH_2 }
    );
    const currentLoader = createMockLoader(currentManifest);
    currentLoader.loadFullRelease = async () =>
      createValidLoadedRelease(
        { currentKnowledgeVersion: "v1.0.0" },
        { knowledgeVersion: "v1.0.0", sourceSnapshotHash: FAKE_VALID_HASH_2 }
      );

    const result = await new KnowledgeCacheSyncer(db, currentLoader).sync();

    expect(result.status).toBe("updated");
    expect(await db.characters.count()).toBe(92);
    expect((await db.metadata.get("sourceSnapshotHash"))?.value).toBe(
      FAKE_VALID_HASH_2
    );
  });

  it("performs transactional upgrade when a new knowledge release is published", async () => {
    // 1. Initial sync with v1.0.0
    const loaderV1 = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncerV1 = new KnowledgeCacheSyncer(db, loaderV1);
    await syncerV1.sync();

    expect(await db.metadata.get("activeKnowledgeVersion")).toEqual({
      key: "activeKnowledgeVersion",
      value: "v1.0.0",
    });

    // 2. Upgrade to v1.1.0
    const loaderV2 = createMockLoader(MOCK_ROOT_MANIFEST_V2);
    const syncerV2 = new KnowledgeCacheSyncer(db, loaderV2);
    const upgradeResult = await syncerV2.sync();

    expect(upgradeResult.status).toBe("updated");
    expect(upgradeResult.activeKnowledgeVersion).toBe("v1.1.0");

    const metaVer = await db.metadata.get("activeKnowledgeVersion");
    expect(metaVer?.value).toBe("v1.1.0");
    expect(await db.characters.count()).toBe(92);
  });

  it("preserves previous valid cache when new release fails validation (fail-safe rollback)", async () => {
    // 1. Initial valid sync
    const loaderValid = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncerValid = new KnowledgeCacheSyncer(db, loaderValid);
    await syncerValid.sync();

    expect(await db.characters.count()).toBe(92);

    // 2. Mock loader with broken v1.1.0 release that throws error during load
    const brokenLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    brokenLoader.fetchRootManifest = async () => MOCK_ROOT_MANIFEST_V2;
    brokenLoader.loadFullRelease = async () => {
      throw new Error(
        "Zod validation failed: Malformed character payload in release v1.1.0"
      );
    };

    const syncerBroken = new KnowledgeCacheSyncer(db, brokenLoader);
    const result = await syncerBroken.sync();

    expect(result.status).toBe("update_rejected_previous_retained");
    expect(result.activeKnowledgeVersion).toBe("v1.0.0"); // Retains v1.0.0
    expect(result.error).toContain("Retained previous valid cache 'v1.0.0'");

    // Verify existing cache remains completely intact!
    expect(await db.characters.count()).toBe(92);
    const acheron = await db.characters.get("acheron");
    expect(acheron?.name).toBe("Acheron");
  });

  it("handles offline state with valid cache gracefully (status: offline_cache_active)", async () => {
    // 1. Populate cache initially
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // 2. Simulate offline network error
    const offlineLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Failed to fetch: NetworkError / Offline");
    };

    const offlineSyncer = new KnowledgeCacheSyncer(db, offlineLoader);
    const result = await offlineSyncer.sync();

    expect(result.status).toBe("offline_cache_active");
    expect(result.isOffline).toBe(true);
    expect(result.activeKnowledgeVersion).toBe("v1.0.0");
    expect(result.error).toContain("Serving from validated local cache");
  });

  it("handles offline state with NO local cache (status: unavailable)", async () => {
    const offlineLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Failed to fetch: NetworkError / Offline");
    };

    const offlineSyncer = new KnowledgeCacheSyncer(db, offlineLoader);
    const result = await offlineSyncer.sync();

    expect(result.status).toBe("unavailable");
    expect(result.isOffline).toBe(true);
    expect(result.activeKnowledgeVersion).toBeNull();
  });
});

describe("Phase 2 Cache Completeness & Corruption Rejections", () => {
  let db: AstralynKnowledgeDB;

  beforeEach(async () => {
    const testDbName = `AstralynCorruptionDB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db = new AstralynKnowledgeDB(testDbName);
    await db.open();
  });

  it("rejects local cache when entityCounts metadata is missing", async () => {
    // Populate cache without entityCounts
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // Manually delete entityCounts metadata to simulate legacy/corrupt cache
    await db.metadata.delete("entityCounts");

    const inspection = await syncer.inspectLocalCache();
    expect(inspection.isValid).toBe(false);

    // Offline check should return unavailable instead of offline_cache_active
    const offlineLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Network offline");
    };
    const offlineSyncer = new KnowledgeCacheSyncer(db, offlineLoader);
    const result = await offlineSyncer.sync();

    expect(result.status).toBe("unavailable");
  });

  it("rejects local cache when a non-character table is missing rows (partial cache)", async () => {
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // Delete one relic set so table has 5 instead of 6
    const firstRelic = await db.relicSets.toCollection().first();
    if (firstRelic) {
      await db.relicSets.delete(firstRelic.id);
    }

    const inspection = await syncer.inspectLocalCache();
    expect(inspection.isValid).toBe(false);

    // Online sync of same version should repair transactionally (status: updated) instead of returning "fresh"
    const repairResult = await syncer.sync();
    expect(repairResult.status).toBe("updated");
    expect(await db.relicSets.count()).toBe(6);
  });

  it("rejects local cache containing a schema-invalid row", async () => {
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // Corrupt one character row in Dexie
    const acheron = await db.characters.get("acheron");
    if (acheron) {
      await db.characters.put({
        ...acheron,
        element: "InvalidElementCorrupted" as unknown as typeof acheron.element,
      });
    }

    const inspection = await syncer.inspectLocalCache();
    expect(inspection.isValid).toBe(false);

    // Offline sync refuses invalid cache
    const offlineLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Network offline");
    };
    const offlineSyncer = new KnowledgeCacheSyncer(db, offlineLoader);
    const result = await offlineSyncer.sync();

    expect(result.status).toBe("unavailable");
  });

  it("returns unavailable when new release fails and prior cache is invalid (no fake retention)", async () => {
    // Populate initially
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // Corrupt local metadata
    await db.metadata.delete("sourceSnapshotHash");

    // Attempt upgrade with failing release
    const brokenLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    brokenLoader.fetchRootManifest = async () => MOCK_ROOT_MANIFEST_V2;
    brokenLoader.loadFullRelease = async () => {
      throw new Error("Release v1.1.0 load failed");
    };

    const syncerBroken = new KnowledgeCacheSyncer(db, brokenLoader);
    const result = await syncerBroken.sync();

    expect(result.status).toBe("unavailable");
  });
});

describe("Phase 2 KnowledgeSnapshotLoader Verification & Integrity Rejections", () => {
  it("rejects corrupt payload before JSON decoding via SHA-256 checksum verification", async () => {
    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    const encoder = new TextEncoder();
    const mockBytes = encoder.encode('{"corrupted": true}');

    loader.fetchRawBuffer = async () => mockBytes;

    const fileEntry = {
      filename: "characters.json" as const,
      relPath: "v1.0.0/characters.json",
      entityCount: 1,
      sizeBytes: mockBytes.byteLength,
      checksum: FAKE_VALID_HASH_1,
    };

    await expect(
      loader.fetchVerifiedJson(
        "/data/v1.0.0/characters.json",
        fileEntry,
        CharacterKnowledgeSchema.array()
      )
    ).rejects.toThrow(ChecksumMismatchError);
  });

  it("rejects payload when byte size does not match manifest sizeBytes", async () => {
    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    const encoder = new TextEncoder();
    const mockBytes = encoder.encode("[]");

    loader.fetchRawBuffer = async () => mockBytes;

    const fileEntry = {
      filename: "characters.json" as const,
      relPath: "v1.0.0/characters.json",
      entityCount: 0,
      sizeBytes: 9999, // Mismatch
      checksum: FAKE_VALID_HASH_1,
    };

    await expect(
      loader.fetchVerifiedJson(
        "/data/v1.0.0/characters.json",
        fileEntry,
        CharacterKnowledgeSchema.array()
      )
    ).rejects.toThrow(ByteSizeMismatchError);
  });

  it("loads full release and verifies all 8 runtime collections when release is compatible and consistent", async () => {
    const releaseManifest = createValidReleaseManifest({
      compatibility: { minAppVersion: "0.0.1" },
    });
    const rootManifest = createValidRootManifest({}, releaseManifest);

    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    loader.fetchReleaseManifest = async () => releaseManifest;

    loader.fetchVerifiedJson = async <T>(
      _url: string,
      entry: { filename: string }
    ): Promise<T> => {
      if (entry.filename === "characters.json")
        return CANONICAL_CHARACTERS as unknown as T;
      if (entry.filename === "light-cones.json")
        return CANONICAL_LIGHT_CONES as unknown as T;
      if (entry.filename === "relics.json") return CANONICAL_RELICS as unknown as T;
      if (entry.filename === "enemies.json") return CANONICAL_ENEMIES as unknown as T;
      if (entry.filename === "stages.json") return CANONICAL_STAGES as unknown as T;
      if (entry.filename === "divergent-universe.json")
        return {
          blessings: CANONICAL_DU_BLESSINGS,
          equations: CANONICAL_DU_EQUATIONS,
          curios: CANONICAL_DU_CURIOS,
        } as unknown as T;
      throw new Error(`Unexpected filename: ${entry.filename}`);
    };

    const loaded = await loader.loadFullRelease("v1.0.0", rootManifest);

    expect(loaded.characters.length).toBe(92);
    expect(loaded.lightCones.length).toBe(9);
    expect(loaded.relicSets.length).toBe(6);
    expect(loaded.enemies.length).toBe(4);
    expect(loaded.stages.length).toBe(4);
    expect(loaded.duBlessings.length).toBe(3);
    expect(loaded.duEquations.length).toBe(2);
    expect(loaded.duCurios.length).toBe(2);
  });

  it("rejects release when loader appVersion is lower than minAppVersion", async () => {
    const releaseManifest = createValidReleaseManifest({
      compatibility: { minAppVersion: "0.1.0" },
    });
    const rootManifest = createValidRootManifest({}, releaseManifest);

    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    loader.fetchReleaseManifest = async () => releaseManifest;
    loader.fetchVerifiedJson = async <T>(
      _url: string,
      entry: { filename: string }
    ): Promise<T> => {
      if (entry.filename === "characters.json")
        return CANONICAL_CHARACTERS as unknown as T;
      if (entry.filename === "light-cones.json")
        return CANONICAL_LIGHT_CONES as unknown as T;
      if (entry.filename === "relics.json") return CANONICAL_RELICS as unknown as T;
      if (entry.filename === "enemies.json") return CANONICAL_ENEMIES as unknown as T;
      if (entry.filename === "stages.json") return CANONICAL_STAGES as unknown as T;
      if (entry.filename === "divergent-universe.json")
        return {
          blessings: CANONICAL_DU_BLESSINGS,
          equations: CANONICAL_DU_EQUATIONS,
          curios: CANONICAL_DU_CURIOS,
        } as unknown as T;
      throw new Error(`Unexpected filename: ${entry.filename}`);
    };

    await expect(loader.loadFullRelease("v1.0.0", rootManifest)).rejects.toThrow(
      KnowledgeReleaseIntegrityError
    );
  });

  it("rejects release when actual parsed entity count disagrees with manifest entityCount", async () => {
    const releaseManifest = createValidReleaseManifest();
    const rootManifest = createValidRootManifest({}, releaseManifest);

    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    loader.fetchReleaseManifest = async () => releaseManifest;
    loader.fetchVerifiedJson = async <T>(
      _url: string,
      entry: { filename: string }
    ): Promise<T> => {
      if (entry.filename === "characters.json")
        return CANONICAL_CHARACTERS.slice(0, 5) as unknown as T;
      if (entry.filename === "light-cones.json")
        return CANONICAL_LIGHT_CONES as unknown as T;
      if (entry.filename === "relics.json") return CANONICAL_RELICS as unknown as T;
      if (entry.filename === "enemies.json") return CANONICAL_ENEMIES as unknown as T;
      if (entry.filename === "stages.json") return CANONICAL_STAGES as unknown as T;
      if (entry.filename === "divergent-universe.json")
        return {
          blessings: CANONICAL_DU_BLESSINGS,
          equations: CANONICAL_DU_EQUATIONS,
          curios: CANONICAL_DU_CURIOS,
        } as unknown as T;
      throw new Error(`Unexpected filename: ${entry.filename}`);
    };

    await expect(loader.loadFullRelease("v1.0.0", rootManifest)).rejects.toThrow(
      KnowledgeReleaseIntegrityError
    );
  });

  it("rejects release when root embedded descriptor disagrees with release manifest", async () => {
    const releaseManifest = createValidReleaseManifest({
      gameVersion: "4.5",
    });
    const rootManifest = createValidRootManifest({}, { gameVersion: "4.4" });

    const loader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    loader.fetchReleaseManifest = async () => releaseManifest;
    loader.fetchVerifiedJson = async <T>(
      _url: string,
      entry: { filename: string }
    ): Promise<T> => {
      if (entry.filename === "characters.json")
        return CANONICAL_CHARACTERS as unknown as T;
      if (entry.filename === "light-cones.json")
        return CANONICAL_LIGHT_CONES as unknown as T;
      if (entry.filename === "relics.json") return CANONICAL_RELICS as unknown as T;
      if (entry.filename === "enemies.json") return CANONICAL_ENEMIES as unknown as T;
      if (entry.filename === "stages.json") return CANONICAL_STAGES as unknown as T;
      if (entry.filename === "divergent-universe.json")
        return {
          blessings: CANONICAL_DU_BLESSINGS,
          equations: CANONICAL_DU_EQUATIONS,
          curios: CANONICAL_DU_CURIOS,
        } as unknown as T;
      throw new Error(`Unexpected filename: ${entry.filename}`);
    };

    await expect(loader.loadFullRelease("v1.0.0", rootManifest)).rejects.toThrow(
      KnowledgeReleaseIntegrityError
    );
  });
});

describe("Phase 2 Knowledge Repository API & Normalized Search", () => {
  let db: AstralynKnowledgeDB;
  let repo: KnowledgeRepository;

  beforeEach(async () => {
    const testDbName = `AstralynRepoTestDB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db = new AstralynKnowledgeDB(testDbName);
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    repo = new KnowledgeRepository(db, loader);
    await repo.initialize();
  });

  it("initializes an empty cache before the first direct route read", async () => {
    const directDb = new AstralynKnowledgeDB(
      `AstralynDirectReadDB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    );
    const directRepo = new KnowledgeRepository(
      directDb,
      createMockLoader(MOCK_ROOT_MANIFEST_V1)
    );

    try {
      expect(directRepo.isInitialized()).toBe(false);

      const characters = await directRepo.listCharacters();

      expect(characters).toHaveLength(92);
      expect(directRepo.isInitialized()).toBe(true);
    } finally {
      directDb.close();
      await directDb.delete();
    }
  });

  it("reads individual character and handles non-existent IDs", async () => {
    const acheron = await repo.getCharacter("acheron");
    expect(acheron).toBeDefined();
    expect(acheron?.name).toBe("Acheron");
    expect(acheron?.path).toBe("Nihility");
    expect(acheron?.element).toBe("Lightning");
    expect(acheron?.rarity).toBe(5);

    const nonExistent = await repo.getCharacter("unknown_character_xyz");
    expect(nonExistent).toBeNull();
  });

  it("filters characters by path, element, and rarity", async () => {
    const nihilityChars = await repo.listCharacters({ path: "Nihility" });
    expect(nihilityChars.length).toBeGreaterThanOrEqual(1);
    expect(nihilityChars.every((c) => c.path === "Nihility")).toBe(true);
    expect(nihilityChars.some((c) => c.id === "acheron")).toBe(true);

    const elationChars = await repo.listCharacters({ path: "Elation" });
    expect(elationChars.length).toBeGreaterThanOrEqual(1);
    expect(elationChars.every((c) => c.path === "Elation")).toBe(true);
    expect(elationChars.some((c) => c.id === "aventurine-waveflair")).toBe(true);

    const fireChars = await repo.listCharacters({ element: "Fire" });
    expect(fireChars.length).toBeGreaterThanOrEqual(2);
    expect(fireChars.every((c) => c.element === "Fire")).toBe(true);
    expect(fireChars.some((c) => c.id === "firefly")).toBe(true);
    expect(fireChars.some((c) => c.id === "gallagher")).toBe(true);

    const fourStarChars = await repo.listCharacters({ rarity: 4 });
    expect(fourStarChars.length).toBe(23);
    expect(fourStarChars.every((c) => c.rarity === 4)).toBe(true);
    expect(fourStarChars.some((c) => c.id === "gallagher")).toBe(true);
    expect(fourStarChars.some((c) => c.id === "tingyun")).toBe(true);
  });

  it("reads light cones and filters by path and rarity", async () => {
    const sigAcheron = await repo.getLightCone("along-the-passing-shore");
    expect(sigAcheron).toBeDefined();
    expect(sigAcheron?.name).toBe("Along the Passing Shore");
    expect(sigAcheron?.path).toBe("Nihility");
    expect(sigAcheron?.rarity).toBe(5);

    const elationLCs = await repo.listLightCones({ path: "Elation" });
    expect(elationLCs.length).toBe(1);
    expect(elationLCs[0].id).toBe("flame-of-carnival");

    const harmonyLCs = await repo.listLightCones({ path: "Harmony" });
    expect(harmonyLCs.length).toBe(3);
  });

  it("reads relic sets and filters by type", async () => {
    const pioneer = await repo.getRelicSet("pioneer-diver");
    expect(pioneer).toBeDefined();
    expect(pioneer?.name).toBe("Pioneer Diver of Dead Waters");
    expect(pioneer?.type).toBe("cavern_relic");

    const planarSets = await repo.listRelicSets({ type: "planar_ornament" });
    expect(planarSets.length).toBe(3);
  });

  it("reads enemies and stages with wave information and rotation IDs", async () => {
    const sam = await repo.getEnemy("sam-complete-combustion");
    expect(sam).toBeDefined();
    expect(sam?.weaknesses).toContain("Quantum");

    const moc12 = await repo.getStage("moc-stage-12");
    expect(moc12).toBeDefined();
    expect(moc12?.floorNumber).toBe(12);
    expect(moc12?.rotationId).toBe("moc-4.5-cycle-1");
    expect(moc12?.waves.length).toBe(2);

    const mocStages = await repo.listStages({ rotationId: "moc-4.5-cycle-1" });
    expect(mocStages.length).toBe(1);
    expect(mocStages[0].id).toBe("moc-stage-12");
  });

  it("reads Divergent Universe entities (blessings, equations, curios)", async () => {
    const fuli = await repo.getDUEntity("perfect-experience-fuli");
    expect(fuli).toBeDefined();
    expect(fuli?.entityType).toBe("blessing");

    const celestial = await repo.getDUEntity("celestial-annihilation");
    expect(celestial).toBeDefined();
    expect(celestial?.entityType).toBe("blessing");
    if (celestial && celestial.entityType === "blessing") {
      expect(celestial.path).toBe("Hunt");
    }

    const rubert = await repo.getDUEntity("rubert-difference-engine");
    expect(rubert).toBeDefined();
    expect(rubert?.entityType).toBe("curio");

    const equations = await repo.listDUEntities({ entityType: "equation" });
    expect(equations.length).toBe(2);
  });

  it("sets isInitialized true only on valid active knowledge version and false on unavailable", async () => {
    expect(repo.isInitialized()).toBe(true);

    const uninitDb = new AstralynKnowledgeDB(`AstralynUninitDB_${Date.now()}`);
    await uninitDb.open();
    const offlineLoader = new KnowledgeSnapshotLoader("/data", "0.0.1");
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Network offline");
    };
    const uninitRepo = new KnowledgeRepository(uninitDb, offlineLoader);
    expect(uninitRepo.isInitialized()).toBe(false);

    const initResult = await uninitRepo.initialize();
    expect(initResult.status).toBe("unavailable");
    expect(uninitRepo.isInitialized()).toBe(false);
  });

  it("performs search normalization across all 8 canonical entity stores using version-owned fields", async () => {
    // 1. Character by canonical name & ID
    const acheronResults = await repo.searchEntities("Acheron");
    expect(acheronResults.length).toBeGreaterThan(0);
    expect(acheronResults[0].entityType).toBe("character");
    expect(acheronResults[0].id).toBe("acheron");
    expect(acheronResults[0].element).toBe("Lightning");
    expect(acheronResults[0].path).toBe("Nihility");

    // 2. Character by localized name
    const castoResults = await repo.searchEntities("Castorice");
    expect(castoResults.length).toBeGreaterThan(0);
    expect(castoResults[0].entityType).toBe("character");
    expect(castoResults[0].id).toBe("castorice");

    // 3. Light Cone
    const lcResults = await repo.searchEntities("Passing Shore");
    expect(lcResults.length).toBeGreaterThan(0);
    expect(lcResults[0].entityType).toBe("light_cone");
    expect(lcResults[0].id).toBe("along-the-passing-shore");

    // 4. Relic Set
    const relicResults = await repo.searchEntities("Pioneer Diver");
    expect(relicResults.length).toBeGreaterThan(0);
    expect(relicResults[0].entityType).toBe("relic_set");
    expect(relicResults[0].id).toBe("pioneer-diver");
    expect(relicResults[0].category).toBe("cavern_relic");

    // 5. Enemy
    const enemyResults = await repo.searchEntities("Combustion");
    expect(enemyResults.length).toBeGreaterThan(0);
    expect(enemyResults[0].entityType).toBe("enemy");
    expect(enemyResults[0].id).toBe("sam-complete-combustion");

    // 6. Stage
    const stageResults = await repo.searchEntities("Stage 12");
    expect(stageResults.length).toBeGreaterThan(0);
    expect(stageResults[0].entityType).toBe("stage");
    expect(stageResults[0].id).toBe("moc-stage-12");

    // 7. DU Blessing
    const blessingResults = await repo.searchEntities("Fuli");
    expect(blessingResults.length).toBeGreaterThan(0);
    expect(blessingResults[0].entityType).toBe("du_blessing");
    expect(blessingResults[0].id).toBe("perfect-experience-fuli");

    // 8. DU Equation
    const eqResults = await repo.searchEntities("Silent Singer");
    expect(eqResults.length).toBeGreaterThan(0);
    expect(eqResults[0].entityType).toBe("du_equation");
    expect(eqResults[0].id).toBe("silent-singer");

    // 9. DU Curio
    const curioResults = await repo.searchEntities("Rubert");
    expect(curioResults.length).toBeGreaterThan(0);
    expect(curioResults[0].entityType).toBe("du_curio");
    expect(curioResults[0].id).toBe("rubert-difference-engine");

    // 10. Empty query returns []
    expect(await repo.searchEntities("")).toEqual([]);
    expect(await repo.searchEntities("   ")).toEqual([]);

    // 11. Unversioned community shorthand with no canonical field match returns valid empty []
    const unversionedAliasResult = await repo.searchEntities(
      "random_unmatched_alias_xyz"
    );
    expect(unversionedAliasResult).toEqual([]);
  });
});
