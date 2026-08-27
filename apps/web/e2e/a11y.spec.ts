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

  test("audits planned route placeholder (/roster) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/roster");
    await page.waitForSelector("[data-testid='view-roster']");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("audits production guarded not-found view (/design-system) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/design-system");
    await page.waitForSelector("[data-testid='not-found']");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
