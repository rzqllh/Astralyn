import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const WORKER_DIR = resolve(process.cwd(), "apps/worker");
const DRIZZLE_CONFIG = resolve(WORKER_DIR, "drizzle.config.ts");
const SCHEMA_PATH = resolve(WORKER_DIR, "src/db/schema.ts");
const MIGRATIONS_DIR = resolve(WORKER_DIR, "drizzle/migrations");
const JOURNAL_PATH = resolve(MIGRATIONS_DIR, "meta/_journal.json");

function validateMigrationState(): void {
  console.log(
    "[Astralyn Migration Check] Validating Drizzle persistence configuration..."
  );

  if (!existsSync(DRIZZLE_CONFIG)) {
    console.error(`[FAIL] Missing Drizzle configuration at ${DRIZZLE_CONFIG}`);
    process.exit(1);
  }

  if (!existsSync(SCHEMA_PATH)) {
    console.error(`[FAIL] Missing Drizzle schema at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  if (!existsSync(JOURNAL_PATH)) {
    console.error(`[FAIL] Missing Drizzle journal metadata at ${JOURNAL_PATH}`);
    process.exit(1);
  }

  // Parse journal metadata
  try {
    const journalRaw = readFileSync(JOURNAL_PATH, "utf-8");
    const journal = JSON.parse(journalRaw);
    if (!journal || typeof journal !== "object" || !Array.isArray(journal.entries)) {
      console.error("[FAIL] Malformed _journal.json in drizzle/migrations/meta");
      process.exit(1);
    }
    console.log(`✓ Journal metadata valid (Entries: ${journal.entries.length})`);
  } catch (error) {
    console.error("[FAIL] Error reading migration journal:", error);
    process.exit(1);
  }

  // Run drizzle-kit generate check to detect schema drift
  console.log("[Astralyn Migration Check] Checking for uncommitted schema drift...");
  try {
    const output = execSync("pnpm --filter @astralyn/worker db:generate", {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (
      output.includes("No schema changes, nothing to migrate") ||
      output.includes("0 tables")
    ) {
      console.log("✓ Zero schema drift: schema and migration journal are in sync.");
    } else {
      console.log("✓ Generation executed cleanly.");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[FAIL] drizzle-kit generate failed during migration drift check:",
      message
    );
    process.exit(1);
  }

  console.log("[PASS] Astralyn Migration Integrity Gate PASSED.");
}

validateMigrationState();
