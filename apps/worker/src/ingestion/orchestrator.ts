import { DrizzleD1Database } from "drizzle-orm/d1";
import type { SourceAdapter, IngestedRecommendationSet } from "@astralyn/shared";
import { sourceSnapshots, knowledgeSources, recommendationSets, recommendationItems } from "../db/knowledge-schema";
import { eq } from "drizzle-orm";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxx-xxxx-xxxx-xxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function computeHash(content: string): string {
  // For this architecture proof, a simple mock hash is sufficient.
  // A production implementation would use async crypto.subtle.digest.
  return "hash_" + content.length + "_" + Date.now();
}

export class IngestionOrchestrator {
  constructor(
    private db: DrizzleD1Database<Record<string, unknown>>,
    private adapters: SourceAdapter[]
  ) {}

  async runIngestion(gameVersionId: string, knowledgeReleaseId: string): Promise<IngestedRecommendationSet[]> {
    const allRecommendationSets: IngestedRecommendationSet[] = [];

    for (const adapter of this.adapters) {
      console.log(`[Ingestion] Running adapter: ${adapter.sourceId}`);
      try {
        // 1. Ensure source exists in DB
        await this.ensureSourceExists(adapter);

        // 2. Fetch
        const fetchResult = await adapter.fetch();
        if (!fetchResult) {
          console.log(`[Ingestion] Source ${adapter.sourceId} not modified. Skipping.`);
          continue;
        }

        const contentHash = computeHash(fetchResult.rawContent);

        // 3. Parse & Normalize
        const parsed = await adapter.parse(fetchResult.rawContent);
        const { payload, warnings } = await adapter.normalize(parsed);

        if (warnings.length > 0) {
          console.warn(`[Ingestion] Adapter ${adapter.sourceId} emitted warnings:`, warnings);
        }

        // 4. Validate
        const validation = await adapter.validate(payload);
        if (!validation.valid) {
          console.error(`[Ingestion] Adapter ${adapter.sourceId} validation failed:`, validation.errors);
          continue; // Skip this source, isolate failure
        }

        // 5. Persist Source Snapshot
        const snapshotId = generateUUID();
        await this.db.insert(sourceSnapshots).values({
          id: snapshotId,
          sourceId: adapter.sourceId,
          gameVersionId,
          contentHash,
          parserVersion: adapter.parserVersion,
          status: "success",
          etag: fetchResult.etag,
          lastModified: fetchResult.lastModified,
        });

        // 6. Persist Recommendation Sets
        if (payload.recommendationSets && payload.recommendationSets.length > 0) {
          for (const set of payload.recommendationSets) {
            const setId = generateUUID();
            await this.db.insert(recommendationSets).values({
              id: setId,
              sourceId: adapter.sourceId,
              knowledgeReleaseId,
              category: set.category,
              subjectCharacterId: set.subjectCharacterId,
              gameMode: set.gameMode,
              confidence: set.confidence,
              status: "active",
            });

            for (const item of set.items) {
              await this.db.insert(recommendationItems).values({
                id: generateUUID(),
                recommendationSetId: setId,
                rank: item.rank,
                payloadJson: JSON.stringify(item.payload),
                sourceScore: item.sourceScore,
                notesJson: JSON.stringify(item.notes),
              });
            }

            allRecommendationSets.push(set);
          }
        }

      } catch (error) {
        console.error(`[Ingestion] Adapter ${adapter.sourceId} failed with error:`, error);
        // Isolate failure: continue to next adapter
      }
    }

    return allRecommendationSets;
  }

  private async ensureSourceExists(adapter: SourceAdapter): Promise<void> {
    const existing = await this.db.select().from(knowledgeSources).where(eq(knowledgeSources.slug, adapter.sourceId)).limit(1);

    if (existing.length === 0) {
      await this.db.insert(knowledgeSources).values({
        id: adapter.sourceId, // Use slug as ID for simplicity here
        slug: adapter.sourceId,
        name: adapter.sourceId,
        sourceKind: adapter.sourceKind,
        trustTier: adapter.sourceKind === "official" ? 1 : 2,
        termsReviewStatus: "approved",
      });
    }
  }
}
