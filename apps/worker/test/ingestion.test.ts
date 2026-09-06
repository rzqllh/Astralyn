import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { IngestedRecommendationSet } from "@astralyn/shared";
import { IngestionOrchestrator } from "../src/ingestion/orchestrator";
import { MockFactualAdapter } from "../src/ingestion/adapters/mock-factual";
import { MockEditorialAdapter } from "../src/ingestion/adapters/mock-editorial";
import { ConsensusEngine } from "../src/ingestion/consensus";

// Create a simple mock for D1 database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{}]),
} as unknown as DrizzleD1Database<Record<string, unknown>>;

describe("IngestionOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process factual adapters successfully", async () => {
    const adapter = new MockFactualAdapter();
    const orchestrator = new IngestionOrchestrator(mockDb, [adapter]);

    await orchestrator.runIngestion("game-version-id", "release-id");

    // Check that source was registered and snapshot saved
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should isolate adapter failures", async () => {
    const failingAdapter = new MockFactualAdapter();
    vi.spyOn(failingAdapter, "fetch").mockRejectedValue(new Error("Network error"));

    const workingAdapter = new MockEditorialAdapter("working", []);

    const orchestrator = new IngestionOrchestrator(mockDb, [
      failingAdapter,
      workingAdapter,
    ]);

    await expect(
      orchestrator.runIngestion("game-version-id", "release-id")
    ).resolves.not.toThrow();
  });
});

describe("ConsensusEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should require at least 3 independent sources for consensus (fewer than 3 cannot finalize)", async () => {
    const engine = new ConsensusEngine(mockDb);

    // 2 sources
    const sets: IngestedRecommendationSet[] = [
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source2" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
    ];

    await engine.computeAndStoreConsensus("release-id", sets);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should not count duplicate source identity", async () => {
    const engine = new ConsensusEngine(mockDb);

    // 3 entries but only 2 unique sources
    const sets: IngestedRecommendationSet[] = [
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source2" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
    ];

    await engine.computeAndStoreConsensus("release-id", sets);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should compute consensus when 3 independent sources agree and identical evidence produces identical result", async () => {
    const engine = new ConsensusEngine(mockDb);

    const sets: IngestedRecommendationSet[] = [
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source2" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source3" },
        items: [{ rank: 1, payload: { teamMembers: ["a", "b"] }, notes: {} }],
      },
    ];

    await engine.computeAndStoreConsensus("release-id", sets);
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // recommendationSets + recommendationItems
  });

  it("should NOT silently choose first processed source when evidence is tied/ambiguous", async () => {
    const engine = new ConsensusEngine(mockDb);

    // 4 sources, 2 vote for Team A, 2 vote for Team B (tie)
    const sets: IngestedRecommendationSet[] = [
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_A"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source2" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_A"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source3" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_B"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source4" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_B"] }, notes: {} }],
      },
    ];

    await engine.computeAndStoreConsensus("release-id", sets);

    // Should insert recommendationSet with 0 confidence, but NOT insert recommendationItems
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });

  it("input order cannot change a finalized result (unambiguous majority wins)", async () => {
    const engine = new ConsensusEngine(mockDb);

    // 3 sources: Team_B gets 2 votes, Team_A gets 1.
    // Even if Team_A is first, Team_B wins.
    const sets: IngestedRecommendationSet[] = [
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source1" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_A"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source2" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_B"] }, notes: {} }],
      },
      {
        category: "best_team",
        subjectCharacterId: "firefly",
        metadata: { sourceId: "source3" },
        items: [{ rank: 1, payload: { teamMembers: ["Team_B"] }, notes: {} }],
      },
    ];

    await engine.computeAndStoreConsensus("release-id", sets);

    expect(mockDb.insert).toHaveBeenCalledTimes(2);
    // Values captures the actual payloadJson inserted
    const valuesMock = mockDb.values as unknown as import("vitest").Mock;
    const callArgs = valuesMock.mock.calls[valuesMock.mock.calls.length - 1][0] as { payloadJson: string };
    expect(callArgs.payloadJson).toContain("Team_B");
    expect(callArgs.payloadJson).not.toContain("Team_A");
  });
});
