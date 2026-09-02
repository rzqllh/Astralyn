import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { activeManifest, getAssetUrl, getAssetRecord } from "../src/dev/assets";
import { GameAssetImage } from "../src/dev/components/game-asset-image";

describe("Astralyn Phase 2.5 Dev Game Asset & Fallback Engine", () => {
  it("loads the dev asset manifest and validates schema fields for all 52 candidates", () => {
    expect(activeManifest).toBeDefined();
    expect(activeManifest.assetRelease).toBe("v1.0.0");
    expect(activeManifest.gameVersion).toBe("3.0.x");
    expect(Array.isArray(activeManifest.assets)).toBe(true);
    expect(activeManifest.assets.length).toBe(52);

    // Verify each record has required fields and truthful dev status
    for (const asset of activeManifest.assets) {
      expect(asset.id).toBeTruthy();
      expect(asset.entityType).toBeTruthy();
      expect(asset.entityId).toBeTruthy();
      expect(asset.localPath.startsWith("/src/dev/game-assets/")).toBe(true);
      expect(asset.license).toBeTruthy();
      expect(asset.copyrightOwner).toBeTruthy();
      expect(asset.usageStatus).toBe("manual_review");
      expect(asset.checksum).toBeTruthy();
    }
  });

  it("synchronously resolves known assets across categories in dev", () => {
    // Character Icon
    const acheronUrl = getAssetUrl("character_icon", "acheron", "icon");
    expect(acheronUrl).toBe("/src/dev/game-assets/v1.0.0/characters/acheron_icon.png");

    // Element Icon
    const lightningUrl = getAssetUrl("element_icon", "Lightning", "icon");
    expect(lightningUrl).toBe("/src/dev/game-assets/v1.0.0/elements/Lightning.png");

    // Path Icon
    const nihilityUrl = getAssetUrl("path_icon", "Nihility", "icon");
    expect(nihilityUrl).toBe("/src/dev/game-assets/v1.0.0/paths/Nihility.png");

    // Light Cone Icon
    const lcUrl = getAssetUrl("light_cone_icon", "along-the-passing-shore", "icon");
    expect(lcUrl).toBe(
      "/src/dev/game-assets/v1.0.0/light-cones/along_the_passing_shore.png"
    );
  });

  it("verifies all 8 representative characters have verified preview and icon assets in dev", () => {
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
    expect(img).toHaveAttribute(
      "src",
      "/src/dev/game-assets/v1.0.0/elements/Quantum.png"
    );
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
    const fallback = screen.getByRole("img", {
      name: "Missing Hero Fallback (Asset unavailable)",
    });
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
