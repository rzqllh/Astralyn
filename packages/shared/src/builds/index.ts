// packages/shared/src/builds/index.ts
import type { CharacterKnowledge, CombatPath } from "../knowledge/character";
import type { LightConeKnowledge } from "../knowledge/light-cone";
import type { RelicSetKnowledge } from "../knowledge/relic";
import { compareCodeUnits } from "../recommendation/types";

export interface TeammateSynergy {
  teammateId: string;
  teammateName: string;
  reasonCode: string;
  explanation: string;
}

export interface RecommendedRelicSetsResult {
  cavernRelics: RelicSetKnowledge[];
  planarOrnaments: RelicSetKnowledge[];
}

/**
 * Returns Light Cones strictly matching the character's Combat Path.
 * Sorted deterministically: rarity DESC, then id ASC (code-unit).
 *
 * Hard invariant: No "Best-in-Slot" or "Signature" claims.
 */
export function getPathCompatibleLightCones(
  characterPath: CombatPath,
  lightCones: LightConeKnowledge[]
): LightConeKnowledge[] {
  return lightCones
    .filter((cone) => cone.path === characterPath)
    .sort((a, b) => {
      if (b.rarity !== a.rarity) {
        return b.rarity - a.rarity;
      }
      return compareCodeUnits(a.id, b.id);
    });
}

/**
 * Associates mechanically synergistic Relic and Planar sets based on
 * explicitly defined D-029 mechanic relationships.
 *
 * Hard invariant: Truthful deterministic engineering association; no BiS claims.
 * No arbitrary fallback sets: if no verified association exists, returns empty array.
 */
export function getRecommendedRelicSets(
  character: CharacterKnowledge,
  relicSets: RelicSetKnowledge[]
): RecommendedRelicSetsResult {
  const hasTag = (tag: string) => character.mechanicTags.some((t) => t === tag);

  const matchedCavern: RelicSetKnowledge[] = [];
  const matchedPlanar: RelicSetKnowledge[] = [];

  for (const set of relicSets) {
    let isSynergistic = false;

    if (set.id === "iron-cavalry" && (hasTag("break_effect") || hasTag("super_break"))) {
      isSynergistic = true;
    } else if (set.id === "watchmaker" && hasTag("break_effect")) {
      isSynergistic = true;
    } else if (set.id === "pioneer-diver" && (hasTag("debuff") || character.id === "acheron")) {
      isSynergistic = true;
    } else if (set.id === "forge-of-the-kalpagni-lantern" && (hasTag("break_effect") || character.element === "Fire")) {
      isSynergistic = true;
    } else if (set.id === "izumo-gensei" && (character.path === "Nihility" || character.path === "Erudition" || character.path === "Hunt" || character.id === "acheron")) {
      isSynergistic = true;
    } else if (set.id === "duran-dynasty-of-running-wolves" && (hasTag("follow_up") || character.path === "Elation")) {
      isSynergistic = true;
    }

    if (isSynergistic) {
      if (set.type === "cavern_relic") {
        matchedCavern.push(set);
      } else if (set.type === "planar_ornament") {
        matchedPlanar.push(set);
      }
    }
  }

  // Pure deterministic sort without arbitrary fallbacks
  matchedCavern.sort((a, b) => compareCodeUnits(a.id, b.id));
  matchedPlanar.sort((a, b) => compareCodeUnits(a.id, b.id));

  return {
    cavernRelics: matchedCavern,
    planarOrnaments: matchedPlanar,
  };
}

/**
 * Exposes non-scoring mechanical associations between canonical characters
 * based on verified kit interactions.
 *
 * Hard invariant: Non-scoring mechanical associations only; no independent
 * point deltas, weights, or secondary scoring engine.
 */
export function getCharacterTeammateSynergies(
  character: CharacterKnowledge,
  allCharacters: CharacterKnowledge[]
): TeammateSynergy[] {
  const candidates = allCharacters.filter((c) => c.id !== character.id);
  const synergies: TeammateSynergy[] = [];

  const charHasTag = (tag: string) => (character.mechanicTags as readonly string[]).includes(tag);
  const charHasRole = (role: string) => (character.roles as readonly string[]).includes(role);

  for (const candidate of candidates) {
    const candHasTag = (tag: string) => (candidate.mechanicTags as readonly string[]).includes(tag);
    const candHasRole = (role: string) => (candidate.roles as readonly string[]).includes(role);

    // 1. Slashed Dream Debuff Feeding (Acheron + debuff inflictor)
    if (character.id === "acheron" && candHasTag("debuff")) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_SLASHED_DREAM_FEED",
        explanation: `${candidate.name} inflicts debuffs to rapidly charge Acheron's Slashed Dream.`,
      });
    } else if (candidate.id === "acheron" && charHasTag("debuff")) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_SLASHED_DREAM_FEED",
        explanation: `${character.name} inflicts debuffs to rapidly charge Acheron's Slashed Dream.`,
      });
    }

    // 2. Super Break Core (Break carry + Break support)
    else if (
      (charHasTag("super_break") || charHasRole("break_dps")) &&
      (candHasTag("break_effect") || candHasTag("weakness_break_efficiency"))
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_SUPER_BREAK_CORE",
        explanation: `Break carry pairs with Break-scaling teammate for high Super Break damage.`,
      });
    } else if (
      (candHasTag("super_break") || candHasRole("break_dps")) &&
      (charHasTag("break_effect") || charHasTag("weakness_break_efficiency"))
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_SUPER_BREAK_CORE",
        explanation: `Break carry pairs with Break-scaling teammate for high Super Break damage.`,
      });
    }

    // 3. Memosprite Acceleration (Castorice + Robin / Tingyun)
    else if (
      charHasTag("memosprite") &&
      (candHasTag("action_advance") || candHasTag("energy_regen") || candHasRole("buffer"))
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_MEMOSPRITE_ACCEL",
        explanation: `Castorice and Memosprite Netherwing turns are accelerated by support buffs.`,
      });
    } else if (
      candHasTag("memosprite") &&
      (charHasTag("action_advance") || charHasTag("energy_regen") || charHasRole("buffer"))
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_MEMOSPRITE_ACCEL",
        explanation: `Castorice and Memosprite Netherwing turns are accelerated by support buffs.`,
      });
    }

    // 4. Follow-up & Elation Synergy
    else if (
      (charHasTag("follow_up") || charHasTag("elation")) &&
      (candHasTag("follow_up") || candHasTag("elation"))
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_FOLLOW_UP_BATTERY",
        explanation: `Follow-up and Elation attacks trigger joint energy and team buffs.`,
      });
    }

    // 5. Energy Battery: Tingyun + high energy consumer
    else if (
      (candidate.roles.includes("battery") || candidate.id === "tingyun") &&
      character.baseStats.maxEnergy !== null &&
      (character.baseStats.maxEnergy ?? 0) >= 130
    ) {
      synergies.push({
        teammateId: candidate.id,
        teammateName: candidate.name,
        reasonCode: "SYNERGY_ENERGY_BATTERY",
        explanation: `${candidate.name} feeds Energy to high-cost Ultimate carry ${character.name}.`,
      });
    }
  }

  // Deterministic non-scoring sort by teammateId
  return synergies.sort((a, b) => compareCodeUnits(a.teammateId, b.teammateId));
}
