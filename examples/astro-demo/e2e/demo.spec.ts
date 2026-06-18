import { expect, test } from "@playwright/test";

test("renders the main Flowmark demo", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Inventory Dashboard" }),
  ).toBeVisible();

  const preview = page.locator(".flow-preview").first();
  await expect(preview.getByText("Ergonomic Keyboard")).toBeVisible();
  await expect(preview.getByText("In stock").first()).toBeVisible();
  await expect(page.getByText("Product inventory")).toBeVisible();
});

test("renders the @empty branch page", async ({ page }) => {
  await page.goto("/empty");

  await expect(
    page.getByRole("heading", { name: "Empty State" }),
  ).toBeVisible();
  await expect(
    page.locator(".flow-preview").getByText("No products found."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "The same inline Flowmark template renders the fallback branch when ctx.products is empty.",
    ),
  ).toBeVisible();
});
