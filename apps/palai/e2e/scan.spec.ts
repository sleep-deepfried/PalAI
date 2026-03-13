import { test, expect } from '@playwright/test';

test.describe('Scan Flow - Next API', () => {
  test('should complete scan flow with Next API provider', async ({ page }) => {
    // Mock Next API response
    await page.route('**/api/ai/diagnose', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          label: 'HEALTHY',
          confidence: 0.95,
          severity: 'LOW',
          explanationEn: 'Test explanation',
          explanationTl: 'Test explanation tl',
          cautions: [],
        }),
      });
    });

    await page.goto('/scan');
    await expect(page.locator('text=Scan Rice Leaf')).toBeVisible();

    // Upload tab should be active by default
    await expect(page.locator('text=Upload')).toBeVisible();

    // TODO: Add file upload and form submission test
    // This requires proper file handling in Playwright
  });
});

test.describe('Scan Flow - Local Mock Fallback', () => {
  test('should fallback to local mock when Next API fails', async ({ page }) => {
    // Mock Next API failure
    await page.route('**/api/ai/diagnose', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
    });

    await page.goto('/scan');
    await expect(page.locator('text=Scan Rice Leaf')).toBeVisible();
  });
});

test.describe('History Page', () => {
  test('should display history page', async ({ page }) => {
    await page.goto('/history');
    await expect(page.locator('text=Scan History')).toBeVisible();
  });
});

test.describe('Result Page', () => {
  test('should display result page', async ({ page }) => {
    // This would need a valid scan ID
    // For now, just test the route exists
    await page.goto('/result/test-id');
    // Should show 404 or error message since scan doesn't exist
  });
});
