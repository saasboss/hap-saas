import { chromium } from 'playwright';

const baseUrl = process.env.HAP_URL || 'http://127.0.0.1:4173';
const widths = [320, 390, 430];
const layouts = [
  ['modern', { header: 'compact', categoryBar: 'pill', images: 'soft', typography: 'mixed', radius: 'medium' }],
  ['editorial', { header: 'centered', categoryBar: 'underline', images: 'square', typography: 'serif', radius: 'low', thumbnails: false }],
  ['grid', { header: 'minimal', categoryBar: 'soft', images: 'soft', typography: 'mixed', radius: 'high' }],
];
const treatments = [
  ['framed', 'framed'],
  ['ribbon', 'ribbon'],
  ['offer', 'band'],
];
const storageKey = 'hap.restaurant.sofra.v1';

function intersects(a, b, tolerance = 0.5) {
  if (!a || !b) return false;
  return (
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > tolerance &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > tolerance
  );
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function activeCategories(state) {
  const menu = (state.menus || []).find(m => m.id === state.activeMenuId) || (state.menus || [])[0];
  if (!menu) throw new Error('No active menu in persisted HAP state');
  return menu.categories || [];
}

function clearPromotions(state) {
  for (const category of activeCategories(state)) {
    category.promotion = { active: false };
    for (const item of category.items || []) item.promotion = { active: false };
  }
}

function applyLayout(state, id, defaults) {
  state.theme = 'light';
  state.appearance = { ...state.appearance, ...defaults, template: id, mode: 'light' };
}

function itemCase(base, layoutId, defaults, style) {
  const state = clone(base);
  clearPromotions(state);
  applyLayout(state, layoutId, defaults);
  const categories = activeCategories(state);
  const category = categories.find(c => (c.items || []).some(i => i.id === 'truffle-burger')) || categories[0];
  const item = (category.items || []).find(i => i.id === 'truffle-burger') || category.items[0];
  item.promotion = {
    active: true,
    mode: 'now',
    startAt: Date.now() - 60_000,
    endAt: null,
    days: [0,1,2,3,4,5,6],
    from: '17:00',
    to: '23:00',
    intensity: 'normal',
    label: "Tonight's Pick",
    style,
    wasPrice: null,
    terms: style === 'offer' ? 'Today only' : '',
  };
  return { state, itemId: item.id };
}

function categoryCase(base, layoutId, defaults, style) {
  const state = clone(base);
  clearPromotions(state);
  applyLayout(state, layoutId, defaults);
  const categories = activeCategories(state);
  const category = categories.find(c => c.id === 'desserts') || categories[0];
  category.promotion = {
    active: true,
    mode: 'now',
    startAt: Date.now() - 60_000,
    endAt: null,
    days: [0,1,2,3,4,5,6],
    from: '17:00',
    to: '23:00',
    label: 'Featured tonight',
    style,
    tint: 'brand',
    terms: '',
  };
  return { state, categoryId: category.id };
}

async function rects(page, rootSelector, selectors) {
  return page.locator(rootSelector).evaluate((root, selectors) => {
    const visibleRect = selector => {
      const el = root.querySelector(selector);
      if (!el) return null;
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || r.width === 0 || r.height === 0) return null;
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    return Object.fromEntries(Object.entries(selectors).map(([name, selector]) => [name, visibleRect(selector)]));
  }, selectors);
}

async function seed(page, state) {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ storageKey, state }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem('hap.guest.v1', JSON.stringify({ language: 'English' }));
  }, { storageKey, state });
  await page.goto(`${baseUrl}/menu/sofra`, { waitUntil: 'networkidle' });
  await page.locator('.public-root').waitFor({ state: 'visible' });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const failures = [];
const passed = [];

try {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const themeToggle = page.locator('[data-action="theme-toggle"]');
  await themeToggle.click();
  await page.locator('[data-action="theme-toggle"]').click();
  const raw = await page.evaluate(key => localStorage.getItem(key), storageKey);
  if (!raw) throw new Error('Could not obtain default persisted HAP state');
  const baseState = JSON.parse(raw);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const [layoutId, defaults] of layouts) {
      for (const [itemStyle, categoryStyle] of treatments) {
        {
          const { state, itemId } = itemCase(baseState, layoutId, defaults, itemStyle);
          await seed(page, state);
          const root = `[data-item-id="${itemId}"]`;
          const r = await rects(page, root, {
            title: '.product-copy h3',
            price: '.product-price',
            badges: '.badge-row',
            ribbon: '.item-promo-ribbon',
            notch: '.promo-notch',
            strip: '.promo-strip-label',
          });
          const decoration = r.ribbon || r.notch || r.strip;
          const pairs = [
            ['decoration/title', decoration, r.title],
            ['decoration/price', decoration, r.price],
            ['decoration/badges', decoration, r.badges],
            ['title/price', r.title, r.price],
            ['badges/price', r.badges, r.price],
          ];
          const overlaps = pairs.filter(([, a, b]) => intersects(a, b)).map(([name]) => name);
          const name = `${width}px ${layoutId} item ${itemStyle}`;
          if (overlaps.length) failures.push({ case: name, overlaps, rects: r });
          else passed.push(name);
        }

        {
          const { state, categoryId } = categoryCase(baseState, layoutId, defaults, categoryStyle);
          await seed(page, state);
          const root = `#cat-${categoryId}`;
          const r = await rects(page, root, {
            title: '.menu-category-head h2',
            count: '.menu-category-head .category-count',
            kicker: '.category-kicker',
            ribbon: '.category-promo-ribbon',
            firstItem: '.menu-product',
            firstTitle: '.menu-product .product-copy h3',
            firstPrice: '.menu-product .product-price',
            firstBadges: '.menu-product .badge-row',
          });
          const decorations = [r.kicker, r.ribbon].filter(Boolean);
          const overlaps = [];
          for (const decoration of decorations) {
            if (intersects(decoration, r.title)) overlaps.push('decoration/title');
            if (intersects(decoration, r.count)) overlaps.push('decoration/count');
            if (intersects(decoration, r.firstItem)) overlaps.push('decoration/first-item');
          }
          if (intersects(r.title, r.count)) overlaps.push('title/count');
          if (intersects(r.firstTitle, r.firstPrice)) overlaps.push('first-title/price');
          if (intersects(r.firstBadges, r.firstPrice)) overlaps.push('first-badges/price');
          const name = `${width}px ${layoutId} category ${categoryStyle}`;
          if (overlaps.length) failures.push({ case: name, overlaps: [...new Set(overlaps)], rects: r });
          else passed.push(name);
        }
      }
    }
  }

  console.log(JSON.stringify({ checked: passed.length + failures.length, passed: passed.length, failed: failures.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
