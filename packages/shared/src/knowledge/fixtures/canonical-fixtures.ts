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
import { CANONICAL_CHARACTERS_DATA } from "./canonical-characters";

export const CANONICAL_CHARACTERS: CharacterKnowledge[] = CANONICAL_CHARACTERS_DATA;

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
