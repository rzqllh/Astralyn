import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import {
  RootKnowledgeManifestSchema,
  KnowledgeReleaseManifestSchema,
  CharacterKnowledgeSchema,
  LightConeKnowledgeSchema,
  RelicSetKnowledgeSchema,
  EnemyKnowledgeSchema,
  StageKnowledgeSchema,
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
  AssetManifestSchema,
  type CharacterKnowledge,
  type LightConeKnowledge,
  type RelicSetKnowledge,
  type EnemyKnowledge,
  type StageKnowledge,
  type DUBlessingKnowledge,
  type DUEquationKnowledge,
  type DUCurioKnowledge,
} from "@astralyn/shared";

const DATA_DIR = path.resolve(__dirname, "../apps/web/public/data");
const ASSET_MANIFEST_PATH = path.resolve(
  __dirname,
  "../apps/web/public/game-assets/v1.0.0/manifest.json"
);

function computeSha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function checkKnowledgeIntegrity(): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  console.log("[Astralyn Knowledge Integrity Checker] Starting validation...");

  // 1. Check Root manifest.json
  const rootManifestPath = path.join(DATA_DIR, "manifest.json");
  if (!fs.existsSync(rootManifestPath)) {
    errors.push(`Missing root knowledge manifest at ${rootManifestPath}`);
    return { success: false, errors };
  }

  let rootManifest;
  try {
    const rawRoot = fs.readFileSync(rootManifestPath, "utf8");
    const parsedRoot = JSON.parse(rawRoot);
    rootManifest = RootKnowledgeManifestSchema.parse(parsedRoot);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Root knowledge manifest validation failed: ${message}`);
    return { success: false, errors };
  }

  const activeVersion = rootManifest.currentKnowledgeVersion;
  console.log(`  - Root manifest valid (Active Version: ${activeVersion})`);

  // 2. Check Release Directory & release.json
  const releaseDir = path.join(DATA_DIR, activeVersion);
  if (!fs.existsSync(releaseDir)) {
    errors.push(`Release directory not found at ${releaseDir}`);
    return { success: false, errors };
  }

  const releaseManifestPath = path.join(releaseDir, "release.json");
  if (!fs.existsSync(releaseManifestPath)) {
    errors.push(`Release manifest missing at ${releaseManifestPath}`);
    return { success: false, errors };
  }

  let releaseManifest;
  try {
    const rawRelease = fs.readFileSync(releaseManifestPath, "utf8");
    const parsedRelease = JSON.parse(rawRelease);
    releaseManifest = KnowledgeReleaseManifestSchema.parse(parsedRelease);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Release manifest validation failed: ${message}`);
    return { success: false, errors };
  }

  if (releaseManifest.knowledgeVersion !== activeVersion) {
    errors.push(
      `Version mismatch: Root manifest claims ${activeVersion} but release.json has ${releaseManifest.knowledgeVersion}`
    );
  }

  // 3. Verify all release files and checksums
  let characters: CharacterKnowledge[] = [];
  let lightCones: LightConeKnowledge[] = [];
  let relics: RelicSetKnowledge[] = [];
  let enemies: EnemyKnowledge[] = [];
  let stages: StageKnowledge[] = [];
  let duBlessings: DUBlessingKnowledge[] = [];
  let duEquations: DUEquationKnowledge[] = [];
  let duCurios: DUCurioKnowledge[] = [];

  for (const fileEntry of releaseManifest.files) {
    const filePath = path.join(releaseDir, fileEntry.filename);
    if (!fs.existsSync(filePath)) {
      errors.push(`Required release file missing on disk: ${filePath}`);
      continue;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const actualChecksum = computeSha256(fileContent);

    if (actualChecksum !== fileEntry.checksum) {
      errors.push(
        `Checksum mismatch for ${fileEntry.filename}: manifest=${fileEntry.checksum}, actual=${actualChecksum}`
      );
    }

    if (releaseManifest.checksums[fileEntry.filename] !== actualChecksum) {
      errors.push(
        `Manifest checksums record mismatch for ${fileEntry.filename}: recorded=${releaseManifest.checksums[fileEntry.filename]}, actual=${actualChecksum}`
      );
    }

    // Parse and validate individual file contents
    try {
      const jsonContent = JSON.parse(fileContent);

      if (fileEntry.filename === "characters.json") {
        if (!Array.isArray(jsonContent)) {
          errors.push("characters.json must be an array");
        } else {
          characters = jsonContent.map((item, idx) => {
            try {
              return CharacterKnowledgeSchema.parse(item);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              errors.push(
                `Character at index ${idx} ('${item?.id}') failed validation: ${msg}`
              );
              return item;
            }
          });
        }
      } else if (fileEntry.filename === "light-cones.json") {
        if (!Array.isArray(jsonContent)) {
          errors.push("light-cones.json must be an array");
        } else {
          lightCones = jsonContent.map((item, idx) => {
            try {
              return LightConeKnowledgeSchema.parse(item);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              errors.push(
                `Light cone at index ${idx} ('${item?.id}') failed validation: ${msg}`
              );
              return item;
            }
          });
        }
      } else if (fileEntry.filename === "relics.json") {
        if (!Array.isArray(jsonContent)) {
          errors.push("relics.json must be an array");
        } else {
          relics = jsonContent.map((item, idx) => {
            try {
              return RelicSetKnowledgeSchema.parse(item);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              errors.push(
                `Relic set at index ${idx} ('${item?.id}') failed validation: ${msg}`
              );
              return item;
            }
          });
        }
      } else if (fileEntry.filename === "enemies.json") {
        if (!Array.isArray(jsonContent)) {
          errors.push("enemies.json must be an array");
        } else {
          enemies = jsonContent.map((item, idx) => {
            try {
              return EnemyKnowledgeSchema.parse(item);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              errors.push(
                `Enemy at index ${idx} ('${item?.id}') failed validation: ${msg}`
              );
              return item;
            }
          });
        }
      } else if (fileEntry.filename === "stages.json") {
        if (!Array.isArray(jsonContent)) {
          errors.push("stages.json must be an array");
        } else {
          stages = jsonContent.map((item, idx) => {
            try {
              return StageKnowledgeSchema.parse(item);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              errors.push(
                `Stage at index ${idx} ('${item?.id}') failed validation: ${msg}`
              );
              return item;
            }
          });
        }
      } else if (fileEntry.filename === "divergent-universe.json") {
        if (typeof jsonContent !== "object" || jsonContent === null) {
          errors.push(
            "divergent-universe.json must be an object with blessings, equations, curios"
          );
        } else {
          duBlessings = (jsonContent.blessings || []).map((item: unknown) =>
            DUBlessingKnowledgeSchema.parse(item)
          );
          duEquations = (jsonContent.equations || []).map((item: unknown) =>
            DUEquationKnowledgeSchema.parse(item)
          );
          duCurios = (jsonContent.curios || []).map((item: unknown) =>
            DUCurioKnowledgeSchema.parse(item)
          );
        }
      }
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      errors.push(`JSON syntax error in ${fileEntry.filename}: ${msg}`);
    }
  }

  // 4. Validate unique IDs and referential relationships
  const uniqueIdSet = new Set<string>();
  const allCollections = [
    { name: "characters", items: characters },
    { name: "light-cones", items: lightCones },
    { name: "relics", items: relics },
    { name: "enemies", items: enemies },
    { name: "stages", items: stages },
    { name: "du-blessings", items: duBlessings },
    { name: "du-equations", items: duEquations },
    { name: "du-curios", items: duCurios },
  ];

  for (const col of allCollections) {
    for (const item of col.items) {
      if (uniqueIdSet.has(item.id)) {
        errors.push(
          `Duplicate canonical ID detected: '${item.id}' in collection '${col.name}'`
        );
      }
      uniqueIdSet.add(item.id);
    }
  }

  const enemyIdSet = new Set(enemies.map((e) => e.id));
  for (const stage of stages) {
    for (const wave of stage.waves) {
      for (const enemyId of wave.enemies) {
        if (!enemyIdSet.has(enemyId)) {
          errors.push(
            `Broken referential integrity: Stage '${stage.id}' references unknown enemy '${enemyId}'`
          );
        }
      }
    }
  }

  // 5. Interoperability with Visual Asset Manifest
  if (fs.existsSync(ASSET_MANIFEST_PATH)) {
    try {
      const rawAssetManifest = fs.readFileSync(ASSET_MANIFEST_PATH, "utf8");
      const parsedAssetManifest = AssetManifestSchema.parse(JSON.parse(rawAssetManifest));
      const assetEntityIds = new Set(parsedAssetManifest.assets.map((a) => a.entityId));

      // Verify each canonical character ID has corresponding visual asset entries
      for (const char of characters) {
        if (!assetEntityIds.has(char.id)) {
          console.warn(
            `  [Warning] Canonical Character '${char.id}' has no matching asset entity in ${parsedAssetManifest.assetRelease}`
          );
        }
      }
      console.log(
        `  - Visual asset manifest interoperability verified (${parsedAssetManifest.assets.length} assets checked)`
      );
    } catch (assetErr: unknown) {
      console.warn(
        `  [Warning] Could not verify asset manifest interoperability: ${assetErr}`
      );
    }
  }

  const success = errors.length === 0;
  if (success) {
    console.log(
      `[Astralyn Knowledge Integrity Checker] PASS: All knowledge snapshot contracts verified for ${activeVersion}`
    );
  } else {
    console.error(
      `[Astralyn Knowledge Integrity Checker] FAIL: Found ${errors.length} integrity violations:`
    );
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
  }

  return { success, errors };
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("check-knowledge"))
) {
  const result = checkKnowledgeIntegrity();
  if (!result.success) {
    process.exit(1);
  }
}
