import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { activeManifest, getAssetUrl, getAssetRecord } from "../src/lib/assets";
import { GameAssetImage } from "../src/components/ui/game-asset-image";

describe("Astralyn Phase 1.1 Game Asset & Fallback Engine", () => {
  it("loads the static asset manifest and validates schema fields", () => {
    expect(activeManifest).toBeDefined();
    expect(activeManifest.assetRelease).toBe("v1.0.0");
    expect(activeManifest.gameVersion).toBe("3.0.x");
    expect(Array.isArray(activeManifest.assets)).toBe(true);
    expect(activeManifest.assets.length).toBeGreaterThanOrEqual(40);

    // Verify each record has required fields
    for (const asset of activeManifest.assets) {
      expect(asset.id).toBeTruthy();
      expect(asset.entityType).toBeTruthy();
      expect(asset.entityId).toBeTruthy();
      expect(asset.localPath.startsWith("/game-assets/")).toBe(true);
      expect(asset.license).toBeTruthy();
      expect(asset.copyrightOwner).toBeTruthy();
      expect(["manual_review", "official_fan_use", "approved"]).toContain(
        asset.usageStatus
      );
      expect(asset.checksum).toBeTruthy();
    }
  });

  it("synchronously resolves known assets across categories", () => {
    // Character Icon
    const acheronUrl = getAssetUrl("character_icon", "acheron", "icon");
    expect(acheronUrl).toBe("/game-assets/v1.0.0/characters/acheron_icon.png");

    // Element Icon
    const lightningUrl = getAssetUrl("element_icon", "Lightning", "icon");
    expect(lightningUrl).toBe("/game-assets/v1.0.0/elements/Lightning.png");

    // Path Icon
    const nihilityUrl = getAssetUrl("path_icon", "Nihility", "icon");
    expect(nihilityUrl).toBe("/game-assets/v1.0.0/paths/Nihility.png");

    // Light Cone Icon
    const lcUrl = getAssetUrl("light_cone_icon", "along-the-passing-shore", "icon");
    expect(lcUrl).toBe("/game-assets/v1.0.0/light-cones/along_the_passing_shore.png");
  });

  it("verifies all 8 representative characters have verified preview and icon assets", () => {
    const REPRESENTATIVE_CHARS = [
      "acheron",
      "castorice",
      "firefly",
      "robin",
      "aventurine",
      "gallagher",
      "tingyun",
      "the-herta",
    ];

    for (const charId of REPRESENTATIVE_CHARS) {
      const preview = getAssetUrl("character_preview", charId, "preview");
      const icon = getAssetUrl("character_icon", charId, "icon");
      expect(preview).toBeDefined();
      expect(icon).toBeDefined();
    }
  });

  it("returns undefined for non-existent entities without crashing", () => {
    const unknown = getAssetRecord("character_icon", "non_existent_entity_12345");
    expect(unknown).toBeUndefined();

    const unknownUrl = getAssetUrl("character_icon", "non_existent_entity_12345");
    expect(unknownUrl).toBeUndefined();
  });

  it("GameAssetImage renders an image when asset URL exists", () => {
    render(
      <GameAssetImage
        entityType="element_icon"
        entityId="Quantum"
        alt="Quantum Element"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/game-assets/v1.0.0/elements/Quantum.png");
    expect(img).toHaveAttribute("alt", "Quantum Element");
  });

  it("GameAssetImage renders deliberate fallback when entity is unknown or fails to load", () => {
    render(
      <GameAssetImage
        entityType="character_icon"
        entityId="missing_hero_9999"
        alt="Missing Hero Fallback"
        fallbackLabel="MH"
      />
    );

    // Should render fallback container with aria-label and fallback text
    const fallback = screen.getByRole("img", { name: "Missing Hero Fallback" });
    expect(fallback).toBeInTheDocument();
    expect(screen.getByText("MH")).toBeInTheDocument();
  });

  it("GameAssetImage triggers fallback gracefully on image onError", () => {
    render(
      <GameAssetImage
        entityType="character_icon"
        entityId="acheron"
        alt="Acheron Icon"
        fallbackLabel="AC"
      />
    );

    const img = screen.getByRole("img");
    fireEvent.error(img);

    // After error, should render fallback with label
    expect(screen.getByText("AC")).toBeInTheDocument();
  });
});
