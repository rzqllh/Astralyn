// apps/web/tests/phase6-views.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CharactersView } from "../src/routes/characters-view";
import { CharacterDetailView } from "../src/routes/character-detail-view";
import { BestCharactersView } from "../src/routes/best-characters-view";
import { SavedTeamsView } from "../src/routes/saved-teams-view";
import * as authModule from "../src/features/auth";
import * as rosterModule from "../src/features/roster/use-roster";
import * as teamsModule from "../src/features/teams";
import * as knowledgeHooks from "../src/lib/knowledge/use-knowledge";
import * as recHooks from "../src/features/recommendations/use-team-recommendations";
import { CANONICAL_CHARACTERS, CANONICAL_LIGHT_CONES, CANONICAL_RELICS } from "@astralyn/shared";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => {
    let resolvedHref = to;
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, val);
      }
    }
    return (
      <a href={resolvedHref} className={className}>
        {children}
      </a>
    );
  },
  useParams: vi.fn(() => ({ characterId: "acheron" })),
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

function mockRoster() {
  return {
    roster: [
      { characterId: "acheron", level: 80, eidolon: 2, isOwned: true, updatedAt: new Date().toISOString() },
      { characterId: "aventurine", level: 80, eidolon: 0, isOwned: true, updatedAt: new Date().toISOString() },
      { characterId: "firefly", level: 80, eidolon: 0, isOwned: true, updatedAt: new Date().toISOString() },
      { characterId: "gallagher", level: 80, eidolon: 6, isOwned: true, updatedAt: new Date().toISOString() },
    ],
    loading: false,
    error: null,
    refreshRoster: vi.fn(),
    upsertCharacter: vi.fn(),
    removeCharacter: vi.fn(),
  } as unknown as ReturnType<typeof rosterModule.useRoster>;
}

describe("Phase 6: Web UI Surfaces Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("authenticated"));
    vi.spyOn(rosterModule, "useRoster").mockReturnValue(mockRoster());

    vi.spyOn(knowledgeHooks, "useCharacters").mockReturnValue({
      characters: CANONICAL_CHARACTERS,
      loading: false,
      error: null,
    });

    vi.spyOn(knowledgeHooks, "useLightCones").mockReturnValue({
      lightCones: CANONICAL_LIGHT_CONES,
      loading: false,
      error: null,
    });

    vi.spyOn(knowledgeHooks, "useRelicSets").mockReturnValue({
      relicSets: CANONICAL_RELICS,
      loading: false,
      error: null,
    });

    vi.spyOn(knowledgeHooks, "useCharacter").mockImplementation((id?: string | null) => {
      const char = CANONICAL_CHARACTERS.find((c) => c.id === id) || CANONICAL_CHARACTERS[0];
      return {
        character: char,
        loading: false,
        error: null,
      };
    });

    vi.spyOn(knowledgeHooks, "useKnowledgeInit").mockReturnValue({
      syncResult: {
        status: "updated",
        gameVersion: "4.5",
        activeKnowledgeVersion: "1.0.0",
        cachedAt: new Date().toISOString(),
        isOffline: false
      },
      loading: false,
      error: null,
    });

    vi.spyOn(teamsModule, "useSavedTeams").mockReturnValue({
      teams: [],
      loading: false,
      error: null,
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      refresh: vi.fn(),
    });

    vi.spyOn(recHooks, "useTeamRecommendations").mockReturnValue({
      teams: [
        {
          rank: 1,
          archetype: "Acheron Nihility Hypercarry",
          signature: "acheron;aventurine;gallagher;firefly",
          score: 88,
          roleScore: 35,
          synergyScore: 35,
          elementScore: 18,
          slots: [
            { slot: 1, characterId: "acheron", role: "hypercarry_dps", level: 80, eidolon: 2 },
            { slot: 2, characterId: "aventurine", role: "shielder", level: 80, eidolon: 0 },
            { slot: 3, characterId: "gallagher", role: "healer", level: 80, eidolon: 6 },
            { slot: 4, characterId: "firefly", role: "break_dps", level: 80, eidolon: 0 },
          ],
          reasons: [
            {
              code: "ROLE_SUSTAIN_SECURED",
              category: "role",
              type: "positive",
              scoreDelta: 50,
              message: "Team contains both Sustain and Damage Dealer",
            },
          ],
        },
      ],
      loading: false,
      error: null,
      status: "success",
      refresh: vi.fn().mockResolvedValue(undefined),
    });
  });

  describe("Surface 1: Character Catalog (/characters)", () => {
    it("renders all canonical characters with live roster ownership badges", () => {
      render(<CharactersView />);

      expect(screen.getByText("Characters Database")).toBeInTheDocument();
      // Should show Acheron (owned), The Herta, and Aventurine • Waveflair with exact canonical links
      expect(screen.getByText("Acheron")).toBeInTheDocument();
      expect(screen.getByText("The Herta")).toBeInTheDocument();
      expect(screen.getByText("Aventurine • Waveflair")).toBeInTheDocument();

      const hertaLink = screen.getByText("The Herta").closest("a");
      expect(hertaLink).toHaveAttribute("href", "/characters/the-herta");
      const wfLink = screen.getByText("Aventurine • Waveflair").closest("a");
      expect(wfLink).toHaveAttribute("href", "/characters/aventurine-waveflair");

      // Check owned badge for Acheron
      expect(screen.getByText("Owned Lv.80 E2")).toBeInTheDocument();
    }, 15000);

    it("filters characters by search input", () => {
      render(<CharactersView />);

      const searchInput = screen.getByPlaceholderText(/Search by character name/i);
      fireEvent.change(searchInput, { target: { value: "Firefly" } });

      expect(screen.getByText("Firefly")).toBeInTheDocument();
      expect(screen.queryByText("Acheron")).not.toBeInTheDocument();
    });

    it("filters characters by Combat Path", () => {
      render(<CharactersView />);

      const nihilityPill = screen.getByRole("button", { name: /Nihility/i });
      fireEvent.click(nihilityPill);

      expect(screen.getByText("Acheron")).toBeInTheDocument();
      expect(screen.queryByText("Firefly")).not.toBeInTheDocument();
    });
  });

  describe("Surface 2: Character Detail (/characters/:characterId)", () => {
    it("renders Lv.80 base stats, kit breakdown, and truthful build panels", () => {
      render(<CharacterDetailView />);

      // Character header
      expect(screen.getByRole("heading", { level: 1, name: "Acheron" })).toBeInTheDocument();

      // Lv.80 stats
      expect(screen.getByText(/Base Attributes \(Level 80 Baseline\)/i)).toBeInTheDocument();
      expect(screen.getByText("TAUNT")).toBeInTheDocument();

      // Special resource (Acheron non-energy)
      expect(screen.getByText(/Slashed Dream \/ Crimson Knot/i)).toBeInTheDocument();

      // Path-Compatible Light Cones panel (Strictly Path-compatible, NO BiS label)
      expect(screen.getByText("Path-Compatible Light Cones")).toBeInTheDocument();
      expect(screen.queryByText(/Best-in-Slot/i)).not.toBeInTheDocument();

      // Mechanically Synergistic Relics panel (Associated via mechanic tags)
      expect(screen.getByText("Mechanically Synergistic Relics")).toBeInTheDocument();

      // Kit Synergy Teammates (Non-scoring mechanic synergy, NO point scores)
      expect(screen.getByText("Kit Synergy Teammates")).toBeInTheDocument();
      expect(screen.queryByText(/pts synergy/i)).not.toBeInTheDocument();
      expect(screen.getAllByText("Mechanic Synergy").length).toBeGreaterThan(0);

      // Single honest editorial unavailable notice
      expect(screen.getByText(/Editorial Consensus/i)).toBeInTheDocument();
      expect(screen.getByText(/Phase 8/i)).toBeInTheDocument();

      // Best Team From My Roster recommender integration
      expect(screen.getByText(/Best Team From My Roster/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save to My Teams/i })).toBeInTheDocument();
    });

    it("switches kit breakdown tabs (Abilities, Traces, Eidolons)", () => {
      render(<CharacterDetailView />);

      // Default tab: abilities
      expect(screen.getByText("Trilateral Wiltcross")).toBeInTheDocument();

      // Click Traces tab
      const tracesTab = screen.getByRole("button", { name: /Major Traces/i });
      fireEvent.click(tracesTab);
      expect(screen.getByText("Red Oni")).toBeInTheDocument();
      expect(screen.getByText("A2")).toBeInTheDocument();

      // Click Eidolons tab
      const eidolonsTab = screen.getByRole("button", { name: /Eidolons/i });
      fireEvent.click(eidolonsTab);
      expect(screen.getByText(/E1: Silenced Sky, Clear Sights/i)).toBeInTheDocument();
    });
  });

  describe("Surface 3: Best Characters Role Matrix (/best-characters)", () => {
    it("renders mechanical combat role taxonomy with truthful disclaimer", () => {
      render(<BestCharactersView />);

      expect(screen.getByText("Character Role & Coverage Matrix")).toBeInTheDocument();

      // Transparent disclaimer: no subjective S/S+/A tiers or unverified MoC rankings
      expect(screen.getByText("Mode-Neutral Mechanical Role Evaluation")).toBeInTheDocument();
      expect(screen.queryByText(/Tier S\+/i)).not.toBeInTheDocument();

      // Role taxonomy section headings
      expect(screen.getByRole("heading", { name: "Sustain Specialists" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Primary Carries" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Amplifiers/i })).toBeInTheDocument();

      // Owned roster coverage diagnostic
      expect(screen.getAllByText(/Roster Coverage/i).length).toBe(4);
      expect(screen.getByText(/2 \/ \d+ Owned/i)).toBeInTheDocument();
    });
  });

  describe("Surface 4: Saved Teams Management (/teams)", () => {
    it("renders unauthenticated state when user is not logged in", () => {
      vi.spyOn(authModule, "useAuth").mockReturnValue(mockAuth("unauthenticated"));
      vi.spyOn(teamsModule, "useSavedTeams").mockReturnValue({
        teams: [],
        loading: false,
        error: null,
        createTeam: vi.fn(),
        updateTeam: vi.fn(),
        deleteTeam: vi.fn(),
        refresh: vi.fn(),
      });

      render(<SavedTeamsView />);

      expect(screen.getByText("Authentication Required")).toBeInTheDocument();
      expect(screen.getByText("Sign In with Google")).toBeInTheDocument();
    });

    it("renders saved teams list with exactly 4 member slots per team", () => {
      const mockTeam: teamsModule.SavedTeam = {
        id: "team-1",
        userId: "u1",
        name: "Acheron Premier Carry",
        mode: "moc",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: [
          { slot: 1, characterId: "acheron" },
          { slot: 2, characterId: "aventurine" },
          { slot: 3, characterId: "gallagher" },
          { slot: 4, characterId: "firefly" },
        ],
      };

      vi.spyOn(teamsModule, "useSavedTeams").mockReturnValue({
        teams: [mockTeam],
        loading: false,
        error: null,
        createTeam: vi.fn(),
        updateTeam: vi.fn(),
        deleteTeam: vi.fn(),
        refresh: vi.fn(),
      });

      render(<SavedTeamsView />);

      expect(screen.getByText("Acheron Premier Carry")).toBeInTheDocument();
      expect(screen.getByText("Slot 1")).toBeInTheDocument();
      expect(screen.getByText("Slot 2")).toBeInTheDocument();
      expect(screen.getByText("Slot 3")).toBeInTheDocument();
      expect(screen.getByText("Slot 4")).toBeInTheDocument();
    });

    it("validates exactly 4 unique characters and 1-50 char name on creation", async () => {
      const createTeamMock = vi.fn().mockResolvedValue({
        id: "new-team",
        userId: "u1",
        name: "Test Team",
        mode: "general",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        members: [],
      });

      vi.spyOn(teamsModule, "useSavedTeams").mockReturnValue({
        teams: [],
        loading: false,
        error: null,
        createTeam: createTeamMock,
        updateTeam: vi.fn(),
        deleteTeam: vi.fn(),
        refresh: vi.fn(),
      });

      render(<SavedTeamsView />);

      const createBtn = screen.getByTestId("create-team-button");
      fireEvent.click(createBtn);

      expect(screen.getByText("Create Saved Team")).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText("e.g. Acheron Nihility Hypercarry");
      fireEvent.change(nameInput, { target: { value: "My Super Squad" } });

      // Ensure 4 unique slots
      fireEvent.change(screen.getByTestId("slot-1-select"), { target: { value: "acheron" } });
      fireEvent.change(screen.getByTestId("slot-2-select"), { target: { value: "aventurine" } });
      fireEvent.change(screen.getByTestId("slot-3-select"), { target: { value: "firefly" } });
      fireEvent.change(screen.getByTestId("slot-4-select"), { target: { value: "gallagher" } });

      const submitBtn = screen.getByTestId("submit-team-button");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(createTeamMock).toHaveBeenCalledWith(
          "My Super Squad",
          [
            { slot: 1, characterId: "acheron" },
            { slot: 2, characterId: "aventurine" },
            { slot: 3, characterId: "firefly" },
            { slot: 4, characterId: "gallagher" },
          ],
          "general"
        );
      });
    });
  });
});
