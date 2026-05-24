import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Real-time chat (WebSocket)", () => {
  test("message sent by userA appears instantly for userB", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register both users
    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);

    await register(page, userA);

    // userA opens chat with userB
    await page.goto(`/messages/${userB.username}`);
    await expect(page.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });

    // userB opens chat with userA
    await pageB.goto(`/messages/${userA.username}`);
    await expect(pageB.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });

    // userA sends a message
    const msg = `Hello realtime ${Date.now()}`;
    await page.fill('input[placeholder="Type a message…"]', msg);
    await page.getByRole("button", { name: "Send" }).click();

    // userA should see it immediately (sent via REST)
    await expect(page.locator("text=" + msg)).toBeVisible({ timeout: 5000 });

    // userB should receive it via WebSocket without refreshing
    await expect(pageB.locator("text=" + msg)).toBeVisible({ timeout: 8000 });

    await ctxB.close();
  });

  test("multiple messages arrive in order", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await register(page, userA);

    await page.goto(`/messages/${userB.username}`);
    await pageB.goto(`/messages/${userA.username}`);

    await expect(page.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });

    const ts = Date.now();
    for (const msg of [`first_${ts}`, `second_${ts}`, `third_${ts}`]) {
      await page.fill('input[placeholder="Type a message…"]', msg);
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.locator("text=" + msg)).toBeVisible({ timeout: 5000 });
    }

    // All three should arrive at userB in order
    await expect(pageB.locator(`text=first_${ts}`)).toBeVisible({ timeout: 8000 });
    await expect(pageB.locator(`text=second_${ts}`)).toBeVisible({ timeout: 8000 });
    await expect(pageB.locator(`text=third_${ts}`)).toBeVisible({ timeout: 8000 });

    await ctxB.close();
  });

  test("bidirectional: both users can send and receive", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    await register(page, userA);

    await page.goto(`/messages/${userB.username}`);
    await pageB.goto(`/messages/${userA.username}`);

    await expect(page.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('input[placeholder="Type a message…"]')).toBeVisible({ timeout: 5000 });

    const ts = Date.now();
    const msgA = `from_A_${ts}`;
    const msgB = `from_B_${ts}`;

    // A sends to B
    await page.fill('input[placeholder="Type a message…"]', msgA);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(pageB.locator("text=" + msgA)).toBeVisible({ timeout: 8000 });

    // B replies to A
    await pageB.fill('input[placeholder="Type a message…"]', msgB);
    await pageB.getByRole("button", { name: "Send" }).click();
    await expect(page.locator("text=" + msgB)).toBeVisible({ timeout: 8000 });

    await ctxB.close();
  });
});
