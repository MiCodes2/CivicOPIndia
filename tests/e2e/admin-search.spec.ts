import { test, expect } from '@playwright/test';

// These tests require a running dev server and a Supabase test instance with credentials
const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Admin search management (integration)', () => {
  test('load admin page and open search management', async ({ page }) => {
    // This test expects you to authenticate as an admin beforehand or set session cookie
    await page.goto(`${BASE}/admin/search`);
    await expect(page.locator('text=Search Management')).toBeVisible();
    await expect(page.locator('text=Synonyms')).toBeVisible();
    await expect(page.locator('text=Stopwords')).toBeVisible();
  });
});
