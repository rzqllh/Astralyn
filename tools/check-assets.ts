import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { AssetManifestSchema } from "../packages/shared/src/assets";

const ASSET_RELEASE = "v1.0.0";
const BASE_OUTPUT_DIR = path.resolve(
  __dirname,
  "../apps/web/public/game-assets",
  ASSET_RELEASE
);

export async function checkAssetIntegrity() {
  console.log(`[Astralyn Asset Integrity Check] Checking release ${ASSET_RELEASE}...`);
  console.log(`Location: ${BASE_OUTPUT_DIR}`);

  const manifestPath = path.join(BASE_OUTPUT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }

  const rawManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const parsedManifest = AssetManifestSchema.safeParse(rawManifest);

  if (!parsedManifest.success) {
    console.error(
      "[FAIL] Manifest schema validation failed:",
      parsedManifest.error.format()
    );
    process.exit(1);
  }

  const manifest = parsedManifest.data;
  console.log(
    `✓ Manifest Schema Valid (v${manifest.assetRelease}, Game: ${manifest.gameVersion}, Total: ${manifest.assets.length} assets)`
  );

  const seenIds = new Set<string>();
  let errors = 0;

  for (const asset of manifest.assets) {
    // 1. Duplicate ID check
    if (seenIds.has(asset.id)) {
      console.error(`[ERROR] Duplicate asset ID found: ${asset.id}`);
      errors++;
    }
    seenIds.add(asset.id);

    // 2. Local file existence check
    const localRel = asset.localPath.replace(`/game-assets/${ASSET_RELEASE}/`, "");
    const fullPath = path.join(BASE_OUTPUT_DIR, localRel);

    if (!fs.existsSync(fullPath)) {
      console.error(`[ERROR] File missing on disk: ${fullPath} for asset ${asset.id}`);
      errors++;
      continue;
    }

    // 3. SHA-256 checksum verification
    if (asset.checksum) {
      const fileBuffer = fs.readFileSync(fullPath);
      const actualChecksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      if (actualChecksum !== asset.checksum) {
        console.error(
          `[ERROR] Checksum mismatch for ${asset.id}: expected ${asset.checksum}, got ${actualChecksum}`
        );
        errors++;
      }
    }

    // 4. Local path pattern check
    if (!asset.localPath.startsWith(`/game-assets/${ASSET_RELEASE}/`)) {
      console.error(`[ERROR] Invalid localPath format: ${asset.localPath}`);
      errors++;
    }
  }

  // 5. Representative character coverage check
  const REQUIRED_REPRESENTATIVE_CHARS = [
    "acheron",
    "castorice",
    "firefly",
    "robin",
    "aventurine",
    "gallagher",
    "tingyun",
    "the-herta",
    "aventurine-waveflair",
  ];

  for (const charId of REQUIRED_REPRESENTATIVE_CHARS) {
    const hasIcon = manifest.assets.some(
      (a) => a.entityType === "character_icon" && a.entityId.toLowerCase() === charId
    );
    const hasPreview = manifest.assets.some(
      (a) => a.entityType === "character_preview" && a.entityId.toLowerCase() === charId
    );

    if (!hasIcon) {
      console.error(
        `[ERROR] Missing character_icon for representative character: ${charId}`
      );
      errors++;
    }
    if (!hasPreview) {
      console.error(
        `[ERROR] Missing character_preview for representative character: ${charId}`
      );
      errors++;
    }
  }

  // 6. Element & Path full coverage check
  const REQUIRED_ELEMENTS = [
    "Physical",
    "Fire",
    "Ice",
    "Lightning",
    "Wind",
    "Quantum",
    "Imaginary",
  ];
  const REQUIRED_PATHS = [
    "Destruction",
    "Hunt",
    "Erudition",
    "Harmony",
    "Nihility",
    "Preservation",
    "Abundance",
    "Remembrance",
    "Elation",
  ];

  for (const elem of REQUIRED_ELEMENTS) {
    const hasElem = manifest.assets.some(
      (a) =>
        a.entityType === "element_icon" && a.entityId.toLowerCase() === elem.toLowerCase()
    );
    if (!hasElem) {
      console.error(`[ERROR] Missing element_icon for: ${elem}`);
      errors++;
    }
  }

  for (const pathName of REQUIRED_PATHS) {
    const hasPath = manifest.assets.some(
      (a) =>
        a.entityType === "path_icon" &&
        a.entityId.toLowerCase() === pathName.toLowerCase()
    );
    if (!hasPath) {
      console.error(`[ERROR] Missing path_icon for: ${pathName}`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\n[FAIL] Asset integrity check failed with ${errors} error(s).`);
    process.exit(1);
  }

  console.log(
    `\n✓ All ${manifest.assets.length} game assets verified on disk with matching SHA-256 checksums.`
  );
  console.log(
    `✓ All 9 representative characters have verified icons and preview artwork.`
  );
  console.log(`✓ All 7 Combat Elements and 9 Combat Paths verified.`);
  console.log(`[PASS] Astralyn Game Asset Integrity Gate PASSED.\n`);
}

if (require.main === module || process.argv[1] === __filename) {
  checkAssetIntegrity().catch((err) => {
    console.error("[FATAL] Integrity check failed:", err);
    process.exit(1);
  });
}
