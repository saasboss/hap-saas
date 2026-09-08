const { test, expect } = require('@playwright/test');

const widths = [320, 390, 430, 800];

for (const width of widths) {
  test(`single-screen Design is clear and responsive at ${width}px`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(String(err)));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu/design', { waitUntil: 'networkidle' });

    const design = page.locator('.design-compact-page');
    await expect(design).toBeVisible();
    await expect(page.getByText(/Step \d of 3/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0);

    // One real preview only. Layout choices are compact controls, not three more menus.
    await expect(design.locator('.draft-preview-panel')).toHaveCount(1);
    await expect(design.locator('.draft-preview-content .draft-menu')).toHaveCount(1);
    await expect(design.locator('[data-design-layout-preview]')).toHaveCount(0);
    await expect(design.locator('.design-layout-option')).toHaveCount(3);
    await expect(design.locator('.design-disclosure')).toHaveCount(3);

    for (const summary of await design.locator('.design-disclosure > summary').all()) {
      const box = await summary.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const btn of await design.locator('.design-savebar .btn').all()) {
      const box = await btn.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(43);
    }

    // The collapsed default view should need at most a short page scroll.
    const scroll = await page.locator('.content-scroll').evaluate(el => ({
      extra: el.scrollHeight - el.clientHeight,
      horizontal: el.scrollWidth - el.clientWidth,
    }));
    expect(scroll.extra).toBeLessThanOrEqual(240);
    expect(scroll.horizontal).toBeLessThanOrEqual(1);

    // Layout updates the one preview in place.
    await design.locator('.design-layout-option[data-value="editorial"]').click();
    await expect(design.locator('#design-layout-current')).toHaveText('Essential');
    await expect(design.locator('.draft-menu')).toHaveClass(/template-editorial/);
    await expect(design.locator('[data-essential-only]')).toBeVisible();

    await design.locator('.design-layout-option[data-value="grid"]').click();
    await expect(design.locator('#design-layout-current')).toHaveText('Gallery');
    await expect(design.locator('.draft-menu')).toHaveClass(/template-grid/);
    await expect(design.locator('[data-essential-only]')).toBeHidden();

    // Less-common controls stay behind concise disclosures and still update the preview.
    await design.locator('.design-disclosure').filter({ hasText: 'Brand' }).locator('summary').click();
    await design.locator('[data-key="palette"][data-value="indigo"]').click();
    await expect(design.locator('#design-brand-current')).toContainText('Indigo');
    await design.locator('.design-mode [data-value="dark"]').click();
    await expect(design.locator('#design-brand-current')).toContainText('Dark');
    await expect(design.locator('.draft-menu')).toHaveClass(/dark-menu/);

    await design.locator('.design-disclosure').filter({ hasText: 'Background' }).locator('summary').click();
    await design.locator('[data-key="background"][data-value="clean"]').click();
    await expect(design.locator('#design-background-current')).toHaveText('Clean');
    await expect(design.locator('.draft-menu')).toHaveClass(/bg-clean/);

    await design.locator('.design-disclosure').filter({ hasText: 'Fine-tune' }).locator('summary').click();
    await expect(design.locator('[data-design-field="typography"]')).toBeVisible();

    // Preview can expand without creating a second renderer.
    await design.getByRole('button', { name: 'Expand preview' }).click();
    await expect(design.locator('.draft-preview-content')).toHaveClass(/expanded/);
    await expect(design.locator('.draft-preview-content .draft-menu')).toHaveCount(1);

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      main: document.querySelector('.admin-main')?.scrollWidth - document.querySelector('.admin-main')?.clientWidth || 0,
      design: document.querySelector('.design-compact-page')?.scrollWidth - document.querySelector('.design-compact-page')?.clientWidth || 0,
    }));
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.main).toBeLessThanOrEqual(1);
    expect(overflow.design).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('Design Cancel discards draft and Save persists it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu/design', { waitUntil: 'networkidle' });
  let design = page.locator('.design-compact-page');

  // Default demo is Signature / Terra / Light / Paper. Change draft, then cancel it.
  await design.locator('.design-layout-option[data-value="grid"]').click();
  await design.locator('.design-disclosure').filter({ hasText: 'Brand' }).locator('summary').click();
  await design.locator('[data-key="palette"][data-value="indigo"]').click();
  await design.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('#menu-tab-items')).toHaveAttribute('aria-selected', 'true');

  await page.locator('#menu-tab-design').click();
  design = page.locator('.design-compact-page');
  await expect(design.locator('#design-layout-current')).toHaveText('Signature');
  await expect(design.locator('#design-brand-current')).toContainText('Terra');
  await expect(design.locator('#design-brand-current')).toContainText('Light');
  await expect(design.locator('#design-background-current')).toHaveText('Paper');

  // Save a real draft, then ensure a fresh Design draft reads the persisted settings.
  await design.locator('.design-layout-option[data-value="grid"]').click();
  await design.locator('.design-disclosure').filter({ hasText: 'Brand' }).locator('summary').click();
  await design.locator('[data-key="palette"][data-value="indigo"]').click();
  await design.locator('.design-mode [data-value="dark"]').click();
  await design.locator('.design-disclosure').filter({ hasText: 'Background' }).locator('summary').click();
  await design.locator('[data-key="background"][data-value="clean"]').click();
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
