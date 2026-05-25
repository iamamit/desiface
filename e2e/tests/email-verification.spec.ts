import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Email verification", () => {
  test("unverified user sees verification banner on feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await expect(page.locator("text=verify your email")).toBeVisible({ timeout: 5000 });
  });

  test("verification banner: dismiss button hides the banner", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    const banner = page.locator(".bg-amber-50");
    await expect(banner).toBeVisible({ timeout: 3000 });

    // The × dismiss button is the last button in the banner
    await banner.locator("button").last().click();
    await expect(banner).not.toBeVisible();
  });

  test("verify-email page: valid token verifies and redirects to feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    // Get the auth token from localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(accessToken).toBeTruthy();

    // Get the dev_token via the resend endpoint with auth header
    const apiRes = await page.request.post("http://localhost:8000/auth/resend-verification", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await apiRes.json().catch(() => ({}));
    const verifyToken: string = body.dev_token;
    expect(verifyToken).toBeTruthy();

    // Visit verify-email while still logged in
    await page.goto(`/verify-email?token=${verifyToken}`);
    await expect(page.locator("text=Email verified")).toBeVisible({ timeout: 5000 });
    await page.waitForURL("**/feed", { timeout: 8000 });

    // Banner should be gone after verification
    await expect(page.locator("text=verify your email")).not.toBeVisible({ timeout: 3000 });
  });

  test("verify-email page: missing token shows error (unauthenticated)", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.locator("text=/No token|invalid/i")).toBeVisible({ timeout: 5000 });
  });

  test("verify-email page: invalid token shows error (unauthenticated)", async ({ page }) => {
    await page.goto("/verify-email?token=bogustoken123");
    await expect(page.locator("text=/Invalid|expired/i")).toBeVisible({ timeout: 5000 });
  });
});
