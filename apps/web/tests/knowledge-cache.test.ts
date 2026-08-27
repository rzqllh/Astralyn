import { describe, it, expect, beforeEach } from "vitest";
import { AstralynKnowledgeDB } from "../src/lib/knowledge/db";
import {
  KnowledgeSnapshotLoader,
  ChecksumMismatchError,
} from "../src/lib/knowledge/loader";
import { KnowledgeCacheSyncer } from "../src/lib/knowledge/syncer";
import { KnowledgeRepository } from "../src/lib/knowledge/repository";
import {
  CharacterKnowledgeSchema,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
} from "@astralyn/shared";

// Create test mock releases
const MOCK_ROOT_MANIFEST_V1: RootKnowledgeManifest = {
  currentKnowledgeVersion: "v1.0.0",
  gameVersion: "4.5",
  schemaVersion: "1.0.0",
  publishedAt: "2026-08-27T00:00:00Z",
  availableReleases: ["v1.0.0"],
  releases: {
    "v1.0.0": {
      knowledgeVersion: "v1.0.0",
      gameVersion: "4.5",
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-27T00:00:00Z",
      sourceSnapshotHash: "mock_hash_v1",
      status: "published",
      files: [],
      checksums: {},
      compatibility: { minAppVersion: "0.1.0" },
    },
  },
};

const MOCK_ROOT_MANIFEST_V2: RootKnowledgeManifest = {
  currentKnowledgeVersion: "v1.1.0",
  gameVersion: "4.5",
  schemaVersion: "1.0.0",
  publishedAt: "2026-09-01T00:00:00Z",
  availableReleases: ["v1.0.0", "v1.1.0"],
  releases: {
    "v1.1.0": {
      knowledgeVersion: "v1.1.0",
      gameVersion: "4.5",
      schemaVersion: "1.0.0",
      generatedAt: "2026-09-01T00:00:00Z",
      sourceSnapshotHash: "mock_hash_v2",
      status: "published",
      files: [],
      checksums: {},
      compatibility: { minAppVersion: "0.1.0" },
    },
  },
};

function createMockLoader(
  rootManifest: RootKnowledgeManifest = MOCK_ROOT_MANIFEST_V1
): KnowledgeSnapshotLoader {
  const loader = new KnowledgeSnapshotLoader();

  loader.fetchRootManifest = async () => rootManifest;
  loader.fetchReleaseManifest = async (ver) => {
    return {
      knowledgeVersion: ver,
      gameVersion: rootManifest.gameVersion,
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-27T00:00:00Z",
      sourceSnapshotHash: "mock_hash_" + ver,
      status: "published",
      files: [],
      checksums: {},
      compatibility: { minAppVersion: "0.1.0" },
    };
  };
  loader.loadFullRelease = async (version, manifest) => {
    const releaseManifest: KnowledgeReleaseManifest = {
      knowledgeVersion: version,
      gameVersion: manifest.gameVersion,
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-27T00:00:00Z",
      sourceSnapshotHash: "mock_hash_" + version,
      status: "published",
      files: [],
      checksums: {},
      compatibility: { minAppVersion: "0.1.0" },
    };

    return {
      manifest,
      releaseManifest,
      characters: CANONICAL_CHARACTERS,
      lightCones: CANONICAL_LIGHT_CONES,
      relicSets: CANONICAL_RELICS,
      enemies: CANONICAL_ENEMIES,
      stages: CANONICAL_STAGES,
      duBlessings: CANONICAL_DU_BLESSINGS,
      duEquations: CANONICAL_DU_EQUATIONS,
      duCurios: CANONICAL_DU_CURIOS,
    };
  };

  return loader;
}

describe("Phase 2 Dexie Client Knowledge Cache & Syncer State Machine", () => {
  let db: AstralynKnowledgeDB;

  beforeEach(async () => {
    // Unique in-memory DB per test
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
    expect(await db.characters.count()).toBe(9);
    expect(await db.lightCones.count()).toBe(9);
    expect(await db.relicSets.count()).toBe(6);
    expect(await db.enemies.count()).toBe(4);
    expect(await db.stages.count()).toBe(4);
    expect(await db.duBlessings.count()).toBe(3);
    expect(await db.duEquations.count()).toBe(2);
    expect(await db.duCurios.count()).toBe(2);

    // Verify metadata record
    const metaVer = await db.metadata.get("activeKnowledgeVersion");
    expect(metaVer?.value).toBe("v1.0.0");
  });

  it("detects same version on subsequent sync and returns status: fresh", async () => {
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);

    await syncer.sync(); // Initial population
    const secondSync = await syncer.sync(); // Second sync check

    expect(secondSync.status).toBe("fresh");
    expect(secondSync.activeKnowledgeVersion).toBe("v1.0.0");
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
    expect(await db.characters.count()).toBe(9);
  });

  it("preserves previous valid cache when new release fails validation (fail-safe rollback)", async () => {
    // 1. Initial valid sync
    const loaderValid = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncerValid = new KnowledgeCacheSyncer(db, loaderValid);
    await syncerValid.sync();

    expect(await db.characters.count()).toBe(9);

    // 2. Mock loader with broken v1.1.0 release that throws error during load
    const brokenLoader = new KnowledgeSnapshotLoader();
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
    expect(await db.characters.count()).toBe(9);
    const acheron = await db.characters.get("acheron");
    expect(acheron?.name).toBe("Acheron");
  });

  it("handles offline state with valid cache gracefully (status: offline_cache_active)", async () => {
    // 1. Populate cache initially
    const loader = createMockLoader(MOCK_ROOT_MANIFEST_V1);
    const syncer = new KnowledgeCacheSyncer(db, loader);
    await syncer.sync();

    // 2. Simulate offline network error
    const offlineLoader = new KnowledgeSnapshotLoader();
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
    const offlineLoader = new KnowledgeSnapshotLoader();
    offlineLoader.fetchRootManifest = async () => {
      throw new Error("Failed to fetch: NetworkError / Offline");
    };

    const offlineSyncer = new KnowledgeCacheSyncer(db, offlineLoader);
    const result = await offlineSyncer.sync();

    expect(result.status).toBe("unavailable");
    expect(result.isOffline).toBe(true);
    expect(result.activeKnowledgeVersion).toBeNull();
  });

  it("rejects corrupt payload before JSON decoding via SHA-256 checksum verification", async () => {
    const loader = new KnowledgeSnapshotLoader();
    loader.fetchRawText = async () => '{"corrupted": true}';

    await expect(
      loader.fetchVerifiedJson(
        "/data/v1.0.0/characters.json",
        "characters.json",
        "expected_correct_hash_12345",
        CharacterKnowledgeSchema.array()
      )
    ).rejects.toThrow(ChecksumMismatchError);
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
    expect(nihilityChars.length).toBe(1);
    expect(nihilityChars[0].id).toBe("acheron");

    const elationChars = await repo.listCharacters({ path: "Elation" });
    expect(elationChars.length).toBe(1);
    expect(elationChars[0].id).toBe("aventurine-waveflair");

    const fireChars = await repo.listCharacters({ element: "Fire" });
    expect(fireChars.length).toBe(2);
    expect(fireChars.map((c) => c.id).sort()).toEqual(["firefly", "gallagher"]);

    const fourStarChars = await repo.listCharacters({ rarity: 4 });
    expect(fourStarChars.length).toBe(2);
    expect(fourStarChars.map((c) => c.id).sort()).toEqual(["gallagher", "tingyun"]);
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
    expect(harmonyLCs.length).toBe(3); // Flowing Nightglow, Memories of the Past, Past and Future
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

  it("performs search normalization and matches canonical aliases", async () => {
    // Search "sam" -> resolves Firefly
    const samResults = await repo.searchEntities("sam");
    expect(samResults.length).toBeGreaterThan(0);
    expect(samResults[0].id).toBe("firefly");

    // Search "netherwing" -> resolves Castorice
    const netherwingResults = await repo.searchEntities("netherwing");
    expect(netherwingResults.length).toBeGreaterThan(0);
    expect(netherwingResults[0].id).toBe("castorice");

    // Search "waveflair" / "elation aventurine" -> resolves Aventurine • Waveflair
    const waveflairResults = await repo.searchEntities("waveflair");
    expect(waveflairResults.length).toBeGreaterThan(0);
    expect(waveflairResults[0].id).toBe("aventurine-waveflair");

    // Search "raiden mei" -> resolves Acheron
    const raidenResults = await repo.searchEntities("raiden mei");
    expect(raidenResults.length).toBeGreaterThan(0);
    expect(raidenResults[0].id).toBe("acheron");

    // Search "madam herta" -> resolves The Herta
    const hertaResults = await repo.searchEntities("madam herta");
    expect(hertaResults.length).toBeGreaterThan(0);
    expect(hertaResults[0].id).toBe("the-herta");

    // Search "dead waters" -> resolves Pioneer Diver
    const relicResults = await repo.searchEntities("dead waters");
    expect(relicResults.length).toBeGreaterThan(0);
    expect(relicResults[0].id).toBe("pioneer-diver");
  });
});
