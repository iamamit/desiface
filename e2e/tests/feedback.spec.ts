import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Feedback", () => {
  test("feedback button is visible when logged in", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await expect(page.getByRole("button", { name: "Feedback" })).toBeVisible();
  });

  test("feedback button opens modal", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();

    await expect(page.getByRole("heading", { name: "Share feedback" })).toBeVisible();
    await expect(page.getByRole("button", { name: "General feedback" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Report a bug" })).toBeVisible();
  });

  test("feedback: submit general feedback shows success state", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();

    // Use placeholder-scoped selector to avoid matching the feed post textarea
    await page.locator('textarea[placeholder*="Tell us"]').fill("This is a test feedback message from Playwright.");
    await page.getByRole("button", { name: "Send feedback" }).click();

    await expect(page.locator("text=Thanks for your feedback!")).toBeVisible({ timeout: 5000 });
  });

  test("feedback: submit bug report", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();

    await page.getByRole("button", { name: "Report a bug" }).click();
    await page.locator('textarea[placeholder*="Describe"]').fill("Something broke when I clicked the like button.");
    await page.getByRole("button", { name: "Send feedback" }).click();

    await expect(page.locator("text=Thanks for your feedback!")).toBeVisible({ timeout: 5000 });
  });

  test("feedback: send button disabled while message is empty", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();

    const sendBtn = page.getByRole("button", { name: "Send feedback" });
    await expect(sendBtn).toBeDisabled();

    await page.locator('textarea[placeholder*="Tell us"]').fill("Something");
    await expect(sendBtn).toBeEnabled();
  });

  test("feedback: modal closes when clicking backdrop", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();
    await expect(page.getByRole("heading", { name: "Share feedback" })).toBeVisible();

    // Click the backdrop by targeting the top-left corner (outside the modal content)
    await page.mouse.click(5, 5);
    await expect(page.getByRole("heading", { name: "Share feedback" })).not.toBeVisible({ timeout: 3000 });
  });
});
