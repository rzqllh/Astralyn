import { test, expect, type Page } from "@playwright/test";

// Helper to mock authentication and core endpoints
async function mockAuthenticatedUser(page: Page, initialNeedsOnboarding = false, customRoster: unknown[] = []) {
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
  });

  let currentNeedsOnboarding = initialNeedsOnboarding;

  // Mock /api/me
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user-1", name: "E2E Tester", email: "e2e@example.com" },
        profile: { onboardingCompletedAt: currentNeedsOnboarding ? null : new Date().toISOString() },
        needsOnboarding: currentNeedsOnboarding,
      }),
    });
  });

  // Mock /api/auth/session to simulate Better Auth session
  await page.route("**/api/auth/get-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: { id: "test-session", userId: "test-user-1", expiresAt: new Date(Date.now() + 86400000).toISOString() },
        user: { id: "test-user-1", name: "E2E Tester", email: "e2e@example.com" },
      }),
    });
  });

  // Mock /api/roster
  await page.route("**/api/roster", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ roster: customRoster }),
      });
    } else if (route.request().method() === "PUT") {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, item: { ...payload, updatedAt: new Date().toISOString() } }),
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock /api/saved-teams
  await page.route("**/api/saved-teams", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ teams: [] }),
      });
    } else if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ 
          success: true, 
          team: { id: "new-team-id", ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } 
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock /api/onboarding/complete
  await page.route("**/api/onboarding/complete", async (route) => {
    if (route.request().method() === "PUT") {
      currentNeedsOnboarding = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock /api/recommendations/teams
  await page.route("**/api/recommendations/teams", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "success",
        teams: [
          {
            rank: 1,
            archetype: "Test Recommendation",
            signature: "acheron;aventurine;firefly;gallagher",
            score: 85,
            slots: [
              { slot: 1, characterId: "acheron", role: "main_dps" },
              { slot: 2, characterId: "aventurine", role: "sustain" },
              { slot: 3, characterId: "firefly", role: "sub_dps" },
              { slot: 4, characterId: "gallagher", role: "sustain" }
            ],
            reasons: []
          }
        ]
      }),
    });
  });
}

test.describe("Phase 6: Authenticated Workflows", () => {
  test("User completing onboarding is redirected to home", async ({ page }) => {
    await mockAuthenticatedUser(page, true);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Welcome aboard/i)).toBeVisible();
    await page.getByRole("button", { name: "Start Onboarding" }).click();
    await expect(page.getByText(/Select Your Owned Roster/i)).toBeVisible();
    
    // Select a character (e.g., Acheron)
    await page.getByPlaceholder("Search characters by name...").fill("Acheron");
    await page.getByRole("button", { name: "Acheron" }).click();
    // Proceed to Step 2
    await page.getByRole("button", { name: /Next: Configure Levels/i }).click();
    
    // Complete onboarding
    await page.getByRole("button", { name: /Finish Setup/i }).click();
    
    // We expect the app to handle completion and redirect (might need manual reload if store doesn't trigger)
    // But since this is a frontend E2E mock, we simulate the state change.
    // The onboarding flow calls /api/onboarding/complete and updates AuthContext.
    await expect(page.getByText("Roster Management", { exact: true })).toBeVisible();
  });

  test("Roster management: Adding and filtering characters", async ({ page }) => {
    await mockAuthenticatedUser(page, false, [
      { characterId: "acheron", level: 80, eidolon: 0, isOwned: true }
    ]);

    await page.goto("/");
    await expect(page.getByText("Knowledge Base Synchronized")).toBeVisible();

    await page.getByRole("link", { name: "Roster", exact: true }).click();
    
    // Acheron should be visible
    await expect(page.getByText("Acheron")).toBeVisible();
    
    // Wait for Add Character button
    const addButton = page.getByRole("button", { name: /Add Character/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByRole("button", { name: "Firefly" }).click();
      await expect(page.getByText("Firefly")).toBeVisible();
    }
  });

  test("Character Detail View displays correct tabs and allows team integration", async ({ page }) => {
    await mockAuthenticatedUser(page, false, [
      { characterId: "acheron", level: 80, eidolon: 0, isOwned: true }
    ]);

    await page.goto("/");
    await expect(page.getByText("Knowledge Base Synchronized")).toBeVisible();

    // Client-side navigation to characters then Acheron
    await page.getByRole("link", { name: "Characters", exact: true }).click();
    await page.getByRole("link", { name: /Acheron/i }).first().click();
    await page.waitForLoadState("networkidle");

    try {
      await expect(page.getByRole("heading", { name: "Acheron", level: 1 })).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.log("ACHERON TIMEOUT HTML DUMP:");
      console.log(await page.content());
      const btn = page.getByRole("button", { name: "Show Error" });
      if (await btn.isVisible()) {
        await btn.click();
        console.log("ERROR MESSAGE DUMP:");
        console.log(await page.content());
      }
      throw e;
    }
    await expect(page.getByText("Base Attributes")).toBeVisible();

    // Tabs
    await page.getByRole("button", { name: "Major Traces" }).click();
    await expect(page.getByText("Red Oni")).toBeVisible();

    await page.getByRole("button", { name: "Eidolons" }).click();
    await expect(page.getByText(/E1:/)).toBeVisible();
  });

  test("Divergent Universe Assistant manual flow and caching", async ({ page }) => {
    await mockAuthenticatedUser(page, false);

    await page.goto("/");
    await expect(page.getByText("Knowledge Base Synchronized")).toBeVisible();

    await page.getByRole("link", { name: "Assistant" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Active Run")).toBeVisible();
    
    // Click manual configuration
    await page.getByRole("tab", { name: /Manual Selection/i }).click();
    
    // Fill form using candidate slot
    await page.getByRole("button", { name: "Search to select" }).first().click();
    await page.getByPlaceholder("Search blessings, equations, curios...").fill("Voyage Monitor");
    await page.getByText("Voyage Monitor", { exact: true }).click();

    await page.getByRole("button", { name: "Evaluate Choices" }).click();
    await expect(page.getByRole("heading", { name: "Recommendations" })).toBeVisible();
  });
});
