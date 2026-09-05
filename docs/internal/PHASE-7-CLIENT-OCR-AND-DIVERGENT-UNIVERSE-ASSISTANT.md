# Phase 7 — Client OCR Pipeline & Divergent Universe Live Decision Assistant

Status: Planning & Specification (Audited & Locked). Target: Local Development. Date: 2026-09-04.
Governance: Anchored in Decision [D-004](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-004--recommendation-style), [D-005](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-005--source-requirement), [D-006](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-006--recommendation-authority), [D-025](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-025--version-45-factual-integrity-fact-provenance-9-combat-paths--runtime-byte-checksums), [D-028](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-028--phase-5-deterministic-scoring-policy--versioned-engineering-heuristics), [D-029](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-029--phase-6-deterministic-build-association-saved-teams-persistence--truthful-editorial-boundaries), and [D-030](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/14-DECISIONS.md#d-030--phase-7-client-ocr-pipeline--divergent-universe-live-decision-assistant).

---

## 1. Executive Summary & Canonical Objectives

Phase 7 delivers Astralyn's real-time gameplay companion surface: the **Divergent Universe Live Decision Assistant** at `/assistant`. It satisfies the MVP mandate from [docs/02-MVP_SCOPE.md](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/02-MVP_SCOPE.md) and [docs/13-ROADMAP.md](file:///c:/Users/Hafizh%20Rizqullah/Documents/Code/_active/Astralyn/docs/13-ROADMAP.md) by combining an **in-browser Web Worker OCR pipeline** with a **deterministic choice recommendation engine**.

The assistant allows players during an active Divergent Universe run to paste (`Ctrl+V`), drag-and-drop, or select screenshot rewards (3 blessings, equations, or curios), extracts option titles locally off the main thread, fuzzy-matches them against canonical Divergent Universe fixtures (`CANONICAL_DU_BLESSINGS`, `CANONICAL_DU_EQUATIONS`, `CANONICAL_DU_CURIOS`), allows confidence review and manual correction, evaluates options deterministically against active party synergies and target equation completion, and commits the chosen item into local run inventory.

### Primary Objectives:
1. **In-Browser Web Worker OCR Pipeline:** Execute image preprocessing (Canvas/OffscreenCanvas) and optical character recognition strictly within the client browser via a dedicated Web Worker. Zero server-side image uploads, preserving user privacy and Cloudflare Worker free-tier containment.
2. **Canonical Entity Matching & Confidence Scoring:** Leverage Fuse.js to normalize and match extracted text strings against canonical DU knowledge stores in Dexie IndexedDB (`duBlessings`, `duEquations`, `duCurios`), surfacing confidence ratings (High / Medium / Low).
3. **First-Class Manual Selection Fallback:** Guarantee full assistant functionality without screenshots: an interactive searchable picker allows players to manually select candidate choices at any time.
4. **Deterministic DU Recommendation Engine (`@astralyn/shared`):** Evaluate candidate blessings, equations, and curios using transparent, pure fixed-point arithmetic based on Equation progress requirements, Party Path synergies, and Curio risk/reward profiles. Zero LLM hallucinations.
5. **Local-First Active Run State Management:** Track active run state (party of 4 characters, target equations, collected blessings inventory, active curios) in browser storage (Zustand `persist` / localStorage). Zero server-side persistence in Cloudflare D1; zero database migrations.
6. **Generic Production Vector Fallback Invariant:** Render clean vector silhouettes and icons (`<GameAssetImage>`), maintaining quarantine over dev-only visual candidate assets.

---

## 2. Canonical Data & Architecture Audit

### Data Availability Matrix:

| Domain / Entity | Status in Repository | Exact Evidence | Treatment in Phase 7 |
|---|---|---|---|
| **Canonical DU Blessings** | **AVAILABLE (3 Verified)** | `CANONICAL_DU_BLESSINGS` in `canonical-fixtures.ts` (e.g. *Imperishable Firmament: Celestial Annihilation*, *Perfect Experience: Fuli*, *Divine Construct: Macrosegregation*). | White-list target for OCR recognition, card previews, and synergy scoring. |
| **Canonical DU Equations** | **AVAILABLE (2 Verified)** | `CANONICAL_DU_EQUATIONS` in `canonical-fixtures.ts` (e.g. *Silent Singer* [Harmony/Elation], *Voyage Monitor* [Remembrance/Preservation]). | Target equation tracking, completion progress evaluation, and blessing alignment scoring. |
| **Canonical DU Curios** | **AVAILABLE (2 Verified)** | `CANONICAL_DU_CURIOS` in `canonical-fixtures.ts` (e.g. *Rubert Empire Difference Engine*, *Interastral Peace Mechanical Box*). | Curio pick recognition, category filtering (`normal`, `weighted`, `negative`), effect display. |
| **Dexie DU Cache Tables** | **AVAILABLE** | `apps/web/src/lib/knowledge/db.ts` (`duBlessings`, `duEquations`, `duCurios`). | Local client search and index lookup. |
| **Repository Queries** | **AVAILABLE** | `apps/web/src/lib/knowledge/repository.ts` (`getDUEntity`, `listDUEntities`, `searchEntities`). | Direct client querying without server roundtrips. |
| **User Roster State** | **AVAILABLE** | Cloudflare D1 `user_roster` + client hook `useRoster`. | DU party selection draws from owned roster or trial characters. |
| **Fuzzy Search Engine** | **AVAILABLE** | `fuse.js` ^7.1.0 in `apps/web/package.json`. | Sub-string, typo-tolerant matching of OCR text to canonical names. |
| **OCR In-Browser Engine** | **MISSING / PREREQUISITE** | No OCR worker or WASM bundle in web package. | Integrate lightweight in-browser OCR engine running inside dedicated Web Worker. |
| **DU Recommendation Engine** | **MISSING / PREREQUISITE** | Recommendation engine in `@astralyn/shared` currently handles teams (Phase 5/6). | Extend `@astralyn/shared` with deterministic DU scoring algorithms (`evaluateDUBlessingChoices`, `evaluateDUEquationChoices`, `evaluateDUCurioChoices`). |
| **Active Run Store** | **MISSING / PREREQUISITE** | No active DU run state management exists. | Implement Zustand store with `persist` middleware in `apps/web/src/features/assistant/`. |

---

## 3. Boundary & Layer Responsibilities

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ User Browser (Client)                                                   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ DivergentUniverseAssistantView (/assistant)                       │  │
│  │  ├── Active Run Bar: Party (4) • Target Equation • Inventory      │  │
│  │  ├── Ingestion Interface: Clipboard / Dropzone / Manual Picker    │  │
│  │  ├── OCR Review & Correction Panel (Confidence & Overrides)       │  │
│  │  └── Deterministic Decision & Trade-Off Cards (#1, #2, #3)        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│        ┌───────────────────────────┴───────────────────────────┐        │
│        ▼                                                       ▼        │
│  ┌───────────────────────────┐           ┌───────────────────────────┐  │
│  │ OCR Web Worker            │           │ Local Run State Store     │  │
│  │ (ocr.worker.ts)           │           │ (Zustand + localStorage)  │  │
│  │  ├── OffscreenCanvas      │           │  ├── Party Composition    │  │
│  │  ├── Preprocessing        │           │  ├── Target Equations     │  │
│  │  └── Text Extraction      │           │  ├── Collected Blessings  │  │
│  └─────────────┬─────────────┘           │  └── Active Curios        │  │
│                │                         └─────────────┬─────────────┘  │
│                ▼                                       │                │
│  ┌───────────────────────────┐                         │                │
│  │ Fuzzy Entity Matcher      │                         │                │
│  │ (Fuse.js + Dexie Cache)   │                         │                │
│  └─────────────┬─────────────┘                         │                │
│                │                                       │                │
│                └───────────────────┬───────────────────┘                │
│                                    ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Deterministic DU Recommendation Engine (@astralyn/shared)         │  │
│  │  ├── Equation Requirement Completion (+30 pts)                    │  │
│  │  ├── Carry / Sustain Path Synergy (+25 pts)                       │  │
│  │  ├── Blessing Rarity Baseline Weight (3★ > 2★ > 1★)               │  │
│  │  └── Curio Net Advantage vs Penalty Risk Assessment               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                             Zero Network I/O
                           (Zero Image Uploads)
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Cloudflare Backend (Worker + D1)                                        │
│  • Zero OCR execution (No image bandwidth, zero CPU consumption)        │
│  • Zero DU database tables (Preserves D1 free-tier quota)               │
│  • Zero D1 migrations required                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Specifications & Workflows

### 4.1. Active Run Configuration & Management
- **Party Selection:** Users configure an active DU party of 1–4 characters (defaulting to owned roster characters or quick-selecting from Saved Teams).
- **Target Equation Setup:** User selects an active or desired Equation (e.g. *Silent Singer* [Harmony/Elation] requiring 2 Harmony + 2 Elation blessings).
- **Run State Persistence:** Local browser persistence preserves run across page reloads. A "Reset Run" button clears active state cleanly.

### 4.2. Dual Ingestion Modes

#### Mode A: Screenshot Ingestion (OCR Pipeline)
1. **Image Input:** User pastes an image from clipboard (`Ctrl+V`), drops a file onto the dropzone, or selects a file via file browser.
2. **Preprocessing (Canvas):** Image is drawn onto an offscreen canvas. Auto-crop isolates the central reward options area (excluding background game HUD where applicable), applies high-contrast grayscale/binarization to optimize for white/gold card titles against cosmic backgrounds.
3. **Web Worker OCR Inference:** Processing runs off the main UI thread via a dedicated Web Worker. Emits progress events (`loading_engine`, `processing_image`, `extracting_text`).
4. **Candidate Extraction & Entity Matching:** Extracted raw text blocks are processed by Fuse.js matching against canonical blessing, equation, and curio names.
5. **Confidence Review UI:** Extracted candidate options render with a confidence badge:
   - **High (≥ 80% similarity):** Auto-selects canonical match.
   - **Medium (50%–79% similarity):** Suggests closest match with confirmation prompt.
   - **Low (< 50% similarity / Unrecognized):** Prompts user to pick from dropdown.
6. **Manual Correction:** Every candidate slot provides an editable title and a searchable dropdown allowing instant override if OCR misreads a stylized font.

#### Mode B: Manual Selection (Zero-Screenshot Fallback)
1. At any time, users can toggle to "Manual Selection".
2. Provides 3 option selector slots with instant Fuse.js autocomplete across all canonical blessings, equations, and curios.
3. Completely unblocks users on low-power devices, unsupported screen ratios, or non-English/Indonesian game localizations.

### 4.3. Deterministic DU Recommendation Engine (`@astralyn/shared`)

Mathematical scoring model evaluating candidate picks against run context:

```ts
export interface DURunContext {
  partyPaths: CombatPath[];
  targetEquationIds: string[];
  collectedBlessingIds: string[];
  activeCurioIds: string[];
}

export interface DUPickEvaluation {
  entityId: string;
  entityType: "blessing" | "equation" | "curio";
  score: number; // [0, 100] fixed-point integer
  rank: number;  // 1, 2, 3
  isRecommended: boolean;
  reasons: Array<{
    code: string;
    category: "equation" | "path" | "rarity" | "curio";
    scoreDelta: number;
    message: string;
  }>;
}
```

#### Blessing Evaluation Rules:
1. **Target Equation Progress (`EQUATION_PROGRESS`):**
   - If the blessing's Path matches an unfulfilled requirement of an active target equation: **+30 points**.
   - If the blessing completes the final required count for an equation: **+45 points** (`EQUATION_COMPLETED`).
2. **Party Path Synergy (`PARTY_PATH_SYNERGY`):**
   - If blessing's Path matches a primary damage carry in the party: **+25 points**.
   - If blessing's Path matches a sustain/support character: **+15 points**.
3. **Rarity Baseline Weight (`RARITY_WEIGHT`):**
   - 3★ Gold: **+20 points**
   - 2★ Blue: **+12 points**
   - 1★ Blue: **+5 points**
4. **Duplicate Prevention:** Already collected blessings receive a severe penalty (**-100 points**) and are marked ineligible.

#### Curio Evaluation Rules:
1. **Weighted Curio Alignment (`WEIGHTED_CURIO_SYNERGY`):** If curio aligns with party archetype (e.g. *Interastral Peace Mechanical Box* guaranteeing 3★ blessings of team's primary path): **+40 points**.
2. **Utility & Resource Boost (`CURIO_UTILITY`):** Action advances, skill point generation, or reroll advantages: **+25 points**.
3. **Negative Curio Penalty (`NEGATIVE_CURIO_RISK`):** Negative curios receive penalty deductions based on severity.

### 4.4. Decision Presentation & Action
- Displays candidate cards ranked `#1 Recommended`, `#2 Alternative`, `#3 Low Priority`.
- Clearly explains the "Why": Equation activation bars (e.g. `Silent Singer: 2/2 Harmony, 1/2 Elation`), carry synergy highlights, and curio mechanics.
- **Commit Choice Button:** Clicking "Commit Choice" immediately pushes the selected blessing/curio into the active run inventory, updates equation progress bars, and clears the screenshot workspace ready for the next node.

---

## 5. Privacy, Security & Quota Containment Invariants

1. **Zero Server Image Transmission:** Screenshot image data (data URLs, ArrayBuffers, File objects) MUST NEVER be sent over the network or logged to server endpoints. All processing is 100% in-browser.
2. **Untrusted OCR Input Sanitization:** OCR-generated text strings are treated as untrusted user input. Text is stripped of HTML tags, control characters, and capped at 100 characters before matching against canonical whitelists.
3. **Privilege Boundary:** OCR output is strictly analytical; it cannot execute commands, trigger backend mutations, or bypass authentication.
4. **Cloudflare Free-Tier Containment:** Zero Cloudflare D1 queries or Worker execution seconds are consumed by OCR or DU run tracking.

---

## 6. Implementation Task Breakdown

### Task 1: Shared DU Recommendation Engine (`packages/shared/src/du/`)
- Implement `evaluateDUBlessingChoices`, `evaluateDUEquationChoices`, `evaluateDUCurioChoices`.
- Pure fixed-point integer math clamped `[0, 100]` adhering to Decision D-028.
- Comprehensive unit tests in `packages/shared/test/du-recommendation.test.ts`.

### Task 2: In-Browser OCR Worker Infrastructure (`apps/web/src/features/assistant/ocr/`)
- Create `ocr.worker.ts` with canvas preprocessor (downsampling, grayscale, contrast adjustment).
- Integrate lightweight client OCR engine with progress events (`loading`, `recognizing`, `done`, `error`).
- Add mock harness for Vitest/browser tests verifying error resilience.

### Task 3: Fuzzy Entity Matcher (`apps/web/src/features/assistant/matcher.ts`)
- Build Fuse.js entity search indexing canonical blessings, equations, and curios from Dexie cache.
- Expose confidence scoring logic and candidate normalization.
- Unit tests with noisy OCR inputs (dropped letters, typos, casing variations).

### Task 4: Active Run State Store (`apps/web/src/features/assistant/du-run-store.ts`)
- Zustand store with `persist` middleware (local-first storage).
- State: `partyCharacterIds`, `targetEquationIds`, `collectedBlessingIds`, `activeCurioIds`.
- Actions: `setParty`, `addTargetEquation`, `commitBlessing`, `commitCurio`, `resetRun`.

### Task 5: Divergent Universe Assistant UI (`apps/web/src/routes/assistant-view.tsx`)
- Replace `PlaceholderView` on `/assistant`.
- Run Status Header: Party avatars, active equation progress meters, inventory summary.
- Ingestion Workspace: Paste/dropzone interface with canvas preview, progress indicators, confidence rating pills, and manual correction dropdowns.
- Manual Search Fallback: Instant entity search autocomplete.
- Recommendation Surface: Ranked cards with clear rationale, trade-offs, and "Commit Choice" action.

### Task 6: Testing & Verification
- Unit tests for DU scoring, fuzzy matching, and run store.
- Web component tests in `apps/web/tests/phase7-assistant.test.tsx`.
- Automated regression suite (`typecheck`, `lint`, `data:check`, `test`, `build`).

---

## 7. Manual Browser Smoke Gates

### Gate 1 — Active Run Setup
- Open `http://localhost:5173/assistant`.
- Initialize a DU run: select 4 party members (e.g. Firefly, Gallagher, Robin, Castorice) and 1 target equation (*Silent Singer*).
- Verify equation progress meter shows `0/2 Harmony, 0/2 Elation`.

### Gate 2 — Manual Entity Selection & Trade-Off Analysis
- Use the Manual Selection interface to pick 3 candidate blessings:
  1. *Imperishable Firmament: Celestial Annihilation* (Hunt, 3★)
  2. *Perfect Experience: Fuli* (Remembrance, 3★)
  3. A Harmony blessing matching *Silent Singer*.
- Verify engine ranks the Harmony blessing #1 due to `EQUATION_PROGRESS` (+30 pts), with full rationale.

### Gate 3 — Screenshot Ingestion & Preprocessing
- Paste or drop a test screenshot containing 3 blessing reward cards.
- Verify canvas preview renders and progress state is indicated.

### Gate 4 — In-Browser OCR Extraction & Confidence Review
- Verify OCR worker extracts candidate card titles off-main-thread without UI freeze.
- Verify confidence badges render (High/Medium/Low) with canonical matches pre-filled.
- Test manual correction: edit one recognized text and select canonical override from dropdown.

### Gate 5 — Choice Commitment & Local Persistence
- Click "Commit Choice" on the recommended blessing.
- Verify blessing is added to run inventory and equation progress meter increments.
- Refresh the browser (`F5`).
- Verify active run state, party, and collected inventory persist completely from local storage.
- Click "Reset Run" &rarr; verify clean reset.

---

## 8. Explicit Out-of-Scope Items for Phase 7

1. **No Server-Side Image Uploads:** Zero screenshot binaries sent to Cloudflare Workers.
2. **No Cloudflare D1 Database Migrations:** No new tables; active run state is client-local only.
3. **No Cross-Device Cloud Sync:** Run synchronization across multiple devices is a post-MVP roadmap item (v0.4).
4. **No Inventory / Relic Substat Scanning:** Only DU reward cards (blessings, equations, curios) are recognized in Phase 7.
5. **No MoC / PF / AS Stage Recognition:** Endgame stage recognition is scheduled for Phase 8 / post-MVP.
6. **No Real-Time Screen Recording Streams:** Interaction is strictly on-demand screenshot paste/drop.
7. **No Conversational AI Interpretation:** All recommendations are derived from deterministic rules in `@astralyn/shared`.
8. **No Remote Deployment:** Production Cloudflare deployment remains deferred to Phase 9.
