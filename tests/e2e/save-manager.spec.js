const { test, expect } = require('@playwright/test');

test('save manager supports slots, export and import', async ({ page }) => {
  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('jalan-dao-save', JSON.stringify({
      saveVersion: 29,
      gameVersion: '8.1.4',
      name: 'Li Yun',
      day: 42,
      realm: 2,
      realmPhase: 'Tahap Menengah',
      location: 'lembah_bunga_bulan'
    }));
  });
  await page.getByRole('button', { name: 'Simpan & Export' }).click();

  const dialog = page.getByRole('dialog', { name: 'Pengurus Simpanan' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('5 slot manual');
  await expect(dialog.locator('[data-role="active-summary"]')).toContainText('Li Yun');

  await dialog.getByLabel('Nama Slot 1').fill('Utama');
  await dialog.getByRole('button', { name: 'Simpan ke Slot 1' }).click();
  await expect(dialog.locator('article[data-slot="1"]')).toContainText('Li Yun');
  await expect(dialog.locator('article[data-slot="1"]')).toContainText('Utama');

  const downloadPromise = page.waitForEvent('download');
  await dialog.locator('button[data-action="export"][data-slot="1"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^boundless-cultivation-slot-1-/);

  await dialog.locator('#bc-save-import-slot').selectOption('2');
  await dialog.locator('#bc-save-file').setInputFiles({
    name: 'import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      saveVersion: 29,
      gameVersion: '8.1.4',
      name: 'Bing Xue',
      day: 9,
      realm: 1,
      location: 'utara'
    }))
  });
  await expect(dialog.locator('article[data-slot="2"]')).toContainText('Bing Xue');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('boundless-cultivation-save-slot-2')));
  expect(stored.slot).toBe(2);
  expect(stored.save.name).toBe('Bing Xue');
});
