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
const LONG_ITEM = 'Langsam geschmorter Wolfsbarsch mit Zitronenkräutern';
const LONG_CATEGORY = 'Saisonale Empfehlungen des Küchenchefs';
const LONG_LABEL = 'Empfehlung des Küchenchefs heute Abend';
const LARGE_PRICE = 999999;

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
function applySharedStress(state, layoutId, defaults) {
  clearPromotions(state);
  state.theme = 'light';
  state.appearance = { ...state.appearance, ...defaults, template: layoutId, mode: 'light' };
  state.restaurant.defaultLanguage = 'English';
  state.restaurant.languages = ['English', 'Deutsch'];
}
function translateCategory(category) {
  category.i18n = category.i18n || {};
  category.i18n.DE = LONG_CATEGORY;
}
function translateItem(item) {
  item.i18n = item.i18n || {};
  item.i18n.DE = { ...(item.i18n.DE || {}), name: LONG_ITEM, ingredients: 'Zitrone, frische Kräuter, geröstetes Gemüse und Olivenöl' };
  item.price = LARGE_PRICE;
  item.variants = [];
}
function itemCase(base, layoutId, defaults, style) {
  const state = clone(base); applySharedStress(state, layoutId, defaults);
  const categories = activeCategories(state);
  const category = categories.find(c => (c.items || []).some(i => i.id === 'truffle-burger')) || categories[0];
  const item = (category.items || []).find(i => i.id === 'truffle-burger') || category.items[0];
  translateCategory(category); translateItem(item);
  item.promotion = {
    active:true, mode:'now', startAt:Date.now()-60000, endAt:null, days:[0,1,2,3,4,5,6],
    from:'17:00', to:'23:00', intensity:'normal', label:LONG_LABEL, style,
    wasPrice:null, terms:style==='offer'?'Nur heute · solange der Vorrat reicht':''
  };
  return { state, root:`[data-item-id="${item.id}"]`, kind:'item' };
}
function categoryCase(base, layoutId, defaults, style) {
  const state = clone(base); applySharedStress(state, layoutId, defaults);
  const categories = activeCategories(state);
  const category = categories.find(c => c.id === 'desserts') || categories[0];
  const item = (category.items || [])[0];
  translateCategory(category); if (item) translateItem(item);
  category.promotion = {
    active:true, mode:'now', startAt:Date.now()-60000, endAt:null, days:[0,1,2,3,4,5,6],
    from:'17:00', to:'23:00', label:LONG_LABEL, style, tint:'brand', terms:''
  };
  return { state, root:`#cat-${category.id}`, kind:'category' };
}
async function seed(page, state) {
  await page.goto(`${baseUrl}/r/sofra/admin`, { waitUntil:'domcontentloaded' });
  await page.evaluate(({ storageKey, state }) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    localStorage.setItem('hap.guest.v1', JSON.stringify({ language:'Deutsch' }));
  }, { storageKey, state });
  await page.goto(`${baseUrl}/menu/sofra`, { waitUntil:'networkidle' });
  await page.locator('.public-root').waitFor({ state:'visible' });
}
async function enlargeRelevantText(page, root) {
  await page.locator(root).evaluate(el => {
    const selectors = [
      '.menu-category-head h2','.category-kicker','.category-promo-ribbon','.category-count',
      '.product-copy h3','.product-copy p','.badge-pill','.product-price span',
      '.promo-notch span','.item-promo-ribbon span','.promo-strip-label','.offer-terms'
    ];
    for (const node of el.querySelectorAll(selectors.join(','))) {
      const size = parseFloat(getComputedStyle(node).fontSize);
      if (Number.isFinite(size)) node.style.fontSize = `${size * 1.5}px`;
    }
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
function intersects(a,b,t=.5){
  if(!a||!b)return false;
  return Math.min(a.right,b.right)-Math.max(a.left,b.left)>t && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>t;
}
async function inspect(page, root, kind) {
  return page.locator(root).evaluate((el, { kind, expected }) => {
    const rect = node => {
      if (!node) return null;
      const r=node.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    const info = selector => {
      const node=el.querySelector(selector); if(!node)return null;
      const cs=getComputedStyle(node), r=rect(node);
      return {
        text:(node.textContent||'').trim(), rect:r,
        clippedX:node.scrollWidth>node.clientWidth+1 && ['hidden','clip'].includes(cs.overflowX),
        clippedY:node.scrollHeight>node.clientHeight+1 && ['hidden','clip'].includes(cs.overflowY),
        fontSize:parseFloat(cs.fontSize), whiteSpace:cs.whiteSpace, overflowX:cs.overflowX, overflowY:cs.overflowY
      };
    };
    const title=info(kind==='item'?'.product-copy h3':'.menu-category-head h2');
    const price=info('.product-price');
    const label=info(kind==='item'?'.promo-notch span,.item-promo-ribbon span,.promo-strip-label':'.category-kicker,.category-promo-ribbon');
    const firstTitle=kind==='category'?info('.menu-product .product-copy h3'):null;
    const firstPrice=kind==='category'?info('.menu-product .product-price'):null;
    const rootRect=rect(el), publicRect=rect(document.querySelector('.public-root'));
    const docWidth=Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0);
    const viewport=window.innerWidth;
    return {
      title,price,label,firstTitle,firstPrice,rootRect,publicRect,docWidth,viewport,
      hasExpectedTitle:title?.text.includes(kind==='item'?expected.item:expected.category) || false,
      hasExpectedFirstTitle:kind!=='category' || firstTitle?.text.includes(expected.item) || false,
      hasExpectedLabel:label?.text.includes(expected.label) || false,
      hasLargePrice:(price?.text||firstPrice?.text||'').replace(/\D/g,'').includes(String(expected.price))
    };
  }, { kind, expected:{ item:LONG_ITEM, category:LONG_CATEGORY, label:LONG_LABEL, price:LARGE_PRICE } });
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:1000}});
const failures=[]; let checked=0;
try{
  await page.goto(`${baseUrl}/r/sofra/admin`,{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-action="theme-toggle"]').click();
  await page.locator('[data-action="theme-toggle"]').click();
  const raw=await page.evaluate(key=>localStorage.getItem(key),storageKey);
  if(!raw)throw new Error('Could not obtain default HAP state');
  const baseState=JSON.parse(raw);

  for(const width of widths){
    await page.setViewportSize({width,height:1000});
    for(const [layoutId,defaults] of layouts){
      for(const [itemStyle,categoryStyle] of treatments){
        for(const spec of [itemCase(baseState,layoutId,defaults,itemStyle),categoryCase(baseState,layoutId,defaults,categoryStyle)]){
          await seed(page,spec.state);
          await enlargeRelevantText(page,spec.root);
          const m=await inspect(page,spec.root,spec.kind); checked++;
          const issues=[];
          if(!m.hasExpectedTitle)issues.push('translated-title-missing');
          if(!m.hasExpectedFirstTitle)issues.push('translated-first-title-missing');
          if(!m.hasExpectedLabel)issues.push('long-label-missing');
          if(!m.hasLargePrice)issues.push('large-price-missing');
          for(const [name,x] of [['title',m.title],['price',m.price],['label',m.label],['firstTitle',m.firstTitle],['firstPrice',m.firstPrice]]){
            if(x&&(x.clippedX||x.clippedY))issues.push(`${name}-clipped`);
          }
          if(m.docWidth>m.viewport+1)issues.push('document-overflow');
          if(m.publicRect&&(m.publicRect.left < -1 || m.publicRect.right > m.viewport+1))issues.push('public-root-overflow');
          if(m.rootRect&&m.publicRect&&(m.rootRect.left < m.publicRect.left-1 || m.rootRect.right > m.publicRect.right+1))issues.push('target-overflow');
          if(intersects(m.title?.rect,m.price?.rect))issues.push('title-price-collision');
          if(intersects(m.label?.rect,m.title?.rect))issues.push('label-title-collision');
          if(intersects(m.label?.rect,m.price?.rect))issues.push('label-price-collision');
          if(intersects(m.firstTitle?.rect,m.firstPrice?.rect))issues.push('first-title-price-collision');
          if(issues.length)failures.push({case:`${width}px ${layoutId} ${spec.kind} ${spec.kind==='item'?itemStyle:categoryStyle}`,issues,measurement:m});
        }
      }
    }
  }
  console.log(JSON.stringify({checked,passed:checked-failures.length,failed:failures.length,failures},null,2));
  if(failures.length)process.exitCode=1;
}finally{await browser.close();}
