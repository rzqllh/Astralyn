import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/features/auth";
import { CharacterSelector } from "../src/features/onboarding/character-selector";
import { OnboardingWizard } from "../src/features/onboarding/onboarding-wizard";
import { RosterManager } from "../src/features/roster/roster-manager";
import * as knowledgeHooks from "../src/lib/knowledge/use-knowledge";

describe("Phase 4: Auth, Onboarding & User State Web Tests", () => {
  const mockCharacters = [
    {
      id: "archer_acheron",
      name: "Acheron",
      rarity: 5,
      path: "Nihility",
      element: "Lightning",
      maxLevel: 80,
      tags: [],
    },
    {
      id: "firefly",
      name: "Firefly",
      rarity: 5,
      path: "Destruction",
      element: "Fire",
      maxLevel: 80,
      tags: [],
    },
    {
      id: "gallagher",
      name: "Gallagher",
      rarity: 4,
      path: "Abundance",
      element: "Fire",
      maxLevel: 80,
      tags: [],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock useCharacters hook
    vi.spyOn(knowledgeHooks, "useCharacters").mockReturnValue({
      characters: mockCharacters as unknown as ReturnType<typeof knowledgeHooks.useCharacters>["characters"],
      loading: false,
      error: null,
    });
  });

  function ConsumerTestComponent() {
    const { status, user, signIn, signOut } = useAuth();
    return (
      <div>
        <div data-testid="auth-status">{status}</div>
        <div data-testid="user-name">{user?.name || "none"}</div>
        <button onClick={() => void signIn()} data-testid="btn-signin">
          Sign In
        </button>
        <button onClick={() => void signOut()} data-testid="btn-signout">
          Sign Out
        </button>
      </div>
    );
  }

  it("AuthProvider starts in loading and transitions to unauthenticated when no session exists", async () => {
    // Mock get-session returning null
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/auth/get-session")) {
        return new Response(JSON.stringify(null), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not found", { status: 404 });
    });

    render(
      <AuthProvider>
        <ConsumerTestComponent />
      </AuthProvider>
    );

    // Initial state is loading
    expect(screen.getByTestId("auth-status").textContent).toBe("loading");

    // Resolves to unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId("auth-status").textContent).toBe("unauthenticated");
    });
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });

  it("CharacterSelector renders canonical characters and supports search and selection", () => {
    const selected = new Set<string>(["archer_acheron"]);
    const onToggle = vi.fn();

    render(<CharacterSelector selectedIds={selected} onToggle={onToggle} />);

    expect(screen.getByText("Acheron")).toBeInTheDocument();
    expect(screen.getByText("Firefly")).toBeInTheDocument();
    expect(screen.getByText("Gallagher")).toBeInTheDocument();

    // Counter shows 1 selected
    expect(screen.getByText("1")).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText("Search characters by name...");
    fireEvent.change(searchInput, { target: { value: "Firefly" } });

    expect(screen.getByText("Firefly")).toBeInTheDocument();
    expect(screen.queryByText("Acheron")).not.toBeInTheDocument();

    // Click character to toggle
    fireEvent.click(screen.getByText("Firefly"));
    expect(onToggle).toHaveBeenCalledWith("firefly");
  });

  it("OnboardingWizard multi-step state machine enforces selection before configuration", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/auth/get-session")) {
        return new Response(
          JSON.stringify({
            user: { id: "usr_1", name: "Caelus", email: "c@astralyn.dev", emailVerified: true },
            session: { id: "sess_1", token: "tok_1", expiresAt: new Date().toISOString() },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/onboarding/complete")) {
        return new Response(JSON.stringify({ success: true, onboardingCompletedAt: new Date().toISOString() }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(
      <AuthProvider>
        <OnboardingWizard />
      </AuthProvider>
    );

    // Verify Step 1 header
    expect(await screen.findByText(/Astral Express Onboarding/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();

    // Next button is initially disabled (0 characters selected)
    const nextBtn = screen.getByRole("button", { name: /Next: Configure Levels & Eidolons/i });
    expect(nextBtn).toBeDisabled();

    // Select Acheron
    fireEvent.click(screen.getByText("Acheron"));

    // Next button becomes enabled
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // Transitions to Step 2
    expect(await screen.findByText(/Step 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Configure Character Levels & Eidolons/i)).toBeInTheDocument();

    // Finish Setup button
    const finishBtn = screen.getByRole("button", { name: /Finish Setup/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/onboarding/complete",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("RosterManager renders unauthenticated prompt when user is not signed in", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/auth/get-session")) {
        return new Response(JSON.stringify(null), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    render(
      <AuthProvider>
        <RosterManager />
      </AuthProvider>
    );

    expect(await screen.findByText("Authentication Required")).toBeInTheDocument();
    expect(screen.getByText(/Sign in with your Google account to manage your Honkai: Star Rail character roster/i)).toBeInTheDocument();
  });

  it("CharacterSelector excludes already rostered characters from candidates, count, and filters", () => {
    const onToggle = vi.fn();
    const excluded = new Set<string>(["archer_acheron"]);
    const selected = new Set<string>();

    const { rerender } = render(
      <CharacterSelector
        selectedIds={selected}
        excludedIds={excluded}
        onToggle={onToggle}
      />
    );

    // Excluded character Acheron must NOT appear
    expect(screen.queryByText("Acheron")).not.toBeInTheDocument();

    // Addable characters must appear
    expect(screen.getByText("Firefly")).toBeInTheDocument();
    expect(screen.getByText("Gallagher")).toBeInTheDocument();

    // Candidate count must be 2 (3 total mocked - 1 excluded)
    expect(screen.getByText("2")).toBeInTheDocument();

    // Dynamically add Firefly to excluded (simulating addition to roster)
    const nextExcluded = new Set<string>(["archer_acheron", "firefly"]);
    rerender(
      <CharacterSelector
        selectedIds={selected}
        excludedIds={nextExcluded}
        onToggle={onToggle}
      />
    );

    // Firefly now disappears
    expect(screen.queryByText("Firefly")).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Dynamically remove Acheron from excluded (simulating deletion from roster)
    const afterDeleteExcluded = new Set<string>(["firefly"]);
    rerender(
      <CharacterSelector
        selectedIds={selected}
        excludedIds={afterDeleteExcluded}
        onToggle={onToggle}
      />
    );

    // Acheron is now addable again
    expect(screen.getByText("Acheron")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
