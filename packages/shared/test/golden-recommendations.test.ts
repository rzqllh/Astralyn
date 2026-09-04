import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTeamRecommendations } from "../src/recommendation/team-generator";
import { CANONICAL_CHARACTERS } from "../src/knowledge/fixtures/canonical-fixtures";
import type { RosterInputCharacter } from "../src/recommendation/types";

function createRoster(ids: string[]): RosterInputCharacter[] {
  return ids.map((id) => ({
    characterId: id,
    level: 80,
    eidolon: 0,
    isOwned: true,
  }));
}

describe("Ranking Regression Golden Tests (Phase 5 Approved Policy)", () => {
  it("Golden Case 1: Firefly Break Core regression", () => {
    const roster = createRoster(["firefly", "gallagher", "tingyun", "robin", "the-herta"]);
    const result = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { focusCharacterId: "firefly", limit: 3 },
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "ok");
    assert.ok(result.teams.length >= 1);

    const topTeam = result.teams[0];
    assert.equal(topTeam.rank, 1);
    assert.equal(topTeam.signature, "firefly:gallagher:robin:tingyun");
    assert.equal(topTeam.archetype, "Super Break Destruction Hypercarry");

    const reasonCodes = topTeam.reasons.map((r) => r.code);
    assert.ok(reasonCodes.includes("ROLE_SUSTAIN_SECURED"));
    assert.ok(reasonCodes.includes("SYNERGY_SUPER_BREAK_CORE"));
  });

  it("Golden Case 2: Castorice Memosprite Netherwing regression", () => {
    const roster = createRoster(["castorice", "tingyun", "robin", "aventurine", "gallagher"]);
    const result = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { focusCharacterId: "castorice", limit: 3 },
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "ok");
    assert.ok(result.teams.length >= 1);

    const topTeam = result.teams[0];
    assert.equal(topTeam.rank, 1);
    assert.equal(topTeam.archetype, "Remembrance Memosprite Hypercarry");

    const reasonCodes = topTeam.reasons.map((r) => r.code);
    assert.ok(reasonCodes.includes("ROLE_SUSTAIN_SECURED"));
    assert.ok(reasonCodes.includes("SYNERGY_MEMOSPRITE_ACCEL"));
    assert.ok(reasonCodes.includes("SYNERGY_ENERGY_BATTERY"));
  });

  it("Golden Case 3: Mathematical Determinism & Mode Invariant", () => {
    const roster = createRoster([
      "firefly",
      "gallagher",
      "tingyun",
      "robin",
      "the-herta",
      "aventurine",
      "castorice",
    ]);

    // Run 1: general mode
    const run1 = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { mode: "general", limit: 3 },
    });

    // Run 2: memory_of_chaos mode (mode is non-scoring metadata, ranking must remain identical)
    const run2 = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { mode: "memory_of_chaos", limit: 3 },
    });

    // Bit-for-bit identical teams output
    assert.deepEqual(run1.teams, run2.teams);
    assert.equal(JSON.stringify(run1.teams), JSON.stringify(run2.teams));
    assert.equal("generatedAt" in run1, false);
  });

  it("Golden Case 4: Insufficient Roster Edge Case (< 4 characters)", () => {
    const roster = createRoster(["firefly", "gallagher", "tingyun"]);
    const result = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { limit: 3 },
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "insufficient_roster");
    assert.equal(result.teams.length, 0);
    assert.ok(result.message?.includes("fewer than 4"));
  });

  it("Golden Case 5: Missing Knowledge Exclusion & Warning", () => {
    // Roster includes an unknown character ID not present in canonical fixtures
    const roster = [
      ...createRoster(["firefly", "gallagher", "tingyun", "robin"]),
      { characterId: "nonexistent-hsr-char", level: 80, eidolon: 0, isOwned: true },
    ];

    const result = generateTeamRecommendations({
      roster,
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { limit: 3 },
    });

    assert.equal(result.success, true);
    assert.equal(result.status, "ok");
    assert.deepEqual(result.missingKnowledgeCharacterIds, ["nonexistent-hsr-char"]);
    // Evaluated only the 4 valid canonical members
    assert.equal(result.teams.length, 1);
    assert.equal(result.teams[0].signature, "firefly:gallagher:robin:tingyun");
  });
});
