import { test, expect } from "@playwright/test";
test("sign in, navigation, theme, drafts, public privacy and offline shell", async ({
  page,
  context,
  request,
}) => {
  await request.post("/api/auth/seed");
  const login = await request.post("/api/auth/login", {
    data: { email: "chioma@kinsous.com", password: "KinSous2024!" },
  });
  expect(login.ok()).toBeTruthy();
  await context.addCookies((await request.storageState()).cookies);
  const helpers = await request.get("/api/helpers");
  const payload = await helpers.json();
  expect(JSON.stringify(payload)).not.toContain("password_hash");
  expect(
    payload.helpers.every(
      (h: { email: unknown; phone: unknown }) =>
        h.email === null && h.phone === null,
    ),
  ).toBeTruthy();
  await page.goto("/bounties");
  await expect(
    page.getByRole("heading", { name: "Bounty Board" }),
  ).toBeVisible();
  await expect(page.getByText(/\d+ requests? available/)).toBeVisible({
    timeout: 30000,
  });
  // Let finite entrance transitions settle before visual capture.
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `test-results/bounties-${test.info().project.name}.png`,
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: "Messages", exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Post Bounty", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Post a bounty" });
  await expect(dialog).toBeVisible();
  await dialog.locator("input").first().fill("A saved grocery bounty");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Close bounty form" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Post Bounty", exact: true }).click();
  await expect(dialog.locator("input").first()).toHaveValue(
    "A saved grocery bounty",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.goto("/settings");
  await expect(
    page.getByText("Chioma Nwosu", { exact: true }).first(),
  ).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({
    path: `test-results/settings-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: /A little pause/ }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: /A little pause/ }),
  ).toHaveCount(0);
});
