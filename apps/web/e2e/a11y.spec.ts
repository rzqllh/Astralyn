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

  test("audits Character Catalog (/characters) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/characters");
    await page.waitForSelector("text=Characters");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("audits unauthenticated Roster (/roster) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/roster");
    await page.waitForSelector("text=Authentication Required");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("audits Divergent Universe Assistant (/assistant) for zero critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/assistant");
    await page.waitForSelector("[data-testid='view-assistant']");

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
