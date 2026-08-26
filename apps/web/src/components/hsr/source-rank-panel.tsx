import { Calendar, Info, Layers } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../ui/panel";
import type { SourceComparisonFixture } from "../../lib/fixtures";

export interface SourceRankPanelProps {
  sourceData: SourceComparisonFixture;
  className?: string;
}

export function SourceRankPanel({ sourceData, className }: SourceRankPanelProps) {
  return (
    <Panel variant="default" className={cn("overflow-hidden", className)}>
      <PanelHeader className="bg-[#101524]">
        <div className="flex items-center gap-2.5">
          <Layers className="h-4 w-4 text-[#dfb86c]" />
          <div>
            <PanelTitle className="text-sm font-bold text-[#f0f3fa]">
              3-Source Consensus Matrix
            </PanelTitle>
            <p className="text-[11px] text-[#9ba5be] font-mono">
              Target: {sourceData.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="gold" size="sm">
            {sourceData.patch}
          </Badge>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#626e89]">
            <Calendar className="h-3 w-3" />
            {sourceData.lastUpdated}
          </span>
        </div>
      </PanelHeader>

      <PanelContent className="space-y-4 p-4 sm:p-5">
        {/* Source Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {sourceData.sources.map((source, index) => (
            <div
              key={index}
              className="flex flex-col justify-between p-3.5 rounded-xs border border-[#1f2940] bg-[#0a0e19] hover:border-[#2f3e60] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#1a2338] pb-2 mb-2.5">
                  <h4 className="text-xs font-bold text-[#f0f3fa] truncate">
                    {source.sourceName}
                  </h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-[#161f36] text-[#9ba5be]">
                    {source.sourceType}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-xs bg-[#171b12] border border-[#dfb86c]/30">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-[#dfb86c] uppercase">
                        Top 1
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#dfb86c]" />
                    </div>
                    <p className="text-xs font-bold text-[#f4d38f] mt-0.5 truncate">
                      {source.topPick}
                    </p>
                  </div>

                  <div className="p-2 rounded-xs bg-[#0f1424] border border-[#1f2940]">
                    <span className="text-[9px] font-mono font-bold text-[#9ba5be] uppercase">
                      Top 2
                    </span>
                    <p className="text-xs text-[#f0f3fa] mt-0.5 truncate">
                      {source.secondPick}
                    </p>
                  </div>

                  <div className="p-2 rounded-xs bg-[#0f1424] border border-[#1f2940]">
                    <span className="text-[9px] font-mono font-bold text-[#626e89] uppercase">
                      Top 3
                    </span>
                    <p className="text-xs text-[#9ba5be] mt-0.5 truncate">
                      {source.thirdPick}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#161e32]">
                <p className="text-[10px] text-[#626e89] italic leading-tight">
                  "{source.confidenceNote}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Source Policy Disclaimer */}
        <div className="flex items-start gap-2 p-2.5 rounded-xs bg-[#131929] border border-[#232f48] text-[11px] text-[#9ba5be]">
          <Info className="h-3.5 w-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#f0f3fa] font-semibold">Source Transparency:</strong>{" "}
            Rankings reflect aggregated data from reviewed third-party guides and math
            calculations. Astralyn does not present community guides as official game
            mandates.
          </p>
        </div>
      </PanelContent>
    </Panel>
  );
}
