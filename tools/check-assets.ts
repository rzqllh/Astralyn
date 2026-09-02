import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { AssetManifestSchema } from "../packages/shared/src/assets";

const ASSET_RELEASE = "v1.0.0";
const DEFAULT_DEV_DIR = path.resolve(
  __dirname,
  "../apps/web/src/dev/game-assets",
  ASSET_RELEASE
);

export interface CheckAssetOptions {
  baseDir?: string;
  isProduction?: boolean;
}

export function isPngBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

export function isWebpBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const riff = buf.subarray(0, 4).toString("ascii");
  const webp = buf.subarray(8, 12).toString("ascii");
  return riff === "RIFF" && webp === "WEBP";
}

export function isSvgDisguisedAsRaster(buf: Buffer, ext: string): boolean {
  if (ext === ".png" || ext === ".webp" || ext === ".jpg" || ext === ".jpeg") {
    const textSample = buf.subarray(0, Math.min(buf.length, 512)).toString("utf8");
    if (textSample.includes("<svg") || textSample.includes("<?xml")) {
      return true;
    }
  }
  return false;
}

export async function checkAssetIntegrity(options?: CheckAssetOptions) {
  const baseDir = options?.baseDir ?? DEFAULT_DEV_DIR;
  const isProduction = options?.isProduction ?? false;

  console.log(`[Astralyn Asset Integrity Check] Checking release ${ASSET_RELEASE}...`);
  console.log(`Target directory: ${baseDir}`);
  console.log(`Mode: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);

  const manifestPath = path.join(baseDir, "manifest.json");
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
    throw new Error("Manifest schema validation failed");
  }

  const manifest = parsedManifest.data;
  console.log(
    `✓ Manifest Schema Valid (Release: ${manifest.assetRelease}, Game: ${manifest.gameVersion}, Total: ${manifest.assets.length} assets)`
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

    // 2. Production policy check (production cannot contain manual_review or blocked assets)
    if (isProduction) {
      if (asset.usageStatus !== "approved" && asset.usageStatus !== "official_fan_use") {
        console.error(
          `[ERROR] Asset ${asset.id} has usageStatus '${asset.usageStatus}' which is prohibited in production.`
        );
        errors++;
      }
      if (!asset.approvedBy || !asset.approvedAt) {
        console.error(
          `[ERROR] Production asset ${asset.id} must have explicit approvedBy and approvedAt fields.`
        );
        errors++;
      }
    }

    // 3. Local file existence check
    const localRel = asset.localPath.replace(
      /^\/(src\/dev\/)?game-assets\/v[0-9.]+\//,
      ""
    );
    const fullPath = path.join(baseDir, localRel);

    if (!fs.existsSync(fullPath)) {
      console.error(`[ERROR] File missing on disk: ${fullPath} for asset ${asset.id}`);
      errors++;
      continue;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    // 4. Magic header / media format sniff check
    if (isSvgDisguisedAsRaster(fileBuffer, ext)) {
      console.error(
        `[ERROR] Hard security failure: Asset ${asset.id} (${fullPath}) is an SVG disguised as raster (${ext}).`
      );
      errors++;
    } else if (ext === ".png" && !isPngBuffer(fileBuffer)) {
      console.error(
        `[ERROR] Corrupt PNG header: Asset ${asset.id} (${fullPath}) does not start with valid PNG signature.`
      );
      errors++;
    } else if (ext === ".webp" && !isWebpBuffer(fileBuffer)) {
      console.error(
        `[ERROR] Corrupt WebP header: Asset ${asset.id} (${fullPath}) does not start with valid WebP signature.`
      );
      errors++;
    }

    // 5. SHA-256 checksum verification
    if (asset.checksum) {
      const actualChecksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      if (actualChecksum !== asset.checksum) {
        console.error(
          `[ERROR] Checksum mismatch for ${asset.id}: expected ${asset.checksum}, got ${actualChecksum}`
        );
        errors++;
      }
    } else {
      console.error(`[ERROR] Asset ${asset.id} is missing mandatory SHA-256 checksum.`);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\n[FAIL] Asset integrity check failed with ${errors} error(s).`);
    throw new Error(`Asset integrity check failed with ${errors} error(s)`);
  }

  console.log(
    `\n✓ All ${manifest.assets.length} game assets verified on disk with valid media signatures and matching SHA-256 checksums.`
  );
  console.log(`[PASS] Astralyn Game Asset Integrity Gate PASSED.\n`);
  return { manifest, assetCount: manifest.assets.length };
}

if (require.main === module || process.argv[1] === __filename) {
  const isProd = process.argv.includes("--production");
  const customDir = process.argv.find((arg) => arg.startsWith("--dir="))?.split("=")[1];

  checkAssetIntegrity({ baseDir: customDir, isProduction: isProd }).catch((err) => {
    console.error("[FATAL] Integrity check failed:", err.message);
    process.exit(1);
  });
}
