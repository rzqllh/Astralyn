// apps/web/src/features/assistant/matcher.ts
// Phase 7 — Canonical fuzzy entity matcher for DU OCR candidates
// Decision D-030: canonical whitelist matching only; OCR text never becomes
// canonical fact automatically when confidence is insufficient.
// Uses Fuse.js ^7 for typo-tolerant fuzzy matching.

import Fuse from "fuse.js";
import type {
  DUBlessingKnowledge,
  DUEquationKnowledge,
  DUCurioKnowledge,
} from "@astralyn/shared";

// ============================================================================
// Types
// ============================================================================

export type MatchConfidence = "High" | "Medium" | "Low";

export interface MatchResult<T> {
  candidate: T;
  confidence: MatchConfidence;
  score: number; // 0..1, 1 = perfect match
  rawInput: string;
}

export interface DUEntityMatch {
  type: "blessing" | "equation" | "curio";
  blessing?: MatchResult<DUBlessingKnowledge>;
  equation?: MatchResult<DUEquationKnowledge>;
  curio?: MatchResult<DUCurioKnowledge>;
  bestConfidence: MatchConfidence;
}

// Confidence thresholds (Fuse.js score: lower = better match)
// Fuse.js score 0 = perfect, 1 = no match
// We invert to similarity: similarity = 1 - fuseScore
const HIGH_THRESHOLD = 0.8;   // similarity >= 0.8  → High
const MEDIUM_THRESHOLD = 0.5; // similarity >= 0.5  → Medium
// below 0.5 → Low (surfaced with override prompt)

// ============================================================================
// Text sanitization
// Per D-030: strip HTML, control chars, cap at 100 chars, normalize casing/spacing
// ============================================================================

/**
 * Sanitize raw OCR text before matching against canonical whitelist.
 * Treats input as untrusted; prevents injection into search index.
 */
export function sanitizeOCRInput(raw: string): string {
  return raw
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Strip control characters (keep printable ASCII + common unicode)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, " ")
    // Normalize multiple spaces to single
    .replace(/\s+/g, " ")
    .trim()
    // Cap at 100 characters
    .slice(0, 100);
}

/**
 * Normalize text for fuzzy matching: lowercase, collapse whitespace,
 * remove punctuation noise common in OCR output.
 */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    // Remove common OCR noise: periods, commas, colons at word boundaries
    .replace(/[,.:;!?'"]/g, " ")
    // Collapse spaces
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================================
// Fuse.js index builders
// ============================================================================

interface SearchableItem<T> {
  id: string;
  name: string;
  normalizedName: string;
  entity: T;
}

function buildSearchable<T extends { id: string; name: string }>(
  items: T[]
): SearchableItem<T>[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    normalizedName: normalizeForMatch(item.name),
    entity: item,
  }));
}

const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.6, // Controls what is considered a match at all
  keys: [
    { name: "normalizedName", weight: 0.7 },
    { name: "name", weight: 0.3 },
  ],
  minMatchCharLength: 3,
  distance: 100,
  ignoreLocation: true,
};

// ============================================================================
// DU Entity Matcher class
// ============================================================================

export class DUEntityMatcher {
  private blessingIndex: Fuse<SearchableItem<DUBlessingKnowledge>>;
  private equationIndex: Fuse<SearchableItem<DUEquationKnowledge>>;
  private curioIndex: Fuse<SearchableItem<DUCurioKnowledge>>;

  private blessings: DUBlessingKnowledge[];
  private equations: DUEquationKnowledge[];
  private curios: DUCurioKnowledge[];

  constructor(
    blessings: DUBlessingKnowledge[],
    equations: DUEquationKnowledge[],
    curios: DUCurioKnowledge[]
  ) {
    this.blessings = blessings;
    this.equations = equations;
    this.curios = curios;

    this.blessingIndex = new Fuse(buildSearchable(blessings), FUSE_OPTIONS);
    this.equationIndex = new Fuse(buildSearchable(equations), FUSE_OPTIONS);
    this.curioIndex = new Fuse(buildSearchable(curios), FUSE_OPTIONS);
  }

  // ============================================================================
  // Individual type matchers
  // ============================================================================

  matchBlessing(rawInput: string): MatchResult<DUBlessingKnowledge> | null {
    const sanitized = sanitizeOCRInput(rawInput);
    if (!sanitized) return null;
    const query = normalizeForMatch(sanitized);
    const results = this.blessingIndex.search(query);
    if (results.length === 0) return null;

    const top = results[0]!;
    const similarity = 1 - (top.score ?? 1);
    return {
      candidate: top.item.entity,
      confidence: scoreToConfidence(similarity),
      score: similarity,
      rawInput: sanitized,
    };
  }

  matchEquation(rawInput: string): MatchResult<DUEquationKnowledge> | null {
    const sanitized = sanitizeOCRInput(rawInput);
    if (!sanitized) return null;
    const query = normalizeForMatch(sanitized);
    const results = this.equationIndex.search(query);
    if (results.length === 0) return null;

    const top = results[0]!;
    const similarity = 1 - (top.score ?? 1);
    return {
      candidate: top.item.entity,
      confidence: scoreToConfidence(similarity),
      score: similarity,
      rawInput: sanitized,
    };
  }

  matchCurio(rawInput: string): MatchResult<DUCurioKnowledge> | null {
    const sanitized = sanitizeOCRInput(rawInput);
    if (!sanitized) return null;
    const query = normalizeForMatch(sanitized);
    const results = this.curioIndex.search(query);
    if (results.length === 0) return null;

    const top = results[0]!;
    const similarity = 1 - (top.score ?? 1);
    return {
      candidate: top.item.entity,
      confidence: scoreToConfidence(similarity),
      score: similarity,
      rawInput: sanitized,
    };
  }

  /**
   * Match an OCR text line against all entity types, returning the best match.
   * "Best match" = highest similarity score across all entity types.
   * Low confidence results are still returned — UI must prompt for user override.
   */
  matchAny(rawInput: string): DUEntityMatch | null {
    const blessingResult = this.matchBlessing(rawInput);
    const equationResult = this.matchEquation(rawInput);
    const curioResult = this.matchCurio(rawInput);

    // Find best match across all types
    type TypedResult =
      | { type: "blessing"; result: MatchResult<DUBlessingKnowledge> }
      | { type: "equation"; result: MatchResult<DUEquationKnowledge> }
      | { type: "curio"; result: MatchResult<DUCurioKnowledge> };

    const candidates: TypedResult[] = [];
    if (blessingResult) candidates.push({ type: "blessing", result: blessingResult });
    if (equationResult) candidates.push({ type: "equation", result: equationResult });
    if (curioResult) candidates.push({ type: "curio", result: curioResult });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.result.score - a.result.score);
    const best = candidates[0]!;

    return {
      type: best.type,
      blessing: best.type === "blessing" ? (best.result as MatchResult<DUBlessingKnowledge>) : undefined,
      equation: best.type === "equation" ? (best.result as MatchResult<DUEquationKnowledge>) : undefined,
      curio: best.type === "curio" ? (best.result as MatchResult<DUCurioKnowledge>) : undefined,
      bestConfidence: best.result.confidence,
    };
  }

  /**
   * Search blessings for a picker/autocomplete. Returns up to `limit` matches
   * sorted by score. Does not require high confidence.
   */
  searchBlessings(query: string, limit = 10): DUBlessingKnowledge[] {
    if (!query.trim()) return this.blessings.slice(0, limit);
    const results = this.blessingIndex.search(normalizeForMatch(query), { limit });
    return results.map((r) => r.item.entity);
  }

  searchEquations(query: string, limit = 10): DUEquationKnowledge[] {
    if (!query.trim()) return this.equations.slice(0, limit);
    const results = this.equationIndex.search(normalizeForMatch(query), { limit });
    return results.map((r) => r.item.entity);
  }

  searchCurios(query: string, limit = 10): DUCurioKnowledge[] {
    if (!query.trim()) return this.curios.slice(0, limit);
    const results = this.curioIndex.search(normalizeForMatch(query), { limit });
    return results.map((r) => r.item.entity);
  }

  // Raw list accessors for manual picker
  allBlessings(): DUBlessingKnowledge[] { return this.blessings; }
  allEquations(): DUEquationKnowledge[] { return this.equations; }
  allCurios(): DUCurioKnowledge[] { return this.curios; }
}

// ============================================================================
// Confidence mapping
// ============================================================================

export function scoreToConfidence(similarity: number): MatchConfidence {
  if (similarity >= HIGH_THRESHOLD) return "High";
  if (similarity >= MEDIUM_THRESHOLD) return "Medium";
  return "Low";
}

export function confidenceBadgeColor(confidence: MatchConfidence): string {
  switch (confidence) {
    case "High": return "text-[#34d399] border-[#34d399]/40 bg-[#34d399]/10";
    case "Medium": return "text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10";
    case "Low": return "text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10";
  }
}

// ============================================================================
// Singleton factory using canonical data
// ============================================================================

let _matcherInstance: DUEntityMatcher | null = null;

export function getDUEntityMatcher(
  blessings: DUBlessingKnowledge[],
  equations: DUEquationKnowledge[],
  curios: DUCurioKnowledge[]
): DUEntityMatcher {
  // Re-create if data changes (content version update)
  if (!_matcherInstance) {
    _matcherInstance = new DUEntityMatcher(blessings, equations, curios);
  }
  return _matcherInstance;
}

export function invalidateDUEntityMatcher(): void {
  _matcherInstance = null;
}
