import type { CharacterKnowledge } from "../knowledge/character";
import {
  hasCompleteRecommendationTaxonomy,
  scoreTeam,
  type TeamMember,
} from "./scoring";
import {
  buildTeamSignature,
  compareCodeUnits,
  type RecommendationContext,
  type RecommendationEngineResult,
  type RecommendationEvaluation,
  type RosterInputCharacter,
  type TeamEvaluation,
} from "./types";

export const MAX_RECOMMENDATION_CANDIDATES = 16;
export const MAX_TEAM_EVALUATIONS = 1820;

export interface GenerateRecommendationsOptions {
  roster: RosterInputCharacter[];
  knowledgeCharacters: CharacterKnowledge[];
  context?: RecommendationContext;
  gameVersion?: string;
  knowledgeVersion?: string;
}

/**
 * Generates all unordered k-combinations from an array.
 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = getCombinations(tail, k - 1).map((combo) => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

function boundCandidatePool(
  members: TeamMember[],
  focusCharacterId?: string
): TeamMember[] {
  const focusMember = focusCharacterId
    ? members.find((member) => member.knowledge.id === focusCharacterId)
    : undefined;
  const remaining = focusMember
    ? members.filter((member) => member.knowledge.id !== focusCharacterId)
    : members;
  const complete = remaining.filter(hasCompleteRecommendationTaxonomy);
  const limited = remaining.filter(
    (member) => !hasCompleteRecommendationTaxonomy(member)
  );
  const completeTeamSize = focusMember ? 3 : 4;
  const eligible =
    complete.length >= completeTeamSize ? complete : [...complete, ...limited];
  const selected = [
    ...(focusMember ? [focusMember] : []),
    ...eligible,
  ].slice(0, MAX_RECOMMENDATION_CANDIDATES);

  return selected.sort((a, b) => compareCodeUnits(a.knowledge.id, b.knowledge.id));
}

function createEvaluation(
  candidateCount: number,
  evaluatedTeamCount: number
): RecommendationEvaluation {
  return {
    candidateCount,
    evaluatedTeamCount,
    maxCandidateCount: MAX_RECOMMENDATION_CANDIDATES,
    maxTeamEvaluations: MAX_TEAM_EVALUATIONS,
  };
}

/**
 * Pure deterministic recommendation engine.
 *
 * Invariants:
 * - Same inputs produce bit-for-bit identical results.
 * - Zero timestamps, zero Math.random(), zero system clock lookups.
 * - Fixed-point integer arithmetic.
 * - Code-unit tie breaking.
 * - Mode parameter is strictly metadata in Phase 5 and does not alter ranking.
 */
export function generateTeamRecommendations(
  options: GenerateRecommendationsOptions
): RecommendationEngineResult {
  const {
    roster,
    knowledgeCharacters,
    context = {},
    gameVersion = "4.5",
    knowledgeVersion = "v1.0.0",
  } = options;
  const scope = context.scope ?? "owned_only";

  const missingKnowledgeCharacterIds: string[] = [];
  const knowledgeMap = new Map<string, CharacterKnowledge>();
  for (const kc of knowledgeCharacters) {
    knowledgeMap.set(kc.id, kc);
  }

  // 1. Resolve actual owned metadata without mutating canonical knowledge.
  const ownedRoster = roster.filter((r) => r.isOwned !== false && r.isOwned !== 0);

  // 2. Validate roster entries and preserve the first owned record per character.
  const ownedMembers = new Map<string, TeamMember>();
  for (const item of ownedRoster) {
    const knowledge = knowledgeMap.get(item.characterId);
    if (!knowledge) {
      missingKnowledgeCharacterIds.push(item.characterId);
    } else if (!ownedMembers.has(knowledge.id)) {
      ownedMembers.set(knowledge.id, { knowledge, roster: item });
    }
  }

  const uniqueMembersMap = new Map<string, TeamMember>();
  if (scope === "all_characters") {
    for (const knowledge of knowledgeCharacters) {
      if (!uniqueMembersMap.has(knowledge.id)) {
        uniqueMembersMap.set(
          knowledge.id,
          ownedMembers.get(knowledge.id) ?? { knowledge }
        );
      }
    }
  } else {
    for (const [id, member] of ownedMembers) uniqueMembersMap.set(id, member);
  }
  let uniqueMembers = Array.from(uniqueMembersMap.values());

  // Sort candidate pool by code units for deterministic combination iteration
  uniqueMembers.sort((a, b) => compareCodeUnits(a.knowledge.id, b.knowledge.id));

  // 3. Focus Character Validation
  if (context.focusCharacterId) {
    const isKnownInKnowledge = knowledgeMap.has(context.focusCharacterId);
    if (!isKnownInKnowledge) {
      const err = new Error(`Character ID '${context.focusCharacterId}' is not recognized in canonical knowledge`);
      (err as unknown as { code: string }).code = "UNKNOWN_CHARACTER_ID";
      throw err;
    }

    const isAvailable = uniqueMembersMap.has(context.focusCharacterId);
    if (!isAvailable) {
      const err = new Error(`Focus character '${context.focusCharacterId}' is not present in owned roster`);
      (err as unknown as { code: string }).code = "FOCUS_CHARACTER_NOT_OWNED";
      throw err;
    }
  }

  uniqueMembers = boundCandidatePool(uniqueMembers, context.focusCharacterId);

  // 4. Validate limit
  if (context.limit !== undefined) {
    if (!Number.isInteger(context.limit) || context.limit < 1 || context.limit > 10) {
      const err = new Error("Limit must be an integer between 1 and 10");
      (err as unknown as { code: string }).code = "INVALID_LIMIT";
      throw err;
    }
  }

  // 5. Insufficient Roster Check
  if (uniqueMembers.length < 4) {
    return {
      success: true,
      scope,
      status: "insufficient_roster",
      gameVersion,
      knowledgeVersion,
      spStatus: "unavailable",
      consensusStatus: "mechanical_only",
      missingKnowledgeCharacterIds:
        missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
      message:
        scope === "owned_only"
          ? `Roster has fewer than 4 valid canonical owned characters (${uniqueMembers.length} available). At least 4 characters required.`
          : `Canonical scope has fewer than 4 eligible characters (${uniqueMembers.length} available). At least 4 characters required.`,
      evaluation: createEvaluation(uniqueMembers.length, 0),
      teams: [],
    };
  }

  // 6. Generate 4-character combinations
  let rawCombinations: TeamMember[][];

  if (context.focusCharacterId) {
    const focusMember = uniqueMembers.find((m) => m.knowledge.id === context.focusCharacterId);
    if (!focusMember) {
      // Focus character was in owned roster but not in valid canonical members
      return {
        success: true,
        scope,
        status: "insufficient_roster",
        gameVersion,
        knowledgeVersion,
        spStatus: "unavailable",
        consensusStatus: "mechanical_only",
        missingKnowledgeCharacterIds:
          missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
        message: `Focus character '${context.focusCharacterId}' lacks valid canonical knowledge.`,
        evaluation: createEvaluation(uniqueMembers.length, 0),
        teams: [],
      };
    }
    const otherMembers = uniqueMembers.filter((m) => m.knowledge.id !== context.focusCharacterId);
    if (otherMembers.length < 3) {
      return {
        success: true,
        scope,
        status: "insufficient_roster",
        gameVersion,
        knowledgeVersion,
        spStatus: "unavailable",
        consensusStatus: "mechanical_only",
        message: "Insufficient characters to form a 4-character team around focus character.",
        evaluation: createEvaluation(uniqueMembers.length, 0),
        teams: [],
      };
    }
    const otherCombos = getCombinations(otherMembers, 3);
    rawCombinations = otherCombos.map((combo) => [focusMember, ...combo]);
  } else {
    rawCombinations = getCombinations(uniqueMembers, 4);
  }

  // 7. Evaluate each combination
  const evaluatedTeams: TeamEvaluation[] = [];

  for (const combo of rawCombinations) {
    const charIds = combo.map((m) => m.knowledge.id);
    const signature = buildTeamSignature(charIds);
    const scored = scoreTeam(combo, context.targetWeaknesses);
    const limitedDataCharacterIds = combo
      .filter((member) => !hasCompleteRecommendationTaxonomy(member))
      .map((member) => member.knowledge.id)
      .sort(compareCodeUnits);

    evaluatedTeams.push({
      rank: 0,
      score: scored.score,
      roleScore: scored.roleScore,
      synergyScore: scored.synergyScore,
      elementScore: scored.elementScore,
      signature,
      archetype: scored.archetype,
      taxonomyStatus:
        limitedDataCharacterIds.length > 0 ? "limited_data" : "complete",
      limitedDataCharacterIds:
        limitedDataCharacterIds.length > 0 ? limitedDataCharacterIds : undefined,
      slots: scored.slots,
      reasons: scored.reasons,
    });
  }

  // 8. Deterministic Tie-Breaking
  evaluatedTeams.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.synergyScore !== a.synergyScore) return b.synergyScore - a.synergyScore;
    if (b.roleScore !== a.roleScore) return b.roleScore - a.roleScore;
    return compareCodeUnits(a.signature, b.signature);
  });

  // 9. Assign Ranks and Slice Limit
  const limit = context.limit ?? 3;
  const topTeams = evaluatedTeams.slice(0, limit).map((team, index) => ({
    ...team,
    rank: index + 1,
  }));

  return {
    success: true,
    scope,
    status: "ok",
    gameVersion,
    knowledgeVersion,
    spStatus: "unavailable",
    consensusStatus: "mechanical_only",
    missingKnowledgeCharacterIds:
      missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
    evaluation: createEvaluation(uniqueMembers.length, rawCombinations.length),
    teams: topTeams,
  };
}
