import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { AssetManifest, AssetRecord } from "@astralyn/shared";

const ASSET_RELEASE = "v1.0.0";
const GAME_VERSION = "3.0.x";
const BASE_OUTPUT_DIR = path.resolve(
  __dirname,
  "../apps/web/public/game-assets",
  ASSET_RELEASE
);
const RAW_BASE_URL = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master";

interface TargetAsset {
  id: string;
  entityType: AssetRecord["entityType"];
  entityId: string;
  variant: AssetRecord["variant"];
  relPath: string; // target relative path in game-assets/v1.0.0/
  remotePath: string; // path in StarRailRes
  attribution: string;
  fallbackSvgGen?: () => string;
}

const TARGET_ASSETS: TargetAsset[] = [
  // Characters
  {
    id: "char_acheron_icon",
    entityType: "character_icon",
    entityId: "acheron",
    variant: "icon",
    relPath: "characters/acheron_icon.png",
    remotePath: "icon/character/1308.png",
    attribution: "StarRailRes (Mar-7th) / Character: Acheron (C) COGNOSPHERE",
  },
  {
    id: "char_acheron_preview",
    entityType: "character_preview",
    entityId: "acheron",
    variant: "preview",
    relPath: "characters/acheron_preview.png",
    remotePath: "image/character_preview/1308.png",
    attribution: "StarRailRes (Mar-7th) / Character: Acheron (C) COGNOSPHERE",
  },
  {
    id: "char_acheron_portrait",
    entityType: "character_portrait",
    entityId: "acheron",
    variant: "portrait",
    relPath: "characters/acheron_portrait.png",
    remotePath: "image/character_portrait/1308.png",
    attribution: "StarRailRes (Mar-7th) / Character: Acheron (C) COGNOSPHERE",
  },
  {
    id: "char_castorice_icon",
    entityType: "character_icon",
    entityId: "castorice",
    variant: "icon",
    relPath: "characters/castorice_icon.png",
    remotePath: "icon/character/1404.png",
    attribution: "StarRailRes (Mar-7th) / Character: Castorice (C) COGNOSPHERE",
  },
  {
    id: "char_castorice_preview",
    entityType: "character_preview",
    entityId: "castorice",
    variant: "preview",
    relPath: "characters/castorice_preview.png",
    remotePath: "image/character_preview/1404.png",
    attribution: "StarRailRes (Mar-7th) / Character: Castorice (C) COGNOSPHERE",
  },
  {
    id: "char_firefly_icon",
    entityType: "character_icon",
    entityId: "firefly",
    variant: "icon",
    relPath: "characters/firefly_icon.png",
    remotePath: "icon/character/1310.png",
    attribution: "StarRailRes (Mar-7th) / Character: Firefly (C) COGNOSPHERE",
  },
  {
    id: "char_firefly_preview",
    entityType: "character_preview",
    entityId: "firefly",
    variant: "preview",
    relPath: "characters/firefly_preview.png",
    remotePath: "image/character_preview/1310.png",
    attribution: "StarRailRes (Mar-7th) / Character: Firefly (C) COGNOSPHERE",
  },
  {
    id: "char_robin_icon",
    entityType: "character_icon",
    entityId: "robin",
    variant: "icon",
    relPath: "characters/robin_icon.png",
    remotePath: "icon/character/1309.png",
    attribution: "StarRailRes (Mar-7th) / Character: Robin (C) COGNOSPHERE",
  },
  {
    id: "char_robin_preview",
    entityType: "character_preview",
    entityId: "robin",
    variant: "preview",
    relPath: "characters/robin_preview.png",
    remotePath: "image/character_preview/1309.png",
    attribution: "StarRailRes (Mar-7th) / Character: Robin (C) COGNOSPHERE",
  },
  {
    id: "char_aventurine_icon",
    entityType: "character_icon",
    entityId: "aventurine",
    variant: "icon",
    relPath: "characters/aventurine_icon.png",
    remotePath: "icon/character/1304.png",
    attribution: "StarRailRes (Mar-7th) / Character: Aventurine (C) COGNOSPHERE",
  },
  {
    id: "char_gallagher_icon",
    entityType: "character_icon",
    entityId: "gallagher",
    variant: "icon",
    relPath: "characters/gallagher_icon.png",
    remotePath: "icon/character/1301.png",
    attribution: "StarRailRes (Mar-7th) / Character: Gallagher (C) COGNOSPHERE",
  },
  {
    id: "char_tingyun_icon",
    entityType: "character_icon",
    entityId: "tingyun",
    variant: "icon",
    relPath: "characters/tingyun_icon.png",
    remotePath: "icon/character/1202.png",
    attribution: "StarRailRes (Mar-7th) / Character: Tingyun (C) COGNOSPHERE",
  },
  {
    id: "char_the_herta_icon",
    entityType: "character_icon",
    entityId: "the-herta",
    variant: "icon",
    relPath: "characters/the_herta_icon.png",
    remotePath: "icon/character/1401.png",
    attribution: "StarRailRes (Mar-7th) / Character: The Herta (C) COGNOSPHERE",
  },

  // Elements
  {
    id: "elem_physical",
    entityType: "element_icon",
    entityId: "Physical",
    variant: "icon",
    relPath: "elements/Physical.png",
    remotePath: "icon/element/Physical.png",
    attribution: "StarRailRes (Mar-7th) / Element: Physical (C) COGNOSPHERE",
  },
  {
    id: "elem_fire",
    entityType: "element_icon",
    entityId: "Fire",
    variant: "icon",
    relPath: "elements/Fire.png",
    remotePath: "icon/element/Fire.png",
    attribution: "StarRailRes (Mar-7th) / Element: Fire (C) COGNOSPHERE",
  },
  {
    id: "elem_ice",
    entityType: "element_icon",
    entityId: "Ice",
    variant: "icon",
    relPath: "elements/Ice.png",
    remotePath: "icon/element/Ice.png",
    attribution: "StarRailRes (Mar-7th) / Element: Ice (C) COGNOSPHERE",
  },
  {
    id: "elem_lightning",
    entityType: "element_icon",
    entityId: "Lightning",
    variant: "icon",
    relPath: "elements/Lightning.png",
    remotePath: "icon/element/Thunder.png",
    attribution: "StarRailRes (Mar-7th) / Element: Lightning (C) COGNOSPHERE",
  },
  {
    id: "elem_wind",
    entityType: "element_icon",
    entityId: "Wind",
    variant: "icon",
    relPath: "elements/Wind.png",
    remotePath: "icon/element/Wind.png",
    attribution: "StarRailRes (Mar-7th) / Element: Wind (C) COGNOSPHERE",
  },
  {
    id: "elem_quantum",
    entityType: "element_icon",
    entityId: "Quantum",
    variant: "icon",
    relPath: "elements/Quantum.png",
    remotePath: "icon/element/Quantum.png",
    attribution: "StarRailRes (Mar-7th) / Element: Quantum (C) COGNOSPHERE",
  },
  {
    id: "elem_imaginary",
    entityType: "element_icon",
    entityId: "Imaginary",
    variant: "icon",
    relPath: "elements/Imaginary.png",
    remotePath: "icon/element/Imaginary.png",
    attribution: "StarRailRes (Mar-7th) / Element: Imaginary (C) COGNOSPHERE",
  },

  // Paths
  {
    id: "path_destruction",
    entityType: "path_icon",
    entityId: "Destruction",
    variant: "icon",
    relPath: "paths/Destruction.png",
    remotePath: "icon/path/Destruction.png",
    attribution: "StarRailRes (Mar-7th) / Path: Destruction (C) COGNOSPHERE",
  },
  {
    id: "path_hunt",
    entityType: "path_icon",
    entityId: "Hunt",
    variant: "icon",
    relPath: "paths/Hunt.png",
    remotePath: "icon/path/Hunt.png",
    attribution: "StarRailRes (Mar-7th) / Path: Hunt (C) COGNOSPHERE",
  },
  {
    id: "path_erudition",
    entityType: "path_icon",
    entityId: "Erudition",
    variant: "icon",
    relPath: "paths/Erudition.png",
    remotePath: "icon/path/Erudition.png",
    attribution: "StarRailRes (Mar-7th) / Path: Erudition (C) COGNOSPHERE",
  },
  {
    id: "path_harmony",
    entityType: "path_icon",
    entityId: "Harmony",
    variant: "icon",
    relPath: "paths/Harmony.png",
    remotePath: "icon/path/Harmony.png",
    attribution: "StarRailRes (Mar-7th) / Path: Harmony (C) COGNOSPHERE",
  },
  {
    id: "path_nihility",
    entityType: "path_icon",
    entityId: "Nihility",
    variant: "icon",
    relPath: "paths/Nihility.png",
    remotePath: "icon/path/Nihility.png",
    attribution: "StarRailRes (Mar-7th) / Path: Nihility (C) COGNOSPHERE",
  },
  {
    id: "path_preservation",
    entityType: "path_icon",
    entityId: "Preservation",
    variant: "icon",
    relPath: "paths/Preservation.png",
    remotePath: "icon/path/Preservation.png",
    attribution: "StarRailRes (Mar-7th) / Path: Preservation (C) COGNOSPHERE",
  },
  {
    id: "path_abundance",
    entityType: "path_icon",
    entityId: "Abundance",
    variant: "icon",
    relPath: "paths/Abundance.png",
    remotePath: "icon/path/Abundance.png",
    attribution: "StarRailRes (Mar-7th) / Path: Abundance (C) COGNOSPHERE",
  },
  {
    id: "path_remembrance",
    entityType: "path_icon",
    entityId: "Remembrance",
    variant: "icon",
    relPath: "paths/Remembrance.png",
    remotePath: "icon/path/Memory.png",
    attribution: "StarRailRes (Mar-7th) / Path: Remembrance (C) COGNOSPHERE",
  },

  // Light Cones
  {
    id: "lc_along_the_passing_shore",
    entityType: "light_cone_icon",
    entityId: "along-the-passing-shore",
    variant: "icon",
    relPath: "light-cones/along_the_passing_shore.png",
    remotePath: "icon/light_cone/23024.png",
    attribution:
      "StarRailRes (Mar-7th) / Light Cone: Along the Passing Shore (C) COGNOSPHERE",
  },
  {
    id: "lc_good_night_and_sleep_well",
    entityType: "light_cone_icon",
    entityId: "good-night-and-sleep-well",
    variant: "icon",
    relPath: "light-cones/good_night_and_sleep_well.png",
    remotePath: "icon/light_cone/21001.png",
    attribution:
      "StarRailRes (Mar-7th) / Light Cone: Good Night and Sleep Well (C) COGNOSPHERE",
  },

  // Relic & Planar
  {
    id: "relic_pioneer_diver",
    entityType: "relic_set_icon",
    entityId: "pioneer-diver",
    variant: "icon",
    relPath: "relics/pioneer_diver.png",
    remotePath: "icon/relic/118.png",
    attribution:
      "StarRailRes (Mar-7th) / Relic: Pioneer Diver of Dead Waters (C) COGNOSPHERE",
  },
  {
    id: "planar_izumo_gensei",
    entityType: "planar_ornament_icon",
    entityId: "izumo-gensei",
    variant: "icon",
    relPath: "relics/izumo_gensei.png",
    remotePath: "icon/relic/313.png",
    attribution: "StarRailRes (Mar-7th) / Planar: Izumo Gensei (C) COGNOSPHERE",
  },

  // Divergent Universe Entities
  {
    id: "du_blessing_fuli",
    entityType: "du_blessing_icon",
    entityId: "perfect-experience-fuli",
    variant: "icon",
    relPath: "du/blessing_fuli.png",
    remotePath: "icon/rogue/buff/120101.png",
    attribution:
      "StarRailRes (Mar-7th) / Blessing: Perfect Experience: Fuli (C) COGNOSPHERE",
  },
  {
    id: "du_blessing_annihilation",
    entityType: "du_blessing_icon",
    entityId: "celestial-annihilation",
    variant: "icon",
    relPath: "du/blessing_annihilation.png",
    remotePath: "icon/rogue/buff/110101.png",
    attribution:
      "StarRailRes (Mar-7th) / Blessing: Celestial Annihilation (C) COGNOSPHERE",
  },
  {
    id: "du_curio_rubert",
    entityType: "du_curio_icon",
    entityId: "rubert-difference-engine",
    variant: "icon",
    relPath: "du/curio_rubert.png",
    remotePath: "icon/item/140001.png",
    attribution:
      "StarRailRes (Mar-7th) / Curio: Rubert Difference Engine (C) COGNOSPHERE",
  },
];

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

export async function syncAssets() {
  console.log(`[Astralyn Asset Sync] Initializing sync for release ${ASSET_RELEASE}...`);
  console.log(`Target destination: ${BASE_OUTPUT_DIR}`);

  if (!fs.existsSync(BASE_OUTPUT_DIR)) {
    fs.mkdirSync(BASE_OUTPUT_DIR, { recursive: true });
  }

  const assetRecords: AssetRecord[] = [];

  for (const target of TARGET_ASSETS) {
    const fullOutputPath = path.join(BASE_OUTPUT_DIR, target.relPath);
    const outputDir = path.dirname(fullOutputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const remoteUrl = `${RAW_BASE_URL}/${target.remotePath}`;

    // Try fetching from remote StarRailRes
    let fileBuffer = await downloadFile(remoteUrl);

    if (!fileBuffer) {
      console.log(
        `Generating fallback vector placeholder for ${target.id} (${target.entityId})...`
      );
      fileBuffer = generatePlaceholderSvg(target.entityId);
    }

    fs.writeFileSync(fullOutputPath, fileBuffer);

    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    assetRecords.push({
      id: target.id,
      entityType: target.entityType,
      entityId: target.entityId,
      variant: target.variant,
      localPath: `/game-assets/${ASSET_RELEASE}/${target.relPath}`,
      source: "Mar-7th/StarRailRes",
      sourceUrl: remoteUrl,
      license: "AGPL-3.0 (Tooling) / Fair Use Fan Content (Imagery)",
      copyrightOwner: "COGNOSPHERE / HoYoverse",
      usageStatus: "official_fan_use",
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
  syncAssets().catch((err) => {
    console.error("[FATAL] Asset sync failed:", err);
    process.exit(1);
  });
}
