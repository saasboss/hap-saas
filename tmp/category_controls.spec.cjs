const { test, expect } = require('@playwright/test');

const widths = [320, 390, 430, 800];

for (const width of widths) {
  test(`category controls stay compact and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4173/r/sofra/admin/menu', { waitUntil: 'networkidle' });

    const cards = page.locator('.category-admin');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const head = card.locator('.category-head-row');
      const copy = card.locator('.category-copy');
      const actions = card.locator('.category-actions');
      const star = card.locator('.cat-star');
      const more = card.locator('.category-more');

      const [headBox, copyBox, actionsBox, starBox, moreBox] = await Promise.all([
        head.boundingBox(), copy.boundingBox(), actions.boundingBox(), star.boundingBox(), more.boundingBox()
      ]);
      expect(headBox).not.toBeNull();
      expect(copyBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      expect(starBox.width).toBeGreaterThanOrEqual(43);
      expect(starBox.height).toBeGreaterThanOrEqual(43);
      expect(moreBox.width).toBeGreaterThanOrEqual(43);
      expect(moreBox.height).toBeGreaterThanOrEqual(43);
      expect(copyBox.x + copyBox.width).toBeLessThanOrEqual(actionsBox.x + 1);
      // The design target is a compact ~60–64px row; fractional browser layout can measure just over 64.
      expect(headBox.height).toBeLessThanOrEqual(65);

      const overflow = await card.evaluate(el => ({ sw: el.scrollWidth, cw: el.clientWidth }));
      expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 1);
    }

    const moreText = cards.first().locator('.category-more span');
    await expect(moreText).toBeAttached();
    const moreTextStyle = await moreText.evaluate(el => getComputedStyle(el));
    expect(moreTextStyle.width).toBe('1px');

    const quietChrome = await cards.nth(1).evaluate(el => {
      const star = getComputedStyle(el.querySelector('.cat-star'));
      const more = getComputedStyle(el.querySelector('.category-more'));
      return {
        starBorder: star.borderTopWidth,
        starShadow: star.boxShadow,
        moreBorder: more.borderTopWidth,
        moreShadow: more.boxShadow,
      };
    });
    expect(quietChrome.starBorder).toBe('0px');
    expect(quietChrome.moreBorder).toBe('0px');
    expect(quietChrome.starShadow).toBe('none');
    expect(quietChrome.moreShadow).toBe('none');

    // The global Menu toolbar keeps its own visible More label: the fix must be scoped.
    await expect(page.locator('.menu-tools-btn span')).toBeVisible();

    // Stress a category name without changing product state.
    const firstName = cards.first().locator('.category-name');
    await firstName.evaluate(el => {
      for (const node of [...el.childNodes]) {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = 'Very long seasonal starters and chef recommendations for tonight only';
      }
    });
    const longName = await firstName.boundingBox();
    const firstActions = await cards.first().locator('.category-actions').boundingBox();
    expect(longName.x + longName.width).toBeLessThanOrEqual(firstActions.x + 1);

    const pageOverflow = await page.evaluate(() => {
      const main = document.querySelector('.admin-main');
      return {
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        main: main ? main.scrollWidth - main.clientWidth : 0,
      };
    });
    expect(pageOverflow.document).toBeLessThanOrEqual(1);
    expect(pageOverflow.main).toBeLessThanOrEqual(1);
  });
}
