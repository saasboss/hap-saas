const { test, expect } = require('@playwright/test');
const fs = require('fs');

const widths = [320, 390, 430, 800];
fs.mkdirSync('test-results/screens', { recursive: true });

for (const width of widths) {
  test(`Design single-screen default and interactions at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${String(err)}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
    });

    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu/design', { waitUntil: 'networkidle' });

    const design = page.locator('.design-compact-page');
    await expect(design).toBeVisible();

    // Old Design wizard/review controls must be gone. Page-level navigation may still have its own Back control.
    await expect(design.getByText(/Step \d of 3/)).toHaveCount(0);
    await expect(design.locator('[data-action="design-step"]')).toHaveCount(0);
    await expect(design.getByRole('button', { name: 'Continue' })).toHaveCount(0);
    await expect(design.getByText('Review your design')).toHaveCount(0);

    // One real preview, three compact layout choices, three collapsed disclosures.
    await expect(design.locator('.draft-preview-panel')).toHaveCount(1);
    await expect(design.locator('.draft-preview-content .draft-menu')).toHaveCount(1);
    await expect(design.locator('[data-design-layout-preview]')).toHaveCount(0);
    await expect(design.locator('.design-layout-option')).toHaveCount(3);
    await expect(design.locator('.design-disclosure')).toHaveCount(3);
    await expect(design.locator('.design-disclosure[open]')).toHaveCount(0);

    // The default editor should require only a short scroll and never horizontal overflow.
    const geometry = await page.evaluate(() => {
      const scroll = document.querySelector('.content-scroll');
      const root = document.querySelector('.design-compact-page');
      return {
        extraScroll: scroll ? Math.max(0, scroll.scrollHeight - scroll.clientHeight) : null,
        scrollX: scroll ? Math.max(0, scroll.scrollWidth - scroll.clientWidth) : null,
        documentX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        rootX: root ? Math.max(0, root.scrollWidth - root.clientWidth) : null,
      };
    });
    expect(geometry.extraScroll).not.toBeNull();
    expect(geometry.extraScroll).toBeLessThanOrEqual(320);
    expect(geometry.scrollX).toBeLessThanOrEqual(1);
    expect(geometry.documentX).toBeLessThanOrEqual(1);
    expect(geometry.rootX).toBeLessThanOrEqual(1);

    for (const summary of await design.locator('.design-disclosure > summary').all()) {
      const box = await summary.boundingBox();
      expect(box).not.toBeNull();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const btn of await design.locator('.design-savebar .btn').all()) {
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // Capture the actual default compact screen before expanding anything.
    await page.screenshot({ path: `test-results/screens/design-${width}.png`, fullPage: true });

    // Layout changes update the single preview in place.
    await design.locator('.design-layout-option[data-value="editorial"]').click();
    await expect(design.locator('#design-layout-current')).toHaveText('Essential');
    await expect(design.locator('.draft-menu')).toHaveClass(/template-editorial/);
    expect(await design.locator('[data-essential-only]').evaluate((el) => el.hidden)).toBe(false);

    await design.locator('.design-layout-option[data-value="grid"]').click();
    await expect(design.locator('#design-layout-current')).toHaveText('Gallery');
    await expect(design.locator('.draft-menu')).toHaveClass(/template-grid/);
    expect(await design.locator('[data-essential-only]').evaluate((el) => el.hidden)).toBe(true);

    // Secondary controls stay behind disclosures and update the same preview.
    const brand = design.locator('.design-disclosure').filter({ has: page.getByText('Brand', { exact: true }) });
    await brand.locator('summary').click();
    await expect(brand).toHaveAttribute('open', '');
    await brand.locator('[data-key="palette"][data-value="indigo"]').click();
    await expect(design.locator('#design-brand-current')).toContainText('Indigo');
    await brand.locator('.design-mode [data-value="dark"]').click();
    await expect(design.locator('#design-brand-current')).toContainText('Dark');
    await expect(design.locator('.draft-menu')).toHaveClass(/dark-menu/);

    const background = design.locator('.design-disclosure').filter({ has: page.getByText('Background', { exact: true }) });
    await background.locator('summary').click();
    await background.locator('[data-key="background"][data-value="clean"]').click();
    await expect(design.locator('#design-background-current')).toHaveText('Clean');
    await expect(design.locator('.draft-menu')).toHaveClass(/bg-clean/);

    const fine = design.locator('.design-disclosure').filter({ has: page.getByText('Fine-tune', { exact: true }) });
    await fine.locator('summary').click();
    await expect(fine.locator('[data-design-field="typography"]')).toBeVisible();

    // Preview expands without creating a second renderer.
    await design.getByRole('button', { name: 'Expand preview' }).click();
    await expect(design.locator('.draft-preview-content')).toHaveClass(/expanded/);
    await expect(design.locator('.draft-preview-content .draft-menu')).toHaveCount(1);

    const overflowAfter = await page.evaluate(() => ({
      documentX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      mainX: Math.max(0, (document.querySelector('.admin-main')?.scrollWidth || 0) - (document.querySelector('.admin-main')?.clientWidth || 0)),
      designX: Math.max(0, (document.querySelector('.design-compact-page')?.scrollWidth || 0) - (document.querySelector('.design-compact-page')?.clientWidth || 0)),
    }));
    expect(overflowAfter.documentX).toBeLessThanOrEqual(1);
    expect(overflowAfter.mainX).toBeLessThanOrEqual(1);
    expect(overflowAfter.designX).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('Design Cancel discards draft and Save persists it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu/design', { waitUntil: 'networkidle' });
  let design = page.locator('.design-compact-page');

  await design.locator('.design-layout-option[data-value="grid"]').click();
  let brand = design.locator('.design-disclosure').filter({ has: page.getByText('Brand', { exact: true }) });
  await brand.locator('summary').click();
  await brand.locator('[data-key="palette"][data-value="indigo"]').click();
  await design.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#menu-tab-items')).toHaveAttribute('aria-selected', 'true');

  await page.locator('#menu-tab-design').click();
  design = page.locator('.design-compact-page');
  await expect(design.locator('#design-layout-current')).toHaveText('Signature');
  await expect(design.locator('#design-brand-current')).toContainText('Terra');
  await expect(design.locator('#design-brand-current')).toContainText('Light');
  await expect(design.locator('#design-background-current')).toHaveText('Paper');

  await design.locator('.design-layout-option[data-value="grid"]').click();
  brand = design.locator('.design-disclosure').filter({ has: page.getByText('Brand', { exact: true }) });
  await brand.locator('summary').click();
  await brand.locator('[data-key="palette"][data-value="indigo"]').click();
  await brand.locator('.design-mode [data-value="dark"]').click();
  const background = design.locator('.design-disclosure').filter({ has: page.getByText('Background', { exact: true }) });
  await background.locator('summary').click();
  await background.locator('[data-key="background"][data-value="clean"]').click();
  await design.getByRole('button', { name: 'Save design' }).click();

  await expect(page.getByText('Design saved')).toBeVisible();
  design = page.locator('.design-compact-page');
  await expect(design.locator('#design-layout-current')).toHaveText('Gallery');
  await expect(design.locator('#design-brand-current')).toContainText('Indigo');
  await expect(design.locator('#design-brand-current')).toContainText('Dark');
  await expect(design.locator('#design-background-current')).toHaveText('Clean');
  await expect(design.locator('.draft-menu')).toHaveClass(/template-grid/);
  await expect(design.locator('.draft-menu')).toHaveClass(/dark-menu/);
  await expect(design.locator('.draft-menu')).toHaveClass(/bg-clean/);
});
