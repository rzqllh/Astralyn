// packages/shared/test/du-recommendation.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateDUBlessingChoices,
  evaluateDUEquationChoices,
  evaluateDUCurioChoices,
} from "../src/du/recommendation";
import type { DURunContext } from "../src/du/types";
import type { DUBlessingKnowledge, DUCurioKnowledge } from "../src/knowledge/divergent-universe";
import {
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
} from "../src/knowledge/fixtures";

// ---------------------------------------------------------------------------
// Fixtures derived from canonical data
// ---------------------------------------------------------------------------

const bHunt = CANONICAL_DU_BLESSINGS.find((b) => b.path === "Hunt")!; // celestial-annihilation, rarity 3
const bRemembrance = CANONICAL_DU_BLESSINGS.find((b) => b.path === "Remembrance")!; // perfect-experience-fuli, rarity 3
const bPreservation = CANONICAL_DU_BLESSINGS.find((b) => b.path === "Preservation")!; // macrosegregation, rarity 3

const eqSilentSinger = CANONICAL_DU_EQUATIONS.find((e) => e.id === "silent-singer")!; // Harmony/Elation, 2/2
const eqVoyageMonitor = CANONICAL_DU_EQUATIONS.find((e) => e.id === "voyage-monitor")!; // Remembrance/Preservation, 3/2

const curioWeighted = CANONICAL_DU_CURIOS.find((c) => c.category === "weighted")!; // interastral-peace, rarity 2
const curioNormal = CANONICAL_DU_CURIOS.find((c) => c.category === "normal")!;   // rubert-difference-engine, rarity 3

assert.ok(bHunt, "bHunt fixture must exist in canonical data");
assert.ok(bRemembrance, "bRemembrance fixture must exist");
assert.ok(bPreservation, "bPreservation fixture must exist");
assert.ok(eqSilentSinger, "eqSilentSinger fixture must exist");
assert.ok(eqVoyageMonitor, "eqVoyageMonitor fixture must exist");
assert.ok(curioWeighted, "curioWeighted fixture must exist");
assert.ok(curioNormal, "curioNormal fixture must exist");

// ---------------------------------------------------------------------------
// Helper: build a minimal DURunContext
// ---------------------------------------------------------------------------
function ctx(overrides: Partial<DURunContext> = {}): DURunContext {
  return {
    partyPaths: [],
    targetEquationIds: [],
    collectedBlessingIds: [],
    activeCurioIds: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Blessing evaluation tests
// ---------------------------------------------------------------------------

describe("evaluateDUBlessingChoices", () => {
  it("returns empty array when given no candidates", () => {
    const result = evaluateDUBlessingChoices([], ctx(), [], CANONICAL_DU_BLESSINGS);
    assert.deepEqual(result, []);
  });

  it("assigns rank 1 to the single candidate", () => {
    const [r] = evaluateDUBlessingChoices([bHunt], ctx(), [], CANONICAL_DU_BLESSINGS);
    assert.equal(r.rank, 1);
    assert.equal(r.isRecommended, true);
  });

  it("scores 3★ rarity baseline correctly (+20)", () => {
    const [r] = evaluateDUBlessingChoices([bHunt], ctx(), [], CANONICAL_DU_BLESSINGS);
    const rarityReason = r.reasons.find((re) => re.code === "RARITY_WEIGHT");
    assert.ok(rarityReason, "RARITY_WEIGHT reason must be present");
    assert.equal(rarityReason!.scoreDelta, 20);
  });

  it("scores +30 for equation progress when blessing path matches unfulfilled requirement", () => {
    // eqVoyageMonitor needs Remembrance blessings (primary)
    const result = evaluateDUBlessingChoices(
      [bRemembrance],
      ctx({ targetEquationIds: [eqVoyageMonitor.id], partyPaths: [] }),
      [eqVoyageMonitor],
      CANONICAL_DU_BLESSINGS
    );
    const r = result[0];
    const eqReason = r.reasons.find((re) => re.code === "EQUATION_PROGRESS");
    assert.ok(eqReason, "EQUATION_PROGRESS reason must be present");
    assert.equal(eqReason!.scoreDelta, 30);
    // score = 30 (equation) + 20 (rarity 3) = 50, clamped to 50
    assert.equal(r.score, 50);
  });

  it("scores +45 for equation completion when blessing fulfills final requirement", () => {
    // eqVoyageMonitor: primaryPath=Remembrance (3 required), secondaryPath=Preservation (2 required)
    // Collect 2 Remembrance already, need 1 more — bRemembrance triggers completion check
    // Build fake extra blessing records at the same path to simulate progress
    const fakeR1: DUBlessingKnowledge = { ...bRemembrance, id: "fake-r1" };
    const fakeR2: DUBlessingKnowledge = { ...bRemembrance, id: "fake-r2" };
    const fakeP1: DUBlessingKnowledge = { ...bPreservation, id: "fake-p1" };
    const fakeP2: DUBlessingKnowledge = { ...bPreservation, id: "fake-p2" };
    // Collected: 2 Remembrance + 2 Preservation (just need 1 more Remembrance)
    const allBlessings = [bRemembrance, bHunt, bPreservation, fakeR1, fakeR2, fakeP1, fakeP2];
    const collected = [fakeR1.id, fakeR2.id, fakeP1.id, fakeP2.id];

    const result = evaluateDUBlessingChoices(
      [bRemembrance],
      ctx({ targetEquationIds: [eqVoyageMonitor.id], collectedBlessingIds: collected }),
      [eqVoyageMonitor],
      allBlessings
    );
    const r = result[0];
    const completedReason = r.reasons.find((re) => re.code === "EQUATION_COMPLETED");
    assert.ok(completedReason, "EQUATION_COMPLETED reason must be present");
    assert.equal(completedReason!.scoreDelta, 45);
  });

  it("does not score EQUATION_PROGRESS when blessing path matches an already-fulfilled requirement of an incomplete equation", () => {
    // eqVoyageMonitor needs 3 Remembrance + 2 Preservation.
    // Collected: 3 Remembrance + 0 Preservation (Remembrance requirement is already met).
    // Candidate: bRemembrance (another Remembrance blessing).
    // Since Remembrance is already 3/3, bRemembrance does NOT match an unfulfilled requirement.
    const fakeR1 = { ...bRemembrance, id: "fake-r1" };
    const fakeR2 = { ...bRemembrance, id: "fake-r2" };
    const fakeR3 = { ...bRemembrance, id: "fake-r3" };
    const allBlessings = [bRemembrance, fakeR1, fakeR2, fakeR3];
    const collected = [fakeR1.id, fakeR2.id, fakeR3.id];

    const result = evaluateDUBlessingChoices(
      [bRemembrance],
      ctx({ targetEquationIds: [eqVoyageMonitor.id], collectedBlessingIds: collected }),
      [eqVoyageMonitor],
      allBlessings
    );
    const r = result[0];
    const eqReason = r.reasons.find((re) => re.code === "EQUATION_PROGRESS" || re.code === "EQUATION_COMPLETED");
    assert.strictEqual(eqReason, undefined, "Must NOT score equation progress for already-fulfilled requirement");
  });

  it("penalizes duplicate blessings with -100", () => {
    const [r] = evaluateDUBlessingChoices(
      [bHunt],
      ctx({ collectedBlessingIds: [bHunt.id] }),
      [],
      CANONICAL_DU_BLESSINGS
    );
    const dup = r.reasons.find((re) => re.code === "DUPLICATE_BLESSING");
    assert.ok(dup, "DUPLICATE_BLESSING reason must be present");
    assert.equal(r.score, 0); // clamped: -100 → 0
  });

  it("scores party path synergy carry (+25) when blessing path is in party", () => {
    const [r] = evaluateDUBlessingChoices(
      [bHunt],
      ctx({ partyPaths: ["Hunt", "Preservation"] }),
      [],
      CANONICAL_DU_BLESSINGS
    );
    const synergyReason = r.reasons.find((re) => re.code === "PARTY_PATH_SYNERGY_CARRY");
    assert.ok(synergyReason, "PARTY_PATH_SYNERGY_CARRY reason must be present");
    assert.equal(synergyReason!.scoreDelta, 25);
  });

  it("scores party path synergy support (+15) when blessing path is support type in party", () => {
    const [r] = evaluateDUBlessingChoices(
      [bPreservation],
      ctx({ partyPaths: ["Hunt", "Preservation"] }),
      [],
      CANONICAL_DU_BLESSINGS
    );
    const synergyReason = r.reasons.find((re) => re.code === "PARTY_PATH_SYNERGY_SUPPORT");
    assert.ok(synergyReason, "PARTY_PATH_SYNERGY_SUPPORT reason must be present");
    assert.equal(synergyReason!.scoreDelta, 15);
  });

  it("ranks correctly: higher score first, tie-break by entityId ascending", () => {
    // Force a tie by using same score candidates — use two 3★ blessings with no context
    const result = evaluateDUBlessingChoices(
      [bHunt, bRemembrance, bPreservation],
      ctx(),
      [],
      CANONICAL_DU_BLESSINGS
    );
    // All 3 get only RARITY_WEIGHT = 20, score = 20
    // Tie-break by id ascending
    const ids = result.map((r) => r.entityId);
    assert.equal(result[0].rank, 1);
    assert.equal(result[1].rank, 2);
    assert.equal(result[2].rank, 3);
    // Check tie-break is deterministic: sort by id
    const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    assert.deepEqual(ids, sorted);
  });

  it("clamps final score to 100 maximum", () => {
    // Give all positive signals: equation completed + synergy carry + rarity 3
    // Max possible: 45 + 25 + 20 = 90 (within bound), no test needed for actual overflow
    // but we verify it doesn't exceed 100
    const fakeR1: DUBlessingKnowledge = { ...bRemembrance, id: "fake-clamp-r1" };
    const fakeR2: DUBlessingKnowledge = { ...bRemembrance, id: "fake-clamp-r2" };
    const fakeP1: DUBlessingKnowledge = { ...bPreservation, id: "fake-clamp-p1" };
    const fakeP2: DUBlessingKnowledge = { ...bPreservation, id: "fake-clamp-p2" };
    const all = [bRemembrance, bPreservation, bHunt, fakeR1, fakeR2, fakeP1, fakeP2];
    const collected = [fakeR1.id, fakeR2.id, fakeP1.id, fakeP2.id];

    const result = evaluateDUBlessingChoices(
      [bRemembrance],
      ctx({
        targetEquationIds: [eqVoyageMonitor.id],
        collectedBlessingIds: collected,
        partyPaths: ["Remembrance"],
      }),
      [eqVoyageMonitor],
      all
    );
    assert.ok(result[0].score <= 100, "Score must not exceed 100");
    assert.ok(result[0].score >= 0, "Score must not be negative");
  });

  it("returns structured reason codes for all decisions", () => {
    const [r] = evaluateDUBlessingChoices(
      [bHunt],
      ctx({ partyPaths: ["Hunt"], targetEquationIds: [], collectedBlessingIds: [] }),
      [],
      CANONICAL_DU_BLESSINGS
    );
    for (const reason of r.reasons) {
      assert.ok(reason.code, "Each reason must have a code");
      assert.ok(reason.category, "Each reason must have a category");
      assert.equal(typeof reason.scoreDelta, "number", "scoreDelta must be a number");
      assert.ok(reason.message, "Each reason must have a message");
    }
  });
});

// ---------------------------------------------------------------------------
// Equation evaluation tests
// ---------------------------------------------------------------------------

describe("evaluateDUEquationChoices", () => {
  it("returns empty array when given no candidates", () => {
    const result = evaluateDUEquationChoices([], ctx(), CANONICAL_DU_BLESSINGS);
    assert.deepEqual(result, []);
  });

  it("scores party path match for primary path (+25)", () => {
    // eqSilentSinger: primary=Harmony, secondary=Elation
    const [r] = evaluateDUEquationChoices(
      [eqSilentSinger],
      ctx({ partyPaths: ["Harmony"] }),
      CANONICAL_DU_BLESSINGS
    );
    const matchReason = r.reasons.find((re) => re.code === "EQUATION_PATH_MATCH" && re.scoreDelta === 25);
    assert.ok(matchReason, "EQUATION_PATH_MATCH +25 for primary path alignment");
  });

  it("scores party path match for secondary path (+15)", () => {
    // eqSilentSinger: secondary=Elation
    const [r] = evaluateDUEquationChoices(
      [eqSilentSinger],
      ctx({ partyPaths: ["Elation"] }),
      CANONICAL_DU_BLESSINGS
    );
    const matchReason = r.reasons.find((re) => re.code === "EQUATION_PATH_MATCH" && re.scoreDelta === 15);
    assert.ok(matchReason, "EQUATION_PATH_MATCH +15 for secondary path alignment");
  });

  it("emits NO_EQUATION_MATCH reason when party has no overlap", () => {
    const [r] = evaluateDUEquationChoices(
      [eqSilentSinger],
      ctx({ partyPaths: ["Destruction", "Hunt"] }),
      CANONICAL_DU_BLESSINGS
    );
    const noMatch = r.reasons.find((re) => re.code === "NO_EQUATION_MATCH");
    assert.ok(noMatch, "NO_EQUATION_MATCH reason must be present when no path overlap");
  });

  it("ranks higher equation first based on score", () => {
    // eqVoyageMonitor: Remembrance (primary)/Preservation (secondary)
    // With Remembrance + Preservation party: both match = 25+15 = 40 bonus
    // eqSilentSinger: Harmony (primary)/Elation (secondary) — no match with party
    const result = evaluateDUEquationChoices(
      [eqSilentSinger, eqVoyageMonitor],
      ctx({ partyPaths: ["Remembrance", "Preservation"] }),
      CANONICAL_DU_BLESSINGS
    );
    assert.equal(result[0].entityId, eqVoyageMonitor.id, "VoyageMonitor must rank #1 with matching party");
    assert.equal(result[0].rank, 1);
    assert.equal(result[1].rank, 2);
  });

  it("clamps scores to [0, 100]", () => {
    const result = evaluateDUEquationChoices(
      [eqSilentSinger, eqVoyageMonitor],
      ctx({ partyPaths: ["Harmony", "Elation", "Remembrance", "Preservation"] }),
      CANONICAL_DU_BLESSINGS
    );
    for (const r of result) {
      assert.ok(r.score >= 0 && r.score <= 100, `Score ${r.score} must be in [0, 100]`);
    }
  });

  it("is deterministic — same inputs produce same output", () => {
    const a = evaluateDUEquationChoices(
      [eqSilentSinger, eqVoyageMonitor],
      ctx({ partyPaths: ["Harmony"] }),
      CANONICAL_DU_BLESSINGS
    );
    const b = evaluateDUEquationChoices(
      [eqSilentSinger, eqVoyageMonitor],
      ctx({ partyPaths: ["Harmony"] }),
      CANONICAL_DU_BLESSINGS
    );
    assert.deepEqual(a, b);
  });

  it("caps achievability progress bonus at SCORE_EQUATION_PROGRESS when collected blessings exceed requirement", () => {
    // eqSilentSinger requires 2 Harmony + 2 Elation (total 4)
    // Suppose user has 5 Harmony blessings collected (excess of 2)
    const h1 = { ...bHunt, id: "h1", path: "Harmony" as const };
    const h2 = { ...bHunt, id: "h2", path: "Harmony" as const };
    const h3 = { ...bHunt, id: "h3", path: "Harmony" as const };
    const h4 = { ...bHunt, id: "h4", path: "Harmony" as const };
    const h5 = { ...bHunt, id: "h5", path: "Harmony" as const };
    const allBlessings = [h1, h2, h3, h4, h5];
    const collected = [h1.id, h2.id, h3.id, h4.id, h5.id];

    const [r] = evaluateDUEquationChoices(
      [eqSilentSinger],
      ctx({ collectedBlessingIds: collected }),
      allBlessings
    );
    const progressReason = r.reasons.find((re) => re.code === "EQUATION_PROGRESS");
    assert.ok(progressReason, "EQUATION_PROGRESS reason must be present");
    // Effective progress: 2 Harmony capped / 4 total = 0.5 * 30 = 15
    assert.equal(progressReason!.scoreDelta, 15);
    assert.ok(progressReason!.message.includes("2/4 required blessings already collected"));
  });
});

// ---------------------------------------------------------------------------
// Curio evaluation tests
// ---------------------------------------------------------------------------

describe("evaluateDUCurioChoices", () => {
  it("returns empty array when given no candidates", () => {
    assert.deepEqual(evaluateDUCurioChoices([], ctx()), []);
  });

  it("scores weighted curio +40 (WEIGHTED_CURIO_SYNERGY)", () => {
    const [r] = evaluateDUCurioChoices([curioWeighted], ctx());
    const reason = r.reasons.find((re) => re.code === "WEIGHTED_CURIO_SYNERGY");
    assert.ok(reason, "WEIGHTED_CURIO_SYNERGY must be present for weighted curio");
    assert.equal(reason!.scoreDelta, 40);
  });

  it("scores normal curio +25 (CURIO_UTILITY)", () => {
    const [r] = evaluateDUCurioChoices([curioNormal], ctx());
    const reason = r.reasons.find((re) => re.code === "CURIO_UTILITY");
    assert.ok(reason, "CURIO_UTILITY must be present for normal curio");
    assert.equal(reason!.scoreDelta, 25);
  });

  it("penalizes negative curio -20 (NEGATIVE_CURIO_RISK)", () => {
    const negativeCurio: DUCurioKnowledge = {
      id: "test-negative",
      gameId: "999",
      name: "Cursed Artifact",
      entityType: "curio",
      rarity: 2,
      category: "negative",
      effect: "Deals 10% HP to all allies at start of each wave.",
      releaseVersion: "2.3",
      provenance: {
        tier: "A",
        sourceId: "test",
        sourceUrl: "https://example.com",
        dataVersion: "2.3",
        notes: "test",
      },
    };
    const [r] = evaluateDUCurioChoices([negativeCurio], ctx());
    const reason = r.reasons.find((re) => re.code === "NEGATIVE_CURIO_RISK");
    assert.ok(reason, "NEGATIVE_CURIO_RISK must be present for negative curio");
    assert.equal(reason!.scoreDelta, -20);
    // Score: -20 + 12 (rarity 2) = -8 → clamped to 0
    assert.equal(r.score, 0);
  });

  it("ranks weighted curio above normal curio", () => {
    // weighted = 40 + 12 (rarity 2) = 52
    // normal = 25 + 20 (rarity 3) = 45
    const result = evaluateDUCurioChoices([curioNormal, curioWeighted], ctx());
    assert.equal(result[0].entityId, curioWeighted.id, "weighted curio must rank #1");
    assert.equal(result[0].rank, 1);
    assert.equal(result[0].isRecommended, true);
  });

  it("tie-breaks by entityId when scores are equal", () => {
    const curioA: DUCurioKnowledge = { ...curioNormal, id: "aaa-curio" };
    const curioB: DUCurioKnowledge = { ...curioNormal, id: "zzz-curio" };
    const result = evaluateDUCurioChoices([curioB, curioA], ctx());
    // Both are normal + rarity 3 → score = 45
    assert.equal(result[0].entityId, "aaa-curio", "aaa comes before zzz in ascending id tie-break");
  });

  it("clamps all scores to [0, 100]", () => {
    const result = evaluateDUCurioChoices([curioNormal, curioWeighted], ctx());
    for (const r of result) {
      assert.ok(r.score >= 0 && r.score <= 100, `Score ${r.score} out of bounds`);
    }
  });

  it("does not mutate the input array", () => {
    const candidates = [curioNormal, curioWeighted];
    const copy = [...candidates];
    evaluateDUCurioChoices(candidates, ctx());
    assert.deepEqual(candidates, copy, "Input array must not be mutated");
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting determinism tests
// ---------------------------------------------------------------------------

describe("Determinism invariants", () => {
  it("evaluateDUBlessingChoices is pure — does not mutate context", () => {
    const context = ctx({ partyPaths: ["Hunt"], collectedBlessingIds: [] });
    const frozen = JSON.stringify(context);
    evaluateDUBlessingChoices([bHunt, bRemembrance], context, [], CANONICAL_DU_BLESSINGS);
    assert.equal(JSON.stringify(context), frozen, "Context must not be mutated");
  });

  it("blessing evaluation with same inputs is deterministically identical across multiple calls", () => {
    const context = ctx({ partyPaths: ["Hunt", "Preservation"], targetEquationIds: [eqVoyageMonitor.id] });
    const a = evaluateDUBlessingChoices(
      [bHunt, bRemembrance, bPreservation],
      context,
      [eqVoyageMonitor],
      CANONICAL_DU_BLESSINGS
    );
    const b = evaluateDUBlessingChoices(
      [bHunt, bRemembrance, bPreservation],
      context,
      [eqVoyageMonitor],
      CANONICAL_DU_BLESSINGS
    );
    assert.deepEqual(a, b);
  });
});
