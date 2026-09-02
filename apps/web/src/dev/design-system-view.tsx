import * as React from "react";
import { SectionHeader } from "../components/ui/section-header";
import { Button } from "../components/ui/button";
import { Badge, RarityBadge, ElementBadge } from "../components/ui/badge";
import { Input, Select } from "../components/ui/input";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "../components/ui/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
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
import { CharacterTile } from "./components/hsr/character-tile";
import { RecommendationPanel } from "./components/hsr/recommendation-panel";
import { SourceRankPanel } from "./components/hsr/source-rank-panel";
import { DecisionCard } from "./components/hsr/decision-card";
import { GameAssetImage } from "./components/game-asset-image";
import {
  FIXTURE_CHARACTERS,
  FIXTURE_RECOMMENDATION,
  FIXTURE_SOURCE_COMPARISON,
  FIXTURE_DECISION,
} from "../../tests/fixtures/ui-fixtures";

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
            Phase 1.1 Foundation
          </Badge>
          <span className="text-xs font-mono text-[#9ba5be]">
            HSR Game Asset & Design System
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gold-gradient uppercase mt-1">
          Astralyn Design System & Game Assets
        </h1>
        <p className="text-xs sm:text-sm text-[#9ba5be] mt-1 max-w-3xl">
          Locked semantic design tokens, versioned static game asset pipeline (StarRailRes
          v1.0.0), CharacterTile v2, and components designed toward WCAG 2.2 AA
          accessibility.
        </p>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="assets" className="w-full">
        <TabsList variant="default" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="assets">Game Assets</TabsTrigger>
          <TabsTrigger value="tokens">Tokens & Palette</TabsTrigger>
          <TabsTrigger value="characters">CharacterTile v2</TabsTrigger>
          <TabsTrigger value="buttons">Buttons & Forms</TabsTrigger>
          <TabsTrigger value="panels">Parchment & Panels</TabsTrigger>
          <TabsTrigger value="verdicts">Verdicts & Consensus</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Modals</TabsTrigger>
        </TabsList>

        {/* Tab 1: Game Assets */}
        <TabsContent value="assets" className="space-y-8">
          {/* Elements Gallery */}
          <div>
            <SectionHeader
              title="Combat Element Icons"
              category="Game Assets"
              subtitle="All 7 combat elements loaded from versioned static assets"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
              {[
                "Physical",
                "Fire",
                "Ice",
                "Lightning",
                "Wind",
                "Quantum",
                "Imaginary",
              ].map((elem) => (
                <div
                  key={elem}
                  className="flex flex-col items-center justify-center p-3 rounded-xs border border-[#1f2940] bg-[#101524] gap-2"
                >
                  <div className="h-10 w-10 p-1">
                    <GameAssetImage
                      entityType="element_icon"
                      entityId={elem}
                      alt={elem}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#f0f3fa]">{elem}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Paths Gallery */}
          <div>
            <SectionHeader
              title="Combat Path Icons"
              category="Game Assets"
              subtitle="All 8 combat paths loaded from versioned static assets"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-3">
              {[
                "Destruction",
                "Hunt",
                "Erudition",
                "Harmony",
                "Nihility",
                "Preservation",
                "Abundance",
                "Remembrance",
              ].map((path) => (
                <div
                  key={path}
                  className="flex flex-col items-center justify-center p-3 rounded-xs border border-[#1f2940] bg-[#101524] gap-2"
                >
                  <div className="h-10 w-10 p-1">
                    <GameAssetImage entityType="path_icon" entityId={path} alt={path} />
                  </div>
                  <span className="text-xs font-bold text-[#f0f3fa] truncate max-w-full">
                    {path}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Light Cones & Relics Gallery */}
          <div>
            <SectionHeader
              title="Light Cones, Relics & DU Entities"
              category="Game Assets"
              subtitle="Representative item icons from normalized asset release"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="light_cone_icon"
                    entityId="along-the-passing-shore"
                    alt="Along the Passing Shore"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  Along the Passing Shore
                </span>
              </div>
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="light_cone_icon"
                    entityId="good-night-and-sleep-well"
                    alt="Good Night and Sleep Well"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  Good Night & Sleep Well
                </span>
              </div>
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="relic_set_icon"
                    entityId="pioneer-diver"
                    alt="Pioneer Diver of Dead Waters"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  Pioneer Diver Relic
                </span>
              </div>
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="planar_ornament_icon"
                    entityId="izumo-gensei"
                    alt="Izumo Gensei"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  Izumo Gensei Planar
                </span>
              </div>
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="du_blessing_icon"
                    entityId="perfect-experience-fuli"
                    alt="Blessing of Fuli"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  DU Blessing: Fuli
                </span>
              </div>
              <div className="p-3 rounded-xs border border-[#1f2940] bg-[#101524] flex flex-col items-center gap-2">
                <div className="h-12 w-12">
                  <GameAssetImage
                    entityType="du_curio_icon"
                    entityId="rubert-difference-engine"
                    alt="Curio: Rubert Difference Engine"
                  />
                </div>
                <span className="text-[11px] font-medium text-center text-[#f0f3fa]">
                  DU Curio: Rubert
                </span>
              </div>
            </div>
          </div>

          {/* Broken Asset Fallback Test */}
          <div>
            <SectionHeader
              title="Robust Broken-Asset Fallback Behavior"
              category="Error Resilience"
              subtitle="Verifying that missing or unapproved assets render graceful Astralyn vector fallbacks without broken browser icons"
            />
            <div className="flex items-center gap-4 mt-3 p-4 rounded-xs border border-[#1f2940] bg-[#0c101c]">
              <div className="h-16 w-16">
                <GameAssetImage
                  entityType="character_icon"
                  entityId="non_existent_character_9999"
                  alt="Missing Character Test"
                  fallbackLabel="Unknown Char"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#f0f3fa]">
                  Deliberate Astralyn Fallback Active
                </h4>
                <p className="text-xs text-[#9ba5be] mt-0.5">
                  When an asset ID is missing, unapproved, or fails to fetch, the
                  GameAssetImage component renders the fallback vector silhouette without
                  layout shift or browser alt-text leakage.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Tokens & Palette */}
        <TabsContent value="tokens" className="space-y-8">
          <div>
            <SectionHeader
              title="Surface Tokens"
              category="Color Palette"
              subtitle="Layered depth from cosmic void to warm celestial parchment"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              <div className="p-4 rounded-xs border border-[#1a2338] bg-[#090c13] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.base
                </span>
                <span className="text-[10px] font-mono text-[#9ba5be]">#090C13</span>
              </div>
              <div className="p-4 rounded-xs border border-[#26334f] bg-[#101524] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.raised
                </span>
                <span className="text-[10px] font-mono text-[#9ba5be]">#101524</span>
              </div>
              <div className="p-4 rounded-xs border border-[#303f5e] bg-[#161e32] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f0f3fa]">
                  surface.overlay
                </span>
                <span className="text-[10px] font-mono text-[#9ba5be]">#161E32</span>
              </div>
              <div className="p-4 rounded-xs border border-[#dfb86c]/50 bg-[#1a160d] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f4d38f]">
                  gold.brand
                </span>
                <span className="text-[10px] font-mono text-[#dfb86c]">#DFB86C</span>
              </div>
              <div className="p-4 rounded-xs border border-[#d89f37]/50 bg-[#221808] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold text-[#f3be53]">
                  gold.rarity 5★
                </span>
                <span className="text-[10px] font-mono text-[#d89f37]">#D89F37</span>
              </div>
              <div className="p-4 rounded-xs border border-[#d4ccbd] bg-[#eee8dc] text-[#181d28] flex flex-col justify-between h-24">
                <span className="text-xs font-mono font-bold">surface.parchment</span>
                <span className="text-[10px] font-mono text-[#565f75]">#EEE8DC</span>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              title="Semantic Badges & Rarity Framing"
              category="Game Context"
              subtitle="5-Star Gold and 4-Star Violet framing"
            />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <RarityBadge rarity={5} />
              <RarityBadge rarity={4} />
              <ElementBadge element="Lightning" />
              <ElementBadge element="Quantum" />
              <ElementBadge element="Fire" />
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: CharacterTile v2 */}
        <TabsContent value="characters" className="space-y-8">
          <div>
            <SectionHeader
              title="CharacterTile v2 States & Variants"
              category="Domain Components"
              subtitle="Featuring real character artwork, Path & Element icons, 5★/4★ borders, and full keyboard interaction"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-3">
              <div>
                <span className="text-[10px] font-mono text-[#9ba5be] block mb-1">
                  Default (5★ Acheron)
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
                  Trial Character (Aventurine)
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[4]} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#c4b5fd] block mb-1">
                  4★ Violet (Gallagher)
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[5]} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#9ba5be] block mb-1">
                  Disabled State
                </span>
                <CharacterTile character={FIXTURE_CHARACTERS[7]} disabled={true} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Buttons & Forms */}
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
                label="Character Search"
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
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Parchment & Panels */}
        <TabsContent value="panels" className="space-y-8">
          <div>
            <SectionHeader
              title="Panel Surface Hierarchy & Light Contrast"
              category="Container Primitives"
              subtitle="Layered depth with dark utility containers and warm celestial parchment inspection surfaces"
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
                  <PanelTitle className="text-[#181d28]">
                    Celestial Parchment Panel
                  </PanelTitle>
                </PanelHeader>
                <PanelContent>
                  <p className="text-xs text-[#565f75]">
                    Contrasting warm cream surface (`#EEE8DC`) for detailed tactical
                    inspection and item dossiers with accessible `#181D28` text contrast.
                  </p>
                </PanelContent>
              </Panel>
            </div>
          </div>
        </TabsContent>

        {/* Tab 6: Verdicts & Consensus */}
        <TabsContent value="verdicts" className="space-y-8">
          <div>
            <SectionHeader
              title="Verdict & Decision Demonstration"
              category="Domain Architecture"
              subtitle="Recommendation Verdict and Fast Decision Card with honest demo disclosures"
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-3">
              <div className="lg:col-span-7">
                <RecommendationPanel recommendation={FIXTURE_RECOMMENDATION} />
              </div>
              <div className="lg:col-span-5">
                <DecisionCard decision={FIXTURE_DECISION} />
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              title="Multi-Source Consensus Matrix"
              category="Source Comparison"
              subtitle="Comparing Prydwen, Game8, and Theorycraft calculations (Sample Layout)"
            />
            <SourceRankPanel sourceData={FIXTURE_SOURCE_COMPARISON} className="mt-3" />
          </div>
        </TabsContent>

        {/* Tab 7: Feedback & Modals */}
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
                    All roster statistics remain strictly on your local device.
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
              title="No Saved Teams"
              description="Construct your first team from the Character Roster to evaluate synergy."
              action={
                <Button variant="secondary" size="sm">
                  Create Team
                </Button>
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
