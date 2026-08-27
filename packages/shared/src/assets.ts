import { z } from "zod";

export const AssetEntityTypeSchema = z.enum([
  "character_icon",
  "character_preview",
  "character_portrait",
  "path_icon",
  "element_icon",
  "light_cone_icon",
  "relic_set_icon",
  "relic_piece_icon",
  "planar_ornament_icon",
  "eidolon_icon",
  "skill_icon",
  "trace_icon",
  "material_icon",
  "enemy_icon",
  "du_blessing_icon",
  "du_equation_icon",
  "du_curio_icon",
]);

export type AssetEntityType = z.infer<typeof AssetEntityTypeSchema>;

export const AssetUsageStatusSchema = z.enum([
  "approved",
  "official_fan_use",
  "manual_review",
  "blocked",
  "unknown",
]);

export type AssetUsageStatus = z.infer<typeof AssetUsageStatusSchema>;

export const AssetVariantSchema = z.enum(["icon", "preview", "portrait", "full"]);

export type AssetVariant = z.infer<typeof AssetVariantSchema>;

export const AssetRecordSchema = z.object({
  id: z.string(),
  entityType: AssetEntityTypeSchema,
  entityId: z.string(),
  variant: AssetVariantSchema,
  localPath: z.string(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  repositoryLicense: z.string().optional(),
  license: z.string(),
  copyrightOwner: z.string(),
  usageStatus: AssetUsageStatusSchema,
  attribution: z.string(),
  fallbackPriority: z.number().int().nonnegative().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  checksum: z.string().optional(),
});

export type AssetRecord = z.infer<typeof AssetRecordSchema>;

export const AssetManifestSchema = z.object({
  assetRelease: z.string(),
  gameVersion: z.string(),
  generatedAt: z.string(),
  assets: z.array(AssetRecordSchema),
});

export type AssetManifest = z.infer<typeof AssetManifestSchema>;
