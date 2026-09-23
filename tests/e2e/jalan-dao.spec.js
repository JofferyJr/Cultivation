test('v8.1.5 page module imports directly', async ({ page }) => {
  await page.goto('/Cultivation/v815-probe.html', { waitUntil: 'networkidle' });
  const output = await page.locator('#out').innerText();
  console.log('BC815_MODULE_PROBE', JSON.stringify(output));
  expect(output).toBe('OK 8.1.5');
});

const { test, expect } = require('@playwright/test');

test('standalone Boundless Cultivation 8.1.5 release flow works without SiteGPT', async ({ page }) => {
  const oldHostRequests = [];
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack || error.message));
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('request', request => {
    if (request.url().includes('jalan-dao-xianxia.jofferyjr.chatgpt.site')) {
      oldHostRequests.push(request.url());
    }
  });
  await page.route('**://jalan-dao-xianxia.jofferyjr.chatgpt.site/**', route => route.abort());

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });

  console.log('BC815_DIAG_TITLE', JSON.stringify(await page.title()));
  console.log('BC815_DIAG_PAGE_ERRORS', JSON.stringify(pageErrors));
  console.log('BC815_DIAG_CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  console.log('BC815_DIAG_HEAD', JSON.stringify((await page.locator('head').innerHTML()).slice(0, 3000)));
  console.log('BC815_DIAG_BODY', JSON.stringify((await page.locator('body').innerText()).slice(0, 1200)));

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
