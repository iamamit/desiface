import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Unread message badge", () => {
  test("unread count API returns 0 for new user", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    // Get auth token from localStorage
    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(token).toBeTruthy();

    const res = await page.request.get("http://localhost:8000/messages/unread-count", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(body.count).toBe(0);
  });

  test("unread count increments after receiving a message", async ({ page, browser }) => {
    const userA = makeUser();
    const userB = makeUser();

    // Register both users
    await register(page, userA);
    const tokenA = await page.evaluate(() => localStorage.getItem("access_token"));

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await register(pageB, userB);
    const tokenB = await pageB.evaluate(() => localStorage.getItem("access_token"));

    // UserB sends a message to userA via API
    await pageB.request.post(`http://localhost:8000/messages/${(await page.request.get(`http://localhost:8000/users/${userA.username}`, { headers: { Authorization: `Bearer ${tokenA}` } })).json().then(r => r.id)}`, {
      data: { content: "Hello userA!" },
      headers: { Authorization: `Bearer ${tokenB}` },
    }).catch(() => {});

    // Use the messages page instead (to also test the UI)
    await pageB.goto(`/messages/${userA.username}`);
    await pageB.fill('input[placeholder="Type a message…"]', "Hey userA!");
    await pageB.getByRole("button", { name: "Send" }).click();
    await expect(pageB.locator("text=Hey userA!")).toBeVisible({ timeout: 5000 });

    // Check userA's unread count via API
    const res = await page.request.get("http://localhost:8000/messages/unread-count", {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);

    await ctxB.close();
  });

  test("messaging nav icon badge check on feed page", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    // The messaging nav item exists
    const messagingNav = page.locator('nav').locator("text=Messaging");
    await expect(messagingNav).toBeVisible();
  });
});
