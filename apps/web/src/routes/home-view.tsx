import { Link } from "@tanstack/react-router";
import {
  Users,
  Sparkles,
  Layers,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  ArrowRight,
  Clock,
} from "lucide-react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../components/ui/panel";
import { Skeleton } from "../components/ui/skeleton";
import { useKnowledgeInit } from "../lib/knowledge/use-knowledge";

export function HomeView() {
  const { syncResult, loading, error } = useKnowledgeInit();

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
              <span className="text-xs text-[#9ba5be]">
                Production Readiness Baseline
              </span>
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

      {/* Canonical Knowledge Release Status Section */}
      <div>
        <SectionHeader
          title="Canonical Knowledge Baseline"
          category="System Status"
          subtitle="Validated canonical data release and local cache synchronization state"
        />

        <div className="mt-3">
          {loading ? (
            <Panel variant="default" className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Panel>
          ) : syncResult &&
            (syncResult.status === "fresh" || syncResult.status === "updated") ? (
            <Panel variant="default" className="border-[#34d399]/40 bg-[#0a141c]">
              <PanelHeader className="border-[#1a2e38] bg-[#0d1c24]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#34d399]" />
                  <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                    Knowledge Base Synchronized
                  </PanelTitle>
                </div>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </PanelHeader>
              <PanelContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-xs bg-[#071118] border border-[#142834]">
                    <span className="text-[#9ba5be] block font-mono text-[10px] uppercase">
                      Knowledge Release
                    </span>
                    <strong className="text-[#f0f3fa] font-mono text-sm">
                      {syncResult.activeKnowledgeVersion}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xs bg-[#071118] border border-[#142834]">
                    <span className="text-[#9ba5be] block font-mono text-[10px] uppercase">
                      Game Version
                    </span>
                    <strong className="text-[#dfb86c] font-mono text-sm">
                      {syncResult.gameVersion ?? "N/A"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xs bg-[#071118] border border-[#142834]">
                    <span className="text-[#9ba5be] block font-mono text-[10px] uppercase">
                      Cache Timestamp
                    </span>
                    <strong className="text-[#f0f3fa] font-mono text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-[#9ba5be]" />
                      {syncResult.cachedAt
                        ? new Date(syncResult.cachedAt).toLocaleDateString()
                        : "Active"}
                    </strong>
                  </div>
                </div>
              </PanelContent>
            </Panel>
          ) : syncResult?.status === "offline_cache_active" ? (
            <Panel variant="default" className="border-[#fbbf24]/40 bg-[#16130b]">
              <PanelHeader className="border-[#2e2614] bg-[#1f1b0e]">
                <div className="flex items-center gap-2.5">
                  <WifiOff className="h-4 w-4 text-[#fbbf24]" />
                  <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                    Offline Local Cache Active
                  </PanelTitle>
                </div>
                <Badge variant="warning" size="sm">
                  Offline Cache
                </Badge>
              </PanelHeader>
              <PanelContent className="p-4 space-y-2 text-xs">
                <p className="text-[#f0f3fa]">
                  Remote manifest is unreachable. Serving validated local knowledge cache
                  (
                  <span className="font-mono font-bold text-[#dfb86c]">
                    {syncResult.activeKnowledgeVersion}
                  </span>
                  ).
                </p>
                {syncResult.error && (
                  <p className="text-[11px] text-[#9ba5be] font-mono">
                    {syncResult.error}
                  </p>
                )}
              </PanelContent>
            </Panel>
          ) : syncResult?.status === "update_rejected_previous_retained" ? (
            <Panel variant="default" className="border-[#fbbf24]/40 bg-[#16130b]">
              <PanelHeader className="border-[#2e2614] bg-[#1f1b0e]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#fbbf24]" />
                  <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                    Update Rejected • Prior Cache Retained
                  </PanelTitle>
                </div>
                <Badge variant="warning" size="sm">
                  Retained
                </Badge>
              </PanelHeader>
              <PanelContent className="p-4 space-y-2 text-xs">
                <p className="text-[#f0f3fa]">
                  Latest release failed integrity validation. Retained prior valid cache (
                  <span className="font-mono font-bold text-[#dfb86c]">
                    {syncResult.activeKnowledgeVersion}
                  </span>
                  ).
                </p>
                {syncResult.error && (
                  <p className="text-[11px] text-[#9ba5be] font-mono">
                    {syncResult.error}
                  </p>
                )}
              </PanelContent>
            </Panel>
          ) : (
            <Panel variant="default" className="border-[#f87171]/40 bg-[#1a0c0e]">
              <PanelHeader className="border-[#38161a] bg-[#240e11]">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#f87171]" />
                  <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                    Knowledge Unavailable
                  </PanelTitle>
                </div>
                <Badge variant="danger" size="sm">
                  Unavailable
                </Badge>
              </PanelHeader>
              <PanelContent className="p-4 space-y-2 text-xs">
                <p className="text-[#f0f3fa]">
                  Canonical knowledge release is currently unreachable and no validated
                  local cache exists.
                </p>
                <p className="text-[11px] text-[#9ba5be] font-mono">
                  {error?.message ||
                    syncResult?.error ||
                    "Knowledge synchronization failed."}
                </p>
              </PanelContent>
            </Panel>
          )}
        </div>
      </div>

      {/* Grid: Explicit Module Status Cards (No fabricated gameplay or user data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Character Roster */}
        <Panel variant="default">
          <PanelHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#dfb86c]" />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                  Roster Management
                </span>
                <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                  Character Roster
                </PanelTitle>
              </div>
            </div>
            <Badge variant="outline" size="sm">
              Unavailable
            </Badge>
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-2">
            <p>
              Account and roster persistence unavailable in this build. Real player roster
              synchronization will unlock in a later phase.
            </p>
          </PanelContent>
        </Panel>

        {/* Module 2: Team Optimization Guidance */}
        <Panel variant="default">
          <PanelHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#dfb86c]" />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                  Tactical Recommendations
                </span>
                <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                  Team Optimization Guidance
                </PanelTitle>
              </div>
            </div>
            <Badge variant="outline" size="sm">
              Unavailable
            </Badge>
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-2">
            <p>
              Deterministic recommendation engine unavailable in this build. Personalized
              team allocations will be available once the calculation engine is deployed.
            </p>
          </PanelContent>
        </Panel>

        {/* Module 3: Divergent Universe Assistant */}
        <Panel variant="default">
          <PanelHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[#dfb86c]" />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                  Decision Engine
                </span>
                <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                  Divergent Universe Assistant
                </PanelTitle>
              </div>
            </div>
            <Badge variant="outline" size="sm">
              Unavailable
            </Badge>
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-2">
            <p>
              Real-time blessing and curio decision assistant unavailable in this build.
              OCR and live game decision support will be introduced in Phase 7.
            </p>
          </PanelContent>
        </Panel>

        {/* Module 4: Multi-Source Meta Consensus */}
        <Panel variant="default">
          <PanelHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#dfb86c]" />
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                  Multi-Source Verification
                </span>
                <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                  Meta Consensus Matrix
                </PanelTitle>
              </div>
            </div>
            <Badge variant="outline" size="sm">
              Unavailable
            </Badge>
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-2">
            <p>
              Multi-source consensus scoring unavailable in this build. Comparative build
              consensus across community sources will unlock in Phase 5.
            </p>
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}
