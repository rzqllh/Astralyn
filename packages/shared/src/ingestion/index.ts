import { z } from "zod";

export type SourceKind = "official" | "editorial" | "community";

export const IngestedRecommendationItemSchema = z.object({
  rank: z.number().int().min(1).max(10), // Support top 10 from sources, even if we only take Top 1-3
  payload: z.record(z.string(), z.unknown()), // Typically contains { characterId: "..." } or { teamMembers: ["...", "..."] }
  sourceScore: z.number().nullable().optional(),
  notes: z.record(z.string(), z.unknown()).default({}),
});
export type IngestedRecommendationItem = z.infer<typeof IngestedRecommendationItemSchema>;

export const IngestedRecommendationSetSchema = z.object({
  category: z.enum(["best_build", "best_team", "best_light_cone", "best_relic", "best_character", "best_teammate"]),
  subjectCharacterId: z.string().nullable().optional(),
  gameMode: z.string().nullable().optional(),
  stageId: z.string().nullable().optional(),
  sourceUpdatedAt: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  items: z.array(IngestedRecommendationItemSchema),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type IngestedRecommendationSet = z.infer<typeof IngestedRecommendationSetSchema>;

export const NormalizedPayloadSchema = z.object({
  factualEntities: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).optional(), // E.g., { characters: [...], lightCones: [...] }

  recommendationSets: z.array(IngestedRecommendationSetSchema).optional(),
});
export type NormalizedPayload = z.infer<typeof NormalizedPayloadSchema>;

export interface FetchResult {
  rawContent: string;
  etag?: string;
  lastModified?: string;
}

export interface AdapterWarning {
  code: string;
  message: string;
}

export interface SourceAdapter {
  sourceId: string;
  sourceKind: SourceKind;
  parserVersion: string;

  /**
   * Fetches the raw content from the source.
   * Can use conditional requests (ETag/Last-Modified) if supported.
   */
  fetch(previousEtag?: string, previousLastModified?: string): Promise<FetchResult | null>; // Returns null if not modified

  /**
   * Parses the raw content into an intermediate format.
   */
  parse(rawContent: string): Promise<unknown>;

  /**
   * Normalizes the intermediate format into the canonical NormalizedPayload.
   */
  normalize(parsedContent: unknown): Promise<{
    payload: NormalizedPayload;
    warnings: AdapterWarning[];
  }>;

  /**
   * Validates the normalized payload against business rules.
   */
  validate(payload: NormalizedPayload): Promise<{ valid: boolean; errors: string[] }>;
}
