import { expect, test } from "@playwright/test";

import { makeUser } from "./helpers";

test.describe("Password reset", () => {
  test("forgot password page: shows success message after submitting email", async ({ browser }) => {
    const user = makeUser();
    // Register via API (not UI so browser stays unauthenticated)
    const ctx = await browser.newContext();
    const apiPage = await ctx.newPage();
    await apiPage.request.post("http://localhost:8000/auth/register", {
      data: { email: user.email, username: user.username, password: user.password, full_name: user.full_name },
    });

    // Visit forgot-password in unauthenticated context
    await apiPage.goto("/forgot-password");
    await apiPage.fill('input[type="email"]', user.email);
    await apiPage.click('button[type="submit"]');
    await expect(apiPage.locator("text=check your email")).toBeVisible({ timeout: 5000 });
    await ctx.close();
  });

  test("forgot password: can reset password and login with new password", async ({ browser, page }) => {
    const user = makeUser();
    // Register via API to keep page unauthenticated
    await page.request.post("http://localhost:8000/auth/register", {
      data: { email: user.email, username: user.username, password: user.password, full_name: user.full_name },
    });

    // Get dev reset token
    const apiRes = await page.request.post("http://localhost:8000/auth/forgot-password", {
      data: { email: user.email },
    });
    const body = await apiRes.json();
    const resetToken: string = body.dev_token;
    expect(resetToken).toBeTruthy();

    // Visit the reset link in unauthenticated context
    const newPassword = "NewPass456!";
    await page.goto(`/reset-password?token=${resetToken}`);
    await expect(page.locator("#rp-new")).toBeVisible({ timeout: 5000 });
    await page.fill("#rp-new", newPassword);
    await page.fill("#rp-confirm", newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=/Password reset/i")).toBeVisible({ timeout: 5000 });

    // Login with new password in a fresh context
    const ctx = await browser.newContext();
    const loginPage = await ctx.newPage();
    await loginPage.goto("/login");
    await loginPage.fill('input[type="email"]', user.email);
    await loginPage.fill('input[type="password"]', newPassword);
    await loginPage.click('button[type="submit"]');
    await loginPage.waitForURL("**/feed", { timeout: 8000 });
    await ctx.close();
  });

  test("reset password: invalid token shows error", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token-xyz");
    await expect(page.locator("#rp-new")).toBeVisible({ timeout: 5000 });
    await page.fill("#rp-new", "NewPass456!");
    await page.fill("#rp-confirm", "NewPass456!");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=/Invalid|expired/i")).toBeVisible({ timeout: 5000 });
  });

  test("reset password: mismatched passwords shows client-side error", async ({ page }) => {
    await page.goto("/reset-password?token=some-token-here");
    await expect(page.locator("#rp-new")).toBeVisible({ timeout: 5000 });
    await page.fill("#rp-new", "NewPass456!");
    await page.fill("#rp-confirm", "DifferentPass789!");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=/do not match/i")).toBeVisible({ timeout: 3000 });
  });

  test("reset password: missing token shows error message", async ({ page }) => {
    await page.goto("/reset-password");
    await page.waitForTimeout(500);
    await expect(page.locator("text=/Invalid reset link|request a new/i")).toBeVisible({ timeout: 5000 });
  });
});
