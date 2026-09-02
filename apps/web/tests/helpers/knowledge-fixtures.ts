import {
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
  type KnowledgeFileEntry,
  REQUIRED_KNOWLEDGE_FILENAMES,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
} from "@astralyn/shared";
import { type LoadedKnowledgeRelease } from "../../src/lib/knowledge/loader";
import * as crypto from "node:crypto";

export const FAKE_VALID_HASH_1 =
  "1111111111111111111111111111111111111111111111111111111111111111";
export const FAKE_VALID_HASH_2 =
  "2222222222222222222222222222222222222222222222222222222222222222";
export const FAKE_VALID_HASH_3 =
  "3333333333333333333333333333333333333333333333333333333333333333";
export const FAKE_VALID_HASH_4 =
  "4444444444444444444444444444444444444444444444444444444444444444";
export const FAKE_VALID_HASH_5 =
  "5555555555555555555555555555555555555555555555555555555555555555";
export const FAKE_VALID_HASH_6 =
  "6666666666666666666666666666666666666666666666666666666666666666";

export function computeCanonicalSourceSnapshotHash(
  checksums: Record<string, string>
): string {
  let combined = "";
  for (const fn of REQUIRED_KNOWLEDGE_FILENAMES) {
    combined += checksums[fn] || "";
  }
  return crypto.createHash("sha256").update(combined, "utf8").digest("hex");
}

export function createValidFileEntries(
  version = "v1.0.0",
  hashes: Record<string, string> = {}
): KnowledgeFileEntry[] {
  const defaultHashes: Record<string, string> = {
    "characters.json": FAKE_VALID_HASH_1,
    "light-cones.json": FAKE_VALID_HASH_2,
    "relics.json": FAKE_VALID_HASH_3,
    "enemies.json": FAKE_VALID_HASH_4,
    "stages.json": FAKE_VALID_HASH_5,
    "divergent-universe.json": FAKE_VALID_HASH_6,
  };

  const defaultCounts: Record<string, number> = {
    "characters.json": CANONICAL_CHARACTERS.length,
    "light-cones.json": CANONICAL_LIGHT_CONES.length,
    "relics.json": CANONICAL_RELICS.length,
    "enemies.json": CANONICAL_ENEMIES.length,
    "stages.json": CANONICAL_STAGES.length,
    "divergent-universe.json":
      CANONICAL_DU_BLESSINGS.length +
      CANONICAL_DU_EQUATIONS.length +
      CANONICAL_DU_CURIOS.length,
  };

  return REQUIRED_KNOWLEDGE_FILENAMES.map((filename) => {
    const checksum = hashes[filename] ?? defaultHashes[filename];
    return {
      filename,
      relPath: `${version}/${filename}`,
      entityCount: defaultCounts[filename],
      sizeBytes: 1024,
      checksum,
    };
  });
}

export function createValidReleaseManifest(
  overrides: Partial<KnowledgeReleaseManifest> = {}
): KnowledgeReleaseManifest {
  const version = overrides.knowledgeVersion ?? "v1.0.0";
  const files = overrides.files ?? createValidFileEntries(version);
  const checksums: Record<string, string> = {};
  for (const file of files) {
    checksums[file.filename] = file.checksum;
  }

  const finalChecksums = overrides.checksums ?? checksums;
  const defaultSourceSnapshotHash = computeCanonicalSourceSnapshotHash(finalChecksums);

  return {
    knowledgeVersion: version,
    gameVersion: "4.5",
    schemaVersion: "1.0.0",
    generatedAt: "2026-08-27T00:00:00.000Z",
    sourceSnapshotHash: overrides.sourceSnapshotHash ?? defaultSourceSnapshotHash,
    status: "published",
    files,
    checksums: finalChecksums,
    compatibility: {
      minAppVersion: "0.0.1",
      ...overrides.compatibility,
    },
    ...overrides,
  };
}

export function createValidRootManifest(
  overrides: Partial<RootKnowledgeManifest> = {},
  releaseOverrides: Partial<KnowledgeReleaseManifest> = {}
): RootKnowledgeManifest {
  const currentVersion = overrides.currentKnowledgeVersion ?? "v1.0.0";
  const defaultRelease = createValidReleaseManifest({
    knowledgeVersion: currentVersion,
    ...releaseOverrides,
  });

  return {
    currentKnowledgeVersion: currentVersion,
    gameVersion: "4.5",
    schemaVersion: "1.0.0",
    publishedAt: "2026-08-27T00:00:00.000Z",
    availableReleases: [currentVersion],
    releases: {
      [currentVersion]: defaultRelease,
    },
    ...overrides,
  };
}

export function createValidLoadedRelease(
  rootOverrides: Partial<RootKnowledgeManifest> = {},
  releaseOverrides: Partial<KnowledgeReleaseManifest> = {}
): LoadedKnowledgeRelease {
  const releaseManifest = createValidReleaseManifest(releaseOverrides);
  const rootManifest = createValidRootManifest(
    {
      currentKnowledgeVersion: releaseManifest.knowledgeVersion,
      gameVersion: releaseManifest.gameVersion,
      schemaVersion: releaseManifest.schemaVersion,
      ...rootOverrides,
    },
    releaseManifest
  );

  return {
    manifest: rootManifest,
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
}
