// apps/web/src/features/onboarding/onboarding-wizard.tsx
import * as React from "react";
import { CharacterSelector } from "./character-selector";
import { useAuth } from "../auth";
import { useCharacters } from "../../lib/knowledge/use-knowledge";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { CharacterAvatar, ElementIcon, PathIcon } from "../../components/ui/game-asset";

interface CharacterConfig {
  characterId: string;
  level: number;
  eidolon: number;
}

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const { user, refreshSession } = useAuth();
  const [step, setStep] = React.useState<"SELECTION" | "CONFIGURATION">("SELECTION");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [configs, setConfigs] = React.useState<Map<string, CharacterConfig>>(new Map());
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load all characters to look up details for step 2
  const { characters } = useCharacters();
  const characterMap = React.useMemo(() => {
    return new Map(characters.map((c) => [c.id, c]));
  }, [characters]);

  const handleToggle = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Initialize default config if newly selected
    setConfigs((prev) => {
      const next = new Map(prev);
      if (!next.has(id)) {
        next.set(id, { characterId: id, level: 80, eidolon: 0 });
      }
      return next;
    });
  }, []);

  const handleLevelChange = (characterId: string, level: number) => {
    setConfigs((prev) => {
      const next = new Map(prev);
      const current = next.get(characterId) || { characterId, level: 80, eidolon: 0 };
      next.set(characterId, { ...current, level: Math.max(1, Math.min(80, level)) });
      return next;
    });
  };

  const handleEidolonChange = (characterId: string, eidolon: number) => {
    setConfigs((prev) => {
      const next = new Map(prev);
      const current = next.get(characterId) || { characterId, level: 80, eidolon: 0 };
      next.set(characterId, { ...current, eidolon: Math.max(0, Math.min(6, eidolon)) });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      setError("Please select at least one character to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const rosterPayload = Array.from(selectedIds).map((id) => {
      const conf = configs.get(id);
      return {
        characterId: id,
        level: conf?.level ?? 80,
        eidolon: conf?.eidolon ?? 0,
      };
    });

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ roster: rosterPayload }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      await refreshSession();
      if (onComplete) {
        onComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to save onboarding roster: ${msg}`);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-[#1a2338] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
            Astral Express Onboarding
          </span>
          <span className="text-[10px] font-mono text-[#9ba5be]">• Step {step === "SELECTION" ? "1 of 2" : "2 of 2"}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f0f3fa] mt-1">
          {step === "SELECTION"
            ? `Welcome, ${user?.name || "Trailblazer"} — Select Your Owned Roster`
            : "Configure Character Levels & Eidolons"}
        </h1>
        <p className="text-xs text-[#9ba5be] mt-1">
          {step === "SELECTION"
            ? "Choose the characters you currently own. Roster context allows Astralyn to calculate personalized team recommendations."
            : "Review your selected roster and adjust character levels and Eidolons. You can always edit these later in Settings."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/20 rounded-xs text-xs text-[#f87171]">
          {error}
        </div>
      )}

      {/* Step 1: Character Selector */}
      {step === "SELECTION" && (
        <div className="space-y-6">
          <CharacterSelector selectedIds={selectedIds} onToggle={handleToggle} />

          <div className="flex items-center justify-between pt-4 border-t border-[#1a2338]">
            <div className="text-xs text-[#9ba5be]">
              {selectedIds.size === 0 ? (
                <span className="text-[#f87171]">Select at least 1 character to proceed</span>
              ) : (
                <span>
                  <strong className="text-[#dfb86c] font-mono">{selectedIds.size}</strong> characters ready for setup
                </span>
              )}
            </div>
            <Button
              variant="primary"
              disabled={selectedIds.size === 0}
              onClick={() => {
                if (selectedIds.size > 0) setStep("CONFIGURATION");
              }}
              className="flex items-center gap-2"
            >
              <span>Next: Configure Levels & Eidolons</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Level & Eidolon Configuration */}
      {step === "CONFIGURATION" && (
        <div className="space-y-6">
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {Array.from(selectedIds).map((id) => {
              const char = characterMap.get(id);
              const conf = configs.get(id) || { characterId: id, level: 80, eidolon: 0 };
              const is5Star = char?.rarity === 5;

              return (
                <div
                  key={id}
                  className={`p-3.5 rounded-xs border border-[#1a2338] bg-[#0c101a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-2 ${
                    is5Star ? "border-l-[#d89f37]" : "border-l-[#9d7fe6]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CharacterAvatar
                      characterId={id}
                      name={char?.name || id}
                      rarity={(char?.rarity as 4 | 5) || 5}
                      size="md"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#f0f3fa]">
                        {char?.name || id}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#9ba5be] font-mono mt-0.5">
                        <PathIcon path={char?.path || ""} size={12} />
                        <span>{char?.path}</span>
                        <span>•</span>
                        <ElementIcon element={char?.element || ""} size={12} />
                        <span>{char?.element}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Level Picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#9ba5be] uppercase">Lv:</span>
                      <input
                        type="number"
                        min={1}
                        max={80}
                        value={conf.level}
                        onChange={(e) => handleLevelChange(id, parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1 bg-[#101524] border border-[#1f2940] rounded-xs text-xs font-mono font-bold text-[#f0f3fa] text-center focus:border-[#dfb86c] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleLevelChange(id, 80)}
                        className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#1f2940] text-[#9ba5be] hover:text-[#dfb86c]"
                      >
                        MAX
                      </button>
                    </div>

                    {/* Eidolon Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-[#9ba5be] uppercase mr-1">Eidolon:</span>
                      {[0, 1, 2, 3, 4, 5, 6].map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => handleEidolonChange(id, e)}
                          className={`h-7 w-7 rounded-xs text-xs font-mono font-bold transition-all cursor-pointer ${
                            conf.eidolon === e
                              ? "bg-[#dfb86c] text-[#090c13] shadow-[0_0_8px_rgba(223,184,108,0.4)]"
                              : "bg-[#101524] border border-[#1f2940] text-[#9ba5be] hover:text-[#f0f3fa]"
                          }`}
                        >
                          E{e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1a2338]">
            <Button
              variant="secondary"
              onClick={() => setStep("SELECTION")}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Character Selection</span>
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <span>Saving Roster...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Finish Setup ({selectedIds.size} characters)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
