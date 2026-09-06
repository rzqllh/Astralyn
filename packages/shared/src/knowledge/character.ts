import { z } from "zod";
import { FactProvenanceSchema } from "./provenance";

export const CombatElementSchema = z.enum([
  "Physical",
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Quantum",
  "Imaginary",
]);

export type CombatElement = z.infer<typeof CombatElementSchema>;

export const CombatPathSchema = z.enum([
  "Destruction",
  "Hunt",
  "Erudition",
  "Harmony",
  "Nihility",
  "Preservation",
  "Abundance",
  "Remembrance",
  "Elation",
]);

export type CombatPath = z.infer<typeof CombatPathSchema>;

export const CharacterRaritySchema = z.union([z.literal(4), z.literal(5)]);

export type CharacterRarity = z.infer<typeof CharacterRaritySchema>;

// Astralyn Deterministic Taxonomy: Roles (Derived Metadata)
export const CharacterRoleSchema = z.enum([
  "hypercarry_dps",
  "sub_dps",
  "buffer",
  "debuffer",
  "shielder",
  "healer",
  "battery",
  "break_dps",
  "dot_dps",
  "summon_dps",
  "elation_dps",
  "unknown",
]);

export type CharacterRole = z.infer<typeof CharacterRoleSchema>;

// Astralyn Deterministic Taxonomy: Mechanic Tags (Derived Metadata)
export const CharacterMechanicTagSchema = z.enum([
  "dot",
  "follow_up",
  "break_effect",
  "super_break",
  "summon",
  "memosprite",
  "energy_regen",
  "shield",
  "heal",
  "debuff",
  "action_advance",
  "hp_consumption",
  "special_resource_cost",
  "counter_attack",
  "single_target",
  "blast",
  "aoe",
  "bounce",
  "stat_conversion",
  "weakness_break_efficiency",
  "toughness_reduction",
  "defense_shred",
  "res_penetration",
  "freeze",
  "dissociation",
  "vulnerability",
  "cleanse",
  "buff",
  "enhanced_basic",
  "enhanced_skill",
  "elation",
  "punchline",
  "fervor",
  "interpretation",
  "inspiration",
  "unknown",
]);

export type CharacterMechanicTag = z.infer<typeof CharacterMechanicTagSchema>;

export const BaseStatsSchema = z.object({
  hp: z.number().positive(),
  atk: z.number().positive(),
  def: z.number().positive(),
  spd: z.number().positive(),
  taunt: z.number().int().nonnegative(),
  critRate: z.number().min(0).max(1),
  critDmg: z.number().min(0),
  maxEnergy: z.number().nonnegative().nullable().optional(),
});

export type BaseStats = z.infer<typeof BaseStatsSchema>;

export const AbilityTypeSchema = z.enum([
  "basic",
  "skill",
  "ultimate",
  "talent",
  "technique",
  "enhanced_basic",
  "enhanced_skill",
  "enhanced_ultimate",
  "memosprite_skill",
  "memosprite_talent",
  "elation_skill",
  "elation_talent",
]);

export type AbilityType = z.infer<typeof AbilityTypeSchema>;

export const AbilityTargetTypeSchema = z.enum([
  "single_enemy",
  "blast_enemy",
  "all_enemies",
  "single_ally",
  "all_allies",
  "self",
  "bounce_enemy",
]);

export type AbilityTargetType = z.infer<typeof AbilityTargetTypeSchema>;

export const CharacterAbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AbilityTypeSchema,
  tag: z.string(),
  targetType: AbilityTargetTypeSchema,
  energyGain: z.number().int().nonnegative().optional(),
  energyCost: z.number().int().nonnegative().optional(),
  specialResourceCost: z.number().int().nonnegative().optional(),
  spCost: z.number().int().optional(),
  description: z.string(),
  mechanics: z.array(CharacterMechanicTagSchema),
});

export type CharacterAbility = z.infer<typeof CharacterAbilitySchema>;

export const MemospriteSchema = z.object({
  name: z.string(),
  baseSpdRatio: z.number().positive().optional(),
  baseSpdFlat: z.number().positive().optional(),
  baseHpRatio: z.number().positive().optional(),
  abilities: z.array(CharacterAbilitySchema),
  description: z.string(),
});

export type Memosprite = z.infer<typeof MemospriteSchema>;

export const StanceTransformationSchema = z.object({
  stanceName: z.string(),
  durationDescription: z.string(),
  enhancedAbilities: z.array(CharacterAbilitySchema),
  description: z.string(),
});

export type StanceTransformation = z.infer<typeof StanceTransformationSchema>;

export const MajorTraceSchema = z.object({
  id: z.string(),
  name: z.string(),
  ascensionRequirement: z.enum(["A2", "A4", "A6"]),
  description: z.string(),
  mechanics: z.array(CharacterMechanicTagSchema),
});

export type MajorTrace = z.infer<typeof MajorTraceSchema>;

export const MinorTraceStatSchema = z.object({
  stat: z.string(),
  totalValue: z.number().positive(),
  unit: z.enum(["percentage", "flat"]),
});

export type MinorTraceStat = z.infer<typeof MinorTraceStatSchema>;

export const EidolonRankSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export type EidolonRank = z.infer<typeof EidolonRankSchema>;

export const EidolonSchema = z.object({
  rank: EidolonRankSchema,
  name: z.string(),
  description: z.string(),
  keyMechanic: z.string(),
  mechanics: z.array(CharacterMechanicTagSchema),
});

export type Eidolon = z.infer<typeof EidolonSchema>;

export const LocalizedNamesSchema = z.object({
  en: z.string(),
  id: z.string(),
  ja: z.string().optional(),
  zh: z.string().optional(),
});

export type LocalizedNames = z.infer<typeof LocalizedNamesSchema>;

export const CharacterKnowledgeSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  name: z.string(),
  localizedNames: LocalizedNamesSchema,
  rarity: CharacterRaritySchema,
  path: CombatPathSchema,
  element: CombatElementSchema,
  releaseVersion: z.string(),
  roles: z.array(CharacterRoleSchema).min(1),
  mechanicTags: z.array(CharacterMechanicTagSchema).min(1),
  baseStats: BaseStatsSchema,
  specialResourceType: z.string().optional(),
  abilities: z.array(CharacterAbilitySchema).min(1),
  memosprite: MemospriteSchema.optional(),
  transformation: StanceTransformationSchema.optional(),
  majorTraces: z.array(MajorTraceSchema),
  minorTraces: z.array(MinorTraceStatSchema),
  eidolons: z.array(EidolonSchema).length(6),
  provenance: FactProvenanceSchema,
  source: z.string().optional(),
  verifiedAt: z.string().optional(),
});

export type CharacterKnowledge = z.infer<typeof CharacterKnowledgeSchema>;
