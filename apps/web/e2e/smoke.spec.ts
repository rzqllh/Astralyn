import { test, expect } from "@playwright/test";

test.describe("Astralyn Phase 1 E2E Smoke Suite", () => {
  test("loads desktop application shell with navigation rail, brand mark, and HomeView", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // Verify Brand & Navigation
    await expect(page.getByText("Astralyn", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Active Team Optimization")).toBeVisible();
    await expect(page.getByText("Divergent Universe Assistant")).toBeVisible();
    await expect(page.getByRole("button", { name: /Acheron/i })).toBeVisible();
  });

  test("navigates to /design-system and switches interactive tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/design-system");

    await expect(page.getByTestId("design-system-view")).toBeVisible();
    await expect(page.getByText("Astralyn Design System Showcase")).toBeVisible();

    // Verify Tab 1 (Tokens)
    await expect(page.getByText("Surface & Background Tokens")).toBeVisible();

    // Switch to Buttons & Forms Tab
    await page.getByRole("tab", { name: "Buttons & Forms" }).click();
    await expect(page.getByText("Button Variants & States")).toBeVisible();
    await expect(page.getByRole("button", { name: "Primary Gold" })).toBeVisible();

    // Switch to Character Tiles Tab
    await page.getByRole("tab", { name: "Character Tiles" }).click();
    await expect(page.getByText("Character Tile Visual States")).toBeVisible();

    // Switch to Verdicts & Decisions Tab
    await page.getByRole("tab", { name: "Verdicts & Decisions" }).click();
    await expect(
      page.getByText("Recommendation Verdict & 3-Source Consensus")
    ).toBeVisible();
  });

  test("renders mobile viewport (390px) with responsive navigation and no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByTestId("home-view")).toBeVisible();

    // Verify mobile hamburger button is visible
    const menuBtn = page.getByRole("button", { name: "Toggle navigation menu" });
    await expect(menuBtn).toBeVisible();

    // Open mobile navigation drawer
    await menuBtn.click();
    await expect(page.getByRole("link", { name: "Design System Phase 1" })).toBeVisible();

    // Navigate to design system via drawer
    await page.getByRole("link", { name: "Design System Phase 1" }).click();
    await expect(page.getByTestId("design-system-view")).toBeVisible();

    // Check no horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // allowing minor subpixel margin
  });

  test("renders tablet viewport (768px) cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Active Team Optimization")).toBeVisible();
  });
});
