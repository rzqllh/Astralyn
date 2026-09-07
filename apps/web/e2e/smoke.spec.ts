import { test, expect } from "@playwright/test";
import * as path from "node:path";
import * as fs from "node:fs";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "e2e/screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

async function ensureImagesDecoded(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
        try {
          await img.decode();
        } catch {
          // Intentionally ignore image decode errors in headless captures
        }
      })
    );
  });
}

test.describe("Astralyn Phase 2.5 E2E Smoke & Production Readiness Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/get-session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "null",
      });
    });
  });

  test("loads desktop application shell with navigation rail, brand mark, and truthful Home status (1440px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify Brand & Navigation
    await expect(page.getByText("Astralyn", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Canonical Knowledge Baseline")).toBeVisible();
    await expect(page.getByText("Team Optimization Guidance")).toBeVisible();
    await expect(page.getByText("Divergent Universe Assistant")).toBeVisible();
    await expect(page.getByText("Character Roster").first()).toBeVisible();
    await expect(page.getByText("Meta Consensus Matrix")).toBeVisible();

    // Verify locked production navigation links exist
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Roster", exact: true })).toBeVisible();
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

    // Verify header renders truthful account unavailable status
    await expect(page.getByRole("banner").getByRole("button", { name: "Sign in with Google" })).toBeVisible();

    await ensureImagesDecoded(page);

    // Screenshot desktop Home at 1440px
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "desktop_home_1440.png"),
      fullPage: true,
    });
  });

  test("navigates to implemented routes (/roster) with truthful unauthenticated status", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/roster");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Authentication Required")).toBeVisible();
    await expect(page.getByText("Sign in with your Google account to manage your Honkai: Star Rail character roster")).toBeVisible();

    // Return to Home via Navigation Rail
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page.getByTestId("home-view")).toBeVisible();
  });

  test("guards internal /design-system route in production mode and displays Waypoint Not Found", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("not-found")).toBeVisible();
    await expect(page.getByText("Waypoint Not Found")).toBeVisible();
    await expect(page.getByTestId("design-system-view")).not.toBeAttached();
  });

  test("renders mobile viewport (390px) with responsive navigation and zero horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("home-view")).toBeVisible();

    // Verify mobile hamburger button is visible
    const menuBtn = page.getByRole("button", { name: "Toggle navigation menu" });
    await expect(menuBtn).toBeVisible();

    // Open mobile navigation drawer
    await menuBtn.click();
    await expect(page.getByRole("link", { name: "Roster", exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Best Characters", exact: true })
    ).toBeVisible();

    // Screenshot mobile drawer
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "mobile_drawer_390.png"),
    });

    await menuBtn.click(); // close menu

    await ensureImagesDecoded(page);

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
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Canonical Knowledge Baseline")).toBeVisible();

    await ensureImagesDecoded(page);

    // Screenshot tablet view
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "tablet_home_768.png"),
      fullPage: true,
    });
  });

  test("verifies production build hides Dev DS link and isolates development-only controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // In production build preview, Dev DS link is not rendered in navigation rail
    const devDsLink = page.getByTestId("dev-ds-link");
    await expect(devDsLink).not.toBeAttached();

    // Verify mobile drawer also hides dev link in production
    await page.setViewportSize({ width: 390, height: 844 });
    const menuBtn = page.getByRole("button", { name: "Toggle navigation menu" });
    await menuBtn.click();
    const mobileDevDsLink = page.getByTestId("mobile-dev-ds-link");
    await expect(mobileDevDsLink).not.toBeAttached();
  });
});
