import { expect, test } from "@playwright/test";

import { login, logout, makeUser, register } from "./helpers";

test.describe("Profile", () => {
  test("own profile: shows username and Edit profile button", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByTestId("profile-username")).toContainText("@" + user.username);
    await expect(page.getByRole("button", { name: "Edit profile" })).toBeVisible();
  });

  test("own profile: shows join date", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.locator("text=Joined")).toBeVisible();
  });

  test("edit profile: updates bio and displays it", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    // Modal should be open
    await expect(page.getByTestId("edit-profile-modal")).toBeVisible();

    const bio = `Bio set by Playwright at ${Date.now()}`;
    await page.locator('textarea[placeholder="Tell people a little about yourself"]').fill(bio);
    await page.getByRole("button", { name: "Save" }).click();

    // Modal closes and bio is displayed
    await expect(page.locator("text=" + bio)).toBeVisible({ timeout: 5000 });
  });

  test("edit profile: cancel closes modal without saving", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.locator("text=Edit intro")).not.toBeVisible();
  });

  test("other user profile: shows Connect and Message buttons", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register both users
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto(`/profile/${userB.username}`);

    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Message" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit profile" })).not.toBeVisible();
  });

  test("non-existent profile: shows not found message", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/profile/this_user_does_not_exist_xyz987");
    await expect(page.locator("text=not found")).toBeVisible({ timeout: 5000 });
  });

  test("navbar profile link: navigates to own profile", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.locator("nav .group").hover();
    await page.getByRole("link", { name: "View Profile" }).click();

    await expect(page).toHaveURL(new RegExp(`/profile/${user.username}`));
  });
});
