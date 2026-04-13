import { test, expect } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("page bienvenue se charge", async ({ page }) => {
    await page.goto("/bienvenue");
    await expect(page.locator("h1")).toContainText("Recommandez");
    await expect(page.locator("text=Devenir Ambassadeur")).toBeVisible();
  });

  test("page rejoindre se charge", async ({ page }) => {
    await page.goto("/rejoindre");
    await expect(page.locator("h1")).toContainText("Devenez ambassadeur");
    await expect(page.locator("text=Créer mon compte")).toBeVisible();
  });

  test("page rejoindre avec code parrainage", async ({ page }) => {
    await page.goto("/rejoindre?code=NEG-TEST");
    await expect(page.locator("text=NEG-TEST")).toBeVisible();
  });

  test("page connexion se charge", async ({ page }) => {
    await page.goto("/auth/connexion");
    await expect(page.locator("text=Connexion")).toBeVisible();
  });

  test("page mentions légales se charge", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page).toHaveTitle(/La Brie|The Club/i);
  });

  test("page CGU se charge", async ({ page }) => {
    await page.goto("/cgu");
    await expect(page).toHaveTitle(/La Brie|The Club/i);
  });
});

test.describe("Redirections", () => {
  test("page d'accueil redirige vers connexion si non connecté", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/connexion/);
  });

  test("portail redirige vers connexion si non connecté", async ({ page }) => {
    await page.goto("/portail/tableau-de-bord");
    await expect(page).toHaveURL(/connexion/);
  });

  test("admin redirige vers connexion si non connecté", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/connexion/);
  });
});

test.describe("Responsive", () => {
  test("page bienvenue responsive mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/bienvenue");
    // Le hero doit être visible
    await expect(page.locator("h1")).toBeVisible();
    // Les boutons CTA doivent être visibles
    await expect(page.locator("text=Rejoindre le programme")).toBeVisible();
  });

  test("page rejoindre formulaire visible sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/rejoindre");
    // Le formulaire doit être visible
    await expect(page.locator("input[placeholder*='Prénom']")).toBeVisible();
    await expect(page.locator("input[placeholder*='Nom']")).toBeVisible();
  });
});
