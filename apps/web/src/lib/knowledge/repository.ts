import { AstralynKnowledgeDB, knowledgeDB } from "./db";
import { KnowledgeSnapshotLoader } from "./loader";
import {
  KnowledgeCacheSyncer,
  type KnowledgeSyncResult,
  type KnowledgeSyncStatus,
} from "./syncer";
import { normalizeSearchString, CANONICAL_ALIASES } from "./search";
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
  matchedAlias?: string;
  score: number;
}

export class KnowledgeRepository {
  private db: AstralynKnowledgeDB;
  private syncer: KnowledgeCacheSyncer;
  private initialized = false;

  constructor(
    db: AstralynKnowledgeDB = knowledgeDB,
    loader: KnowledgeSnapshotLoader = new KnowledgeSnapshotLoader()
  ) {
    this.db = db;
    this.syncer = new KnowledgeCacheSyncer(db, loader);
  }

  async initialize(): Promise<KnowledgeSyncResult> {
    const result = await this.syncer.sync();
    this.initialized = true;
    return result;
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
    const char = await this.db.characters.get(id);
    return char ?? null;
  }

  async listCharacters(filter?: CharacterFilter): Promise<CharacterKnowledge[]> {
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
    const lc = await this.db.lightCones.get(id);
    return lc ?? null;
  }

  async listLightCones(filter?: LightConeFilter): Promise<LightConeKnowledge[]> {
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
    const relic = await this.db.relicSets.get(id);
    return relic ?? null;
  }

  async listRelicSets(filter?: RelicFilter): Promise<RelicSetKnowledge[]> {
    let collection = this.db.relicSets.toCollection();
    if (filter?.type) {
      collection = this.db.relicSets.where("type").equals(filter.type);
    }
    const results = await collection.toArray();
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- Enemy Reads ---
  async getEnemy(id: string): Promise<EnemyKnowledge | null> {
    const enemy = await this.db.enemies.get(id);
    return enemy ?? null;
  }

  async listEnemies(filter?: EnemyFilter): Promise<EnemyKnowledge[]> {
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
    const stage = await this.db.stages.get(id);
    return stage ?? null;
  }

  async listStages(filter?: StageFilter): Promise<StageKnowledge[]> {
    let collection = this.db.stages.toCollection();
    if (filter?.stageType) {
      collection = this.db.stages.where("stageType").equals(filter.stageType);
    }
    const results = await collection.toArray();
    return results.sort((a, b) => a.floorNumber - b.floorNumber);
  }

  // --- Divergent Universe Reads ---
  async getDUEntity(id: string): Promise<DUEntityKnowledge | null> {
    const blessing = await this.db.duBlessings.get(id);
    if (blessing) return blessing;
    const equation = await this.db.duEquations.get(id);
    if (equation) return equation;
    const curio = await this.db.duCurios.get(id);
    if (curio) return curio;
    return null;
  }

  async listDUEntities(filter?: DUEntityFilter): Promise<DUEntityKnowledge[]> {
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

  // --- Search Normalization & Unified Search ---
  async searchEntities(rawQuery: string): Promise<SearchResultItem[]> {
    const query = normalizeSearchString(rawQuery);
    if (!query) return [];

    const results: SearchResultItem[] = [];

    // Search Characters
    const allChars = await this.db.characters.toArray();
    for (const char of allChars) {
      const normName = normalizeSearchString(char.name);
      const aliases = CANONICAL_ALIASES[char.id] ?? [];
      const localizedEn = normalizeSearchString(char.localizedNames.en);
      const localizedId = normalizeSearchString(char.localizedNames.id);

      let matchedAlias: string | undefined;
      let score = 0;

      if (char.id === query || normName === query) {
        score = 100;
      } else if (
        normName.startsWith(query) ||
        localizedEn.startsWith(query) ||
        localizedId.startsWith(query)
      ) {
        score = 80;
      } else if (
        normName.includes(query) ||
        localizedEn.includes(query) ||
        localizedId.includes(query)
      ) {
        score = 60;
      } else {
        for (const alias of aliases) {
          const normAlias = normalizeSearchString(alias);
          if (normAlias.includes(query)) {
            matchedAlias = alias;
            score = normAlias === query ? 75 : 50;
            break;
          }
        }
      }

      if (score > 0) {
        results.push({
          id: char.id,
          name: char.name,
          entityType: "character",
          rarity: char.rarity,
          element: char.element,
          path: char.path,
          matchedAlias,
          score,
        });
      }
    }

    // Search Light Cones
    const allLCs = await this.db.lightCones.toArray();
    for (const lc of allLCs) {
      const normName = normalizeSearchString(lc.name);
      const aliases = CANONICAL_ALIASES[lc.id] ?? [];
      let matchedAlias: string | undefined;
      let score = 0;

      if (lc.id === query || normName === query) {
        score = 100;
      } else if (normName.startsWith(query)) {
        score = 80;
      } else if (normName.includes(query)) {
        score = 60;
      } else {
        for (const alias of aliases) {
          const normAlias = normalizeSearchString(alias);
          if (normAlias.includes(query)) {
            matchedAlias = alias;
            score = 50;
            break;
          }
        }
      }

      if (score > 0) {
        results.push({
          id: lc.id,
          name: lc.name,
          entityType: "light_cone",
          rarity: lc.rarity,
          path: lc.path,
          matchedAlias,
          score,
        });
      }
    }

    // Search Relics
    const allRelics = await this.db.relicSets.toArray();
    for (const relic of allRelics) {
      const normName = normalizeSearchString(relic.name);
      const aliases = CANONICAL_ALIASES[relic.id] ?? [];
      let matchedAlias: string | undefined;
      let score = 0;

      if (relic.id === query || normName === query) {
        score = 100;
      } else if (normName.startsWith(query)) {
        score = 80;
      } else if (normName.includes(query)) {
        score = 60;
      } else {
        for (const alias of aliases) {
          const normAlias = normalizeSearchString(alias);
          if (normAlias.includes(query)) {
            matchedAlias = alias;
            score = 50;
            break;
          }
        }
      }

      if (score > 0) {
        results.push({
          id: relic.id,
          name: relic.name,
          entityType: "relic_set",
          category: relic.type,
          matchedAlias,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
}

export const knowledgeRepository = new KnowledgeRepository();
