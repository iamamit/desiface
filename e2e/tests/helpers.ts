import type { Page } from "@playwright/test";

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function makeUser() {
  const id = uid();
  return {
    username: `tuser_${id}`,
    email: `tuser_${id}@test.com`,
    password: "TestPass123!",
    full_name: `Test User ${id}`,
  };
}

export async function register(page: Page, user: ReturnType<typeof makeUser>) {
  await page.goto("/register");
  await page.fill('input[placeholder="Priya Sharma"]', user.full_name);
  await page.fill('input[placeholder="priya_sharma"]', user.username);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/feed");
}

export async function login(page: Page, user: ReturnType<typeof makeUser>) {
  await page.goto("/login");
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/feed");
}

export async function logout(page: Page) {
  await page.locator("nav .group").hover();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
}
