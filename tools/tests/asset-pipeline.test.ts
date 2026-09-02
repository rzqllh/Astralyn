import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  checkAssetIntegrity,
  isPngBuffer,
  isWebpBuffer,
  isSvgDisguisedAsRaster,
} from "../check-assets";

describe("Phase 2.5 Fail-Closed Asset Pipeline Tools", () => {
  test("correctly identifies valid PNG magic header", () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    assert.equal(isPngBuffer(pngHeader), true);

    const corruptHeader = Buffer.from([0x89, 0x50, 0x00, 0x00]);
    assert.equal(isPngBuffer(corruptHeader), false);
  });

  test("correctly identifies valid WebP RIFF header", () => {
    const webpHeader = Buffer.from("RIFF\x20\x00\x00\x00WEBPVP8 ", "ascii");
    assert.equal(isWebpBuffer(webpHeader), true);

    const nonWebp = Buffer.from("RIFF\x20\x00\x00\x00AVIFVP8 ", "ascii");
    assert.equal(isWebpBuffer(nonWebp), false);
  });

  test("detects SVG XML disguised as raster image format", () => {
    const fakePng = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', "utf8");
    assert.equal(isSvgDisguisedAsRaster(fakePng, ".png"), true);
    assert.equal(isSvgDisguisedAsRaster(fakePng, ".webp"), true);

    const realPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    assert.equal(isSvgDisguisedAsRaster(realPng, ".png"), false);
  });

  test("verifies the sanitized dev asset snapshot passes integrity checks", async () => {
    const devDir = path.resolve(__dirname, "../../apps/web/src/dev/game-assets/v1.0.0");
    const result = await checkAssetIntegrity({
      baseDir: devDir,
      isProduction: false,
    });

    assert.ok(result);
    assert.equal(result.assetCount, 52);
    assert.equal(
      result.manifest.assets.every((a) => a.usageStatus === "manual_review"),
      true
    );
  });

  test("fails closed in production mode when assets are in manual_review status", async () => {
    const devDir = path.resolve(__dirname, "../../apps/web/src/dev/game-assets/v1.0.0");

    await assert.rejects(
      async () => {
        await checkAssetIntegrity({
          baseDir: devDir,
          isProduction: true,
        });
      },
      {
        message: /Asset integrity check failed/,
      }
    );
  });

  test("detects quarantined SVG fixtures when analyzed as PNG", () => {
    const fixturePath = path.resolve(
      __dirname,
      "../../apps/web/tests/fixtures/assets/blessing_fuli.svg"
    );
    assert.equal(fs.existsSync(fixturePath), true);
    const svgBuffer = fs.readFileSync(fixturePath);

    // If analyzed under .png extension, must trigger hard disguised SVG failure
    assert.equal(isSvgDisguisedAsRaster(svgBuffer, ".png"), true);
    assert.equal(isPngBuffer(svgBuffer), false);
  });
});
