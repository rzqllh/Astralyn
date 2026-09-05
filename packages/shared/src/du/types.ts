import type { CombatPath } from "../knowledge/character";

// ============================================================================
// Phase 7 DU Recommendation Engine Types
// Decision D-028: pure fixed-point integer math clamped [0, 100]
// Decision D-030: client-only, zero LLM, zero network dependency
// ============================================================================

export type DUReasonCode =
  | "EQUATION_PROGRESS"
  | "EQUATION_COMPLETED"
  | "PARTY_PATH_SYNERGY_CARRY"
  | "PARTY_PATH_SYNERGY_SUPPORT"
  | "RARITY_WEIGHT"
  | "DUPLICATE_BLESSING"
  | "WEIGHTED_CURIO_SYNERGY"
  | "CURIO_UTILITY"
  | "NEGATIVE_CURIO_RISK"
  | "EQUATION_PATH_MATCH"
  | "NO_EQUATION_MATCH";

export type DUReasonCategory = "equation" | "path" | "rarity" | "curio";

export interface DUReason {
  code: DUReasonCode;
  category: DUReasonCategory;
  scoreDelta: number;
  message: string;
}

export interface DURunContext {
  partyPaths: CombatPath[];
  targetEquationIds: string[];
  collectedBlessingIds: string[];
  activeCurioIds: string[];
}

export interface DUPickEvaluation {
  entityId: string;
  entityType: "blessing" | "equation" | "curio";
  score: number; // [0, 100] fixed-point integer
  rank: number; // 1, 2, 3
  isRecommended: boolean;
  reasons: DUReason[];
}
