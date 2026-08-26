import { test, expect } from "@playwright/test";
import * as path from "node:path";
import * as fs from "node:fs";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "e2e/screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("Astralyn Phase 1.1 E2E Smoke & Visual QA Suite", () => {
  test("loads desktop application shell with navigation rail, brand mark, CharacterTile v2, and parchment dossier (1440px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // Verify Brand & Navigation
    await expect(page.getByText("Astralyn", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Team Optimization Guidance")).toBeVisible();
    await expect(page.getByText("Divergent Universe Assistant")).toBeVisible();
    await expect(page.getByRole("button", { name: /Acheron/i })).toBeVisible();
    await expect(page.getByText("Acheron Profile")).toBeVisible();

    // Verify locked production navigation links exist
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Roster/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Characters", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Best Characters", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Teams", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Content", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Assistant/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();

    // Screenshot desktop Home at 1440px
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "desktop_home_1440.png"),
      fullPage: true,
    });
  });

  test("navigates to /design-system and inspects game assets and components", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/design-system");

    await expect(page.getByTestId("design-system-view")).toBeVisible();
    await expect(page.getByText("Astralyn Design System & Game Assets")).toBeVisible();

    // Tab 1 (Game Assets)
    await expect(page.getByText("Combat Element Icons")).toBeVisible();
    await expect(page.getByText("Combat Path Icons")).toBeVisible();

    // Switch to CharacterTile v2 tab
    await page.getByRole("tab", { name: "CharacterTile v2" }).click();
    await expect(page.getByText("CharacterTile v2 States & Variants")).toBeVisible();

    // Switch to Parchment & Panels tab
    await page.getByRole("tab", { name: "Parchment & Panels" }).click();
    await expect(page.getByText("Celestial Parchment Panel")).toBeVisible();

    // Screenshot design system showcase
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "desktop_design_system_1440.png"),
      fullPage: true,
    });
  });

  test("renders mobile viewport (390px) with responsive navigation and zero horizontal overflow", async ({
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
    await expect(page.getByRole("link", { name: /^Roster/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Best Characters", exact: true })
    ).toBeVisible();

    // Screenshot mobile drawer
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile_drawer_390.png"),
    });

    await menuBtn.click(); // close menu

    // Screenshot mobile home view
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile_home_390.png"),
      fullPage: true,
    });

    // Verify zero horizontal scrollbar on body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("renders tablet viewport (768px) cleanly with balanced reflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Team Optimization Guidance")).toBeVisible();

    // Screenshot tablet view
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "tablet_home_768.png"),
      fullPage: true,
    });
  });
});
