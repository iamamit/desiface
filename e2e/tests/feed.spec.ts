import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

const POST_PLACEHOLDER = "Start a post";

test.describe("Feed", () => {
  test("create post: appears at top of feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    const content = `Hello from Playwright! ${Date.now()}`;
    await page.fill(`textarea[placeholder="${POST_PLACEHOLDER}"]`, content);
    await page.getByRole("button", { name: "Post" }).click();

    await expect(page.locator("text=" + content)).toBeVisible({ timeout: 5000 });
  });

  test("create post: clears textarea after posting", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.fill(`textarea[placeholder="${POST_PLACEHOLDER}"]`, "Test post content");
    await page.getByRole("button", { name: "Post" }).click();

    await expect(page.locator(`textarea[placeholder="${POST_PLACEHOLDER}"]`)).toHaveValue("", { timeout: 5000 });
  });

  test("like post: toggles like and updates count", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    // Create a post first
    const content = `Like test post ${Date.now()}`;
    await page.fill(`textarea[placeholder="${POST_PLACEHOLDER}"]`, content);
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator("text=" + content)).toBeVisible({ timeout: 5000 });

    const postCard = page.locator('[data-testid="post-card"]').filter({ hasText: content });
    const likeBtn = postCard.getByTestId("like-btn");
    const likeBadge = postCard.getByTestId("like-count-badge");

    // Like the post
    await likeBtn.click();
    await expect(likeBadge).toBeVisible({ timeout: 3000 });
    await expect(likeBadge).toContainText("1");

    // Unlike the post
    await likeBtn.click();
    await expect(likeBadge).not.toBeVisible({ timeout: 3000 });
  });

  test("comment: open comment box and submit a comment", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    const content = `Comment test post ${Date.now()}`;
    await page.fill(`textarea[placeholder="${POST_PLACEHOLDER}"]`, content);
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator("text=" + content)).toBeVisible({ timeout: 5000 });

    const postCard = page.locator('[data-testid="post-card"]').filter({ hasText: content });
    await postCard.getByTestId("comment-btn").click();

    const commentInput = postCard.locator('input[placeholder="Write a comment…"]');
    await expect(commentInput).toBeVisible({ timeout: 3000 });

    const commentText = `Test comment ${Date.now()}`;
    await commentInput.fill(commentText);
    await postCard.getByRole("button", { name: "Post", exact: true }).click();

    await expect(postCard.locator("text=" + commentText)).toBeVisible({ timeout: 5000 });
  });

  test("delete post: removes it from the feed", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    const content = `Delete me ${Date.now()}`;
    await page.fill(`textarea[placeholder="${POST_PLACEHOLDER}"]`, content);
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator("text=" + content)).toBeVisible({ timeout: 5000 });

    page.on("dialog", (dialog) => dialog.accept());
    const postCard = page.locator('[data-testid="post-card"]').filter({ hasText: content });
    await postCard.getByRole("button", { name: "Delete" }).click();

    await expect(page.locator("text=" + content)).not.toBeVisible({ timeout: 5000 });
  });
});
