import { z } from "zod";
import { CombatPathSchema } from "./character";
import { FactProvenanceSchema } from "./provenance";

export const LightConeRaritySchema = z.union([z.literal(3), z.literal(4), z.literal(5)]);

export type LightConeRarity = z.infer<typeof LightConeRaritySchema>;

export const LightConeBaseStatsSchema = z.object({
  hp: z.number().positive(),
  atk: z.number().positive(),
  def: z.number().positive(),
});

export type LightConeBaseStats = z.infer<typeof LightConeBaseStatsSchema>;

export const LightConeSkillSchema = z.object({
  name: z.string(),
  descriptionTemplate: z.string(),
  superimpositions: z.array(z.string()).length(5),
});

export type LightConeSkill = z.infer<typeof LightConeSkillSchema>;

export const LightConeKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  rarity: LightConeRaritySchema,
  path: CombatPathSchema,
  baseStats: LightConeBaseStatsSchema,
  skill: LightConeSkillSchema,
  releaseVersion: z.string(),
  provenance: FactProvenanceSchema,
  source: z.string().optional(),
  verifiedAt: z.string().optional(),
});

export type LightConeKnowledge = z.infer<typeof LightConeKnowledgeSchema>;
