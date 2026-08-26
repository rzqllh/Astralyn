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

describe("Web Application Root Smoke Test", () => {
  it("renders the root application shell and title", async () => {
    const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
    const testRouter = createAppRouter(memoryHistory);
    render(<RouterProvider router={testRouter} />);

    expect(await screen.findByText("Astralyn")).toBeInTheDocument();
    expect(screen.getByText("Phase 0 Shell")).toBeInTheDocument();
    expect(screen.getByTestId("home-view")).toBeInTheDocument();
  });

  it("successfully resolves @astralyn/shared constants", () => {
    expect(ASTRALYN_SERVICE_NAME).toBe("astralyn-worker");
  });

  it("successfully instantiates core client dependencies", () => {
    // 1. Zod schema validation
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
