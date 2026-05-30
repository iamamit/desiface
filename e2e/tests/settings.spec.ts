import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Settings", () => {
  test("settings page: accessible from navbar Me dropdown", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.getByTestId("me-menu").click();
    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
    await expect(page.locator("text=Danger zone")).toBeVisible();
  });

  test("privacy: profile visibility saves", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/settings");
    await page.selectOption("select", "friends_only");
    await page.getByRole("button", { name: "Save privacy settings" }).click();

    await expect(page.locator("text=Privacy settings saved")).toBeVisible({ timeout: 5000 });
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
});
