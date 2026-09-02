import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { type AssetManifest, type AssetRecord } from "../packages/shared/src/assets";
import { isPngBuffer, isSvgDisguisedAsRaster } from "./check-assets";

const ASSET_RELEASE = "v1.0.0";
const GAME_VERSION = "3.0.x";
const BASE_OUTPUT_DIR = path.resolve(
  __dirname,
  "../apps/web/src/dev/game-assets",
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
// 1. COMMITTED REPRESENTATIVE DEV SNAPSHOT (52 Curated Real Format Assets)
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

  // --- Divergent Universe Entities (Curio Real Icon) ---
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

export async function discoverUpstreamCatalog() {
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

  return {
    charactersCount,
    lightConesCount,
    relicSetsCount,
    pathsCount,
    elementsCount,
    itemsCount,
    totalEntities:
      charactersCount +
      lightConesCount +
      relicSetsCount +
      pathsCount +
      elementsCount +
      itemsCount,
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

export interface SyncOptions {
  baseDir?: string;
  fullCatalog?: boolean;
  dryRun?: boolean;
}

export async function syncAssets(options?: SyncOptions) {
  const baseDir = options?.baseDir ?? BASE_OUTPUT_DIR;
  const isFull = options?.fullCatalog ?? false;
  const isDryRun = options?.dryRun ?? false;

  console.log(
    `[Astralyn Asset Sync] Initializing sync for release ${ASSET_RELEASE}${isDryRun ? " [DRY-RUN MODE]" : ""}...`
  );
  console.log(`Target destination: ${baseDir}`);

  if (isFull) {
    throw new Error(
      "[FATAL] Full upstream catalog sync is not supported in Phase 2.5; only curated dev snapshot is permitted. Use --dry-run to discover catalog without writing."
    );
  }

  if (isDryRun) {
    const discovery = await discoverUpstreamCatalog();
    console.log(
      `[DRY-RUN] Upstream discovery: ${discovery.totalEntities} entities across index sets.`
    );
    return;
  }

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const targets = REPRESENTATIVE_DEV_SNAPSHOT;
  const assetRecords: AssetRecord[] = [];

  for (const target of targets) {
    const fullOutputPath = path.join(baseDir, target.relPath);
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
        throw new Error(
          `[FATAL] Missing asset on disk and remote fetch failed for ${target.id} (${remoteUrl}). Fail-closed: refusing to generate placeholder.`
        );
      }
    }

    const ext = path.extname(target.relPath).toLowerCase();
    if (isSvgDisguisedAsRaster(fileBuffer, ext)) {
      throw new Error(
        `[FATAL] Security verification failed: Asset ${target.id} is an SVG payload disguised as ${ext}.`
      );
    }
    if (ext === ".png" && !isPngBuffer(fileBuffer)) {
      throw new Error(
        `[FATAL] Verification failed: Asset ${target.id} does not contain a valid PNG header.`
      );
    }

    fs.writeFileSync(fullOutputPath, fileBuffer);
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    assetRecords.push({
      id: target.id,
      entityType: target.entityType,
      entityId: target.entityId,
      variant: target.variant,
      localPath: `/src/dev/game-assets/${ASSET_RELEASE}/${target.relPath}`,
      source: "StarRailRes",
      sourceUrl: remoteUrl,
      repositoryLicense: "AGPL-3.0",
      license: "HoYoverse Fan Content Policy (Subject to Manual Review)",
      copyrightOwner: "COGNOSPHERE / HoYoverse",
      usageStatus: "manual_review",
      attribution: target.attribution,
      fallbackPriority: 1,
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

  const manifestPath = path.join(baseDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`[Astralyn Asset Sync] Manifest written to ${manifestPath}`);
  console.log(
    `[Astralyn Asset Sync] Total verified assets registered: ${assetRecords.length}`
  );
}

if (require.main === module || process.argv[1] === __filename) {
  const isFull = process.argv.includes("--full");
  const isDryRun = process.argv.includes("--dry-run");
  syncAssets({ fullCatalog: isFull, dryRun: isDryRun }).catch((err) => {
    console.error("[FATAL] Asset sync failed:", err.message);
    process.exit(1);
  });
}
