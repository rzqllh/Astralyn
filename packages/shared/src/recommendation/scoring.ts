import type { CharacterKnowledge, CombatElement } from "../knowledge/character";
import type {
  RecommendationReason,
  RosterInputCharacter,
  TeamSlotAssignment,
} from "./types";

export interface TeamMember {
  knowledge: CharacterKnowledge;
  roster: RosterInputCharacter;
}

export interface TeamScoringResult {
  score: number;
  roleScore: number;
  synergyScore: number;
  elementScore: number;
  archetype: string;
  slots: TeamSlotAssignment[];
  reasons: RecommendationReason[];
}

/**
 * Fixed-point half-up integer rounding division by 100.
 * Eliminates floating-point variance across runtime platforms.
 */
export function deterministicRoundHundred(weighted: number): number {
  return Math.floor((weighted + 50) / 100);
}

/**
 * Evaluates the 4-character team according to Phase 5 Decision D-028.
 */
export function scoreTeam(
  members: TeamMember[],
  targetWeaknesses?: CombatElement[]
): TeamScoringResult {
  if (members.length !== 4) {
    throw new Error("scoreTeam requires exactly 4 team members");
  }

  const reasons: RecommendationReason[] = [];

  // ========================================================================
  // 1. ROLE COVERAGE SCORE (S_role in [0, 100])
  // ========================================================================
  let sustainPoints = 0;
  const sustains = members.filter((m) =>
    m.knowledge.roles.some((r) => r === "shielder" || r === "healer")
  );
  if (sustains.length >= 1) {
    sustainPoints = 50;
    reasons.push({
      code: "ROLE_SUSTAIN_SECURED",
      category: "role",
      type: "positive",
      scoreDelta: 50,
      message: `${sustains.map((s) => s.knowledge.name).join(" and ")} provides team survivability.`,
      characterIds: sustains.map((s) => s.knowledge.id),
    });
  } else {
    reasons.push({
      code: "PENALTY_NO_SUSTAIN",
      category: "role",
      type: "penalty",
      scoreDelta: -50,
      message: "Team lacks a dedicated Shielder or Healer for survivability.",
      characterIds: [],
    });
  }

  let carryPoints = 0;
  const carries = members.filter((m) =>
    m.knowledge.roles.some(
      (r) =>
        r === "hypercarry_dps" ||
        r === "break_dps" ||
        r === "summon_dps" ||
        r === "elation_dps"
    )
  );
  if (carries.length === 1) {
    carryPoints = 30;
    reasons.push({
      code: "ROLE_PRIMARY_CARRY",
      category: "role",
      type: "positive",
      scoreDelta: 30,
      message: `${carries[0].knowledge.name} anchors the team as primary carry.`,
      characterIds: [carries[0].knowledge.id],
    });
  } else if (carries.length === 2) {
    carryPoints = 25;
    reasons.push({
      code: "ROLE_PRIMARY_CARRY",
      category: "role",
      type: "positive",
      scoreDelta: 25,
      message: `Dual-carry core established with ${carries.map((c) => c.knowledge.name).join(" and ")}.`,
      characterIds: carries.map((c) => c.knowledge.id),
    });
  } else if (carries.length >= 3) {
    carryPoints = 5;
    reasons.push({
      code: "PENALTY_TOO_MANY_CARRIES",
      category: "role",
      type: "penalty",
      scoreDelta: -25,
      message: "Three or more primary carries in one party dilute skill point and buff efficiency.",
      characterIds: carries.map((c) => c.knowledge.id),
    });
  }

  let amplifierPoints = 0;
  const amplifiers = members.filter((m) =>
    m.knowledge.roles.some((r) => r === "buffer" || r === "debuffer" || r === "battery")
  );
  if (amplifiers.length >= 1) {
    amplifierPoints = 20;
    reasons.push({
      code: "ROLE_AMPLIFIER_PRESENT",
      category: "role",
      type: "positive",
      scoreDelta: 20,
      message: `${amplifiers.map((a) => a.knowledge.name).join(" and ")} provides team stat amplification and support.`,
      characterIds: amplifiers.map((a) => a.knowledge.id),
    });
  }

  const roleScore = Math.max(0, Math.min(100, sustainPoints + carryPoints + amplifierPoints));

  // ========================================================================
  // 2. MECHANIC SYNERGY SCORE (S_synergy in [0, 100])
  // ========================================================================
  let synergySum = 0;
  const memberIds = new Set(members.map((m) => m.knowledge.id));

  // A. Super Break Core: Break carry + Gallagher / Break support
  const hasBreakCarry = members.some((m) =>
    m.knowledge.mechanicTags.includes("super_break") || m.knowledge.roles.includes("break_dps")
  );
  const hasBreakSupport = members.some(
    (m) =>
      m.knowledge.id !== "firefly" &&
      (m.knowledge.mechanicTags.includes("break_effect") ||
        m.knowledge.mechanicTags.includes("weakness_break_efficiency"))
  );
  if (hasBreakCarry && hasBreakSupport) {
    synergySum += 25;
    reasons.push({
      code: "SYNERGY_SUPER_BREAK_CORE",
      category: "synergy",
      type: "positive",
      scoreDelta: 25,
      message: "Break carry pairs with Break-scaling teammate for high Super Break damage.",
      characterIds: members
        .filter((m) => m.knowledge.mechanicTags.includes("break_effect") || m.knowledge.mechanicTags.includes("super_break"))
        .map((m) => m.knowledge.id),
    });
  }

  // B. Memosprite Acceleration: Castorice + Robin / Tingyun
  const hasMemosprite = members.some((m) => m.knowledge.mechanicTags.includes("memosprite"));
  const hasActionAdvanceOrEnergy = members.some(
    (m) =>
      !m.knowledge.mechanicTags.includes("memosprite") &&
      (m.knowledge.mechanicTags.includes("action_advance") ||
        m.knowledge.mechanicTags.includes("energy_regen") ||
        m.knowledge.roles.includes("buffer"))
  );
  if (hasMemosprite && hasActionAdvanceOrEnergy) {
    synergySum += 25;
    reasons.push({
      code: "SYNERGY_MEMOSPRITE_ACCEL",
      category: "synergy",
      type: "positive",
      scoreDelta: 25,
      message: "Castorice and Memosprite Netherwing turns are accelerated by support buffs.",
      characterIds: members
        .filter(
          (m) =>
            m.knowledge.mechanicTags.includes("memosprite") ||
            m.knowledge.mechanicTags.includes("action_advance") ||
            m.knowledge.mechanicTags.includes("energy_regen")
        )
        .map((m) => m.knowledge.id),
    });
  }

  // C. Slashed Dream Accumulation: Acheron + debuffers
  const hasAcheron = members.some((m) => m.knowledge.id === "acheron");
  const debuffers = members.filter(
    (m) => m.knowledge.id !== "acheron" && m.knowledge.mechanicTags.includes("debuff")
  );
  if (hasAcheron && debuffers.length >= 1) {
    synergySum += 30;
    reasons.push({
      code: "SYNERGY_SLASHED_DREAM_FEED",
      category: "synergy",
      type: "positive",
      scoreDelta: 30,
      message: `${debuffers.map((d) => d.knowledge.name).join(" and ")} inflicts debuffs to rapidly charge Acheron's Slashed Dream.`,
      characterIds: ["acheron", ...debuffers.map((d) => d.knowledge.id)],
    });
  }

  // D. Follow-up & Elation Synergy: Aventurine / Robin / Aventurine Waveflair
  const hasFollowUp = members.some(
    (m) => m.knowledge.mechanicTags.includes("follow_up") || m.knowledge.mechanicTags.includes("elation")
  );
  const followUpSupports = members.filter(
    (m) =>
      (m.knowledge.mechanicTags.includes("follow_up") || m.knowledge.mechanicTags.includes("elation")) &&
      (m.knowledge.roles.includes("buffer") || m.knowledge.roles.includes("shielder"))
  );
  if (hasFollowUp && followUpSupports.length >= 1 && members.filter((m) => m.knowledge.mechanicTags.includes("follow_up") || m.knowledge.mechanicTags.includes("elation")).length >= 2) {
    synergySum += 25;
    reasons.push({
      code: "SYNERGY_FOLLOW_UP_BATTERY",
      category: "synergy",
      type: "positive",
      scoreDelta: 25,
      message: "Follow-up and Elation attacks trigger joint energy and team buffs.",
      characterIds: members
        .filter((m) => m.knowledge.mechanicTags.includes("follow_up") || m.knowledge.mechanicTags.includes("elation"))
        .map((m) => m.knowledge.id),
    });
  }

  // E. Energy Battery: Tingyun + high energy consumer
  const hasBattery = members.some((m) => m.knowledge.roles.includes("battery") || m.knowledge.id === "tingyun");
  const hasHighEnergyConsumer = members.some(
    (m) =>
      m.knowledge.id !== "tingyun" &&
      m.knowledge.baseStats.maxEnergy !== null &&
      (m.knowledge.baseStats.maxEnergy ?? 0) >= 130
  );
  if (hasBattery && hasHighEnergyConsumer) {
    synergySum += 20;
    reasons.push({
      code: "SYNERGY_ENERGY_BATTERY",
      category: "synergy",
      type: "positive",
      scoreDelta: 20,
      message: "Energy battery accelerates high-cost Ultimates across rotations.",
      characterIds: members
        .filter(
          (m) =>
            m.knowledge.roles.includes("battery") ||
            (m.knowledge.baseStats.maxEnergy !== null && (m.knowledge.baseStats.maxEnergy ?? 0) >= 130)
        )
        .map((m) => m.knowledge.id),
    });
  }

  const synergyScore = Math.min(100, synergySum);

  // ========================================================================
  // 3. ELEMENTAL WEAKNESS SCORE (S_element in [0, 100])
  // ========================================================================
  let elementScore = 0;
  const hasTargetWeaknesses = targetWeaknesses && targetWeaknesses.length > 0;
  if (hasTargetWeaknesses) {
    const matchingMembers = members.filter((m) => targetWeaknesses.includes(m.knowledge.element));
    elementScore = Math.floor((matchingMembers.length * 100) / 4);
  }

  // ========================================================================
  // 4. TRACE CONSTRAINTS & ANTI-SYNERGY PENALTIES (P_anti)
  // ========================================================================
  let antiSynergyPenalty = 0;

  // Acheron Trace A4 "The Abyss" check:
  const acheronMember = members.find((m) => m.knowledge.id === "acheron");
  if (acheronMember) {
    const otherNihilityCount = members.filter(
      (m) => m.knowledge.id !== "acheron" && m.knowledge.path === "Nihility"
    ).length;

    if (acheronMember.roster.eidolon >= 2) {
      if (otherNihilityCount >= 1) {
        reasons.push({
          code: "EIDOLON_CONSTRAINT_RELAXED",
          category: "eidolon",
          type: "positive",
          scoreDelta: 0,
          message: "Acheron Eidolon 2 relaxes Trace requirement, enabling 1 Harmony buffer without penalty.",
          characterIds: ["acheron"],
        });
      } else {
        antiSynergyPenalty += 25;
        reasons.push({
          code: "ACHERON_NIHILITY_DEFICIT",
          category: "trace_constraint",
          type: "penalty",
          scoreDelta: -25,
          message: "Acheron Trace 'The Abyss' requires at least 1 other Nihility ally (at E2).",
          characterIds: ["acheron"],
        });
      }
    } else {
      // E0 or E1 requires 2 other Nihility allies
      if (otherNihilityCount < 2) {
        antiSynergyPenalty += 25;
        reasons.push({
          code: "ACHERON_NIHILITY_DEFICIT",
          category: "trace_constraint",
          type: "penalty",
          scoreDelta: -25,
          message: "Acheron Trace 'The Abyss' requires 2 other Nihility allies for full multiplier (at E0/E1).",
          characterIds: ["acheron"],
        });
      }
    }
  }

  // ========================================================================
  // 5. FIXED-POINT COMPOSITE SCORE CALCULATION
  // ========================================================================
  const weighted = hasTargetWeaknesses
    ? roleScore * 45 + synergyScore * 45 + elementScore * 10
    : roleScore * 50 + synergyScore * 50;

  const scoreBeforePenalty = deterministicRoundHundred(weighted);
  const finalScore = Math.max(0, Math.min(100, scoreBeforePenalty - antiSynergyPenalty));

  // ========================================================================
  // 6. ARCHETYPE LABEL & CANONICAL SLOT ASSIGNMENT
  // ========================================================================
  let archetype = "Balanced Combat Team";
  if (memberIds.has("acheron")) {
    archetype = "Nihility Slashed Dream Hypercarry";
  } else if (memberIds.has("firefly")) {
    archetype = "Super Break Destruction Hypercarry";
  } else if (memberIds.has("castorice")) {
    archetype = "Remembrance Memosprite Hypercarry";
  } else if (memberIds.has("the-herta")) {
    archetype = "Erudition Interpretation AoE";
  } else if (memberIds.has("aventurine-waveflair")) {
    archetype = "Elation Quantum Follow-Up";
  }

  // Sort slots: Carry -> Sub-DPS / Buffer -> Buffer / Battery -> Sustain
  const sortedMembers = [...members].sort((a, b) => {
    const priority = (m: TeamMember) => {
      if (m.knowledge.roles.includes("hypercarry_dps")) return 1;
      if (m.knowledge.roles.includes("break_dps")) return 2;
      if (m.knowledge.roles.includes("summon_dps")) return 3;
      if (m.knowledge.roles.includes("elation_dps")) return 4;
      if (m.knowledge.roles.includes("sub_dps")) return 5;
      if (m.knowledge.roles.includes("buffer")) return 6;
      if (m.knowledge.roles.includes("debuffer")) return 7;
      if (m.knowledge.roles.includes("battery")) return 8;
      if (m.knowledge.roles.includes("healer")) return 9;
      if (m.knowledge.roles.includes("shielder")) return 10;
      return 11;
    };
    return priority(a) - priority(b);
  });

  const slots: TeamSlotAssignment[] = sortedMembers.map((m, idx) => ({
    slot: (idx + 1) as 1 | 2 | 3 | 4,
    characterId: m.knowledge.id,
    role: m.knowledge.roles[0] || "sub_dps",
    level: m.roster.level,
    eidolon: m.roster.eidolon,
  }));

  return {
    score: finalScore,
    roleScore,
    synergyScore,
    elementScore,
    archetype,
    slots,
    reasons,
  };
}
