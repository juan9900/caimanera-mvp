import { test, expect } from "@playwright/test";

test("home page loads and shows the Kancha hero", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Kancha" })).toBeVisible();
  await expect(
    page.getByText("Consigue jugadores para tu próxima caimanera en Maracaibo.")
  ).toBeVisible();
});
