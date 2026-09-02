import { test, describe } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { checkKnowledgeIntegrity } from "../check-knowledge";
import { createTempKnowledgeSnapshot } from "./knowledge-test-fixtures";

describe("checkKnowledgeIntegrity Tool Tests", () => {
  test("accepts valid committed snapshot with default options", () => {
    const result = checkKnowledgeIntegrity({ silent: true });
    assert.equal(result.success, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.activeVersion, "v1.0.0");
  });

  test("accepts temp copy of valid snapshot with matching appVersion", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        appVersion: "0.0.1",
        silent: true,
      });
      assert.equal(result.success, true);
      assert.equal(result.errors.length, 0);
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when a canonical file is missing from manifest files list", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.files = release.files.filter(
        (f: { filename: string }) => f.filename !== "characters.json"
      );
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) => e.includes("characters.json") || e.includes("files array")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when a physical canonical file is missing from disk", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const charFilePath = path.join(fixture.releaseDir, "characters.json");
      fs.unlinkSync(charFilePath);

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some((e) => e.includes("Required release file missing on disk"))
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when file entry checksum does not match physical bytes", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.files[0].checksum = "0".repeat(64);
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(result.errors.some((e) => e.includes("Checksum mismatch")));
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when checksums record does not match physical bytes", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.checksums["characters.json"] = "0".repeat(64);
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) => e.includes("Checksum mismatch") || e.includes("record mismatch")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when sizeBytes does not match physical byte length", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.files[0].sizeBytes = 9999999;
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) => e.includes("Byte size mismatch") || e.includes("sizeBytes")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when entityCount does not match parsed entity count", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.files[0].entityCount = 99; // Characters is 9
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(result.errors.some((e) => e.includes("Entity count mismatch")));
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when sourceSnapshotHash does not match computed hash", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const release = JSON.parse(fs.readFileSync(fixture.releaseManifestPath, "utf8"));
      release.sourceSnapshotHash = "f".repeat(64);
      fs.writeFileSync(fixture.releaseManifestPath, JSON.stringify(release, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) =>
            e.includes("Source snapshot hash mismatch") ||
            e.includes("sourceSnapshotHash")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when root and release gameVersion disagree", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const root = JSON.parse(fs.readFileSync(fixture.rootManifestPath, "utf8"));
      root.gameVersion = "5.0";
      fs.writeFileSync(fixture.rootManifestPath, JSON.stringify(root, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) => e.includes("gameVersion") || e.includes("Game version mismatch")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when embedded release in root disagrees with release.json", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const root = JSON.parse(fs.readFileSync(fixture.rootManifestPath, "utf8"));
      root.releases["v1.0.0"].sourceSnapshotHash = "0".repeat(64);
      fs.writeFileSync(fixture.rootManifestPath, JSON.stringify(root, null, 2));

      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some(
          (e) => e.includes("Embedded release") || e.includes("sourceSnapshotHash")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects when appVersion is below minAppVersion", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const result = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        appVersion: "0.0.0", // Below 0.0.1
        silent: true,
      });
      assert.equal(result.success, false);
      assert.ok(
        result.errors.some((e) =>
          e.includes("incompatible with release minimum required version")
        )
      );
    } finally {
      fixture.cleanup();
    }
  });

  test("accepts when appVersion is equal to or above minAppVersion", () => {
    const fixture = createTempKnowledgeSnapshot();
    try {
      const resultEq = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        appVersion: "0.0.1",
        silent: true,
      });
      assert.equal(resultEq.success, true);

      const resultAbove = checkKnowledgeIntegrity({
        dataDir: fixture.dataDir,
        appVersion: "0.1.0",
        silent: true,
      });
      assert.equal(resultAbove.success, true);
    } finally {
      fixture.cleanup();
    }
  });
});
