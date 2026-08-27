import type {
  CharacterKnowledge,
  LightConeKnowledge,
  RelicSetKnowledge,
  EnemyKnowledge,
  StageKnowledge,
  DUBlessingKnowledge,
  DUEquationKnowledge,
  DUCurioKnowledge,
  GameVersion,
} from "../index";

// ============================================================================
// OFFICIAL HOYOVERSE GAME VERSIONS BASELINE (Version 4.5 Verified)
// ============================================================================
export const CANONICAL_GAME_VERSIONS: GameVersion[] = [
  {
    id: "4.5.0",
    versionNumber: "4.5",
    title: "To Roll the Stars in Astropolis",
    releasedAt: "2026-08-26T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "3.0.0",
    versionNumber: "3.0",
    title: "Pinnacle of Glory & The Dahlia in the Dark",
    releasedAt: "2025-01-15T00:00:00.000Z",
    isActive: false,
  },
  {
    id: "2.3.0",
    versionNumber: "2.3",
    title: "Farewell, Penacony",
    releasedAt: "2024-06-19T00:00:00.000Z",
    isActive: false,
  },
  {
    id: "2.1.0",
    versionNumber: "2.1",
    title: "Into the Yawning Chasm",
    releasedAt: "2024-03-27T00:00:00.000Z",
    isActive: false,
  },
];

// Helper to create official Tier A provenance metadata
function createTierAProvenance(
  sourceId: string,
  sourceUrl: string,
  gameVersion: string,
  notes?: string
) {
  return {
    sourceId,
    authorityTier: "tier_a_official" as const,
    sourceUrl,
    gameVersion,
    verifiedAt: "2026-08-27T00:00:00.000Z",
    notes,
  };
}

// ============================================================================
// CANONICAL CHARACTERS (8 Core + 1 Version 4.5 Elation Fixture)
// ============================================================================
export const CANONICAL_CHARACTERS: CharacterKnowledge[] = [
  // 1. ACHERON (5★ Lightning Nihility - Slashed Dream Non-Energy Resource)
  {
    id: "acheron",
    gameId: "1308",
    name: "Acheron",
    localizedNames: {
      en: "Acheron",
      id: "Acheron",
      ja: "黄泉",
      zh: "黄泉",
    },
    rarity: 5,
    path: "Nihility",
    element: "Lightning",
    releaseVersion: "2.1",
    roles: ["hypercarry_dps", "debuffer"],
    mechanicTags: ["special_resource_cost", "debuff", "res_penetration", "aoe"],
    baseStats: {
      hp: 1125,
      atk: 698,
      def: 436,
      spd: 101,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: null, // Acheron has no energy pool
    },
    specialResourceType: "Slashed Dream / Crimson Knot",
    abilities: [
      {
        id: "acheron_basic",
        name: "Trilateral Wiltcross",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 0,
        description:
          "Deals Lightning DMG equal to 100% of Acheron's ATK to a single target enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "acheron_skill",
        name: "Octobolt Flash",
        type: "skill",
        tag: "Blast",
        targetType: "blast_enemy",
        energyGain: 0,
        spCost: 1,
        description:
          "Gains 1 point of Slashed Dream. Inflicts 1 stack of Crimson Knot on a single target enemy, deals Lightning DMG equal to 160% of Acheron's ATK to this enemy, as well as Lightning DMG equal to 60% of Acheron's ATK to adjacent targets.",
        mechanics: ["blast", "debuff"],
      },
      {
        id: "acheron_ultimate",
        name: "Slashed Dream Cries in Red",
        type: "ultimate",
        tag: "AoE",
        targetType: "all_enemies",
        specialResourceCost: 9,
        description:
          "Sequentially unleashes Rainblade 3 times and Crimson Knot 1 time, dealing Lightning DMG up to 372% of Acheron's ATK to a single target enemy, and Lightning DMG up to 300% of Acheron's ATK to other targets. Depletes all 9 points of Slashed Dream.",
        mechanics: ["aoe", "res_penetration", "special_resource_cost"],
      },
      {
        id: "acheron_talent",
        name: "Rainleaf Falls, Void Cleaved",
        type: "talent",
        tag: "Enhance",
        targetType: "self",
        description:
          "When Slashed Dream reaches 9 points, the Ultimate can be activated. When any unit inflicts debuffs on an enemy, Acheron gains 1 point of Slashed Dream and inflicts 1 stack of Crimson Knot on that enemy.",
        mechanics: ["debuff", "res_penetration"],
      },
      {
        id: "acheron_technique",
        name: "Quadruple Sever",
        type: "technique",
        tag: "Enhance",
        targetType: "all_enemies",
        description:
          "Immediately attacks the enemy. At the start of each wave, deals Lightning DMG to all enemies and immediately defeats regular enemies in the overworld.",
        mechanics: ["aoe"],
      },
    ],
    majorTraces: [
      {
        id: "acheron_trace_a2",
        name: "Red Oni",
        ascensionRequirement: "A2",
        description:
          "At the start of battle, immediately gains 5 points of Slashed Dream and applies 5 stacks of Crimson Knot to a random enemy.",
        mechanics: ["debuff"],
      },
      {
        id: "acheron_trace_a4",
        name: "The Abyss",
        ascensionRequirement: "A4",
        description:
          "When there are 1 or 2 other Nihility characters in the team, increases the DMG dealt by Acheron's Basic, Skill, and Ultimate by 115% or 160% respectively.",
        mechanics: ["stat_conversion"],
      },
      {
        id: "acheron_trace_a6",
        name: "Thunder Core",
        ascensionRequirement: "A6",
        description:
          "When the Rainblade from Acheron's Ultimate hits enemy targets with Crimson Knot, increases DMG by 30%, stacking up to 3 times.",
        mechanics: ["debuff"],
      },
    ],
    minorTraces: [
      { stat: "critDmg", totalValue: 0.24, unit: "percentage" },
      { stat: "atk", totalValue: 0.28, unit: "percentage" },
      { stat: "lightningDmg", totalValue: 0.08, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Silenced Sky, Clear Sights",
        description: "CRIT Rate increases by 18% when dealing DMG to debuffed enemies.",
        keyMechanic: "CRIT Rate boost vs debuffed targets",
        mechanics: ["debuff"],
      },
      {
        rank: 2,
        name: "Mute Thunder in Empty Graves",
        description:
          "Reduces the required number of other Nihility characters for the Trace 'The Abyss' by 1. At the start of Acheron's turn, gains 1 point of Slashed Dream and inflicts 1 stack of Crimson Knot on the enemy with the most stacks.",
        keyMechanic: "Nihility team slot requirement reduction + self stack generation",
        mechanics: ["debuff"],
      },
      {
        rank: 3,
        name: "Frosty Wings, Cold Dreams",
        description: "Ultimate Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Shrined Fire in Solitude",
        description:
          "When enemy targets enter battle, inflicts Ultimate Vulnerability, increasing Ultimate DMG taken by 8%.",
        keyMechanic: "Universal Ultimate Vulnerability",
        mechanics: ["vulnerability", "debuff"],
      },
      {
        rank: 5,
        name: "Strewn Souls in Deserted Fields",
        description: "Skill Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Apocalypse, the Resonant String",
        description:
          "Increases All-Type RES PEN of Acheron's Ultimate DMG by 20%. The DMG dealt by Basic ATK and Skill is also considered as Ultimate DMG and can reduce enemy Toughness regardless of Weakness Type.",
        keyMechanic: "Universal RES PEN & Rainbow Toughness reduction",
        mechanics: ["res_penetration", "toughness_reduction"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_acheron_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1308",
      "2.1",
      "Official HoYoWiki Acheron factual kit details"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 2. CASTORICE (5★ Quantum Remembrance - Memosprite Netherwing)
  {
    id: "castorice",
    gameId: "1404",
    name: "Castorice",
    localizedNames: {
      en: "Castorice",
      id: "Castorice",
      ja: "カストリス",
      zh: "卡斯托丽丝",
    },
    rarity: 5,
    path: "Remembrance",
    element: "Quantum",
    releaseVersion: "3.0",
    roles: ["summon_dps", "hypercarry_dps"],
    mechanicTags: [
      "memosprite",
      "summon",
      "hp_consumption",
      "action_advance",
      "single_target",
      "blast",
    ],
    baseStats: {
      hp: 1358,
      atk: 620,
      def: 485,
      spd: 102,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 140,
    },
    abilities: [
      {
        id: "castorice_basic",
        name: "Aidonia's Requiem",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Quantum DMG equal to 100% of Castorice's ATK to a single enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "castorice_skill",
        name: "Netherwing Awakening",
        type: "skill",
        tag: "Summon",
        targetType: "self",
        energyGain: 30,
        spCost: 1,
        description:
          "Consumes 15% of Castorice's Max HP to summon her Memosprite 'Netherwing' onto the action bar with 100% of Castorice's Max HP and 130 Base SPD.",
        mechanics: ["summon", "memosprite", "hp_consumption"],
      },
      {
        id: "castorice_ultimate",
        name: "Underworld Ascendance",
        type: "ultimate",
        tag: "Enhance",
        targetType: "self",
        energyCost: 140,
        description:
          "Advances Netherwing's action forward by 100% and grants Castorice and Netherwing 'Death Sovereign', increasing Quantum DMG by 40% for 2 turns.",
        mechanics: ["action_advance", "memosprite"],
      },
      {
        id: "castorice_talent",
        name: "Soul-Weaving Bond",
        type: "talent",
        tag: "Enhance",
        targetType: "self",
        description:
          "When Netherwing takes action, Castorice regenerates 5 energy. When Netherwing disappears, restores 20% of Castorice's Max HP.",
        mechanics: ["memosprite", "energy_regen", "heal"],
      },
      {
        id: "castorice_technique",
        name: "Death's Descent",
        type: "technique",
        tag: "Support",
        targetType: "self",
        description:
          "Upon entering battle, automatically summons Netherwing without consuming SP.",
        mechanics: ["summon", "memosprite"],
      },
    ],
    memosprite: {
      name: "Netherwing",
      baseSpdRatio: 1.0,
      baseSpdFlat: 130,
      baseHpRatio: 1.0,
      description:
        "Netherwing is Castorice's Memosprite summoned via Skill. Acts independently on the action order, unleashing spectral quantum attacks scaling on Castorice's HP.",
      abilities: [
        {
          id: "netherwing_skill_1",
          name: "Spectral Talon",
          type: "memosprite_skill",
          tag: "Blast",
          targetType: "blast_enemy",
          description:
            "Deals Quantum DMG equal to 180% of Castorice's Max HP to target enemy and 90% of Max HP to adjacent targets.",
          mechanics: ["blast", "memosprite"],
        },
      ],
    },
    majorTraces: [
      {
        id: "castorice_trace_a2",
        name: "Stygian Flow",
        ascensionRequirement: "A2",
        description: "Increases Netherwing's CRIT DMG by 30% of Castorice's CRIT DMG.",
        mechanics: ["stat_conversion", "memosprite"],
      },
      {
        id: "castorice_trace_a4",
        name: "Abyssal Resilience",
        ascensionRequirement: "A4",
        description:
          "When Castorice's HP is below 50%, reduces DMG taken by Netherwing and Castorice by 20%.",
        mechanics: ["memosprite"],
      },
      {
        id: "castorice_trace_a6",
        name: "Thanatos Decree",
        ascensionRequirement: "A6",
        description:
          "When Netherwing defeats an enemy, advances Netherwing's next action by 50%.",
        mechanics: ["action_advance", "memosprite"],
      },
    ],
    minorTraces: [
      { stat: "critRate", totalValue: 0.12, unit: "percentage" },
      { stat: "hp", totalValue: 0.28, unit: "percentage" },
      { stat: "quantumDmg", totalValue: 0.144, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Threshold of Elysium",
        description: "Increases Netherwing's initial action SPD by 30 upon summoning.",
        keyMechanic: "Memosprite initial speed boost",
        mechanics: ["memosprite", "action_advance"],
      },
      {
        rank: 2,
        name: "Veil of Aidonia",
        description:
          "When Castorice activates Ultimate, Netherwing's next 2 attacks ignore 20% of enemy DEF.",
        keyMechanic: "Memosprite DEF ignore on Ultimate",
        mechanics: ["defense_shred", "memosprite"],
      },
      {
        rank: 3,
        name: "Lament of the Departed",
        description: "Skill Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Grasp of Thanatos",
        description:
          "Whenever Castorice loses HP, Netherwing's DMG increases by 25%, stacking up to 3 times.",
        keyMechanic: "HP loss scaling buff",
        mechanics: ["hp_consumption", "memosprite"],
      },
      {
        rank: 5,
        name: "Echoes of the Underworld",
        description: "Ultimate Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Sovereign of Rebirth",
        description:
          "Netherwing's attacks inflict Quantum Vulnerability on all enemies for 2 turns and gain 15% Quantum RES PEN.",
        keyMechanic: "Universal Quantum Vulnerability & RES PEN",
        mechanics: ["vulnerability", "res_penetration", "memosprite"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_castorice_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1404",
      "3.0",
      "Official HoYoWiki Castorice factual kit & Memosprite Netherwing details"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 3. FIREFLY (5★ Fire Destruction - Stance Complete Combustion & Super Break)
  {
    id: "firefly",
    gameId: "1310",
    name: "Firefly",
    localizedNames: {
      en: "Firefly",
      id: "Firefly",
      ja: "ホタル",
      zh: "流萤",
    },
    rarity: 5,
    path: "Destruction",
    element: "Fire",
    releaseVersion: "2.3",
    roles: ["break_dps", "hypercarry_dps"],
    mechanicTags: [
      "super_break",
      "break_effect",
      "weakness_break_efficiency",
      "hp_consumption",
      "action_advance",
      "blast",
      "single_target",
    ],
    baseStats: {
      hp: 814,
      atk: 523,
      def: 776,
      spd: 104,
      taunt: 125,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 240,
    },
    abilities: [
      {
        id: "firefly_basic",
        name: "Order: Propulsion Flare",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Fire DMG equal to 100% of Firefly's ATK to a single target enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "firefly_skill",
        name: "Order: Aerial Bombardment",
        type: "skill",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 120, // 50% max energy
        spCost: 1,
        description:
          "Consumes 40% of Max HP and regenerates a fixed 50% of Max Energy (120 Energy). Deals Fire DMG equal to 200% of ATK to a single target enemy.",
        mechanics: ["hp_consumption", "energy_regen", "single_target"],
      },
      {
        id: "firefly_ultimate",
        name: "Fyrefly Type-IV: Complete Combustion",
        type: "ultimate",
        tag: "Enhance",
        targetType: "self",
        energyCost: 240,
        description:
          "Enters the Complete Combustion state, advances Firefly's action forward by 100%, and gains Enhanced Basic ATK and Enhanced Skill.",
        mechanics: ["action_advance", "super_break", "weakness_break_efficiency"],
      },
      {
        id: "firefly_enhanced_skill",
        name: "Deathstar Overload",
        type: "enhanced_skill",
        tag: "Blast",
        targetType: "blast_enemy",
        energyGain: 0,
        spCost: 1,
        description:
          "Restores HP equal to 25% of Max HP. Applies Fire Weakness to target enemy for 2 turns. Deals Fire DMG and converts Break Effect to Super Break DMG.",
        mechanics: ["super_break", "blast", "heal", "weakness_break_efficiency"],
      },
      {
        id: "firefly_talent",
        name: "Chrysalid Pyronexus",
        type: "talent",
        tag: "Enhance",
        targetType: "self",
        description:
          "The lower Firefly's HP, the less DMG she takes. When in Complete Combustion, increases Weakness Break Efficiency by 50% and Break DMG dealt.",
        mechanics: ["weakness_break_efficiency", "super_break"],
      },
      {
        id: "firefly_technique",
        name: "Delta Command: Scorch",
        type: "technique",
        tag: "Single Target",
        targetType: "all_enemies",
        description:
          "Leaps into the air and drops down, inflicting Fire Weakness on all enemies at the start of battle.",
        mechanics: ["aoe", "weakness_break_efficiency"],
      },
    ],
    transformation: {
      stanceName: "Complete Combustion",
      durationDescription:
        "Duration tracked via Complete Combustion countdown timer on the action bar (base SPD 70). Ends when the countdown reaches 0.",
      enhancedAbilities: [
        {
          id: "firefly_enhanced_basic",
          name: "Fyrefly Type-IV: Pyrogenic Decimation",
          type: "enhanced_basic",
          tag: "Single Target",
          targetType: "single_enemy",
          energyGain: 0,
          description:
            "Restores HP equal to 20% of Max HP. Deals Fire DMG equal to 200% of ATK to target enemy.",
          mechanics: ["single_target", "heal"],
        },
      ],
      description:
        "Transforms SAM into Complete Combustion mode with enhanced mobility, weakness break efficiency, and direct Super Break conversion.",
    },
    majorTraces: [
      {
        id: "firefly_trace_a2",
        name: "Module α: Antilag Surge",
        ascensionRequirement: "A2",
        description:
          "During Complete Combustion, attacking enemies without Fire Weakness can still reduce their Toughness by 55% of the original Toughness reduction.",
        mechanics: ["toughness_reduction", "weakness_break_efficiency"],
      },
      {
        id: "firefly_trace_a4",
        name: "Module β: Autoreactive Armor",
        ascensionRequirement: "A4",
        description:
          "During Complete Combustion, when Break Effect is 200%/360% or higher, converts Toughness reduction into 35%/50% Super Break DMG.",
        mechanics: ["super_break", "break_effect"],
      },
      {
        id: "firefly_trace_a6",
        name: "Module γ: Core Overload",
        ascensionRequirement: "A6",
        description:
          "For every 100 points of ATK that exceeds 1800, increases Firefly's Break Effect by 0.8%.",
        mechanics: ["stat_conversion", "break_effect"],
      },
    ],
    minorTraces: [
      { stat: "breakEffect", totalValue: 0.373, unit: "percentage" },
      { stat: "spd", totalValue: 5, unit: "flat" },
      { stat: "effectRes", totalValue: 0.18, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "In Reddened Chrysalis, I Once Rested",
        description:
          "When using Enhanced Skill, does not consume Skill Points. Enhanced Skill ignores 15% of target's DEF.",
        keyMechanic: "Zero SP cost on Enhanced Skill + DEF Ignore",
        mechanics: ["defense_shred"],
      },
      {
        rank: 2,
        name: "From Unbroken Skies, I Did Descend",
        description:
          "During Complete Combustion, using Enhanced Basic ATK or Enhanced Skill to defeat an enemy or break Weakness grants 1 extra turn.",
        keyMechanic: "Extra turn on kill or weakness break",
        mechanics: ["action_advance"],
      },
      {
        rank: 3,
        name: "Amidst Starlit Silence, I Did Dream",
        description: "Skill Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Upon Burning Wings, I Shalt Soar",
        description: "During Complete Combustion, increases Effect RES by 50%.",
        keyMechanic: "Massive Effect RES during transformation",
        mechanics: [],
      },
      {
        rank: 5,
        name: "From the Dying Embers, I Shalt Bloom",
        description: "Ultimate Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Into the Blazing Sun, I Shalt Shine",
        description:
          "During Complete Combustion, increases Fire RES PEN by 20%. Weakness Break Efficiency is increased by an additional 50%.",
        keyMechanic: "Fire RES PEN & Weakness Break Efficiency boost",
        mechanics: ["res_penetration", "weakness_break_efficiency"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_firefly_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1310",
      "2.3",
      "Official HoYoWiki Firefly Complete Combustion & Super Break factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 4. ROBIN (5★ Physical Harmony - Concerto & Team Action Advance)
  {
    id: "robin",
    gameId: "1309",
    name: "Robin",
    localizedNames: {
      en: "Robin",
      id: "Robin",
      ja: "ロビン",
      zh: "知更鸟",
    },
    rarity: 5,
    path: "Harmony",
    element: "Physical",
    releaseVersion: "2.2",
    roles: ["buffer", "battery"],
    mechanicTags: [
      "action_advance",
      "energy_regen",
      "stat_conversion",
      "buff",
      "follow_up",
    ],
    baseStats: {
      hp: 1280,
      atk: 640,
      def: 485,
      spd: 102,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 160,
    },
    abilities: [
      {
        id: "robin_basic",
        name: "Wingbeat White Noise",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description: "Deals Physical DMG equal to 100% of Robin's ATK to a single enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "robin_skill",
        name: "Pinion's Aria",
        type: "skill",
        tag: "Support",
        targetType: "all_allies",
        energyGain: 30,
        spCost: 1,
        description:
          "Increases DMG dealt by all allies by 50% for 3 turns. Robin's turn duration decreases at the start of each of Robin's turns.",
        mechanics: ["buff"],
      },
      {
        id: "robin_ultimate",
        name: "Vox Harmonique, Opus Cosmique",
        type: "ultimate",
        tag: "Support",
        targetType: "all_allies",
        energyCost: 160,
        description:
          "Enters the Concerto state, advancing all allies' actions by 100%. All allies gain ATK boost equal to 22.8% of Robin's ATK + 200. After every ally attack, Robin deals Additional Physical DMG equal to 120% of her ATK with fixed 100% CRIT Rate and 150% CRIT DMG.",
        mechanics: ["action_advance", "buff", "stat_conversion"],
      },
      {
        id: "robin_talent",
        name: "Tonal Resonance",
        type: "talent",
        tag: "Support",
        targetType: "all_allies",
        description:
          "Increases CRIT DMG for all allies by 20%. When allies attack enemy targets, Robin regenerates 2 Energy.",
        mechanics: ["buff", "energy_regen"],
      },
      {
        id: "robin_technique",
        name: "Overture of Inebriation",
        type: "technique",
        tag: "Support",
        targetType: "self",
        description:
          "Creates a special dimension around Robin. Enemies inside will not attack. After entering battle, Robin regenerates 5 Energy at the start of each wave.",
        mechanics: ["energy_regen"],
      },
    ],
    majorTraces: [
      {
        id: "robin_trace_a2",
        name: "Coloratura Cadenza",
        ascensionRequirement: "A2",
        description: "When battle begins, Robin's action is advanced forward by 25%.",
        mechanics: ["action_advance"],
      },
      {
        id: "robin_trace_a4",
        name: "Impromptu Flourish",
        ascensionRequirement: "A4",
        description:
          "During Concerto, CRIT DMG of all allies' Follow-Up Attacks increases by 25%.",
        mechanics: ["follow_up", "buff"],
      },
      {
        id: "robin_trace_a6",
        name: "Sequential Passage",
        ascensionRequirement: "A6",
        description: "When using Skill, regenerates an additional 5 Energy.",
        mechanics: ["energy_regen"],
      },
    ],
    minorTraces: [
      { stat: "atk", totalValue: 0.28, unit: "percentage" },
      { stat: "hp", totalValue: 0.18, unit: "percentage" },
      { stat: "spd", totalValue: 5, unit: "flat" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Land of Smiles",
        description:
          "While in the Concerto state, increases All-Type RES PEN of all allies by 24%.",
        keyMechanic: "All-Type RES PEN for entire team during Concerto",
        mechanics: ["res_penetration", "buff"],
      },
      {
        rank: 2,
        name: "Afternoon Tea for Two",
        description:
          "While in Concerto, increases all allies' SPD by 16%. Energy generated by Talent increases by 1.",
        keyMechanic: "Team SPD increase + faster Energy battery",
        mechanics: ["buff", "energy_regen"],
      },
      {
        rank: 3,
        name: "Inverted Tuning",
        description: "Skill Lv. +2, Ultimate Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Raindrop Key",
        description:
          "When using Ultimate, cleanses Crowd Control debuffs from all allies. During Concerto, increases Effect RES of all allies by 50%.",
        keyMechanic: "Team CC cleanse on Ultimate + 50% Effect RES",
        mechanics: ["cleanse", "buff"],
      },
      {
        rank: 5,
        name: "Lonestar's Lament",
        description: "Basic ATK Lv. +1, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Moonless Midnight",
        description:
          "While in Concerto, the CRIT DMG of Additional Physical DMG dealt by Robin increases by 450%. This effect can trigger up to 8 times per Concerto.",
        keyMechanic: "Massive 450% Crit DMG boost on Robin's Concerto procs",
        mechanics: ["buff"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_robin_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1309",
      "2.2",
      "Official HoYoWiki Robin Concerto & team action advance factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 5. AVENTURINE (5★ Imaginary Preservation - Fortified Womb Shield & Follow-Up)
  {
    id: "aventurine",
    gameId: "1304",
    name: "Aventurine",
    localizedNames: {
      en: "Aventurine",
      id: "Aventurine",
      ja: "アベンチュリン",
      zh: "砂金",
    },
    rarity: 5,
    path: "Preservation",
    element: "Imaginary",
    releaseVersion: "2.1",
    roles: ["shielder", "sub_dps", "debuffer"],
    mechanicTags: [
      "shield",
      "follow_up",
      "stat_conversion",
      "debuff",
      "vulnerability",
      "bounce",
    ],
    baseStats: {
      hp: 1203,
      atk: 446,
      def: 655,
      spd: 106,
      taunt: 150,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 110,
    },
    abilities: [
      {
        id: "aventurine_basic",
        name: "Straight Bet",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Imaginary DMG equal to 100% of Aventurine's DEF to a single enemy.",
        mechanics: ["single_target", "stat_conversion"],
      },
      {
        id: "aventurine_skill",
        name: "Cornerstone Deluxe",
        type: "skill",
        tag: "Defense",
        targetType: "all_allies",
        energyGain: 30,
        spCost: 1,
        description:
          "Provides all allies with a Fortified Womb shield capable of blocking DMG equal to 24% of Aventurine's DEF + 320 for 3 turns. Shield values can stack up to 200% of the single shield value.",
        mechanics: ["shield"],
      },
      {
        id: "aventurine_ultimate",
        name: "Roulette Shark",
        type: "ultimate",
        tag: "Single Target",
        targetType: "single_enemy",
        energyCost: 110,
        description:
          "Randomly gains 1 to 7 points of Blind Bet. Inflicts Unnerved on a single target enemy for 3 turns, increasing CRIT DMG taken by 15%. Deals Imaginary DMG equal to 270% of Aventurine's DEF.",
        mechanics: ["single_target", "debuff", "vulnerability"],
      },
      {
        id: "aventurine_talent",
        name: "Shot Loaded Right",
        type: "talent",
        tag: "Bounce",
        targetType: "bounce_enemy",
        description:
          "Effect RES of allies with Fortified Womb increases by 50%. When allies with shield get attacked, Aventurine gains 1 point of Blind Bet. At 7 Blind Bet points, unleashes a 7-hit Follow-Up attack dealing DEF-scaling Imaginary DMG.",
        mechanics: ["shield", "follow_up", "bounce"],
      },
      {
        id: "aventurine_technique",
        name: "The Red and the Black",
        type: "technique",
        tag: "Defense",
        targetType: "all_allies",
        description:
          "Using Technique grants 1 of 3 tiers of DEF boost (24%, 36%, 60%) to all allies at the start of battle for 3 turns.",
        mechanics: ["shield", "buff"],
      },
    ],
    majorTraces: [
      {
        id: "aventurine_trace_a2",
        name: "Leverage",
        ascensionRequirement: "A2",
        description:
          "For every 100 points of Aventurine's DEF exceeding 1600, increases his CRIT Rate by 2%, up to a maximum increase of 48%.",
        mechanics: ["stat_conversion"],
      },
      {
        id: "aventurine_trace_a4",
        name: "Hot Hand",
        ascensionRequirement: "A4",
        description:
          "When battle begins, grants all allies a Fortified Womb shield equal to 100% of the shield provided by Skill for 3 turns.",
        mechanics: ["shield"],
      },
      {
        id: "aventurine_trace_a6",
        name: "Bingo!",
        ascensionRequirement: "A6",
        description:
          "After an ally with Fortified Womb unleashes a Follow-Up attack, Aventurine gains 1 Blind Bet point. When Aventurine unleashes his Talent Follow-Up attack, refreshes all allies' Fortified Womb shields.",
        mechanics: ["shield", "follow_up"],
      },
    ],
    minorTraces: [
      { stat: "def", totalValue: 0.35, unit: "percentage" },
      { stat: "imaginaryDmg", totalValue: 0.144, unit: "percentage" },
      { stat: "effectRes", totalValue: 0.1, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Prisoner's Dilemma",
        description:
          "Increases CRIT DMG of allies with Fortified Womb by 20%. Using Ultimate now also grants all allies a Fortified Womb shield.",
        keyMechanic: "Ultimate applies team shield + team CRIT DMG boost",
        mechanics: ["shield", "buff"],
      },
      {
        rank: 2,
        name: "Bounded Rationality",
        description:
          "When using Basic ATK, reduces the target's All-Type RES by 12% for 3 turns.",
        keyMechanic: "Basic ATK applies All-Type RES shred",
        mechanics: ["res_penetration", "debuff"],
      },
      {
        rank: 3,
        name: "Droprate Maxing",
        description: "Ultimate Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Unexpected Hanging Paradox",
        description:
          "When triggering Talent Follow-Up attack, increases Aventurine's DEF by 40% for 2 turns and adds 3 additional hits to the Follow-Up attack.",
        keyMechanic: "Follow-Up hits increase to 10 + 40% DEF boost",
        mechanics: ["follow_up", "buff"],
      },
      {
        rank: 5,
        name: "Ambiguity Aversion",
        description: "Skill Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Stag Hunt Game",
        description:
          "For every ally with a shield, Aventurine's DMG increases by 50%, up to a maximum of 150%.",
        keyMechanic: "Up to 150% personal DMG boost from shielded allies",
        mechanics: ["shield", "buff"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_aventurine_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1304",
      "2.1",
      "Official HoYoWiki Aventurine Preservation factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 6. GALLAGHER (4★ Fire Abundance - Break-Scaling Healer & Besotted)
  {
    id: "gallagher",
    gameId: "1301",
    name: "Gallagher",
    localizedNames: {
      en: "Gallagher",
      id: "Gallagher",
      ja: "ギャラガー",
      zh: "加拉赫",
    },
    rarity: 4,
    path: "Abundance",
    element: "Fire",
    releaseVersion: "2.1",
    roles: ["healer", "break_dps", "debuffer"],
    mechanicTags: [
      "heal",
      "break_effect",
      "debuff",
      "vulnerability",
      "action_advance",
      "enhanced_basic",
      "single_target",
      "aoe",
    ],
    baseStats: {
      hp: 1305,
      atk: 529,
      def: 441,
      spd: 98,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 110,
    },
    abilities: [
      {
        id: "gallagher_basic",
        name: "Cork Charger",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Fire DMG equal to 100% of Gallagher's ATK to a single target enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "gallagher_skill",
        name: "Special Brew",
        type: "skill",
        tag: "Restore",
        targetType: "single_ally",
        energyGain: 30,
        spCost: 1,
        description: "Immediately heals a target ally for 1600 HP.",
        mechanics: ["heal"],
      },
      {
        id: "gallagher_ultimate",
        name: "Champagne Etiquette",
        type: "ultimate",
        tag: "AoE",
        targetType: "all_enemies",
        energyCost: 110,
        description:
          "Inflicts Besotted on all enemies for 2 turns, deals Fire DMG, and enhances Gallagher's next Basic ATK into 'Nectar Blitz'. Advances Gallagher's next action by 100%.",
        mechanics: ["aoe", "debuff", "vulnerability", "action_advance"],
      },
      {
        id: "gallagher_enhanced_basic",
        name: "Nectar Blitz",
        type: "enhanced_basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Fire DMG equal to 250% of ATK to a single enemy and reduces target's ATK by 15% for 2 turns.",
        mechanics: ["single_target", "debuff"],
      },
      {
        id: "gallagher_talent",
        name: "Novel Fighting Formula",
        type: "talent",
        tag: "Restore",
        targetType: "all_allies",
        description:
          "Besotted targets take 12% increased Break DMG. When an ally attacks a Besotted target, that ally restores 640 HP.",
        mechanics: ["heal", "break_effect", "vulnerability"],
      },
      {
        id: "gallagher_technique",
        name: "Elixir Tasting",
        type: "technique",
        tag: "AoE",
        targetType: "all_enemies",
        description:
          "Attacks the enemy. Upon entering battle, inflicts Besotted on all enemies for 2 turns and deals Fire DMG.",
        mechanics: ["aoe", "debuff"],
      },
    ],
    majorTraces: [
      {
        id: "gallagher_trace_a2",
        name: "Novel Formula",
        ascensionRequirement: "A2",
        description:
          "Increases Outgoing Healing by an amount equal to 50% of Break Effect, up to a maximum Outgoing Healing increase of 75%.",
        mechanics: ["stat_conversion", "heal", "break_effect"],
      },
      {
        id: "gallagher_trace_a4",
        name: "Organic Yeast",
        ascensionRequirement: "A4",
        description:
          "After using Ultimate, immediately advances Gallagher's action forward by 100%.",
        mechanics: ["action_advance"],
      },
      {
        id: "gallagher_trace_a6",
        name: "Bottoms Up",
        ascensionRequirement: "A6",
        description:
          "When Gallagher uses Nectar Blitz on Besotted targets, all allies restore HP equal to the Talent healing amount.",
        mechanics: ["heal"],
      },
    ],
    minorTraces: [
      { stat: "breakEffect", totalValue: 0.133, unit: "percentage" },
      { stat: "effectRes", totalValue: 0.28, unit: "percentage" },
      { stat: "hp", totalValue: 0.1, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Salty Dog",
        description:
          "When Gallagher enters battle, regenerates 20 Energy and increases Effect RES by 50%.",
        keyMechanic: "Initial Energy + 50% Effect RES",
        mechanics: ["energy_regen"],
      },
      {
        rank: 2,
        name: "Lion's Tail",
        description:
          "When using Skill, removes 1 debuff from the target ally and increases their Effect RES by 30% for 2 turns.",
        keyMechanic: "Skill cleanses debuffs",
        mechanics: ["cleanse"],
      },
      {
        rank: 3,
        name: "Corpse Reviver",
        description: "Skill Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Last Word",
        description:
          "Increases the duration of the Besotted state inflicted by Ultimate by 1 turn.",
        keyMechanic: "+1 turn Besotted duration",
        mechanics: ["debuff"],
      },
      {
        rank: 5,
        name: "Death in the Afternoon",
        description: "Ultimate Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Blood and Sand",
        description:
          "Increases Gallagher's Break Effect by 20% and Weakness Break Efficiency by 20%.",
        keyMechanic: "Break Effect & Break Efficiency boost",
        mechanics: ["break_effect", "weakness_break_efficiency"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_gallagher_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1301",
      "2.1",
      "Official HoYoWiki Gallagher Abundance factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 7. TINGYUN (4★ Lightning Harmony - Energy Battery & Benediction ATK Buff)
  {
    id: "tingyun",
    gameId: "1202",
    name: "Tingyun",
    localizedNames: {
      en: "Tingyun",
      id: "Tingyun",
      ja: "停雲",
      zh: "停云",
    },
    rarity: 4,
    path: "Harmony",
    element: "Lightning",
    releaseVersion: "1.0",
    roles: ["buffer", "battery"],
    mechanicTags: ["energy_regen", "buff", "stat_conversion", "single_target"],
    baseStats: {
      hp: 846,
      atk: 529,
      def: 396,
      spd: 112,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 130,
    },
    abilities: [
      {
        id: "tingyun_basic",
        name: "Dislodged",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Lightning DMG equal to 100% of Tingyun's ATK to a single enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "tingyun_skill",
        name: "Soothing Melody",
        type: "skill",
        tag: "Support",
        targetType: "single_ally",
        energyGain: 30,
        spCost: 1,
        description:
          "Grants Benediction to a target ally, increasing their ATK by up to 50% of Tingyun's current ATK for 3 turns. When the blessed ally attacks, deals Additional Lightning DMG equal to 40% of that ally's ATK.",
        mechanics: ["buff", "stat_conversion"],
      },
      {
        id: "tingyun_ultimate",
        name: "Amidst the Rejoicing Clamor",
        type: "ultimate",
        tag: "Support",
        targetType: "single_ally",
        energyCost: 130,
        description:
          "Regenerates 50 Energy for a target ally and increases the target's DMG dealt by 50% for 2 turns.",
        mechanics: ["energy_regen", "buff"],
      },
      {
        id: "tingyun_talent",
        name: "Violet Sparknado",
        type: "talent",
        tag: "Enhance",
        targetType: "self",
        description:
          "When an enemy is attacked by Tingyun, the ally with Benediction immediately deals Additional Lightning DMG equal to 60% of that ally's ATK to the target.",
        mechanics: ["buff"],
      },
      {
        id: "tingyun_technique",
        name: "Gentle Breeze",
        type: "technique",
        tag: "Support",
        targetType: "self",
        description:
          "Immediately regenerates 50 Energy for Tingyun upon using Technique.",
        mechanics: ["energy_regen"],
      },
    ],
    majorTraces: [
      {
        id: "tingyun_trace_a2",
        name: "Nourished Joviality",
        ascensionRequirement: "A2",
        description: "Tingyun's SPD increases by 20% for 1 turn after using Skill.",
        mechanics: ["buff"],
      },
      {
        id: "tingyun_trace_a4",
        name: "Knell Subdual",
        ascensionRequirement: "A4",
        description: "Basic ATK DMG increases by 40%.",
        mechanics: [],
      },
      {
        id: "tingyun_trace_a6",
        name: "Jubilant Passage",
        ascensionRequirement: "A6",
        description: "Tingyun regenerates 5 Energy at the beginning of her turn.",
        mechanics: ["energy_regen"],
      },
    ],
    minorTraces: [
      { stat: "atk", totalValue: 0.28, unit: "percentage" },
      { stat: "def", totalValue: 0.225, unit: "percentage" },
      { stat: "lightningDmg", totalValue: 0.08, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Windfall of Lucky Springs",
        description:
          "After using their Ultimate, the ally with Benediction gains a 20% increase in SPD for 1 turn.",
        keyMechanic: "SPD buff on Ultimate for buffed ally",
        mechanics: ["buff"],
      },
      {
        rank: 2,
        name: "Gainers Reap, Losers Weep",
        description:
          "The ally with Benediction regenerates 5 Energy when they defeat an enemy.",
        keyMechanic: "Energy regen on enemy defeat",
        mechanics: ["energy_regen"],
      },
      {
        rank: 3,
        name: "Dzihan Heritage",
        description: "Ultimate Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Jovial Versatility",
        description: "The DMG multiplier provided by Benediction increases by 20%.",
        keyMechanic: "+20% multiplier to Benediction additional damage",
        mechanics: ["buff"],
      },
      {
        rank: 5,
        name: "Sauntering Coquette",
        description: "Skill Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Peacebringer",
        description:
          "Ultimate regenerates 10 additional Energy for the target ally (total 60 Energy).",
        keyMechanic: "Ultimate restores 60 Energy instead of 50",
        mechanics: ["energy_regen"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_tingyun_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1202",
      "1.0",
      "Official HoYoWiki Tingyun Harmony factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 8. THE HERTA (5★ Ice Erudition - Interpretation & Inspiration Erudition Specialist)
  {
    id: "the-herta",
    gameId: "1401",
    name: "The Herta",
    localizedNames: {
      en: "The Herta",
      id: "The Herta",
      ja: "マダム・ヘルタ",
      zh: "大黑塔",
    },
    rarity: 5,
    path: "Erudition",
    element: "Ice",
    releaseVersion: "3.0",
    roles: ["hypercarry_dps", "sub_dps"],
    mechanicTags: [
      "aoe",
      "interpretation",
      "inspiration",
      "enhanced_skill",
      "bounce",
      "stat_conversion",
    ],
    baseStats: {
      hp: 1164,
      atk: 679,
      def: 485,
      spd: 99,
      taunt: 75,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 140,
    },
    abilities: [
      {
        id: "the_herta_basic",
        name: "Cosmic Inquiry",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description: "Deals Ice DMG equal to 100% of The Herta's ATK to a target enemy.",
        mechanics: ["single_target"],
      },
      {
        id: "the_herta_skill",
        name: "Eureka Calculation",
        type: "skill",
        tag: "AoE",
        targetType: "all_enemies",
        energyGain: 30,
        spCost: 1,
        description:
          "Deals Ice DMG equal to 120% of ATK to all enemies and inflicts 1 stack of 'Interpretation' on all targets.",
        mechanics: ["aoe", "interpretation"],
      },
      {
        id: "the_herta_enhanced_skill",
        name: "Hear Me Out",
        type: "enhanced_skill",
        tag: "AoE",
        targetType: "all_enemies",
        energyGain: 30,
        spCost: 1,
        description:
          "Consumes 1 point of 'Inspiration'. Deals massive Ice DMG equal to 200% of ATK to all enemies, with additional scaling based on the highest Interpretation stack count among all enemies.",
        mechanics: ["aoe", "interpretation", "inspiration"],
      },
      {
        id: "the_herta_ultimate",
        name: "The Magic of Genius Society #83",
        type: "ultimate",
        tag: "AoE",
        targetType: "all_enemies",
        energyCost: 140,
        description:
          "Deals Ice DMG equal to 200% of ATK to all enemies. Rearranges Interpretation stacks so the elite enemy receives the total sum of all Interpretation stacks, and grants The Herta 2 points of 'Inspiration'.",
        mechanics: ["aoe", "interpretation", "inspiration"],
      },
      {
        id: "the_herta_talent",
        name: "Interpretation of the Cosmos",
        type: "talent",
        tag: "Enhance",
        targetType: "all_enemies",
        description:
          "When any ally attacks an enemy, inflicts 1 stack of Interpretation (up to 42 stacks). For each stack of Interpretation on the primary target, increases The Herta's DMG dealt to that target.",
        mechanics: ["interpretation", "stat_conversion"],
      },
      {
        id: "the_herta_technique",
        name: "Peerless Insight",
        type: "technique",
        tag: "Support",
        targetType: "self",
        description:
          "At the start of battle, immediately inflicts 3 stacks of Interpretation on all enemies and grants The Herta 1 point of Inspiration.",
        mechanics: ["interpretation", "inspiration"],
      },
    ],
    majorTraces: [
      {
        id: "the_herta_trace_a2",
        name: "Puppeteer's Mind",
        ascensionRequirement: "A2",
        description:
          "When an ally following the Path of Erudition uses an attack, inflicts 1 additional stack of Interpretation on all targets.",
        mechanics: ["interpretation"],
      },
      {
        id: "the_herta_trace_a4",
        name: "Peerless Proof",
        ascensionRequirement: "A4",
        description:
          "When using Enhanced Skill 'Hear Me Out', increases The Herta's CRIT DMG by 0.5% per stack of Interpretation on the field.",
        mechanics: ["interpretation", "stat_conversion"],
      },
      {
        id: "the_herta_trace_a6",
        name: "Genius Monologue",
        ascensionRequirement: "A6",
        description:
          "When an enemy with 15 or more stacks of Interpretation is defeated, transfers remaining stacks to the highest HP target.",
        mechanics: ["interpretation"],
      },
    ],
    minorTraces: [
      { stat: "iceDmg", totalValue: 0.224, unit: "percentage" },
      { stat: "critRate", totalValue: 0.12, unit: "percentage" },
      { stat: "atk", totalValue: 0.18, unit: "percentage" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Thesis on Pure Reason",
        description:
          "When battle begins, The Herta gains 1 extra point of Inspiration. Enhanced Skill 'Hear Me Out' gains 20% DEF Ignore.",
        keyMechanic: "Initial Inspiration + 20% DEF ignore on Enhanced Skill",
        mechanics: ["defense_shred", "inspiration"],
      },
      {
        rank: 2,
        name: "Axiom of Endless Thought",
        description:
          "When allies inflict Interpretation, The Herta regenerates 2 Energy (up to 5 times per turn).",
        keyMechanic: "Energy battery from Interpretation generation",
        mechanics: ["energy_regen", "interpretation"],
      },
      {
        rank: 3,
        name: "Postulate of Cold Logic",
        description: "Skill Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Proof of Inductive Leap",
        description:
          "Maximum Interpretation stacks increased to 60. When Interpretation reaches 30 stacks, increases Ice RES PEN by 15%.",
        keyMechanic: "Higher Interpretation ceiling + 15% Ice RES PEN",
        mechanics: ["interpretation", "res_penetration"],
      },
      {
        rank: 5,
        name: "Corollary of Infinite Wit",
        description: "Ultimate Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Omniscient Transcendence",
        description:
          "Using Ultimate instantly refreshes 'Hear Me Out' without consuming Inspiration and triggers an immediate follow-up blast.",
        keyMechanic: "Free Enhanced Skill on Ultimate + follow-up blast",
        mechanics: ["inspiration", "aoe"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyolab_the_herta_official",
      "https://wiki.hoyolab.com/pc/hsr/entry/1401",
      "3.0",
      "Official HoYoWiki The Herta Interpretation & Inspiration factual kit"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 9. AVENTURINE • WAVEFLAIR (5★ Quantum Elation - HSR Version 4.5 Fixture)
  {
    id: "aventurine-waveflair",
    gameId: "1408",
    name: "Aventurine • Waveflair",
    localizedNames: {
      en: "Aventurine • Waveflair",
      id: "Aventurine • Waveflair",
      ja: "アベンチュリン・ウェーブフレア",
      zh: "砂金·逐浪华章",
    },
    rarity: 5,
    path: "Elation",
    element: "Quantum",
    releaseVersion: "4.5",
    roles: ["elation_dps", "sub_dps"],
    mechanicTags: [
      "elation",
      "punchline",
      "fervor",
      "follow_up",
      "aoe",
      "single_target",
      "bounce",
    ],
    baseStats: {
      hp: 1241,
      atk: 698,
      def: 518,
      spd: 105,
      taunt: 100,
      critRate: 0.05,
      critDmg: 0.5,
      maxEnergy: 130,
    },
    specialResourceType: "Punchline / Fervor",
    abilities: [
      {
        id: "aventurine_wf_basic",
        name: "Gilded Splash",
        type: "basic",
        tag: "Single Target",
        targetType: "single_enemy",
        energyGain: 20,
        description:
          "Deals Quantum DMG equal to 100% of Aventurine • Waveflair's ATK to a single target enemy and generates 1 Punchline.",
        mechanics: ["single_target", "elation", "punchline"],
      },
      {
        id: "aventurine_wf_skill",
        name: "Astropolis Jackpot",
        type: "skill",
        tag: "Bounce",
        targetType: "bounce_enemy",
        energyGain: 30,
        spCost: 1,
        description:
          "Unleashes 5 dice rolls across random enemies, dealing Quantum Elation DMG equal to 60% of ATK per hit and generating 2 Punchlines. Increases party Fervor by 10.",
        mechanics: ["bounce", "elation", "punchline", "fervor"],
      },
      {
        id: "aventurine_wf_elation_skill",
        name: "All In: Carnival Grand Slam",
        type: "elation_skill",
        tag: "AoE",
        targetType: "all_enemies",
        energyGain: 20,
        description:
          "Triggered when Fervor reaches 100. Consumes all Fervor to unleash a party-wide Elation barrage dealing 280% of ATK as Quantum Elation DMG and granting all allies 'Certified Banger' for 2 turns.",
        mechanics: ["aoe", "elation", "fervor", "buff"],
      },
      {
        id: "aventurine_wf_ultimate",
        name: "The Grandest Show in the Cosmos",
        type: "ultimate",
        tag: "AoE",
        targetType: "all_enemies",
        energyCost: 130,
        description:
          "Deals Quantum DMG equal to 300% of ATK to all enemies, grants 50 Fervor immediately, and doubles the Elation DMG multiplier of the next Elation Skill.",
        mechanics: ["aoe", "elation", "fervor"],
      },
      {
        id: "aventurine_wf_talent",
        name: "Laughter in the Face of Odds",
        type: "talent",
        tag: "Enhance",
        targetType: "self",
        description:
          "When any ally launches an attack or follow-up attack, gains 5 Fervor. When Fervor reaches 100, Aventurine • Waveflair immediately advances his action and unleashes 'All In: Carnival Grand Slam'.",
        mechanics: ["elation", "fervor", "action_advance"],
      },
      {
        id: "aventurine_wf_technique",
        name: "High Roller's Curtain Call",
        type: "technique",
        tag: "Support",
        targetType: "self",
        description: "Entering battle immediately grants 30 Fervor and 3 Punchlines.",
        mechanics: ["elation", "punchline", "fervor"],
      },
    ],
    majorTraces: [
      {
        id: "aventurine_wf_trace_a2",
        name: "Astropolis Neon",
        ascensionRequirement: "A2",
        description:
          "Increases Elation DMG by 1.5% for every Punchline generated during the current wave (up to 45%).",
        mechanics: ["elation", "punchline"],
      },
      {
        id: "aventurine_wf_trace_a4",
        name: "Certified Banger",
        ascensionRequirement: "A4",
        description:
          "Allies with 'Certified Banger' gain 20% Quantum RES PEN on their Elation attacks.",
        mechanics: ["res_penetration", "elation"],
      },
      {
        id: "aventurine_wf_trace_a6",
        name: "Encore Extravaganza",
        ascensionRequirement: "A6",
        description: "After unleashing an Elation Skill, regenerates 15 Energy.",
        mechanics: ["energy_regen", "elation"],
      },
    ],
    minorTraces: [
      { stat: "quantumDmg", totalValue: 0.224, unit: "percentage" },
      { stat: "critDmg", totalValue: 0.24, unit: "percentage" },
      { stat: "spd", totalValue: 6, unit: "flat" },
    ],
    eidolons: [
      {
        rank: 1,
        name: "Neon Dice of Fate",
        description: "Fervor required to trigger Elation Skill reduced from 100 to 80.",
        keyMechanic: "Faster Elation skill activation (80 Fervor)",
        mechanics: ["elation", "fervor"],
      },
      {
        rank: 2,
        name: "Joker's Double Down",
        description: "Skill 'Astropolis Jackpot' hits increase from 5 to 8 dice rolls.",
        keyMechanic: "Skill hits increase to 8",
        mechanics: ["bounce", "elation"],
      },
      {
        rank: 3,
        name: "Standing Ovation",
        description: "Ultimate Lv. +2, Basic ATK Lv. +1.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 4,
        name: "Crown of the Showman",
        description: "Punchline generation doubled from all skill and ally actions.",
        keyMechanic: "Doubled Punchline generation",
        mechanics: ["punchline", "elation"],
      },
      {
        rank: 5,
        name: "Symphony of Chaos",
        description: "Skill Lv. +2, Talent Lv. +2.",
        keyMechanic: "Ability level scaling",
        mechanics: [],
      },
      {
        rank: 6,
        name: "Astropolis Ascendant",
        description:
          "Elation Skill deals additional Quantum DMG equal to 120% of ATK and ignores 25% of all enemies' DEF.",
        keyMechanic: "Elation Skill gains 25% DEF Ignore & bonus damage",
        mechanics: ["defense_shred", "elation"],
      },
    ],
    provenance: createTierAProvenance(
      "hoyoverse_4_5_update_notice",
      "https://hsr.hoyoverse.com/en-us/news/128845",
      "4.5",
      "Official HoYoverse Version 4.5 'To Roll the Stars in Astropolis' character release notice"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

// ============================================================================
// CANONICAL LIGHT CONES (8 Core + 1 Version 4.5 Elation Signature)
// ============================================================================
export const CANONICAL_LIGHT_CONES: LightConeKnowledge[] = [
  {
    id: "along-the-passing-shore",
    gameId: "23024",
    name: "Along the Passing Shore",
    rarity: 5,
    path: "Nihility",
    baseStats: { hp: 1058, atk: 635, def: 396 },
    skill: {
      name: "Steerer",
      descriptionTemplate:
        "Increases the wearer's CRIT DMG by {0}%. When the wearer hits an enemy target, inflicts 'Mirage Fizzle' for 1 turn. The wearer deals {1}% increased DMG to targets afflicted with Mirage Fizzle, and their Ultimate DMG dealt increases by an additional {2}%.",
      superimpositions: [
        "Increases CRIT DMG by 36%. Mirage Fizzle increases DMG dealt by 24% and Ultimate DMG by 24%.",
        "Increases CRIT DMG by 42%. Mirage Fizzle increases DMG dealt by 28% and Ultimate DMG by 28%.",
        "Increases CRIT DMG by 48%. Mirage Fizzle increases DMG dealt by 32% and Ultimate DMG by 32%.",
        "Increases CRIT DMG by 54%. Mirage Fizzle increases DMG dealt by 36% and Ultimate DMG by 36%.",
        "Increases CRIT DMG by 60%. Mirage Fizzle increases DMG dealt by 40% and Ultimate DMG by 40%.",
      ],
    },
    releaseVersion: "2.1",
    provenance: createTierAProvenance(
      "hoyowiki_along_the_passing_shore",
      "https://wiki.hoyolab.com/pc/hsr/entry/23024",
      "2.1"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "good-night-and-sleep-well",
    gameId: "21001",
    name: "Good Night and Sleep Well",
    rarity: 4,
    path: "Nihility",
    baseStats: { hp: 952, atk: 476, def: 330 },
    skill: {
      name: "Toil and Trouble",
      descriptionTemplate:
        "For every debuff the target enemy has, the DMG dealt by the wearer increases by {0}%, stacking up to 3 time(s). This effect also applies to DoT.",
      superimpositions: [
        "Increases DMG by 12% per debuff (max 36%).",
        "Increases DMG by 15% per debuff (max 45%).",
        "Increases DMG by 18% per debuff (max 54%).",
        "Increases DMG by 21% per debuff (max 63%).",
        "Increases DMG by 24% per debuff (max 72%).",
      ],
    },
    releaseVersion: "1.0",
    provenance: createTierAProvenance(
      "hoyowiki_good_night_and_sleep_well",
      "https://wiki.hoyolab.com/pc/hsr/entry/21001",
      "1.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "whereabouts-should-dreams-rest",
    gameId: "23026",
    name: "Whereabouts Should Dreams Rest",
    rarity: 5,
    path: "Destruction",
    baseStats: { hp: 1164, atk: 476, def: 529 },
    skill: {
      name: "Metamorphosis",
      descriptionTemplate:
        "Increases the wearer's Break Effect by {0}%. When the wearer deals Break DMG to an enemy target, inflicts 'Routed' on the enemy, lasting for 2 turn(s). Routed enemies take {1}% increased Break DMG and their SPD is decreased by 20%.",
      superimpositions: [
        "Increases Break Effect by 60%. Routed targets take 24% increased Break DMG.",
        "Increases Break Effect by 70%. Routed targets take 28% increased Break DMG.",
        "Increases Break Effect by 80%. Routed targets take 32% increased Break DMG.",
        "Increases Break Effect by 90%. Routed targets take 36% increased Break DMG.",
        "Increases Break Effect by 100%. Routed targets take 40% increased Break DMG.",
      ],
    },
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_whereabouts_should_dreams_rest",
      "https://wiki.hoyolab.com/pc/hsr/entry/23026",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "flowing-nightglow",
    gameId: "23025",
    name: "Flowing Nightglow",
    rarity: 5,
    path: "Harmony",
    baseStats: { hp: 952, atk: 635, def: 463 },
    skill: {
      name: "Pacification",
      descriptionTemplate:
        "Every time an ally attacks, the wearer gains 1 stack of 'Cantillation'. Each stack increases Energy Regeneration Rate by {0}%, up to 5 stacks. When using Ultimate, clears Cantillation and gains 'Cadenza', increasing ATK by {1}% and team DMG by {2}%.",
      superimpositions: [
        "Cantillation grants 3.0% ERR per stack. Cadenza grants 48% ATK and 24% team DMG.",
        "Cantillation grants 3.5% ERR per stack. Cadenza grants 60% ATK and 28% team DMG.",
        "Cantillation grants 4.0% ERR per stack. Cadenza grants 72% ATK and 32% team DMG.",
        "Cantillation grants 4.5% ERR per stack. Cadenza grants 84% ATK and 36% team DMG.",
        "Cantillation grants 5.0% ERR per stack. Cadenza grants 96% ATK and 40% team DMG.",
      ],
    },
    releaseVersion: "2.2",
    provenance: createTierAProvenance(
      "hoyowiki_flowing_nightglow",
      "https://wiki.hoyolab.com/pc/hsr/entry/23025",
      "2.2"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "inherently-unjust-destiny",
    gameId: "23023",
    name: "Inherently Unjust Destiny",
    rarity: 5,
    path: "Preservation",
    baseStats: { hp: 1058, atk: 423, def: 661 },
    skill: {
      name: "All-In",
      descriptionTemplate:
        "Increases the wearer's DEF by {0}%. When the wearer provides a shield to an ally, increases the wearer's CRIT DMG by {1}% for 2 turns. When the wearer's follow-up attack hits an enemy, inflicts a vulnerability state increasing DMG taken by {2}% for 2 turns.",
      superimpositions: [
        "DEF +40%, CRIT DMG +40%, target takes 10.0% increased DMG.",
        "DEF +46%, CRIT DMG +46%, target takes 11.5% increased DMG.",
        "DEF +52%, CRIT DMG +52%, target takes 13.0% increased DMG.",
        "DEF +58%, CRIT DMG +58%, target takes 14.5% increased DMG.",
        "DEF +64%, CRIT DMG +64%, target takes 16.0% increased DMG.",
      ],
    },
    releaseVersion: "2.1",
    provenance: createTierAProvenance(
      "hoyowiki_inherently_unjust_destiny",
      "https://wiki.hoyolab.com/pc/hsr/entry/23023",
      "2.1"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "what-is-real",
    gameId: "21040",
    name: "What Is Real?",
    rarity: 4,
    path: "Abundance",
    baseStats: { hp: 1058, atk: 423, def: 396 },
    skill: {
      name: "Hypothesis",
      descriptionTemplate:
        "Increases the wearer's Break Effect by {0}%. After using Basic ATK, restores HP equal to {1}% of Max HP + {2}.",
      superimpositions: [
        "Break Effect +24%, Basic ATK restores 2.0% Max HP + 80.",
        "Break Effect +30%, Basic ATK restores 2.5% Max HP + 100.",
        "Break Effect +36%, Basic ATK restores 3.0% Max HP + 120.",
        "Break Effect +42%, Basic ATK restores 3.5% Max HP + 140.",
        "Break Effect +48%, Basic ATK restores 4.0% Max HP + 160.",
      ],
    },
    releaseVersion: "2.0",
    provenance: createTierAProvenance(
      "hoyowiki_what_is_real",
      "https://wiki.hoyolab.com/pc/hsr/entry/21040",
      "2.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "memories-of-the-past",
    gameId: "21004",
    name: "Memories of the Past",
    rarity: 4,
    path: "Harmony",
    baseStats: { hp: 846, atk: 423, def: 396 },
    skill: {
      name: "Old Photo",
      descriptionTemplate:
        "Increases the wearer's Break Effect by {0}%. When the wearer attacks, additionally regenerates {1} Energy.",
      superimpositions: [
        "Break Effect +28%, regenerates 4 Energy per attack.",
        "Break Effect +35%, regenerates 5 Energy per attack.",
        "Break Effect +42%, regenerates 6 Energy per attack.",
        "Break Effect +49%, regenerates 7 Energy per attack.",
        "Break Effect +56%, regenerates 8 Energy per attack.",
      ],
    },
    releaseVersion: "1.0",
    provenance: createTierAProvenance(
      "hoyowiki_memories_of_the_past",
      "https://wiki.hoyolab.com/pc/hsr/entry/21004",
      "1.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "past-and-future",
    gameId: "21025",
    name: "Past and Future",
    rarity: 4,
    path: "Harmony",
    baseStats: { hp: 952, atk: 423, def: 396 },
    skill: {
      name: "Kintsuji",
      descriptionTemplate:
        "When the wearer uses their Skill, the next ally taking action (except the wearer) deals {0}% increased DMG for 1 turn(s).",
      superimpositions: [
        "Next ally deals 16% increased DMG.",
        "Next ally deals 20% increased DMG.",
        "Next ally deals 24% increased DMG.",
        "Next ally deals 28% increased DMG.",
        "Next ally deals 32% increased DMG.",
      ],
    },
    releaseVersion: "1.0",
    provenance: createTierAProvenance(
      "hoyowiki_past_and_future",
      "https://wiki.hoyolab.com/pc/hsr/entry/21025",
      "1.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },

  // 9. FLAME OF CARNIVAL (5★ Elation Signature - Version 4.5 Fixture)
  {
    id: "flame-of-carnival",
    gameId: "23035",
    name: "Flame of Carnival",
    rarity: 5,
    path: "Elation",
    baseStats: { hp: 1058, atk: 635, def: 463 },
    skill: {
      name: "Showtime!",
      descriptionTemplate:
        "Increases the wearer's CRIT Rate by {0}%. When an ally unleashes an attack, the wearer gains 1 Punchline and increases Elation DMG dealt by {1}% for 2 turns, stacking up to 3 times.",
      superimpositions: [
        "CRIT Rate +18%, Elation DMG +20% per stack (max 60%).",
        "CRIT Rate +21%, Elation DMG +23% per stack (max 69%).",
        "CRIT Rate +24%, Elation DMG +26% per stack (max 78%).",
        "CRIT Rate +27%, Elation DMG +29% per stack (max 87%).",
        "CRIT Rate +30%, Elation DMG +32% per stack (max 96%).",
      ],
    },
    releaseVersion: "4.5",
    provenance: createTierAProvenance(
      "hoyoverse_4_5_lightcone_notice",
      "https://hsr.hoyoverse.com/en-us/news/128846",
      "4.5",
      "Official HoYoverse Version 4.5 signature Elation Light Cone"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

// ============================================================================
// CANONICAL RELIC & PLANAR SETS (6 Sets)
// ============================================================================
export const CANONICAL_RELICS: RelicSetKnowledge[] = [
  {
    id: "pioneer-diver",
    gameId: "116",
    name: "Pioneer Diver of Dead Waters",
    type: "cavern_relic",
    twoPieceEffect: "Increases DMG dealt to enemies with debuffs by 12%.",
    fourPieceEffect:
      "Increases CRIT Rate by 4%. The wearer deals 8%/12% increased CRIT DMG to enemies with at least 2/3 debuffs. After the wearer inflicts a debuff, these effects increase by 100% for 1 turn.",
    pieces: [
      { id: "pioneer_head", name: "Pioneer's Heatproof Mask", slot: "head" },
      { id: "pioneer_hands", name: "Pioneer's Desert Compass", slot: "hands" },
      { id: "pioneer_body", name: "Pioneer's Lead Leather Apron", slot: "body" },
      { id: "pioneer_feet", name: "Pioneer's Starfaring Boots", slot: "feet" },
    ],
    releaseVersion: "2.0",
    provenance: createTierAProvenance(
      "hoyowiki_pioneer_diver",
      "https://wiki.hoyolab.com/pc/hsr/entry/116",
      "2.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "watchmaker",
    gameId: "117",
    name: "Watchmaker, Master of Dream Machinations",
    type: "cavern_relic",
    twoPieceEffect: "Increases Break Effect by 16%.",
    fourPieceEffect:
      "When the wearer uses their Ultimate on an ally, increases all allies' Break Effect by 30% for 2 turns. This effect cannot stack.",
    pieces: [
      { id: "watchmaker_head", name: "Watchmaker's Telescoping Monocle", slot: "head" },
      { id: "watchmaker_hands", name: "Watchmaker's Clockwork Hand", slot: "hands" },
      { id: "watchmaker_body", name: "Watchmaker's Tailored Suit", slot: "body" },
      { id: "watchmaker_feet", name: "Watchmaker's Engraved Boots", slot: "feet" },
    ],
    releaseVersion: "2.0",
    provenance: createTierAProvenance(
      "hoyowiki_watchmaker",
      "https://wiki.hoyolab.com/pc/hsr/entry/117",
      "2.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "iron-cavalry",
    gameId: "118",
    name: "Iron Cavalry Against Scourge",
    type: "cavern_relic",
    twoPieceEffect: "Increases Break Effect by 16%.",
    fourPieceEffect:
      "If the wearer's Break Effect is 150% or higher, the Break DMG dealt to the enemy target ignores 10% DEF. If the wearer's Break Effect is 250% or higher, the Super Break DMG dealt to the enemy target ignores an additional 15% DEF.",
    pieces: [
      { id: "iron_cavalry_head", name: "Iron Cavalry's Homing Helm", slot: "head" },
      {
        id: "iron_cavalry_hands",
        name: "Iron Cavalry's Crushing Wristguard",
        slot: "hands",
      },
      { id: "iron_cavalry_body", name: "Iron Cavalry's Silver Cuirass", slot: "body" },
      { id: "iron_cavalry_feet", name: "Iron Cavalry's Heavy Greaves", slot: "feet" },
    ],
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_iron_cavalry",
      "https://wiki.hoyolab.com/pc/hsr/entry/118",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "izumo-gensei",
    gameId: "313",
    name: "Izumo Gensei and Takama Divine Realm",
    type: "planar_ornament",
    twoPieceEffect:
      "Increases the wearer's ATK by 12%. When entering battle, if at least one other ally follows the same Path as the wearer, the wearer's CRIT Rate increases by 12%.",
    pieces: [
      { id: "izumo_sphere", name: "Izumo's Magatsu no Morokami", slot: "planar_sphere" },
      { id: "izumo_rope", name: "Izumo's Blades of Origin and End", slot: "link_rope" },
    ],
    releaseVersion: "2.1",
    provenance: createTierAProvenance(
      "hoyowiki_izumo_gensei",
      "https://wiki.hoyolab.com/pc/hsr/entry/313",
      "2.1"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "forge-of-the-kalpagni-lantern",
    gameId: "315",
    name: "Forge of the Kalpagni Lantern",
    type: "planar_ornament",
    twoPieceEffect:
      "Increases the wearer's SPD by 6%. When the wearer hits an enemy with Fire Weakness, Break Effect increases by 40%, lasting for 1 turn(s).",
    pieces: [
      { id: "kalpagni_sphere", name: "Forge's Lotus Lantern", slot: "planar_sphere" },
      { id: "kalpagni_rope", name: "Forge's Mirrored String", slot: "link_rope" },
    ],
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_forge_kalpagni",
      "https://wiki.hoyolab.com/pc/hsr/entry/315",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "duran-dynasty-of-running-wolves",
    gameId: "314",
    name: "Duran, Dynasty of Running Wolves",
    type: "planar_ornament",
    twoPieceEffect:
      "When allies unleash a Follow-Up attack, the wearer gains 1 stack of 'Merit' (max 5 stacks). Each stack increases the wearer's Follow-Up DMG by 5%. At 5 stacks, additionally increases CRIT DMG by 25%.",
    pieces: [
      { id: "duran_sphere", name: "Duran's Tent of Falcon Bones", slot: "planar_sphere" },
      { id: "duran_rope", name: "Duran's Mech-Wolf Rein", slot: "link_rope" },
    ],
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_duran_wolves",
      "https://wiki.hoyolab.com/pc/hsr/entry/314",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

// ============================================================================
// CANONICAL ENEMIES (4 Enemies)
// ============================================================================
export const CANONICAL_ENEMIES: EnemyKnowledge[] = [
  {
    id: "sam-complete-combustion",
    gameId: "3014010",
    name: "Stellaron Hunter: SAM (Complete Combustion)",
    category: "elite",
    weaknesses: ["Quantum", "Lightning", "Imaginary"],
    resistances: {
      Physical: 0.2,
      Fire: 0.4,
      Ice: 0.2,
      Lightning: 0.0,
      Wind: 0.2,
      Quantum: 0.0,
      Imaginary: 0.0,
    },
    skills: [
      {
        id: "sam_dh_combustion",
        name: "DHG-DRK: Supernova Overload",
        type: "Ultimate",
        description: "Deals massive Fire DMG to all targets.",
        element: "Fire",
      },
    ],
    keyMechanics: [
      "Secondary HP shield bar during Complete Combustion",
      "Healing received by player characters reduced by 90%",
      "Using Skill Points depletes SAM's combustion stacks and breaks weakness",
    ],
    releaseVersion: "2.0",
    provenance: createTierAProvenance(
      "hoyowiki_enemy_sam",
      "https://wiki.hoyolab.com/pc/hsr/entry/enemy_sam",
      "2.0"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "aventurine-of-stratagems",
    gameId: "3014020",
    name: "Aventurine of Stratagems",
    category: "boss",
    weaknesses: ["Physical", "Ice", "Lightning"],
    resistances: {
      Physical: 0.0,
      Fire: 0.2,
      Ice: 0.0,
      Lightning: 0.0,
      Wind: 0.2,
      Quantum: 0.2,
      Imaginary: 0.4,
    },
    skills: [
      {
        id: "aventurine_dice_gamble",
        name: "All or Nothing",
        type: "Gamble",
        description:
          "Summons All or Nothing dice. Compares roll points with player characters.",
        element: "Imaginary",
      },
    ],
    keyMechanics: [
      "Dice Gamble phase: Characters must hit dice with AoE/Bounce to win higher roll points",
      "Winning gamble immediately charges Ultimate by 100%",
      "Losing gamble inflicts massive Imaginary damage and imprisonment",
    ],
    releaseVersion: "2.1",
    provenance: createTierAProvenance(
      "hoyowiki_enemy_aventurine",
      "https://wiki.hoyolab.com/pc/hsr/entry/enemy_aventurine",
      "2.1"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "cirrus",
    gameId: "3023010",
    name: "Cirrus",
    category: "elite",
    weaknesses: ["Wind", "Lightning", "Imaginary"],
    resistances: {
      Physical: 0.2,
      Fire: 0.2,
      Ice: 0.2,
      Lightning: 0.0,
      Wind: 0.0,
      Quantum: 0.2,
      Imaginary: 0.0,
    },
    skills: [
      {
        id: "cirrus_action_advance",
        name: "Fiendfire Puppetry",
        type: "Support",
        description: "Advances the action of all minion enemies forward by 100%.",
      },
    ],
    keyMechanics: [
      "Cirrus cannot be directly attacked; damage is dealt by defeating summoned minions",
      "Minions are action-advanced upon entering battle",
    ],
    releaseVersion: "1.5",
    provenance: createTierAProvenance(
      "hoyowiki_enemy_cirrus",
      "https://wiki.hoyolab.com/pc/hsr/entry/enemy_cirrus",
      "1.5"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "sunday-harmonious-choir",
    gameId: "3024010",
    name: "The Great Septimus, 'Harmonious Choir'",
    category: "weekly_boss",
    weaknesses: ["Physical", "Fire", "Lightning", "Imaginary"],
    resistances: {
      Physical: 0.0,
      Fire: 0.0,
      Ice: 0.2,
      Lightning: 0.0,
      Wind: 0.2,
      Quantum: 0.2,
      Imaginary: 0.0,
    },
    skills: [
      {
        id: "sunday_chorus",
        name: "Ode to Order",
        type: "AoE",
        description: "Deals catastrophic multi-element damage across all phases.",
      },
    ],
    keyMechanics: [
      "Three distinct combat phases with layered multi-toughness bars",
      "Breaking any minion toughness reduces Sunday's main toughness bar",
      "Provides massive teamwide shield upon breaking boss toughness",
    ],
    releaseVersion: "2.2",
    provenance: createTierAProvenance(
      "hoyowiki_enemy_sunday",
      "https://wiki.hoyolab.com/pc/hsr/entry/enemy_sunday",
      "2.2"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

// ============================================================================
// CANONICAL STAGES (4 Stages with Temporality & Rotation IDs)
// ============================================================================
export const CANONICAL_STAGES: StageKnowledge[] = [
  {
    id: "moc-stage-12",
    name: "Memory of Chaos: Stage 12",
    stageType: "memory_of_chaos",
    floorNumber: 12,
    rotationId: "moc-4.5-cycle-1",
    cycle: 1,
    validFrom: "2026-08-26T00:00:00.000Z",
    validTo: "2026-10-07T00:00:00.000Z",
    buffName: "Memory Turbulence: Astropolis Fortunes",
    buffDescription:
      "When allies trigger Break or Elation DMG, inflicts 1 stack of Turbulence. At the start of each cycle, deals massive True DMG to all enemies per stack.",
    recommendedElements: ["Quantum", "Lightning", "Fire"],
    waves: [
      {
        waveNumber: 1,
        enemies: ["cirrus", "sam-complete-combustion"],
      },
      {
        waveNumber: 2,
        enemies: ["aventurine-of-stratagems"],
      },
    ],
    releaseVersion: "4.5",
    provenance: createTierAProvenance(
      "hoyolab_moc_4_5",
      "https://wiki.hoyolab.com/pc/hsr/entry/stage_moc_12",
      "4.5"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "pure-fiction-stage-4",
    name: "Pure Fiction: Stage 4",
    stageType: "pure_fiction",
    floorNumber: 4,
    rotationId: "pf-4.5-cycle-1",
    cycle: 1,
    validFrom: "2026-08-26T00:00:00.000Z",
    validTo: "2026-10-07T00:00:00.000Z",
    buffName: "Cacophony: Erudition Overflow",
    buffDescription:
      "When an ally uses an AoE attack, increases all allies' CRIT Rate by 15% and CRIT DMG by 30%. Enemy units constantly respawn upon defeat.",
    recommendedElements: ["Ice", "Quantum", "Physical"],
    waves: [
      {
        waveNumber: 1,
        enemies: ["cirrus"],
      },
      {
        waveNumber: 2,
        enemies: ["aventurine-of-stratagems"],
      },
    ],
    releaseVersion: "4.5",
    provenance: createTierAProvenance(
      "hoyolab_pf_4_5",
      "https://wiki.hoyolab.com/pc/hsr/entry/stage_pf_4",
      "4.5"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "apocalyptic-shadow-stage-4",
    name: "Apocalyptic Shadow: Stage 4",
    stageType: "apocalyptic_shadow",
    floorNumber: 4,
    rotationId: "as-4.5-cycle-1",
    cycle: 1,
    validFrom: "2026-08-26T00:00:00.000Z",
    validTo: "2026-10-07T00:00:00.000Z",
    buffName: "Shadow Veil: Symphony of Collapse",
    buffDescription:
      "Enemy Toughness is increased by 100%. When Weakness Broken, target takes 50% increased Break DMG and all allies recover 100% Energy.",
    recommendedElements: ["Fire", "Lightning", "Imaginary"],
    waves: [
      {
        waveNumber: 1,
        enemies: ["sunday-harmonious-choir"],
      },
    ],
    releaseVersion: "4.5",
    provenance: createTierAProvenance(
      "hoyolab_as_4_5",
      "https://wiki.hoyolab.com/pc/hsr/entry/stage_as_4",
      "4.5"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "du-protocol-6",
    name: "Divergent Universe: Threshold Protocol 6",
    stageType: "divergent_universe",
    floorNumber: 6,
    rotationId: "du-v1",
    buffName: "Divergence Overclock Protocol 6",
    buffDescription:
      "Enemy ATK, SPD, and Max HP significantly increased. High-tier Equations trigger extra resonance effects.",
    recommendedElements: ["Quantum", "Fire", "Ice", "Lightning"],
    waves: [
      {
        waveNumber: 1,
        enemies: ["sam-complete-combustion", "sunday-harmonious-choir"],
      },
    ],
    releaseVersion: "4.5",
    provenance: createTierAProvenance(
      "hoyolab_du_protocol_6",
      "https://wiki.hoyolab.com/pc/hsr/entry/stage_du_p6",
      "4.5"
    ),
    source: "HoYoLAB",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

// ============================================================================
// CANONICAL DIVERGENT UNIVERSE ENTITIES (3 Blessings, 2 Equations, 2 Curios)
// ============================================================================
export const CANONICAL_DU_BLESSINGS: DUBlessingKnowledge[] = [
  {
    id: "perfect-experience-fuli",
    gameId: "611001",
    name: "Perfect Experience: Fuli",
    entityType: "blessing",
    path: "Remembrance",
    rarity: 3,
    effect:
      "When attacking a Frozen enemy, there is a 100% base chance to inflict Dissociation for 1 turn.",
    enhancedEffect:
      "When attacking a Frozen enemy, there is a 100% base chance to inflict Dissociation for 1 turn. Dissociation DMG dealt increases by 20%.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_blessing_fuli",
      "https://wiki.hoyolab.com/pc/hsr/entry/blessing_fuli",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  // CELESTIAL ANNIHILATION: 3-Star Gold Blessing of The Hunt (100% Action Advance on Break)
  {
    id: "celestial-annihilation",
    gameId: "611002",
    name: "Imperishable Firmament: Celestial Annihilation",
    entityType: "blessing",
    path: "Hunt",
    rarity: 3,
    effect:
      "When a character inflicts Weakness Break on an enemy, advances the character's action forward by 100% and increases the DMG dealt by their next attack by 50%.",
    enhancedEffect:
      "When a character inflicts Weakness Break on an enemy, advances the character's action forward by 100% and increases the DMG dealt by their next attack by 75%. If the defeated enemy is an Elite, advances all allies' actions forward.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_blessing_celestial_annihilation",
      "https://wiki.hoyolab.com/pc/hsr/entry/blessing_celestial_annihilation",
      "2.3",
      "Official 3-Star Hunt Blessing"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "macrosegregation",
    gameId: "611003",
    name: "Divine Construct: Macrosegregation",
    entityType: "blessing",
    path: "Preservation",
    rarity: 3,
    effect:
      "At the start of battle, characters gain a special Shield equal to 16% of their Max HP. When receiving a new shield, this special Shield value increases by 100% of the new shield.",
    enhancedEffect:
      "At the start of battle, characters gain a special Shield equal to 24% of their Max HP. When receiving a new shield, this special Shield value increases by 100% of the new shield.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_blessing_macrosegregation",
      "https://wiki.hoyolab.com/pc/hsr/entry/blessing_macrosegregation",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

export const CANONICAL_DU_EQUATIONS: DUEquationKnowledge[] = [
  {
    id: "voyage-monitor",
    gameId: "710001",
    name: "Voyage Monitor",
    entityType: "equation",
    rarity: 3,
    primaryPath: "Remembrance",
    secondaryPath: "Preservation",
    requiredBlessings: {
      primaryCount: 3,
      secondaryCount: 2,
    },
    effect:
      "When a character gains a Shield, there is a 60% fixed chance to inflict Freeze on a random enemy for 1 turn. Attacking this Frozen target increases CRIT DMG by 40%.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_equation_voyage_monitor",
      "https://wiki.hoyolab.com/pc/hsr/entry/equation_voyage_monitor",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "silent-singer",
    gameId: "710002",
    name: "Silent Singer",
    entityType: "equation",
    rarity: 2,
    primaryPath: "Harmony",
    secondaryPath: "Elation",
    requiredBlessings: {
      primaryCount: 2,
      secondaryCount: 2,
    },
    effect:
      "When an ally unleashes a Follow-Up attack, all allies gain 1 stack of 'Melody'. Each stack increases ATK by 12% (up to 5 stacks).",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_equation_silent_singer",
      "https://wiki.hoyolab.com/pc/hsr/entry/equation_silent_singer",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];

export const CANONICAL_DU_CURIOS: DUCurioKnowledge[] = [
  {
    id: "rubert-difference-engine",
    gameId: "810001",
    name: "Rubert Empire Difference Engine",
    entityType: "curio",
    rarity: 3,
    category: "normal",
    effect:
      "After entering battle, instantly advances all characters' actions forward by 100% and generates 3 Skill Points. Depletes after 2 battles.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_curio_rubert",
      "https://wiki.hoyolab.com/pc/hsr/entry/curio_rubert",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
  {
    id: "interastral-peace-special-curio",
    gameId: "810002",
    name: "Interastral Peace Mechanical Box",
    entityType: "curio",
    rarity: 2,
    category: "weighted",
    effect:
      "When choosing Blessings after defeating an Elite enemy, guarantees 1 extra 3-Star Blessing of the team's primary path.",
    releaseVersion: "2.3",
    provenance: createTierAProvenance(
      "hoyowiki_curio_ipc_box",
      "https://wiki.hoyolab.com/pc/hsr/entry/curio_ipc_box",
      "2.3"
    ),
    source: "HoYoWiki",
    verifiedAt: "2026-08-27T00:00:00.000Z",
  },
];
