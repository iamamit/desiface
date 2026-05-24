import { expect, test } from "@playwright/test";

import { login, makeUser, register } from "./helpers";

test.describe("Settings", () => {
  test("settings page: accessible from navbar Me dropdown", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.locator("nav .group").hover();
    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator("text=Change password")).toBeVisible();
    await expect(page.locator("text=Danger zone")).toBeVisible();
  });

  test("change password: wrong current password shows error", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.locator("#current-password").fill("WrongPassword!");
    await page.locator("#new-password").fill("NewPassword123!");
    await page.locator("#confirm-password").fill("NewPassword123!");
    await page.getByRole("button", { name: "Save password" }).click();

    await expect(page.locator("text=Current password is incorrect")).toBeVisible({ timeout: 5000 });
  });

  test("change password: mismatched new passwords shows error", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.locator("#current-password").fill(user.password);
    await page.locator("#new-password").fill("NewPassword123!");
    await page.locator("#confirm-password").fill("DifferentPassword456!");
    await page.getByRole("button", { name: "Save password" }).click();

    await expect(page.locator("text=New passwords do not match")).toBeVisible({ timeout: 3000 });
  });

  test("change password: success message shown and can login with new password", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    const newPassword = "NewSecurePass99!";
    await page.goto("/settings");
    await page.locator("#current-password").fill(user.password);
    await page.locator("#new-password").fill(newPassword);
    await page.locator("#confirm-password").fill(newPassword);
    await page.getByRole("button", { name: "Save password" }).click();

    await expect(page.locator("text=Password changed successfully")).toBeVisible({ timeout: 5000 });

    // Log out and log back in with new password
    await page.locator("nav .group").hover();
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("**/login");

    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/feed");
    await expect(page.locator('textarea[placeholder="Start a post"]')).toBeVisible();
  });

  test("delete account: requires typing DELETE", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.fill('input[placeholder="DELETE"]', "wrong");
    await page.getByRole("button", { name: "Delete my account" }).click();

    await expect(page.locator('text=Type "DELETE" to confirm')).toBeVisible({ timeout: 3000 });
  });

  test("delete account: redirects to login after deletion", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.fill('input[placeholder="DELETE"]', "DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();

    await page.waitForURL("**/login", { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("delete account: deleted user cannot log back in", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.fill('input[placeholder="DELETE"]', "DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await page.waitForURL("**/login", { timeout: 5000 });

    // Try logging back in
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 5000 });
  });
});
