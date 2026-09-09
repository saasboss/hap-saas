const { test, expect } = require('@playwright/test');

const viewports = [
  { width: 320, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 844 },
  { width: 800, height: 900 },
];

async function openDesign(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu/design');
  await page.locator('.design-compact-page').waitFor({ state: 'visible' });
}

for (const vp of viewports) {
  test(`Design density ${vp.width}px`, async ({ page }) => {
    await openDesign(page, vp.width, vp.height);

    const root = page.locator('.design-compact-page');
    await expect(root.locator('.draft-preview-panel')).toHaveCount(1);
    await expect(root.locator('.design-summary')).toHaveCount(0);
    await expect(root.locator('.eyebrow')).toHaveCount(0);
    await expect(root.locator('.design-layout-option')).toHaveCount(3);
    await expect(root.locator('.design-disclosure')).toHaveCount(3);

    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      phone: document.querySelector('.phone-app').scrollWidth - document.querySelector('.phone-app').clientWidth,
    }));
    expect(overflow.doc).toBeLessThanOrEqual(1);
    expect(overflow.phone).toBeLessThanOrEqual(1);

    const previewHeight = await root.locator('.draft-preview-content').evaluate(el => el.getBoundingClientRect().height);
    expect(previewHeight).toBeLessThanOrEqual(152);

    const hitTargets = await root.locator('.design-layout-option, .design-disclosure > summary, .design-savebar .btn, .draft-preview-panel .btn').evaluateAll(els =>
      els.map(el => ({ text: (el.textContent || '').trim(), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
    );
    for (const hit of hitTargets) {
      expect(hit.h, `${vp.width}px target ${hit.text}`).toBeGreaterThanOrEqual(43);
      expect(hit.w, `${vp.width}px target ${hit.text}`).toBeGreaterThanOrEqual(43);
    }

    const scroller = page.locator('.content-scroll');
    const scrollInfo = await scroller.evaluate(el => ({ extra: el.scrollHeight - el.clientHeight }));
    if (vp.width >= 390 && vp.width <= 430) expect(scrollInfo.extra).toBeLessThanOrEqual(80);
    if (vp.width === 320) expect(scrollInfo.extra).toBeLessThanOrEqual(150);

    if (vp.width === 390 || vp.width === 430) {
      const navTop = await page.locator('.admin-bottom-nav').evaluate(el => el.getBoundingClientRect().top);
      const rows = await root.locator('.design-disclosure > summary').evaluateAll(els => els.map(el => el.getBoundingClientRect().bottom));
      for (const bottom of rows) expect(bottom).toBeLessThanOrEqual(navTop + 2);
    }

    const brand = root.locator('.design-disclosure').filter({ hasText: 'Brand' });
    await brand.locator('summary').click();
    await expect(brand).toHaveAttribute('open', '');
    await expect(brand.locator('.design-mode')).toBeVisible();
    await brand.locator('summary').click();

    const background = root.locator('.design-disclosure').filter({ hasText: 'Background' });
    await background.locator('summary').click();
    await expect(background.locator('.design-background-grid')).toBeVisible();
    await background.locator('summary').click();

    const fine = root.locator('.design-disclosure').filter({ hasText: 'Fine-tune' });
    await fine.locator('summary').click();
    await expect(fine.locator('.design-fine-grid')).toBeVisible();

    await page.screenshot({ path: `test-results/design-density-${vp.width}.png`, fullPage: true });
  });
}

test('Design layout selection still updates live preview', async ({ page }) => {
  await openDesign(page, 390, 844);
  const essential = page.locator('.design-layout-option').filter({ hasText: 'Essential' });
  await essential.click();
  await expect(essential).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#design-layout-current')).toHaveText('Essential');
  await expect(page.locator('.draft-preview-panel')).toHaveCount(1);
});
