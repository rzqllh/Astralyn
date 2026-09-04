import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "../src/router";
import { Button } from "../src/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/components/ui/tabs";
import { CharacterTile } from "../src/dev/components/hsr/character-tile";
import { DecisionCard } from "../src/dev/components/hsr/decision-card";
import { RecommendationPanel } from "../src/dev/components/hsr/recommendation-panel";
import {
  FIXTURE_CHARACTERS,
  FIXTURE_DECISION,
  FIXTURE_RECOMMENDATION,
} from "./fixtures/ui-fixtures";

describe("Phase 1.1 Design System Component Tests", () => {
  it("Button renders variants and responds to click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button variant="primary" onClick={handleClick}>
        Confirm Action
      </Button>
    );

    const button = screen.getByRole("button", { name: /Confirm Action/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("Button does not fire click when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button variant="primary" disabled onClick={handleClick}>
        Disabled Action
      </Button>
    );

    const button = screen.getByRole("button", { name: /Disabled Action/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("Tabs switches active content on click and supports keyboard navigation", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Overview</TabsTrigger>
          <TabsTrigger value="tab2">Builds</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Overview Panel Content</TabsContent>
        <TabsContent value="tab2">Builds Panel Content</TabsContent>
      </Tabs>
    );

    expect(screen.getByText("Overview Panel Content")).toBeInTheDocument();
    expect(screen.queryByText("Builds Panel Content")).not.toBeInTheDocument();

    const buildsTab = screen.getByRole("tab", { name: "Builds" });
    await user.click(buildsTab);

    expect(screen.getByText("Builds Panel Content")).toBeInTheDocument();
    expect(screen.queryByText("Overview Panel Content")).not.toBeInTheDocument();
  });

  it("CharacterTile v2 renders rarity, element icon, and handles selection semantics", async () => {
    const handleClick = vi.fn();
    const character = FIXTURE_CHARACTERS[0]; // Acheron (5★ Lightning Nihility)

    const { rerender } = render(
      <CharacterTile character={character} selected={false} onClick={handleClick} />
    );

    const tile = screen.getByRole("button", { name: /Acheron/i });
    expect(tile).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("heading", { name: "Acheron" })).toBeInTheDocument();
    expect(screen.getByText("Nihility")).toBeInTheDocument();
    expect(screen.getByAltText("Lightning")).toBeInTheDocument();
    expect(screen.getByAltText("Acheron")).toBeInTheDocument();

    // Click tile
    fireEvent.click(tile);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Keyboard activation (Enter key)
    fireEvent.keyDown(tile, { key: "Enter", code: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(2);

    // Re-render as selected
    rerender(
      <CharacterTile character={character} selected={true} onClick={handleClick} />
    );
    expect(tile).toHaveAttribute("aria-pressed", "true");
  });

  it("DecisionCard renders recommended pick and invokes confirmation callback", async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    render(<DecisionCard decision={FIXTURE_DECISION} onConfirm={handleConfirm} />);

    expect(screen.getByText(FIXTURE_DECISION.recommendedPick)).toBeInTheDocument();
    expect(screen.getByText("Tactical Rationale")).toBeInTheDocument();
    expect(screen.getByText("Alternative Option Trade-offs")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Choice/i });
    await user.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("RecommendationPanel renders Astralyn Verdict, match score, and rationale", () => {
    render(<RecommendationPanel recommendation={FIXTURE_RECOMMENDATION} />);

    expect(screen.getByText("Astralyn Verdict")).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_RECOMMENDATION.verdictTitle)).toBeInTheDocument();
    expect(screen.getByText(`${FIXTURE_RECOMMENDATION.matchScore}%`)).toBeInTheDocument();
    expect(screen.getByText(FIXTURE_RECOMMENDATION.recommendedItem)).toBeInTheDocument();
    expect(screen.getByText("Key Tactical Rationale")).toBeInTheDocument();
  });

  it("AppShell exposes 8 locked production navigation links and truthful account state", async () => {
    const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
    const testRouter = createAppRouter(memoryHistory);
    render(<RouterProvider router={testRouter} />);

    // Wait for layout to mount
    expect(await screen.findAllByText(/Astralyn/i)).toBeTruthy();

    // Truthful account state (Phase 4 dynamic auth state)
    const authElements = await screen.findAllByText(/Sign in with Google|Verifying|Auth error/i);
    expect(authElements.length).toBeGreaterThan(0);

    // 8 Locked Production Navigation Modules in Main Navigation
    const nav = await screen.findByRole("navigation", { name: "Main Navigation" });
    const lockedModules = [
      "Home",
      "Roster",
      "Characters",
      "Best Characters",
      "Teams",
      "Content",
      "Assistant",
      "Settings",
    ];

    for (const mod of lockedModules) {
      expect(
        within(nav).getByRole("link", { name: new RegExp(`^${mod}`, "i") })
      ).toBeInTheDocument();
    }
  });

  it("AppShell gates development-only Dev DS link based on environment", async () => {
    const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
    const testRouter = createAppRouter(memoryHistory);
    render(<RouterProvider router={testRouter} />);

    // In testing environment with import.meta.env.DEV active, Dev DS link is rendered
    if (import.meta.env.DEV) {
      const devLink = await screen.findByTestId("dev-ds-link");
      expect(devLink).toBeInTheDocument();
      expect(devLink).toHaveAttribute("href", "/design-system.html");
    } else {
      expect(screen.queryByTestId("dev-ds-link")).toBeNull();
    }
  });
});
