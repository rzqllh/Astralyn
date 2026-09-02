import { z } from "zod";
import {
  KnowledgeReleaseManifestSchema,
  REQUIRED_KNOWLEDGE_FILENAMES,
  type RequiredKnowledgeFilename,
  type KnowledgeReleaseManifest,
  type RootKnowledgeManifest,
  isAppCompatible,
} from "./version";
import { CharacterKnowledgeSchema } from "./character";
import { LightConeKnowledgeSchema } from "./light-cone";
import { RelicSetKnowledgeSchema } from "./relic";
import { EnemyKnowledgeSchema } from "./enemy";
import { StageKnowledgeSchema } from "./stage";
import {
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
} from "./divergent-universe";

export const KnowledgeReleaseBundleSchema = z.object({
  manifest: KnowledgeReleaseManifestSchema,
  characters: z.array(CharacterKnowledgeSchema),
  lightCones: z.array(LightConeKnowledgeSchema),
  relics: z.array(RelicSetKnowledgeSchema),
  enemies: z.array(EnemyKnowledgeSchema),
  stages: z.array(StageKnowledgeSchema),
  divergentUniverse: z.object({
    blessings: z.array(DUBlessingKnowledgeSchema),
    equations: z.array(DUEquationKnowledgeSchema),
    curios: z.array(DUCurioKnowledgeSchema),
  }),
});

export type KnowledgeReleaseBundle = z.infer<typeof KnowledgeReleaseBundleSchema>;

export class KnowledgeReleaseIntegrityError extends Error {
  constructor(public errors: string[]) {
    super(
      `Knowledge release integrity validation failed with ${errors.length} violation(s):\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
    this.name = "KnowledgeReleaseIntegrityError";
  }
}

export type KnowledgeCollectionsInput =
  | KnowledgeReleaseBundle
  | {
      characters: unknown[];
      lightCones: unknown[];
      relics?: unknown[];
      relicSets?: unknown[];
      enemies: unknown[];
      stages: unknown[];
      divergentUniverse?: {
        blessings: unknown[];
        equations: unknown[];
        curios: unknown[];
      };
      duBlessings?: unknown[];
      duEquations?: unknown[];
      duCurios?: unknown[];
    };

export function getKnowledgeEntityCounts(
  input: KnowledgeCollectionsInput
): Record<RequiredKnowledgeFilename, number> {
  const relicCount =
    "relics" in input && Array.isArray(input.relics)
      ? input.relics.length
      : "relicSets" in input && Array.isArray(input.relicSets)
        ? input.relicSets.length
        : 0;

  const duCount =
    "divergentUniverse" in input && input.divergentUniverse
      ? input.divergentUniverse.blessings.length +
        input.divergentUniverse.equations.length +
        input.divergentUniverse.curios.length
      : ("duBlessings" in input && Array.isArray(input.duBlessings)
          ? input.duBlessings.length
          : 0) +
        ("duEquations" in input && Array.isArray(input.duEquations)
          ? input.duEquations.length
          : 0) +
        ("duCurios" in input && Array.isArray(input.duCurios)
          ? input.duCurios.length
          : 0);

  return {
    "characters.json": input.characters.length,
    "light-cones.json": input.lightCones.length,
    "relics.json": relicCount,
    "enemies.json": input.enemies.length,
    "stages.json": input.stages.length,
    "divergent-universe.json": duCount,
  };
}

export function validateKnowledgeReleaseConsistency(input: {
  rootManifest: RootKnowledgeManifest;
  releaseManifest: KnowledgeReleaseManifest;
  entityCounts: Record<RequiredKnowledgeFilename, number>;
  appVersion: string;
}): string[] {
  const errors: string[] = [];
  const { rootManifest, releaseManifest, entityCounts, appVersion } = input;
  const targetVersion = rootManifest.currentKnowledgeVersion;

  // 1. Root vs Release Version Agreement
  if (releaseManifest.knowledgeVersion !== targetVersion) {
    errors.push(
      `Version mismatch: Root manifest current version is '${targetVersion}' but release manifest is '${releaseManifest.knowledgeVersion}'`
    );
  }

  if (rootManifest.gameVersion !== releaseManifest.gameVersion) {
    errors.push(
      `Game version mismatch: Root manifest specifies '${rootManifest.gameVersion}' but release manifest has '${releaseManifest.gameVersion}'`
    );
  }

  if (rootManifest.schemaVersion !== releaseManifest.schemaVersion) {
    errors.push(
      `Schema version mismatch: Root manifest specifies '${rootManifest.schemaVersion}' but release manifest has '${releaseManifest.schemaVersion}'`
    );
  }

  // 2. Embedded release descriptor in root manifest must match fetched release manifest exactly
  const embeddedRelease = rootManifest.releases[targetVersion];
  if (!embeddedRelease) {
    errors.push(
      `Root manifest releases map is missing entry for current version '${targetVersion}'`
    );
  } else {
    if (embeddedRelease.knowledgeVersion !== releaseManifest.knowledgeVersion) {
      errors.push(
        `Embedded release descriptor knowledgeVersion '${embeddedRelease.knowledgeVersion}' does not match release manifest '${releaseManifest.knowledgeVersion}'`
      );
    }
    if (embeddedRelease.gameVersion !== releaseManifest.gameVersion) {
      errors.push(
        `Embedded release descriptor gameVersion '${embeddedRelease.gameVersion}' does not match release manifest '${releaseManifest.gameVersion}'`
      );
    }
    if (embeddedRelease.schemaVersion !== releaseManifest.schemaVersion) {
      errors.push(
        `Embedded release descriptor schemaVersion '${embeddedRelease.schemaVersion}' does not match release manifest '${releaseManifest.schemaVersion}'`
      );
    }
    if (embeddedRelease.generatedAt !== releaseManifest.generatedAt) {
      errors.push(
        `Embedded release descriptor generatedAt '${embeddedRelease.generatedAt}' does not match release manifest '${releaseManifest.generatedAt}'`
      );
    }
    if (embeddedRelease.sourceSnapshotHash !== releaseManifest.sourceSnapshotHash) {
      errors.push(
        `Embedded release descriptor sourceSnapshotHash '${embeddedRelease.sourceSnapshotHash}' does not match release manifest '${releaseManifest.sourceSnapshotHash}'`
      );
    }
    if (embeddedRelease.status !== releaseManifest.status) {
      errors.push(
        `Embedded release descriptor status '${embeddedRelease.status}' does not match release manifest '${releaseManifest.status}'`
      );
    }
    if (
      embeddedRelease.compatibility.minAppVersion !==
      releaseManifest.compatibility.minAppVersion
    ) {
      errors.push(
        `Embedded release descriptor minAppVersion '${embeddedRelease.compatibility.minAppVersion}' does not match release manifest '${releaseManifest.compatibility.minAppVersion}'`
      );
    }

    // Compare files and checksums in embedded vs fetched release
    for (const filename of REQUIRED_KNOWLEDGE_FILENAMES) {
      const embeddedChecksum = embeddedRelease.checksums[filename];
      const fetchedChecksum = releaseManifest.checksums[filename];
      if (embeddedChecksum !== fetchedChecksum) {
        errors.push(
          `Embedded release checksum mismatch for '${filename}': root has '${embeddedChecksum}', release has '${fetchedChecksum}'`
        );
      }

      const embeddedFile = embeddedRelease.files.find((f) => f.filename === filename);
      const fetchedFile = releaseManifest.files.find((f) => f.filename === filename);
      if (!embeddedFile) {
        errors.push(
          `Embedded release descriptor is missing file entry for '${filename}'`
        );
      } else if (!fetchedFile) {
        errors.push(`Release manifest is missing file entry for '${filename}'`);
      } else {
        if (embeddedFile.checksum !== fetchedFile.checksum) {
          errors.push(
            `Embedded release file checksum mismatch for '${filename}': root has '${embeddedFile.checksum}', release has '${fetchedFile.checksum}'`
          );
        }
        if (embeddedFile.sizeBytes !== fetchedFile.sizeBytes) {
          errors.push(
            `Embedded release file sizeBytes mismatch for '${filename}': root has '${embeddedFile.sizeBytes}', release has '${fetchedFile.sizeBytes}'`
          );
        }
        if (embeddedFile.entityCount !== fetchedFile.entityCount) {
          errors.push(
            `Embedded release file entityCount mismatch for '${filename}': root has '${embeddedFile.entityCount}', release has '${fetchedFile.entityCount}'`
          );
        }
        if (embeddedFile.relPath !== fetchedFile.relPath) {
          errors.push(
            `Embedded release file relPath mismatch for '${filename}': root has '${embeddedFile.relPath}', release has '${fetchedFile.relPath}'`
          );
        }
      }
    }
  }

  // 3. Compare declared vs actual entity counts
  for (const filename of REQUIRED_KNOWLEDGE_FILENAMES) {
    const fileEntry = releaseManifest.files.find((f) => f.filename === filename);
    const actualCount = entityCounts[filename];
    if (fileEntry && typeof actualCount === "number") {
      if (fileEntry.entityCount !== actualCount) {
        errors.push(
          `Entity count mismatch for '${filename}': manifest declares ${fileEntry.entityCount}, actual parsed count is ${actualCount}`
        );
      }
    }
  }

  // 4. Application Compatibility Check
  try {
    const compatible = isAppCompatible(
      appVersion,
      releaseManifest.compatibility.minAppVersion
    );
    if (!compatible) {
      errors.push(
        `Application version '${appVersion}' is incompatible with release minimum required version '${releaseManifest.compatibility.minAppVersion}' (requires appVersion >= minAppVersion)`
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to check application compatibility: ${msg}`);
  }

  return errors;
}

export function assertKnowledgeReleaseConsistency(input: {
  rootManifest: RootKnowledgeManifest;
  releaseManifest: KnowledgeReleaseManifest;
  entityCounts: Record<RequiredKnowledgeFilename, number>;
  appVersion: string;
}): void {
  const errors = validateKnowledgeReleaseConsistency(input);
  if (errors.length > 0) {
    throw new KnowledgeReleaseIntegrityError(errors);
  }
}
