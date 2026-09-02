import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useKnowledgeInit,
  useCharacters,
  useCharacter,
  useLightCones,
  useRelicSets,
  useEntitySearch,
} from "../src/lib/knowledge/use-knowledge";
import { knowledgeRepository } from "../src/lib/knowledge/repository";

describe("Phase 2.5 Knowledge Hooks Error & Empty State Discrimination", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("useKnowledgeInit returns valid syncResult and error === null on successful init", async () => {
    vi.spyOn(knowledgeRepository, "initialize").mockResolvedValueOnce({
      status: "fresh",
      activeKnowledgeVersion: "v1.0.0",
      gameVersion: "4.5",
      cachedAt: "2026-09-02T00:00:00Z",
      isOffline: false,
    });

    const { result } = renderHook(() => useKnowledgeInit());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.syncResult?.status).toBe("fresh");
    expect(result.current.syncResult?.activeKnowledgeVersion).toBe("v1.0.0");
  });

  it("useKnowledgeInit handles unavailable sync result with error object", async () => {
    vi.spyOn(knowledgeRepository, "initialize").mockResolvedValueOnce({
      status: "unavailable",
      activeKnowledgeVersion: null,
      gameVersion: null,
      cachedAt: null,
      error: "Remote manifest unavailable and local cache is empty",
      isOffline: true,
    });

    const { result } = renderHook(() => useKnowledgeInit());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.syncResult?.status).toBe("unavailable");
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("Remote manifest unavailable");
  });

  it("useKnowledgeInit handles thrown rejection gracefully", async () => {
    vi.spyOn(knowledgeRepository, "initialize").mockRejectedValueOnce(
      new Error("Dexie open failed")
    );

    const { result } = renderHook(() => useKnowledgeInit());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.syncResult?.status).toBe("unavailable");
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Dexie open failed");
  });

  it("useCharacters distinguishes valid empty data from read failure", async () => {
    // 1. Valid empty result
    vi.spyOn(knowledgeRepository, "listCharacters").mockResolvedValueOnce([]);

    const { result: emptyRes } = renderHook(() => useCharacters());

    await waitFor(() => {
      expect(emptyRes.current.loading).toBe(false);
    });

    expect(emptyRes.current.characters).toEqual([]);
    expect(emptyRes.current.error).toBeNull();

    // 2. Read failure
    vi.spyOn(knowledgeRepository, "listCharacters").mockRejectedValueOnce(
      new Error("IndexedDB read error")
    );

    const { result: failRes } = renderHook(() => useCharacters());

    await waitFor(() => {
      expect(failRes.current.loading).toBe(false);
    });

    expect(failRes.current.characters).toEqual([]);
    expect(failRes.current.error).toBeInstanceOf(Error);
    expect(failRes.current.error?.message).toBe("IndexedDB read error");
  });

  it("useCharacter distinguishes not found from read error", async () => {
    // 1. Valid not found (returns null, error === null)
    vi.spyOn(knowledgeRepository, "getCharacter").mockResolvedValueOnce(null);

    const { result: notFoundRes } = renderHook(() => useCharacter("unknown_id"));

    await waitFor(() => {
      expect(notFoundRes.current.loading).toBe(false);
    });

    expect(notFoundRes.current.character).toBeNull();
    expect(notFoundRes.current.error).toBeNull();

    // 2. Read failure
    vi.spyOn(knowledgeRepository, "getCharacter").mockRejectedValueOnce(
      new Error("Transaction aborted")
    );

    const { result: failRes } = renderHook(() => useCharacter("acheron"));

    await waitFor(() => {
      expect(failRes.current.loading).toBe(false);
    });

    expect(failRes.current.character).toBeNull();
    expect(failRes.current.error).toBeInstanceOf(Error);
    expect(failRes.current.error?.message).toBe("Transaction aborted");
  });

  it("useLightCones exposes errors on rejection", async () => {
    vi.spyOn(knowledgeRepository, "listLightCones").mockRejectedValueOnce(
      new Error("Light cone read failure")
    );

    const { result } = renderHook(() => useLightCones());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lightCones).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Light cone read failure");
  });

  it("useRelicSets exposes errors on rejection", async () => {
    vi.spyOn(knowledgeRepository, "listRelicSets").mockRejectedValueOnce(
      new Error("Relic set read failure")
    );

    const { result } = renderHook(() => useRelicSets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.relicSets).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Relic set read failure");
  });

  it("useEntitySearch distinguishes valid empty query from error", async () => {
    // 1. Empty query
    const { result: emptyRes } = renderHook(() => useEntitySearch(""));
    expect(emptyRes.current.results).toEqual([]);
    expect(emptyRes.current.error).toBeNull();
    expect(emptyRes.current.loading).toBe(false);

    // 2. Search error
    vi.spyOn(knowledgeRepository, "searchEntities").mockRejectedValueOnce(
      new Error("Search index failure")
    );

    const { result: failRes } = renderHook(() => useEntitySearch("Acheron"));

    await waitFor(() => {
      expect(failRes.current.loading).toBe(false);
    });

    expect(failRes.current.results).toEqual([]);
    expect(failRes.current.error).toBeInstanceOf(Error);
    expect(failRes.current.error?.message).toBe("Search index failure");
  });
});
