import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { executeKnowledgeBenchmark } from "../benchmark-knowledge";
import { createTempKnowledgeSnapshot } from "./knowledge-test-fixtures";

describe("runKnowledgeBenchmark Tool Tests", () => {
  test("returns success and exitCode 0 on valid snapshot with generous budgets", async () => {
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    const exitCode = await executeKnowledgeBenchmark({
      targetBudgets: {
        maxTotalSnapshotGzipBytes: 50 * 1024 * 1024,
        maxInitialSyncLatencyMs: 10000,
        maxSingleItemGetLatencyMs: 1000,
        maxCollectionFilterLatencyMs: 1000,
        maxNormalizedSearchLatencyMs: 1000,
      },
      syncIterations: 1,
      queryIterations: 5,
      logger,
    });

    assert.equal(exitCode, 0);
    const output = logs.join("\n");
    assert.ok(output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
  });

  test("returns failure and exitCode 1 when preflight integrity fails (corrupted manifest)", async () => {
    const fixture = createTempKnowledgeSnapshot();
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    try {
      // Corrupt release manifest
      fs.writeFileSync(fixture.releaseManifestPath, "invalid json {{}");

      const exitCode = await executeKnowledgeBenchmark({
        dataDir: fixture.dataDir,
        logger,
      });

      assert.equal(exitCode, 1);
      const output = logs.join("\n");
      assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
      assert.ok(output.includes("BENCHMARK CRITERIA FAILED"));
    } finally {
      fixture.cleanup();
    }
  });

  test("returns failure and exitCode 1 when a canonical file is missing from disk", async () => {
    const fixture = createTempKnowledgeSnapshot();
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    try {
      const charPath = path.join(fixture.releaseDir, "characters.json");
      fs.unlinkSync(charPath);

      const exitCode = await executeKnowledgeBenchmark({
        dataDir: fixture.dataDir,
        logger,
      });

      assert.equal(exitCode, 1);
      const output = logs.join("\n");
      assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
      assert.ok(output.includes("BENCHMARK CRITERIA FAILED"));
    } finally {
      fixture.cleanup();
    }
  });

  test("returns failure and exitCode 1 when total gzip bytes exceeds zero budget", async () => {
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    const exitCode = await executeKnowledgeBenchmark({
      targetBudgets: {
        maxTotalSnapshotGzipBytes: 0, // Impossible budget -> must fail
      },
      syncIterations: 1,
      queryIterations: 5,
      logger,
    });

    assert.equal(exitCode, 1);
    const output = logs.join("\n");
    assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
    assert.ok(output.includes("Total snapshot gzip size"));
  });

  test("returns failure and exitCode 1 when single item get latency exceeds 0 budget", async () => {
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    const exitCode = await executeKnowledgeBenchmark({
      targetBudgets: {
        maxSingleItemGetLatencyMs: 0, // Impossible budget -> must fail
      },
      syncIterations: 1,
      queryIterations: 5,
      logger,
    });

    assert.equal(exitCode, 1);
    const output = logs.join("\n");
    assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
    assert.ok(output.includes("Single item get latency"));
  });

  test("returns failure and exitCode 1 when collection filter latency exceeds 0 budget", async () => {
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    const exitCode = await executeKnowledgeBenchmark({
      targetBudgets: {
        maxCollectionFilterLatencyMs: 0, // Impossible budget
      },
      syncIterations: 1,
      queryIterations: 5,
      logger,
    });

    assert.equal(exitCode, 1);
    const output = logs.join("\n");
    assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
    assert.ok(output.includes("Collection filter latency"));
  });

  test("returns failure and exitCode 1 when normalized search latency exceeds 0 budget", async () => {
    const logs: string[] = [];
    const logger = {
      log: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
    };

    const exitCode = await executeKnowledgeBenchmark({
      targetBudgets: {
        maxNormalizedSearchLatencyMs: 0, // Impossible budget
      },
      syncIterations: 1,
      queryIterations: 5,
      logger,
    });

    assert.equal(exitCode, 1);
    const output = logs.join("\n");
    assert.ok(!output.includes("ALL BENCHMARK CRITERIA MET (PASS)"));
    assert.ok(output.includes("Normalized search query latency"));
  });
});
