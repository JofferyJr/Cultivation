const { test, expect } = require('@playwright/test');

test('save manager lives inside Settings and supports slots, export and import', async ({ page }) => {
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

  await expect(page.getByRole('button', { name: 'Simpan & Export' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Simpan$/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tetapan' }).first().click();

  const settings = page.getByRole('dialog');
  await settings.getByRole('tab', { name: /Permainan/ }).click();

  const panel = settings.locator('#bc-save-manager-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Simpan & Export');
  await expect(panel).toContainText('5 slot manual');
  await expect(panel.locator('[data-role="active-summary"]')).toContainText('Li Yun');

  await panel.getByLabel('Nama Slot 1').fill('Utama');
  await panel.getByRole('button', { name: 'Simpan ke Slot 1' }).click();
  await expect(panel.locator('article[data-slot="1"]')).toContainText('Li Yun');
  await expect(panel.getByLabel('Nama Slot 1')).toHaveValue('Utama');

  const downloadPromise = page.waitForEvent('download');
  await panel.locator('button[data-action="export"][data-slot="1"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^boundless-cultivation-slot-1-/);

  await panel.locator('#bc-save-import-slot').selectOption('2');
  await panel.locator('#bc-save-file').setInputFiles({
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
  await expect(panel.locator('article[data-slot="2"]')).toContainText('Bing Xue');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('boundless-cultivation-save-slot-2')));
  expect(stored.slot).toBe(2);
  expect(stored.save.name).toBe('Bing Xue');
});

test('loading a slot restores the saved active tab and map view', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('jalan-dao-save', JSON.stringify({
      saveVersion: 30,
      gameVersion: '8.1.5',
      name: 'Li Yun',
      gender: 'Lelaki',
      startingAge: 18,
      talents: ['Tekun'],
      day: 42,
      realm: 2,
      realmPhase: 'Tahap Menengah',
      mapView: 'world',
      activeTab: 'inventory'
    }));
    window.__boundlessLoadCurrent();
  });

  const inventoryTab = page.getByRole('tab', { name: /Inventori/ });
  const worldTab = page.getByRole('tab', { name: /Dunia/ });
  await expect(inventoryTab).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Tetapan' }).first().click();
  const settings = page.getByRole('dialog');
  await settings.getByRole('tab', { name: /Permainan/ }).click();
  const panel = settings.locator('#bc-save-manager-panel');
  await panel.getByRole('button', { name: 'Simpan ke Slot 1' }).click();
  await page.keyboard.press('Escape');

  await worldTab.click();
  await expect(worldTab).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Tetapan' }).first().click();
  const settingsAgain = page.getByRole('dialog');
  await settingsAgain.getByRole('tab', { name: /Permainan/ }).click();
  await settingsAgain.locator('#bc-save-manager-panel').locator('button[data-action="load"][data-slot="1"]').click();
  await page.keyboard.press('Escape');

  await expect(inventoryTab).toHaveAttribute('aria-selected', 'true');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('boundless-cultivation-save-slot-1')));
  expect(saved.save.activeTab).toBe('inventory');
  expect(saved.save.mapView).toBe('world');
});
