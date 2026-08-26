import * as React from "react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";
import { Badge, RarityBadge, ElementBadge } from "../components/ui/badge";
import { Input, Select } from "../components/ui/input";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../components/ui/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Divider } from "../components/ui/divider";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";
import { useToast } from "../components/ui/toast";
import { CharacterTile } from "../components/hsr/character-tile";
import { RecommendationPanel } from "../components/hsr/recommendation-panel";
import { SourceRankPanel } from "../components/hsr/source-rank-panel";
import { DecisionCard } from "../components/hsr/decision-card";
import {
  FIXTURE_CHARACTERS,
  FIXTURE_RECOMMENDATION,
  FIXTURE_SOURCE_COMPARISON,
  FIXTURE_DECISION,
} from "../lib/fixtures";

export function DesignSystemView() {
  const { addToast } = useToast();
  const [selectedDemoChar, setSelectedDemoChar] = React.useState<string>("acheron");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="space-y-8" data-testid="design-system-view">
      {/* Design System Header */}
      <div className="border-b border-[#1a2338] pb-6">
        <div className="flex items-center gap-2">
          <Badge variant="gold" size="sm">
            Phase 1 Foundation
          </Badge>
          <span className="text-xs font-mono text-[#9ba5be]">
            HSR-Native Design System
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gold-gradient uppercase mt-1">
          Astralyn Design System Showcase
        </h1>
        <p className="text-xs sm:text-sm text-[#9ba5be] mt-1 max-w-3xl">
          Locked semantic design tokens, reusable UI primitives, and HSR tactical
          components engineered for scanability, hierarchy, and WCAG 2.2 AA accessibility.
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList variant="default" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="tokens">Tokens & Palette</TabsTrigger>
          <TabsTrigger value="buttons">Buttons & Forms</TabsTrigger>
          <TabsTrigger value="panels">Panels & Surfaces</TabsTrigger>
          <TabsTrigger value="characters">Character Tiles</TabsTrigger>
          <TabsTrigger value="verdicts">Verdicts & Decisions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Modals</TabsTrigger>
        </TabsList>

        {/* Tab 1: Tokens & Palette */}
        <TabsContent value="tokens" className="space-y-8">
          {/* Surface Tokens */}
          <div>
            <SectionHeader
              title="Surface & Background Tokens"
              category="Color System"
              subtitle="Layered depth palette from cosmic void to contrasting parchment"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              <div className="p-4 rounded-xs border border-[#1a2338] bg-[#090c13] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.base
                </span>
                <span className="text-[10px] font-mono text-[#626e89]">#090C13</span>
              </div>
              <div className="p-4 rounded-xs border border-[#26334f] bg-[#101524] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.raised
                </span>
                <span className="text-[10px] font-mono text-[#626e89]">#101524</span>
              </div>
              <div className="p-4 rounded-xs border border-[#303f5e] bg-[#161e32] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.overlay
                </span>
                <span className="text-[10px] font-mono text-[#626e89]">#161E32</span>
              </div>
              <div className="p-4 rounded-xs border border-[#131926] bg-[#05070a] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.sunken
                </span>
                <span className="text-[10px] font-mono text-[#626e89]">#05070A</span>
              </div>
              <div className="p-4 rounded-xs border border-[#dfb86c]/50 bg-[#1a160d] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f4d38f]">
                  gold.highlight
                </span>
                <span className="text-[10px] font-mono text-[#dfb86c]">#DFB86C</span>
              </div>
              <div className="p-4 rounded-xs border border-[#d4ccbd] bg-[#eee8dc] text-[#181d28] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold">surface.parchment</span>
                <span className="text-[10px] font-mono text-[#565f75]">#EEE8DC</span>
              </div>
            </div>
          </div>

          {/* Combat Elements Tokens */}
          <div>
            <SectionHeader
              title="Combat Element Tokens"
              category="Game Context"
              subtitle="Element identifiers calibrated for high contrast against dark surfaces"
            />
            <div className="flex flex-wrap gap-2.5 mt-3">
              <ElementBadge element="Physical" />
              <ElementBadge element="Fire" />
              <ElementBadge element="Ice" />
              <ElementBadge element="Lightning" />
              <ElementBadge element="Wind" />
              <ElementBadge element="Quantum" />
              <ElementBadge element="Imaginary" />
            </div>
          </div>

          {/* Rarity Tokens */}
          <div>
            <SectionHeader
              title="Rarity Tokens"
              category="Game Context"
              subtitle="5-Star Gold and 4-Star Violet framing"
            />
            <div className="flex items-center gap-3 mt-3">
              <RarityBadge rarity={5} />
              <RarityBadge rarity={4} />
            </div>
          </div>

          {/* Typography Scale */}
          <div>
            <SectionHeader
              title="Typography Hierarchy"
              category="Typography"
              subtitle="Display, headings, and tabular numerals"
            />
            <div className="space-y-4 mt-3 p-5 rounded-xs border border-[#1a2338] bg-[#0c101c]">
              <div>
                <span className="text-[10px] font-mono text-[#626e89] uppercase">
                  Display Header (32px Bold)
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gold-gradient uppercase tracking-tight">
                  Astral Express Navigation HUD
                </h1>
              </div>
              <Divider withDiamond={false} />
              <div>
                <span className="text-[10px] font-mono text-[#626e89] uppercase">
                  Section Title (20px Bold)
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#f0f3fa] tracking-tight">
                  Tactical Character Optimization Parameters
                </h2>
              </div>
              <Divider withDiamond={false} />
              <div>
                <span className="text-[10px] font-mono text-[#626e89] uppercase">
                  Body & Tabular Numerals (14px Regular)
                </span>
                <p className="text-sm text-[#9ba5be] leading-relaxed">
                  Ultimate Damage Multiplier:{" "}
                  <span className="font-mono tabular-nums text-[#dfb86c] font-bold">
                    1,420,500
                  </span>{" "}
                  DPA across{" "}
                  <span className="font-mono tabular-nums text-[#dfb86c] font-bold">
                    3.5
                  </span>{" "}
                  turns.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Buttons & Forms */}
        <TabsContent value="buttons" className="space-y-8">
          <div>
            <SectionHeader
              title="Button Variants & States"
              category="Interactive Primitives"
              subtitle="HSR-styled action buttons with metallic gold, cosmic navy, and parchment variants"
            />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Button
                variant="primary"
                onClick={() =>
                  addToast({ title: "Primary Action Triggered", variant: "success" })
                }
              >
                Primary Gold
              </Button>
              <Button
                variant="secondary"
                onClick={() => addToast({ title: "Secondary Action", variant: "info" })}
              >
                Secondary Navy
              </Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="parchment">Parchment</Button>
              <Button variant="primary" loading>
                Loading
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </div>
          </div>

          <div>
            <SectionHeader
              title="Form Controls"
              category="Input Primitives"
              subtitle="Accessible form inputs with labels, helper text, and validation states"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 max-w-3xl">
              <Input
                label="Character Filter"
                placeholder="Search by name (e.g. Acheron)..."
                helperText="Fuzzy search matching all registered roster entities"
              />
              <Select label="Filter by Combat Path">
                <option value="all">All Paths (8 Total)</option>
                <option value="nihility">Nihility</option>
                <option value="destruction">Destruction</option>
                <option value="harmony">Harmony</option>
                <option value="remembrance">Remembrance</option>
              </Select>
              <Input
                label="Invalid Parameter Input"
                defaultValue="Invalid Eidolon Level"
                error="Eidolon must be an integer between 0 and 6."
              />
              <Input
                label="Disabled Control"
                defaultValue="Locked Parameter"
                disabled
                helperText="This input is disabled during active battle simulation"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Panels & Surfaces */}
        <TabsContent value="panels" className="space-y-8">
          <div>
            <SectionHeader
              title="Panel Surface Hierarchy"
              category="Container Primitives"
              subtitle="Distinct container tiers creating unmistakable spatial depth"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <Panel variant="default">
                <PanelHeader>
                  <PanelTitle>Default Utility Panel</PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <p className="text-xs text-[#9ba5be]">
                    Standard dark container surface with subtle 1px border.
                  </p>
                </PanelContent>
              </Panel>

              <Panel variant="highlight">
                <PanelHeader>
                  <PanelTitle className="text-[#f4d38f]">
                    Highlight Verdict Panel
                  </PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <p className="text-xs text-[#f0f3fa]">
                    Astral gold border with illuminated corner notch tag for priority
                    recommendations.
                  </p>
                </PanelContent>
              </Panel>

              <Panel variant="parchment">
                <PanelHeader>
                  <PanelTitle className="text-[#181d28]">HSR Parchment Panel</PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <p className="text-xs text-[#565f75]">
                    Contrasting warm cream surface for detailed lore or item inspection
                    cards.
                  </p>
                </PanelContent>
              </Panel>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Character Tiles */}
        <TabsContent value="characters" className="space-y-8">
          <div>
            <SectionHeader
              title="Character Tile Visual States"
              category="Domain Components"
              subtitle="Tactical portrait tiles supporting 5★/4★ rarity, elements, and interaction states"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
              <div>
                <span className="text-[10px] font-mono text-[#626e89] block mb-1">
                  Default (5★)
                </span>
                <CharacterTile
                  character={FIXTURE_CHARACTERS[0]}
                  selected={selectedDemoChar === FIXTURE_CHARACTERS[0].id}
                  onClick={() => setSelectedDemoChar(FIXTURE_CHARACTERS[0].id)}
                />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#dfb86c] block mb-1">
                  Selected State
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[1]} selected={true} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#38bdf8] block mb-1">
                  Trial Character
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[4]} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#c4b5fd] block mb-1">
                  4★ Violet Rarity
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[5]} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#626e89] block mb-1">
                  Disabled / Unowned
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[7]} disabled={true} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Verdicts & Decisions */}
        <TabsContent value="verdicts" className="space-y-8">
          <div>
            <SectionHeader
              title="Recommendation Verdict & 3-Source Consensus"
              category="Domain Architecture"
              subtitle="Clear actionable output answering what to build and why"
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-3">
              <div className="lg:col-span-7">
                <RecommendationPanel recommendation={FIXTURE_RECOMMENDATION} />
              </div>
              <div className="lg:col-span-5">
                <DecisionCard
                  decision={FIXTURE_DECISION}
                  onConfirm={() =>
                    addToast({
                      title: "DU Decision Recorded",
                      description: "Applied Perfect Experience: Fuli to active build.",
                      variant: "success",
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              title="Multi-Source Consensus Engine"
              category="Source Comparison"
              subtitle="Comparing Prydwen, Game8, and Theorycraft calculations"
            />
            <SourceRankPanel sourceData={FIXTURE_SOURCE_COMPARISON} className="mt-3" />
          </div>
        </TabsContent>

        {/* Tab 6: Feedback & Modals */}
        <TabsContent value="feedback" className="space-y-8">
          <div>
            <SectionHeader
              title="Overlays & Feedback Primitives"
              category="Accessible Modals"
              subtitle="Dialogs, Tooltips, Toast notifications, Skeletons, and Empty States"
            />

            <div className="flex flex-wrap gap-4 mt-3">
              {/* Dialog Modal */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="primary">Open Accessible Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Roster Synchronization</DialogTitle>
                    <DialogDescription>
                      This action will align your active character database with local
                      IndexedDB storage.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2 text-xs text-[#9ba5be]">
                    No cloud synchronization is required in local free-first mode. All
                    roster statistics remain strictly on your device.
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setDialogOpen(false);
                        addToast({
                          title: "Roster Synchronized",
                          description: "8 characters validated against local database.",
                          variant: "success",
                        });
                      }}
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Tooltip Demo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary">Hover for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Accessible keyboard-focusable tooltip hint</span>
                </TooltipContent>
              </Tooltip>

              {/* Toast Triggers */}
              <Button
                variant="outline"
                onClick={() =>
                  addToast({
                    title: "Tactical Warning",
                    description:
                      "Skill point consumption exceeds generation rate in Turn 2.",
                    variant: "warning",
                  })
                }
              >
                Trigger Warning Toast
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  addToast({
                    title: "OCR Scan Error",
                    description:
                      "Unable to detect blessing title. Please retry screenshot.",
                    variant: "danger",
                  })
                }
              >
                Trigger Danger Toast
              </Button>
            </div>
          </div>

          {/* Skeletons & Empty States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Panel variant="default">
              <PanelHeader>
                <PanelTitle>Loading Skeleton State</PanelTitle>
              </PanelHeader>
              <PanelContent className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </PanelContent>
            </Panel>

            <EmptyState
              title="No Team Compositions Found"
              description="You have not saved any custom teams yet. Select characters from your roster to construct an optimized team."
              action={
                <Button variant="secondary" size="sm">
                  Create First Team
                </Button>
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
