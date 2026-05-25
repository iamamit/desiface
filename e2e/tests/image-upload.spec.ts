import * as fs from "fs";
import * as path from "path";

import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Image uploads", () => {
  test("photo button triggers file input", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const photoBtn = page.getByRole("button", { name: "Photo" });
    await expect(photoBtn).toBeVisible();
  });

  test("selecting an image shows preview before posting", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");

    // Create a small PNG in-memory via a data URL written to a temp file
    const tmpPath = path.join("/tmp", `test-img-${Date.now()}.png`);
    // Minimal 1x1 red PNG (base64)
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
    fs.writeFileSync(tmpPath, Buffer.from(pngBase64, "base64"));

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpPath);

    // Preview image should appear
    await expect(page.locator('img[alt="preview"]')).toBeVisible({ timeout: 3000 });

    fs.unlinkSync(tmpPath);
  });

  test("remove button clears the image preview", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");

    const tmpPath = path.join("/tmp", `test-img-${Date.now()}.png`);
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
    fs.writeFileSync(tmpPath, Buffer.from(pngBase64, "base64"));

    await page.locator('input[type="file"]').setInputFiles(tmpPath);
    await expect(page.locator('img[alt="preview"]')).toBeVisible({ timeout: 3000 });

    // Click the × remove button
    await page.getByTestId("remove-image-btn").click();
    await expect(page.locator('img[alt="preview"]')).not.toBeVisible();

    fs.unlinkSync(tmpPath);
  });

  test("posting with image: post appears in feed with image", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");

    const tmpPath = path.join("/tmp", `test-img-${Date.now()}.png`);
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
    fs.writeFileSync(tmpPath, Buffer.from(pngBase64, "base64"));

    const content = `Image post ${Date.now()}`;
    await page.fill('textarea[placeholder="Start a post"]', content);
    await page.locator('input[type="file"]').setInputFiles(tmpPath);
    await expect(page.locator('img[alt="preview"]')).toBeVisible({ timeout: 3000 });

    await page.getByRole("button", { name: "Post", exact: true }).click();

    // Post card should appear with the content and an image
    const card = page.getByTestId("post-card").first();
    await expect(card.locator("text=" + content)).toBeVisible({ timeout: 5000 });
    await expect(card.locator('img[alt="post image"]')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpPath);
  });

  test("posting image-only (no text) creates a post", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto("/feed");

    const tmpPath = path.join("/tmp", `test-img-${Date.now()}.png`);
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
    fs.writeFileSync(tmpPath, Buffer.from(pngBase64, "base64"));

    await page.locator('input[type="file"]').setInputFiles(tmpPath);
    await expect(page.locator('img[alt="preview"]')).toBeVisible({ timeout: 3000 });

    // Post button should be visible even without text
    await page.getByRole("button", { name: "Post", exact: true }).click();

    await expect(page.getByTestId("post-card").first().locator('img[alt="post image"]')).toBeVisible({ timeout: 5000 });

    fs.unlinkSync(tmpPath);
  });
});
