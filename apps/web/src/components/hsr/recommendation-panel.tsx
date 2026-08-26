import { Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { ConfidenceBadge } from "../ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../ui/panel";
import type { RecommendationFixture } from "../../lib/fixtures";

export interface RecommendationPanelProps {
  recommendation: RecommendationFixture;
  className?: string;
}

export function RecommendationPanel({
  recommendation,
  className,
}: RecommendationPanelProps) {
  return (
    <Panel
      variant="highlight"
      className={cn("overflow-hidden border-[#dfb86c]/50", className)}
    >
      {/* Astralyn Verdict Top Header */}
      <PanelHeader className="bg-gradient-to-r from-[#1b2238] via-[#141b2c] to-[#0f1422] border-[#dfb86c]/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-[#dfb86c]/20 border border-[#dfb86c]/50 text-[#dfb86c]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
              Astralyn Verdict
            </span>
            <PanelTitle className="text-sm md:text-base font-extrabold text-[#f0f3fa]">
              {recommendation.verdictTitle}
            </PanelTitle>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConfidenceBadge level={recommendation.confidence} />
        </div>
      </PanelHeader>

      <PanelContent className="space-y-5 p-5">
        {/* #1 Top Pick Highlight Banner */}
        <div className="relative rounded-sm border border-[#dfb86c]/50 bg-gradient-to-r from-[#211a0c] via-[#171c2d] to-[#0f1422] p-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#dfb86c] text-[#10141e] uppercase">
                  #1 Best Fit
                </span>
                <span className="text-xs font-mono text-[#9ba5be] uppercase">
                  {recommendation.recommendedCategory}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#f4d38f] mt-1">
                {recommendation.recommendedItem}
              </h3>
            </div>

            {/* Match Score Gauge */}
            <div className="flex items-baseline gap-1 bg-black/40 px-3.5 py-2 rounded-xs border border-[#dfb86c]/30 self-start sm:self-auto">
              <span className="text-2xl font-black font-mono tabular-nums text-[#dfb86c]">
                {recommendation.matchScore}%
              </span>
              <span className="text-[10px] font-mono uppercase text-[#9ba5be]">
                Match
              </span>
            </div>
          </div>
        </div>

        {/* Key Rationale Checklist */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ba5be] font-mono">
            Key Tactical Rationale
          </h4>
          <ul className="space-y-2">
            {recommendation.rationale.map((reason, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5 text-xs text-[#f0f3fa] leading-relaxed bg-[#0b0f1a] p-2.5 rounded-xs border border-[#1a2338]"
              >
                <CheckCircle2 className="h-4 w-4 text-[#dfb86c] shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alternative Ranked Picks */}
        {recommendation.alternatives.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#1f2940]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ba5be] font-mono">
              Alternative Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recommendation.alternatives.map((alt) => (
                <div
                  key={alt.rank}
                  className="flex flex-col justify-between p-3 rounded-xs border border-[#1f2940] bg-[#0c101c] hover:border-[#303f5e] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#9ba5be]">
                      #{alt.rank} Alternative
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#dfb86c] tabular-nums">
                      {alt.score}%
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-[#f0f3fa] mt-1 truncate">
                    {alt.name}
                  </h5>
                  <p className="text-[11px] text-[#626e89] mt-1 line-clamp-2">
                    {alt.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}
