import type { CharacterKnowledge } from "../knowledge/character";
import { scoreTeam, type TeamMember } from "./scoring";
import {
  buildTeamSignature,
  compareCodeUnits,
  type RecommendationContext,
  type RecommendationEngineResult,
  type RosterInputCharacter,
  type TeamEvaluation,
} from "./types";

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

  const missingKnowledgeCharacterIds: string[] = [];
  const knowledgeMap = new Map<string, CharacterKnowledge>();
  for (const kc of knowledgeCharacters) {
    knowledgeMap.set(kc.id, kc);
  }

  // 1. Filter owned characters
  const ownedRoster = roster.filter((r) => r.isOwned !== false && r.isOwned !== 0);

  // 2. Validate against canonical knowledge
  const validMembers: TeamMember[] = [];
  for (const item of ownedRoster) {
    const knowledge = knowledgeMap.get(item.characterId);
    if (!knowledge) {
      missingKnowledgeCharacterIds.push(item.characterId);
    } else {
      validMembers.push({ knowledge, roster: item });
    }
  }

  // Deduplicate by character ID (preserve first instance if duplicates exist)
  const uniqueMembersMap = new Map<string, TeamMember>();
  for (const m of validMembers) {
    if (!uniqueMembersMap.has(m.knowledge.id)) {
      uniqueMembersMap.set(m.knowledge.id, m);
    }
  }
  const uniqueMembers = Array.from(uniqueMembersMap.values());

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

    const isOwned = ownedRoster.some((r) => r.characterId === context.focusCharacterId);
    if (!isOwned) {
      const err = new Error(`Focus character '${context.focusCharacterId}' is not present in owned roster`);
      (err as unknown as { code: string }).code = "FOCUS_CHARACTER_NOT_OWNED";
      throw err;
    }
  }

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
      status: "insufficient_roster",
      gameVersion,
      knowledgeVersion,
      spStatus: "unavailable",
      consensusStatus: "mechanical_only",
      missingKnowledgeCharacterIds:
        missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
      message: `Roster has fewer than 4 valid canonical owned characters (${uniqueMembers.length} available). At least 4 characters required.`,
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
        status: "insufficient_roster",
        gameVersion,
        knowledgeVersion,
        spStatus: "unavailable",
        consensusStatus: "mechanical_only",
        missingKnowledgeCharacterIds:
          missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
        message: `Focus character '${context.focusCharacterId}' lacks valid canonical knowledge.`,
        teams: [],
      };
    }
    const otherMembers = uniqueMembers.filter((m) => m.knowledge.id !== context.focusCharacterId);
    if (otherMembers.length < 3) {
      return {
        success: true,
        status: "insufficient_roster",
        gameVersion,
        knowledgeVersion,
        spStatus: "unavailable",
        consensusStatus: "mechanical_only",
        message: "Insufficient characters to form a 4-character team around focus character.",
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

    evaluatedTeams.push({
      rank: 0,
      score: scored.score,
      roleScore: scored.roleScore,
      synergyScore: scored.synergyScore,
      elementScore: scored.elementScore,
      signature,
      archetype: scored.archetype,
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
    status: "ok",
    gameVersion,
    knowledgeVersion,
    spStatus: "unavailable",
    consensusStatus: "mechanical_only",
    missingKnowledgeCharacterIds:
      missingKnowledgeCharacterIds.length > 0 ? missingKnowledgeCharacterIds.sort(compareCodeUnits) : undefined,
    teams: topTeams,
  };
}
