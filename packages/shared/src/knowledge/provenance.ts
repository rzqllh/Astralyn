import { z } from "zod";

export const SourceAuthorityTierSchema = z.enum([
  "tier_a_official",
  "tier_b_structured_community",
  "tier_c_editorial",
]);
export type SourceAuthorityTier = z.infer<typeof SourceAuthorityTierSchema>;

export const FactProvenanceSchema = z.object({
  sourceId: z.string().min(1),
  authorityTier: SourceAuthorityTierSchema,
  sourceUrl: z.string().min(1),
  gameVersion: z.string().min(1),
  verifiedAt: z.string().min(10),
  notes: z.string().optional(),
});
export type FactProvenance = z.infer<typeof FactProvenanceSchema>;
