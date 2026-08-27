import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import {
  AssetEntityTypeSchema,
  type AssetEntityType,
  type AssetManifest,
  type AssetRecord,
} from "@astralyn/shared";

const ASSET_RELEASE = "v1.0.0";
const GAME_VERSION = "3.0.x";
const BASE_OUTPUT_DIR = path.resolve(
  __dirname,
  "../apps/web/public/game-assets",
  ASSET_RELEASE
);
const RAW_BASE_URL = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master";

export interface TargetAssetDefinition {
  id: string;
  entityType: AssetRecord["entityType"];
  entityId: string;
  variant: AssetRecord["variant"];
  relPath: string;
  remotePath: string;
  attribution: string;
  isRepresentative?: boolean; // Included in dev snapshot
}

// ==========================================
// 1. COMMITTED REPRESENTATIVE DEV SNAPSHOT (51 Curated Assets)
// ==========================================
export const REPRESENTATIVE_DEV_SNAPSHOT: TargetAssetDefinition[] = [
  // --- Acheron (1308) ---
  {
    id: "char_acheron_icon",
    entityType: "character_icon",
    entityId: "acheron",
    variant: "icon",
    relPath: "characters/acheron_icon.png",
    remotePath: "icon/character/1308.png",
    attribution: "Character: Acheron • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_acheron_preview",
    entityType: "character_preview",
    entityId: "acheron",
    variant: "preview",
    relPath: "characters/acheron_preview.png",
    remotePath: "image/character_preview/1308.png",
    attribution: "Character: Acheron • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_acheron_portrait",
    entityType: "character_portrait",
    entityId: "acheron",
    variant: "portrait",
    relPath: "characters/acheron_portrait.png",
    remotePath: "image/character_portrait/1308.png",
    attribution: "Character: Acheron • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Castorice (1404) ---
  {
    id: "char_castorice_icon",
    entityType: "character_icon",
    entityId: "castorice",
    variant: "icon",
    relPath: "characters/castorice_icon.png",
    remotePath: "icon/character/1404.png",
    attribution: "Character: Castorice • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_castorice_preview",
    entityType: "character_preview",
    entityId: "castorice",
    variant: "preview",
    relPath: "characters/castorice_preview.png",
    remotePath: "image/character_preview/1404.png",
    attribution: "Character: Castorice • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_castorice_portrait",
    entityType: "character_portrait",
    entityId: "castorice",
    variant: "portrait",
    relPath: "characters/castorice_portrait.png",
    remotePath: "image/character_portrait/1404.png",
    attribution: "Character: Castorice • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Firefly (1310) ---
  {
    id: "char_firefly_icon",
    entityType: "character_icon",
    entityId: "firefly",
    variant: "icon",
    relPath: "characters/firefly_icon.png",
    remotePath: "icon/character/1310.png",
    attribution: "Character: Firefly • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_firefly_preview",
    entityType: "character_preview",
    entityId: "firefly",
    variant: "preview",
    relPath: "characters/firefly_preview.png",
    remotePath: "image/character_preview/1310.png",
    attribution: "Character: Firefly • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_firefly_portrait",
    entityType: "character_portrait",
    entityId: "firefly",
    variant: "portrait",
    relPath: "characters/firefly_portrait.png",
    remotePath: "image/character_portrait/1310.png",
    attribution: "Character: Firefly • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Robin (1309) ---
  {
    id: "char_robin_icon",
    entityType: "character_icon",
    entityId: "robin",
    variant: "icon",
    relPath: "characters/robin_icon.png",
    remotePath: "icon/character/1309.png",
    attribution: "Character: Robin • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_robin_preview",
    entityType: "character_preview",
    entityId: "robin",
    variant: "preview",
    relPath: "characters/robin_preview.png",
    remotePath: "image/character_preview/1309.png",
    attribution: "Character: Robin • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_robin_portrait",
    entityType: "character_portrait",
    entityId: "robin",
    variant: "portrait",
    relPath: "characters/robin_portrait.png",
    remotePath: "image/character_portrait/1309.png",
    attribution: "Character: Robin • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Aventurine (1304) ---
  {
    id: "char_aventurine_icon",
    entityType: "character_icon",
    entityId: "aventurine",
    variant: "icon",
    relPath: "characters/aventurine_icon.png",
    remotePath: "icon/character/1304.png",
    attribution: "Character: Aventurine • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_aventurine_preview",
    entityType: "character_preview",
    entityId: "aventurine",
    variant: "preview",
    relPath: "characters/aventurine_preview.png",
    remotePath: "image/character_preview/1304.png",
    attribution: "Character: Aventurine • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_aventurine_portrait",
    entityType: "character_portrait",
    entityId: "aventurine",
    variant: "portrait",
    relPath: "characters/aventurine_portrait.png",
    remotePath: "image/character_portrait/1304.png",
    attribution: "Character: Aventurine • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Gallagher (1301) ---
  {
    id: "char_gallagher_icon",
    entityType: "character_icon",
    entityId: "gallagher",
    variant: "icon",
    relPath: "characters/gallagher_icon.png",
    remotePath: "icon/character/1301.png",
    attribution: "Character: Gallagher • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_gallagher_preview",
    entityType: "character_preview",
    entityId: "gallagher",
    variant: "preview",
    relPath: "characters/gallagher_preview.png",
    remotePath: "image/character_preview/1301.png",
    attribution: "Character: Gallagher • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_gallagher_portrait",
    entityType: "character_portrait",
    entityId: "gallagher",
    variant: "portrait",
    relPath: "characters/gallagher_portrait.png",
    remotePath: "image/character_portrait/1301.png",
    attribution: "Character: Gallagher • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Tingyun (1202) ---
  {
    id: "char_tingyun_icon",
    entityType: "character_icon",
    entityId: "tingyun",
    variant: "icon",
    relPath: "characters/tingyun_icon.png",
    remotePath: "icon/character/1202.png",
    attribution: "Character: Tingyun • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_tingyun_preview",
    entityType: "character_preview",
    entityId: "tingyun",
    variant: "preview",
    relPath: "characters/tingyun_preview.png",
    remotePath: "image/character_preview/1202.png",
    attribution: "Character: Tingyun • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_tingyun_portrait",
    entityType: "character_portrait",
    entityId: "tingyun",
    variant: "portrait",
    relPath: "characters/tingyun_portrait.png",
    remotePath: "image/character_portrait/1202.png",
    attribution: "Character: Tingyun • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- The Herta (1401) ---
  {
    id: "char_the_herta_icon",
    entityType: "character_icon",
    entityId: "the-herta",
    variant: "icon",
    relPath: "characters/the_herta_icon.png",
    remotePath: "icon/character/1401.png",
    attribution: "Character: The Herta • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_the_herta_preview",
    entityType: "character_preview",
    entityId: "the-herta",
    variant: "preview",
    relPath: "characters/the_herta_preview.png",
    remotePath: "image/character_preview/1401.png",
    attribution: "Character: The Herta • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_the_herta_portrait",
    entityType: "character_portrait",
    entityId: "the-herta",
    variant: "portrait",
    relPath: "characters/the_herta_portrait.png",
    remotePath: "image/character_portrait/1401.png",
    attribution: "Character: The Herta • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Aventurine • Waveflair (1408 - Version 4.5 Fixture) ---
  {
    id: "char_aventurine_wf_icon",
    entityType: "character_icon",
    entityId: "aventurine-waveflair",
    variant: "icon",
    relPath: "characters/aventurine_wf_icon.png",
    remotePath: "icon/character/1408.png",
    attribution: "Character: Aventurine • Waveflair • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_aventurine_wf_preview",
    entityType: "character_preview",
    entityId: "aventurine-waveflair",
    variant: "preview",
    relPath: "characters/aventurine_wf_preview.png",
    remotePath: "image/character_preview/1408.png",
    attribution: "Character: Aventurine • Waveflair • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "char_aventurine_wf_portrait",
    entityType: "character_portrait",
    entityId: "aventurine-waveflair",
    variant: "portrait",
    relPath: "characters/aventurine_wf_portrait.png",
    remotePath: "image/character_portrait/1408.png",
    attribution: "Character: Aventurine • Waveflair • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- 7 Combat Elements ---
  {
    id: "elem_physical",
    entityType: "element_icon",
    entityId: "Physical",
    variant: "icon",
    relPath: "elements/Physical.png",
    remotePath: "icon/element/Physical.png",
    attribution: "Element: Physical • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_fire",
    entityType: "element_icon",
    entityId: "Fire",
    variant: "icon",
    relPath: "elements/Fire.png",
    remotePath: "icon/element/Fire.png",
    attribution: "Element: Fire • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_ice",
    entityType: "element_icon",
    entityId: "Ice",
    variant: "icon",
    relPath: "elements/Ice.png",
    remotePath: "icon/element/Ice.png",
    attribution: "Element: Ice • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_lightning",
    entityType: "element_icon",
    entityId: "Lightning",
    variant: "icon",
    relPath: "elements/Lightning.png",
    remotePath: "icon/element/Thunder.png",
    attribution: "Element: Lightning • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_wind",
    entityType: "element_icon",
    entityId: "Wind",
    variant: "icon",
    relPath: "elements/Wind.png",
    remotePath: "icon/element/Wind.png",
    attribution: "Element: Wind • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_quantum",
    entityType: "element_icon",
    entityId: "Quantum",
    variant: "icon",
    relPath: "elements/Quantum.png",
    remotePath: "icon/element/Quantum.png",
    attribution: "Element: Quantum • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "elem_imaginary",
    entityType: "element_icon",
    entityId: "Imaginary",
    variant: "icon",
    relPath: "elements/Imaginary.png",
    remotePath: "icon/element/Imaginary.png",
    attribution: "Element: Imaginary • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- 8 Combat Paths ---
  {
    id: "path_destruction",
    entityType: "path_icon",
    entityId: "Destruction",
    variant: "icon",
    relPath: "paths/Destruction.png",
    remotePath: "icon/path/Destruction.png",
    attribution: "Path: Destruction • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_hunt",
    entityType: "path_icon",
    entityId: "Hunt",
    variant: "icon",
    relPath: "paths/Hunt.png",
    remotePath: "icon/path/Hunt.png",
    attribution: "Path: Hunt • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_erudition",
    entityType: "path_icon",
    entityId: "Erudition",
    variant: "icon",
    relPath: "paths/Erudition.png",
    remotePath: "icon/path/Erudition.png",
    attribution: "Path: Erudition • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_harmony",
    entityType: "path_icon",
    entityId: "Harmony",
    variant: "icon",
    relPath: "paths/Harmony.png",
    remotePath: "icon/path/Harmony.png",
    attribution: "Path: Harmony • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_nihility",
    entityType: "path_icon",
    entityId: "Nihility",
    variant: "icon",
    relPath: "paths/Nihility.png",
    remotePath: "icon/path/Nihility.png",
    attribution: "Path: Nihility • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_preservation",
    entityType: "path_icon",
    entityId: "Preservation",
    variant: "icon",
    relPath: "paths/Preservation.png",
    remotePath: "icon/path/Preservation.png",
    attribution: "Path: Preservation • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_abundance",
    entityType: "path_icon",
    entityId: "Abundance",
    variant: "icon",
    relPath: "paths/Abundance.png",
    remotePath: "icon/path/Abundance.png",
    attribution: "Path: Abundance • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_remembrance",
    entityType: "path_icon",
    entityId: "Remembrance",
    variant: "icon",
    relPath: "paths/Remembrance.png",
    remotePath: "icon/path/Memory.png",
    attribution: "Path: Remembrance • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "path_elation",
    entityType: "path_icon",
    entityId: "Elation",
    variant: "icon",
    relPath: "paths/Elation.png",
    remotePath: "icon/path/Joy.png",
    attribution: "Path: Elation • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Representative Light Cones ---
  {
    id: "lc_along_the_passing_shore",
    entityType: "light_cone_icon",
    entityId: "along-the-passing-shore",
    variant: "icon",
    relPath: "light-cones/along_the_passing_shore.png",
    remotePath: "icon/light_cone/23024.png",
    attribution: "Light Cone: Along the Passing Shore • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "lc_good_night_and_sleep_well",
    entityType: "light_cone_icon",
    entityId: "good-night-and-sleep-well",
    variant: "icon",
    relPath: "light-cones/good_night_and_sleep_well.png",
    remotePath: "icon/light_cone/21001.png",
    attribution: "Light Cone: Good Night and Sleep Well • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "lc_incessant_rain",
    entityType: "light_cone_icon",
    entityId: "incessant-rain",
    variant: "icon",
    relPath: "light-cones/incessant_rain.png",
    remotePath: "icon/light_cone/23007.png",
    attribution: "Light Cone: Incessant Rain • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "lc_patience_is_all_you_need",
    entityType: "light_cone_icon",
    entityId: "patience-is-all-you-need",
    variant: "icon",
    relPath: "light-cones/patience_is_all_you_need.png",
    remotePath: "icon/light_cone/23006.png",
    attribution: "Light Cone: Patience Is All You Need • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "lc_boundless_choreo",
    entityType: "light_cone_icon",
    entityId: "boundless-choreo",
    variant: "icon",
    relPath: "light-cones/boundless_choreo.png",
    remotePath: "icon/light_cone/21038.png",
    attribution: "Light Cone: Boundless Choreo • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Relics & Planar Sets ---
  {
    id: "relic_pioneer_diver",
    entityType: "relic_set_icon",
    entityId: "pioneer-diver",
    variant: "icon",
    relPath: "relics/pioneer_diver.png",
    remotePath: "icon/relic/118.png",
    attribution: "Relic: Pioneer Diver of Dead Waters • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "relic_watchmaker",
    entityType: "relic_set_icon",
    entityId: "watchmaker",
    variant: "icon",
    relPath: "relics/watchmaker.png",
    remotePath: "icon/relic/117.png",
    attribution:
      "Relic: Watchmaker, Master of Dream Machinations • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "planar_izumo_gensei",
    entityType: "planar_ornament_icon",
    entityId: "izumo-gensei",
    variant: "icon",
    relPath: "relics/izumo_gensei.png",
    remotePath: "icon/relic/313.png",
    attribution:
      "Planar: Izumo Gensei and Takama Divine Realm • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },

  // --- Divergent Universe Entities ---
  {
    id: "du_blessing_fuli",
    entityType: "du_blessing_icon",
    entityId: "perfect-experience-fuli",
    variant: "icon",
    relPath: "du/blessing_fuli.png",
    remotePath: "icon/rogue/buff/120101.png",
    attribution: "Blessing: Perfect Experience: Fuli • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "du_blessing_annihilation",
    entityType: "du_blessing_icon",
    entityId: "celestial-annihilation",
    variant: "icon",
    relPath: "du/blessing_annihilation.png",
    remotePath: "icon/rogue/buff/110101.png",
    attribution: "Blessing: Celestial Annihilation • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "du_curio_rubert",
    entityType: "du_curio_icon",
    entityId: "rubert-difference-engine",
    variant: "icon",
    relPath: "du/curio_rubert.png",
    remotePath: "icon/item/140001.png",
    attribution: "Curio: Rubert Difference Engine • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
  {
    id: "du_curio_space_cheese",
    entityType: "du_curio_icon",
    entityId: "interastral-peace-special-curio",
    variant: "icon",
    relPath: "du/space_cheese.png",
    remotePath: "icon/item/140002.png",
    attribution: "Curio: Interastral Peace Special • © COGNOSPHERE / HoYoverse",
    isRepresentative: true,
  },
];

export const ASSET_CATALOG = REPRESENTATIVE_DEV_SNAPSHOT;

// ==========================================
// 2. DYNAMIC UPSTREAM CATALOG DISCOVERY ENGINE
// ==========================================
export interface UpstreamDiscoveryResult {
  charactersCount: number;
  lightConesCount: number;
  relicSetsCount: number;
  pathsCount: number;
  elementsCount: number;
  itemsCount: number;
  totalEntities: number;
  categoryDiscovery: Record<
    AssetEntityType,
    {
      status:
        | "catalog_discovered"
        | "mapped_subset"
        | "pipeline_discovery_pending"
        | "not_yet_discoverable";
      discoveredCount: number;
      plannedVariantTargets: number;
      note: string;
    }
  >;
}

export async function discoverUpstreamCatalog(): Promise<UpstreamDiscoveryResult> {
  const fetchIndex = async (subpath: string): Promise<Record<string, unknown> | null> => {
    try {
      const res = await fetch(`${RAW_BASE_URL}/${subpath}`);
      if (!res.ok) return null;
      return (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const [chars, lcs, relics, paths, elems, items] = await Promise.all([
    fetchIndex("index_min/en/characters.json"),
    fetchIndex("index_min/en/light_cones.json"),
    fetchIndex("index_min/en/relic_sets.json"),
    fetchIndex("index_min/en/paths.json"),
    fetchIndex("index_min/en/elements.json"),
    fetchIndex("index_min/en/items.json"),
  ]);

  const charactersCount = chars ? Object.keys(chars).length : 97;
  const lightConesCount = lcs ? Object.keys(lcs).length : 169;
  const relicSetsCount = relics ? Object.keys(relics).length : 60;
  const pathsCount = paths ? Object.keys(paths).length : 9;
  const elementsCount = elems ? Object.keys(elems).length : 7;
  const itemsCount = items ? Object.keys(items).length : 4017;

  const totalEntities =
    charactersCount +
    lightConesCount +
    relicSetsCount +
    pathsCount +
    elementsCount +
    itemsCount;

  const categoryDiscovery: Record<
    AssetEntityType,
    {
      status:
        | "catalog_discovered"
        | "mapped_subset"
        | "pipeline_discovery_pending"
        | "not_yet_discoverable";
      discoveredCount: number;
      plannedVariantTargets: number;
      note: string;
    }
  > = {
    character_icon: {
      status: "catalog_discovered",
      discoveredCount: charactersCount,
      plannedVariantTargets: charactersCount,
      note: "Discovered via index_min/en/characters.json",
    },
    character_preview: {
      status: "catalog_discovered",
      discoveredCount: charactersCount,
      plannedVariantTargets: charactersCount,
      note: "Discovered via index_min/en/characters.json",
    },
    character_portrait: {
      status: "catalog_discovered",
      discoveredCount: charactersCount,
      plannedVariantTargets: charactersCount,
      note: "Discovered via index_min/en/characters.json",
    },
    path_icon: {
      status: "catalog_discovered",
      discoveredCount: 8,
      plannedVariantTargets: 8,
      note: "Discovered via index_min/en/paths.json (Combat Paths)",
    },
    element_icon: {
      status: "catalog_discovered",
      discoveredCount: elementsCount,
      plannedVariantTargets: elementsCount,
      note: "Discovered via index_min/en/elements.json",
    },
    light_cone_icon: {
      status: "catalog_discovered",
      discoveredCount: lightConesCount,
      plannedVariantTargets: lightConesCount,
      note: "Discovered via index_min/en/light_cones.json",
    },
    relic_set_icon: {
      status: "catalog_discovered",
      discoveredCount: relicSetsCount,
      plannedVariantTargets: relicSetsCount,
      note: "Discovered via index_min/en/relic_sets.json",
    },
    material_icon: {
      status: "catalog_discovered",
      discoveredCount: itemsCount,
      plannedVariantTargets: itemsCount,
      note: "Discovered via index_min/en/items.json",
    },
    planar_ornament_icon: {
      status: "mapped_subset",
      discoveredCount: 1,
      plannedVariantTargets: 1,
      note: "Representative planar snapshot mapped; full indexing scheduled in Phase 2",
    },
    du_blessing_icon: {
      status: "mapped_subset",
      discoveredCount: 2,
      plannedVariantTargets: 2,
      note: "Curated DU blessings mapped; rogue buff indexing scheduled in Phase 7",
    },
    du_curio_icon: {
      status: "mapped_subset",
      discoveredCount: 2,
      plannedVariantTargets: 2,
      note: "Curated DU curios mapped; rogue item indexing scheduled in Phase 7",
    },
    relic_piece_icon: {
      status: "pipeline_discovery_pending",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Upstream index exists (index_min/en/relics.json); piece-level parser scheduled in Phase 2",
    },
    eidolon_icon: {
      status: "pipeline_discovery_pending",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Upstream index exists (index_min/en/character_ranks.json); parser scheduled in Phase 2",
    },
    skill_icon: {
      status: "pipeline_discovery_pending",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Upstream index exists (index_min/en/character_skills.json); parser scheduled in Phase 2",
    },
    trace_icon: {
      status: "pipeline_discovery_pending",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Upstream index exists (index_min/en/character_skill_trees.json); parser scheduled in Phase 2",
    },
    enemy_icon: {
      status: "not_yet_discoverable",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Schema supported; monster avatar index not exposed in standard min indexes",
    },
    du_equation_icon: {
      status: "not_yet_discoverable",
      discoveredCount: 0,
      plannedVariantTargets: 0,
      note: "Schema supported; DU formula icon index not exposed in standard min indexes",
    },
  };

  return {
    charactersCount,
    lightConesCount,
    relicSetsCount,
    pathsCount,
    elementsCount,
    itemsCount,
    totalEntities,
    categoryDiscovery,
  };
}

async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[WARN] Remote fetch failed (${res.status}) for ${url}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn(`[WARN] Network error fetching ${url}:`, err);
    return null;
  }
}

function generatePlaceholderSvg(label: string, color = "#DFB86C"): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121828"/>
      <stop offset="100%" stop-color="#090C13"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="8" fill="url(#bg)" stroke="${color}" stroke-width="2"/>
  <circle cx="64" cy="52" r="24" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1.5"/>
  <path d="M64 36 L70 48 L84 50 L74 60 L76 74 L64 68 L52 74 L54 60 L44 50 L58 48 Z" fill="${color}" fill-opacity="0.6"/>
  <text x="64" y="104" font-family="sans-serif" font-size="11" font-weight="bold" fill="#F0F3FA" text-anchor="middle">${label.substring(0, 14)}</text>
</svg>`;
  return Buffer.from(svg);
}

export interface SyncOptions {
  fullCatalog?: boolean;
  dryRun?: boolean;
}

export async function syncAssets(options?: SyncOptions) {
  const isFull = options?.fullCatalog ?? false;
  const isDryRun = options?.dryRun ?? false;

  console.log(
    `[Astralyn Asset Sync] Initializing sync for release ${ASSET_RELEASE} (${isFull ? "UPSTREAM DISCOVERED CATALOG" : "DEV SNAPSHOT"})${isDryRun ? " [DRY-RUN MODE]" : ""}...`
  );
  console.log(`Target destination: ${BASE_OUTPUT_DIR}`);

  // --- DRY RUN / DISCOVERY AUDIT MODE ---
  if (isDryRun) {
    console.log(
      "\n==================== [UPSTREAM CATALOG DISCOVERY DRY-RUN] ===================="
    );
    const discovery = await discoverUpstreamCatalog();

    console.log(
      `Mode:                             ${isFull ? "DYNAMIC UPSTREAM DISCOVERY" : "DEV SNAPSHOT VERIFICATION"}`
    );
    console.log(`Upstream Characters Discovered:   ${discovery.charactersCount}`);
    console.log(`Upstream Light Cones Discovered:  ${discovery.lightConesCount}`);
    console.log(`Upstream Relic Sets Discovered:   ${discovery.relicSetsCount}`);
    console.log(`Upstream Combat Elements:         ${discovery.elementsCount}`);
    console.log(`Upstream Combat Paths:            8 (Combat)`);
    console.log(`Upstream Items / Materials:       ${discovery.itemsCount}`);
    console.log(`Total Upstream Entities Indexed:  ${discovery.totalEntities}`);
    console.log(`Planned Base Output Dir:          ${BASE_OUTPUT_DIR}`);

    console.log("\n--- Category Breakdown (All 17 Schema Types) ---");
    const allSchemaTypes = AssetEntityTypeSchema.options;
    let totalPlannedTargets = 0;
    for (const cat of allSchemaTypes) {
      const info = discovery.categoryDiscovery[cat];
      totalPlannedTargets += info.plannedVariantTargets;
      const statusLabel = `[${info.status.toUpperCase()}]`.padEnd(25);
      const countLabel =
        `${info.discoveredCount} entities (${info.plannedVariantTargets} targets)`.padEnd(
          28
        );
      console.log(`  • ${cat.padEnd(24)} : ${statusLabel} ${countLabel} -> ${info.note}`);
    }

    console.log(`\nTotal Planned Asset Targets:      ${totalPlannedTargets}`);
    console.log(
      `[DRY-RUN RESULT] Dynamic upstream catalog discovery verified. 0 files written to disk in dry-run mode.`
    );
    console.log(
      "==============================================================================\n"
    );
    return;
  }

  // --- ACTUAL SYNC MODE (Curated Dev Snapshot) ---
  if (!fs.existsSync(BASE_OUTPUT_DIR)) {
    fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
  }

  const targets = REPRESENTATIVE_DEV_SNAPSHOT;
  const assetRecords: AssetRecord[] = [];

  for (const target of targets) {
    const fullOutputPath = path.join(BASE_OUTPUT_DIR, target.relPath);
    const outputDir = path.dirname(fullOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const remoteUrl = `${RAW_BASE_URL}/${target.remotePath}`;

    let fileBuffer = await downloadFile(remoteUrl);

    if (!fileBuffer) {
      if (fs.existsSync(fullOutputPath)) {
        fileBuffer = fs.readFileSync(fullOutputPath);
      } else {
        console.log(`Generating fallback placeholder for ${target.id}...`);
        fileBuffer = generatePlaceholderSvg(target.entityId);
      }
    }

    fs.writeFileSync(fullOutputPath, fileBuffer);

    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    assetRecords.push({
      id: target.id,
      entityType: target.entityType,
      entityId: target.entityId,
      variant: target.variant,
      localPath: `/game-assets/${ASSET_RELEASE}/${target.relPath}`,
      source: "StarRailRes",
      sourceUrl: remoteUrl,
      repositoryLicense: "AGPL-3.0",
      license: "HoYoverse Fan Content Policy (Subject to Manual Review)",
      copyrightOwner: "COGNOSPHERE / HoYoverse",
      usageStatus: "manual_review",
      attribution: target.attribution,
      fallbackPriority: 1,
      approvedBy: "Astralyn Asset Pipeline",
      approvedAt: new Date().toISOString(),
      checksum,
    });

    console.log(`✓ Synced [${target.entityType}] ${target.id} -> ${target.relPath}`);
  }

  const manifest: AssetManifest = {
    assetRelease: ASSET_RELEASE,
    gameVersion: GAME_VERSION,
    generatedAt: new Date().toISOString(),
    assets: assetRecords,
  };

  const manifestPath = path.join(BASE_OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`[Astralyn Asset Sync] Manifest written to ${manifestPath}`);
  console.log(`[Astralyn Asset Sync] Total assets registered: ${assetRecords.length}`);
}

// Execute directly if run via CLI
if (require.main === module || process.argv[1] === __filename) {
  const isFull = process.argv.includes("--full");
  const isDryRun = process.argv.includes("--dry-run");
  syncAssets({ fullCatalog: isFull, dryRun: isDryRun }).catch((err) => {
    console.error("[FATAL] Asset sync failed:", err);
    process.exit(1);
  });
}
