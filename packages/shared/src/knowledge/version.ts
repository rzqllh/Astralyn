import { z } from "zod";

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
  filename: z.string(),
  relPath: z.string(),
  entityCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative(),
  checksum: z.string(),
});

export type KnowledgeFileEntry = z.infer<typeof KnowledgeFileEntrySchema>;

export const KnowledgeReleaseManifestSchema = z.object({
  knowledgeVersion: z.string(),
  gameVersion: z.string(),
  schemaVersion: z.string(),
  generatedAt: z.string(),
  sourceSnapshotHash: z.string(),
  status: KnowledgeReleaseStatusSchema,
  files: z.array(KnowledgeFileEntrySchema),
  checksums: z.record(z.string(), z.string()),
  compatibility: z.object({
    minAppVersion: z.string(),
  }),
});

export type KnowledgeReleaseManifest = z.infer<typeof KnowledgeReleaseManifestSchema>;

export const RootKnowledgeManifestSchema = z.object({
  currentKnowledgeVersion: z.string(),
  gameVersion: z.string(),
  schemaVersion: z.string(),
  publishedAt: z.string(),
  availableReleases: z.array(z.string()),
  releases: z.record(z.string(), KnowledgeReleaseManifestSchema),
});

export type RootKnowledgeManifest = z.infer<typeof RootKnowledgeManifestSchema>;
