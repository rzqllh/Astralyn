import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CharacterTile } from "../components/hsr/character-tile";
import { RecommendationPanel } from "../components/hsr/recommendation-panel";
import { SourceRankPanel } from "../components/hsr/source-rank-panel";
import { DecisionCard } from "../components/hsr/decision-card";
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

  return (
    <div className="space-y-8" data-testid="home-view">
      {/* Top Welcome / Status Hero Banner */}
      <div className="relative overflow-hidden rounded-sm border border-[#dfb86c]/40 bg-gradient-to-r from-[#1c160a] via-[#12182b] to-[#0c101c] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm">
                Astralyn v3.0 Engine Active
              </Badge>
              <span className="text-xs font-mono text-[#9ba5be]">Patch 3.0 Ready</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#f4d38f] tracking-tight uppercase mt-2">
              Honkai: Star Rail Assistant
            </h1>
            <p className="text-xs sm:text-sm text-[#9ba5be] mt-1 max-w-2xl leading-relaxed">
              Tactical companion providing instant team synergy scoring, 3-source meta
              consensus, and real-time Divergent Universe decision guidance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/design-system">
              <Button variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>
                Explore Design System
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Active Recommendation & DU Quick Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <SectionHeader
            title="Active Team Optimization"
            category="Astralyn Verdict"
            subtitle="Algorithmically tailored recommendation for your active team"
          />
          <RecommendationPanel recommendation={FIXTURE_RECOMMENDATION} className="mt-2" />
        </div>

        <div className="lg:col-span-5">
          <SectionHeader
            title="Divergent Universe Assistant"
            category="Live Recommendation"
            subtitle="Instant pick recommendation from screenshot OCR engine"
          />
          <DecisionCard
            decision={FIXTURE_DECISION}
            onConfirm={() =>
              addToast({
                title: "Blessing Choice Confirmed",
                description: "Recorded Perfect Experience: Fuli to active DU run state.",
                variant: "success",
              })
            }
            className="mt-2"
          />
        </div>
      </div>

      {/* Grid Row 2: Roster Selection Preview */}
      <div>
        <SectionHeader
          title="Active Trailblazer Roster"
          category="Character Selection"
          subtitle="Select a character to inspect build priorities and optimal teammates"
          action={
            <Link to="/design-system">
              <Button variant="secondary" size="sm">
                View All Primitives
              </Button>
            </Link>
          }
        />
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {FIXTURE_CHARACTERS.map((char) => (
            <CharacterTile
              key={char.id}
              character={char}
              selected={selectedCharId === char.id}
              onClick={() => {
                setSelectedCharId(char.id);
                addToast({
                  title: `Selected ${char.name}`,
                  description: `Inspecting ${char.rarity}★ ${char.element} ${char.path} build parameters.`,
                  variant: "info",
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Grid Row 3: 3-Source Consensus Matrix */}
      <div>
        <SectionHeader
          title="Meta Consensus Engine"
          category="Source Comparison"
          subtitle="Side-by-side verification comparing leading theorycrafting sources"
        />
        <SourceRankPanel sourceData={FIXTURE_SOURCE_COMPARISON} className="mt-2" />
      </div>
    </div>
  );
}
