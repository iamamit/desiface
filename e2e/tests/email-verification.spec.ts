import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

// OTP-authenticated users are auto-verified — no email verification banner shown
test.describe("Email verification", () => {
  test("OTP user is auto-verified: no verification banner on feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await expect(page.locator("text=verify your email")).not.toBeVisible({ timeout: 3000 });
  });

  test("/verify-email redirects to /login", async ({ page }) => {
    await page.goto("/verify-email?token=anything");
    await expect(page).toHaveURL(/\/login/);
  });
});
