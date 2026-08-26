import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../components/ui/panel";
import { CharacterTile } from "../components/hsr/character-tile";
import { RecommendationPanel } from "../components/hsr/recommendation-panel";
import { SourceRankPanel } from "../components/hsr/source-rank-panel";
import { DecisionCard } from "../components/hsr/decision-card";
import { GameAssetImage } from "../components/ui/game-asset-image";
import { useToast } from "../components/ui/toast";
import {
  FIXTURE_CHARACTERS,
  FIXTURE_RECOMMENDATION,
  FIXTURE_SOURCE_COMPARISON,
  FIXTURE_DECISION,
} from "../lib/fixtures";

export function HomeView() {
  const [selectedCharId, setSelectedCharId] = React.useState<string>("acheron");
  const { addToast } = useToast();

  const activeChar = React.useMemo(() => {
    return (
      FIXTURE_CHARACTERS.find((c) => c.id === selectedCharId) || FIXTURE_CHARACTERS[0]
    );
  }, [selectedCharId]);

  return (
    <div className="space-y-8" data-testid="home-view">
      {/* Top Welcome / Status Hero Banner */}
      <div className="relative overflow-hidden rounded-sm border border-[#dfb86c]/40 bg-gradient-to-r from-[#1c160a] via-[#12182b] to-[#0c101c] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm">
                Tactical Companion
              </Badge>
              <span className="text-xs text-[#9ba5be]">Interactive Preview</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#f4d38f] tracking-tight uppercase mt-2">
              Honkai: Star Rail Assistant
            </h1>
            <p className="text-xs sm:text-sm text-[#9ba5be] mt-1 max-w-2xl leading-relaxed">
              Personalized team synergy evaluation, transparent multi-source meta
              consensus, and real-time Divergent Universe decision guidance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/characters">
              <Button variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                Explore Characters
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Active Recommendation & DU Quick Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SectionHeader
            title="Team Optimization Guidance"
            category="Astralyn Verdict"
            subtitle="Tailored team allocation and synergy rationale (Sample Output)"
          />
          <RecommendationPanel recommendation={FIXTURE_RECOMMENDATION} className="mt-2" />
        </div>

        <div className="lg:col-span-5">
          <SectionHeader
            title="Divergent Universe Assistant"
            category="Live Decision"
            subtitle="Fast pick recommendation for blessings and curios (Sample Output)"
          />
          <DecisionCard
            decision={FIXTURE_DECISION}
            onConfirm={() =>
              addToast({
                title: "Blessing Choice Recorded",
                description: "Applied Perfect Experience: Fuli to active session.",
                variant: "success",
              })
            }
            className="mt-2"
          />
        </div>
      </div>

      {/* Grid Row 2: Roster Selection with CharacterTile v2 + Parchment Detail Inspection Panel */}
      <div>
        <SectionHeader
          title="Trailblazer Character Roster"
          category="Roster Selection"
          subtitle="Select any character to inspect tactical parameters and equipment profile"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-3">
          {/* Character Tiles Grid (8 cols on desktop) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {FIXTURE_CHARACTERS.map((char) => (
                <CharacterTile
                  key={char.id}
                  character={char}
                  selected={selectedCharId === char.id}
                  onClick={() => {
                    setSelectedCharId(char.id);
                    addToast({
                      title: `Selected ${char.name}`,
                      description: `Loaded tactical profile for ${char.rarity}★ ${char.element} ${char.path}.`,
                      variant: "info",
                    });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Warm Celestial Parchment Tactical Detail Panel (Validating Light Contrast) */}
          <div className="lg:col-span-4">
            <Panel variant="parchment" className="h-full flex flex-col justify-between">
              <PanelHeader className="border-[#d4ccbd] bg-[#e4dcce]/60 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#634812]" />
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#634812] uppercase">
                      Tactical Dossier
                    </span>
                    <PanelTitle className="text-base font-bold text-[#181d28]">
                      {activeChar.name} Profile
                    </PanelTitle>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase bg-[#181d28] text-[#eee8dc]">
                  {activeChar.rarity}★ {activeChar.element}
                </span>
              </PanelHeader>

              <PanelContent className="space-y-4 p-4 text-[#181d28]">
                {/* Character Preview Art & Role */}
                <div className="flex items-center gap-3.5 bg-white/70 p-3 rounded-xs border border-[#d4ccbd]">
                  <div className="h-16 w-16 shrink-0 rounded-xs overflow-hidden border border-[#634812]/40 bg-[#121828]">
                    <GameAssetImage
                      entityType="character_preview"
                      entityId={activeChar.id}
                      alt={activeChar.name}
                      variant="preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#181d28]">
                      {activeChar.name}
                    </h4>
                    <p className="text-xs text-[#565f75] mt-0.5">
                      Path: <strong>{activeChar.path}</strong>
                    </p>
                    <p className="text-xs text-[#634812] font-semibold mt-0.5">
                      {activeChar.role}
                    </p>
                  </div>
                </div>

                {/* Tactical Parameters */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#d4ccbd]">
                    <span className="text-[#565f75]">Combat Element</span>
                    <strong className="text-[#181d28]">{activeChar.element}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#d4ccbd]">
                    <span className="text-[#565f75]">Current Eidolon</span>
                    <strong className="font-mono text-[#634812]">
                      E{activeChar.eidolon ?? 0}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#d4ccbd]">
                    <span className="text-[#565f75]">Level Status</span>
                    <strong className="font-mono text-[#181d28]">
                      Lv. {activeChar.level ?? 80}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xs bg-[#e4dcce]/70 border border-[#d4ccbd] text-[11px] text-[#565f75] leading-relaxed">
                  <span className="font-semibold text-[#181d28]">Inspection Notice:</span>{" "}
                  This warm parchment surface provides high-contrast inspection
                  readability, anchoring detailed character mechanics alongside the dark
                  analytical workspace.
                </div>
              </PanelContent>

              <div className="p-4 pt-0">
                <Link to="/characters">
                  <Button variant="parchment" size="sm" className="w-full">
                    View Full Character Database
                  </Button>
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Grid Row 3: 3-Source Consensus Matrix */}
      <div>
        <SectionHeader
          title="Meta Consensus Matrix"
          category="Multi-Source Verification"
          subtitle="Side-by-side comparative analysis of leading community build guides (Illustrative Layout)"
        />
        <SourceRankPanel sourceData={FIXTURE_SOURCE_COMPARISON} className="mt-2" />
      </div>
    </div>
  );
}
