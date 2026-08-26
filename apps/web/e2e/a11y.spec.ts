import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Astralyn WCAG 2.2 AA Automated Accessibility Audit", () => {
  test("audits HomeView (/) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='home-view']");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("audits DesignSystemView (/design-system) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/design-system");
    await page.waitForSelector("[data-testid='design-system-view']");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
