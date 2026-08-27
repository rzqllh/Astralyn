import {
  RootKnowledgeManifestSchema,
  KnowledgeReleaseManifestSchema,
  CharacterKnowledgeSchema,
  LightConeKnowledgeSchema,
  RelicSetKnowledgeSchema,
  EnemyKnowledgeSchema,
  StageKnowledgeSchema,
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
  type CharacterKnowledge,
  type LightConeKnowledge,
  type RelicSetKnowledge,
  type EnemyKnowledge,
  type StageKnowledge,
  type DUBlessingKnowledge,
  type DUEquationKnowledge,
  type DUCurioKnowledge,
} from "@astralyn/shared";
import { z } from "zod";

export interface LoadedKnowledgeRelease {
  manifest: RootKnowledgeManifest;
  releaseManifest: KnowledgeReleaseManifest;
  characters: CharacterKnowledge[];
  lightCones: LightConeKnowledge[];
  relicSets: RelicSetKnowledge[];
  enemies: EnemyKnowledge[];
  stages: StageKnowledge[];
  duBlessings: DUBlessingKnowledge[];
  duEquations: DUEquationKnowledge[];
  duCurios: DUCurioKnowledge[];
}

export class KnowledgeSnapshotLoader {
  private baseUrl: string;

  constructor(baseUrl = "/data") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return schema.parse(json);
  }

  async fetchRootManifest(): Promise<RootKnowledgeManifest> {
    return this.fetchJson(`${this.baseUrl}/manifest.json`, RootKnowledgeManifestSchema);
  }

  async fetchReleaseManifest(version: string): Promise<KnowledgeReleaseManifest> {
    return this.fetchJson(
      `${this.baseUrl}/${version}/release.json`,
      KnowledgeReleaseManifestSchema
    );
  }

  async loadFullRelease(
    version: string,
    rootManifest: RootKnowledgeManifest
  ): Promise<LoadedKnowledgeRelease> {
    const releaseManifest = await this.fetchReleaseManifest(version);

    const versionBase = `${this.baseUrl}/${version}`;

    // Parallel fetch of all release files
    const [characters, lightCones, relicSets, enemies, stages, duBundle] =
      await Promise.all([
        this.fetchJson(
          `${versionBase}/characters.json`,
          z.array(CharacterKnowledgeSchema)
        ),
        this.fetchJson(
          `${versionBase}/light-cones.json`,
          z.array(LightConeKnowledgeSchema)
        ),
        this.fetchJson(`${versionBase}/relics.json`, z.array(RelicSetKnowledgeSchema)),
        this.fetchJson(`${versionBase}/enemies.json`, z.array(EnemyKnowledgeSchema)),
        this.fetchJson(`${versionBase}/stages.json`, z.array(StageKnowledgeSchema)),
        this.fetchJson(
          `${versionBase}/divergent-universe.json`,
          z.object({
            blessings: z.array(DUBlessingKnowledgeSchema),
            equations: z.array(DUEquationKnowledgeSchema),
            curios: z.array(DUCurioKnowledgeSchema),
          })
        ),
      ]);

    return {
      manifest: rootManifest,
      releaseManifest,
      characters,
      lightCones,
      relicSets,
      enemies,
      stages,
      duBlessings: duBundle.blessings,
      duEquations: duBundle.equations,
      duCurios: duBundle.curios,
    };
  }
}
