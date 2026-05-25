import { expect, test } from "@playwright/test";

import { login, logout, makeUser, register } from "./helpers";

test.describe("Post sharing", () => {
  test("share button is visible on post cards", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    // Create a post
    await page.goto("/feed");
    await page.fill('textarea[placeholder="Start a post"]', "Shareable post " + Date.now());
    await page.getByRole("button", { name: "Post", exact: true }).click();

    await expect(page.getByTestId("post-card").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("share-btn").first()).toBeVisible();
  });

  test("share modal opens and has caption input", async ({ page }) => {
    const userA = makeUser();
    await register(page, userA);

    await page.goto("/feed");
    await page.fill('textarea[placeholder="Start a post"]', "Post to share " + Date.now());
    await page.getByRole("button", { name: "Post", exact: true }).click();

    await expect(page.getByTestId("post-card").first()).toBeVisible({ timeout: 5000 });
    await page.getByTestId("share-btn").first().click();

    await expect(page.locator('textarea[placeholder*="something"]')).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: /share/i })).toBeVisible();
  });

  test("sharing a post creates a new shared post in feed", async ({ page }) => {
    const userA = makeUser();
    await register(page, userA);

    await page.goto("/feed");
    const originalText = "Original post " + Date.now();
    await page.fill('textarea[placeholder="Start a post"]', originalText);
    await page.getByRole("button", { name: "Post", exact: true }).click();

    await expect(page.getByTestId("post-card").first()).toBeVisible({ timeout: 5000 });

    // Open share modal and share
    await page.getByTestId("share-btn").first().click();
    const caption = "My share caption";
    await page.locator('textarea[placeholder*="something"]').fill(caption);
    await page.getByRole("button", { name: /^share/i }).click();

    // Wait for new shared post to appear
    await page.waitForTimeout(500);

    // The feed should now have at least 2 cards (original + shared)
    const cards = page.getByTestId("post-card");
    await expect(cards).toHaveCount(2, { timeout: 5000 });

    // The newest card should contain the caption
    await expect(cards.first().locator("text=" + caption)).toBeVisible({ timeout: 3000 });
    // And embed the original post content
    await expect(cards.first().locator("text=" + originalText)).toBeVisible({ timeout: 3000 });
  });

  test("shared post embed is visible when viewing a shared post", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    const originalText = "Embed test " + Date.now();
    await page.fill('textarea[placeholder="Start a post"]', originalText);
    await page.getByRole("button", { name: "Post", exact: true }).click();
    await expect(page.getByTestId("post-card").first()).toBeVisible({ timeout: 5000 });

    // Share it
    await page.getByTestId("share-btn").first().click();
    await page.getByRole("button", { name: /^share/i }).click();
    await page.waitForTimeout(500);

    // The shared card should show the embedded original
    const sharedCard = page.getByTestId("post-card").first();
    await expect(sharedCard.locator("text=" + originalText)).toBeVisible({ timeout: 3000 });
  });
});
