import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecommendationsView } from "../src/routes/recommendations-view";
import * as authModule from "../src/features/auth";
import * as rosterModule from "../src/features/roster/use-roster";
import type { RosterCharacter } from "../src/features/roster/types";
import * as recHooks from "../src/features/recommendations/use-team-recommendations";
import * as knowledgeHooks from "../src/lib/knowledge/use-knowledge";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

function mockAuth(status: "authenticated" | "unauthenticated") {
  return {
    status,
    user:
      status === "authenticated"
        ? {
            id: "u1",
            name: "Trailblazer",
            email: "t@hsr.dev",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    session: null,
    profile: null,
    needsOnboarding: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
  } as unknown as ReturnType<typeof authModule.useAuth>;
}

function mockRoster(roster: RosterCharacter[] = []) {
  return {
    roster,
    loading: false,
    error: null,
    refreshRoster: vi.fn(),
    upsertCharacter: vi.fn(),
    removeCharacter: vi.fn(),
  } as unknown as ReturnType<typeof rosterModule.useRoster>;
}

describe("Phase 5: Recommendations Web UI Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(knowledgeHooks, "useCharacters").mockReturnValue({
      characters: [
        { id: "firefly", name: "Firefly", rarity: 5, path: "Destruction", element: "Fire", maxLevel: 80, tags: [] },
        { id: "gallagher", name: "Gallagher", rarity: 4, path: "Abundance", element: "Fire", maxLevel: 80, tags: [] },
        { id: "robin", name: "Robin", rarity: 5, path: "Harmony", element: "Physical", maxLevel: 80, tags: [] },
        { id: "tingyun", name: "Tingyun", rarity: 4, path: "Harmony", element: "Lightning", maxLevel: 80, tags: [] },
      ] as unknown as ReturnType<typeof knowledgeHooks.useCharacters>["characters"],
      loading: false,
      error: null,
    });
  });

  it("renders sign-in prompt when unauthenticated", () => {
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("unauthenticated"));
    vi.spyOn(rosterModule, "useRoster").mockReturnValue(mockRoster([]));

    vi.spyOn(recHooks, "useTeamRecommendations").mockReturnValue({
      teams: [],
      loading: false,
      error: null,
      status: "idle",
      refresh: vi.fn(),
    });

    render(<RecommendationsView />);
    expect(screen.getByText(/Sign In to Calculate Recommendations/i)).toBeInTheDocument();
  });

  it("renders Insufficient Roster state when status is insufficient_roster", () => {
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("authenticated"));
    vi.spyOn(rosterModule, "useRoster").mockReturnValue(
      mockRoster([
        { characterId: "firefly", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
        { characterId: "gallagher", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
      ])
    );

    vi.spyOn(recHooks, "useTeamRecommendations").mockReturnValue({
      teams: [],
      loading: false,
      error: null,
      status: "insufficient_roster",
      message: "Roster has fewer than 4 valid canonical owned characters (2 available).",
      refresh: vi.fn(),
    });

    render(<RecommendationsView />);
    expect(screen.getByText(/Insufficient Roster/i)).toBeInTheDocument();
    expect(screen.getByText(/fewer than 4/i)).toBeInTheDocument();
  });

  it("renders missing knowledge warning banner when missingKnowledgeCharacterIds is present", () => {
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("authenticated"));
    vi.spyOn(rosterModule, "useRoster").mockReturnValue(mockRoster([]));

    vi.spyOn(recHooks, "useTeamRecommendations").mockReturnValue({
      teams: [],
      loading: false,
      error: null,
      status: "success",
      missingKnowledgeCharacterIds: ["unknown-hsr-char"],
      refresh: vi.fn(),
    });

    render(<RecommendationsView />);
    expect(screen.getByText(/Unrecognized Roster Entries Excluded/i)).toBeInTheDocument();
    expect(screen.getByText(/unknown-hsr-char/i)).toBeInTheDocument();
  });

  it("renders recommended team cards with rank, archetype, slots, and reasons", () => {
    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("authenticated"));
    vi.spyOn(rosterModule, "useRoster").mockReturnValue(
      mockRoster([
        { characterId: "firefly", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
        { characterId: "gallagher", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
        { characterId: "robin", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
        { characterId: "tingyun", level: 80, eidolon: 0, isOwned: true, createdAt: "", updatedAt: "" },
      ])
    );

    vi.spyOn(recHooks, "useTeamRecommendations").mockReturnValue({
      teams: [
        {
          rank: 1,
          score: 95,
          roleScore: 100,
          synergyScore: 90,
          elementScore: 0,
          signature: "firefly:gallagher:robin:tingyun",
          archetype: "Super Break Destruction Hypercarry",
          slots: [
            { slot: 1, characterId: "firefly", role: "break_dps", level: 80, eidolon: 0 },
            { slot: 2, characterId: "gallagher", role: "healer", level: 80, eidolon: 0 },
            { slot: 3, characterId: "robin", role: "buffer", level: 80, eidolon: 0 },
            { slot: 4, characterId: "tingyun", role: "battery", level: 80, eidolon: 0 },
          ],
          reasons: [
            {
              code: "ROLE_SUSTAIN_SECURED",
              category: "role",
              type: "positive",
              scoreDelta: 50,
              message: "Gallagher provides team survivability.",
            },
            {
              code: "SYNERGY_SUPER_BREAK_CORE",
              category: "synergy",
              type: "positive",
              scoreDelta: 25,
              message: "Break carry pairs with Break-scaling teammate.",
            },
          ],
        },
      ],
      loading: false,
      error: null,
      status: "success",
      refresh: vi.fn(),
    });

    render(<RecommendationsView />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Super Break Destruction Hypercarry")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText(/ROLE SUSTAIN SECURED/i)).toBeInTheDocument();
    expect(screen.getByText(/SYNERGY SUPER BREAK CORE/i)).toBeInTheDocument();
    expect(screen.getByText(/Gallagher provides team survivability/i)).toBeInTheDocument();
  });
});
