import { eq } from "drizzle-orm";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { knowledgeReleases, gameVersions } from "../db/knowledge-schema";

function generateUUID(): string {
  // Simple UUID v4 generation for Cloudflare Worker environment where crypto.randomUUID is available,
  // but using a fallback just in case
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxx-xxxx-xxxx-xxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class ReleaseManager {
  constructor(private db: DrizzleD1Database<Record<string, unknown>>) {}

  async createDraftRelease(gameVersionId: string): Promise<string> {
    const id = generateUUID();
    // Use timestamp + random for unique knowledge_version
    const knowledgeVersion = `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await this.db.insert(knowledgeReleases).values({
      id,
      gameVersionId,
      knowledgeVersion,
      status: "draft",
      sourceSnapshotHash: "", // Will be updated later
    });

    return id;
  }

  async markAsConsensusReady(releaseId: string, snapshotHash: string): Promise<void> {
    await this.db
      .update(knowledgeReleases)
      .set({
        // Status remains 'draft' until officially published. 'consensus' is not a valid schema status.
        status: "draft",
        sourceSnapshotHash: snapshotHash,
      })
      .where(eq(knowledgeReleases.id, releaseId));
  }

  async publishRelease(releaseId: string, finalKnowledgeVersion: string): Promise<void> {
    await this.db
      .update(knowledgeReleases)
      .set({
        status: "published",
        knowledgeVersion: finalKnowledgeVersion,
        publishedAt: new Date().toISOString(),
      })
      .where(eq(knowledgeReleases.id, releaseId));
  }

  async getGameVersionId(version: string): Promise<string> {
    const records = await this.db
      .select({ id: gameVersions.id })
      .from(gameVersions)
      .where(eq(gameVersions.version, version))
      .limit(1);

    if (records.length > 0) {
      return records[0].id;
    }

    // Create it if it doesn't exist
    const id = generateUUID();
    await this.db.insert(gameVersions).values({
      id,
      version,
      isCurrent: 0,
    });
    return id;
  }
}
