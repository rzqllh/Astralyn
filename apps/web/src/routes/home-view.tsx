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
import { useAuth } from "../features/auth";
import { useRoster } from "../features/roster";

export function HomeView() {
  const { syncResult, loading, error } = useKnowledgeInit();
  const { user, status, needsOnboarding, signIn } = useAuth();
  const { roster, loading: rosterLoading } = useRoster();

  return (
    <div className="space-y-8" data-testid="home-view">
      {/* Onboarding Callout Banner for Authenticated Unonboarded Users */}
      {status === "authenticated" && needsOnboarding && (
        <div
          data-testid="onboarding-banner"
          className="p-4 sm:p-5 rounded-xs border border-[#dfb86c] bg-[#16140b] shadow-[0_0_15px_rgba(223,184,108,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xs bg-[#dfb86c]/20 border border-[#dfb86c]/50 flex items-center justify-center text-[#dfb86c] shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f3fa]">
                Welcome aboard, {user?.name || "Trailblazer"}! Setup your character roster
              </h3>
              <p className="text-xs text-[#9ba5be] mt-0.5">
                Complete onboarding by selecting your unlocked characters to enable personalized recommendations.
              </p>
            </div>
          </div>
          <Link to="/onboarding" className="shrink-0">
            <Button variant="primary" size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
              Start Onboarding
            </Button>
          </Link>
        </div>
      )}
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
        <Panel variant="default" className="border-[#1a2338] bg-[#0c101a] hover:border-[#25324e] transition-colors">
          <PanelHeader>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-xs bg-[#dfb86c]/10 border border-[#dfb86c]/30 flex items-center justify-center text-[#dfb86c]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
                  Roster Management
                </span>
                <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
                  Character Roster
                </PanelTitle>
              </div>
            </div>
            {status === "authenticated" ? (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            ) : status === "loading" ? (
              <Badge variant="outline" size="sm">
                Checking...
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                Sign In Required
              </Badge>
            )}
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-3">
            {status === "loading" || rosterLoading ? (
              <p>Verifying authentication and roster state...</p>
            ) : status === "authenticated" ? (
              needsOnboarding ? (
                <div className="space-y-2">
                  <p className="text-[#f0f3fa]">
                    Account connected. Complete setup to synchronize your unlocked characters with Astralyn.
                  </p>
                  <Link to="/onboarding">
                    <Button variant="primary" size="sm" className="mt-1 flex items-center gap-1.5 text-xs">
                      <span>Complete Onboarding</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[#f0f3fa]">
                    Local persistence active. You have{" "}
                    <span className="font-mono font-bold text-[#dfb86c]">
                      {roster.length}
                    </span>{" "}
                    owned {roster.length === 1 ? "character" : "characters"} configured with custom levels and Eidolons.
                  </p>
                  <Link to="/roster">
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-[#dfb86c] hover:text-[#f4d38f]">
                      <span>Manage Roster</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="space-y-2.5">
                <p>
                  Local D1 persistence ready. Sign in with Google to synchronize your character roster, customize levels (1–80), and configure Eidolons (E0–E6).
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void signIn()}
                  className="flex items-center gap-1.5 text-xs text-[#dfb86c]"
                >
                  <span>Sign in with Google</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
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
            <Badge variant="outline" size="sm" className="border-[#dfb86c]/40 text-[#dfb86c]">
              Active (D-028)
            </Badge>
          </PanelHeader>
          <PanelContent className="p-4 text-xs text-[#9ba5be] space-y-2.5">
            {status === "authenticated" ? (
              roster.length >= 4 ? (
                <div className="space-y-2">
                  <p className="text-[#f0f3fa]">
                    Deterministic recommendation engine ready. Evaluates your{" "}
                    <span className="font-mono font-bold text-[#dfb86c]">{roster.length}</span>{" "}
                    characters against verified role completeness and canonical synergies.
                  </p>
                  <Link to="/recommendations">
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-[#dfb86c] hover:text-[#f4d38f]">
                      <span>View Recommendations</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[#f0f3fa]">
                    At least 4 owned characters required for team recommendations. You currently have{" "}
                    <span className="font-mono font-bold text-[#dfb86c]">{roster.length}</span>.
                  </p>
                  <Link to="/roster">
                    <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-[#dfb86c]">
                      <span>Add to Roster</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="space-y-2">
                <p>
                  Deterministic recommendation engine active. Evaluates 4-character combinations using pure fixed-point integer scoring and verified canonical synergies.
                </p>
                <Link to="/recommendations">
                  <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-[#dfb86c]">
                    <span>Explore Engine</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
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
