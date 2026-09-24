const { test, expect } = require('@playwright/test');

test('standalone Boundless Cultivation 8.1.4 hydrates without SiteGPT', async ({ page }) => {
  const oldHostRequests = [];
  page.on('request', request => {
    if (request.url().includes('jalan-dao-xianxia.jofferyjr.chatgpt.site')) {
      oldHostRequests.push(request.url());
    }
  });
  await page.route('**://jalan-dao-xianxia.jofferyjr.chatgpt.site/**', route => route.abort());

  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Boundless Cultivation/i);
  await expect(page.getByText('Boundless Cultivation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Versi 8.1.4').first()).toBeVisible();

  const settings = page.getByRole('button', { name: 'Tetapan' }).first();
  await expect(settings).toBeVisible();
  await settings.click();
  const settingsDialog = page.getByRole('dialog');
  await expect(settingsDialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan & Export' })).toHaveCount(0);
  await settingsDialog.getByRole('tab', { name: /Permainan/ }).click();
  await expect(settingsDialog.locator('#bc-save-manager-panel')).toBeVisible();
  await expect(settingsDialog.locator('#bc-save-manager-panel')).toContainText('Simpan & Export');

  expect(oldHostRequests).toEqual([]);
});
