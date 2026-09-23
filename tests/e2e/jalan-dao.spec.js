const { test, expect } = require('@playwright/test');

test('standalone Boundless Cultivation 8.1.5 release flow works without SiteGPT', async ({ page }) => {
  const oldHostRequests = [];
  page.on('request', request => {
    if (request.url().includes('jalan-dao-xianxia.jofferyjr.chatgpt.site')) {
      oldHostRequests.push(request.url());
    }
  });
  await page.route('**://jalan-dao-xianxia.jofferyjr.chatgpt.site/**', route => route.abort());

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });

  await expect(page).toHaveTitle(/Boundless Cultivation/i);
  await expect(page.getByText('Boundless Cultivation', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Versi 8.1.5').first()).toBeVisible();

  const widthOk = async () => {
    const dims = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dims.scroll).toBeLessThanOrEqual(dims.client + 1);
  };
  await widthOk();

  const talentButtons = page.locator('.multi-talent-grid button');
  await expect(talentButtons).toHaveCount(11);
  await talentButtons.filter({ hasText: 'True Love' }).click();
  await talentButtons.filter({ hasText: 'Genius' }).click();
  await talentButtons.filter({ hasText: 'Jujur' }).click();
  await expect(page.getByText('4/4 dipilih')).toBeVisible();

  const fifth = talentButtons.filter({ hasText: 'Berani' });
  await expect(fifth).toBeDisabled();
  await widthOk();

  const playerFace = page.getByRole('button', { name: 'Pilih Muka Pemain' }).first();
  await expect(playerFace).toBeVisible();
  await playerFace.click();

  const paper = page.getByRole('dialog', { name: 'Pilih Muka Pemain' });
  await expect(paper).toBeVisible();
  const otherFace = paper.locator('.bc815-paper-choice:not([aria-checked="true"])').first();
  await otherFace.click();
  await expect(paper).toBeVisible();
  await widthOk();

  await paper.getByRole('button', { name: 'Tutup kertas pemilihan' }).click();
  await expect(paper).toBeHidden();

  const age = page.locator('#starting-age');
  await age.fill('17');
  await age.blur();
  await expect(page.getByText('3/4 dipilih')).toBeVisible();
  await expect(talentButtons.filter({ hasText: 'True Love' })).toHaveCount(0);
  await widthOk();

  const settings = page.getByRole('button', { name: 'Tetapan' }).first();
  await settings.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  expect(oldHostRequests).toEqual([]);
});
