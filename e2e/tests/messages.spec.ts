import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Messages", () => {
  test("messages page: shows empty state for new user", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/messages");
    await expect(page.locator("text=No messages yet")).toBeVisible({ timeout: 5000 });
  });

  test("message button on profile: navigates to chat page", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto(`/profile/${userB.username}`);
    await page.getByRole("button", { name: "Message" }).click();

    await expect(page).toHaveURL(new RegExp(`/messages/${userB.username}`));
    await expect(page.locator("text=@" + userB.username)).toBeVisible();
    await ctxB.close();
  });

  test("send message: appears in chat", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);
    await page.goto(`/messages/${userB.username}`);

    const msgText = `Hello from ${userA.username} at ${Date.now()}`;
    await page.fill('input[placeholder="Type a message…"]', msgText);
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.locator("text=" + msgText)).toBeVisible({ timeout: 5000 });
  });

  test("conversation list: shows after sending a message", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await ctxB.close();

    await register(page, userA);

    // Send a message to userB
    await page.goto(`/messages/${userB.username}`);
    await page.fill('input[placeholder="Type a message…"]', "Hey there!");
    await page.getByRole("button", { name: "Send" }).click();

    // Navigate to messages list
    await page.goto("/messages");
    await expect(page.getByText(userB.username, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Hey there!")).toBeVisible();
  });

  test("two-way chat: both users see each other's messages", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);

    await register(page, userA);

    // userA sends a message
    await page.goto(`/messages/${userB.username}`);
    await page.fill('input[placeholder="Type a message…"]', "Hi from A");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.locator("text=Hi from A")).toBeVisible({ timeout: 5000 });

    // userB opens the conversation and replies
    await pageB.goto(`/messages/${userA.username}`);
    await expect(pageB.locator("text=Hi from A")).toBeVisible({ timeout: 5000 });
    await pageB.fill('input[placeholder="Type a message…"]', "Hi back from B");
    await pageB.getByRole("button", { name: "Send" }).click();
    await expect(pageB.locator("text=Hi back from B")).toBeVisible({ timeout: 5000 });

    await ctxB.close();
  });
});
