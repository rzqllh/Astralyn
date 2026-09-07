import type { CombatElement, CharacterRole } from "../knowledge/character";

export type RecommendationMode =
  | "general"
  | "memory_of_chaos"
  | "pure_fiction"
  | "apocalyptic_shadow"
  | "divergent_universe";

export type RecommendationScope = "all_characters" | "owned_only";

export interface RecommendationContext {
  scope?: RecommendationScope;
  mode?: RecommendationMode;
  focusCharacterId?: string;
  targetWeaknesses?: CombatElement[];
  limit?: number;
}

export type RecommendationReasonCode =
  | "ROLE_SUSTAIN_SECURED"
  | "ROLE_PRIMARY_CARRY"
  | "ROLE_AMPLIFIER_PRESENT"
  | "SYNERGY_SUPER_BREAK_CORE"
  | "SYNERGY_MEMOSPRITE_ACCEL"
  | "SYNERGY_SLASHED_DREAM_FEED"
  | "SYNERGY_FOLLOW_UP_BATTERY"
  | "SYNERGY_ENERGY_BATTERY"
  | "EIDOLON_CONSTRAINT_RELAXED"
  | "PENALTY_NO_SUSTAIN"
  | "PENALTY_TOO_MANY_CARRIES"
  | "ACHERON_NIHILITY_DEFICIT";

export interface RecommendationReason {
  code: RecommendationReasonCode;
  category: "role" | "synergy" | "trace_constraint" | "eidolon" | "anti_synergy";
  type: "positive" | "penalty" | "requirement";
  scoreDelta: number;
  message: string;
  characterIds?: string[];
}

export interface RosterInputCharacter {
  characterId: string;
  level: number;
  eidolon: number;
  isOwned?: boolean | number;
}

export interface TeamSlotAssignment {
  slot: 1 | 2 | 3 | 4;
  characterId: string;
  role: CharacterRole;
  isOwned: boolean;
  level?: number;
  eidolon?: number;
}

export interface TeamEvaluation {
  rank: number;
  score: number;
  roleScore: number;
  synergyScore: number;
  elementScore: number;
  signature: string;
  archetype: string;
  taxonomyStatus: "complete" | "limited_data";
  limitedDataCharacterIds?: string[];
  slots: TeamSlotAssignment[];
  reasons: RecommendationReason[];
}

export interface RecommendationEvaluation {
  candidateCount: number;
  evaluatedTeamCount: number;
  maxCandidateCount: number;
  maxTeamEvaluations: number;
}

export interface RecommendationEngineResult {
  success: boolean;
  scope: RecommendationScope;
  gameVersion: string;
  knowledgeVersion: string;
  spStatus: "unavailable";
  consensusStatus: "mechanical_only";
  missingKnowledgeCharacterIds?: string[];
  status?: "ok" | "insufficient_roster";
  message?: string;
  evaluation: RecommendationEvaluation;
  teams: TeamEvaluation[];
}

/**
 * Locale-independent code-unit comparison function.
 * Avoids String.prototype.localeCompare() to guarantee mathematical determinism across all platforms and environments.
 */
export function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Builds a deterministic team signature by sorting character IDs by UTF-16 code units and joining with ':'.
 */
export function buildTeamSignature(characterIds: string[]): string {
  return characterIds.slice().sort(compareCodeUnits).join(":");
}
