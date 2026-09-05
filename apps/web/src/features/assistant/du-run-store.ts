// apps/web/src/features/assistant/du-run-store.ts
// Phase 7 — Local-first Active DU Run State (Zustand + localStorage)
// Decision D-030:
//   - Browser-local persistence only. No D1 table. No server persistence.
//   - Safe hydration: unknown localStorage data is discarded silently.
//   - Deterministic derived progress via pure computation from stored state.
//   - Clean reset behavior.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CombatPath } from "@astralyn/shared";

// ============================================================================
// Types
// ============================================================================

export interface DURunState {
  /** Canonical character IDs in the active party (1–4) */
  partyCharacterIds: string[];
  /** Canonical equation IDs targeted for this run */
  targetEquationIds: string[];
  /** Canonical blessing IDs collected during this run */
  collectedBlessingIds: string[];
  /** Canonical curio IDs currently active */
  activeCurioIds: string[];
  /** ISO timestamp of when the run was started, null if no active run */
  runStartedAt: string | null;
}

export interface DURunActions {
  /** Replace the full party (1–4 canonical character IDs) */
  setParty: (characterIds: string[]) => void;
  /** Add a target equation (if not already targeted) */
  addTargetEquation: (equationId: string) => void;
  /** Remove a target equation */
  removeTargetEquation: (equationId: string) => void;
  /** Set/replace all target equations at once */
  setTargetEquations: (equationIds: string[]) => void;
  /** Record a blessing as collected in the current run */
  commitBlessing: (blessingId: string) => void;
  /** Remove a blessing from collected (for corrections) */
  removeBlessing: (blessingId: string) => void;
  /** Record a curio as active in the current run */
  commitCurio: (curioId: string) => void;
  /** Remove a curio from active list */
  removeCurio: (curioId: string) => void;
  /** Reset the entire run to empty state */
  resetRun: () => void;
  /** Start or continue a run (sets runStartedAt if not already set) */
  startRun: () => void;
}

export type DURunStore = DURunState & DURunActions;

// ============================================================================
// Derived computation helpers (pure functions, no side effects)
// ============================================================================

/** Derive CombatPath list from partyCharacterIds is deferred to UI layer
 *  because path data requires knowledge DB. The store holds only IDs.
 *  Use computeEquationProgress (from shared) in the UI layer for progress bars.
 */

// ============================================================================
// Store initial state
// ============================================================================

const INITIAL_RUN_STATE: DURunState = {
  partyCharacterIds: [],
  targetEquationIds: [],
  collectedBlessingIds: [],
  activeCurioIds: [],
  runStartedAt: null,
};

// ============================================================================
// Validation helper: coerce persisted data to valid state shape
// Protects against stale/malformed localStorage data after schema changes.
// ============================================================================

function coercePersisted(raw: unknown): DURunState {
  if (!raw || typeof raw !== "object") return { ...INITIAL_RUN_STATE };

  const r = raw as Record<string, unknown>;
  return {
    partyCharacterIds: Array.isArray(r.partyCharacterIds)
      ? r.partyCharacterIds.filter((x) => typeof x === "string")
      : [],
    targetEquationIds: Array.isArray(r.targetEquationIds)
      ? r.targetEquationIds.filter((x) => typeof x === "string")
      : [],
    collectedBlessingIds: Array.isArray(r.collectedBlessingIds)
      ? r.collectedBlessingIds.filter((x) => typeof x === "string")
      : [],
    activeCurioIds: Array.isArray(r.activeCurioIds)
      ? r.activeCurioIds.filter((x) => typeof x === "string")
      : [],
    runStartedAt: typeof r.runStartedAt === "string" ? r.runStartedAt : null,
  };
}

// ============================================================================
// Zustand store with persist middleware
// ============================================================================

export const useDURunStore = create<DURunStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...INITIAL_RUN_STATE,

      // Actions
      setParty: (characterIds) => {
        // Enforce 1–4 characters; deduplicate; preserve order
        const unique = [...new Set(characterIds)].slice(0, 4);
        set({ partyCharacterIds: unique });
        // Auto-start run when party is configured
        if (unique.length > 0 && !get().runStartedAt) {
          set({ runStartedAt: new Date().toISOString() });
        }
      },

      addTargetEquation: (equationId) => {
        set((s) => {
          if (s.targetEquationIds.includes(equationId)) return s;
          return { targetEquationIds: [...s.targetEquationIds, equationId] };
        });
      },

      removeTargetEquation: (equationId) => {
        set((s) => ({
          targetEquationIds: s.targetEquationIds.filter((id) => id !== equationId),
        }));
      },

      setTargetEquations: (equationIds) => {
        set({ targetEquationIds: [...new Set(equationIds)] });
      },

      commitBlessing: (blessingId) => {
        set((s) => {
          // Append even if duplicate — duplicates mean they picked the same blessing twice
          // (which the recommendation engine penalizes). We track all picks.
          return { collectedBlessingIds: [...s.collectedBlessingIds, blessingId] };
        });
      },

      removeBlessing: (blessingId) => {
        set((s) => {
          // Remove first occurrence only (in case of exact duplicates)
          const idx = s.collectedBlessingIds.indexOf(blessingId);
          if (idx === -1) return s;
          const next = [...s.collectedBlessingIds];
          next.splice(idx, 1);
          return { collectedBlessingIds: next };
        });
      },

      commitCurio: (curioId) => {
        set((s) => {
          if (s.activeCurioIds.includes(curioId)) return s;
          return { activeCurioIds: [...s.activeCurioIds, curioId] };
        });
      },

      removeCurio: (curioId) => {
        set((s) => ({
          activeCurioIds: s.activeCurioIds.filter((id) => id !== curioId),
        }));
      },

      resetRun: () => {
        set({ ...INITIAL_RUN_STATE });
      },

      startRun: () => {
        if (!get().runStartedAt) {
          set({ runStartedAt: new Date().toISOString() });
        }
      },
    }),
    {
      name: "astralyn-du-run-v1", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Merge persisted state with current state, coercing invalid data
      merge: (persisted, current) => {
        const safe = coercePersisted(persisted);
        return { ...current, ...safe };
      },
    }
  )
);

// ============================================================================
// Selector helpers (stable references to avoid unnecessary re-renders)
// ============================================================================

/** Derive CombatPaths from known character knowledge for recommendation engine.
 *  Returns a memoizable input tuple. Caller provides characterMap lookup.
 */
export function derivePartyPaths(
  partyCharacterIds: string[],
  characterPathMap: ReadonlyMap<string, CombatPath>
): CombatPath[] {
  const paths: CombatPath[] = [];
  for (const id of partyCharacterIds) {
    const path = characterPathMap.get(id);
    if (path) paths.push(path);
  }
  return paths;
}

/** Check if a run is active (party configured and started) */
export function isRunActive(state: DURunState): boolean {
  return state.partyCharacterIds.length > 0 && state.runStartedAt !== null;
}
