import { expect, test } from '@playwright/test';

test.describe('Signup flow', () => {
  test('creates an account and lands on the dashboard', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel(/^Password$/).fill('Str0ngPass');
    await page.getByLabel(/Confirm password/i).fill('Str0ngPass');
    await page.getByLabel(/I agree/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('shows an inline error for an invalid email', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill('nope');
    await page.getByLabel(/^Password$/).fill('Str0ngPass');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
