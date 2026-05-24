import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Search", () => {
  test("navbar search: finds user by username", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);

    await page.fill('input[placeholder="Search people…"]', userB.username);
    await expect(page.locator("text=@" + userB.username)).toBeVisible({ timeout: 5000 });
  });

  test("navbar search: finds user by full name", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);

    // Search by unique suffix of full name (the ID portion)
    const partialName = userB.full_name.split(" ").pop()!.slice(0, 6);
    await page.fill('input[placeholder="Search people…"]', partialName);
    await expect(page.locator(`text=@${userB.username}`)).toBeVisible({ timeout: 5000 });
  });

  test("navbar search: clicking result navigates to profile", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);

    await page.fill('input[placeholder="Search people…"]', userB.username);
    await expect(page.locator("text=@" + userB.username)).toBeVisible({ timeout: 5000 });

    // Click the result
    await page.locator("text=@" + userB.username).click();
    await expect(page).toHaveURL(new RegExp(`/profile/${userB.username}`));
  });

  test("navbar search: clears results when input cleared", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);

    await page.fill('input[placeholder="Search people…"]', userB.username);
    await expect(page.locator("text=@" + userB.username)).toBeVisible({ timeout: 5000 });

    // Clear input
    await page.fill('input[placeholder="Search people…"]', "");
    await expect(page.locator("text=@" + userB.username)).not.toBeVisible({ timeout: 3000 });
  });

  test("search: no results for gibberish query", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.fill('input[placeholder="Search people…"]', "xqzxqzxqz99999");
    // Wait for debounce (300ms) and confirm no dropdown
    await page.waitForTimeout(500);
    // The dropdown div should not exist
    await expect(page.locator(".absolute.top-full").filter({ hasText: "@" })).not.toBeVisible();
  });
});
