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
  const rootDir = path.resolve(__dirname, "..");
  const webRoot = path.join(rootDir, "apps/web");
  const webSrcDir = path.join(webRoot, "src");
  const workerRoot = path.join(rootDir, "apps/worker");
  const workerSrcDir = path.join(workerRoot, "src");

  // 1. Verify prohibited files & directories do not exist in web
  const prohibitedWebPaths = [
    path.join(webSrcDir, "lib/fixtures.ts"),
    path.join(webSrcDir, "components/hsr"),
    path.join(webSrcDir, "routes/design-system-view.tsx"),
    path.join(webRoot, "public/game-assets"),
  ];

  for (const p of prohibitedWebPaths) {
    if (fs.existsSync(p)) {
      errors.push(`Prohibited path exists in web production tree: ${p}`);
    }
  }

  // 2. Scan all web production source files (excluding src/dev/**)
  const webProductionFiles: string[] = [];

  function collectWebFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "dev" || entry.name === "node_modules") {
          continue; // skip dev and node_modules
        }
        collectWebFiles(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      ) {
        webProductionFiles.push(fullPath);
      }
    }
  }

  if (fs.existsSync(webSrcDir)) {
    collectWebFiles(webSrcDir);
  }

  const forbiddenWebImportPatterns = [
    /from\s+["'].*\/dev\/.+["']/,
    /from\s+["'].*\/tests\/.+["']/,
    /from\s+["'].*fixtures.*["']/,
    /from\s+["'].*game-assets.*["']/,
    /import\s*\(\s*["'].*\/dev\/.+["']\s*\)/,
  ];

  const forbiddenWebIdentifiers = [
    "FIXTURE_CHARACTERS",
    "FIXTURE_RECOMMENDATION",
    "FIXTURE_SOURCE_COMPARISON",
    "FIXTURE_DECISION",
  ];

  for (const file of webProductionFiles) {
    const content = fs.readFileSync(file, "utf8");
    const relPath = path.relative(webRoot, file);

    for (const pattern of forbiddenWebImportPatterns) {
      if (pattern.test(content)) {
        errors.push(
          `Forbidden import found in web production file ${relPath}: ${pattern}`
        );
      }
    }

    for (const ident of forbiddenWebIdentifiers) {
      if (content.includes(ident)) {
        errors.push(
          `Forbidden test fixture identifier '${ident}' found in web production file ${relPath}`
        );
      }
    }
  }

  // 3. Scan Worker production source files (excluding src/auth/schema-config.ts which is CLI-tooling only)
  const workerProductionFiles: string[] = [];

  function collectWorkerFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "test" || entry.name === "node_modules") {
          continue;
        }
        collectWorkerFiles(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
      ) {
        // Exclude tooling-only schema config from production runtime scan
        if (!entry.name.includes("schema-config")) {
          workerProductionFiles.push(fullPath);
        }
      }
    }
  }

  if (fs.existsSync(workerSrcDir)) {
    collectWorkerFiles(workerSrcDir);
  }

  const forbiddenWorkerImportPatterns = [
    /from\s+["'].*\/test\/.+["']/,
    /from\s+["'].*\/test["']/,
    /from\s+["'].*schema-config["']/,
  ];

  for (const file of workerProductionFiles) {
    const content = fs.readFileSync(file, "utf8");
    const relPath = path.relative(workerRoot, file);

    for (const pattern of forbiddenWorkerImportPatterns) {
      if (pattern.test(content)) {
        errors.push(
          `Forbidden test/tooling import found in worker production file ${relPath}: ${pattern}`
        );
      }
    }
  }

  // 4. Crawl reachable dependency graphs
  const visitedWeb = new Set<string>();
  const webEntryPoint = path.join(webSrcDir, "main.tsx");

  function crawlWebImports(currentFile: string) {
    if (visitedWeb.has(currentFile)) return;
    visitedWeb.add(currentFile);

    if (
      currentFile.includes(`${path.sep}dev${path.sep}`) ||
      currentFile.includes(`${path.sep}tests${path.sep}`)
    ) {
      errors.push(
        `Reachable import graph from web main.tsx contains dev/test module: ${currentFile}`
      );
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
        let resolvedFile = "";
        for (const ext of candidateExtensions) {
          const testPath = resolvedBase + ext;
          if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            resolvedFile = testPath;
            break;
          }
        }
        if (resolvedFile) {
          crawlWebImports(resolvedFile);
        }
      }
    }
  }

  if (fs.existsSync(webEntryPoint)) {
    crawlWebImports(webEntryPoint);
  }

  const visitedWorker = new Set<string>();
  const workerEntryPoint = path.join(workerSrcDir, "index.ts");

  function crawlWorkerImports(currentFile: string) {
    if (visitedWorker.has(currentFile)) return;
    visitedWorker.add(currentFile);

    if (
      currentFile.includes(`${path.sep}test${path.sep}`) ||
      currentFile.includes("schema-config")
    ) {
      errors.push(
        `Reachable import graph from worker index.ts contains test/tooling module: ${currentFile}`
      );
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
        const candidateExtensions = ["", ".ts", ".tsx", ".js", "/index.ts"];
        let resolvedFile = "";
        for (const ext of candidateExtensions) {
          const testPath = resolvedBase + ext;
          if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            resolvedFile = testPath;
            break;
          }
        }
        if (resolvedFile) {
          crawlWorkerImports(resolvedFile);
        }
      }
    }
  }

  if (fs.existsSync(workerEntryPoint)) {
    crawlWorkerImports(workerEntryPoint);
  }

  const totalScanned = webProductionFiles.length + workerProductionFiles.length;
  const success = errors.length === 0;

  if (!success) {
    console.error(`\n[FAIL] Boundary check failed with ${errors.length} error(s):`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
  } else {
    console.log(
      `✓ Production boundary intact: ${totalScanned} production source files (${webProductionFiles.length} web, ${workerProductionFiles.length} worker) and reachable graphs verified.`
    );
    console.log("[PASS] Astralyn Production Boundary Gate PASSED.\n");
  }

  return {
    success,
    errors,
    scannedFilesCount: totalScanned,
  };
}

if (require.main === module || process.argv[1] === __filename) {
  const result = checkProductionDataBoundaries();
  if (!result.success) {
    process.exit(1);
  }
}
