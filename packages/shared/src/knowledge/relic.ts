import { z } from "zod";
import { FactProvenanceSchema } from "./provenance";

export const RelicSetTypeSchema = z.enum(["cavern_relic", "planar_ornament"]);

export type RelicSetType = z.infer<typeof RelicSetTypeSchema>;

export const RelicPieceSlotSchema = z.enum([
  "head",
  "hands",
  "body",
  "feet",
  "planar_sphere",
  "link_rope",
]);

export type RelicPieceSlot = z.infer<typeof RelicPieceSlotSchema>;

export const RelicPieceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: RelicPieceSlotSchema,
});

export type RelicPiece = z.infer<typeof RelicPieceSchema>;

export const RelicSetKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  type: RelicSetTypeSchema,
  twoPieceEffect: z.string(),
  fourPieceEffect: z.string().optional(),
  pieces: z.array(RelicPieceSchema),
  releaseVersion: z.string(),
  provenance: FactProvenanceSchema,
  source: z.string().optional(),
  verifiedAt: z.string().optional(),
});

export type RelicSetKnowledge = z.infer<typeof RelicSetKnowledgeSchema>;
