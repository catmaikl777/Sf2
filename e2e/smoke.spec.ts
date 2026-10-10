import { test, expect } from '@playwright/test';

test('smoke: boot to menu', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Теневой Боец').first()).toBeVisible({ timeout: 10000 });
});
