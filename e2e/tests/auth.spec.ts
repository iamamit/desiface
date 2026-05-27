import { expect, test } from "@playwright/test";

import { login, logout, makeUser, register } from "./helpers";

test.describe("Auth", () => {
  test("OTP sign-in: creates account and redirects to feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.locator('textarea[placeholder="Start a post"]')).toBeVisible();
  });

  test("OTP sign-in: existing user logs back in to feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await logout(page);
    await login(page, user);
    await expect(page).toHaveURL(/\/feed/);
  });

  test("OTP sign-in: invalid code shows error", async ({ page }) => {
    const user = makeUser();

    await page.goto("/login");
    // Let the UI send the OTP request, then submit a wrong code
    await page.route("**/auth/request-otp", async (route) => {
      await route.fetch(); // trigger the real request so OTP is generated
      await route.fulfill({ status: 200, body: JSON.stringify({ message: "OTP sent", dev_otp: "999999" }) });
    });
    await page.fill('input[type="email"]', user.email);
    await page.click('button[type="submit"]');

    await page.waitForSelector('input[inputmode="numeric"]');
    // Enter a wrong code (000000 won't match 999999)
    for (let i = 0; i < 6; i++) {
      await page.locator('input[inputmode="numeric"]').nth(i).fill("0");
    }
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/Invalid or expired/i")).toBeVisible({ timeout: 5000 });
  });

  test("OTP sign-in: shows email step then OTP step", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await page.fill('input[type="email"]', "someone@example.com");
    await page.route("**/auth/request-otp", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ message: "OTP sent", dev_otp: "123456" }) })
    );
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Check your email")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[inputmode="numeric"]').first()).toBeVisible();
  });

  test("OTP sign-in: back button returns to email step", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "someone@example.com");
    await page.route("**/auth/request-otp", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ message: "OTP sent", dev_otp: "123456" }) })
    );
    await page.click('button[type="submit"]');
    await page.waitForSelector('input[inputmode="numeric"]');

    await page.getByRole("button", { name: /Back/i }).click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("logout: clears session and redirects to login", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await logout(page);
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/register redirects to /login", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/forgot-password redirects to /login", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/\/login/);
  });
});
