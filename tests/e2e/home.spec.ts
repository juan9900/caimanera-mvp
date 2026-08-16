import { test, expect } from "@playwright/test";

test("home page loads and shows the Caimanera hero", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Caimanera" })).toBeVisible();
  await expect(
    page.getByText("Consigue jugadores para tu próxima caimanera en Maracaibo.")
  ).toBeVisible();
});
