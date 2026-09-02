import "fake-indexeddb/auto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { AstralynKnowledgeDB } from "../apps/web/src/lib/knowledge/db";
import { KnowledgeRepository } from "../apps/web/src/lib/knowledge/repository";
import { KnowledgeSnapshotLoader } from "../apps/web/src/lib/knowledge/loader";
import {
  REQUIRED_KNOWLEDGE_FILENAMES,
  CANONICAL_CHARACTERS,
  CANONICAL_LIGHT_CONES,
  CANONICAL_RELICS,
  CANONICAL_ENEMIES,
  CANONICAL_STAGES,
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  type RootKnowledgeManifest,
  type KnowledgeReleaseManifest,
} from "@astralyn/shared";
import { checkKnowledgeIntegrity } from "./check-knowledge";

// Performance target budgets from Phase 2 Architecture Specification
export const TARGET_BUDGETS = {
  maxTotalSnapshotGzipBytes: 1.5 * 1024 * 1024, // 1.5 MB
  maxInitialSyncLatencyMs: 50.0, // 50ms
  maxSingleItemGetLatencyMs: 2.0, // 2ms
  maxCollectionFilterLatencyMs: 5.0, // 5ms
  maxNormalizedSearchLatencyMs: 10.0, // 10ms
};

const DEFAULT_DATA_DIR = path.resolve(__dirname, "../apps/web/public/data");

export interface BenchmarkOptions {
  dataDir?: string;
  targetBudgets?: Partial<typeof TARGET_BUDGETS>;
  syncIterations?: number;
  queryIterations?: number;
  silent?: boolean;
  logger?: {
    log: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface BenchmarkResult {
  success: boolean;
  failures: string[];
  totalRawBytes: number;
  totalGzipBytes: number;
  avgSyncLatencyMs: number;
  avgGetLatencyMs: number;
  avgFilterLatencyMs: number;
  avgSearchLatencyMs: number;
}

function createBenchmarkMockLoader(
  rootManifest: RootKnowledgeManifest,
  releaseManifest: KnowledgeReleaseManifest
): KnowledgeSnapshotLoader {
  const loader = new KnowledgeSnapshotLoader();
  loader.fetchRootManifest = async () => rootManifest;
  loader.fetchReleaseManifest = async () => releaseManifest;
  loader.loadFullRelease = async () => {
    return {
      manifest: rootManifest,
      releaseManifest,
      characters: CANONICAL_CHARACTERS,
      lightCones: CANONICAL_LIGHT_CONES,
      relicSets: CANONICAL_RELICS,
      enemies: CANONICAL_ENEMIES,
      stages: CANONICAL_STAGES,
      duBlessings: CANONICAL_DU_BLESSINGS,
      duEquations: CANONICAL_DU_EQUATIONS,
      duCurios: CANONICAL_DU_CURIOS,
    };
  };
  return loader;
}

export async function runKnowledgeBenchmark(
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const dataDir = options.dataDir ?? DEFAULT_DATA_DIR;
  const budgets = { ...TARGET_BUDGETS, ...options.targetBudgets };
  const syncIterations = options.syncIterations ?? 10;
  const queryIterations = options.queryIterations ?? 1000;
  const silent = options.silent ?? false;

  const logger = options.logger ?? {
    log: (msg: string) => {
      if (!silent) console.log(msg);
    },
    warn: (msg: string) => {
      if (!silent) console.warn(msg);
    },
    error: (msg: string) => {
      if (!silent) console.error(msg);
    },
  };

  const failures: string[] = [];

  logger.log(
    "================================================================================"
  );
  logger.log("             ASTRALYN CANONICAL KNOWLEDGE BENCHMARK SUITE");
  logger.log(
    "================================================================================\n"
  );

  // --------------------------------------------------------------------------
  // 0. Preflight: Knowledge Integrity Check
  // --------------------------------------------------------------------------
  const preflight = checkKnowledgeIntegrity({ dataDir, silent: true });
  if (
    !preflight.success ||
    !preflight.activeVersion ||
    !preflight.rootManifest ||
    !preflight.releaseManifest
  ) {
    const errorList = preflight.errors.join("; ");
    failures.push(`Preflight integrity check failed: ${errorList}`);
    logger.error(`[Benchmark Preflight FAIL] ${errorList}`);

    logger.log(
      "\n================================================================================"
    );
    logger.error("                 BENCHMARK CRITERIA FAILED (FAIL)");
    logger.log(
      "================================================================================\n"
    );

    return {
      success: false,
      failures,
      totalRawBytes: 0,
      totalGzipBytes: 0,
      avgSyncLatencyMs: 0,
      avgGetLatencyMs: 0,
      avgFilterLatencyMs: 0,
      avgSearchLatencyMs: 0,
    };
  }

  const activeVersion = preflight.activeVersion;
  const releaseDir = path.join(dataDir, activeVersion);
  const rootManifest = preflight.rootManifest;
  const releaseManifest = preflight.releaseManifest;

  // --------------------------------------------------------------------------
  // 1. Static Snapshot File Sizes & Compression
  // --------------------------------------------------------------------------
  logger.log(`--- 1. STATIC SNAPSHOT FILE SIZES (${activeVersion} Baseline) ---`);
  const benchmarkFiles = [...REQUIRED_KNOWLEDGE_FILENAMES, "release.json"];

  let totalRawBytes = 0;
  let totalGzipBytes = 0;

  logger.log(
    `| ${"File".padEnd(26)} | ${"Raw Size (bytes)".padEnd(16)} | ${"Gzip Size (bytes)".padEnd(18)} | Ratio | Status |`
  );
  logger.log(
    "|----------------------------|------------------|--------------------|-------|--------|"
  );

  for (const filename of benchmarkFiles) {
    const filePath = path.join(releaseDir, filename);
    if (!fs.existsSync(filePath)) {
      failures.push(`Missing release file on disk: ${filePath}`);
      logger.error(`Missing file: ${filePath}`);
      continue;
    }
    const rawBuffer = fs.readFileSync(filePath);
    const gzipBuffer = zlib.gzipSync(rawBuffer);

    totalRawBytes += rawBuffer.length;
    totalGzipBytes += gzipBuffer.length;

    const ratio = ((gzipBuffer.length / rawBuffer.length) * 100).toFixed(1) + "%";
    logger.log(
      `| ${filename.padEnd(26)} | ${rawBuffer.length.toString().padStart(16)} | ${gzipBuffer.length.toString().padStart(18)} | ${ratio.padStart(5)} | [MEASURED] |`
    );
  }

  const rootManifestPath = path.join(dataDir, "manifest.json");
  if (fs.existsSync(rootManifestPath)) {
    const rawRoot = fs.readFileSync(rootManifestPath);
    const gzipRoot = zlib.gzipSync(rawRoot);
    totalRawBytes += rawRoot.length;
    totalGzipBytes += gzipRoot.length;
    logger.log(
      `| ${"manifest.json (root)".padEnd(26)} | ${rawRoot.length.toString().padStart(16)} | ${gzipRoot.length.toString().padStart(18)} | ${((gzipRoot.length / rawRoot.length) * 100).toFixed(1)}% | [MEASURED] |`
    );
  } else {
    failures.push(`Missing root manifest file at ${rootManifestPath}`);
  }

  logger.log(
    "|----------------------------|------------------|--------------------|-------|--------|"
  );
  logger.log(
    `| ${"TOTAL SNAPSHOT".padEnd(26)} | ${(totalRawBytes / 1024).toFixed(2).padStart(13)} KB | ${(totalGzipBytes / 1024).toFixed(2).padStart(15)} KB |       | [MEASURED] |`
  );

  const gzipBudgetPassed = totalGzipBytes < budgets.maxTotalSnapshotGzipBytes;
  if (!gzipBudgetPassed) {
    failures.push(
      `Total snapshot gzip size (${(totalGzipBytes / 1024).toFixed(2)} KB) exceeded budget (< ${(budgets.maxTotalSnapshotGzipBytes / 1024).toFixed(2)} KB)`
    );
  }

  logger.log(
    `  Target Budget: < ${(budgets.maxTotalSnapshotGzipBytes / 1024 / 1024).toFixed(2)} MB gzipped -> Status: ${
      gzipBudgetPassed ? "PASS" : "FAIL"
    }\n`
  );

  // --------------------------------------------------------------------------
  // 2. Dexie Initial Sync & Population Latency
  // --------------------------------------------------------------------------
  logger.log("--- 2. DEXIE INITIAL SYNC & POPULATION LATENCY ---");
  const syncLatencies: number[] = [];

  for (let i = 0; i < syncIterations; i++) {
    const db = new AstralynKnowledgeDB(`BenchmarkDB_${Date.now()}_${i}`);
    try {
      await db.open();
      const loader = createBenchmarkMockLoader(rootManifest, releaseManifest);
      const repo = new KnowledgeRepository(db, loader);

      const start = performance.now();
      await repo.initialize();
      const end = performance.now();

      syncLatencies.push(end - start);
    } finally {
      await db.delete();
    }
  }

  const avgSync =
    syncLatencies.length > 0
      ? syncLatencies.reduce((a, b) => a + b, 0) / syncLatencies.length
      : 0;
  const minSync = syncLatencies.length > 0 ? Math.min(...syncLatencies) : 0;
  const maxSync = syncLatencies.length > 0 ? Math.max(...syncLatencies) : 0;

  const syncBudgetPassed = avgSync < budgets.maxInitialSyncLatencyMs;
  if (!syncBudgetPassed) {
    failures.push(
      `Average initial sync latency (${avgSync.toFixed(2)} ms) exceeded budget (< ${budgets.maxInitialSyncLatencyMs.toFixed(2)} ms)`
    );
  }

  logger.log(`  Iterations: ${syncIterations}`);
  logger.log(`  Min Latency: ${minSync.toFixed(2)} ms [MEASURED]`);
  logger.log(`  Avg Latency: ${avgSync.toFixed(2)} ms [MEASURED]`);
  logger.log(`  Max Latency: ${maxSync.toFixed(2)} ms [MEASURED]`);
  logger.log(
    `  Target Budget: < ${budgets.maxInitialSyncLatencyMs.toFixed(2)} ms -> Status: ${
      syncBudgetPassed ? "PASS" : "FAIL"
    }\n`
  );

  // --------------------------------------------------------------------------
  // 3. Query & Search Latency
  // --------------------------------------------------------------------------
  logger.log(
    `--- 3. REPOSITORY READ & SEARCH LATENCY (${queryIterations} Operations) ---`
  );
  const benchmarkDb = new AstralynKnowledgeDB(`BenchmarkDB_Reads_${Date.now()}`);

  let avgGetLatency: number;
  let avgFilterLatency: number;
  let avgSearchLatency: number;

  try {
    await benchmarkDb.open();
    const repo = new KnowledgeRepository(
      benchmarkDb,
      createBenchmarkMockLoader(rootManifest, releaseManifest)
    );
    await repo.initialize();

    // A. Single Item Get
    const getItemStart = performance.now();
    for (let i = 0; i < queryIterations; i++) {
      await repo.getCharacter("acheron");
    }
    const getItemEnd = performance.now();
    avgGetLatency = (getItemEnd - getItemStart) / queryIterations;

    const getBudgetPassed = avgGetLatency < budgets.maxSingleItemGetLatencyMs;
    if (!getBudgetPassed) {
      failures.push(
        `Single item get latency (${avgGetLatency.toFixed(3)} ms) exceeded budget (< ${budgets.maxSingleItemGetLatencyMs.toFixed(2)} ms)`
      );
    }

    logger.log(`  Single Item Get:`);
    logger.log(`    Total Time: ${(getItemEnd - getItemStart).toFixed(2)} ms`);
    logger.log(`    Avg per op: ${avgGetLatency.toFixed(3)} ms [MEASURED]`);
    logger.log(
      `    Target: < ${budgets.maxSingleItemGetLatencyMs.toFixed(2)} ms -> Status: ${
        getBudgetPassed ? "PASS" : "FAIL"
      }`
    );

    // B. Collection Filter
    const filterStart = performance.now();
    for (let i = 0; i < queryIterations; i++) {
      await repo.listCharacters({ path: "Nihility" });
    }
    const filterEnd = performance.now();
    avgFilterLatency = (filterEnd - filterStart) / queryIterations;

    const filterBudgetPassed = avgFilterLatency < budgets.maxCollectionFilterLatencyMs;
    if (!filterBudgetPassed) {
      failures.push(
        `Collection filter latency (${avgFilterLatency.toFixed(3)} ms) exceeded budget (< ${budgets.maxCollectionFilterLatencyMs.toFixed(2)} ms)`
      );
    }

    logger.log(`\n  Collection Filter (Indexed Path Query):`);
    logger.log(`    Total Time: ${(filterEnd - filterStart).toFixed(2)} ms`);
    logger.log(`    Avg per op: ${avgFilterLatency.toFixed(3)} ms [MEASURED]`);
    logger.log(
      `    Target: < ${budgets.maxCollectionFilterLatencyMs.toFixed(2)} ms -> Status: ${
        filterBudgetPassed ? "PASS" : "FAIL"
      }`
    );

    // C. Normalized Search Query
    const searchStart = performance.now();
    const searchTerms = ["sam", "netherwing", "waveflair", "acheron", "madam herta"];
    for (let i = 0; i < queryIterations; i++) {
      const term = searchTerms[i % searchTerms.length];
      await repo.searchEntities(term);
    }
    const searchEnd = performance.now();
    avgSearchLatency = (searchEnd - searchStart) / queryIterations;

    const searchBudgetPassed = avgSearchLatency < budgets.maxNormalizedSearchLatencyMs;
    if (!searchBudgetPassed) {
      failures.push(
        `Normalized search query latency (${avgSearchLatency.toFixed(3)} ms) exceeded budget (< ${budgets.maxNormalizedSearchLatencyMs.toFixed(2)} ms)`
      );
    }

    logger.log(`\n  Normalized Search Query (Alias Resolution + In-Memory Ranking):`);
    logger.log(`    Total Time: ${(searchEnd - searchStart).toFixed(2)} ms`);
    logger.log(`    Avg per op: ${avgSearchLatency.toFixed(3)} ms [MEASURED]`);
    logger.log(
      `    Target: < ${budgets.maxNormalizedSearchLatencyMs.toFixed(2)} ms -> Status: ${
        searchBudgetPassed ? "PASS" : "FAIL"
      }`
    );
  } finally {
    await benchmarkDb.delete();
  }

  const success = failures.length === 0;

  logger.log(
    "\n================================================================================"
  );
  if (success) {
    logger.log("                     ALL BENCHMARK CRITERIA MET (PASS)");
  } else {
    logger.error(
      `                 BENCHMARK CRITERIA FAILED (${failures.length} violation(s)):`
    );
    for (const f of failures) {
      logger.error(`  - ${f}`);
    }
  }
  logger.log(
    "================================================================================\n"
  );

  return {
    success,
    failures,
    totalRawBytes,
    totalGzipBytes,
    avgSyncLatencyMs: avgSync,
    avgGetLatencyMs: avgGetLatency,
    avgFilterLatencyMs: avgFilterLatency,
    avgSearchLatencyMs: avgSearchLatency,
  };
}

export async function executeKnowledgeBenchmark(
  options: BenchmarkOptions = {}
): Promise<number> {
  try {
    const result = await runKnowledgeBenchmark(options);
    return result.success ? 0 : 1;
  } catch (err: unknown) {
    const logger = options.logger ?? console;
    logger.error("Unexpected benchmark execution failure:", err);
    return 1;
  }
}

if (
  require.main === module ||
  (typeof process !== "undefined" && process.argv[1]?.includes("benchmark-knowledge"))
) {
  executeKnowledgeBenchmark().then((exitCode) => {
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  });
}
