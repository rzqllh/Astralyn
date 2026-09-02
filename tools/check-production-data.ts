import * as fs from "node:fs";
import * as path from "node:path";

export interface BoundaryCheckResult {
  success: boolean;
  errors: string[];
  scannedFilesCount: number;
}

export function checkProductionDataBoundaries(): BoundaryCheckResult {
  console.log("[Astralyn Boundary Checker] Validating production data boundaries...");

  const errors: string[] = [];
  const webRoot = path.resolve(__dirname, "../apps/web");
  const srcDir = path.join(webRoot, "src");

  // 1. Verify prohibited files & directories do not exist
  const prohibitedPaths = [
    path.join(srcDir, "lib/fixtures.ts"),
    path.join(srcDir, "components/hsr"),
    path.join(srcDir, "routes/design-system-view.tsx"),
    path.join(webRoot, "public/game-assets"),
  ];

  for (const p of prohibitedPaths) {
    if (fs.existsSync(p)) {
      errors.push(`Prohibited path exists in production tree: ${p}`);
    }
  }

  // 2. Scan all production source files (excluding src/dev/**)
  const productionFiles: string[] = [];

  function collectProductionFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "dev" || entry.name === "node_modules") {
          continue; // skip dev and node_modules
        }
        collectProductionFiles(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      ) {
        productionFiles.push(fullPath);
      }
    }
  }

  if (fs.existsSync(srcDir)) {
    collectProductionFiles(srcDir);
  }

  const forbiddenImportPatterns = [
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

    // Check imports
    for (const pattern of forbiddenImportPatterns) {
      if (pattern.test(content)) {
        errors.push(`Forbidden import found in production file ${relPath}: ${pattern}`);
      }
    }

    // Check fixture identifiers
    for (const ident of forbiddenIdentifiers) {
      if (content.includes(ident)) {
        errors.push(
          `Forbidden test fixture identifier '${ident}' found in production file ${relPath}`
        );
      }
    }
  }

  // 3. Crawl reachable dependency graph from main.tsx to ensure zero dev imports
  const visited = new Set<string>();
  const entryPoint = path.join(srcDir, "main.tsx");

  function crawlImports(currentFile: string) {
    if (visited.has(currentFile)) return;
    visited.add(currentFile);

    if (
      currentFile.includes(`${path.sep}dev${path.sep}`) ||
      currentFile.includes(`${path.sep}tests${path.sep}`)
    ) {
      errors.push(
        `Reachable import graph from main.tsx contains dev/test module: ${currentFile}`
      );
      return;
    }

    if (!fs.existsSync(currentFile)) return;
    const content = fs.readFileSync(currentFile, "utf8");

    // Match static and dynamic imports
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
        let resolvedFile = "";
        for (const ext of candidateExtensions) {
          const testPath = resolvedBase + ext;
          if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            resolvedFile = testPath;
            break;
          }
        }
        if (resolvedFile) {
          crawlImports(resolvedFile);
        }
      }
    }
  }

  if (fs.existsSync(entryPoint)) {
    crawlImports(entryPoint);
  }

  const success = errors.length === 0;

  if (!success) {
    console.error(`\n[FAIL] Boundary check failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
  } else {
    console.log(
      `✓ Production boundary intact: ${productionFiles.length} production source files and ${visited.size} reachable modules verified.`
    );
    console.log("[PASS] Astralyn Production Boundary Gate PASSED.\n");
  }

  return {
    success,
    errors,
    scannedFilesCount: productionFiles.length,
  };
}

if (require.main === module || process.argv[1] === __filename) {
  const result = checkProductionDataBoundaries();
  if (!result.success) {
    process.exit(1);
  }
}
