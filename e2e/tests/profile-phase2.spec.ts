import { expect, test } from "@playwright/test";

import { makeUser, register } from "./helpers";

test.describe("Profile Phase 2 — Edit modal tabs", () => {
  test("modal has four tabs: Basic info, Experience, Education, Skills", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    await expect(page.getByRole("button", { name: "Basic info" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Experience" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Education" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Skills" })).toBeVisible();
  });

  test("Basic info tab: sets headline and displays it on profile", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    const headline = `Software Engineer at Desiface ${Date.now()}`;
    await page.locator('input[placeholder="e.g. Software Engineer at Desiface"]').fill(headline);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("profile-headline")).toContainText(headline, { timeout: 5000 });
  });

  test("Basic info tab: sets location and displays it on profile", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    await page.locator('input[placeholder="e.g. Berlin, Germany"]').fill("Berlin, Germany");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("profile-location")).toContainText("Berlin, Germany", { timeout: 5000 });
  });

  test("Basic info tab: cover photo upload UI is visible", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    await expect(page.getByTestId("cover-photo-section")).toBeVisible();
    await expect(page.getByTestId("cover-input")).toBeAttached();
  });

  test("Experience tab: can add a work experience entry and save it", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Experience" }).click();

    await page.getByTestId("add-experience").click();

    await page.getByTestId("exp-title-0").fill("Software Engineer");
    await page.getByTestId("exp-company-0").fill("Desiface GmbH");
    await page.locator('input[type="month"]').first().fill("2024-01");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("experience-section")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Software Engineer")).toBeVisible();
    await expect(page.locator("text=Desiface GmbH")).toBeVisible();
  });

  test("Experience tab: current job hides end date field", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Experience" }).click();

    await page.getByTestId("add-experience").click();

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    const endDateInput = page.locator('input[type="month"]').nth(1);
    await expect(endDateInput).toBeDisabled();
  });

  test("Experience tab: can remove an experience entry", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Experience" }).click();

    await page.getByTestId("add-experience").click();
    await expect(page.getByTestId("exp-title-0")).toBeVisible();

    // Click the × remove button for the first entry
    await page.getByTestId("remove-exp-0").click();
    await expect(page.getByTestId("exp-title-0")).not.toBeVisible();
  });

  test("Education tab: can add an education entry and save it", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Education" }).click();

    await page.getByTestId("add-education").click();

    await page.getByTestId("edu-school-0").fill("Technical University of Berlin");
    await page.locator('input[type="month"]').first().fill("2018-09");
    await page.locator('input[type="month"]').nth(1).fill("2022-06");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("education-section")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Technical University of Berlin")).toBeVisible();
  });

  test("Skills tab: can add and remove skills", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Skills" }).click();

    await page.getByTestId("skill-input").fill("TypeScript");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByTestId("skill-input").fill("Python");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.locator("text=TypeScript")).toBeVisible();
    await expect(page.locator("text=Python")).toBeVisible();

    // Remove TypeScript
    await page.getByTestId("remove-skill-TypeScript").click();
    await expect(page.locator("text=TypeScript")).not.toBeVisible();
    await expect(page.locator("text=Python")).toBeVisible();
  });

  test("Skills tab: pressing Enter adds a skill", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Skills" }).click();

    await page.getByTestId("skill-input").fill("React");
    await page.getByTestId("skill-input").press("Enter");

    await expect(page.locator("text=React")).toBeVisible();
  });

  test("Skills tab: skills are saved and shown in profile skills section", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Skills" }).click();

    await page.getByTestId("skill-input").fill("FastAPI");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("skills-section")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=FastAPI")).toBeVisible();
  });

  test("modal closes on cancel without saving changes", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    await page.locator('input[placeholder="e.g. Software Engineer at Desiface"]').fill("Should not be saved");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByTestId("edit-profile-modal")).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Should not be saved")).not.toBeVisible();
  });

  test("headline and location appear in LeftSidebar after save", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();

    await page.locator('input[placeholder="e.g. Software Engineer at Desiface"]').fill("Frontend Dev");
    await page.locator('input[placeholder="e.g. Berlin, Germany"]').fill("Munich, Germany");
    await page.getByRole("button", { name: "Save" }).click();

    // Navigate to feed to see the sidebar
    await page.goto("/feed");
    await expect(page.locator("text=Frontend Dev")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Munich, Germany")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Profile Phase 2 — display sections", () => {
  test("experience section not shown when empty", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByTestId("experience-section")).not.toBeVisible();
  });

  test("education section not shown when empty", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByTestId("education-section")).not.toBeVisible();
  });

  test("skills section not shown when empty", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await expect(page.getByTestId("skills-section")).not.toBeVisible();
  });

  test("cover gradient is shown when no cover photo set", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    // The gradient div should be present when no cover_url
    await expect(page.locator(".bg-gradient-to-r").first()).toBeVisible();
  });

  test("experience shows Present for current jobs", async ({ page }) => {
    const user = makeUser();
    await register(page, user);

    await page.goto(`/profile/${user.username}`);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Experience" }).click();

    await page.getByTestId("add-experience").click();
    await page.getByTestId("exp-title-0").fill("CTO");
    await page.getByTestId("exp-company-0").fill("My Startup");
    await page.locator('input[type="month"]').first().fill("2023-06");
    await page.locator('input[type="checkbox"]').first().check();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.locator("text=Present")).toBeVisible({ timeout: 5000 });
  });
});
