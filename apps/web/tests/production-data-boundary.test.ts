import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Phase 2.5 Production Data Boundary Invariants", () => {
  const webRoot = path.resolve(__dirname, "..");
  const srcDir = path.join(webRoot, "src");

  it("verifies prohibited files and directories do not exist in production tree", () => {
    const prohibitedPaths = [
      path.join(srcDir, "lib/fixtures.ts"),
      path.join(srcDir, "components/hsr"),
      path.join(srcDir, "routes/design-system-view.tsx"),
      path.join(webRoot, "public/game-assets"),
    ];

    for (const p of prohibitedPaths) {
      expect(fs.existsSync(p), `Prohibited path must not exist: ${p}`).toBe(false);
    }
  });

  it("verifies all production source files have zero forbidden imports or fixture references", () => {
    const productionFiles: string[] = [];

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "dev" && entry.name !== "node_modules") {
            walk(fullPath);
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
        ) {
          productionFiles.push(fullPath);
        }
      }
    }

    walk(srcDir);
    expect(productionFiles.length).toBeGreaterThan(10);

    const forbiddenPatterns = [
      /from\s+["'].*\/dev\/.+["']/,
      /from\s+["'].*\/tests\/.+["']/,
      /from\s+["'].*fixtures.*["']/,
      /from\s+["'].*game-assets.*["']/,
      /import\s*\(\s*["'].*\/dev\/.+["']\s*\)/,
    ];

    const forbiddenIdentifiers = [
      "FIXTURE_CHARACTERS",
      "FIXTURE_RECOMMENDATION",
      "FIXTURE_SOURCE_COMPARISON",
      "FIXTURE_DECISION",
    ];

    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      const relPath = path.relative(webRoot, file);

      for (const pat of forbiddenPatterns) {
        expect(
          pat.test(content),
          `Forbidden import pattern '${pat}' matched in production file ${relPath}`
        ).toBe(false);
      }

      for (const ident of forbiddenIdentifiers) {
        expect(
          content.includes(ident),
          `Forbidden identifier '${ident}' found in production file ${relPath}`
        ).toBe(false);
      }
    }
  });

  it("verifies reachable import graph from main.tsx contains zero dev/test modules", () => {
    const visited = new Set<string>();
    const entryPoint = path.join(srcDir, "main.tsx");
    const devViolations: string[] = [];

    function crawlImports(currentFile: string) {
      if (visited.has(currentFile)) return;
      visited.add(currentFile);

      if (
        currentFile.includes(`${path.sep}dev${path.sep}`) ||
        currentFile.includes(`${path.sep}tests${path.sep}`)
      ) {
        devViolations.push(currentFile);
        return;
      }

      if (!fs.existsSync(currentFile)) return;
      const content = fs.readFileSync(currentFile, "utf8");

      const importRegex =
        /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?|export\s+(?:[\w*\s{},]*\s+from\s+)?|import\s*\(\s*)["']([^"']+)["']/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const specifier = match[1];
        if (specifier.startsWith(".")) {
          const dir = path.dirname(currentFile);
          const resolvedBase = path.resolve(dir, specifier);
          const candidateExtensions = [
            "",
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            "/index.ts",
            "/index.tsx",
          ];
          for (const ext of candidateExtensions) {
            const testPath = resolvedBase + ext;
            if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
              crawlImports(testPath);
              break;
            }
          }
        }
      }
    }

    crawlImports(entryPoint);
    expect(devViolations).toEqual([]);
    expect(visited.size).toBeGreaterThan(10);
  });
});
