import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const ROOT_DIR = process.cwd();
const WORKER_DIR = resolve(ROOT_DIR, "apps/worker");
const COMMITTED_SCHEMA = resolve(WORKER_DIR, "src/db/auth-schema.generated.ts");
const TEMP_OUTPUT = resolve(tmpdir(), `astralyn-auth-schema-check-${Date.now()}.ts`);

function normalizeCode(code: string): string {
  return code.replace(/\r\n/g, "\n").trim();
}

function checkAuthSchema(): void {
  console.log(
    "[Astralyn Auth Schema Check] Verifying Better Auth generated schema integrity..."
  );

  if (!existsSync(COMMITTED_SCHEMA)) {
    console.error(`[FAIL] Committed auth schema not found at: ${COMMITTED_SCHEMA}`);
    process.exit(1);
  }

  const committedContent = normalizeCode(readFileSync(COMMITTED_SCHEMA, "utf-8"));

  try {
    // Run CLI generate targeting temporary output path
    execSync(
      `pnpm --filter @astralyn/worker exec auth generate --config ./src/auth/schema-config.ts --adapter drizzle --dialect sqlite --output "${TEMP_OUTPUT}" --yes`,
      {
        cwd: ROOT_DIR,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    if (!existsSync(TEMP_OUTPUT)) {
      console.error(`[FAIL] Temporary generation output not found at: ${TEMP_OUTPUT}`);
      process.exit(1);
    }

    const freshContent = normalizeCode(readFileSync(TEMP_OUTPUT, "utf-8"));

    if (committedContent !== freshContent) {
      console.error(
        "[FAIL] Auth schema drift detected! Committed auth-schema.generated.ts does not match fresh CLI output."
      );
      console.error(
        "Run 'pnpm auth:schema:generate' and review the generated schema diff."
      );
      process.exit(1);
    }

    console.log("✓ Better Auth generated schema is 100% synchronized with CLI output.");
    console.log("[PASS] Astralyn Auth Schema Gate PASSED.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FAIL] Error during auth schema verification:", message);
    process.exit(1);
  } finally {
    if (existsSync(TEMP_OUTPUT)) {
      try {
        rmSync(TEMP_OUTPUT, { force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }
}

checkAuthSchema();
