import { expect, test } from "@playwright/test";

test("renders the main Flowmark demo", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Flowmark" })).toBeVisible();
  const preview = page.locator(".flow-preview").first();
  await expect(preview.getByText("Ergonomic Keyboard")).toBeVisible();
  await expect(preview.getByText("In stock", { exact: true })).toBeVisible();
  await expect(page.getByText("generated render function")).toBeVisible();
});

test("renders the @empty branch page", async ({ page }) => {
  await page.goto("/empty");

  await expect(
    page.getByRole("heading", { name: "Empty State" }),
  ).toBeVisible();
  await expect(
    page.locator(".flow-preview").getByText("No products found."),
  ).toBeVisible();
  await expect(page.getByText('"products": []')).toBeVisible();
});
