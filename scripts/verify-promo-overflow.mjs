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

const clone = v => JSON.parse(JSON.stringify(v));
function activeCategories(state) {
  const menu = (state.menus || []).find(m => m.id === state.activeMenuId) || (state.menus || [])[0];
  if (!menu) throw new Error('No active menu');
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
function makeItemCase(base, layoutId, defaults, style) {
  const state = clone(base); clearPromotions(state); applyLayout(state, layoutId, defaults);
  const cats = activeCategories(state);
  const cat = cats.find(c => (c.items || []).some(i => i.id === 'truffle-burger')) || cats[0];
  const item = (cat.items || []).find(i => i.id === 'truffle-burger') || cat.items[0];
  item.promotion = { active:true, mode:'now', startAt:Date.now()-60000, endAt:null, days:[0,1,2,3,4,5,6], from:'17:00', to:'23:00', intensity:'normal', label:"Tonight's Pick", style, wasPrice:null, terms:style==='offer'?'Today only':'' };
  return { state, target: `[data-item-id="${item.id}"]` };
}
function makeCategoryCase(base, layoutId, defaults, style) {
  const state = clone(base); clearPromotions(state); applyLayout(state, layoutId, defaults);
  const cats = activeCategories(state);
  const cat = cats.find(c => c.id === 'desserts') || cats[0];
  cat.promotion = { active:true, mode:'now', startAt:Date.now()-60000, endAt:null, days:[0,1,2,3,4,5,6], from:'17:00', to:'23:00', label:'Featured tonight', style, tint:'brand', terms:'' };
  return { state, target: `#cat-${cat.id}` };
}
async function seed(page, state) {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil:'domcontentloaded' });
  await page.evaluate(({ storageKey, state }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem('hap.guest.v1', JSON.stringify({ language:'English' }));
  }, { storageKey, state });
  await page.goto(`${baseUrl}/menu/sofra`, { waitUntil:'networkidle' });
  await page.locator('.public-root').waitFor({ state:'visible' });
}
async function measure(page, target) {
  return page.evaluate(target => {
    const round = n => Math.round(n * 100) / 100;
    const box = sel => {
      const el = document.querySelector(sel); if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:round(r.left), right:round(r.right), width:round(r.width) };
    };
    const root = box('.public-root');
    const targetBox = box(target);
    const viewport = window.innerWidth;
    const docWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
    const rootOverflow = root ? Math.max(0, -root.left, root.right - viewport) : Infinity;
    const targetOverflow = root && targetBox ? Math.max(0, root.left - targetBox.left, targetBox.right - root.right) : Infinity;
    return { viewport, docWidth, docOverflow:docWidth-viewport, rootOverflow, targetOverflow, root, target:targetBox };
  }, target);
}

const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:390, height:900 } });
const failures = [];
let checked = 0;
try {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil:'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil:'networkidle' });
  await page.locator('[data-action="theme-toggle"]').click();
  await page.locator('[data-action="theme-toggle"]').click();
  const raw = await page.evaluate(key => localStorage.getItem(key), storageKey);
  if (!raw) throw new Error('Could not obtain default HAP state');
  const baseState = JSON.parse(raw);

  for (const width of widths) {
    await page.setViewportSize({ width, height:900 });
    for (const [layoutId, defaults] of layouts) {
      for (const [itemStyle, categoryStyle] of treatments) {
        for (const [kind, spec] of [
          ['item', makeItemCase(baseState, layoutId, defaults, itemStyle)],
          ['category', makeCategoryCase(baseState, layoutId, defaults, categoryStyle)],
        ]) {
          await seed(page, spec.state);
          const m = await measure(page, spec.target);
          checked++;
          if (m.docOverflow > 1 || m.rootOverflow > 1 || m.targetOverflow > 1) {
            failures.push({ case:`${width}px ${layoutId} ${kind} ${kind==='item'?itemStyle:categoryStyle}`, ...m });
          }
        }
      }
    }
  }
  console.log(JSON.stringify({ checked, passed:checked-failures.length, failed:failures.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
}
