import { AstralynKnowledgeDB, knowledgeDB } from "./db";
import { KnowledgeSnapshotLoader } from "./loader";
import {
  KnowledgeCacheSyncer,
  type KnowledgeSyncResult,
  type KnowledgeSyncStatus,
} from "./syncer";
import { normalizeSearchString } from "./search";
import type {
  CharacterKnowledge,
  LightConeKnowledge,
  RelicSetKnowledge,
  EnemyKnowledge,
  StageKnowledge,
  DUEntityKnowledge,
  CombatElement,
  CombatPath,
  CharacterRarity,
  CharacterRole,
  CharacterMechanicTag,
  LightConeRarity,
  RelicSetType,
  EnemyCategory,
  StageType,
  DUEntityType,
  DURarity,
} from "@astralyn/shared";

export interface CharacterFilter {
  path?: CombatPath;
  element?: CombatElement;
  rarity?: CharacterRarity;
  role?: CharacterRole;
  tag?: CharacterMechanicTag;
}

export interface LightConeFilter {
  path?: CombatPath;
  rarity?: LightConeRarity;
}

export interface RelicFilter {
  type?: RelicSetType;
}

export interface EnemyFilter {
  category?: EnemyCategory;
  weakness?: CombatElement;
}

export interface StageFilter {
  stageType?: StageType;
  rotationId?: string;
}

export interface DUEntityFilter {
  entityType?: DUEntityType;
  path?: CombatPath;
  rarity?: DURarity;
}

export interface SearchResultItem {
  id: string;
  name: string;
  entityType:
    | "character"
    | "light_cone"
    | "relic_set"
    | "enemy"
    | "stage"
    | "du_blessing"
    | "du_equation"
    | "du_curio";
  rarity?: number;
  element?: CombatElement;
  path?: CombatPath;
  category?: string;
  score: number;
}

export class KnowledgeRepository {
  private db: AstralynKnowledgeDB;
  private syncer: KnowledgeCacheSyncer;
  private initialized = false;
  private initializationPromise: Promise<KnowledgeSyncResult> | null = null;

  constructor(
    db: AstralynKnowledgeDB = knowledgeDB,
    loader: KnowledgeSnapshotLoader = new KnowledgeSnapshotLoader()
  ) {
    this.db = db;
    this.syncer = new KnowledgeCacheSyncer(db, loader);
  }

  initialize(): Promise<KnowledgeSyncResult> {
    if (this.initialized) {
      return Promise.resolve(this.syncer.getLastResult());
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const initialization = this.runInitialization();
    this.initializationPromise = initialization;
    const clearInitialization = () => {
      if (this.initializationPromise === initialization) this.initializationPromise = null;
    };
    void initialization.then(clearInitialization, clearInitialization);
    return initialization;
  }

  private async runInitialization(): Promise<KnowledgeSyncResult> {
    try {
      const result = await this.syncer.sync();
      const validStatuses: KnowledgeSyncStatus[] = [
        "fresh",
        "updated",
        "offline_cache_active",
        "update_rejected_previous_retained",
      ];
      if (
        result.activeKnowledgeVersion !== null &&
        validStatuses.includes(result.status)
      ) {
        this.initialized = true;
      } else {
        this.initialized = false;
      }
      return result;
    } catch (err) {
      this.initialized = false;
      throw err;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSyncStatus(): KnowledgeSyncStatus {
    return this.syncer.getStatus();
  }

  async getActiveKnowledgeVersion(): Promise<string | null> {
    const rec = await this.db.metadata.get("activeKnowledgeVersion");
    return rec?.value ?? null;
  }

  async getGameVersion(): Promise<string | null> {
    const rec = await this.db.metadata.get("gameVersion");
    return rec?.value ?? null;
  }

  // --- Character Reads ---
  async getCharacter(id: string): Promise<CharacterKnowledge | null> {
    await this.ensureInitialized();
    const char = await this.db.characters.get(id);
    return char ?? null;
  }

  async listCharacters(filter?: CharacterFilter): Promise<CharacterKnowledge[]> {
    await this.ensureInitialized();
    let collection = this.db.characters.toCollection();

    if (filter?.path) {
      collection = this.db.characters.where("path").equals(filter.path);
    } else if (filter?.element) {
      collection = this.db.characters.where("element").equals(filter.element);
    } else if (filter?.rarity) {
      collection = this.db.characters.where("rarity").equals(filter.rarity);
    }

    let results = await collection.toArray();

    if (filter?.path && filter?.element) {
      results = results.filter((c) => c.element === filter.element);
    }
    if (filter?.rarity) {
      results = results.filter((c) => c.rarity === filter.rarity);
    }
    if (filter?.role) {
      results = results.filter((c) => c.roles.includes(filter.role!));
    }
    if (filter?.tag) {
      results = results.filter((c) => c.mechanicTags.includes(filter.tag!));
    }

    return results.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }

  // --- Light Cone Reads ---
  async getLightCone(id: string): Promise<LightConeKnowledge | null> {
    await this.ensureInitialized();
    const lc = await this.db.lightCones.get(id);
    return lc ?? null;
  }

  async listLightCones(filter?: LightConeFilter): Promise<LightConeKnowledge[]> {
    await this.ensureInitialized();
    let collection = this.db.lightCones.toCollection();

    if (filter?.path) {
      collection = this.db.lightCones.where("path").equals(filter.path);
    } else if (filter?.rarity) {
      collection = this.db.lightCones.where("rarity").equals(filter.rarity);
    }

    let results = await collection.toArray();
    if (filter?.path && filter?.rarity) {
      results = results.filter((lc) => lc.rarity === filter.rarity);
    }

    return results.sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  }

  // --- Relic Set Reads ---
  async getRelicSet(id: string): Promise<RelicSetKnowledge | null> {
    await this.ensureInitialized();
    const relic = await this.db.relicSets.get(id);
    return relic ?? null;
  }

  async listRelicSets(filter?: RelicFilter): Promise<RelicSetKnowledge[]> {
    await this.ensureInitialized();
    let collection = this.db.relicSets.toCollection();
    if (filter?.type) {
      collection = this.db.relicSets.where("type").equals(filter.type);
    }
    const results = await collection.toArray();
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- Enemy Reads ---
  async getEnemy(id: string): Promise<EnemyKnowledge | null> {
    await this.ensureInitialized();
    const enemy = await this.db.enemies.get(id);
    return enemy ?? null;
  }

  async listEnemies(filter?: EnemyFilter): Promise<EnemyKnowledge[]> {
    await this.ensureInitialized();
    let collection = this.db.enemies.toCollection();
    if (filter?.category) {
      collection = this.db.enemies.where("category").equals(filter.category);
    }
    let results = await collection.toArray();
    if (filter?.weakness) {
      results = results.filter((e) => e.weaknesses.includes(filter.weakness!));
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- Stage Reads ---
  async getStage(id: string): Promise<StageKnowledge | null> {
    await this.ensureInitialized();
    const stage = await this.db.stages.get(id);
    return stage ?? null;
  }

  async listStages(filter?: StageFilter): Promise<StageKnowledge[]> {
    await this.ensureInitialized();
    let collection = this.db.stages.toCollection();
    if (filter?.rotationId) {
      collection = this.db.stages.where("rotationId").equals(filter.rotationId);
    } else if (filter?.stageType) {
      collection = this.db.stages.where("stageType").equals(filter.stageType);
    }
    let results = await collection.toArray();
    if (filter?.rotationId && filter?.stageType) {
      results = results.filter((s) => s.stageType === filter.stageType);
    }
    return results.sort((a, b) => a.floorNumber - b.floorNumber);
  }

  // --- Divergent Universe Reads ---
  async getDUEntity(id: string): Promise<DUEntityKnowledge | null> {
    await this.ensureInitialized();
    const blessing = await this.db.duBlessings.get(id);
    if (blessing) return blessing;
    const equation = await this.db.duEquations.get(id);
    if (equation) return equation;
    const curio = await this.db.duCurios.get(id);
    if (curio) return curio;
    return null;
  }

  async listDUEntities(filter?: DUEntityFilter): Promise<DUEntityKnowledge[]> {
    await this.ensureInitialized();
    const results: DUEntityKnowledge[] = [];

    if (!filter?.entityType || filter.entityType === "blessing") {
      let bCol = this.db.duBlessings.toCollection();
      if (filter?.path) {
        bCol = this.db.duBlessings.where("path").equals(filter.path);
      }
      let blessings = await bCol.toArray();
      if (filter?.rarity) {
        blessings = blessings.filter((b) => b.rarity === filter.rarity);
      }
      results.push(...blessings);
    }

    if (!filter?.entityType || filter.entityType === "equation") {
      let equations = await this.db.duEquations.toArray();
      if (filter?.path) {
        equations = equations.filter(
          (eq) => eq.primaryPath === filter.path || eq.secondaryPath === filter.path
        );
      }
      if (filter?.rarity) {
        equations = equations.filter((eq) => eq.rarity === filter.rarity);
      }
      results.push(...equations);
    }

    if (!filter?.entityType || filter.entityType === "curio") {
      let curios = await this.db.duCurios.toArray();
      if (filter?.rarity) {
        curios = curios.filter((c) => c.rarity === filter.rarity);
      }
      results.push(...curios);
    }

    return results;
  }

  // --- Search Normalization & Unified Search Across All 8 Stores ---
  async searchEntities(rawQuery: string): Promise<SearchResultItem[]> {
    await this.ensureInitialized();
    const query = normalizeSearchString(rawQuery);
    if (!query) return [];

    const results: SearchResultItem[] = [];

    const calculateScore = (
      id: string,
      name: string,
      extraFields: string[] = []
    ): number => {
      const normId = normalizeSearchString(id);
      const normName = normalizeSearchString(name);
      const normExtras = extraFields.map(normalizeSearchString);

      if (id === query || normId === query || normName === query) {
        return 100;
      }
      if (
        normId.startsWith(query) ||
        normName.startsWith(query) ||
        normExtras.some((e) => e.startsWith(query))
      ) {
        return 80;
      }
      if (
        normId.includes(query) ||
        normName.includes(query) ||
        normExtras.some((e) => e.includes(query))
      ) {
        return 60;
      }
      return 0;
    };

    // 1. Search Characters
    const allChars = await this.db.characters.toArray();
    for (const char of allChars) {
      const score = calculateScore(char.id, char.name, [
        char.localizedNames?.en ?? "",
        char.localizedNames?.id ?? "",
      ]);
      if (score > 0) {
        results.push({
          id: char.id,
          name: char.name,
          entityType: "character",
          rarity: char.rarity,
          element: char.element,
          path: char.path,
          score,
        });
      }
    }

    // 2. Search Light Cones
    const allLCs = await this.db.lightCones.toArray();
    for (const lc of allLCs) {
      const score = calculateScore(lc.id, lc.name);
      if (score > 0) {
        results.push({
          id: lc.id,
          name: lc.name,
          entityType: "light_cone",
          rarity: lc.rarity,
          path: lc.path,
          score,
        });
      }
    }

    // 3. Search Relic Sets
    const allRelics = await this.db.relicSets.toArray();
    for (const relic of allRelics) {
      const score = calculateScore(relic.id, relic.name);
      if (score > 0) {
        results.push({
          id: relic.id,
          name: relic.name,
          entityType: "relic_set",
          category: relic.type,
          score,
        });
      }
    }

    // 4. Search Enemies
    const allEnemies = await this.db.enemies.toArray();
    for (const enemy of allEnemies) {
      const score = calculateScore(enemy.id, enemy.name);
      if (score > 0) {
        results.push({
          id: enemy.id,
          name: enemy.name,
          entityType: "enemy",
          category: enemy.category,
          score,
        });
      }
    }

    // 5. Search Stages
    const allStages = await this.db.stages.toArray();
    for (const stage of allStages) {
      const score = calculateScore(stage.id, stage.name);
      if (score > 0) {
        results.push({
          id: stage.id,
          name: stage.name,
          entityType: "stage",
          category: stage.stageType,
          score,
        });
      }
    }

    // 6. Search DU Blessings
    const allBlessings = await this.db.duBlessings.toArray();
    for (const blessing of allBlessings) {
      const score = calculateScore(blessing.id, blessing.name);
      if (score > 0) {
        results.push({
          id: blessing.id,
          name: blessing.name,
          entityType: "du_blessing",
          rarity: blessing.rarity,
          path: blessing.path,
          score,
        });
      }
    }

    // 7. Search DU Equations
    const allEquations = await this.db.duEquations.toArray();
    for (const equation of allEquations) {
      const score = calculateScore(equation.id, equation.name);
      if (score > 0) {
        results.push({
          id: equation.id,
          name: equation.name,
          entityType: "du_equation",
          rarity: equation.rarity,
          path: equation.primaryPath,
          score,
        });
      }
    }

    // 8. Search DU Curios
    const allCurios = await this.db.duCurios.toArray();
    for (const curio of allCurios) {
      const score = calculateScore(curio.id, curio.name);
      if (score > 0) {
        results.push({
          id: curio.id,
          name: curio.name,
          entityType: "du_curio",
          rarity: curio.rarity,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
}

export const knowledgeRepository = new KnowledgeRepository();
