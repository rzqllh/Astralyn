import type { SourceAdapter, FetchResult, NormalizedPayload, AdapterWarning, IngestedRecommendationSet } from "@astralyn/shared";

export class MockEditorialAdapter implements SourceAdapter {
  sourceId: string;
  sourceKind = "editorial" as const;
  parserVersion = "1.0.0";

  constructor(sourceId: string, private overrideTeams: Array<{ rank: number; members: string[] }>) {
    this.sourceId = sourceId;
  }

  async fetch(previousEtag?: string, _previousLastModified?: string): Promise<FetchResult | null> {
    const mockContent = JSON.stringify({
      version: "4.5",
      recommendations: this.overrideTeams,
    });

    const etag = `"mock-editorial-etag-${mockContent.length}"`;
    if (previousEtag === etag) {
      return null;
    }

    return {
      rawContent: mockContent,
      etag,
      lastModified: new Date().toUTCString(),
    };
  }

  async parse(rawContent: string): Promise<unknown> {
    return JSON.parse(rawContent) as unknown;
  }

  async normalize(parsedContent: unknown): Promise<{ payload: NormalizedPayload; warnings: AdapterWarning[] }> {
    const parsed = parsedContent as { recommendations: Array<{ rank: number; members: string[] }> };

    const set: IngestedRecommendationSet = {
      category: "best_team",
      subjectCharacterId: "firefly", // E.g., Best teams for Firefly
      gameMode: "general",
      confidence: 0.9,
      items: parsed.recommendations.map(r => ({
        rank: r.rank,
        payload: { teamMembers: r.members },
        sourceScore: 100 - (r.rank * 10), // Dummy score
        notes: { sourceId: this.sourceId }
      })),
      metadata: {},
    };

    const payload: NormalizedPayload = {
      recommendationSets: [set],
    };

    return { payload, warnings: [] };
  }

  async validate(payload: NormalizedPayload): Promise<{ valid: boolean; errors: string[] }> {
    if (!payload.recommendationSets || payload.recommendationSets.length === 0) {
      return { valid: false, errors: ["Missing recommendation sets"] };
    }
    return { valid: true, errors: [] };
  }
}
