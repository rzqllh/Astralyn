import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as prettier from "prettier";
import {
  CharacterKnowledgeSchema,
  LightConeKnowledgeSchema,
  RelicSetKnowledgeSchema,
  EnemyKnowledgeSchema,
  StageKnowledgeSchema,
  DUBlessingKnowledgeSchema,
  DUEquationKnowledgeSchema,
  DUCurioKnowledgeSchema,
  KnowledgeReleaseManifestSchema,
  RootKnowledgeManifestSchema,
  SemVerCoreSchema,
  assertKnowledgeReleaseConsistency,
  type RequiredKnowledgeFilename,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  type KnowledgeFileEntry,
  type KnowledgeReleaseManifest,
  type RootKnowledgeManifest,
} from "@astralyn/shared";

const KNOWLEDGE_VERSION = "v1.0.0";
const GAME_VERSION = "4.5";
const SCHEMA_VERSION = "1.0.0";

const DATA_DIR = path.resolve(__dirname, "../apps/web/public/data");
const RELEASE_DIR = path.join(DATA_DIR, KNOWLEDGE_VERSION);
const WEB_PKG_PATH = path.resolve(__dirname, "../apps/web/package.json");

function computeSha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function deterministicSortById<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

function getWebPackageVersion(): string {
  const rawPkg = fs.readFileSync(WEB_PKG_PATH, "utf8");
  const pkg = JSON.parse(rawPkg);
  return SemVerCoreSchema.parse(pkg.version);
}

export async function buildKnowledgeRelease(): Promise<{
  manifest: RootKnowledgeManifest;
  releaseManifest: KnowledgeReleaseManifest;
}> {
  const minAppVersion = getWebPackageVersion();
  console.log(
    `[Astralyn Knowledge Builder] Initializing build for release ${KNOWLEDGE_VERSION} (Game Version: ${GAME_VERSION}, Min App Version: ${minAppVersion})...`
  );

  const args = process.argv.slice(2);
  const useD1 = args.includes("--source=d1");

  const charactersRaw = CANONICAL_CHARACTERS;
  const lightConesRaw = CANONICAL_LIGHT_CONES;
  const relicsRaw = CANONICAL_RELICS;
  const enemiesRaw = CANONICAL_ENEMIES;
  const stagesRaw = CANONICAL_STAGES;
  const duBlessingsRaw = CANONICAL_DU_BLESSINGS;
  const duEquationsRaw = CANONICAL_DU_EQUATIONS;
  const duCuriosRaw = CANONICAL_DU_CURIOS;

  if (useD1) {
    console.log(`[Astralyn Knowledge Builder] Fetching release from D1 API...`);
    try {
      const secret = process.env.INTERNAL_BUILDER_SECRET;
      if (!secret) {
        throw new Error("INTERNAL_BUILDER_SECRET environment variable is missing");
      }
      const res = await fetch("http://127.0.0.1:8787/api/_internal/export-release", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (!res.ok) {
        throw new Error(`Worker API returned ${res.status}`);
      }
      const data = await res.json();
      if (data.status !== "published") {
        throw new Error(`Worker API returned non-published release status: ${data.status}`);
      }
      console.log(
        `[Astralyn Knowledge Builder] Successfully fetched release from D1 (Version: ${data.version})`
      );
      // In a real implementation, we would map `data` over the raw variables here.
      // For this architecture proof, we fall back to the canonical fixtures.
    } catch (err) {
      console.warn(
        `[Astralyn Knowledge Builder] Failed to fetch from D1, falling back to fixtures:`,
        err
      );
    }
  }

  // 1. Validate all source fixtures through Zod 4 schemas
  const characters = deterministicSortById(
    charactersRaw.map((char) => CharacterKnowledgeSchema.parse(char))
  );
  const lightCones = deterministicSortById(
    lightConesRaw.map((lc) => LightConeKnowledgeSchema.parse(lc))
  );
  const relics = deterministicSortById(
    relicsRaw.map((r) => RelicSetKnowledgeSchema.parse(r))
  );
  const enemies = deterministicSortById(
    enemiesRaw.map((e) => EnemyKnowledgeSchema.parse(e))
  );
  const stages = deterministicSortById(
    stagesRaw.map((s) => StageKnowledgeSchema.parse(s))
  );
  const duBlessings = deterministicSortById(
    duBlessingsRaw.map((b) => DUBlessingKnowledgeSchema.parse(b))
  );
  const duEquations = deterministicSortById(
    duEquationsRaw.map((eq) => DUEquationKnowledgeSchema.parse(eq))
  );
  const duCurios = deterministicSortById(
    duCuriosRaw.map((c) => DUCurioKnowledgeSchema.parse(c))
  );

  // 2. Provenance and Referential integrity validation
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
      if (
        !("provenance" in item) ||
        (item.provenance.authorityTier !== "tier_a_official" && item.provenance.authorityTier !== "tier_b_structured_community")
      ) {
        throw new Error(
          `Provenance Violation: Entity '${item.id}' in '${col.name}' is missing Tier A official provenance grounding.`
        );
      }
    }
  }

  const enemyIdSet = new Set(enemies.map((e) => e.id));
  for (const stage of stages) {
    if (!stage.rotationId) {
      throw new Error(
        `Stage Temporality Error: Stage '${stage.id}' is missing rotationId.`
      );
    }
    for (const wave of stage.waves) {
      for (const enemyId of wave.enemies) {
        if (!enemyIdSet.has(enemyId)) {
          throw new Error(
            `Referential Integrity Error: Stage '${stage.id}' references unknown enemy '${enemyId}'`
          );
        }
      }
    }
  }

  // Check unique IDs across all collections
  const uniqueIdSet = new Set<string>();
  for (const col of allCollections) {
    for (const item of col.items) {
      if (uniqueIdSet.has(item.id)) {
        throw new Error(
          `Duplicate ID Detected: '${item.id}' in collection '${col.name}' is already defined`
        );
      }
      uniqueIdSet.add(item.id);
    }
  }

  // 3. Ensure target directory exists
  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR, { recursive: true });
  }

  // 4. Serialize entity data files in REQUIRED_KNOWLEDGE_FILENAMES canonical order
  const filesPayloads: {
    filename: RequiredKnowledgeFilename;
    count: number;
    raw: unknown;
  }[] = [
    {
      filename: "characters.json",
      count: characters.length,
      raw: characters,
    },
    {
      filename: "light-cones.json",
      count: lightCones.length,
      raw: lightCones,
    },
    {
      filename: "relics.json",
      count: relics.length,
      raw: relics,
    },
    {
      filename: "enemies.json",
      count: enemies.length,
      raw: enemies,
    },
    {
      filename: "stages.json",
      count: stages.length,
      raw: stages,
    },
    {
      filename: "divergent-universe.json",
      count: duBlessings.length + duEquations.length + duCurios.length,
      raw: {
        blessings: duBlessings,
        equations: duEquations,
        curios: duCurios,
      },
    },
  ];

  const fileEntries: KnowledgeFileEntry[] = [];
  const checksums: Record<string, string> = {};

  let combinedSourceContent = "";

  for (const file of filesPayloads) {
    const filePath = path.join(RELEASE_DIR, file.filename);
    const formatted = await prettier.format(JSON.stringify(file.raw), {
      filepath: filePath,
    });
    fs.writeFileSync(filePath, formatted, "utf8");
    const hash = computeSha256(formatted);
    const size = Buffer.byteLength(formatted, "utf8");

    checksums[file.filename] = hash;
    fileEntries.push({
      filename: file.filename,
      relPath: `${KNOWLEDGE_VERSION}/${file.filename}`,
      entityCount: file.count,
      sizeBytes: size,
      checksum: hash,
    });

    combinedSourceContent += hash;
  }

  const sourceSnapshotHash = computeSha256(combinedSourceContent);
  const nowIso = "2026-08-27T00:00:00.000Z";

  // 5. Create and validate release.json
  const releaseManifest: KnowledgeReleaseManifest = {
    knowledgeVersion: KNOWLEDGE_VERSION,
    gameVersion: GAME_VERSION,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: nowIso,
    sourceSnapshotHash,
    status: "published",
    files: fileEntries,
    checksums,
    compatibility: {
      minAppVersion,
    },
  };

  KnowledgeReleaseManifestSchema.parse(releaseManifest);

  // 6. Create and validate root manifest.json
  const rootManifest: RootKnowledgeManifest = {
    currentKnowledgeVersion: KNOWLEDGE_VERSION,
    gameVersion: GAME_VERSION,
    schemaVersion: SCHEMA_VERSION,
    publishedAt: nowIso,
    availableReleases: [KNOWLEDGE_VERSION],
    releases: {
      [KNOWLEDGE_VERSION]: releaseManifest,
    },
  };

  RootKnowledgeManifestSchema.parse(rootManifest);

  // 7. Assert cross-document and entity count consistency before writing final files
  const entityCounts: Record<RequiredKnowledgeFilename, number> = {
    "characters.json": characters.length,
    "light-cones.json": lightCones.length,
    "relics.json": relics.length,
    "enemies.json": enemies.length,
    "stages.json": stages.length,
    "divergent-universe.json": duBlessings.length + duEquations.length + duCurios.length,
  };

  assertKnowledgeReleaseConsistency({
    rootManifest,
    releaseManifest,
    entityCounts,
    appVersion: minAppVersion,
  });

  const releaseFilePath = path.join(RELEASE_DIR, "release.json");
  const releaseManifestFormatted = await prettier.format(
    JSON.stringify(releaseManifest),
    { filepath: releaseFilePath }
  );
  fs.writeFileSync(releaseFilePath, releaseManifestFormatted, "utf8");

  const rootManifestPath = path.join(DATA_DIR, "manifest.json");
  const rootManifestFormatted = await prettier.format(JSON.stringify(rootManifest), {
    filepath: rootManifestPath,
  });
  fs.writeFileSync(rootManifestPath, rootManifestFormatted, "utf8");

  console.log(
    `[Astralyn Knowledge Builder] Successfully built release ${KNOWLEDGE_VERSION}:`
  );
  console.log(
    `  - Characters: ${characters.length} (including Version 4.5 Elation fixture)`
  );
  console.log(`  - Light Cones: ${lightCones.length}`);
  console.log(`  - Relic Sets: ${relics.length}`);
  console.log(`  - Enemies: ${enemies.length}`);
  console.log(`  - Stages: ${stages.length}`);
  console.log(`  - DU Blessings: ${duBlessings.length}`);
  console.log(`  - DU Equations: ${duEquations.length}`);
  console.log(`  - DU Curios: ${duCurios.length}`);
  console.log(`  - Output: ${RELEASE_DIR}`);

  return { manifest: rootManifest, releaseManifest };
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("build-knowledge"))
) {
  buildKnowledgeRelease().catch((err) => {
    console.error("[Astralyn Knowledge Builder] Build failed:", err);
    process.exit(1);
  });
}
