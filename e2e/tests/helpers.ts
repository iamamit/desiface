import type { Page } from "@playwright/test";

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function makeUser() {
  const id = uid();
  return {
    username: `tuser_${id}`,
    email: `tuser_${id}@test.com`,
    full_name: `Test User ${id}`,
  };
}

async function otpSignIn(page: Page, email: string) {
  // Pre-fetch OTP from backend to capture dev_otp before any UI request
  const otpResp = await page.request.post("http://localhost:8000/auth/request-otp", {
    data: { email },
  });
  const { dev_otp: otp } = await otpResp.json();

  await page.goto("/login");

  // Mock the frontend's request-otp call so it doesn't invalidate the OTP we just got
  await page.route("**/auth/request-otp", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ message: "OTP sent", dev_otp: otp }) })
  );

  await page.fill('input[type="email"]', email);
  await page.click('button[type="submit"]');
  await page.waitForSelector('input[inputmode="numeric"]');

  const digits = otp.split("");
  for (let i = 0; i < digits.length; i++) {
    await page.locator('input[inputmode="numeric"]').nth(i).fill(digits[i]);
  }
  await page.click('button[type="submit"]');
  await page.waitForURL("**/feed");
}

export async function register(page: Page, user: ReturnType<typeof makeUser>) {
  await otpSignIn(page, user.email);
  // Dismiss onboarding modal if shown for new users
  try {
    await page.getByRole("button", { name: "Skip for now" }).click({ timeout: 2000 });
  } catch {
    // Modal not shown or already dismissed — that's fine
  }
}

export async function login(page: Page, user: ReturnType<typeof makeUser>) {
  await otpSignIn(page, user.email);
}

export async function logout(page: Page) {
  // Clear all auth state: raw token, Zustand persist key, and cookie
  await page.evaluate(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth"); // Zustand persist key (name: "auth")
    document.cookie = "access_token=; path=/; max-age=0";
  });
  await page.goto("/login");
  await page.waitForURL("**/login");
}
