import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export const CANONICAL_DATA_DIR = path.resolve(__dirname, "../../apps/web/public/data");

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export interface TempKnowledgeSnapshot {
  dataDir: string;
  releaseDir: string;
  rootManifestPath: string;
  releaseManifestPath: string;
  cleanup: () => void;
}

export function createTempKnowledgeSnapshot(version = "v1.0.0"): TempKnowledgeSnapshot {
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "astralyn-knowledge-test-"));
  const dataDir = path.join(tempBase, "data");

  copyDirRecursive(CANONICAL_DATA_DIR, dataDir);

  const releaseDir = path.join(dataDir, version);
  const rootManifestPath = path.join(dataDir, "manifest.json");
  const releaseManifestPath = path.join(releaseDir, "release.json");

  return {
    dataDir,
    releaseDir,
    rootManifestPath,
    releaseManifestPath,
    cleanup: () => {
      try {
        fs.rmSync(tempBase, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors in temp
      }
    },
  };
}
