import { test, expect } from "@playwright/test";

test.describe("Astralyn Web App Smoke", () => {
  test("loads root shell with expected header and content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Astralyn" })).toBeVisible();
    await expect(page.getByText("Phase 0 Shell")).toBeVisible();
    await expect(page.getByTestId("home-view")).toBeVisible();
    await expect(page.getByText("Architecture Foundation Active")).toBeVisible();
  });
});
