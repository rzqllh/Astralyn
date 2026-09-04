# Phase 5 — Deterministic Recommendation Engine

Status: Complete. Target: Local Development. Date: 2026-09-04.  
Governance: Anchored in Decision [D-028](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-028--phase-5-deterministic-scoring-policy--versioned-engineering-heuristics).

---

## 1. Objectives & Canonical Scope

Phase 5 implements the core computational intelligence of Astralyn: a 100% deterministic, source-grounded, roster-aware recommendation engine. It operates strictly on verified canonical game knowledge present in the repository, calculating mathematically reproducible team recommendations with transparent explainability.

### Primary Objectives:
1. **Deterministic Team Scoring Algorithm (`packages/shared`):** Evaluate any 4-character combination against role completeness and mechanical tag synergies grounded strictly in verified Tier A canonical character data using pure fixed-point integer math.
2. **Roster-Aware Combinatorial Search:** Generate 4-character team combinations strictly from the user's authenticated Phase 4 roster (`user_roster`), evaluating all valid combinations and ranking the Top 1–3 teams.
3. **Structured Explainability (Reason Codes):** Every recommendation emits machine-readable reason codes and concise human-readable explanations detailing role fulfillment, mechanical synergies, and specific kit interactions.
4. **Frozen Golden Regression Suite:** Reference fixtures authored strictly using the 9 verified canonical characters in `CANONICAL_CHARACTERS` enforcing bit-for-bit recommendation stability.
5. **Zero-Persistence Derived Engine:** Calculations remain purely derived functions evaluated in-memory from the live roster and immutable knowledge releases. Zero new D1 tables, zero migrations, zero database quota consumption.

---

## 2. Canonical Data Audit (Verified Repository State)

An audit of `packages/shared/src/knowledge/fixtures/canonical-fixtures.ts` and `apps/web/public/data/v1.0.0/characters.json` establishes the exact factual foundation available for Phase 5:

| Data Concern | Status in Current Repository | Evidence & Canonical Grounding | Engine Handling in Phase 5 |
|---|---|---|---|
| **Character Roster** | **SUFFICIENT** | 9 verified characters in `CANONICAL_CHARACTERS` (`acheron`, `castorice`, `firefly`, `robin`, `aventurine`, `gallagher`, `tingyun`, `the-herta`, `aventurine-waveflair`). User roster in D1 `user_roster`. | Candidate pool sourced strictly from authenticated user's owned characters (`is_owned = 1`). |
| **Role Coverage** | **SUFFICIENT** | Strongly typed `roles: CharacterRole[]` populated on all 9 characters (`hypercarry_dps`, `sub_dps`, `buffer`, `debuffer`, `shielder`, `healer`, `battery`, `break_dps`, `summon_dps`, `elation_dps`). | Evaluated deterministically to ensure required combat roles (sustain, carry, amplifier). |
| **Mechanic Synergy** | **SUFFICIENT** | Strongly typed `mechanicTags: CharacterMechanicTag[]` populated on all 9 characters (`super_break`, `break_effect`, `memosprite`, `summon`, `action_advance`, `follow_up`, `energy_regen`, `shield`, `heal`, `debuff`, `interpretation`, `inspiration`, `elation`, `punchline`, `fervor`). | Evaluated deterministically via explicit cross-tag pairing rules. |
| **SP Economy Data** | **INSUFFICIENT** | Abilities declare `spCost: 1` on skills, but the schema lacks turn cadence, basic-attack SP generation rates, action-order simulation, and rotation models. | **UNSUPPORTED / UNAVAILABLE.** The engine will NOT invent rotation numbers; SP evaluation status is returned as `unavailable`. |
| **Eidolon Rules** | **PARTIALLY SUFFICIENT** | Eidolons 1–6 are present as text descriptions and `keyMechanic` strings. Machine-readable trace rules exist for specific verified kits (e.g. Acheron Trace A4 "The Abyss" requiring 1 or 2 Nihility characters, modified by Eidolon 2). | Only explicitly verified mechanical trace/eidolon constraints are coded (e.g. Acheron E2 Nihility requirement reduction). General numeric formulas are not invented. |
| **Editorial Consensus** | **NOT AVAILABLE** | `editorial-recommendations.json` does NOT exist in the repository. No Tier C editorial guide datasets are currently ingested. | **EXPLICITLY UNAVAILABLE / MECHANICAL-ONLY.** The engine marks consensus as `unavailable` (`coverage: "mechanical_only"`). Never invent guide sources. |

---

## 3. Strict Classification: Canonical Facts, Engineering Policy, and Provisional Tuning

Per Decision [D-028](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-028--phase-5-deterministic-scoring-policy--versioned-engineering-heuristics), all parameters are strictly partitioned:

### A. Canonical Facts (Sourced directly from verified game data)
- Acheron is a Nihility Lightning carry who uses Slashed Dream instead of Energy and requires other Nihility allies for Trace A4 multiplier, relaxed at E2.
- Castorice summons Memosprite Netherwing, scaling on HP and Quantum damage.
- Firefly is a Destruction Fire carry who converts Break Effect to Super Break in Complete Combustion.
- Robin is a Harmony Physical buffer who advances all allies' actions and buffs Follow-Up Attacks.
- Aventurine is a Preservation Imaginary shielder whose shield stacks and triggers Follow-Up attacks.
- Gallagher is an Abundance Fire healer who inflicts Besotted (debuff) and scales healing with Break Effect.
- Tingyun is a Harmony Lightning buffer who restores 50 Energy (60 at E6) and grants Benediction ATK buff.
- The Herta is an Erudition Ice carry utilizing Interpretation and Inspiration stacks for AoE damage.
- Aventurine • Waveflair is an Elation Quantum carry utilizing Punchline and Fervor mechanics.

### B. Deterministic Engineering Policies (Adopted project decisions)
- **Team Size:** Exactly 4 unique characters per team.
- **Combination Generation:** Combinations ($C(N, 4)$), not permutations ($P(N, 4)$). Slot assignment is a presentation concern, not a composition filter.
- **Sustain Requirement:** A functional team in standard challenge content requires at least 1 sustain (`healer` or `shielder`).
- **Archetype Purity:** Teams should not mix mutually exclusive hypercarry anchors (e.g. Acheron + Firefly + Castorice in one team without synergy).
- **Tie-Breaking Determinism:** Identical scores are resolved strictly by deterministic code-unit signature:
  `score DESC` $\to$ `synergyScore DESC` $\to$ `roleScore DESC` $\to$ `codeUnitCompare(sigA, sigB) ASC`.
- **Pure Fixed-Point Integer Math:** No floating-point multiplication, division, or rounding anywhere in the engine.

### C. Provisional Tuning Parameters (Subject to golden fixture calibration)
The following scoring weights are engineering heuristics, explicitly flagged as provisional:
- **Role Coverage Weight ($W_{\text{role}}$):** 45 (or 50 when targetWeaknesses is empty)
- **Tag Synergy Weight ($W_{\text{synergy}}$):** 45 (or 50 when targetWeaknesses is empty)
- **Elemental Weakness Weight ($W_{\text{element}}$):** 10 (active only when targetWeaknesses is provided)
- **Anti-Synergy Penalty Scale ($P_{\text{anti}}$):** Direct point deductions (e.g. 25 pts for Acheron Nihility deficit)

---

## 4. Pure Fixed-Point Integer Scoring Specification

To eliminate IEEE 754 floating-point rounding variance across platforms, all calculations use pure integer arithmetic.

### 1. Integer Weights ($W \in \mathbb{N}$)
- **Standard Mode (when `targetWeaknesses` is provided):**
  - $W_{\text{role}} = 45$
  - $W_{\text{synergy}} = 45$
  - $W_{\text{element}} = 10$
  - Total Weight = $45 + 45 + 10 = 100$
- **Unconstrained Mode (when `targetWeaknesses` is omitted or empty):**
  - $W_{\text{role}} = 50$
  - $W_{\text{synergy}} = 50$
  - $W_{\text{element}} = 0$
  - Total Weight = $50 + 50 + 0 = 100$

### 2. Weighted Sum & Half-Up Integer Rounding
Given integer subscores $S_{\text{role}}, S_{\text{synergy}}, S_{\text{element}} \in [0, 100]$:
$$\text{weighted} = (S_{\text{role}} \times W_{\text{role}}) + (S_{\text{synergy}} \times W_{\text{synergy}}) + (S_{\text{element}} \times W_{\text{element}})$$

Exact integer half-up division by 100:
```ts
function deterministicRoundHundred(weighted: number): number {
  // Integer division with exact half-up rounding: (weighted + 50) / 100
  return Math.floor((weighted + 50) / 100);
}
```

### 3. Penalty & Final Clamping
$$S_{\text{beforePenalty}} = \text{deterministicRoundHundred}(\text{weighted})$$
$$S_{\text{team}} = \max(0, \min(100, S_{\text{beforePenalty}} - P_{\text{anti}}))$$

### 4. Subscore Definitions (All Integers $\in [0, 100]$)

#### A. Role Coverage Score ($S_{\text{role}}$)
- **Sustain Check:**
  - Has $\ge 1$ character with role `shielder` or `healer`: **50 pts**.
  - 0 sustains: **0 pts** (emits `PENALTY_NO_SUSTAIN`).
- **Damage Anchor Check:**
  - Exactly 1 Primary Carry (`hypercarry_dps`, `break_dps`, `summon_dps`, `elation_dps`): **30 pts**.
  - Synergistic Dual-Carry: **25 pts**.
  - 3+ Primary Carries: **5 pts** (emits `PENALTY_TOO_MANY_CARRIES`).
  - 0 Carries: **0 pts**.
- **Support / Amplification Check:**
  - Has 1–2 characters with role `buffer`, `debuffer`, or `battery`: **20 pts**.
  - 0 amplifiers: **0 pts**.

#### B. Mechanic Synergy Score ($S_{\text{synergy}}$)
Evaluated deterministically from canonical `mechanicTags`:
- **Super Break Core:** `break_dps`/`break_effect` carry + `break_effect`/`heal`/`debuff` teammate (e.g. Firefly + Gallagher): **+25 pts** (`SYNERGY_SUPER_BREAK_CORE`).
- **Memosprite Acceleration:** `memosprite`/`summon` carry + `action_advance`/`energy_regen`/`buff` amplifier (e.g. Castorice + Robin/Tingyun): **+25 pts** (`SYNERGY_MEMOSPRITE_ACCEL`).
- **Debuff Accumulation for Slashed Dream:** `special_resource_cost` carry (Acheron) + teammates with `debuff` tags (e.g. Gallagher Besotted, Aventurine Unnerved): **+30 pts** (`SYNERGY_SLASHED_DREAM_FEED`).
- **Follow-Up & Elation Synergy:** `follow_up`/`elation` carry + `follow_up`/`buff` teammate (e.g. Aventurine + Robin, or Aventurine • Waveflair): **+25 pts** (`SYNERGY_FOLLOW_UP_BATTERY`).
- **Energy Battery:** High Energy cost carry + `energy_regen`/`battery` teammate (e.g. Castorice/The Herta/Robin + Tingyun): **+20 pts** (`SYNERGY_ENERGY_BATTERY`).
- Clamped: $S_{\text{synergy}} = \min(100, \sum \text{synergy points})$.

#### C. Elemental Weakness Alignment ($S_{\text{element}}$)
- Active only when `targetWeaknesses` is provided.
- Points proportional to team members whose canonical `element` matches a target weakness:
  $S_{\text{element}} = \text{Math.floor}((\text{matching members} \times 100) / 4)$.

#### D. Trace Anti-Synergy Deductions ($P_{\text{anti}}$)
- **Acheron Trace A4 Nihility Deficit:**
  If team includes Acheron:
  - If Acheron Eidolon $< 2$: requires at least 2 other Nihility characters. If fewer than 2 Nihility allies are present, $P_{\text{anti}} = 25$ (`ACHERON_NIHILITY_DEFICIT`).
  - If Acheron Eidolon $\ge 2$: requires only 1 other Nihility character. If 1 other Nihility ally is present, emit `EIDOLON_CONSTRAINT_RELAXED` with $P_{\text{anti}} = 0$. If 0 Nihility allies present, $P_{\text{anti}} = 25$.

---

## 5. Context & Mode Policy

### Mode Audit:
In current canonical data, character and stage entities contain no mode-specific damage multipliers or mode-specific scoring weights (e.g., Pure Fiction AoE scaling vs Memory of Chaos single-target scaling).

### Mode Policy in Phase 5:
- `RecommendationContext.mode?: "general" | "memory_of_chaos" | "pure_fiction" | "apocalyptic_shadow" | "divergent_universe"` is retained strictly as **non-scoring contextual metadata**.
- The engine guarantees that `mode` does **NOT** alter team scores or ranking in Phase 5. Mode-specific optimization will only be introduced when canonical mode rules are formally ingested.

---

## 6. Locale-Independent Code-Unit Tie-Breaking

To guarantee bit-for-bit identical sorting across all operating systems, runtimes, and system locales, string comparisons strictly avoid `String.prototype.localeCompare()`.

### Code-Unit Comparison Function:
```ts
function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
```

### Deterministic Sorting Pipeline:
```ts
teams.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  if (b.synergyScore !== a.synergyScore) return b.synergyScore - a.synergyScore;
  if (b.roleScore !== a.roleScore) return b.roleScore - a.roleScore;
  return compareCodeUnits(a.signature, b.signature);
});
```
Where `signature = team.characterIds.slice().sort(compareCodeUnits).join(":")`.

---

## 7. Team Candidate Generation Strategy

1. **Unordered Combinations:**
   - Candidate pool = strictly user's `user_roster` (characters where `is_owned === 1`).
   - The engine generates unordered 4-character combinations: $\binom{N}{4}$.
   - For a roster of 9 canonical characters: $\binom{9}{4} = 126$ total combinations (< 1ms evaluation).
2. **Zero Pre-Pruning:**
   - The engine does NOT prune candidates by level or rarity before evaluation. All combinations from the owned roster are evaluated, ensuring 4★ synergy units (e.g. Tingyun, Gallagher) are never discarded.
3. **Role & Slot Assignment Post-Generation:**
   - Slots are assigned after combination selection using a canonical presentation policy:
     - **Slot 1 (Anchor / Carry):** Highest carry priority (`hypercarry_dps` > `break_dps` > `summon_dps` > `elation_dps`).
     - **Slot 2 (Primary Support / Sub-DPS):** Buffer, debuffer, or sub-DPS matching the carry's archetype.
     - **Slot 3 (Secondary Support):** Second buffer/debuffer/battery.
     - **Slot 4 (Sustain):** Healer or shielder.

---

## 8. Explicit API Validation & Error Behavior

For `POST /api/recommendations/teams`:

| Condition | HTTP Status | Response Payload |
|---|---|---|
| Caller has no valid session cookie | **401 Unauthorized** | `{ error: "UNAUTHORIZED", message: "Authentication required" }` |
| `focusCharacterId` is provided but not in user's owned roster | **400 Bad Request** | `{ error: "FOCUS_CHARACTER_NOT_OWNED", message: "Focus character is not present in owned roster" }` |
| `focusCharacterId` does not exist in canonical knowledge | **400 Bad Request** | `{ error: "UNKNOWN_CHARACTER_ID", message: "Character ID is not recognized in canonical knowledge" }` |
| `targetWeaknesses` contains an invalid element enum | **400 Bad Request** | `{ error: "INVALID_TARGET_WEAKNESS", message: "Invalid element in targetWeaknesses; must be one of the 7 Combat Elements" }` |
| `limit` is $< 1$ or $> 10$ or not an integer | **400 Bad Request** | `{ error: "INVALID_LIMIT", message: "Limit must be an integer between 1 and 10" }` |
| User has $< 4$ owned characters in roster | **200 OK** | `{ success: true, status: "insufficient_roster", teams: [], message: "Roster has fewer than 4 owned characters (X available). At least 4 characters required." }` |
| An owned character ID in D1 is missing from canonical knowledge | **Handled Gracefully** | Log diagnostic warning, exclude unrecognized character from candidate pool, and proceed with valid characters. (If valid characters $< 4$, return `insufficient_roster`). |

### Deterministic Output Shape (Zero Timestamps):
```json
{
  "success": true,
  "gameVersion": "4.5",
  "knowledgeVersion": "v1.0.0",
  "spStatus": "unavailable",
  "consensusStatus": "mechanical_only",
  "teams": [
    {
      "rank": 1,
      "score": 90,
      "roleScore": 100,
      "synergyScore": 80,
      "elementScore": 0,
      "signature": "acheron:aventurine:gallagher:tingyun",
      "archetype": "Nihility Slashed Dream Hypercarry",
      "slots": [
        { "slot": 1, "characterId": "acheron", "role": "hypercarry_dps", "level": 80, "eidolon": 0 },
        { "slot": 2, "characterId": "gallagher", "role": "healer", "level": 80, "eidolon": 0 },
        { "slot": 3, "characterId": "tingyun", "role": "battery", "level": 75, "eidolon": 2 },
        { "slot": 4, "characterId": "aventurine", "role": "shielder", "level": 80, "eidolon": 0 }
      ],
      "reasons": [
        {
          "code": "ROLE_SUSTAIN_SECURED",
          "category": "role",
          "type": "positive",
          "scoreDelta": 50,
          "message": "Gallagher and Aventurine provide complete survivability."
        }
      ]
    }
  ]
}
```

---

## 9. Golden Regression Test Policy & Decoupling

Per Decision [D-028](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-028--phase-5-deterministic-scoring-policy--versioned-engineering-heuristics), testing is strictly partitioned into two independent suites:

### Suite 1: Canonical Mechanics & Reason-Code Unit Tests
- Verifies individual scoring rules on isolated inputs:
  - Role completeness test (50 pts for sustain, 0 pts for 0 sustain + `PENALTY_NO_SUSTAIN`).
  - Super Break tag pair test (Firefly + Gallagher emits `SYNERGY_SUPER_BREAK_CORE`).
  - Acheron Trace A4 Nihility deficit test (Acheron E0 + 0 Nihility allies emits `ACHERON_NIHILITY_DEFICIT`).
  - Acheron E2 constraint relaxation test (Acheron E2 + 1 Nihility ally avoids penalty and emits `EIDOLON_CONSTRAINT_RELAXED`).

### Suite 2: Ranking Regression Golden Tests
- Freezes approved composite engine behavior to catch unintended regression during refactoring.
- **Explicit Principle:** Golden expected Top 1 results are regression expectations for the approved engineering policy, NOT proof of absolute in-game meta truth. Weights must never be tuned ad-hoc merely to force a preconceived team ranking.
- **Canonical Golden Cases (Authored strictly using the 9 verified characters):**
  1. `firefly` + `gallagher` + `robin` + `tingyun` (Super Break Core)
  2. `castorice` + `robin` + `tingyun` + `gallagher` (Memosprite Netherwing Hypercarry)
  3. `the-herta` + `robin` + `tingyun` + `aventurine` (Erudition AoE)
  4. `aventurine-waveflair` + `robin` + `aventurine` + `gallagher` (Elation Quantum Core)
  5. Insufficient Roster edge case (< 4 characters)

---

## 10. Persistence Strategy

- **Persistence Required:** **NO**.
- **New Tables:** **NONE**.
- **D1 Migrations:** **NONE**.
- Recommendations are computed purely in-memory as derived projections of the live roster and static knowledge snapshots, introducing zero new D1 tables and zero database quota overhead.

---

## 11. Implementation Tasks in Order

1. **Task 1: Shared Recommendation Types, Context & Reason Code Catalog (`packages/shared`)**
   - Implement `RecommendationContext`, `TeamEvaluation`, `RecommendationReason`, and `compareCodeUnits`.
2. **Task 2: Fixed-Point Scoring & Trace Constraint Engine (`packages/shared`)**
   - Implement role completeness, cross-tag mechanical synergies, elemental weakness matching, and Acheron Trace A4 constraints using pure fixed-point integer math.
3. **Task 3: Combination Generator & Tie-Breaking Engine (`packages/shared`)**
   - Implement combination iterator $\binom{N}{4}$, slot assignment heuristics, and deterministic code-unit tie-breaking.
4. **Task 4: Unit Test Suite & Golden Regression Tests (`packages/shared`)**
   - Implement canonical mechanics tests and golden regression fixtures; achieve 100% test pass rate.
5. **Task 5: Worker Recommendation API Endpoint (`apps/worker`)**
   - Implement authenticated `POST /api/recommendations/teams` with strict input validation and zero database writes.
6. **Task 6: Web Client Recommendation Hook & Diagnostic Surface (`apps/web`)**
   - Implement `useTeamRecommendations()` and engine verification view.
7. **Task 7: Full Automated Verification & Manual Smoke Gates**
   - Execute `pnpm typecheck`, `pnpm lint`, `pnpm data:check`, unit tests, and execute Gate 1 & Gate 2.
