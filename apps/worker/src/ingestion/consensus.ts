import { DrizzleD1Database } from "drizzle-orm/d1";
import { recommendationSets, recommendationItems } from "../db/knowledge-schema";
import type { IngestedRecommendationSet } from "@astralyn/shared";

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

export class ConsensusEngine {
  constructor(private db: DrizzleD1Database<Record<string, unknown>>) {}

  async computeAndStoreConsensus(knowledgeReleaseId: string, sets: IngestedRecommendationSet[]): Promise<void> {
    const grouped = new Map<string, IngestedRecommendationSet[]>();

    for (const set of sets) {
      if (set.category !== "best_team" || !set.subjectCharacterId) continue;

      const existing = grouped.get(set.subjectCharacterId) || [];
      existing.push(set);
      grouped.set(set.subjectCharacterId, existing);
    }

    const astralynSourceId = "astralyn_consensus";
    const BASELINE_RANK_WEIGHTS: Record<number, number> = { 1: 1.00, 2: 0.70, 3: 0.45 }; // D-028 & docs/08-RECOMMENDATION_ENGINE.md

    for (const [subjectCharacterId, subjectSets] of grouped.entries()) {
      // 1. Minimum independent sources (D-005, docs/07-SOURCE_POLICY.md)
      const uniqueSources = new Set(subjectSets.map(s => String(s.metadata?.sourceId || "")));

      if (uniqueSources.size < 3) {
        console.warn(`[Consensus] Not enough sources for ${subjectCharacterId} (found ${uniqueSources.size}, need 3). Skipping consensus.`);
        continue;
      }

      // 2. Tally matching properties / Rank weighting
      const candidateScores = new Map<string, { score: number, payload: unknown }>();

      for (const set of subjectSets) {
        for (const item of set.items || []) {
          // Serialize payload to match structurally equivalent teams
          const payloadHash = JSON.stringify(item.payload || {});
          const weight = BASELINE_RANK_WEIGHTS[item.rank] || 0;

          if (weight > 0) {
            const existing = candidateScores.get(payloadHash) || { score: 0, payload: item.payload };
            existing.score += weight;
            candidateScores.set(payloadHash, existing);
          }
        }
      }

      if (candidateScores.size === 0) continue;

      // 3. Find majority / unambiguous result
      const sortedCandidates = Array.from(candidateScores.values()).sort((a, b) => b.score - a.score);
      const topScore = sortedCandidates[0].score;

      // 4. Tie resolution: "if multiple equally valid results remain and no canonical tie rule exists, return a deterministic BLOCKED/UNRESOLVED result rather than selecting the first source"
      const tiedCandidates = sortedCandidates.filter(c => c.score === topScore);

      let finalPayloadJson: string;
      let reasonCodes: string[] = ["source_consensus_strong"];

      if (tiedCandidates.length > 1) {
        console.warn(`[Consensus] Ambiguous tie detected for ${subjectCharacterId}. Deferring to UNRESOLVED.`);
        finalPayloadJson = JSON.stringify({ error: "AMBIGUOUS_TIE_UNRESOLVED", tiedCandidates: tiedCandidates.map(c => c.payload) });
        reasonCodes = ["ambiguous_tie_unresolved"];
      } else {
        finalPayloadJson = JSON.stringify(tiedCandidates[0].payload);
      }

      const setId = generateUUID();

      await this.db.insert(recommendationSets).values({
        id: setId,
        sourceId: astralynSourceId,
        knowledgeReleaseId,
        category: "best_team",
        subjectCharacterId,
        confidence: tiedCandidates.length > 1 ? 0 : 0.95,
        status: "active", // Schema only allows 'active' currently per default
        metadataJson: JSON.stringify({ reasonCodes, tied: tiedCandidates.length > 1 }),
      });

      if (tiedCandidates.length === 1) {
        await this.db.insert(recommendationItems).values({
          id: generateUUID(),
          recommendationSetId: setId,
          rank: 1,
          payloadJson: finalPayloadJson,
          sourceScore: Math.min(100, Math.floor(topScore * 100 / uniqueSources.size)), // Simple normalized score
        });
      }
    }
  }
}
