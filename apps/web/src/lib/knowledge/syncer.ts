import { AstralynKnowledgeDB } from "./db";
import { KnowledgeSnapshotLoader, type LoadedKnowledgeRelease } from "./loader";
import {
  CharacterKnowledgeSchema,
  LightConeKnowledgeSchema,
  RelicSetKnowledgeSchema,
  EnemyKnowledgeSchema,
  StageKnowledgeSchema,
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
} from "@astralyn/shared";

export type KnowledgeSyncStatus =
  | "uninitialized"
  | "fresh"
  | "updating"
  | "updated"
  | "offline_cache_active"
  | "update_rejected_previous_retained"
  | "unavailable";

export interface KnowledgeSyncResult {
  status: KnowledgeSyncStatus;
  activeKnowledgeVersion: string | null;
  gameVersion: string | null;
  cachedAt: string | null;
  error?: string;
  isOffline: boolean;
}

export interface CachedKnowledgeInspection {
  isValid: boolean;
  activeKnowledgeVersion: string | null;
  gameVersion: string | null;
  cachedAt: string | null;
  sourceSnapshotHash: string | null;
  expectedCounts: Record<string, number> | null;
}

export class KnowledgeCacheSyncer {
  private db: AstralynKnowledgeDB;
  private loader: KnowledgeSnapshotLoader;
  private currentStatus: KnowledgeSyncStatus = "uninitialized";
  private lastResult: KnowledgeSyncResult = {
    status: "uninitialized",
    activeKnowledgeVersion: null,
    gameVersion: null,
    cachedAt: null,
    isOffline: false,
  };

  constructor(db: AstralynKnowledgeDB, loader: KnowledgeSnapshotLoader) {
    this.db = db;
    this.loader = loader;
  }

  getStatus(): KnowledgeSyncStatus {
    return this.currentStatus;
  }

  getLastResult(): KnowledgeSyncResult {
    return this.lastResult;
  }

  async inspectLocalCache(): Promise<CachedKnowledgeInspection> {
    const [
      cachedVersionRecord,
      cachedGameVersionRecord,
      cachedAtRecord,
      sourceHashRecord,
      entityCountsRecord,
    ] = await Promise.all([
      this.db.metadata.get("activeKnowledgeVersion"),
      this.db.metadata.get("gameVersion"),
      this.db.metadata.get("cachedAt"),
      this.db.metadata.get("sourceSnapshotHash"),
      this.db.metadata.get("entityCounts"),
    ]);

    const activeKnowledgeVersion = cachedVersionRecord?.value ?? null;
    const gameVersion = cachedGameVersionRecord?.value ?? null;
    const cachedAt = cachedAtRecord?.value ?? null;
    const sourceSnapshotHash = sourceHashRecord?.value ?? null;
    const rawEntityCounts = entityCountsRecord?.value ?? null;

    if (
      !activeKnowledgeVersion ||
      !gameVersion ||
      !cachedAt ||
      !sourceSnapshotHash ||
      !rawEntityCounts
    ) {
      return {
        isValid: false,
        activeKnowledgeVersion,
        gameVersion,
        cachedAt,
        sourceSnapshotHash,
        expectedCounts: null,
      };
    }

    let expectedCounts: Record<string, number>;
    try {
      expectedCounts = JSON.parse(rawEntityCounts);
    } catch {
      return {
        isValid: false,
        activeKnowledgeVersion,
        gameVersion,
        cachedAt,
        sourceSnapshotHash,
        expectedCounts: null,
      };
    }

    // 1. Validate all 8 table counts match expected
    const [
      actualCharCount,
      actualLcCount,
      actualRelicCount,
      actualEnemyCount,
      actualStageCount,
      actualDuBlessingCount,
      actualDuEquationCount,
      actualDuCurioCount,
    ] = await Promise.all([
      this.db.characters.count(),
      this.db.lightCones.count(),
      this.db.relicSets.count(),
      this.db.enemies.count(),
      this.db.stages.count(),
      this.db.duBlessings.count(),
      this.db.duEquations.count(),
      this.db.duCurios.count(),
    ]);

    if (
      typeof expectedCounts.characters !== "number" ||
      actualCharCount !== expectedCounts.characters ||
      typeof expectedCounts.lightCones !== "number" ||
      actualLcCount !== expectedCounts.lightCones ||
      typeof expectedCounts.relicSets !== "number" ||
      actualRelicCount !== expectedCounts.relicSets ||
      typeof expectedCounts.enemies !== "number" ||
      actualEnemyCount !== expectedCounts.enemies ||
      typeof expectedCounts.stages !== "number" ||
      actualStageCount !== expectedCounts.stages ||
      typeof expectedCounts.duBlessings !== "number" ||
      actualDuBlessingCount !== expectedCounts.duBlessings ||
      typeof expectedCounts.duEquations !== "number" ||
      actualDuEquationCount !== expectedCounts.duEquations ||
      typeof expectedCounts.duCurios !== "number" ||
      actualDuCurioCount !== expectedCounts.duCurios
    ) {
      return {
        isValid: false,
        activeKnowledgeVersion,
        gameVersion,
        cachedAt,
        sourceSnapshotHash,
        expectedCounts,
      };
    }

    // 2. Validate row schemas for all cached tables
    try {
      const [
        allChars,
        allLcs,
        allRelics,
        allEnemies,
        allStages,
        allDuBlessings,
        allDuEquations,
        allDuCurios,
      ] = await Promise.all([
        this.db.characters.toArray(),
        this.db.lightCones.toArray(),
        this.db.relicSets.toArray(),
        this.db.enemies.toArray(),
        this.db.stages.toArray(),
        this.db.duBlessings.toArray(),
        this.db.duEquations.toArray(),
        this.db.duCurios.toArray(),
      ]);

      for (const item of allChars) CharacterKnowledgeSchema.parse(item);
      for (const item of allLcs) LightConeKnowledgeSchema.parse(item);
      for (const item of allRelics) RelicSetKnowledgeSchema.parse(item);
      for (const item of allEnemies) EnemyKnowledgeSchema.parse(item);
      for (const item of allStages) StageKnowledgeSchema.parse(item);
      for (const item of allDuBlessings) DUBlessingKnowledgeSchema.parse(item);
      for (const item of allDuEquations) DUEquationKnowledgeSchema.parse(item);
      for (const item of allDuCurios) DUCurioKnowledgeSchema.parse(item);
    } catch {
      return {
        isValid: false,
        activeKnowledgeVersion,
        gameVersion,
        cachedAt,
        sourceSnapshotHash,
        expectedCounts,
      };
    }

    return {
      isValid: true,
      activeKnowledgeVersion,
      gameVersion,
      cachedAt,
      sourceSnapshotHash,
      expectedCounts,
    };
  }

  async sync(): Promise<KnowledgeSyncResult> {
    // 1. Thoroughly inspect local cache validity
    const cacheInspection = await this.inspectLocalCache();
    const hasValidLocalCache = cacheInspection.isValid;
    const cachedVersion = cacheInspection.activeKnowledgeVersion;
    const cachedGameVersion = cacheInspection.gameVersion;
    const cachedAt = cacheInspection.cachedAt;

    // 2. Fetch root manifest
    let rootManifest;
    try {
      rootManifest = await this.loader.fetchRootManifest();
    } catch (networkErr: unknown) {
      const errMsg =
        networkErr instanceof Error ? networkErr.message : String(networkErr);
      if (hasValidLocalCache) {
        this.currentStatus = "offline_cache_active";
        this.lastResult = {
          status: "offline_cache_active",
          activeKnowledgeVersion: cachedVersion,
          gameVersion: cachedGameVersion,
          cachedAt,
          error: `Network unavailable (${errMsg}). Serving from validated local cache.`,
          isOffline: true,
        };
        return this.lastResult;
      }

      this.currentStatus = "unavailable";
      this.lastResult = {
        status: "unavailable",
        activeKnowledgeVersion: null,
        gameVersion: null,
        cachedAt: null,
        error: `Network unavailable (${errMsg}) and no valid local cache exists.`,
        isOffline: true,
      };
      return this.lastResult;
    }

    const targetVersion = rootManifest.currentKnowledgeVersion;
    const targetSnapshotHash =
      rootManifest.releases[targetVersion]?.sourceSnapshotHash ?? null;

    // 3. A version can only be fresh when it still identifies the published bytes.
    if (
      hasValidLocalCache &&
      cachedVersion === targetVersion &&
      cacheInspection.sourceSnapshotHash === targetSnapshotHash
    ) {
      this.currentStatus = "fresh";
      this.lastResult = {
        status: "fresh",
        activeKnowledgeVersion: cachedVersion,
        gameVersion: cachedGameVersion ?? rootManifest.gameVersion,
        cachedAt,
        isOffline: false,
      };
      return this.lastResult;
    }

    // 4. Download and validate new release (or repair corrupt local cache of same version)
    this.currentStatus = "updating";
    let loadedRelease: LoadedKnowledgeRelease;
    try {
      loadedRelease = await this.loader.loadFullRelease(targetVersion, rootManifest);
    } catch (releaseErr: unknown) {
      const errMsg =
        releaseErr instanceof Error ? releaseErr.message : String(releaseErr);

      if (hasValidLocalCache) {
        // PRESERVE previous valid cache upon update failure
        this.currentStatus = "update_rejected_previous_retained";
        this.lastResult = {
          status: "update_rejected_previous_retained",
          activeKnowledgeVersion: cachedVersion,
          gameVersion: cachedGameVersion,
          cachedAt,
          error: `New release '${targetVersion}' failed validation (${errMsg}). Retained previous valid cache '${cachedVersion}'.`,
          isOffline: false,
        };
        return this.lastResult;
      }

      this.currentStatus = "unavailable";
      this.lastResult = {
        status: "unavailable",
        activeKnowledgeVersion: null,
        gameVersion: null,
        cachedAt: null,
        error: `Failed to load release '${targetVersion}': ${errMsg}`,
        isOffline: false,
      };
      return this.lastResult;
    }

    // 5. Transactionally populate Dexie cache with complete tables and entityCounts metadata
    const nowIso = new Date().toISOString();
    const countsRecord = {
      characters: loadedRelease.characters.length,
      lightCones: loadedRelease.lightCones.length,
      relicSets: loadedRelease.relicSets.length,
      enemies: loadedRelease.enemies.length,
      stages: loadedRelease.stages.length,
      duBlessings: loadedRelease.duBlessings.length,
      duEquations: loadedRelease.duEquations.length,
      duCurios: loadedRelease.duCurios.length,
    };

    await this.db.transaction(
      "rw",
      [
        this.db.metadata,
        this.db.characters,
        this.db.lightCones,
        this.db.relicSets,
        this.db.enemies,
        this.db.stages,
        this.db.duBlessings,
        this.db.duEquations,
        this.db.duCurios,
      ],
      async () => {
        // Clear previous cache tables
        await Promise.all([
          this.db.characters.clear(),
          this.db.lightCones.clear(),
          this.db.relicSets.clear(),
          this.db.enemies.clear(),
          this.db.stages.clear(),
          this.db.duBlessings.clear(),
          this.db.duEquations.clear(),
          this.db.duCurios.clear(),
        ]);

        // Bulk insert new validated records
        await Promise.all([
          this.db.characters.bulkAdd(loadedRelease.characters),
          this.db.lightCones.bulkAdd(loadedRelease.lightCones),
          this.db.relicSets.bulkAdd(loadedRelease.relicSets),
          this.db.enemies.bulkAdd(loadedRelease.enemies),
          this.db.stages.bulkAdd(loadedRelease.stages),
          this.db.duBlessings.bulkAdd(loadedRelease.duBlessings),
          this.db.duEquations.bulkAdd(loadedRelease.duEquations),
          this.db.duCurios.bulkAdd(loadedRelease.duCurios),
        ]);

        // Update metadata atomically inside transaction
        await Promise.all([
          this.db.metadata.put({
            key: "activeKnowledgeVersion",
            value: targetVersion,
          }),
          this.db.metadata.put({
            key: "gameVersion",
            value: rootManifest.gameVersion,
          }),
          this.db.metadata.put({
            key: "cachedAt",
            value: nowIso,
          }),
          this.db.metadata.put({
            key: "sourceSnapshotHash",
            value: loadedRelease.releaseManifest.sourceSnapshotHash,
          }),
          this.db.metadata.put({
            key: "entityCounts",
            value: JSON.stringify(countsRecord),
          }),
        ]);
      }
    );

    this.currentStatus = "updated";
    this.lastResult = {
      status: "updated",
      activeKnowledgeVersion: targetVersion,
      gameVersion: rootManifest.gameVersion,
      cachedAt: nowIso,
      isOffline: false,
    };

    return this.lastResult;
  }
}
