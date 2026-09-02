export interface CharacterFixture {
  id: string;
  name: string;
  rarity: 5 | 4;
  element: "Physical" | "Fire" | "Ice" | "Lightning" | "Wind" | "Quantum" | "Imaginary";
  path:
    | "Destruction"
    | "Hunt"
    | "Erudition"
    | "Harmony"
    | "Nihility"
    | "Preservation"
    | "Abundance"
    | "Remembrance";
  level?: number;
  eidolon?: number;
  superimposition?: number;
  status?: "owned" | "trial" | "unowned";
  avatarInitials: string;
  role: string;
}

export const FIXTURE_CHARACTERS: CharacterFixture[] = [
  {
    id: "acheron",
    name: "Acheron",
    rarity: 5,
    element: "Lightning",
    path: "Nihility",
    level: 80,
    eidolon: 2,
    superimposition: 1,
    status: "owned",
    avatarInitials: "AC",
    role: "Hypercarry DPS",
  },
  {
    id: "castorice",
    name: "Castorice",
    rarity: 5,
    element: "Quantum",
    path: "Remembrance",
    level: 80,
    eidolon: 0,
    superimposition: 1,
    status: "owned",
    avatarInitials: "CS",
    role: "Summon / Sub-DPS",
  },
  {
    id: "firefly",
    name: "Firefly",
    rarity: 5,
    element: "Fire",
    path: "Destruction",
    level: 80,
    eidolon: 1,
    superimposition: 1,
    status: "owned",
    avatarInitials: "FF",
    role: "Super Break DPS",
  },
  {
    id: "robin",
    name: "Robin",
    rarity: 5,
    element: "Physical",
    path: "Harmony",
    level: 80,
    eidolon: 0,
    superimposition: 0,
    status: "owned",
    avatarInitials: "RB",
    role: "Teamwide Buffer",
  },
  {
    id: "aventurine",
    name: "Aventurine",
    rarity: 5,
    element: "Imaginary",
    path: "Preservation",
    level: 80,
    eidolon: 0,
    superimposition: 1,
    status: "trial",
    avatarInitials: "AV",
    role: "Follow-up Shielder",
  },
  {
    id: "gallagher",
    name: "Gallagher",
    rarity: 4,
    element: "Fire",
    path: "Abundance",
    level: 75,
    eidolon: 6,
    superimposition: 5,
    status: "owned",
    avatarInitials: "GL",
    role: "Break Sustainer",
  },
  {
    id: "tingyun",
    name: "Tingyun",
    rarity: 4,
    element: "Lightning",
    path: "Harmony",
    level: 75,
    eidolon: 6,
    superimposition: 5,
    status: "owned",
    avatarInitials: "TY",
    role: "Energy Battery",
  },
  {
    id: "the-herta",
    name: "The Herta",
    rarity: 5,
    element: "Ice",
    path: "Erudition",
    level: 80,
    eidolon: 0,
    superimposition: 1,
    status: "unowned",
    avatarInitials: "TH",
    role: "AoE Sub-DPS",
  },
];

export interface RecommendationFixture {
  target: string;
  verdictTitle: string;
  matchScore: number;
  confidence: "High" | "Medium" | "Low";
  recommendedItem: string;
  recommendedCategory: string;
  rationale: string[];
  alternatives: { rank: number; name: string; score: number; note: string }[];
}

export const FIXTURE_RECOMMENDATION: RecommendationFixture = {
  target: "Acheron E2 Team Comp",
  verdictTitle: "Optimal Endgame Team Allocation",
  matchScore: 97,
  confidence: "High",
  recommendedItem: "Sparkle + Jiaoqiu + Aventurine",
  recommendedCategory: "Best-in-Slot Hypercarry",
  rationale: [
    "Acheron E2 reduces required Nihility teammates from 2 down to 1, unlocking Sparkle's 100% Action Advance & Crit DMG buffs.",
    "Jiaoqiu generates Crimson Knot stacks on enemy turns, maximizing Ultimate cycle frequency to <1.5 turns.",
    "Aventurine with Trend / Sig Light Cone generates additional Nihility stacks upon receiving attacks.",
  ],
  alternatives: [
    {
      rank: 2,
      name: "Pela + Silver Wolf + Gallagher",
      score: 88,
      note: "Double Nihility defense shred with 0 SP consumption.",
    },
    {
      rank: 3,
      name: "Robin + Jiaoqiu + Fu Xuan",
      score: 84,
      note: "High burst damage window during Concerto state.",
    },
  ],
};

export interface SourceComparisonFixture {
  category: string;
  patch: string;
  lastUpdated: string;
  sources: {
    sourceName: string;
    sourceType: "Community Tier List" | "Editorial Guide" | "Theorycraft Calc";
    topPick: string;
    secondPick: string;
    thirdPick: string;
    confidenceNote: string;
  }[];
}

export const FIXTURE_SOURCE_COMPARISON: SourceComparisonFixture = {
  category: "Acheron Light Cone Priority",
  patch: "v3.0.1",
  lastUpdated: "2026-08-24",
  sources: [
    {
      sourceName: "Prydwen Community",
      sourceType: "Community Tier List",
      topPick: "Along the Passing Shore (S1)",
      secondPick: "Good Night and Sleep Well (S5)",
      thirdPick: "Boundless Choreo (S5)",
      confidenceNote: "S1 Signature outperforms 4-star options by ~22% baseline damage.",
    },
    {
      sourceName: "Game8 Database",
      sourceType: "Editorial Guide",
      topPick: "Along the Passing Shore (S1)",
      secondPick: "Incessant Rain (S1)",
      thirdPick: "Good Night and Sleep Well (S5)",
      confidenceNote: "Crit rate baseline + Mirage Fizzle vulnerability debuff.",
    },
    {
      sourceName: "Guobie / Sheet Theory",
      sourceType: "Theorycraft Calc",
      topPick: "Along the Passing Shore (S1)",
      secondPick: "Good Night and Sleep Well (S5)",
      thirdPick: "Patience Is All You Need (S1)",
      confidenceNote:
        "Mathematical sim: 1,420,000 DPA cycle output under standard debuff uptime.",
    },
  ],
};

export interface DecisionFixture {
  encounterType: string;
  recommendedPick: string;
  recommendedType: string;
  decisionHeadline: string;
  whyPick: string[];
  whyNotOthers: { name: string; reason: string }[];
}

export const FIXTURE_DECISION: DecisionFixture = {
  encounterType: "Divergent Universe Blessing Selection",
  recommendedPick: "Perfect Experience: Fuli",
  recommendedType: "3★ Blessing of Remembrance",
  decisionHeadline: "PICK: Perfect Experience: Fuli",
  whyPick: [
    "Inflicts Dissociation upon hitting Frozen enemies, dealing 30% Max HP true damage on removal.",
    "Synchronizes directly with Castorice & Remembrance path resonance for instant elite wave clears.",
  ],
  whyNotOthers: [
    {
      name: "Blessing of Hunt (Celestial Annihilation)",
      reason: "Low value: Team relies on Freeze/Break rather than Turn Reset.",
    },
    {
      name: "Blessing of Preservation (Macrosegregation)",
      reason: "Redundant: Current sustain already exceeds incoming damage.",
    },
  ],
};
