const { test, expect } = require('@playwright/test');

async function noHorizontalOverflow(page) { return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); }

test('v8.1.5 talents, True Love and portrait paper remain responsive', async ({ page }) => {
  page.on('pageerror', error => console.log('PAGEERROR', error.message, error.stack || ''));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE_ERROR', msg.text()); });
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });
  await expect(page.getByText('Versi 8.1.5').first()).toBeVisible();
  const creationShellWidth = await page.locator('.bc-creation-shell').evaluate(el => el.getBoundingClientRect().width);
  expect(creationShellWidth).toBeGreaterThan(1200);
  expect(await noHorizontalOverflow(page)).toBe(true);
  const talentGroup = page.locator('.multi-talent-group');
  const talentGrid = talentGroup.locator('.multi-talent-grid');
  await expect(talentGrid).toBeVisible();
  await expect(talentGroup.getByText('1/4 dipilih', { exact: true })).toBeVisible();
  let trueLove = talentGrid.locator('button').filter({ hasText: 'True Love' });
  const honest = talentGrid.locator('button').filter({ hasText: 'Jujur' });
  await trueLove.click();
  await honest.click();
  await expect(trueLove).toHaveAttribute('aria-pressed', 'true');
  await expect(honest).toHaveAttribute('aria-pressed', 'true');
  const age = page.locator('#starting-age');
  await age.fill('17');
  await expect(talentGrid.locator('button').filter({ hasText: 'True Love' })).toHaveCount(0);
  await expect(honest).toHaveAttribute('aria-pressed', 'true');
  await age.fill('18');
  trueLove = talentGrid.locator('button').filter({ hasText: 'True Love' });
  await trueLove.click();
  const loyal = talentGrid.locator('button').filter({ hasText: 'Setia' });
  await loyal.click();
  await expect(talentGroup.getByText('4/4 dipilih', { exact: true })).toBeVisible();
  const greedy = talentGrid.locator('button').filter({ hasText: 'Tamak' });
  await expect(greedy).toBeDisabled();
  await loyal.click();
  await expect(talentGroup.getByText('3/4 dipilih', { exact: true })).toBeVisible();
  await expect(greedy).toBeEnabled();
  const playerPaperButton = page.getByRole('button', { name: 'Pilih Muka Pemain' });
  await expect(playerPaperButton).toBeVisible();
  await playerPaperButton.click();
  const paper = page.locator('#bc-portrait-paper');
  await expect(paper).toBeVisible();
  const paperWidth = await paper.evaluate(el => el.getBoundingClientRect().width);
  expect(paperWidth).toBeGreaterThan(1200);
  await expect(paper.getByText('Kertas Pemilihan Muka')).toBeVisible();
  await expect(paper.getByRole('heading', { name: 'Keluarga' })).toBeVisible();
  await expect(paper.getByRole('heading', { name: 'Orang Awam' })).toBeVisible();
  await expect(paper.getByText('Pemuda II', { exact: true })).toHaveCount(0);
  for (const n of [8,12,14,16,20,23,28,32,40,42,44,50,51,56,62,65,59,71,74,93,97,99,41,45]) {
    await expect(paper.getByText(`Wajah Awam ${n}`, { exact: true })).toHaveCount(0);
  }
  for (const n of [1,2,3,4,8,9,12,13]) {
    await expect(paper.getByText(`Wajah Sekte ${n}`, { exact: true })).toHaveCount(0);
  }
  const firstPortraitImage = paper.locator('.bc-portrait-choice img').first();
  await expect(firstPortraitImage).toBeVisible();
  expect(await firstPortraitImage.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await paper.locator('.bc-portrait-choice').first().click();
  await expect(paper).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
  let columns = await paper.locator('.portrait-paper-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(columns).toBe(6);
  await page.setViewportSize({ width: 800, height: 900 });
  columns = await paper.locator('.portrait-paper-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(columns).toBe(4);
  expect(await noHorizontalOverflow(page)).toBe(true);
  await page.setViewportSize({ width: 640, height: 900 });
  columns = await paper.locator('.portrait-paper-grid').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(columns).toBe(2);
  expect(await noHorizontalOverflow(page)).toBe(true);
  await paper.getByRole('button', { name: 'Tutup Kertas Pemilihan Muka' }).click();
  await expect(paper).not.toBeVisible();
  await page.setViewportSize({ width: 1366, height: 900 });
  const partnerButton = page.getByRole('button', { name: 'Pilih Muka Pasangan' });
  await expect(partnerButton).toBeVisible();
  await partnerButton.click();
  await expect(paper).toBeVisible();
  await paper.locator('.bc-portrait-choice').first().click();
  await expect(paper).toBeVisible();
  expect(await noHorizontalOverflow(page)).toBe(true);
});

test('built-in background music asset and settings option are available', async ({ page, request }) => {
  const response = await request.get('/Cultivation/assets/music/ni-tian-xing-loop.ogg');
  expect(response.ok()).toBe(true);
  expect((await response.body()).length).toBeGreaterThan(5000);

  await page.goto('/Cultivation/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Tetapan' }).first().click();
  const settings = page.getByRole('dialog');
  await settings.getByRole('tab', { name: /Permainan/ }).click();
  const select = settings.locator('#bc-music-select');
  await expect(select).toBeVisible();
  await expect(select.locator('option[value="builtin"]')).toContainText('Ni Tian Xing');
  await expect(select).toHaveValue('builtin');
});
