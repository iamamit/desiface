import { expect, test } from "@playwright/test";

import { login, logout, makeUser, register } from "./helpers";

test.describe("Privacy controls", () => {
  test("settings page has profile visibility selector", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await expect(page.locator("text=Profile visibility")).toBeVisible();
    await expect(page.locator("select").filter({ hasText: "Public" }).first()).toBeVisible();
  });

  test("profile visibility: saving friends_only shows saved confirmation", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    const privacySection = page.locator("text=Profile visibility").locator("..");
    const select = page.locator("select").filter({ hasText: "Public" }).first();
    await select.selectOption("friends_only");
    await page.getByRole("button", { name: /save privacy/i }).click();

    await expect(page.locator("text=Privacy settings saved")).toBeVisible({ timeout: 5000 });
  });

  test("friends_only profile: backend returns 403 for non-connections", async ({ browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctx = await browser.newContext();
    const apiPage = await ctx.newPage();

    // Register userA via OTP and set profile to friends_only
    const otpA = await apiPage.request.post("http://localhost:8000/auth/request-otp", { data: { email: userA.email } });
    const { dev_otp: codeA } = await otpA.json();
    const regA = await apiPage.request.post("http://localhost:8000/auth/verify-otp", { data: { email: userA.email, code: codeA } });
    const tokenA = (await regA.json()).access_token;
    const meA = await apiPage.request.get("http://localhost:8000/auth/me", { headers: { Authorization: `Bearer ${tokenA}` } });
    const usernameA = (await meA.json()).username;
    await apiPage.request.patch("http://localhost:8000/users/me", {
      data: { profile_visibility: "friends_only" },
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    // Register userB via OTP
    const otpB = await apiPage.request.post("http://localhost:8000/auth/request-otp", { data: { email: userB.email } });
    const { dev_otp: codeB } = await otpB.json();
    const regB = await apiPage.request.post("http://localhost:8000/auth/verify-otp", { data: { email: userB.email, code: codeB } });
    const tokenB = (await regB.json()).access_token;

    // UserB should get 403 when requesting userA's profile
    const profileRes = await apiPage.request.get(`http://localhost:8000/users/${usernameA}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(profileRes.status()).toBe(403);

    await ctx.close();
  });

  test("friends_only profile: UI hides profile from non-connections", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register userA and set profile to friends_only
    await register(page, userA);
    await page.goto("/settings");
    await page.locator("select").filter({ hasText: "Public" }).first().selectOption("friends_only");
    await page.getByRole("button", { name: /save privacy/i }).click();
    await expect(page.locator("text=Privacy settings saved")).toBeVisible({ timeout: 3000 });

    // Register userB in a new context
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);

    // userB visits userA's profile - should see the private profile message
    await pageB.goto(`/profile/${userA.username}`);

    // The private profile message should appear
    await expect(pageB.locator("text=This profile is not visible")).toBeVisible({ timeout: 8000 });
    // The Connect button should NOT be shown (only appears on full profile)
    await expect(pageB.locator("button:has-text('Connect')")).not.toBeVisible();

    await ctxB.close();
  });

  test("public profile: visible to non-connections", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register userA (public by default)
    await register(page, userA);

    // Register userB in a new context
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);

    // userB visits userA's profile
    await pageB.goto(`/profile/${userA.username}`);
    // Should see the profile
    await expect(pageB.locator(`text=@${userA.username}`)).toBeVisible({ timeout: 5000 });

    await ctxB.close();
  });

  test("post visibility selector shows in create post area", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.fill('textarea[placeholder="Start a post"]', "Visibility test");

    // Visibility dropdown should appear when content is typed
    await expect(page.locator('select').filter({ hasText: /Public/i })).toBeVisible({ timeout: 3000 });
  });
});
