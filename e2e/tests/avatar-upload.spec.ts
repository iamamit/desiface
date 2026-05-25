import * as fs from "fs";
import * as path from "path";

import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

const PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Avatar upload", () => {
  test("profile page has edit profile button for owner", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible({ timeout: 5000 });
  });

  test("edit profile modal has avatar upload area", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: /edit profile/i }).click();

    // The avatar file input should be present in the modal
    const avatarInput = page.locator('input[type="file"]').first();
    await expect(avatarInput).toBeAttached({ timeout: 3000 });
  });

  test("uploading avatar shows preview in modal", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: /edit profile/i }).click();

    const tmpPath = path.join("/tmp", `avatar-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, Buffer.from(PNG_BASE64, "base64"));

    // Set avatar file input
    const avatarInput = page.locator('input[type="file"]').first();
    await avatarInput.setInputFiles(tmpPath);

    // A preview image should appear in the modal
    await expect(page.locator('img[alt="avatar"]')).toBeVisible({ timeout: 3000 });

    fs.unlinkSync(tmpPath);
  });

  test("saving profile with avatar updates the avatar URL via API", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    const token = await page.evaluate(() => localStorage.getItem("access_token"));

    const tmpPath = path.join("/tmp", `avatar-${Date.now()}.png`);
    fs.writeFileSync(tmpPath, Buffer.from(PNG_BASE64, "base64"));

    // Upload avatar via API directly
    const form = new FormData();
    const blob = new Blob([fs.readFileSync(tmpPath)], { type: "image/png" });
    form.append("file", blob, "avatar.png");

    const res = await page.request.post("http://localhost:8000/users/me/avatar", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: { file: { name: "avatar.png", mimeType: "image/png", buffer: fs.readFileSync(tmpPath) } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.avatar_url).toBeTruthy();
    expect(body.avatar_url).toContain("/uploads/");

    fs.unlinkSync(tmpPath);
  });
});
