// apps/web/src/routes/assistant-view.tsx
// Phase 7 — Divergent Universe Live Decision Assistant
// Decision D-030: client-only OCR, local-first run state, deterministic scoring.
// Zero server image uploads. Zero D1 persistence for DU state.

import * as React from "react";
import {
  Camera,
  Upload,
  Search,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Target,
  Package,
  Star,
  X,
  ZapOff,
} from "lucide-react";
import {
  CANONICAL_DU_BLESSINGS,
  CANONICAL_DU_EQUATIONS,
  CANONICAL_DU_CURIOS,
  evaluateDUBlessingChoices,
  evaluateDUEquationChoices,
  evaluateDUCurioChoices,
  type DUPickEvaluation,
} from "@astralyn/shared";
import type {
  DUBlessingKnowledge,
  DUEquationKnowledge,
  DUCurioKnowledge,
} from "@astralyn/shared";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { CharacterAvatar } from "../components/ui/game-asset";
import { useDURunStore, derivePartyPaths, isRunActive } from "../features/assistant/du-run-store";
import { DUEntityMatcher, confidenceBadgeColor, type MatchConfidence } from "../features/assistant/matcher";
import { useOCR, fileToImageData, fileToPreviewUrl } from "../features/assistant/ocr/use-ocr";
import { useCharacters } from "../lib/knowledge/use-knowledge";

// ============================================================================
// Canonical data (static — no async required; loaded from shared package)
// ============================================================================

const ALL_BLESSINGS = CANONICAL_DU_BLESSINGS;
const ALL_EQUATIONS = CANONICAL_DU_EQUATIONS;
const ALL_CURIOS = CANONICAL_DU_CURIOS;

const MATCHER = new DUEntityMatcher(ALL_BLESSINGS, ALL_EQUATIONS, ALL_CURIOS);

// ============================================================================
// Types for the candidate slots
// ============================================================================

type CandidateEntityType = "blessing" | "equation" | "curio";

interface CandidateSlot {
  id: string;
  rawOCRText: string;
  resolvedEntityId: string | null;
  entityType: CandidateEntityType;
  confidence: MatchConfidence | null;
  isManualOverride: boolean;
}

function emptySlot(id: string): CandidateSlot {
  return {
    id,
    rawOCRText: "",
    resolvedEntityId: null,
    entityType: "blessing",
    confidence: null,
    isManualOverride: false,
  };
}

// ============================================================================
// Sub-component: Active Run Status Bar
// ============================================================================

function RunStatusBar({
  partyCharacterIds,
  targetEquationIds,
  collectedBlessingIds,
  activeCurioIds,
  onReset,
}: {
  partyCharacterIds: string[];
  targetEquationIds: string[];
  collectedBlessingIds: string[];
  activeCurioIds: string[];
  onReset: () => void;
}) {
  const targetEquations = ALL_EQUATIONS.filter((e) => targetEquationIds.includes(e.id));

  return (
    <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Active Run
          </span>
          {isRunActive({ partyCharacterIds, targetEquationIds, collectedBlessingIds, activeCurioIds, runStartedAt: "set" }) ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#34d399] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] text-[#9ba5be] font-mono">NOT STARTED</span>
          )}
        </div>
        {(partyCharacterIds.length > 0 || collectedBlessingIds.length > 0) && (
          <Button variant="danger" size="sm" onClick={onReset} id="btn-reset-run">
            <RotateCcw className="h-3 w-3" />
            Reset Run
          </Button>
        )}
      </div>

      {/* Party */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Party ({partyCharacterIds.length}/4)
        </p>
        <div className="flex gap-2 flex-wrap">
          {partyCharacterIds.length === 0 ? (
            <span className="text-xs text-[#9ba5be]">No party configured</span>
          ) : (
            partyCharacterIds.map((id) => (
              <CharacterAvatar key={id} characterId={id} size="md" />
            ))
          )}
        </div>
      </div>

      {/* Target Equations + Progress */}
      {targetEquations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#9ba5be] uppercase tracking-wider flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Target Equations
          </p>
          {targetEquations.map((eq) => {
            const primaryCollected = collectedBlessingIds.filter(
              (id) => ALL_BLESSINGS.find((b) => b.id === id)?.path === eq.primaryPath
            ).length;
            const secondaryCollected = collectedBlessingIds.filter(
              (id) => ALL_BLESSINGS.find((b) => b.id === id)?.path === eq.secondaryPath
            ).length;

            const primaryDone = primaryCollected >= eq.requiredBlessings.primaryCount;
            const secondaryDone = secondaryCollected >= eq.requiredBlessings.secondaryCount;
            const complete = primaryDone && secondaryDone;

            return (
              <div key={eq.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-[#f0f3fa]">{eq.name}</span>
                <span className={`text-[11px] font-mono ${primaryDone ? "text-[#34d399]" : "text-[#9ba5be]"}`}>
                  {primaryCollected}/{eq.requiredBlessings.primaryCount} {eq.primaryPath}
                </span>
                <span className={`text-[11px] font-mono ${secondaryDone ? "text-[#34d399]" : "text-[#9ba5be]"}`}>
                  {secondaryCollected}/{eq.requiredBlessings.secondaryCount} {eq.secondaryPath}
                </span>
                {complete && (
                  <Badge variant="success" size="sm">Complete</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inventory summary */}
      {collectedBlessingIds.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#9ba5be]">
          <Package className="h-3 w-3" />
          <span>{collectedBlessingIds.length} blessings collected</span>
          {activeCurioIds.length > 0 && (
            <span>· {activeCurioIds.length} curios active</span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-component: Party Configurator
// ============================================================================

function PartyConfigurator({
  partyCharacterIds,
  onSetParty,
}: {
  partyCharacterIds: string[];
  onSetParty: (ids: string[]) => void;
}) {
  const { characters } = useCharacters();
  const [search, setSearch] = React.useState("");

  const filteredChars = React.useMemo(() => {
    if (!search.trim()) return characters.slice(0, 20);
    const q = search.toLowerCase();
    return characters.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [characters, search]);

  const toggleChar = (id: string) => {
    if (partyCharacterIds.includes(id)) {
      onSetParty(partyCharacterIds.filter((x) => x !== id));
    } else if (partyCharacterIds.length < 4) {
      onSetParty([...partyCharacterIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#9ba5be]">Select 1–4 characters for your DU party.</p>
      <Input
        id="party-search"
        placeholder="Search characters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {filteredChars.map((c) => {
          const selected = partyCharacterIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleChar(c.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-xs text-xs border transition-all ${
                selected
                  ? "border-[#dfb86c]/60 bg-[#dfb86c]/10 text-[#dfb86c]"
                  : "border-[#1f2940] bg-[#101524] text-[#9ba5be] hover:border-[#26334f] hover:text-[#f0f3fa]"
              }`}
              aria-pressed={selected}
              aria-label={`${selected ? "Remove" : "Add"} ${c.name} from party`}
            >
              <CharacterAvatar characterId={c.id} name={c.name} rarity={c.rarity} size="sm" />
              {c.name}
            </button>
          );
        })}
        {filteredChars.length === 0 && (
          <p className="text-xs text-[#9ba5be]">No characters found</p>
        )}
      </div>
      {partyCharacterIds.length > 0 && (
        <p className="text-[11px] text-[#dfb86c] font-mono">
          Party: {partyCharacterIds.join(", ")} ({partyCharacterIds.length}/4 slots)
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Sub-component: Equation Selector
// ============================================================================

function EquationSelector({
  targetEquationIds,
  onSetEquations,
}: {
  targetEquationIds: string[];
  onSetEquations: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (targetEquationIds.includes(id)) {
      onSetEquations(targetEquationIds.filter((x) => x !== id));
    } else {
      onSetEquations([...targetEquationIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#9ba5be]">Select target equations to optimize blessing choices toward.</p>
      <div className="space-y-2">
        {ALL_EQUATIONS.map((eq) => {
          const selected = targetEquationIds.includes(eq.id);
          return (
            <button
              key={eq.id}
              onClick={() => toggle(eq.id)}
              id={`eq-${eq.id}`}
              aria-pressed={selected}
              className={`w-full text-left px-3 py-2 rounded-xs border transition-all space-y-1 ${
                selected
                  ? "border-[#dfb86c]/60 bg-[#dfb86c]/5"
                  : "border-[#1f2940] bg-[#101524] hover:border-[#26334f]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${selected ? "text-[#dfb86c]" : "text-[#f0f3fa]"}`}>
                  {eq.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge size="sm" variant={eq.rarity === 3 ? "rarity5" : "rarity4"}>
                    {eq.rarity}★
                  </Badge>
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-[#34d399]" />}
                </div>
              </div>
              <p className="text-[11px] text-[#9ba5be]">
                {eq.primaryPath} × {eq.requiredBlessings.primaryCount} +{" "}
                {eq.secondaryPath} × {eq.requiredBlessings.secondaryCount}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component: Screenshot Ingestion Zone
// ============================================================================

function IngestionZone({
  onImageReady,
  previewUrl,
  ocrStatus,
  ocrProgress,
  ocrError,
  isOCRAvailable,
}: {
  onImageReady: (imageData: ImageData, previewUrl: string) => void;
  previewUrl: string | null;
  ocrStatus: string;
  ocrProgress: number;
  ocrError: string | null;
  isOCRAvailable: boolean;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFile = React.useCallback(
    async (file: File) => {
      const imageData = await fileToImageData(file);
      if (!imageData) return;
      const url = fileToPreviewUrl(file);
      onImageReady(imageData, url);
    },
    [onImageReady]
  );

  const handlePaste = React.useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await processFile(file);
          break;
        }
      }
    },
    [processFile]
  );

  React.useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const statusLabel: Record<string, string> = {
    idle: "",
    loading_engine: "Loading OCR engine...",
    initializing: "Initializing...",
    recognizing: "Recognizing text...",
    extracting_text: "Extracting candidates...",
    done: "Extraction complete",
    error: "OCR failed",
    unavailable: "OCR unavailable",
  };

  const isProcessing = ["loading_engine", "initializing", "recognizing", "extracting_text"].includes(ocrStatus);

  if (!isOCRAvailable) {
    return (
      <div className="rounded-sm border border-dashed border-[#1f2940] bg-[#0c101a] p-6 text-center space-y-2">
        <ZapOff className="h-8 w-8 text-[#9ba5be] mx-auto" />
        <p className="text-sm font-medium text-[#f0f3fa]">OCR unavailable</p>
        <p className="text-xs text-[#9ba5be]">
          Web Workers are not supported in this context. Use Manual Selection below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-sm border-2 border-dashed transition-all ${
          isDragging ? "border-[#dfb86c] bg-[#dfb86c]/5" : "border-[#1f2940] bg-[#0c101a]"
        } p-6`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Screenshot preview"
            className="mx-auto max-h-48 rounded-sm object-contain"
            id="screenshot-preview"
          />
        ) : (
          <div className="text-center space-y-2">
            <Camera className="h-8 w-8 text-[#9ba5be] mx-auto" />
            <p className="text-sm text-[#9ba5be]">
              Drag &amp; drop a screenshot, paste{" "}
              <kbd className="text-[10px] px-1 py-0.5 border border-[#26334f] rounded font-mono bg-[#101524]">
                Ctrl+V
              </kbd>
              , or select a file
            </p>
          </div>
        )}

        {/* Progress overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090c13]/80 rounded-sm space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#dfb86c]" />
            <p className="text-sm text-[#f0f3fa]">{statusLabel[ocrStatus] ?? ocrStatus}</p>
            <div className="w-32 h-1.5 bg-[#1f2940] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#dfb86c] transition-all duration-300"
                style={{ width: `${Math.round(ocrProgress * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {ocrStatus === "error" && ocrError && (
        <div className="flex items-start gap-2 p-3 rounded-xs border border-[#f87171]/30 bg-[#f87171]/5">
          <AlertCircle className="h-4 w-4 text-[#f87171] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#f87171]">OCR failed</p>
            <p className="text-[11px] text-[#9ba5be]">{ocrError}</p>
            <p className="text-[11px] text-[#9ba5be]">Use Manual Selection below to proceed.</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          id="btn-select-file"
          disabled={isProcessing}
        >
          <Upload className="h-3.5 w-3.5" />
          Select File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await processFile(file);
            e.target.value = "";
          }}
          aria-label="Select screenshot file"
        />
        <p className="text-[11px] text-[#9ba5be] self-center">
          {ocrStatus === "done" ? (
            <span className="text-[#34d399] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {statusLabel[ocrStatus]}
            </span>
          ) : (
            statusLabel[ocrStatus]
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-component: Candidate slot (OCR review + manual override)
// ============================================================================

function CandidateSlotEditor({
  slot,
  index,
  onChange,
}: {
  slot: CandidateSlot;
  index: number;
  onChange: (updated: CandidateSlot) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showPicker, setShowPicker] = React.useState(false);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return [
        ...MATCHER.allBlessings().map((b) => ({ ...b, _type: "blessing" as const })),
        ...MATCHER.allEquations().map((e) => ({ ...e, _type: "equation" as const })),
        ...MATCHER.allCurios().map((c) => ({ ...c, _type: "curio" as const })),
      ].slice(0, 15);
    }
    return [
      ...MATCHER.searchBlessings(searchQuery, 5).map((b) => ({ ...b, _type: "blessing" as const })),
      ...MATCHER.searchEquations(searchQuery, 3).map((e) => ({ ...e, _type: "equation" as const })),
      ...MATCHER.searchCurios(searchQuery, 3).map((c) => ({ ...c, _type: "curio" as const })),
    ];
  }, [searchQuery]);

  const resolvedEntity =
    slot.resolvedEntityId
      ? ALL_BLESSINGS.find((b) => b.id === slot.resolvedEntityId) ||
        ALL_EQUATIONS.find((e) => e.id === slot.resolvedEntityId) ||
        ALL_CURIOS.find((c) => c.id === slot.resolvedEntityId)
      : null;

  const selectEntity = (id: string, type: CandidateEntityType) => {
    onChange({ ...slot, resolvedEntityId: id, entityType: type, isManualOverride: true, confidence: null });
    setShowPicker(false);
    setSearchQuery("");
  };

  const clearSlot = () => {
    onChange(emptySlot(slot.id));
    setShowPicker(false);
    setSearchQuery("");
  };

  return (
    <div
      className="rounded-sm border border-[#1f2940] bg-[#101524] p-3 space-y-2"
      data-testid={`candidate-slot-${index}`}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#9ba5be] uppercase">
          Option {index + 1}
        </span>
        <div className="flex items-center gap-2">
          {slot.confidence && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${confidenceBadgeColor(slot.confidence)}`}>
              {slot.confidence}
            </span>
          )}
          {slot.isManualOverride && (
            <Badge size="sm" variant="info">Manual</Badge>
          )}
          {resolvedEntity && (
            <button
              onClick={clearSlot}
              className="text-[#9ba5be] hover:text-[#f87171] transition-colors"
              aria-label="Clear slot"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* OCR raw text (read-only display) */}
      {slot.rawOCRText && !slot.isManualOverride && (
        <p className="text-[11px] font-mono text-[#9ba5be] bg-[#0c101a] px-2 py-1 rounded-xs border border-[#1f2940]">
          OCR: &ldquo;{slot.rawOCRText}&rdquo;
        </p>
      )}

      {/* Resolved entity display */}
      {resolvedEntity ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#f0f3fa]">{resolvedEntity.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {"path" in resolvedEntity && (
              <Badge size="sm" variant="secondary">{(resolvedEntity as DUBlessingKnowledge).path}</Badge>
            )}
            {"primaryPath" in resolvedEntity && (
              <Badge size="sm" variant="secondary">
                {(resolvedEntity as DUEquationKnowledge).primaryPath}/{(resolvedEntity as DUEquationKnowledge).secondaryPath}
              </Badge>
            )}
            {"category" in resolvedEntity && !(("path" in resolvedEntity) || ("primaryPath" in resolvedEntity)) && (
              <Badge size="sm" variant="secondary">{(resolvedEntity as DUCurioKnowledge).category}</Badge>
            )}
            <Badge size="sm" variant={resolvedEntity.rarity === 3 ? "rarity5" : "rarity4"}>
              {resolvedEntity.rarity}★
            </Badge>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#9ba5be]">No entity selected</p>
      )}

      {/* Search picker toggle */}
      <button
        onClick={() => setShowPicker((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] text-[#dfb86c] hover:text-[#f4d38f] transition-colors"
        aria-expanded={showPicker}
        id={`slot-picker-toggle-${index}`}
      >
        <Search className="h-3 w-3" />
        {resolvedEntity ? "Change selection" : "Search to select"}
      </button>

      {/* Picker dropdown */}
      {showPicker && (
        <div className="space-y-2 border-t border-[#1f2940] pt-2">
          <Input
            id={`slot-search-${index}`}
            placeholder="Search blessings, equations, curios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs"
            autoFocus
          />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {searchResults.map((item) => {
              const typeLabel = item._type === "blessing" ? "Blessing" : item._type === "equation" ? "Equation" : "Curio";
              return (
                <button
                  key={`${item._type}-${item.id}`}
                  onClick={() => selectEntity(item.id, item._type)}
                  className="w-full text-left px-2 py-1.5 rounded-xs hover:bg-[#1a233a] transition-colors space-y-0.5"
                  aria-label={`Select ${item.name}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#f0f3fa]">{item.name}</span>
                    <Badge size="sm" variant="outline">{typeLabel}</Badge>
                  </div>
                  <div className="flex gap-1.5">
                    {"path" in item && <span className="text-[10px] text-[#9ba5be]">{(item as DUBlessingKnowledge).path}</span>}
                    <span className="text-[10px] text-[#9ba5be]">{item.rarity}★</span>
                  </div>
                </button>
              );
            })}
            {searchResults.length === 0 && (
              <p className="text-xs text-[#9ba5be] px-2 py-2">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-component: Recommendation Card
// ============================================================================

function RecommendationCard({
  evaluation,
  onCommit,
}: {
  evaluation: DUPickEvaluation;
  onCommit: (entityId: string, entityType: "blessing" | "equation" | "curio") => void;
}) {
  const entity =
    ALL_BLESSINGS.find((b) => b.id === evaluation.entityId) ||
    ALL_EQUATIONS.find((e) => e.id === evaluation.entityId) ||
    ALL_CURIOS.find((c) => c.id === evaluation.entityId);

  if (!entity) return null;

  const rankBadge = evaluation.rank === 1
    ? "text-[#dfb86c] border-[#dfb86c]/40 bg-[#dfb86c]/10"
    : evaluation.rank === 2
    ? "text-[#9ba5be] border-[#9ba5be]/30 bg-[#9ba5be]/5"
    : "text-[#8e9cb5] border-[#1f2940] bg-[#101524]";

  const rankLabel = evaluation.rank === 1 ? "#1 Recommended" : evaluation.rank === 2 ? "#2 Alternative" : "#3 Low Priority";

  return (
    <div
      className={`relative rounded-sm border p-4 space-y-3 transition-all ${
        evaluation.isRecommended
          ? "border-[#dfb86c]/40 bg-gradient-to-b from-[#16130a] to-[#101524] corner-notch-gold"
          : "border-[#1f2940] bg-[#101524]"
      }`}
      data-testid={`recommendation-${evaluation.rank}`}
    >
      {/* Rank badge */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 border rounded-xs ${rankBadge}`}>
          {rankLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#9ba5be]">Score:</span>
          <span className={`text-sm font-bold font-mono ${evaluation.isRecommended ? "text-[#dfb86c]" : "text-[#f0f3fa]"}`}>
            {evaluation.score}
          </span>
          <span className="text-[10px] text-[#9ba5be] font-mono">/100</span>
        </div>
      </div>

      {/* Entity name */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[#f0f3fa]">{entity.name}</p>
        <div className="flex flex-wrap gap-1.5">
          {"path" in entity && (
            <Badge size="sm" variant="secondary">{(entity as DUBlessingKnowledge).path}</Badge>
          )}
          {"primaryPath" in entity && (
            <Badge size="sm" variant="secondary">
              {(entity as DUEquationKnowledge).primaryPath}/{(entity as DUEquationKnowledge).secondaryPath}
            </Badge>
          )}
          <Badge size="sm" variant={entity.rarity === 3 ? "rarity5" : "rarity4"}>
            {entity.rarity}★
          </Badge>
          <Badge size="sm" variant="outline">{evaluation.entityType}</Badge>
        </div>
      </div>

      {/* Reason codes */}
      <div className="space-y-1.5">
        {evaluation.reasons.map((reason, i) => {
          const isPositive = reason.scoreDelta > 0;
          const isNegative = reason.scoreDelta < 0;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs p-2 rounded-xs border ${
                isPositive
                  ? "border-[#34d399]/20 bg-[#34d399]/5"
                  : isNegative
                  ? "border-[#f87171]/20 bg-[#f87171]/5"
                  : "border-[#1f2940] bg-[#0c101a]"
              }`}
            >
              <span className={`font-mono text-[10px] shrink-0 mt-0.5 ${
                isPositive ? "text-[#34d399]" : isNegative ? "text-[#f87171]" : "text-[#9ba5be]"
              }`}>
                {isPositive ? `+${reason.scoreDelta}` : reason.scoreDelta === 0 ? " 0" : reason.scoreDelta}
              </span>
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] text-[#9ba5be] uppercase tracking-wide">{reason.code}</span>
                <p className="text-[11px] text-[#9ba5be] leading-relaxed">{reason.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commit button (only on rank 1 and 2 for clarity) */}
      {evaluation.rank <= 2 && (
        <Button
          variant={evaluation.isRecommended ? "primary" : "secondary"}
          size="sm"
          onClick={() => onCommit(evaluation.entityId, evaluation.entityType)}
          id={`btn-commit-rank-${evaluation.rank}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Commit Choice
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Main view
// ============================================================================

export function AssistantView() {
  // Run store
  const {
    partyCharacterIds,
    targetEquationIds,
    collectedBlessingIds,
    activeCurioIds,
    setParty,
    setTargetEquations,
    commitBlessing,
    commitCurio,
    resetRun,
  } = useDURunStore();

  // OCR
  const { state: ocrState, processImage, reset: resetOCR, isAvailable: isOCRAvailable } = useOCR();

  // UI state
  const [activeTab, setActiveTab] = React.useState<"run" | "screenshot" | "manual">("run");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Clean up Object URL to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const [candidates, setCandidates] = React.useState<CandidateSlot[]>([
    emptySlot("c1"),
    emptySlot("c2"),
    emptySlot("c3"),
  ]);
  const [evaluations, setEvaluations] = React.useState<DUPickEvaluation[]>([]);
  const [committedMessage, setCommittedMessage] = React.useState<string | null>(null);

  // Derive party paths for recommendation engine
  const { characters } = useCharacters();
  const characterPathMap = React.useMemo(() => {
    const map = new Map<string, import("@astralyn/shared").CombatPath>();
    for (const c of characters) map.set(c.id, c.path);
    return map;
  }, [characters]);

  const partyPaths = React.useMemo(
    () => derivePartyPaths(partyCharacterIds, characterPathMap),
    [partyCharacterIds, characterPathMap]
  );

  const runContext = React.useMemo(() => ({
    partyPaths,
    targetEquationIds,
    collectedBlessingIds,
    activeCurioIds,
  }), [partyPaths, targetEquationIds, collectedBlessingIds, activeCurioIds]);

  const targetEquations = React.useMemo(
    () => ALL_EQUATIONS.filter((e) => targetEquationIds.includes(e.id)),
    [targetEquationIds]
  );

  // Map OCR output to candidate slots
  React.useEffect(() => {
    if (ocrState.status !== "done" || ocrState.lines.length === 0) return;
    const newCandidates: CandidateSlot[] = ["c1", "c2", "c3"].map((id, i) => {
      const line = ocrState.lines[i];
      if (!line) return emptySlot(id);
      const match = MATCHER.matchAny(line);
      const entityId = match?.blessing?.candidate.id ?? match?.equation?.candidate.id ?? match?.curio?.candidate.id ?? null;
      const entityType: CandidateEntityType = match?.type ?? "blessing";
      return {
        id,
        rawOCRText: line,
        resolvedEntityId: entityId,
        entityType,
        confidence: match?.bestConfidence ?? "Low",
        isManualOverride: false,
      };
    });
    setCandidates(newCandidates);
    setActiveTab("manual"); // Show review panel after OCR
  }, [ocrState.status, ocrState.lines]);

  // Evaluate candidates deterministically
  const evaluateCandidates = React.useCallback(() => {
    const resolvedIds = candidates.map((c) => c.resolvedEntityId).filter(Boolean) as string[];
    if (resolvedIds.length === 0) return;

    const blessingCandidates = ALL_BLESSINGS.filter((b) => resolvedIds.includes(b.id));
    const equationCandidates = ALL_EQUATIONS.filter((e) => resolvedIds.includes(e.id));
    const curioCandidates = ALL_CURIOS.filter((c) => resolvedIds.includes(c.id));

    // Evaluate all present categories and merge. Handles both homogeneous
    // (all blessings, all curios) and mixed-type candidate sets correctly.
    const b = blessingCandidates.length > 0
      ? evaluateDUBlessingChoices(blessingCandidates, runContext, targetEquations, ALL_BLESSINGS)
      : [];
    const e = equationCandidates.length > 0
      ? evaluateDUEquationChoices(equationCandidates, runContext, ALL_BLESSINGS)
      : [];
    const c = curioCandidates.length > 0
      ? evaluateDUCurioChoices(curioCandidates, runContext)
      : [];
    const merged = [...b, ...e, ...c].sort((x, y) => y.score - x.score);
    const results: DUPickEvaluation[] = merged.map((r, i) => ({
      ...r,
      rank: (i + 1) as DUPickEvaluation["rank"],
      isRecommended: i === 0,
    }));

    setEvaluations(results);
  }, [candidates, runContext, targetEquations]);

  const handleCommit = (entityId: string, entityType: "blessing" | "equation" | "curio") => {
    if (entityType === "blessing") {
      commitBlessing(entityId);
    } else if (entityType === "curio") {
      commitCurio(entityId);
    }
    // Equations are "targeted" not "collected"

    const entity =
      ALL_BLESSINGS.find((b) => b.id === entityId)?.name ||
      ALL_EQUATIONS.find((e) => e.id === entityId)?.name ||
      ALL_CURIOS.find((c) => c.id === entityId)?.name ||
      entityId;

    setCommittedMessage(`Committed: ${entity}`);
    setTimeout(() => setCommittedMessage(null), 3000);

    // Clear candidates for next pick
    setCandidates([emptySlot("c1"), emptySlot("c2"), emptySlot("c3")]);
    setEvaluations([]);
    setPreviewUrl(null);
    resetOCR();
  };

  const hasResolved = candidates.some((c) => c.resolvedEntityId !== null);

  return (
    <div className="space-y-6 max-w-3xl" data-testid="view-assistant">
      {/* Page header */}
      <div className="border-b border-[#1a2338] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Phase 7
          </span>
          <span className="text-[10px] font-mono text-[#9ba5be]">· Divergent Universe</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa]">
          Live Decision Assistant
        </h1>
        <p className="text-xs text-[#9ba5be] mt-1">
          Deterministic blessing, equation, and curio recommendations for your active DU run.
        </p>
      </div>

      {/* Committed feedback */}
      {committedMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xs border border-[#34d399]/30 bg-[#34d399]/5 text-sm text-[#34d399]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {committedMessage}
        </div>
      )}

      {/* Active Run Status Bar */}
      <RunStatusBar
        partyCharacterIds={partyCharacterIds}
        targetEquationIds={targetEquationIds}
        collectedBlessingIds={collectedBlessingIds}
        activeCurioIds={activeCurioIds}
        onReset={resetRun}
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[#0c101a] rounded-sm border border-[#1f2940]" role="tablist">
        {(["run", "screenshot", "manual"] as const).map((tab) => {
          const labels = { run: "Run Setup", screenshot: "Screenshot OCR", manual: "Manual Selection" };
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              id={`tab-${tab}`}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-xs transition-all ${
                activeTab === tab
                  ? "bg-[#161e32] text-[#f0f3fa] border border-[#26334f]"
                  : "text-[#9ba5be] hover:text-[#f0f3fa]"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab: Run Setup */}
      {activeTab === "run" && (
        <div className="space-y-6">
          <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#f0f3fa] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#dfb86c]" />
              Party Configuration
            </h2>
            <PartyConfigurator
              partyCharacterIds={partyCharacterIds}
              onSetParty={setParty}
            />
          </div>

          <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#f0f3fa] flex items-center gap-2">
              <Target className="h-4 w-4 text-[#dfb86c]" />
              Target Equations
            </h2>
            <EquationSelector
              targetEquationIds={targetEquationIds}
              onSetEquations={setTargetEquations}
            />
          </div>

          {(partyCharacterIds.length > 0 || targetEquationIds.length > 0) && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setActiveTab("manual")}
                id="btn-go-to-manual"
              >
                Go to Manual Selection
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Screenshot OCR */}
      {activeTab === "screenshot" && (
        <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[#f0f3fa] flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#dfb86c]" />
            Screenshot Ingestion
          </h2>
          <IngestionZone
            onImageReady={(imageData, url) => {
              setPreviewUrl(url);
              processImage(imageData);
            }}
            previewUrl={previewUrl}
            ocrStatus={ocrState.status}
            ocrProgress={ocrState.progress}
            ocrError={ocrState.error}
            isOCRAvailable={isOCRAvailable}
          />
        </div>
      )}

      {/* Tab: Manual Selection */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          <div className="rounded-sm border border-[#1f2940] bg-[#101524] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#f0f3fa] flex items-center gap-2">
                <Search className="h-4 w-4 text-[#dfb86c]" />
                OCR Review &amp; Manual Selection
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCandidates([emptySlot("c1"), emptySlot("c2"), emptySlot("c3")]);
                  setEvaluations([]);
                }}
              >
                Clear All
              </Button>
            </div>
            <p className="text-xs text-[#9ba5be]">
              Select 1–3 candidate options to evaluate. Confidence badges show OCR match quality.
            </p>
            <div className="space-y-3">
              {candidates.map((slot, i) => (
                <CandidateSlotEditor
                  key={slot.id}
                  slot={slot}
                  index={i}
                  onChange={(updated) => {
                    const next = [...candidates];
                    next[i] = updated;
                    setCandidates(next);
                    setEvaluations([]); // Clear stale evaluations
                  }}
                />
              ))}
            </div>
            <Button
              variant="primary"
              onClick={evaluateCandidates}
              disabled={!hasResolved}
              id="btn-evaluate"
            >
              <Star className="h-4 w-4" />
              Evaluate Choices
            </Button>
          </div>

          {/* Recommendations */}
          {evaluations.length > 0 && (
            <div className="space-y-3">
              <div className="border-b border-[#1a2338] pb-2">
                <h2 className="text-sm font-semibold text-[#f0f3fa]">Recommendations</h2>
                <p className="text-xs text-[#9ba5be] mt-0.5">
                  Deterministic scoring — identical inputs always produce identical rankings.
                </p>
              </div>
              {evaluations.map((ev) => (
                <RecommendationCard
                  key={ev.entityId}
                  evaluation={ev}
                  onCommit={handleCommit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
