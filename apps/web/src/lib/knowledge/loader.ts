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
  REQUIRED_KNOWLEDGE_FILENAMES,
  assertKnowledgeReleaseConsistency,
  KnowledgeReleaseIntegrityError,
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
  type KnowledgeFileEntry,
  type RequiredKnowledgeFilename,
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
import webPackage from "../../../package.json";

export const DEFAULT_APP_VERSION = webPackage.version;

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

export class ByteSizeMismatchError extends Error {
  constructor(
    public filename: string,
    public expected: number,
    public actual: number
  ) {
    super(
      `Byte size verification failed for ${filename}: expected ${expected} bytes, got ${actual} bytes`
    );
    this.name = "ByteSizeMismatchError";
  }
}

async function computeSha256Hex(data: Uint8Array): Promise<string> {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest(
      "SHA-256",
      data as ArrayBufferView as BufferSource
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node fallback if subtle crypto is not present
  try {
    const nodeCrypto = await import("node:crypto");
    return nodeCrypto.createHash("sha256").update(Buffer.from(data)).digest("hex");
  } catch {
    throw new Error("No cryptographic digest implementation available.");
  }
}

async function computeSha256HexForString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  return computeSha256Hex(encoder.encode(text));
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
  private appVersion: string;

  constructor(baseUrl = "/data", appVersion = DEFAULT_APP_VERSION) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.appVersion = appVersion;
  }

  getAppVersion(): string {
    return this.appVersion;
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

  async fetchRawBuffer(url: string): Promise<Uint8Array> {
    const res = await fetch(url, {
      headers: { Accept: "application/json, text/plain, application/octet-stream" },
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async fetchVerifiedJson<T>(
    url: string,
    entry: KnowledgeFileEntry,
    schema: z.ZodType<T>
  ): Promise<T> {
    const rawBytes = await this.fetchRawBuffer(url);

    // 1. Verify byte length against sizeBytes
    if (rawBytes.byteLength !== entry.sizeBytes) {
      throw new ByteSizeMismatchError(
        entry.filename,
        entry.sizeBytes,
        rawBytes.byteLength
      );
    }

    // 2. Verify SHA-256 checksum on raw bytes
    const actualChecksum = await computeSha256Hex(rawBytes);
    if (actualChecksum !== entry.checksum) {
      throw new ChecksumMismatchError(entry.filename, entry.checksum, actualChecksum);
    }

    // 3. Decode fatal UTF-8
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let rawText: string;
    try {
      rawText = decoder.decode(rawBytes);
    } catch (decodeErr: unknown) {
      const msg = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
      throw new KnowledgeReleaseIntegrityError([
        `Fatal UTF-8 decoding failed for '${entry.filename}': ${msg}`,
      ]);
    }

    // 4. Parse JSON and validate entity schema
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

    // Build filename map after release manifest schema has verified the exact 6-file contract
    const fileMap = new Map<RequiredKnowledgeFilename, KnowledgeFileEntry>();
    for (const entry of releaseManifest.files) {
      fileMap.set(entry.filename, entry);
    }

    const charEntry = fileMap.get("characters.json")!;
    const lcEntry = fileMap.get("light-cones.json")!;
    const relicEntry = fileMap.get("relics.json")!;
    const enemyEntry = fileMap.get("enemies.json")!;
    const stageEntry = fileMap.get("stages.json")!;
    const duEntry = fileMap.get("divergent-universe.json")!;

    // Parallel fetch of all canonical release files with byte-size and SHA-256 verification
    const [characters, lightCones, relics, enemies, stages, duBundle] = await Promise.all(
      [
        this.fetchVerifiedJson(
          `${this.baseUrl}/${charEntry.relPath}`,
          charEntry,
          z.array(CharacterKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${this.baseUrl}/${lcEntry.relPath}`,
          lcEntry,
          z.array(LightConeKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${this.baseUrl}/${relicEntry.relPath}`,
          relicEntry,
          z.array(RelicSetKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${this.baseUrl}/${enemyEntry.relPath}`,
          enemyEntry,
          z.array(EnemyKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${this.baseUrl}/${stageEntry.relPath}`,
          stageEntry,
          z.array(StageKnowledgeSchema)
        ),
        this.fetchVerifiedJson(
          `${this.baseUrl}/${duEntry.relPath}`,
          duEntry,
          z.object({
            blessings: z.array(DUBlessingKnowledgeSchema),
            equations: z.array(DUEquationKnowledgeSchema),
            curios: z.array(DUCurioKnowledgeSchema),
          })
        ),
      ]
    );

    // Compute actual entity counts
    const entityCounts: Record<RequiredKnowledgeFilename, number> = {
      "characters.json": characters.length,
      "light-cones.json": lightCones.length,
      "relics.json": relics.length,
      "enemies.json": enemies.length,
      "stages.json": stages.length,
      "divergent-universe.json":
        duBundle.blessings.length + duBundle.equations.length + duBundle.curios.length,
    };

    // Recompute and verify sourceSnapshotHash
    let combinedChecksums = "";
    for (const fn of REQUIRED_KNOWLEDGE_FILENAMES) {
      combinedChecksums += releaseManifest.checksums[fn] || "";
    }
    const computedSourceSnapshotHash = await computeSha256HexForString(combinedChecksums);
    if (computedSourceSnapshotHash !== releaseManifest.sourceSnapshotHash) {
      throw new KnowledgeReleaseIntegrityError([
        `Source snapshot hash mismatch: manifest claims '${releaseManifest.sourceSnapshotHash}' but SHA-256 of canonical checksums is '${computedSourceSnapshotHash}'`,
      ]);
    }

    // Shared cross-document, count, and application compatibility validation
    assertKnowledgeReleaseConsistency({
      rootManifest,
      releaseManifest,
      entityCounts,
      appVersion: this.appVersion,
    });

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
