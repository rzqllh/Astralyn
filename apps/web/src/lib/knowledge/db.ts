import Dexie, { type Table } from "dexie";
import type {
  CharacterKnowledge,
  LightConeKnowledge,
  RelicSetKnowledge,
  EnemyKnowledge,
  StageKnowledge,
  DUBlessingKnowledge,
  DUEquationKnowledge,
  DUCurioKnowledge,
} from "@astralyn/shared";

export interface KnowledgeMetadataRecord {
  key: string;
  value: string;
}

export class AstralynKnowledgeDB extends Dexie {
  metadata!: Table<KnowledgeMetadataRecord, string>;
  characters!: Table<CharacterKnowledge, string>;
  lightCones!: Table<LightConeKnowledge, string>;
  relicSets!: Table<RelicSetKnowledge, string>;
  enemies!: Table<EnemyKnowledge, string>;
  stages!: Table<StageKnowledge, string>;
  duBlessings!: Table<DUBlessingKnowledge, string>;
  duEquations!: Table<DUEquationKnowledge, string>;
  duCurios!: Table<DUCurioKnowledge, string>;

  constructor(dbName = "AstralynKnowledgeCache") {
    super(dbName);

    this.version(1).stores({
      metadata: "key",
      characters: "id, name, rarity, path, element, releaseVersion, *mechanicTags",
      lightCones: "id, name, rarity, path, releaseVersion",
      relicSets: "id, name, type, releaseVersion",
      enemies: "id, name, category, *weaknesses, releaseVersion",
      stages: "id, name, stageType, floorNumber, releaseVersion",
      duBlessings: "id, name, path, rarity, releaseVersion",
      duEquations: "id, name, rarity, primaryPath, secondaryPath, releaseVersion",
      duCurios: "id, name, rarity, category, releaseVersion",
    });
  }
}

export const knowledgeDB = new AstralynKnowledgeDB();
