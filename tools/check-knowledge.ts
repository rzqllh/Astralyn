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
  REQUIRED_KNOWLEDGE_FILENAMES,
  validateKnowledgeReleaseConsistency,
  SemVerCoreSchema,
  type RequiredKnowledgeFilename,
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
  type CharacterKnowledge,
  type LightConeKnowledge,
  type RelicSetKnowledge,
  type EnemyKnowledge,
  type StageKnowledge,
  type DUBlessingKnowledge,
  type DUEquationKnowledge,
  type DUCurioKnowledge,
} from "@astralyn/shared";

const DEFAULT_DATA_DIR = path.resolve(__dirname, "../apps/web/public/data");
const DEFAULT_ASSET_MANIFEST_PATH = path.resolve(
  __dirname,
  "../apps/web/public/game-assets/v1.0.0/manifest.json"
);
const WEB_PKG_PATH = path.resolve(__dirname, "../apps/web/package.json");

function computeSha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function getDefaultAppVersion(): string {
  try {
    const raw = fs.readFileSync(WEB_PKG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return SemVerCoreSchema.parse(parsed.version);
  } catch {
    return "0.0.1";
  }
}

export interface CheckKnowledgeOptions {
  dataDir?: string;
  assetManifestPath?: string;
  appVersion?: string;
  silent?: boolean;
}

export interface CheckKnowledgeResult {
  success: boolean;
  errors: string[];
  activeVersion?: string;
  rootManifest?: RootKnowledgeManifest;
  releaseManifest?: KnowledgeReleaseManifest;
}

export function checkKnowledgeIntegrity(
  options: CheckKnowledgeOptions = {}
): CheckKnowledgeResult {
  const dataDir = options.dataDir ?? DEFAULT_DATA_DIR;
  const assetManifestPath = options.assetManifestPath ?? DEFAULT_ASSET_MANIFEST_PATH;
  const appVersion = options.appVersion ?? getDefaultAppVersion();
  const silent = options.silent ?? false;

  const log = (msg: string) => {
    if (!silent) console.log(msg);
  };
  const logWarn = (msg: string) => {
    if (!silent) console.warn(msg);
  };
  const logError = (msg: string) => {
    if (!silent) console.error(msg);
  };

  const errors: string[] = [];
  log("[Astralyn Knowledge Integrity Checker] Starting validation...");

  // 1. Check Root manifest.json
  const rootManifestPath = path.join(dataDir, "manifest.json");
  if (!fs.existsSync(rootManifestPath)) {
    errors.push(`Missing root knowledge manifest at ${rootManifestPath}`);
    return { success: false, errors };
  }

  let rootManifest: RootKnowledgeManifest;
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
  log(`  - Root manifest valid (Active Version: ${activeVersion})`);

  // 2. Check Release Directory & release.json
  const releaseDir = path.join(dataDir, activeVersion);
  if (!fs.existsSync(releaseDir)) {
    errors.push(`Release directory not found at ${releaseDir}`);
    return { success: false, errors, activeVersion, rootManifest };
  }

  const releaseManifestPath = path.join(releaseDir, "release.json");
  if (!fs.existsSync(releaseManifestPath)) {
    errors.push(`Release manifest missing at ${releaseManifestPath}`);
    return { success: false, errors, activeVersion, rootManifest };
  }

  let releaseManifest: KnowledgeReleaseManifest;
  try {
    const rawRelease = fs.readFileSync(releaseManifestPath, "utf8");
    const parsedRelease = JSON.parse(rawRelease);
    releaseManifest = KnowledgeReleaseManifestSchema.parse(parsedRelease);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Release manifest validation failed: ${message}`);
    return { success: false, errors, activeVersion, rootManifest };
  }

  // 3. Verify all canonical release files, sizes, checksums, and entity counts
  let characters: CharacterKnowledge[] = [];
  let lightCones: LightConeKnowledge[] = [];
  let relics: RelicSetKnowledge[] = [];
  let enemies: EnemyKnowledge[] = [];
  let stages: StageKnowledge[] = [];
  let duBlessings: DUBlessingKnowledge[] = [];
  let duEquations: DUEquationKnowledge[] = [];
  let duCurios: DUCurioKnowledge[] = [];

  const entityCounts: Record<RequiredKnowledgeFilename, number> = {
    "characters.json": 0,
    "light-cones.json": 0,
    "relics.json": 0,
    "enemies.json": 0,
    "stages.json": 0,
    "divergent-universe.json": 0,
  };

  for (const filename of REQUIRED_KNOWLEDGE_FILENAMES) {
    const filePath = path.join(releaseDir, filename);
    if (!fs.existsSync(filePath)) {
      errors.push(`Required release file missing on disk: ${filePath}`);
      continue;
    }

    const fileEntry = releaseManifest.files.find((f) => f.filename === filename);
    if (!fileEntry) {
      errors.push(
        `Required file '${filename}' missing from release manifest files array`
      );
      continue;
    }

    const rawBuffer = fs.readFileSync(filePath);
    const actualSizeBytes = rawBuffer.byteLength;
    const actualChecksum = computeSha256(rawBuffer);

    if (actualSizeBytes !== fileEntry.sizeBytes) {
      errors.push(
        `Byte size mismatch for ${filename}: manifest=${fileEntry.sizeBytes}, actual=${actualSizeBytes}`
      );
    }

    if (actualChecksum !== fileEntry.checksum) {
      errors.push(
        `Checksum mismatch for ${filename}: manifest=${fileEntry.checksum}, actual=${actualChecksum}`
      );
    }

    if (releaseManifest.checksums[filename] !== actualChecksum) {
      errors.push(
        `Manifest checksums record mismatch for ${filename}: recorded=${releaseManifest.checksums[filename]}, actual=${actualChecksum}`
      );
    }

    const fileContent = rawBuffer.toString("utf8");

    // Parse and validate individual file contents
    try {
      const jsonContent = JSON.parse(fileContent);

      if (filename === "characters.json") {
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
          entityCounts["characters.json"] = characters.length;
        }
      } else if (filename === "light-cones.json") {
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
          entityCounts["light-cones.json"] = lightCones.length;
        }
      } else if (filename === "relics.json") {
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
          entityCounts["relics.json"] = relics.length;
        }
      } else if (filename === "enemies.json") {
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
          entityCounts["enemies.json"] = enemies.length;
        }
      } else if (filename === "stages.json") {
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
          entityCounts["stages.json"] = stages.length;
        }
      } else if (filename === "divergent-universe.json") {
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
          entityCounts["divergent-universe.json"] =
            duBlessings.length + duEquations.length + duCurios.length;
        }
      }
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      errors.push(`JSON syntax error in ${filename}: ${msg}`);
    }
  }

  // 4. Validate sourceSnapshotHash derivation from canonical checksums
  let combinedChecksums = "";
  for (const filename of REQUIRED_KNOWLEDGE_FILENAMES) {
    combinedChecksums += releaseManifest.checksums[filename] ?? "";
  }
  const computedSourceSnapshotHash = computeSha256(combinedChecksums);
  if (computedSourceSnapshotHash !== releaseManifest.sourceSnapshotHash) {
    errors.push(
      `Source snapshot hash mismatch: manifest claims '${releaseManifest.sourceSnapshotHash}' but SHA-256 of canonical checksums is '${computedSourceSnapshotHash}'`
    );
  }

  // 5. Cross-document and entity count consistency validation
  const consistencyErrors = validateKnowledgeReleaseConsistency({
    rootManifest,
    releaseManifest,
    entityCounts,
    appVersion,
  });
  errors.push(...consistencyErrors);

  // 6. Validate unique IDs, provenance, and referential relationships
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

      // Verify Tier A provenance
      if (
        !("provenance" in item) ||
        (item.provenance.authorityTier !== "tier_a_official" && item.provenance.authorityTier !== "tier_b_structured_community")
      ) {
        errors.push(
          `Missing or invalid Tier A provenance on entity '${item.id}' in collection '${col.name}'`
        );
      }
    }
  }

  const enemyIdSet = new Set(enemies.map((e) => e.id));
  for (const stage of stages) {
    if (!stage.rotationId) {
      errors.push(
        `Stage '${stage.id}' is missing required 'rotationId' for temporality.`
      );
    }
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

  // 7. Interoperability with Visual Asset Manifest
  if (fs.existsSync(assetManifestPath)) {
    try {
      const rawAssetManifest = fs.readFileSync(assetManifestPath, "utf8");
      const parsedAssetManifest = AssetManifestSchema.parse(JSON.parse(rawAssetManifest));
      const assetEntityIds = new Set(parsedAssetManifest.assets.map((a) => a.entityId));

      for (const char of characters) {
        if (!assetEntityIds.has(char.id)) {
          logWarn(
            `  [Warning] Canonical Character '${char.id}' has no matching asset entity in ${parsedAssetManifest.assetRelease}`
          );
        }
      }
      log(
        `  - Visual asset manifest interoperability verified (${parsedAssetManifest.assets.length} assets checked)`
      );
    } catch (assetErr: unknown) {
      logWarn(
        `  [Warning] Could not verify asset manifest interoperability: ${assetErr}`
      );
    }
  }

  const success = errors.length === 0;
  if (success) {
    log(
      `[Astralyn Knowledge Integrity Checker] PASS: All knowledge snapshot contracts verified for ${activeVersion}`
    );
  } else {
    logError(
      `[Astralyn Knowledge Integrity Checker] FAIL: Found ${errors.length} integrity violations:`
    );
    for (const err of errors) {
      logError(`  - ${err}`);
    }
  }

  return {
    success,
    errors,
    activeVersion,
    rootManifest,
    releaseManifest,
  };
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
