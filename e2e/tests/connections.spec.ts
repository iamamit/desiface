import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Connections", () => {
  test("connections page loads with tabs", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/connections");
    await expect(page.locator("text=Friends (0)")).toBeVisible();
    await expect(page.locator("text=Requests (0)")).toBeVisible();
    await expect(page.locator('input[placeholder="Search by name or username…"]')).toBeVisible();
  });

  test("search: find people shows results", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto("/connections");

    await page.fill('input[placeholder="Search by name or username…"]', userB.username);
    await expect(page.getByText(userB.username, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible();
  });

  test("send request: button changes to Sent", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto("/connections");

    await page.fill('input[placeholder="Search by name or username…"]', userB.username);
    await expect(page.getByText(userB.username, { exact: true }).first()).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByRole("button", { name: "Withdraw" })).toBeVisible({ timeout: 5000 });
  });

  test("connect from profile: button shows Withdraw request after click", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto(`/profile/${userB.username}`);

    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByRole("button", { name: "Withdraw request" })).toBeVisible({ timeout: 5000 });
  });

  test("withdraw from profile: reverts back to Connect button", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto(`/profile/${userB.username}`);

    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByRole("button", { name: "Withdraw request" })).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Withdraw request" }).click();
    await expect(page.getByRole("button", { name: "Connect" })).toBeVisible({ timeout: 5000 });
  });

  test("accept request: moves user to Friends tab", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register userB
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);

    // userA registers and sends a connection request to userB
    await register(page, userA);
    await page.goto(`/profile/${userB.username}`);
    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByRole("button", { name: "Withdraw request" })).toBeVisible({ timeout: 5000 });

    // userB navigates to connections page and accepts
    await pageB.goto("/connections");
    await pageB.getByRole("button", { name: "Requests (1)" }).click();
    await expect(pageB.getByText(userA.username, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await pageB.getByRole("button", { name: "Accept" }).click();

    // userB now sees userA in Friends tab
    await pageB.getByRole("button", { name: /Friends/ }).click();
    await expect(pageB.locator("text=Friends (1)")).toBeVisible({ timeout: 5000 });

    // userA's profile now shows Connected
    await page.reload();
    await expect(page.getByRole("button", { name: "Connected ✓" })).toBeVisible({ timeout: 5000 });

    await ctxB.close();
  });
});
