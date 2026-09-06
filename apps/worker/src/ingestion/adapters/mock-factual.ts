import type { SourceAdapter, FetchResult, NormalizedPayload, AdapterWarning } from "@astralyn/shared";

export class MockFactualAdapter implements SourceAdapter {
  sourceId = "mock_factual";
  sourceKind = "official" as const;
  parserVersion = "1.0.0";

  async fetch(previousEtag?: string): Promise<FetchResult | null> {
    const mockContent = JSON.stringify({
      version: "4.5",
      status: "factual_snapshot",
      // Represent a minimal slice of canonical knowledge for testing
      characters: [{ id: "acheron", element: "Lightning" }],
    });

    const etag = `"mock-etag-${mockContent.length}"`;
    if (previousEtag === etag) {
      return null; // Not modified
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
    const parsed = parsedContent as Record<string, unknown>;

    // In a real adapter, this would convert raw API format to Astralyn NormalizedPayload
    const payload: NormalizedPayload = {
      factualEntities: {
        characters: Array.isArray(parsed.characters) ? (parsed.characters as Record<string, unknown>[]) : [],
      },
      recommendationSets: [],
    };

    return { payload, warnings: [] };
  }

  async validate(payload: NormalizedPayload): Promise<{ valid: boolean; errors: string[] }> {
    if (!payload.factualEntities || !Array.isArray(payload.factualEntities.characters)) {
      return { valid: false, errors: ["Missing factual characters array"] };
    }
    return { valid: true, errors: [] };
  }
}
