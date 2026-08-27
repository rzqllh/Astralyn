import { z } from "zod";
import { CombatPathSchema } from "./character";

export const DUEntityTypeSchema = z.enum(["blessing", "curio", "equation"]);

export type DUEntityType = z.infer<typeof DUEntityTypeSchema>;

export const DURaritySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export type DURarity = z.infer<typeof DURaritySchema>;

export const DUBlessingKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  entityType: z.literal("blessing"),
  path: CombatPathSchema,
  rarity: DURaritySchema,
  effect: z.string(),
  enhancedEffect: z.string(),
  releaseVersion: z.string(),
  source: z.string(),
  verifiedAt: z.string(),
});

export type DUBlessingKnowledge = z.infer<typeof DUBlessingKnowledgeSchema>;

export const DUEquationKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  entityType: z.literal("equation"),
  rarity: DURaritySchema,
  primaryPath: CombatPathSchema,
  secondaryPath: CombatPathSchema,
  requiredBlessings: z.object({
    primaryCount: z.number().int().positive(),
    secondaryCount: z.number().int().positive(),
  }),
  effect: z.string(),
  releaseVersion: z.string(),
  source: z.string(),
  verifiedAt: z.string(),
});

export type DUEquationKnowledge = z.infer<typeof DUEquationKnowledgeSchema>;

export const DUCurioCategorySchema = z.enum(["normal", "negative", "weighted"]);

export type DUCurioCategory = z.infer<typeof DUCurioCategorySchema>;

export const DUCurioKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  entityType: z.literal("curio"),
  rarity: DURaritySchema,
  category: DUCurioCategorySchema,
  effect: z.string(),
  releaseVersion: z.string(),
  source: z.string(),
  verifiedAt: z.string(),
});

export type DUCurioKnowledge = z.infer<typeof DUCurioKnowledgeSchema>;

export const DUEntityKnowledgeSchema = z.discriminatedUnion("entityType", [
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
]);

export type DUEntityKnowledge = z.infer<typeof DUEntityKnowledgeSchema>;
