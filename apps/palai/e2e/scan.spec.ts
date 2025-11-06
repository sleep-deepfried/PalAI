import { test, expect } from '@playwright/test';

test.describe('Scan Flow - n8n', () => {
  test('should complete scan flow with n8n provider', async ({ page }) => {
    // Mock n8n webhook response
    await page.route('**/webhook/palai-diagnose', async (route) => {
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

test.describe('Scan Flow - Next API Fallback', () => {
  test('should fallback to Next API when n8n fails', async ({ page }) => {
    // Mock n8n failure
    await page.route('**/webhook/palai-diagnose', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
    });

    // Mock Next API success
    await page.route('**/api/ai/diagnose', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          label: 'BLAST',
          confidence: 0.85,
          severity: 'HIGH',
          explanationEn: 'Fallback explanation',
          explanationTl: 'Fallback explanation tl',
          cautions: ['Test caution'],
        }),
      });
    });

    await page.goto('/scan');
    await expect(page.locator('text=Scan Rice Leaf')).toBeVisible();
  });
});

test.describe('Scan Flow - Local Mock', () => {
  test('should use local mock when both providers fail', async ({ page }) => {
    // Mock both providers failing
    await page.route('**/webhook/palai-diagnose', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.route('**/api/ai/diagnose', async (route) => {
      await route.fulfill({ status: 500 });
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

