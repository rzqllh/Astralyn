import { z } from "zod";
import { CombatElementSchema } from "./character";
import { FactProvenanceSchema } from "./provenance";

export const StageTypeSchema = z.enum([
  "memory_of_chaos",
  "pure_fiction",
  "apocalyptic_shadow",
  "divergent_universe",
]);

export type StageType = z.infer<typeof StageTypeSchema>;

export const StageWaveSchema = z.object({
  waveNumber: z.number().int().positive(),
  enemies: z.array(z.string()).min(1),
});

export type StageWave = z.infer<typeof StageWaveSchema>;

export const StageKnowledgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  stageType: StageTypeSchema,
  floorNumber: z.number().int().positive(),
  rotationId: z.string().min(1),
  cycle: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  buffName: z.string(),
  buffDescription: z.string(),
  recommendedElements: z.array(CombatElementSchema).min(1),
  waves: z.array(StageWaveSchema).min(1),
  releaseVersion: z.string(),
  provenance: FactProvenanceSchema,
  source: z.string().optional(),
  verifiedAt: z.string().optional(),
});

export type StageKnowledge = z.infer<typeof StageKnowledgeSchema>;
