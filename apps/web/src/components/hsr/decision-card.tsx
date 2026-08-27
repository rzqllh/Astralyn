import { Zap, Check, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelContent, PanelFooter } from "../ui/panel";
import type { DecisionFixture } from "../../lib/fixtures";

export interface DecisionCardProps {
  decision: DecisionFixture;
  onConfirm?: () => void;
  className?: string;
}

export function DecisionCard({ decision, onConfirm, className }: DecisionCardProps) {
  return (
    <Panel
      variant="highlight"
      className={cn("overflow-hidden border-[#dfb86c]/60", className)}
    >
      <PanelHeader className="bg-gradient-to-r from-[#211a0c] via-[#161d30] to-[#0f1422] border-[#dfb86c]/40">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-[#dfb86c] text-[#10141e]">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#dfb86c] uppercase">
              {decision.encounterType}
            </span>
            <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
              Fast Decision Assistant
            </PanelTitle>
          </div>
        </div>

        <Badge variant="gold" size="sm">
          Demo Output
        </Badge>
      </PanelHeader>

      <PanelContent className="space-y-4 p-5">
        {/* Core Decision Callout */}
        <div className="rounded-sm border border-[#dfb86c] bg-gradient-to-r from-[#2a210d] via-[#1a2136] to-[#101524] p-4 shadow-md">
          <span className="text-[11px] font-mono font-bold text-[#dfb86c] uppercase">
            Top Recommendation
          </span>
          <h3 className="text-lg md:text-xl font-bold text-[#f4d38f] tracking-tight mt-0.5">
            {decision.recommendedPick}
          </h3>
          <p className="text-xs text-[#9ba5be] mt-0.5">{decision.recommendedType}</p>
        </div>

        {/* Why Pick X */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#34d399] font-mono flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Tactical Rationale
          </h4>
          <ul className="space-y-1.5">
            {decision.whyPick.map((reason, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-[#f0f3fa] bg-[#0b101c] p-2.5 rounded-xs border border-[#1b263e] leading-relaxed"
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Why Not Alternatives */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#9ba5be] font-mono flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-[#f87171]" />
            Alternative Option Trade-offs
          </h4>
          <div className="space-y-1.5">
            {decision.whyNotOthers.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-xs sm:text-sm bg-[#0b0e17] p-2.5 rounded-xs border border-[#161f33]"
              >
                <strong className="text-[#f87171] font-medium truncate max-w-xs">
                  {item.name}
                </strong>
                <span className="text-xs text-[#9ba5be] sm:text-right">
                  {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PanelContent>

      <PanelFooter className="flex justify-between items-center bg-[#0a0d16] border-[#1a2338]">
        <span className="text-xs text-[#9ba5be]">Illustrative Assistant Demo</span>
        <Button
          variant="primary"
          size="sm"
          onClick={onConfirm}
          iconRight={<ArrowRight className="h-3.5 w-3.5" />}
        >
          Confirm Choice
        </Button>
      </PanelFooter>
    </Panel>
  );
}
