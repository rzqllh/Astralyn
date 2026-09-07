import type {
  CharacterMechanicTag,
  CharacterRole,
} from "../character";
import type { FactProvenance } from "../provenance";

export interface CharacterTaxonomyEnrichment {
  characterId: string;
  roles: CharacterRole[];
  mechanicTags: CharacterMechanicTag[];
  evidence: string;
  provenance: FactProvenance;
}

const verified = (
  characterId: string,
  entryPageId: string,
  roles: CharacterRole[],
  mechanicTags: CharacterMechanicTag[],
  evidence: string
): CharacterTaxonomyEnrichment => ({
  characterId,
  roles,
  mechanicTags,
  evidence,
  provenance: {
    sourceId: `hoyowiki_character_${entryPageId}`,
    authorityTier: "tier_a_official",
    sourceUrl: `https://wiki.hoyolab.com/pc/hsr/entry/${entryPageId}`,
    gameVersion: "4.5",
    verifiedAt: "2026-09-07T00:00:00.000Z",
    notes:
      "Astralyn role and mechanic-tag taxonomy is derived from official kit facts; neither label set is a HoYoverse classification.",
  },
});

export const LAUNCH_AND_1X_TAXONOMY: CharacterTaxonomyEnrichment[] = [
  verified(
    "argenti",
    "1535",
    ["hypercarry_dps"],
    ["energy_regen", "aoe", "bounce"],
    "His offensive kit centers on AoE Skills and two Energy-cost Ultimate states; the enhanced Ultimate adds random extra hits, while Talent and Trace effects restore Energy."
  ),
  verified(
    "arlan",
    "11",
    ["hypercarry_dps"],
    ["hp_consumption", "single_target", "blast", "aoe"],
    "Skill spends Arlan's HP for single-target damage, Talent increases his own damage as HP falls, Ultimate is Blast, and Technique hits all enemies."
  ),
  verified(
    "asta",
    "12",
    ["buffer"],
    ["buff", "bounce"],
    "Charging stacks raise all allies' ATK, Ultimate raises all allies' SPD, and Skill is a Bounce attack."
  ),
  verified(
    "bailu",
    "29",
    ["healer"],
    ["heal", "bounce", "aoe"],
    "Skill heals and then bounces between allies; Ultimate heals all allies and applies Invigoration."
  ),
  verified(
    "blade",
    "789",
    ["hypercarry_dps"],
    ["hp_consumption", "enhanced_basic", "follow_up", "heal", "blast", "aoe"],
    "Skill consumes HP and enhances Basic ATK, Talent launches an AoE follow-up after HP-loss charges, and Ultimate both sets HP and deals Blast damage."
  ),
  verified(
    "bronya",
    "14",
    ["buffer"],
    ["buff", "action_advance", "cleanse"],
    "Skill dispels one ally debuff, advances that ally by 100%, and increases damage; Ultimate buffs all allies' ATK and CRIT DMG."
  ),
  verified(
    "clara",
    "20",
    ["hypercarry_dps", "sub_dps"],
    ["counter_attack", "follow_up", "blast", "aoe"],
    "Svarog counters attackers with follow-up damage, enhanced counters hit adjacent targets, and Skill attacks all enemies marked by counters."
  ),
  verified(
    "dan-heng",
    "8",
    ["hypercarry_dps", "debuffer"],
    ["debuff", "single_target"],
    "His attacks are single-target, and Skill can inflict Slow, which Ultimate explicitly exploits for increased damage."
  ),
  verified(
    "dan-heng-il",
    "1226",
    ["hypercarry_dps"],
    ["enhanced_basic", "special_resource_cost", "single_target", "blast", "aoe"],
    "Skill enhances Basic ATK through three stages, expanding it from single-target to Blast; Ultimate is AoE and grants Squama Sacrosancta for enhancement costs."
  ),
  verified(
    "dr-ratio",
    "1639",
    ["hypercarry_dps"],
    ["follow_up", "debuff", "single_target"],
    "Skill and Ultimate are single-target, Talent launches a follow-up whose chance scales with target debuffs, and Technique applies an enemy SPD reduction."
  ),
  verified(
    "fu-xuan",
    "804",
    ["buffer", "healer"],
    ["buff", "heal", "stat_conversion", "aoe"],
    "Matrix of Prescience distributes ally damage and raises Max HP and CRIT Rate; her Trace makes Ultimate heal all allies, and her damage scales from Max HP."
  ),
  verified(
    "gepard",
    "17",
    ["shielder", "debuffer"],
    ["shield", "freeze", "debuff", "aoe"],
    "Ultimate shields all allies, while Skill can Freeze one enemy and Technique grants a team-wide Shield."
  ),
  verified(
    "guinaifen",
    "1392",
    ["dot_dps", "debuffer"],
    ["dot", "debuff", "vulnerability", "blast", "aoe"],
    "Basic and Skill can inflict Burn DoT, Ultimate triggers existing Burn, and Firekiss increases damage received by affected enemies."
  ),
  verified(
    "hanya",
    "1537",
    ["buffer"],
    ["buff", "single_target"],
    "Burden lets allies recover Skill Points and increases damage dealt to its target; Ultimate increases one ally's SPD and ATK."
  ),
  verified(
    "herta",
    "13",
    ["sub_dps"],
    ["follow_up", "aoe"],
    "When enemy HP crosses the Talent threshold, Herta launches an AoE follow-up; Skill and Ultimate also damage all enemies."
  ),
  verified(
    "himeko",
    "9",
    ["sub_dps"],
    ["follow_up", "dot", "blast", "aoe"],
    "Weakness Break charges trigger an AoE follow-up, Skill deals Blast damage, Ultimate is AoE, and a major Trace can inflict Burn DoT."
  ),
  verified(
    "hook",
    "22",
    ["hypercarry_dps", "dot_dps"],
    ["dot", "enhanced_skill", "single_target", "blast", "aoe"],
    "Skill inflicts Burn and deals extra damage to Burning targets; Ultimate enhances the next Skill from single-target to Blast, while Technique is AoE."
  ),
  verified(
    "huohuo",
    "1533",
    ["healer", "battery", "buffer"],
    ["heal", "cleanse", "energy_regen", "buff"],
    "Skill and Talent heal and dispel debuffs; Ultimate restores allies' Energy and increases their ATK."
  ),
  verified(
    "jing-yuan",
    "26",
    ["summon_dps", "hypercarry_dps"],
    ["summon", "follow_up", "bounce", "aoe"],
    "Lightning-Lord is a separately ordered summoned unit whose action is a Bounce follow-up; Jing Yuan's Skill and Ultimate are AoE."
  ),
  verified(
    "jingliu",
    "1387",
    ["hypercarry_dps"],
    ["hp_consumption", "enhanced_skill", "action_advance", "stat_conversion", "blast", "aoe"],
    "Syzygy triggers 100% action advance and an enhanced state; enhanced Skill consumes ally HP and converts it to ATK before dealing Blast damage."
  ),
  verified(
    "kafka",
    "791",
    ["dot_dps", "hypercarry_dps"],
    ["dot", "follow_up", "single_target", "blast", "aoe"],
    "Skill and Ultimate immediately trigger existing DoT, Ultimate inflicts Shock, and Talent launches a single-target follow-up."
  ),
  verified(
    "luka",
    "801",
    ["dot_dps", "debuffer"],
    ["dot", "debuff", "vulnerability", "enhanced_basic", "single_target"],
    "Skill inflicts Bleed DoT, Ultimate increases one enemy's damage taken, and Fighting Will enables an enhanced Basic that triggers Bleed."
  ),
  verified(
    "luocha",
    "711",
    ["healer"],
    ["heal", "cleanse", "aoe"],
    "Skill and its emergency trigger heal allies and can dispel a debuff; the Field heals allies after attacks, while Ultimate attacks all enemies."
  ),
  verified(
    "lynx",
    "1228",
    ["healer"],
    ["heal", "cleanse", "aoe"],
    "Skill supplies immediate and continuous healing; Ultimate dispels a debuff from and heals every ally."
  ),
  verified(
    "march-7th",
    "7",
    ["shielder", "sub_dps", "debuffer"],
    ["shield", "follow_up", "counter_attack", "freeze", "cleanse", "single_target", "aoe"],
    "Skill shields and can cleanse one ally, Talent counters attacks on shielded allies as follow-ups, and Ultimate is AoE with a Freeze chance."
  ),
  verified(
    "natasha",
    "18",
    ["healer"],
    ["heal", "cleanse", "aoe"],
    "Skill heals one ally over time and can dispel a debuff; Ultimate heals all allies."
  ),
  verified(
    "pela",
    "19",
    ["debuffer"],
    ["debuff", "defense_shred", "single_target", "aoe"],
    "Skill dispels an enemy buff, and AoE Ultimate applies Exposed to reduce every enemy's DEF."
  ),
  verified(
    "qingque",
    "24",
    ["hypercarry_dps"],
    ["enhanced_basic", "single_target", "blast", "aoe"],
    "Skill draws tiles and buffs damage until four matching tiles enhance Basic ATK into Blast damage; Ultimate attacks all enemies."
  ),
  verified(
    "ruan-mei",
    "1638",
    ["buffer"],
    ["buff", "break_effect", "weakness_break_efficiency", "res_penetration"],
    "Skill increases allies' damage and Weakness Break Efficiency; Ultimate grants All-Type RES PEN, and Talent/Traces buff SPD and Break Effect."
  ),
  verified(
    "sampo",
    "21",
    ["dot_dps", "debuffer"],
    ["dot", "debuff", "vulnerability", "bounce", "aoe"],
    "Talent inflicts Wind Shear DoT, Skill is Bounce, and AoE Ultimate increases enemies' DoT received."
  ),
  verified(
    "seele",
    "15",
    ["hypercarry_dps"],
    ["action_advance", "single_target"],
    "All attacks are single-target, and defeating an enemy grants an immediate extra action through Resurgence."
  ),
  verified(
    "serval",
    "16",
    ["dot_dps", "sub_dps"],
    ["dot", "blast", "aoe"],
    "Blast Skill inflicts Shock DoT, Talent adds damage against Shocked enemies, and Ultimate is AoE and extends Shock."
  ),
  verified(
    "silver-wolf",
    "710",
    ["debuffer"],
    ["debuff", "defense_shred", "res_penetration", "single_target"],
    "Single-target Skill implants a Weakness and reduces the matching RES, Talent applies stat-reducing Bugs, and Ultimate reduces DEF."
  ),
  verified(
    "sushang",
    "27",
    ["hypercarry_dps"],
    ["action_advance", "single_target"],
    "Her attacks focus one target, gain extra Sword Stance damage against Weakness Broken enemies, and Ultimate advances her action by 100%."
  ),
  verified(
    "topaz",
    "1389",
    ["summon_dps", "sub_dps", "debuffer"],
    ["summon", "follow_up", "vulnerability", "single_target"],
    "Numby is a summoned unit with a follow-up action, while Proof of Debt increases follow-up damage received by one target."
  ),
  verified(
    "welt",
    "10",
    ["debuffer", "sub_dps"],
    ["debuff", "vulnerability", "bounce", "aoe"],
    "Bounce Skill can Slow, AoE Ultimate Imprisons and delays enemies, and a major Trace increases damage taken by affected targets."
  ),
  verified(
    "xueyi",
    "1640",
    ["break_dps", "sub_dps"],
    ["break_effect", "stat_conversion", "follow_up", "toughness_reduction", "single_target", "blast"],
    "Ultimate ignores Weakness Type for Toughness reduction, Karma triggers a follow-up, and a major Trace converts Break Effect into damage."
  ),
  verified(
    "yanqing",
    "28",
    ["hypercarry_dps"],
    ["follow_up", "freeze", "buff", "single_target"],
    "Soulsteel Sync buffs Yanqing and can trigger a single-target follow-up with a Freeze chance; all active attacks focus one enemy."
  ),
  verified(
    "yukong",
    "712",
    ["buffer", "sub_dps"],
    ["buff", "single_target", "aoe"],
    "Roaring Bowstrings raises allies' ATK, Ultimate adds CRIT buffs and single-target damage, and Technique can attack all enemies on entry."
  ),
];

export const VERSION_2X_TAXONOMY: CharacterTaxonomyEnrichment[] = [
  verified(
    "black-swan",
    "1806",
    ["dot_dps", "debuffer"],
    ["dot", "debuff", "defense_shred", "vulnerability", "blast", "aoe"],
    "Arcana is stacking Wind DoT, Skill reduces DEF in a Blast area, and Ultimate makes all enemies take more damage during their turns."
  ),
  verified(
    "boothill",
    "2367",
    ["break_dps", "hypercarry_dps"],
    ["break_effect", "weakness_break_efficiency", "toughness_reduction", "stat_conversion", "enhanced_basic", "debuff", "vulnerability", "single_target"],
    "Pocket Trickshot enhances Basic Toughness reduction and deals Physical Break DMG; Skill creates Standoff with increased damage taken, and a Trace converts Break Effect to CRIT stats."
  ),
  verified(
    "feixiao",
    "2947",
    ["hypercarry_dps"],
    ["follow_up", "weakness_break_efficiency", "toughness_reduction", "special_resource_cost", "single_target"],
    "Ally attacks build Flying Aureus for Ultimate, Talent and Skill launch follow-ups, and Ultimate ignores Weakness Type with increased Break Efficiency."
  ),
  verified(
    "fugue",
    "3151",
    ["buffer", "debuffer"],
    ["break_effect", "super_break", "toughness_reduction", "defense_shred", "debuff", "buff", "enhanced_basic", "blast", "aoe"],
    "Foxian Prayer raises Break Effect, enables off-Type Toughness reduction, and makes Fugue's enhanced Basic reduce DEF; Talent adds Exo-Toughness and Super Break."
  ),
  verified(
    "jade",
    "2495",
    ["sub_dps", "buffer"],
    ["follow_up", "hp_consumption", "buff", "action_advance", "blast", "aoe"],
    "Debt Collector gains SPD and causes Jade's extra damage while paying HP; enemy hits charge Jade's AoE follow-up, and a Trace advances her action."
  ),
  verified(
    "jiaoqiu",
    "2643",
    ["debuffer", "dot_dps"],
    ["dot", "debuff", "vulnerability", "single_target", "blast", "aoe"],
    "Ashen Roast increases damage received and is treated as Burn DoT; Ultimate applies it across an AoE and further increases Ultimate damage received."
  ),
  verified(
    "lingsha",
    "2948",
    ["healer", "break_dps", "sub_dps"],
    ["heal", "cleanse", "summon", "follow_up", "break_effect", "vulnerability", "action_advance", "aoe", "bounce"],
    "Skill summons Fuyuan and heals all allies; Fuyuan performs AoE/Bounce follow-ups with cleanse and healing, while Ultimate increases Break DMG received and advances Fuyuan."
  ),
  verified(
    "march-7th-hunt",
    "2657",
    ["sub_dps", "buffer"],
    ["enhanced_basic", "buff", "action_advance", "toughness_reduction", "single_target"],
    "Skill designates and buffs Shifu, Shifu actions charge an immediate enhanced Basic turn, and March can reduce Toughness using Shifu's element."
  ),
  verified(
    "misha",
    "1808",
    ["hypercarry_dps", "debuffer"],
    ["freeze", "energy_regen", "single_target", "blast", "bounce"],
    "Skill builds Ultimate hits, ally Skill Point use adds hits and restores Energy, and Bounce Ultimate has repeated Freeze chances."
  ),
  verified(
    "moze",
    "2949",
    ["sub_dps", "debuffer"],
    ["follow_up", "vulnerability", "action_advance", "single_target"],
    "Prey marks one enemy, ally attacks charge Moze's follow-up, a Trace increases follow-up damage taken by Prey, and leaving Departed advances Moze."
  ),
  verified(
    "rappa",
    "3057",
    ["break_dps", "hypercarry_dps"],
    ["break_effect", "super_break", "weakness_break_efficiency", "toughness_reduction", "enhanced_basic", "blast", "aoe"],
    "Ultimate raises Break stats and enables enhanced Basic, Talent deals Break DMG with off-Type Toughness reduction, and a Trace converts it to Super Break."
  ),
  verified(
    "sparkle",
    "1807",
    ["buffer"],
    ["buff", "action_advance"],
    "Skill raises one ally's CRIT DMG and advances them, while Talent and Ultimate raise team damage and expand/recover Skill Points."
  ),
  verified(
    "sunday",
    "3150",
    ["buffer", "battery"],
    ["energy_regen", "buff", "action_advance", "cleanse", "single_target"],
    "Skill advances an ally and their summon, dispels a debuff, and buffs damage; Ultimate restores that ally's Energy and buffs CRIT DMG."
  ),
  verified(
    "yunli",
    "2642",
    ["hypercarry_dps", "sub_dps"],
    ["counter_attack", "follow_up", "heal", "energy_regen", "blast", "aoe"],
    "Being attacked restores Energy and triggers Blast counters; Ultimate strengthens the next counter, while Skill restores Yunli's HP."
  ),
];

export const VERSION_3X_TAXONOMY: CharacterTaxonomyEnrichment[] = [
  verified(
    "aglaea",
    "3286",
    ["summon_dps", "hypercarry_dps"],
    ["memosprite", "summon", "action_advance", "enhanced_basic", "stat_conversion", "energy_regen", "blast", "aoe"],
    "Skill summons Garmentmaker, Ultimate advances Aglaea into an enhanced Basic stance, and Garmentmaker has ordered actions, SPD stacks, and Blast attacks."
  ),
  verified(
    "anaxa",
    "3561",
    ["hypercarry_dps", "debuffer"],
    ["debuff", "energy_regen", "single_target", "bounce", "aoe"],
    "Hits implant Weaknesses, five Weaknesses expose a target to extra damage and an extra Skill, Ultimate applies all Weaknesses in AoE, and Skill Bounces."
  ),
  verified(
    "archer",
    "3768",
    ["hypercarry_dps"],
    ["follow_up", "special_resource_cost", "single_target", "aoe"],
    "Repeated single-target Skills form his main turn, ally attacks consume Charge for follow-ups, and Technique provides an AoE entry attack."
  ),
  verified(
    "cerydra",
    "3886",
    ["buffer", "sub_dps"],
    ["buff", "cleanse", "stat_conversion", "enhanced_skill", "single_target", "aoe"],
    "Military Merit scales an ally's ATK from Cerydra's ATK, Peerage raises CRIT DMG and repeats the ally's Skill as Coup de Main, and promotion cleanses crowd control."
  ),
  verified(
    "cipher",
    "3691",
    ["sub_dps", "debuffer"],
    ["follow_up", "debuff", "vulnerability", "single_target", "blast"],
    "Patron records ally damage for Cipher's follow-up and Ultimate, Skill weakens targets, and a Trace increases all enemies' damage received."
  ),
  verified(
    "cyrene",
    "4003",
    ["buffer", "summon_dps"],
    ["memosprite", "summon", "buff", "cleanse", "action_advance", "enhanced_basic", "single_target", "aoe"],
    "Ultimate summons and advances Demiurge while activating ally Ultimates; Skill adds team True DMG, Talent cleanses Cyrene, and Demiurge buffs allies."
  ),
  verified(
    "dan-heng-permansor-terrae",
    "3957",
    ["shielder", "buffer", "sub_dps"],
    ["shield", "summon", "follow_up", "cleanse", "buff", "action_advance", "single_target", "aoe"],
    "Skill and Ultimate shield all allies, Bondmate gains ATK, and summoned Souldragon cleanses, refreshes Shields, advances, and later performs an AoE follow-up."
  ),
  verified(
    "evernight",
    "3956",
    ["summon_dps", "buffer", "debuffer"],
    ["memosprite", "summon", "hp_consumption", "buff", "vulnerability", "action_advance", "energy_regen", "single_target", "aoe"],
    "Skill spends HP to summon Evey and buff memosprite CRIT DMG; Memoria advances Evey, Ultimate increases enemy damage received, and Evey has single-target/AoE skills."
  ),
  verified(
    "hyacine",
    "3688",
    ["healer", "summon_dps"],
    ["memosprite", "summon", "heal", "cleanse", "hp_consumption", "action_advance", "aoe"],
    "Skill and Ultimate summon Little Ica and heal all allies, a Trace cleanses all allies, and Little Ica spends HP on reactive healing before AoE damage."
  ),
  verified(
    "hysilens",
    "3885",
    ["dot_dps", "debuffer"],
    ["dot", "debuff", "defense_shred", "vulnerability", "aoe"],
    "Talent applies four named DoTs, Skill raises all enemies' damage taken, and Ultimate's Zone reduces DEF and repeatedly deals Physical DoT."
  ),
  verified(
    "mydei",
    "3324",
    ["hypercarry_dps"],
    ["hp_consumption", "special_resource_cost", "action_advance", "enhanced_skill", "heal", "single_target", "blast", "aoe"],
    "Skill consumes HP, HP loss builds Charge, and Charge advances Mydei into Vendetta with enhanced automatic Skills; Ultimate and state entry restore HP."
  ),
  verified(
    "phainon",
    "3769",
    ["hypercarry_dps"],
    ["special_resource_cost", "action_advance", "enhanced_basic", "enhanced_skill", "energy_regen", "single_target", "blast", "aoe"],
    "Coreflame unlocks a solo transformation with extra turns and enhanced attacks; Technique restores team Energy, and the transformed kit spans Blast and AoE."
  ),
  verified(
    "saber",
    "3767",
    ["hypercarry_dps"],
    ["special_resource_cost", "energy_regen", "enhanced_basic", "action_advance", "single_target", "blast", "aoe", "bounce"],
    "Core Resonance restores Energy, Ultimate enables an enhanced Basic, Skill is Blast, Ultimate is AoE with extra random hits, and a Trace can advance Saber."
  ),
  verified(
    "the-dahlia",
    "4060",
    ["buffer", "debuffer", "break_dps"],
    ["super_break", "break_effect", "weakness_break_efficiency", "toughness_reduction", "defense_shred", "follow_up", "buff", "debuff", "aoe", "bounce"],
    "Skill raises team Break Efficiency and enables Super Break conversion, Ultimate reduces DEF and implants Weaknesses, and Dance Partners trigger Toughness-based follow-ups."
  ),
  verified(
    "tribbie",
    "3322",
    ["buffer", "sub_dps", "debuffer"],
    ["buff", "res_penetration", "vulnerability", "follow_up", "blast", "aoe"],
    "Skill grants team All-Type RES PEN, Ultimate increases enemy damage taken and adds damage after ally attacks, and ally Ultimates trigger Tribbie's AoE follow-up."
  ),
];

export const VERSION_4X_AND_ALTERNATE_TAXONOMY: CharacterTaxonomyEnrichment[] = [
  verified(
    "ashveil",
    "4781",
    ["sub_dps", "buffer", "debuffer"],
    ["follow_up", "buff", "debuff", "defense_shred", "single_target", "aoe"],
    "Bait causes ally attacks to trigger Ashveil's follow-ups, lowers all enemies' DEF, and a Trace raises allies' follow-up CRIT DMG."
  ),
  verified(
    "evanescia",
    "5005",
    ["elation_dps", "sub_dps", "debuffer"],
    ["elation", "punchline", "follow_up", "special_resource_cost", "vulnerability", "single_target", "blast", "aoe", "bounce"],
    "Certified Banger and Energy fuel Master Fox follow-ups, Skill grants Punchline, Ultimate Bounces, Elation Skill is AoE, and a Trace applies Vulnerability."
  ),
  verified(
    "gilgamesh",
    "5338",
    ["hypercarry_dps", "buffer"],
    ["buff", "energy_regen", "single_target", "blast", "aoe", "bounce"],
    "Ally Ultimates build Interest and restore Gilgamesh's Energy, a Trace buffs all allies' ATK/CRIT DMG, and his attacks cover Blast plus AoE random hits."
  ),
  verified(
    "himeko-nova",
    "5335",
    ["buffer", "summon_dps", "sub_dps"],
    ["summon", "buff", "res_penetration", "toughness_reduction", "action_advance", "energy_regen", "single_target", "aoe", "bounce"],
    "Talent summons Starblazer and grants ally Assist Skills, Skill buffs ally damage, an Assist Trace grants extra turns, and Starblazer ignores Weakness for Toughness reduction."
  ),
  verified(
    "mortenax-blade",
    "5217",
    ["hypercarry_dps", "buffer", "debuffer"],
    ["hp_consumption", "defense_shred", "vulnerability", "debuff", "buff", "enhanced_basic", "follow_up", "energy_regen", "cleanse", "single_target", "aoe", "bounce"],
    "Ultimate spends HP, reduces all enemies' DEF and increases damage received while its Zone buffs allies; Charge unlocks a follow-up Skill, and the stance enhances Basic ATK while unlocking Skill."
  ),
  verified(
    "rin-tohsaka",
    "5339",
    ["hypercarry_dps", "buffer", "debuffer"],
    ["special_resource_cost", "vulnerability", "buff", "enhanced_skill", "res_penetration", "single_target", "aoe", "bounce"],
    "Gem Energy enables a repeating enhanced Bounce Skill, Skill Point changes buff ally CRIT DMG, Ultimate raises enemy damage taken, and a Trace grants RES PEN."
  ),
  verified(
    "robin-summeretto",
    "6565",
    ["buffer", "summon_dps", "battery"],
    ["memosprite", "summon", "buff", "action_advance", "energy_regen", "stat_conversion", "heal", "single_target", "aoe"],
    "Skill summons Summer Songbirds, Ultimate advances and restores an ally's Energy, the memosprite attacks in AoE, and Vibes convert Robin's Max HP into ally buffs."
  ),
  verified(
    "silver-wolf-lv999",
    "4997",
    ["elation_dps"],
    ["elation", "punchline", "special_resource_cost", "action_advance", "single_target", "aoe", "bounce"],
    "Punchline and Hidden MMR drive Elation effects, Ultimate advances her into Godmode, and her enhanced Basic/Elation attacks use many random hits."
  ),
  verified(
    "sparxie",
    "4737",
    ["elation_dps", "buffer"],
    ["elation", "punchline", "special_resource_cost", "buff", "enhanced_basic", "single_target", "blast", "aoe", "bounce"],
    "Livestream enhances Basic ATK, Ultimate and Elation Skill use Punchline/Elation with random hits, and a Trace buffs all allies' CRIT DMG from Punchline."
  ),
  verified(
    "yao-guang",
    "4736",
    ["buffer", "elation_dps", "debuffer"],
    ["elation", "punchline", "buff", "res_penetration", "vulnerability", "blast", "aoe", "bounce"],
    "Her Zone buffs ally Elation, Ultimate grants All-Type RES PEN, and Elation Skill applies increased damage taken before AoE/random-hit damage."
  ),
];

export const TRAILBLAZER_TAXONOMY: CharacterTaxonomyEnrichment[] = [
  verified(
    "trailblazer-destruction",
    "6",
    ["hypercarry_dps"],
    ["enhanced_basic", "enhanced_skill", "single_target", "blast", "aoe"],
    "Technique heals the party, Skill is Blast, and Ultimate selects an enhanced single-target Basic or enhanced Blast Skill."
  ),
  verified(
    "trailblazer-elation",
    "5006",
    ["buffer", "elation_dps"],
    ["elation", "punchline", "buff", "cleanse", "energy_regen", "single_target", "aoe", "bounce"],
    "Attacks build Punchline and Energy, Ultimate cleanses and buffs an ally before triggering their Elation Skill, and Trailblazer's own Elation Skill is multi-hit AoE."
  ),
  verified(
    "trailblazer-harmony",
    "2511",
    ["buffer", "break_dps"],
    ["break_effect", "super_break", "toughness_reduction", "buff", "single_target", "bounce"],
    "Ultimate buffs team Break Effect and converts attacks against broken enemies into Super Break; Skill Bounces and a Trace raises its Toughness reduction."
  ),
  verified(
    "trailblazer-preservation",
    "23",
    ["shielder", "debuffer"],
    ["shield", "debuff", "enhanced_basic", "single_target", "blast", "aoe"],
    "Skill Taunts all enemies and reduces damage, each action grants ally Shields, Magma Will enhances Basic into Blast, and Ultimate is AoE."
  ),
  verified(
    "trailblazer-remembrance",
    "3287",
    ["buffer", "summon_dps"],
    ["memosprite", "summon", "buff", "action_advance", "cleanse", "enhanced_basic", "single_target", "aoe", "bounce"],
    "Skill summons Mem, Mem buffs team CRIT DMG and advances a chosen ally with True DMG support, while Ultimate and the enhanced joint Basic deal AoE damage."
  ),
];

export const CHARACTER_TAXONOMY_ENRICHMENTS: CharacterTaxonomyEnrichment[] = [
  ...LAUNCH_AND_1X_TAXONOMY,
  ...VERSION_2X_TAXONOMY,
  ...VERSION_3X_TAXONOMY,
  ...VERSION_4X_AND_ALTERNATE_TAXONOMY,
  ...TRAILBLAZER_TAXONOMY,
];
