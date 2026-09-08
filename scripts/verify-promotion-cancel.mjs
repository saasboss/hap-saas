import { chromium } from 'playwright';

const baseUrl = process.env.HAP_URL || 'http://127.0.0.1:4173';
const storageKey = 'hap.restaurant.sofra.v1';
const clone = value => JSON.parse(JSON.stringify(value));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function activeMenu(state) {
  return (state.menus || []).find(menu => menu.id === state.activeMenuId) || (state.menus || [])[0];
}

function findItem(state, id) {
  const menu = activeMenu(state);
  for (const category of menu?.categories || []) {
    const item = (category.items || []).find(candidate => candidate.id === id);
    if (item) return item;
  }
  return null;
}

function clearPromotions(state) {
  const menu = activeMenu(state);
  for (const category of menu?.categories || []) {
    category.promotion = { active: false };
    for (const item of category.items || []) item.promotion = { active: false };
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 1000 } });

try {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const themeToggle = page.locator('[data-action="theme-toggle"]');
  await themeToggle.click();
  await themeToggle.click();

  const raw = await page.evaluate(key => localStorage.getItem(key), storageKey);
  assert(raw, 'Could not obtain default HAP state');

  const state = JSON.parse(raw);
  clearPromotions(state);
  const target = findItem(state, 'truffle-burger');
  assert(target, 'Truffle burger fixture missing');
  const originalPromotion = clone(target.promotion);

  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: storageKey,
    value: state,
  });

  await page.goto(`${baseUrl}/r/sofra/admin/menu/promotions`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'New promotion', exact: true }).click();
  await page.locator('[data-action="promotion-target"][data-id="truffle-burger"]').click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('[data-action="promo-temp"][data-key="style"][data-value="ribbon"]').click();

  const labelInput = page.locator('[data-action="promo-temp-input"][data-key="label"]');
  await labelInput.fill('Draft survives Back');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  assert((await labelInput.inputValue()) === 'Draft survives Back', 'Promotion draft lost after Back');

  const expand = page.locator('[data-action="expand-draft-preview"]');
  await expand.click();
  assert((await expand.getAttribute('aria-expanded')) === 'true', 'Promotion preview did not expand');

  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.locator('.promotions-page').waitFor();

  const persistedRaw = await page.evaluate(key => localStorage.getItem(key), storageKey);
  assert(persistedRaw, 'Restaurant state disappeared after Cancel');
  const persisted = JSON.parse(persistedRaw);
  const savedPromotion = findItem(persisted, 'truffle-burger')?.promotion;
  assert(JSON.stringify(savedPromotion) === JSON.stringify(originalPromotion), 'Promotion Cancel persisted draft changes');

  console.log(JSON.stringify({ passed: true, case: 'promotion Back + Expand + Cancel' }, null, 2));
} finally {
  await browser.close();
}
