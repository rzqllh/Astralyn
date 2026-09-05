import type { CombatPath } from "../knowledge/character";
import type {
  DUBlessingKnowledge,
  DUEquationKnowledge,
  DUCurioKnowledge,
} from "../knowledge/divergent-universe";
import { compareCodeUnits } from "../recommendation/types";
import type {
  DUReason,
  DURunContext,
  DUPickEvaluation,
} from "./types";

// ============================================================================
// Scoring constants — Decision D-028 Phase 7 locked values
// ============================================================================

const SCORE_EQUATION_PROGRESS = 30 as const;
const SCORE_EQUATION_COMPLETED = 45 as const;
const SCORE_PATH_SYNERGY_CARRY = 25 as const;
const SCORE_PATH_SYNERGY_SUPPORT = 15 as const;
const SCORE_RARITY_3 = 20 as const;
const SCORE_RARITY_2 = 12 as const;
const SCORE_RARITY_1 = 5 as const;
const PENALTY_DUPLICATE = -100 as const;
const SCORE_WEIGHTED_CURIO_SYNERGY = 40 as const;
const SCORE_CURIO_UTILITY = 25 as const;
const PENALTY_NEGATIVE_CURIO = -20 as const;

// ============================================================================
// Deterministic helpers
// ============================================================================

/** Clamp a raw score to [0, 100]. */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Stable deterministic rank sort.
 * Primary: score descending.
 * Tie-break: entityId ascending by UTF-16 code units (locale-independent).
 */
function rankEvaluations(evals: Omit<DUPickEvaluation, "rank" | "isRecommended">[]): DUPickEvaluation[] {
  const sorted = [...evals].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return compareCodeUnits(a.entityId, b.entityId);
  });

  return sorted.map((e, idx) => ({
    ...e,
    rank: (idx + 1) as DUPickEvaluation["rank"],
    isRecommended: idx === 0,
  }));
}

// ============================================================================
// Equation progress helpers
// ============================================================================

interface EquationRequirementStatus {
  equationId: string;
  primaryPath: CombatPath;
  secondaryPath: CombatPath;
  primaryRequired: number;
  secondaryRequired: number;
  primaryCollected: number;
  secondaryCollected: number;
  isComplete: boolean;
}

/**
 * Compute how many blessings of each path have already been collected
 * for each target equation, given the collected blessing set.
 */
function computeEquationProgress(
  targetEquations: DUEquationKnowledge[],
  collectedBlessingIds: string[],
  allBlessings: DUBlessingKnowledge[]
): EquationRequirementStatus[] {
  const collectedSet = new Set(collectedBlessingIds);

  return targetEquations.map((eq) => {
    let primaryCollected = 0;
    let secondaryCollected = 0;

    for (const blessing of allBlessings) {
      if (!collectedSet.has(blessing.id)) continue;
      if (blessing.path === eq.primaryPath) primaryCollected++;
      else if (blessing.path === eq.secondaryPath) secondaryCollected++;
    }

    const isComplete =
      primaryCollected >= eq.requiredBlessings.primaryCount &&
      secondaryCollected >= eq.requiredBlessings.secondaryCount;

    return {
      equationId: eq.id,
      primaryPath: eq.primaryPath,
      secondaryPath: eq.secondaryPath,
      primaryRequired: eq.requiredBlessings.primaryCount,
      secondaryRequired: eq.requiredBlessings.secondaryCount,
      primaryCollected,
      secondaryCollected,
      isComplete,
    };
  });
}

// ============================================================================
// Blessing evaluation — exported canonical function
// ============================================================================

/**
 * Evaluate a list of blessing candidates against current DU run context.
 *
 * Pure function. Does not mutate inputs. Deterministic given same inputs.
 * Scores clamped to [0, 100].
 *
 * @param candidates - Canonical blessing entities to evaluate (1–3 candidates)
 * @param context - Active run context (party paths, target equations, collected blessings)
 * @param targetEquations - Full canonical equation objects for target equation IDs
 * @param allBlessings - All canonical blessings (needed for progress computation)
 */
export function evaluateDUBlessingChoices(
  candidates: DUBlessingKnowledge[],
  context: DURunContext,
  targetEquations: DUEquationKnowledge[],
  allBlessings: DUBlessingKnowledge[]
): DUPickEvaluation[] {
  if (candidates.length === 0) return [];

  const collectedSet = new Set(context.collectedBlessingIds);
  const equationProgress = computeEquationProgress(
    targetEquations.filter((eq) => context.targetEquationIds.includes(eq.id)),
    context.collectedBlessingIds,
    allBlessings
  );

  const evals: Omit<DUPickEvaluation, "rank" | "isRecommended">[] = candidates.map((blessing) => {
    const reasons: DUReason[] = [];
    let raw = 0;

    // 1. Duplicate prevention — hard ineligible
    if (collectedSet.has(blessing.id)) {
      raw += PENALTY_DUPLICATE;
      reasons.push({
        code: "DUPLICATE_BLESSING",
        category: "rarity",
        scoreDelta: PENALTY_DUPLICATE,
        message: `${blessing.name} is already collected. Picking a duplicate has no effect.`,
      });
      return { entityId: blessing.id, entityType: "blessing", score: clamp(raw), reasons };
    }

    // 2. Target Equation progress
    for (const status of equationProgress) {
      if (status.isComplete) continue;

      const isPrimary = blessing.path === status.primaryPath;
      const isSecondary = blessing.path === status.secondaryPath;

      const primaryUnfulfilled = isPrimary && status.primaryCollected < status.primaryRequired;
      const secondaryUnfulfilled = isSecondary && status.secondaryCollected < status.secondaryRequired;

      if (primaryUnfulfilled || secondaryUnfulfilled) {
        const advancedPath = primaryUnfulfilled ? status.primaryPath : status.secondaryPath;
        // Check if this blessing would complete the equation
        const newPrimary = status.primaryCollected + (primaryUnfulfilled ? 1 : 0);
        const newSecondary = status.secondaryCollected + (secondaryUnfulfilled ? 1 : 0);
        const wouldComplete =
          newPrimary >= status.primaryRequired && newSecondary >= status.secondaryRequired;

        if (wouldComplete) {
          raw += SCORE_EQUATION_COMPLETED;
          reasons.push({
            code: "EQUATION_COMPLETED",
            category: "equation",
            scoreDelta: SCORE_EQUATION_COMPLETED,
            message: `Completes equation requirements for ${status.equationId}: ${newPrimary}/${status.primaryRequired} ${status.primaryPath}, ${newSecondary}/${status.secondaryRequired} ${status.secondaryPath}.`,
          });
        } else {
          raw += SCORE_EQUATION_PROGRESS;
          reasons.push({
            code: "EQUATION_PROGRESS",
            category: "equation",
            scoreDelta: SCORE_EQUATION_PROGRESS,
            message: `Advances equation progress for ${status.equationId}: ${advancedPath} +1.`,
          });
        }
        // Only score once per equation per candidate
        break;
      }
    }

    // 3. Party Path Synergy
    // Carry paths: Destruction, Hunt, Erudition, Nihility, Elation
    // Support paths: Harmony, Preservation, Abundance, Remembrance
    const carryPaths: CombatPath[] = ["Destruction", "Hunt", "Erudition", "Nihility", "Elation"];
    const supportPaths: CombatPath[] = ["Harmony", "Preservation", "Abundance", "Remembrance"];

    const partyHasCarryOfPath = context.partyPaths.includes(blessing.path) &&
      carryPaths.includes(blessing.path);
    const partyHasSupportOfPath = context.partyPaths.includes(blessing.path) &&
      supportPaths.includes(blessing.path);

    if (partyHasCarryOfPath) {
      raw += SCORE_PATH_SYNERGY_CARRY;
      reasons.push({
        code: "PARTY_PATH_SYNERGY_CARRY",
        category: "path",
        scoreDelta: SCORE_PATH_SYNERGY_CARRY,
        message: `${blessing.path} blessing synergizes with a carry in the active party.`,
      });
    } else if (partyHasSupportOfPath) {
      raw += SCORE_PATH_SYNERGY_SUPPORT;
      reasons.push({
        code: "PARTY_PATH_SYNERGY_SUPPORT",
        category: "path",
        scoreDelta: SCORE_PATH_SYNERGY_SUPPORT,
        message: `${blessing.path} blessing synergizes with a support character in the active party.`,
      });
    }

    // 4. Rarity baseline weight
    if (blessing.rarity === 3) {
      raw += SCORE_RARITY_3;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_3,
        message: `3★ blessing provides a strong baseline power contribution.`,
      });
    } else if (blessing.rarity === 2) {
      raw += SCORE_RARITY_2;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_2,
        message: `2★ blessing provides a moderate baseline power contribution.`,
      });
    } else {
      raw += SCORE_RARITY_1;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_1,
        message: `1★ blessing provides a minor baseline power contribution.`,
      });
    }

    return {
      entityId: blessing.id,
      entityType: "blessing",
      score: clamp(raw),
      reasons,
    };
  });

  return rankEvaluations(evals);
}

// ============================================================================
// Equation evaluation — exported canonical function
// ============================================================================

/**
 * Evaluate a list of equation candidates against current DU run context.
 *
 * Equations are evaluated by how well their path requirements align with
 * party paths and how achievable they are given current blessings.
 */
export function evaluateDUEquationChoices(
  candidates: DUEquationKnowledge[],
  context: DURunContext,
  allBlessings: DUBlessingKnowledge[]
): DUPickEvaluation[] {
  if (candidates.length === 0) return [];

  const evals: Omit<DUPickEvaluation, "rank" | "isRecommended">[] = candidates.map((equation) => {
    const reasons: DUReason[] = [];
    let raw = 0;

    // 1. Party path match — primary path
    const primaryPartyMatch = context.partyPaths.includes(equation.primaryPath);
    const secondaryPartyMatch = context.partyPaths.includes(equation.secondaryPath);

    if (primaryPartyMatch) {
      raw += SCORE_PATH_SYNERGY_CARRY;
      reasons.push({
        code: "EQUATION_PATH_MATCH",
        category: "equation",
        scoreDelta: SCORE_PATH_SYNERGY_CARRY,
        message: `${equation.name} primary path (${equation.primaryPath}) aligns with the active party.`,
      });
    }
    if (secondaryPartyMatch) {
      raw += SCORE_PATH_SYNERGY_SUPPORT;
      reasons.push({
        code: "EQUATION_PATH_MATCH",
        category: "equation",
        scoreDelta: SCORE_PATH_SYNERGY_SUPPORT,
        message: `${equation.name} secondary path (${equation.secondaryPath}) aligns with the active party.`,
      });
    }
    if (!primaryPartyMatch && !secondaryPartyMatch) {
      reasons.push({
        code: "NO_EQUATION_MATCH",
        category: "equation",
        scoreDelta: 0,
        message: `${equation.name} requires ${equation.primaryPath}/${equation.secondaryPath} blessings — neither aligns with the current party.`,
      });
    }

    // 2. Rarity baseline
    if (equation.rarity === 3) {
      raw += SCORE_RARITY_3;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_3,
        message: `3★ equation provides a strong power ceiling once activated.`,
      });
    } else if (equation.rarity === 2) {
      raw += SCORE_RARITY_2;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_2,
        message: `2★ equation provides a moderate power ceiling once activated.`,
      });
    } else {
      raw += SCORE_RARITY_1;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_1,
        message: `1★ equation provides a minor power ceiling once activated.`,
      });
    }

    // 3. Achievability: how many blessings already collected align with this equation
    const collectedSet = new Set(context.collectedBlessingIds);
    let primaryProgress = 0;
    let secondaryProgress = 0;
    for (const b of allBlessings) {
      if (!collectedSet.has(b.id)) continue;
      if (b.path === equation.primaryPath) primaryProgress++;
      else if (b.path === equation.secondaryPath) secondaryProgress++;
    }

    const effectivePrimary = Math.min(primaryProgress, equation.requiredBlessings.primaryCount);
    const effectiveSecondary = Math.min(secondaryProgress, equation.requiredBlessings.secondaryCount);
    const totalRequired = equation.requiredBlessings.primaryCount + equation.requiredBlessings.secondaryCount;
    const effectiveProgress = effectivePrimary + effectiveSecondary;

    if (effectiveProgress > 0 && totalRequired > 0) {
      const progressBonus = Math.floor((effectiveProgress / totalRequired) * SCORE_EQUATION_PROGRESS);
      raw += progressBonus;
      reasons.push({
        code: "EQUATION_PROGRESS",
        category: "equation",
        scoreDelta: progressBonus,
        message: `${effectiveProgress}/${totalRequired} required blessings already collected (${effectivePrimary} ${equation.primaryPath}, ${effectiveSecondary} ${equation.secondaryPath}).`,
      });
    }

    return {
      entityId: equation.id,
      entityType: "equation",
      score: clamp(raw),
      reasons,
    };
  });

  return rankEvaluations(evals);
}

// ============================================================================
// Curio evaluation — exported canonical function
// ============================================================================

/**
 * Evaluate a list of curio candidates against current DU run context.
 *
 * Scoring is based on canonical curio category and party path alignment
 * as derivable from the canonical schema. No game mechanic knowledge is
 * fabricated beyond what canonical fields support.
 *
 * Limitation: Per D-030, curio scoring is bounded by canonical fields
 * (`category`, `rarity`). Fine-grained effect analysis requires
 * natural-language parsing of `effect` strings, which is out-of-scope
 * for Phase 7 deterministic scoring. Score approximates based on
 * category and rarity only.
 */
export function evaluateDUCurioChoices(
  candidates: DUCurioKnowledge[],
  _context: DURunContext
): DUPickEvaluation[] {
  if (candidates.length === 0) return [];

  const evals: Omit<DUPickEvaluation, "rank" | "isRecommended">[] = candidates.map((curio) => {
    const reasons: DUReason[] = [];
    let raw = 0;

    // 1. Category-based scoring
    if (curio.category === "negative") {
      raw += PENALTY_NEGATIVE_CURIO;
      reasons.push({
        code: "NEGATIVE_CURIO_RISK",
        category: "curio",
        scoreDelta: PENALTY_NEGATIVE_CURIO,
        message: `${curio.name} is a negative curio with downside effects. Evaluate carefully before picking.`,
      });
    } else if (curio.category === "weighted") {
      raw += SCORE_WEIGHTED_CURIO_SYNERGY;
      reasons.push({
        code: "WEIGHTED_CURIO_SYNERGY",
        category: "curio",
        scoreDelta: SCORE_WEIGHTED_CURIO_SYNERGY,
        message: `${curio.name} is a weighted curio that amplifies blessing rewards for the primary party path.`,
      });
    } else {
      // "normal" curio — utility bonus
      raw += SCORE_CURIO_UTILITY;
      reasons.push({
        code: "CURIO_UTILITY",
        category: "curio",
        scoreDelta: SCORE_CURIO_UTILITY,
        message: `${curio.name} provides direct utility or resource advantages.`,
      });
    }

    // 2. Rarity baseline
    if (curio.rarity === 3) {
      raw += SCORE_RARITY_3;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_3,
        message: `3★ curio provides a strong baseline power contribution.`,
      });
    } else if (curio.rarity === 2) {
      raw += SCORE_RARITY_2;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_2,
        message: `2★ curio provides a moderate baseline contribution.`,
      });
    } else {
      raw += SCORE_RARITY_1;
      reasons.push({
        code: "RARITY_WEIGHT",
        category: "rarity",
        scoreDelta: SCORE_RARITY_1,
        message: `1★ curio provides a minor baseline contribution.`,
      });
    }

    return {
      entityId: curio.id,
      entityType: "curio",
      score: clamp(raw),
      reasons,
    };
  });

  return rankEvaluations(evals);
}
