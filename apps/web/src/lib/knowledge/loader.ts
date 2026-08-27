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

export class ChecksumMismatchError extends Error {
  constructor(
    public filename: string,
    public expected: string,
    public actual: string
  ) {
    super(
      `SHA-256 checksum verification failed for ${filename}: expected ${expected}, got ${actual}`
    );
    this.name = "ChecksumMismatchError";
  }
}

async function computeSha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node fallback if subtle crypto is not present
  try {
    const nodeCrypto = await import("node:crypto");
    return nodeCrypto.createHash("sha256").update(text, "utf8").digest("hex");
  } catch {
    throw new Error("No cryptographic digest implementation available.");
  }
}

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

  async fetchRawText(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { Accept: "application/json, text/plain" },
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
    }

    return res.text();
  }

  async fetchVerifiedJson<T>(
    url: string,
    filename: string,
    expectedChecksum: string | undefined,
    schema: z.ZodType<T>
  ): Promise<T> {
    const rawText = await this.fetchRawText(url);

    if (expectedChecksum) {
      const actualChecksum = await computeSha256Hex(rawText);
      if (actualChecksum !== expectedChecksum) {
        throw new ChecksumMismatchError(filename, expectedChecksum, actualChecksum);
      }
    }

    const parsed = JSON.parse(rawText);
    return schema.parse(parsed);
  }

  async fetchRootManifest(): Promise<RootKnowledgeManifest> {
    const rawText = await this.fetchRawText(`${this.baseUrl}/manifest.json`);
    const parsed = JSON.parse(rawText);
    return RootKnowledgeManifestSchema.parse(parsed);
  }

  async fetchReleaseManifest(version: string): Promise<KnowledgeReleaseManifest> {
    const rawText = await this.fetchRawText(`${this.baseUrl}/${version}/release.json`);
    const parsed = JSON.parse(rawText);
    return KnowledgeReleaseManifestSchema.parse(parsed);
  }

  async loadFullRelease(
    version: string,
    rootManifest: RootKnowledgeManifest
  ): Promise<LoadedKnowledgeRelease> {
    const releaseManifest = await this.fetchReleaseManifest(version);
    const versionBase = `${this.baseUrl}/${version}`;
    const checksums = releaseManifest.checksums;

    // Parallel fetch of all release files with SHA-256 byte checksum validation
    const [characters, lightCones, relics, enemies, stages, duBundle] = await Promise.all(
      [
        this.fetchVerifiedJson(
          `${versionBase}/characters.json`,
          "characters.json",
          checksums["characters.json"],
          z.array(CharacterKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${versionBase}/light-cones.json`,
          "light-cones.json",
          checksums["light-cones.json"],
          z.array(LightConeKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${versionBase}/relics.json`,
          "relics.json",
          checksums["relics.json"],
          z.array(RelicSetKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${versionBase}/enemies.json`,
          "enemies.json",
          checksums["enemies.json"],
          z.array(EnemyKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${versionBase}/stages.json`,
          "stages.json",
          checksums["stages.json"],
          z.array(StageKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${versionBase}/divergent-universe.json`,
          "divergent-universe.json",
          checksums["divergent-universe.json"],
          z.object({
            blessings: z.array(DUBlessingKnowledgeSchema),
            equations: z.array(DUEquationKnowledgeSchema),
            curios: z.array(DUCurioKnowledgeSchema),
          })
        ),
      ]
    );

    return {
      manifest: rootManifest,
      releaseManifest,
      characters,
      lightCones,
      relicSets: relics,
      enemies,
      stages,
      duBlessings: duBundle.blessings,
      duEquations: duBundle.equations,
      duCurios: duBundle.curios,
    };
  }
}
