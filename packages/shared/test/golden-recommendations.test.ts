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

describe("Phase 10B.1 recommendation scope and evaluation bounds", () => {
  it("bounds scoring candidates derived from the 92-character canonical scope without fake ownership", () => {
    const result = generateTeamRecommendations({
      roster: [],
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { scope: "all_characters", limit: 3 },
    });

    assert.equal(CANONICAL_CHARACTERS.length, 92);
    assert.equal(result.scope, "all_characters");
    assert.equal(result.status, "ok");
    assert.deepEqual(result.evaluation, {
      candidateCount: 9,
      evaluatedTeamCount: 126,
      maxCandidateCount: 16,
      maxTeamEvaluations: 1820,
    });
    assert.ok(result.teams.every((team) => team.slots.every((slot) => slot.isOwned === false)));
    assert.ok(result.teams.every((team) => team.slots.every((slot) => slot.level === undefined)));
    assert.ok(result.teams.every((team) => team.slots.every((slot) => slot.eidolon === undefined)));
  });

  it("returns explicit insufficient roster for an empty owned-only roster", () => {
    const result = generateTeamRecommendations({
      roster: [],
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { scope: "owned_only" },
    });

    assert.equal(result.scope, "owned_only");
    assert.equal(result.status, "insufficient_roster");
    assert.equal(result.evaluation.candidateCount, 0);
    assert.equal(result.evaluation.evaluatedTeamCount, 0);
    assert.deepEqual(result.teams, []);
  });

  it("pins an unknown-taxonomy focus character and marks every resulting team as Limited Data", () => {
    const limitedCharacter = CANONICAL_CHARACTERS.find(
      (character) =>
        character.roles.includes("unknown") || character.mechanicTags.includes("unknown")
    );
    assert.ok(limitedCharacter);

    const result = generateTeamRecommendations({
      roster: [],
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: {
        scope: "all_characters",
        focusCharacterId: limitedCharacter.id,
        limit: 3,
      },
    });

    assert.equal(result.evaluation.candidateCount, 10);
    assert.equal(result.evaluation.evaluatedTeamCount, 84);
    assert.ok(
      result.teams.every((team) =>
        team.slots.some((slot) => slot.characterId === limitedCharacter.id)
      )
    );
    assert.ok(result.teams.every((team) => team.taxonomyStatus === "limited_data"));
    assert.ok(
      result.teams.every((team) =>
        team.limitedDataCharacterIds?.includes(limitedCharacter.id)
      )
    );
    assert.ok(
      result.teams.every((team) =>
        team.reasons.every(
          (reason) => !reason.characterIds?.includes(limitedCharacter.id)
        )
      )
    );
  });

  it("returns bit-for-bit identical bounded results for repeated canonical requests", () => {
    const options = {
      roster: [],
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { scope: "all_characters" as const, limit: 3 },
    };

    const first = generateTeamRecommendations(options);
    const second = generateTeamRecommendations(options);

    assert.deepEqual(first, second);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
  });

  it("preserves the approved top three outputs for the complete curated taxonomy", () => {
    const curatedIds = CANONICAL_CHARACTERS.filter(
      (character) =>
        !character.roles.includes("unknown") &&
        !character.mechanicTags.includes("unknown")
    ).map((character) => character.id);
    const result = generateTeamRecommendations({
      roster: createRoster(curatedIds),
      knowledgeCharacters: CANONICAL_CHARACTERS,
      context: { scope: "owned_only", limit: 3 },
    });

    assert.deepEqual(
      result.teams.map((team) => team.signature),
      [
        "aventurine:castorice:gallagher:robin",
        "aventurine-waveflair:castorice:gallagher:robin",
        "aventurine:castorice:robin:tingyun",
      ]
    );
  });
});
