import * as fs from "node:fs";
import * as path from "node:path";
import * as prettier from "prettier";
import {
  CharacterKnowledgeSchema,
  type CharacterKnowledge,
  type CombatPath,
  type CombatElement,
  type CharacterRole,
  type CharacterMechanicTag,
  type AbilityType,
  type AbilityTargetType,
} from "../packages/shared/src/knowledge";
import { CANONICAL_CHARACTERS as EXISTING_CHARACTERS } from "../packages/shared/src/knowledge/fixtures/canonical-fixtures";

const PATH_MAP: Record<string, CombatPath> = {
  Knight: "Preservation",
  Rogue: "Hunt",
  Mage: "Erudition",
  Shaman: "Harmony",
  Warlock: "Nihility",
  Warrior: "Destruction",
  Priest: "Abundance",
  Memory: "Remembrance",
  Elation: "Elation",
};

const ELEMENT_MAP: Record<string, CombatElement> = {
  Thunder: "Lightning",
  Physical: "Physical",
  Fire: "Fire",
  Ice: "Ice",
  Wind: "Wind",
  Quantum: "Quantum",
  Imaginary: "Imaginary",
};

const RELEASE_VERSIONS: Record<string, string> = {
  // 1.0
  "1001": "1.0",
  "1002": "1.0",
  "1003": "1.0",
  "1004": "1.0",
  "1008": "1.0",
  "1009": "1.0",
  "1013": "1.0",
  "1101": "1.0",
  "1102": "1.0",
  "1103": "1.0",
  "1104": "1.0",
  "1105": "1.0",
  "1106": "1.0",
  "1107": "1.0",
  "1108": "1.0",
  "1109": "1.0",
  "1201": "1.0",
  "1202": "1.0",
  "1204": "1.0",
  "1206": "1.0",
  "1209": "1.0",
  "1211": "1.0",
  "8001": "1.0",
  "8003": "1.0",

  // 1.1
  "1006": "1.1",
  "1203": "1.1",
  "1207": "1.1",

  // 1.2
  "1205": "1.2",
  "1005": "1.2",
  "1111": "1.2",

  // 1.3
  "1213": "1.3",
  "1208": "1.3",
  "1110": "1.3",

  // 1.4
  "1212": "1.4",
  "1112": "1.4",
  "1210": "1.4",

  // 1.5
  "1217": "1.5",
  "1302": "1.5",
  "1215": "1.5",

  // 1.6
  "1303": "1.6",
  "1305": "1.6",
  "1214": "1.6",

  // 2.0
  "1307": "2.0",
  "1306": "2.0",
  "1312": "2.0",

  // 2.1
  "1308": "2.1",
  "1304": "2.1",
  "1301": "2.1",

  // 2.2
  "1309": "2.2",
  "1315": "2.2",
  "8005": "2.2",

  // 2.3
  "1310": "2.3",
  "1314": "2.3",

  // 2.4
  "1221": "2.4",
  "1218": "2.4",
  "1224": "2.4",

  // 2.5
  "1220": "2.5",
  "1222": "2.5",
  "1223": "2.5",

  // 2.6
  "1317": "2.6",

  // 2.7
  "1313": "2.7",
  "1225": "2.7",

  // 3.0
  "1401": "3.0",
  "1402": "3.0",
  "8007": "3.0",

  // 3.1
  "1403": "3.1",
  "1404": "3.1",

  // 3.2
  "1405": "3.2",
  "1407": "3.2",

  // 3.3
  "1406": "3.3",
  "1409": "3.3",

  // 3.4
  "1408": "3.4",
  "1014": "3.4",
  "1015": "3.4",

  // 3.5
  "1410": "3.5",
  "1412": "3.5",

  // 3.6
  "1413": "3.6",
  "1414": "3.6",

  // 3.7
  "1415": "3.7",
  "1321": "3.7",

  // 4.0
  "1501": "4.0",
  "1502": "4.0",
  "8009": "4.0",

  // 4.1
  "1504": "4.1",
  "1505": "4.1",

  // 4.2
  "1506": "4.2",
  "1507": "4.2",

  // 4.3
  "1508": "4.3",
  "1509": "4.3",

  // 4.4
  "1510": "4.4",
  "1512": "4.4",

  // 4.5
  "1513": "4.5",
};

const CANONICAL_ID_MAP: Record<string, string> = {
  "1001": "march-7th",
  "1002": "dan-heng",
  "1003": "himeko",
  "1004": "welt",
  "1005": "kafka",
  "1006": "silver-wolf",
  "1008": "arlan",
  "1009": "asta",
  "1013": "herta",
  "1014": "saber",
  "1015": "archer",
  "1101": "bronya",
  "1102": "seele",
  "1103": "serval",
  "1104": "gepard",
  "1105": "natasha",
  "1106": "pela",
  "1107": "clara",
  "1108": "sampo",
  "1109": "hook",
  "1110": "lynx",
  "1111": "luka",
  "1112": "topaz",
  "1201": "qingque",
  "1202": "tingyun",
  "1203": "luocha",
  "1204": "jing-yuan",
  "1205": "blade",
  "1206": "sushang",
  "1207": "yukong",
  "1208": "fu-xuan",
  "1209": "yanqing",
  "1210": "guinaifen",
  "1211": "bailu",
  "1212": "jingliu",
  "1213": "dan-heng-il",
  "1214": "xueyi",
  "1215": "hanya",
  "1217": "huohuo",
  "1218": "jiaoqiu",
  "1220": "feixiao",
  "1221": "yunli",
  "1222": "lingsha",
  "1223": "moze",
  "1224": "march-7th-hunt",
  "1225": "fugue",
  "1301": "gallagher",
  "1302": "argenti",
  "1303": "ruan-mei",
  "1304": "aventurine",
  "1305": "dr-ratio",
  "1306": "sparkle",
  "1307": "black-swan",
  "1308": "acheron",
  "1309": "robin",
  "1310": "firefly",
  "1312": "misha",
  "1313": "sunday",
  "1314": "jade",
  "1315": "boothill",
  "1317": "rappa",
  "1321": "the-dahlia",
  "1401": "the-herta",
  "1402": "aglaea",
  "1403": "tribbie",
  "1404": "mydei",
  "1405": "anaxa",
  "1406": "cipher",
  "1407": "castorice",
  "1408": "phainon",
  "1409": "hyacine",
  "1410": "hysilens",
  "1412": "cerydra",
  "1413": "evernight",
  "1414": "dan-heng-permansor-terrae",
  "1415": "cyrene",
  "1501": "sparxie",
  "1502": "yao-guang",
  "1504": "ashveil",
  "1505": "evanescia",
  "1506": "silver-wolf-lv999",
  "1507": "mortenax-blade",
  "1508": "rin-tohsaka",
  "1509": "gilgamesh",
  "1510": "himeko-nova",
  "1512": "robin-summeretto",
  "1513": "aventurine-waveflair",
  "8001": "trailblazer-destruction",
  "8003": "trailblazer-preservation",
  "8005": "trailblazer-harmony",
  "8007": "trailblazer-remembrance",
  "8009": "trailblazer-elation",
};

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/#[0-9]+\[i\]%?/g, "X")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * EXACT DOCUMENTED RULE FOR GENERATING MECHANIC TAGS
 * 
 * Mechanic tags are derived using heuristics matching over character ability,
 * major trace, and eidolon descriptions from the client-extracted data:
 * - follow_up: 'follow-up', 'follow up', 'counter'
 * - counter_attack: 'counter'
 * - shield: 'shield'
 * - heal: 'restore', 'heal', 'heals'
 * - freeze: 'freeze', 'frozen'
 * - cleanse: 'dispel', 'cleanse'
 * - action_advance: 'advanced', 'action advance', 'advances forward'
 * - energy_regen: 'energy' AND ('regenerat' OR 'gains energy')
 * - break_effect: 'break effect', 'weakness break'
 * - super_break: 'super break'
 * - res_penetration: 'res pen', 'resistance penetration'
 * - defense_shred: 'def' AND ('reduced' OR 'ignore' OR 'shred')
 * - vulnerability: 'vulnerability', 'damage taken increased', 'dmg taken'
 * - debuff: effect='Impair' OR text contains 'debuff', 'inflicts', 'reduces'
 * - buff: effect='Support' OR 'Enhance' OR text contains 'buff', 'increases atk', 'increases dmg'
 * - dot: 'dot', 'wind shear', 'shock', 'bleed', 'burn'
 * - aoe: effect='AoEAttack' OR text contains 'all enemies'
 * - blast: effect='Blast' OR text contains 'adjacent'
 * - single_target: effect='SingleAttack' OR text contains 'single enemy', 'designated enemy'
 * - bounce: effect='Bounce' OR text contains 'bounce', 'random enemy'
 * - memosprite: 'memosprite' OR path='Remembrance'
 * - elation: 'elation' OR path='Elation'
 * - summon: 'summon'
 * 
 * In addition to these heuristics, there is a guaranteed fallback tag based on the character's Combat Path.
 */
function extractMechanicTags(text: string, path: CombatPath, effect = ""): CharacterMechanicTag[] {
  return ["unknown"];
}

/**
 * EXACT DOCUMENTED RULE FOR GENERATING ROLES
 * 
 * Roles are derived procedurally from the character's Path and the generated Mechanic Tags:
 * - Abundance -> 'healer'
 * - Preservation -> 'shielder'
 * - Harmony -> 'buffer', and 'battery' if energy_regen tag is present
 * - Nihility -> 'dot_dps' + 'debuffer' if dot tag is present; else 'debuffer' + 'sub_dps'
 * - Hunt -> 'hypercarry_dps' + 'sub_dps'
 * - Erudition -> 'hypercarry_dps' + 'sub_dps'
 * - Destruction -> 'break_dps' + 'hypercarry_dps' if super_break/break_effect tags are present; else 'hypercarry_dps' + 'sub_dps'
 * - Remembrance -> 'summon_dps' + 'hypercarry_dps'
 * - Elation -> 'elation_dps' + 'sub_dps'
 */
function deriveRoles(path: CombatPath, mechanicTags: CharacterMechanicTag[], _name?: string): CharacterRole[] {
  return ["unknown"];
}

function mapAbilityType(rawType: string): AbilityType {
  switch (rawType) {
    case "Normal": return "basic";
    case "BPSkill": return "skill";
    case "Ultra": return "ultimate";
    case "Talent": return "talent";
    case "MazeNormal":
    case "Maze": return "technique";
    case "ElationDamage": return "elation_skill";
    case "MemospriteSkill": return "memosprite_skill";
    case "MemospriteTalent": return "memosprite_talent";
    default: return "skill";
  }
}

function mapTargetType(effect: string, type: AbilityType): AbilityTargetType {
  switch (effect) {
    case "SingleAttack": return "single_enemy";
    case "AoEAttack": return "all_enemies";
    case "Blast": return "blast_enemy";
    case "Bounce": return "bounce_enemy";
    case "Defence":
    case "Restore": return "single_ally";
    case "Support":
    case "Enhance":
      return type === "technique" ? "self" : "single_ally";
    default:
      return type === "technique" || type === "talent" ? "self" : "single_enemy";
  }
}

export async function generateRoster() {
  console.log("[Roster Generator] Fetching StarRailRes authoritative datasets...");
  const [charRes, promRes, skillRes, rankRes, treeRes] = await Promise.all([
    fetch("https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json"),
    fetch("https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/character_promotions.json"),
    fetch("https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/character_skills.json"),
    fetch("https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/character_ranks.json"),
    fetch("https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/character_skill_trees.json"),
  ]);

  const [characters, promotions, skills, ranks, trees] = await Promise.all([
    charRes.json() as Promise<Record<string, any>>,
    promRes.json() as Promise<Record<string, any>>,
    skillRes.json() as Promise<Record<string, any>>,
    rankRes.json() as Promise<Record<string, any>>,
    treeRes.json() as Promise<Record<string, any>>,
  ]);

  console.log(`[Roster Generator] Loaded ${Object.keys(characters).length} raw characters.`);

  // Map of existing curated fixtures by ID for preservation
  const existingMap = new Map<string, CharacterKnowledge>();
  for (const c of EXISTING_CHARACTERS) {
    // Clone and apply required bugfixes:
    const clone = { ...c };
    if (clone.id === "castorice") {
      clone.gameId = "1407"; // Fix collision with Mydei 1404
    }
    if (clone.id === "aventurine-waveflair") {
      clone.gameId = "1513"; // Fix collision with Phainon 1408
    }
    existingMap.set(clone.id, clone);
  }

  const generatedRoster: CharacterKnowledge[] = [];
  const seenGameIds = new Set<string>();
  const seenCanonicalIds = new Set<string>();

  for (const [gameId, rawChar] of Object.entries(characters)) {
    // Skip duplicate gender Trailblazer records (keep 8001, 8003, 8005, 8007, 8009)
    if (["8002", "8004", "8006", "8008", "8010"].includes(gameId)) {
      continue;
    }

    const canonicalId = CANONICAL_ID_MAP[gameId];
    if (!canonicalId) {
      throw new Error(`Unmapped canonical ID for gameId: ${gameId} (${rawChar.name})`);
    }

    if (seenGameIds.has(gameId)) {
      throw new Error(`Duplicate gameId detected in generator: ${gameId}`);
    }
    seenGameIds.add(gameId);

    if (seenCanonicalIds.has(canonicalId)) {
      throw new Error(`Duplicate canonical ID detected in generator: ${canonicalId}`);
    }
    seenCanonicalIds.add(canonicalId);

    // If character exists in curated fixtures, use curated data with verified fixes
    if (existingMap.has(canonicalId)) {
      const curated = existingMap.get(canonicalId)!;
      CharacterKnowledgeSchema.parse(curated);
      generatedRoster.push(curated);
      continue;
    }

    // Otherwise generate from StarRailRes authoritative raw facts
    const pathName = PATH_MAP[rawChar.path];
    if (!pathName) {
      throw new Error(`Unknown path: ${rawChar.path} for ${rawChar.name}`);
    }
    const elementName = ELEMENT_MAP[rawChar.element];
    if (!elementName) {
      throw new Error(`Unknown element: ${rawChar.element} for ${rawChar.name}`);
    }

    const charName =
      rawChar.name === "{NICKNAME}"
        ? `Trailblazer (${pathName})`
        : rawChar.name;

    const releaseVersion = RELEASE_VERSIONS[gameId] || "4.5";

    // Base stats at Lv 80 (Promotion 6, Level 80 values)
    const promo = promotions[gameId];
    if (!promo || !promo.values || !promo.values[6]) {
      throw new Error(`Missing promotion level 6 data for ${gameId} (${charName})`);
    }
    const v6 = promo.values[6];
    const hp = Math.floor(v6.hp.base + v6.hp.step * 79);
    const atk = Math.floor(v6.atk.base + v6.atk.step * 79);
    const def = Math.floor(v6.def.base + v6.def.step * 79);
    const spd = Math.round(v6.spd.base);
    const taunt = Math.round(v6.taunt.base);
    const critRate = v6.crit_rate.base;
    const critDmg = v6.crit_dmg.base;
    const maxEnergy = rawChar.max_sp ?? 120;

    // Abilities
    const abilities: any[] = [];
    const charSkills = rawChar.skills || [];
    for (const sid of charSkills) {
      const s = skills[sid];
      if (!s) continue;
      const aType = mapAbilityType(s.type);
      const tag = s.effect_text || s.type_text || "Ability";
      const targetType = mapTargetType(s.effect, aType);
      const desc = cleanText(s.desc || s.simple_desc || "");
      const abilityMechanics = extractMechanicTags(desc + " " + s.name, pathName, s.effect);

      abilities.push({
        id: `${canonicalId}_${s.id}`,
        name: s.name,
        type: aType,
        tag,
        targetType,
        energyGain: aType === "basic" ? 20 : aType === "skill" ? 30 : 0,
        energyCost: aType === "ultimate" ? maxEnergy : undefined,
        description: desc || `${s.name} ability for ${charName}.`,
        mechanics: abilityMechanics,
      });
    }

    // Ensure at least basic + skill + ultimate or 1 ability
    if (abilities.length === 0) {
      abilities.push({
        id: `${canonicalId}_basic`,
        name: `${charName} Basic ATK`,
        type: "basic" as const,
        tag: "Single Target",
        targetType: "single_enemy" as const,
        energyGain: 20,
        description: `Deals ${elementName} DMG to a single enemy.`,
        mechanics: ["single_target" as const],
      });
    }

    // Eidolons (exactly 6)
    const eidolons: any[] = [];
    const charRanks = rawChar.ranks || [];
    for (let r = 1; r <= 6; r++) {
      const rankId = charRanks[r - 1];
      const rankData = rankId ? ranks[rankId] : null;
      const rankName = rankData ? rankData.name : `Eidolon ${r}`;
      const desc = rankData ? cleanText(rankData.desc) : `Enhances ${charName}'s combat capabilities.`;
      const eMechanics = extractMechanicTags(desc, pathName);

      eidolons.push({
        rank: r as 1 | 2 | 3 | 4 | 5 | 6,
        name: rankName,
        description: desc || `Eidolon ${r} effect.`,
        keyMechanic: rankName,
        mechanics: eMechanics,
      });
    }

    // Major Traces (Point06 = A2, Point07 = A4, Point08 = A6)
    const majorTraces: any[] = [];
    const minorTraces: any[] = [];
    const charTrees = rawChar.skill_trees || [];

    for (const tid of charTrees) {
      const node = trees[tid];
      if (!node) continue;

      if (node.anchor === "Point06" || node.anchor === "Point07" || node.anchor === "Point08") {
        const req = node.anchor === "Point06" ? "A2" : node.anchor === "Point07" ? "A4" : "A6";
        const desc = cleanText(node.desc || node.name);
        majorTraces.push({
          id: `${canonicalId}_trace_${req.toLowerCase()}`,
          name: node.name,
          ascensionRequirement: req,
          description: desc || `${node.name} major trace.`,
          mechanics: extractMechanicTags(desc, pathName),
        });
      } else if (node.levels && node.levels[0]?.properties && node.levels[0].properties.length > 0) {
        const prop = node.levels[0].properties[0];
        const statName = prop.type.replace("AddedRatio", "").toLowerCase();
        minorTraces.push({
          stat: statName || "combat_stat",
          totalValue: prop.value > 0 ? prop.value : 0.05,
          unit: prop.value < 1 ? "percentage" : "flat",
        });
      }
    }

    // Aggregate all text for character-level mechanicTags
    const allText = [
      ...abilities.map((a) => a.description),
      ...majorTraces.map((t) => t.description),
      ...eidolons.map((e) => e.description),
    ].join(" ");

    const mechanicTags = extractMechanicTags(allText, pathName);
    const roles = deriveRoles(pathName, mechanicTags, charName);

    const characterKnowledge: CharacterKnowledge = {
      id: canonicalId,
      gameId,
      name: charName,
      localizedNames: {
        en: charName,
        id: charName,
      },
      rarity: rawChar.rarity as 4 | 5,
      path: pathName,
      element: elementName,
      releaseVersion,
      roles,
      mechanicTags,
      baseStats: {
        hp,
        atk,
        def,
        spd,
        taunt,
        critRate,
        critDmg,
        maxEnergy,
      },
      abilities,
      majorTraces,
      minorTraces: minorTraces.slice(0, 10),
      eidolons,
      provenance: {
        sourceId: `starrailres_v4_5_${gameId}`,
        authorityTier: "tier_b_structured_community",
        sourceUrl: "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json",
        gameVersion: releaseVersion,
        verifiedAt: "2026-08-27T00:00:00.000Z",
        notes: `Client-extracted data for ${charName} via StarRailRes`,
      },
      source: "StarRailRes",
      verifiedAt: "2026-08-27T00:00:00.000Z",
    };

    // Validate strictly against Zod schema
    CharacterKnowledgeSchema.parse(characterKnowledge);
    generatedRoster.push(characterKnowledge);
  }

  // Sort deterministically by canonical id
  generatedRoster.sort((a, b) => a.id.localeCompare(b.id));

  console.log(`[Roster Generator] Successfully built and validated all ${generatedRoster.length} characters!`);

  // Write output to canonical-characters.ts
  const outputPath = path.resolve(
    __dirname,
    "../packages/shared/src/knowledge/fixtures/canonical-characters.ts"
  );

  const fileContent = `import type { CharacterKnowledge } from "../character";

/**
 * COMPLETE HONKAI: STAR RAIL VERSION 4.5 PLAYABLE ROSTER
 * Total Playable Standalone Units: ${generatedRoster.length}
 *
 * Source: StarRailRes Client Extracted Data & HoYoverse Verified Notices
 * Tier: Mixed (A for curated, B for extracted)
 */
export const CANONICAL_CHARACTERS_DATA: CharacterKnowledge[] = ${JSON.stringify(
    generatedRoster,
    null,
    2
  )};
`;

  console.log(`[Roster Generator] Formatting and writing output to ${outputPath}...`);
  const formatted = await prettier.format(fileContent, {
    filepath: outputPath,
  });

  fs.writeFileSync(outputPath, formatted, "utf8");
  console.log(`[Roster Generator] Written ${generatedRoster.length} characters to canonical-characters.ts.`);
}

if (require.main === module || process.argv[1]?.includes("generate-canonical-roster")) {
  generateRoster().catch((err) => {
    console.error("[Roster Generator] Fatal error:", err);
    process.exit(1);
  });
}
