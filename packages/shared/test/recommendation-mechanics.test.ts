import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scoreTeam,
  deterministicRoundHundred,
  type TeamMember,
} from "../src/recommendation/scoring";
import {
  buildTeamSignature,
  compareCodeUnits,
} from "../src/recommendation/types";
import { CANONICAL_CHARACTERS } from "../src/knowledge/fixtures/canonical-fixtures";

const charMap = new Map(CANONICAL_CHARACTERS.map((c) => [c.id, c]));

function getMember(id: string, eidolon = 0, level = 80): TeamMember {
  const knowledge = charMap.get(id);
  if (!knowledge) throw new Error(`Character '${id}' not found in canonical fixtures`);
  return {
    knowledge,
    roster: { characterId: id, level, eidolon, isOwned: true },
  };
}

describe("Recommendation Mechanics & Scoring Unit Tests", () => {
  it("verifies pure fixed-point half-up integer rounding helper", () => {
    assert.equal(deterministicRoundHundred(8450), 85);
    assert.equal(deterministicRoundHundred(8449), 84);
    assert.equal(deterministicRoundHundred(9000), 90);
    assert.equal(deterministicRoundHundred(0), 0);
    assert.equal(deterministicRoundHundred(10000), 100);
  });

  it("verifies code-unit comparison and deterministic signature generation", () => {
    assert.equal(compareCodeUnits("acheron", "firefly"), -1);
    assert.equal(compareCodeUnits("firefly", "acheron"), 1);
    assert.equal(compareCodeUnits("robin", "robin"), 0);

    const sig = buildTeamSignature(["tingyun", "acheron", "robin", "gallagher"]);
    assert.equal(sig, "acheron:gallagher:robin:tingyun");
  });

  it("verifies Role Coverage: sustain presence rewards 50 pts, lack of sustain penalizes", () => {
    // Team with sustain (Gallagher)
    const teamWithSustain: TeamMember[] = [
      getMember("firefly"),
      getMember("gallagher"),
      getMember("tingyun"),
      getMember("robin"),
    ];
    const scoredWith = scoreTeam(teamWithSustain);
    assert.equal(
      scoredWith.reasons.some((r) => r.code === "ROLE_SUSTAIN_SECURED"),
      true
    );

    // Team without sustain (Firefly, Robin, Tingyun, The Herta)
    const teamWithoutSustain: TeamMember[] = [
      getMember("firefly"),
      getMember("the-herta"),
      getMember("tingyun"),
      getMember("robin"),
    ];
    const scoredWithout = scoreTeam(teamWithoutSustain);
    assert.equal(
      scoredWithout.reasons.some((r) => r.code === "PENALTY_NO_SUSTAIN"),
      true
    );
    assert.ok(scoredWithout.roleScore < scoredWith.roleScore);
  });

  it("verifies Role Coverage: 3+ primary carries trigger PENALTY_TOO_MANY_CARRIES", () => {
    const multiCarryTeam: TeamMember[] = [
      getMember("acheron"),
      getMember("firefly"),
      getMember("the-herta"),
      getMember("gallagher"),
    ];
    const scored = scoreTeam(multiCarryTeam);
    assert.equal(
      scored.reasons.some((r) => r.code === "PENALTY_TOO_MANY_CARRIES"),
      true
    );
  });

  it("verifies Canonical Mechanic Synergy: Super Break Core (Firefly + Gallagher)", () => {
    const team: TeamMember[] = [
      getMember("firefly"),
      getMember("gallagher"),
      getMember("robin"),
      getMember("tingyun"),
    ];
    const scored = scoreTeam(team);
    const breakReason = scored.reasons.find((r) => r.code === "SYNERGY_SUPER_BREAK_CORE");
    assert.ok(breakReason);
    assert.equal(breakReason.scoreDelta, 25);
  });

  it("verifies Canonical Mechanic Synergy: Memosprite Acceleration (Castorice + Robin/Tingyun)", () => {
    const team: TeamMember[] = [
      getMember("castorice"),
      getMember("robin"),
      getMember("tingyun"),
      getMember("gallagher"),
    ];
    const scored = scoreTeam(team);
    const memoReason = scored.reasons.find((r) => r.code === "SYNERGY_MEMOSPRITE_ACCEL");
    assert.ok(memoReason);
    assert.equal(memoReason.scoreDelta, 25);
  });

  it("verifies Canonical Mechanic Synergy: Slashed Dream debuff feeding for Acheron", () => {
    const team: TeamMember[] = [
      getMember("acheron"),
      getMember("gallagher"),
      getMember("aventurine"),
      getMember("tingyun"),
    ];
    const scored = scoreTeam(team);
    const debuffReason = scored.reasons.find((r) => r.code === "SYNERGY_SLASHED_DREAM_FEED");
    assert.ok(debuffReason);
    assert.equal(debuffReason.scoreDelta, 30);
  });

  it("verifies Trace Constraint: Acheron E0 requires 2 Nihility allies; penalizes when deficient", () => {
    // Acheron E0 with Gallagher, Aventurine, Tingyun (0 other Nihility)
    const teamE0: TeamMember[] = [
      getMember("acheron", 0),
      getMember("gallagher"),
      getMember("aventurine"),
      getMember("tingyun"),
    ];
    const scoredE0 = scoreTeam(teamE0);
    assert.equal(
      scoredE0.reasons.some((r) => r.code === "ACHERON_NIHILITY_DEFICIT"),
      true
    );

    // Acheron E2 with Gallagher, Aventurine, Tingyun (still 0 other Nihility, so still deficient)
    const teamE2Deficient: TeamMember[] = [
      getMember("acheron", 2),
      getMember("gallagher"),
      getMember("aventurine"),
      getMember("tingyun"),
    ];
    const scoredE2Deficient = scoreTeam(teamE2Deficient);
    assert.equal(
      scoredE2Deficient.reasons.some((r) => r.code === "ACHERON_NIHILITY_DEFICIT"),
      true
    );
  });

  it("verifies Weakness Alignment: targetWeaknesses increases elementScore", () => {
    const team: TeamMember[] = [
      getMember("firefly"), // Fire
      getMember("gallagher"), // Fire
      getMember("robin"), // Physical
      getMember("tingyun"), // Lightning
    ];

    const unconstrained = scoreTeam(team);
    assert.equal(unconstrained.elementScore, 0);

    const withFireWeakness = scoreTeam(team, ["Fire"]);
    // 2 out of 4 members match Fire -> 50 pts
    assert.equal(withFireWeakness.elementScore, 50);

    const withFireAndLightning = scoreTeam(team, ["Fire", "Lightning"]);
    // 3 out of 4 members match Fire or Lightning -> 75 pts
    assert.equal(withFireAndLightning.elementScore, 75);
  });
});
