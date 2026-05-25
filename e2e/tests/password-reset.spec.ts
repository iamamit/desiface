import { expect, test } from "@playwright/test";

// Password reset is removed — OTP sign-in replaces it.
// These tests verify the old routes redirect correctly.
test.describe("Password reset (removed flow)", () => {
  test("/reset-password redirects to /login", async ({ page }) => {
    await page.goto("/reset-password?token=sometoken");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/forgot-password redirects to /login", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/\/login/);
  });
});
