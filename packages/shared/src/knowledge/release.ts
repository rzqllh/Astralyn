import { z } from "zod";
import { KnowledgeReleaseManifestSchema } from "./version";
import { CharacterKnowledgeSchema } from "./character";
import { LightConeKnowledgeSchema } from "./light-cone";
import { RelicSetKnowledgeSchema } from "./relic";
import { EnemyKnowledgeSchema } from "./enemy";
import { StageKnowledgeSchema } from "./stage";
import {
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
} from "./divergent-universe";

export const KnowledgeReleaseBundleSchema = z.object({
  manifest: KnowledgeReleaseManifestSchema,
  characters: z.array(CharacterKnowledgeSchema),
  lightCones: z.array(LightConeKnowledgeSchema),
  relics: z.array(RelicSetKnowledgeSchema),
  enemies: z.array(EnemyKnowledgeSchema),
  stages: z.array(StageKnowledgeSchema),
  divergentUniverse: z.object({
    blessings: z.array(DUBlessingKnowledgeSchema),
    equations: z.array(DUEquationKnowledgeSchema),
    curios: z.array(DUCurioKnowledgeSchema),
  }),
});

export type KnowledgeReleaseBundle = z.infer<typeof KnowledgeReleaseBundleSchema>;
