import { z } from "zod";

export const REQUIRED_KNOWLEDGE_FILENAMES = [
  "characters.json",
  "light-cones.json",
  "relics.json",
  "enemies.json",
  "stages.json",
  "divergent-universe.json",
] as const;

export const RequiredKnowledgeFilenameSchema = z.enum(REQUIRED_KNOWLEDGE_FILENAMES);
export type RequiredKnowledgeFilename = z.infer<typeof RequiredKnowledgeFilenameSchema>;

export const Sha256HexSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "Must be a 64-character lowercase hexadecimal SHA-256 string");

export const SEMVER_CORE_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const SemVerCoreSchema = z
  .string()
  .regex(
    SEMVER_CORE_REGEX,
    "Must be a valid SemVer core string (major.minor.patch with non-negative integers and no leading zeros)"
  );

export interface SemVerCore {
  major: number;
  minor: number;
  patch: number;
}

export function parseSemVerCore(version: string): SemVerCore | null {
  const match = SEMVER_CORE_REGEX.exec(version);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

export function compareSemVer(v1: string, v2: string): number {
  const parsed1 = parseSemVerCore(v1);
  if (!parsed1) {
    throw new Error(`Invalid SemVer version string: "${v1}"`);
  }
  const parsed2 = parseSemVerCore(v2);
  if (!parsed2) {
    throw new Error(`Invalid SemVer version string: "${v2}"`);
  }

  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  return 0;
}

export function isAppCompatible(appVersion: string, minAppVersion: string): boolean {
  return compareSemVer(appVersion, minAppVersion) >= 0;
}

export const GameVersionSchema = z.object({
  id: z.string(),
  versionNumber: z.string(),
  title: z.string(),
  releasedAt: z.string(),
  isActive: z.boolean(),
});

export type GameVersion = z.infer<typeof GameVersionSchema>;

export const KnowledgeReleaseStatusSchema = z.enum([
  "draft",
  "validated",
  "published",
  "superseded",
]);

export type KnowledgeReleaseStatus = z.infer<typeof KnowledgeReleaseStatusSchema>;

export const KnowledgeFileEntrySchema = z.object({
  filename: RequiredKnowledgeFilenameSchema,
  relPath: z.string().min(1),
  entityCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().positive(),
  checksum: Sha256HexSchema,
});

export type KnowledgeFileEntry = z.infer<typeof KnowledgeFileEntrySchema>;

export const KnowledgeReleaseManifestSchema = z
  .object({
    knowledgeVersion: z.string().min(1),
    gameVersion: z.string().min(1),
    schemaVersion: z.string().min(1),
    generatedAt: z.string().min(1),
    sourceSnapshotHash: Sha256HexSchema,
    status: KnowledgeReleaseStatusSchema,
    files: z.array(KnowledgeFileEntrySchema),
    checksums: z.record(z.string(), z.string()),
    compatibility: z.object({
      minAppVersion: SemVerCoreSchema,
    }),
  })
  .superRefine((data, ctx) => {
    // 1. Files must have exactly 6 entries in canonical order
    if (data.files.length !== REQUIRED_KNOWLEDGE_FILENAMES.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `files array must contain exactly ${REQUIRED_KNOWLEDGE_FILENAMES.length} entries in canonical order, got ${data.files.length}`,
        path: ["files"],
      });
      return;
    }

    for (let i = 0; i < REQUIRED_KNOWLEDGE_FILENAMES.length; i++) {
      const expectedFilename = REQUIRED_KNOWLEDGE_FILENAMES[i];
      const entry = data.files[i];
      if (entry.filename !== expectedFilename) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `File at index ${i} must be '${expectedFilename}', got '${entry.filename}'`,
          path: ["files", i, "filename"],
        });
      }

      const expectedRelPath = `${data.knowledgeVersion}/${entry.filename}`;
      if (entry.relPath !== expectedRelPath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `relPath for '${entry.filename}' must be '${expectedRelPath}', got '${entry.relPath}'`,
          path: ["files", i, "relPath"],
        });
      }
    }

    // 2. Check checksums record has exactly the 6 required keys
    const checksumKeys = Object.keys(data.checksums);
    if (checksumKeys.length !== REQUIRED_KNOWLEDGE_FILENAMES.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `checksums record must contain exactly ${REQUIRED_KNOWLEDGE_FILENAMES.length} keys, got ${checksumKeys.length}`,
        path: ["checksums"],
      });
    }

    for (const filename of REQUIRED_KNOWLEDGE_FILENAMES) {
      if (!(filename in data.checksums)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing checksum for required file '${filename}'`,
          path: ["checksums", filename],
        });
      } else {
        const val = data.checksums[filename];
        const hashResult = Sha256HexSchema.safeParse(val);
        if (!hashResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Checksum for '${filename}' is not a valid 64-character lowercase SHA-256 hex string`,
            path: ["checksums", filename],
          });
        }
      }
    }

    // 3. Compare entry.checksum with checksums[filename]
    for (let i = 0; i < data.files.length; i++) {
      const entry = data.files[i];
      const recordedChecksum = data.checksums[entry.filename];
      if (recordedChecksum && entry.checksum !== recordedChecksum) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Checksum mismatch for '${entry.filename}': files entry has '${entry.checksum}' but checksums record has '${recordedChecksum}'`,
          path: ["files", i, "checksum"],
        });
      }
    }
  });

export type KnowledgeReleaseManifest = z.infer<typeof KnowledgeReleaseManifestSchema>;

export const RootKnowledgeManifestSchema = z
  .object({
    currentKnowledgeVersion: z.string().min(1),
    gameVersion: z.string().min(1),
    schemaVersion: z.string().min(1),
    publishedAt: z.string().min(1),
    availableReleases: z.array(z.string().min(1)),
    releases: z.record(z.string(), KnowledgeReleaseManifestSchema),
  })
  .superRefine((data, ctx) => {
    // 1. availableReleases has no duplicates
    const availableSet = new Set(data.availableReleases);
    if (availableSet.size !== data.availableReleases.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "availableReleases must not contain duplicate versions",
        path: ["availableReleases"],
      });
    }

    // 2. availableReleases set matches Object.keys(releases)
    const releaseKeys = Object.keys(data.releases);
    const releaseKeySet = new Set(releaseKeys);

    if (
      availableSet.size !== releaseKeySet.size ||
      ![...availableSet].every((k) => releaseKeySet.has(k))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "availableReleases must exactly match the set of releases defined in releases map",
        path: ["availableReleases"],
      });
    }

    // 3. currentKnowledgeVersion is present in both
    if (!availableSet.has(data.currentKnowledgeVersion)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `currentKnowledgeVersion '${data.currentKnowledgeVersion}' is not listed in availableReleases`,
        path: ["currentKnowledgeVersion"],
      });
    }

    if (!data.releases[data.currentKnowledgeVersion]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `currentKnowledgeVersion '${data.currentKnowledgeVersion}' is not defined in releases map`,
        path: ["currentKnowledgeVersion"],
      });
      return;
    }

    // 4. current release status is published
    const currentRelease = data.releases[data.currentKnowledgeVersion];
    if (currentRelease.status !== "published") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `current release '${data.currentKnowledgeVersion}' must have status 'published', got '${currentRelease.status}'`,
        path: ["releases", data.currentKnowledgeVersion, "status"],
      });
    }

    // 5. root game/schema versions equal current embedded release values
    if (data.gameVersion !== currentRelease.gameVersion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Root gameVersion '${data.gameVersion}' does not match current release gameVersion '${currentRelease.gameVersion}'`,
        path: ["gameVersion"],
      });
    }

    if (data.schemaVersion !== currentRelease.schemaVersion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Root schemaVersion '${data.schemaVersion}' does not match current release schemaVersion '${currentRelease.schemaVersion}'`,
        path: ["schemaVersion"],
      });
    }
  });

export type RootKnowledgeManifest = z.infer<typeof RootKnowledgeManifestSchema>;
