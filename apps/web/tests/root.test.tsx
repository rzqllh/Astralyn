import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "../src/router";
import { ASTRALYN_SERVICE_NAME } from "@astralyn/shared";
import { z } from "zod";
import { create } from "zustand";
import Dexie from "dexie";
import Fuse from "fuse.js";

// Verify Zustand store creation works
interface TestStore {
  count: number;
  increment: () => void;
}
const useTestStore = create<TestStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

describe("Astralyn Phase 1.1 Web Application Smoke Test", () => {
  it("renders the root application shell and HomeView with HSR design components", async () => {
    const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
    const testRouter = createAppRouter(memoryHistory);
    render(<RouterProvider router={testRouter} />);

    // Brand & Header
    expect(await screen.findAllByText(/Astralyn/i)).toBeTruthy();
    expect(screen.getByText("Honkai: Star Rail Assistant")).toBeInTheDocument();

    // HSR Component Assertions
    expect(screen.getByTestId("home-view")).toBeInTheDocument();
    expect(screen.getByText("Team Optimization Guidance")).toBeInTheDocument();
    expect(screen.getByText("Divergent Universe Assistant")).toBeInTheDocument();
    expect(screen.getByText("Trailblazer Character Roster")).toBeInTheDocument();
    expect(screen.getByText("Acheron Profile")).toBeInTheDocument();
  });

  it("renders the /design-system showcase route cleanly", async () => {
    const memoryHistory = createMemoryHistory({ initialEntries: ["/design-system"] });
    const testRouter = createAppRouter(memoryHistory);
    render(<RouterProvider router={testRouter} />);

    expect(await screen.findByTestId("design-system-view")).toBeInTheDocument();
    expect(screen.getByText("Astralyn Design System & Game Assets")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tokens & Palette" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Game Assets" })).toBeInTheDocument();
  });

  it("successfully resolves @astralyn/shared constants", () => {
    expect(ASTRALYN_SERVICE_NAME).toBe("astralyn-worker");
  });

  it("successfully instantiates core client dependencies", () => {
    // 1. Zod schema validation (Zod 4)
    const testSchema = z.object({ name: z.string(), active: z.boolean() });
    const parsed = testSchema.safeParse({ name: "Astralyn", active: true });
    expect(parsed.success).toBe(true);

    // 2. Zustand state inspection
    expect(useTestStore.getState().count).toBe(0);
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);

    // 3. Dexie IndexedDB client instantiation
    const db = new Dexie("AstralynTestDB");
    expect(db.name).toBe("AstralynTestDB");

    // 4. Fuse.js fuzzy search instantiation
    const fuse = new Fuse(["Acheron", "Castorice", "Firefly"]);
    const results = fuse.search("Castorice");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item).toBe("Castorice");
  });
});
