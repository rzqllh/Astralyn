import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  AssetManifestSchema,
  CANONICAL_CHARACTERS,
  CombatElementSchema,
  CombatPathSchema,
} from "@astralyn/shared";

describe("Phase 2 Knowledge & Dev Asset Snapshot Interoperability", () => {
  const assetManifestPath = path.resolve(
    __dirname,
    "../src/dev/game-assets/v1.0.0/manifest.json"
  );

  it("verifies that all canonical character IDs exist in the dev asset manifest", () => {
    expect(fs.existsSync(assetManifestPath)).toBe(true);
    const raw = fs.readFileSync(assetManifestPath, "utf8");
    const assetManifest = AssetManifestSchema.parse(JSON.parse(raw));

    const characterAssetEntityIds = new Set(
      assetManifest.assets
        .filter((a) => a.entityType === "character_icon")
        .map((a) => a.entityId)
    );

    const coreSupportedIds = [
      "acheron",
      "aventurine",
      "aventurine-waveflair",
      "castorice",
      "firefly",
      "gallagher",
      "robin",
      "the-herta",
      "tingyun",
    ];

    for (const coreId of coreSupportedIds) {
      expect(
        characterAssetEntityIds.has(coreId),
        `Core Character '${coreId}' must have a corresponding character_icon in dev asset manifest`
      ).toBe(true);
    }

    for (const assetId of characterAssetEntityIds) {
      expect(
        CANONICAL_CHARACTERS.some((c) => c.id === assetId),
        `Asset '${assetId}' in dev asset manifest must correspond to a valid canonical character`
      ).toBe(true);
    }
  });

  it("verifies all combat element and path dev asset mappings", () => {
    const raw = fs.readFileSync(assetManifestPath, "utf8");
    const assetManifest = AssetManifestSchema.parse(JSON.parse(raw));

    const elementAssetIds = new Set(
      assetManifest.assets
        .filter((a) => a.entityType === "element_icon")
        .map((a) => a.entityId)
    );

    for (const elem of CombatElementSchema.options) {
      expect(
        elementAssetIds.has(elem),
        `Element '${elem}' must exist in dev asset manifest`
      ).toBe(true);
    }

    const pathAssetIds = new Set(
      assetManifest.assets
        .filter((a) => a.entityType === "path_icon")
        .map((a) => a.entityId)
    );

    for (const p of CombatPathSchema.options) {
      expect(pathAssetIds.has(p), `Path '${p}' must exist in dev asset manifest`).toBe(
        true
      );
    }
  });

  it("verifies that representative synced light cones and relics map cleanly in dev snapshot", () => {
    const raw = fs.readFileSync(assetManifestPath, "utf8");
    const assetManifest = AssetManifestSchema.parse(JSON.parse(raw));

    const assetEntityIds = new Set(assetManifest.assets.map((a) => a.entityId));

    // Core representative light cones in dev snapshot
    const representativeLCs = ["along-the-passing-shore", "good-night-and-sleep-well"];
    for (const lcId of representativeLCs) {
      expect(
        assetEntityIds.has(lcId),
        `Representative LightCone '${lcId}' must map to dev asset entity`
      ).toBe(true);
    }

    // Core representative relics in dev snapshot
    const representativeRelics = ["pioneer-diver", "watchmaker", "izumo-gensei"];
    for (const relicId of representativeRelics) {
      expect(
        assetEntityIds.has(relicId),
        `Representative Relic '${relicId}' must map to dev asset entity`
      ).toBe(true);
    }
  });
});
