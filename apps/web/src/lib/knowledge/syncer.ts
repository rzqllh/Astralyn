import { AstralynKnowledgeDB } from "./db";
import { KnowledgeSnapshotLoader, type LoadedKnowledgeRelease } from "./loader";

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

  async sync(): Promise<KnowledgeSyncResult> {
    // 1. Check existing local cache metadata
    const cachedVersionRecord = await this.db.metadata.get("activeKnowledgeVersion");
    const cachedGameVersionRecord = await this.db.metadata.get("gameVersion");
    const cachedAtRecord = await this.db.metadata.get("cachedAt");
    const cachedVersion = cachedVersionRecord?.value ?? null;
    const cachedGameVersion = cachedGameVersionRecord?.value ?? null;
    const cachedAt = cachedAtRecord?.value ?? null;

    const existingCharCount = await this.db.characters.count();
    const hasValidLocalCache = Boolean(cachedVersion && existingCharCount > 0);

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
        error: `Network unavailable (${errMsg}) and no local cache exists.`,
        isOffline: true,
      };
      return this.lastResult;
    }

    const targetVersion = rootManifest.currentKnowledgeVersion;

    // 3. Compare published version with cached version
    if (hasValidLocalCache && cachedVersion === targetVersion) {
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

    // 4. Download and validate new release
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

    // 5. Transactionally populate Dexie cache
    const nowIso = new Date().toISOString();
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
