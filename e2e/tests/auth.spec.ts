import { expect, test } from "@playwright/test";

import { login, logout, makeUser, register } from "./helpers";

test.describe("Auth", () => {
  test("register: creates account and redirects to feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.locator('textarea[placeholder="Start a post"]')).toBeVisible();
  });

  test("register: shows GDPR notice", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("text=GDPR")).toBeVisible();
    await expect(page.locator("text=We never sell your data")).toBeVisible();
  });

  test("login: valid credentials redirect to feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await logout(page);
    await login(page, user);
    await expect(page).toHaveURL(/\/feed/);
  });

  test("login: wrong password shows error", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await logout(page);

    await page.goto("/login");
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', "WrongPassword!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 5000 });
  });

  test("logout: clears session and redirects to login", async ({ page }) => {
    const user = makeUser();
    await register(page, user);
    await logout(page);
    await expect(page).toHaveURL(/\/login/);

    // Visiting a protected page should redirect to login
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login/);
  });
});
