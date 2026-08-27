import { z } from "zod";
import { CombatElementSchema } from "./character";

export const EnemyCategorySchema = z.enum(["minion", "elite", "boss", "weekly_boss"]);

export type EnemyCategory = z.infer<typeof EnemyCategorySchema>;

export const EnemySkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string(),
  element: CombatElementSchema.optional(),
});

export type EnemySkill = z.infer<typeof EnemySkillSchema>;

export const EnemyKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  category: EnemyCategorySchema,
  weaknesses: z.array(CombatElementSchema).min(1),
  resistances: z.record(CombatElementSchema, z.number().min(0)),
  skills: z.array(EnemySkillSchema),
  keyMechanics: z.array(z.string()),
  releaseVersion: z.string(),
  source: z.string(),
  verifiedAt: z.string(),
});

export type EnemyKnowledge = z.infer<typeof EnemyKnowledgeSchema>;
