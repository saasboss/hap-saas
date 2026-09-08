import { chromium } from 'playwright';

const baseUrl = process.env.HAP_URL || 'http://127.0.0.1:4173';
const storageKey = 'hap.restaurant.sofra.v1';
const guestKey = 'hap.guest.v1';
const layouts = [
  ['modern', { header:'compact', categoryBar:'pill', images:'soft', typography:'mixed', radius:'medium' }],
  ['editorial', { header:'centered', categoryBar:'underline', images:'square', typography:'serif', radius:'low', thumbnails:false }],
  ['grid', { header:'minimal', categoryBar:'soft', images:'soft', typography:'mixed', radius:'high' }],
];
const treatments = [
  ['framed','framed'],
  ['ribbon','ribbon'],
  ['offer','band'],
];
const clone = v => JSON.parse(JSON.stringify(v));
const now = () => Date.now();

function assert(cond, message) { if (!cond) throw new Error(message); }
function activeMenu(state) { return (state.menus || []).find(m => m.id === state.activeMenuId) || (state.menus || [])[0]; }
function categories(state) { const m = activeMenu(state); if (!m) throw new Error('No active menu'); return m.categories || []; }
function findItem(state,id) { for (const c of categories(state)) { const item=(c.items||[]).find(i=>i.id===id); if(item) return {item,category:c}; } return null; }
function clearPromotions(state) { for (const c of categories(state)) { c.promotion={active:false}; for (const i of c.items||[]) i.promotion={active:false}; } }
function applyLayout(state,id,defaults,mode='light') { state.theme=mode; state.appearance={...state.appearance,...defaults,template:id,mode}; }
function itemPromotion(style,label='Tonight test') { return {active:true,mode:'now',startAt:now()-60000,endAt:null,days:[0,1,2,3,4,5,6],from:'17:00',to:'23:00',intensity:'normal',label,style,wasPrice:null,terms:style==='offer'?'Today only':''}; }
function categoryPromotion(style,label='Featured test') { return {active:true,mode:'now',startAt:now()-60000,endAt:null,days:[0,1,2,3,4,5,6],from:'17:00',to:'23:00',label,style,tint:'brand',terms:''}; }

const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:390,height:1000}});
const results = {};

async function obtainBaseState() {
  await page.goto(`${baseUrl}/r/sofra/admin`,{waitUntil:'networkidle'});
  await page.evaluate(() => localStorage.clear());
  await page.reload({waitUntil:'networkidle'});
  const toggle=page.locator('[data-action="theme-toggle"]');
  await toggle.click(); await page.locator('[data-action="theme-toggle"]').click();
  const raw=await page.evaluate(key=>localStorage.getItem(key),storageKey);
  if(!raw) throw new Error('Could not obtain default HAP state');
  return JSON.parse(raw);
}
const baseState = await obtainBaseState();

async function seed(state,path='/menu/sofra',guest={language:'English'}) {
  await page.goto(`${baseUrl}/r/sofra/admin`,{waitUntil:'domcontentloaded'});
  await page.evaluate(({storageKey,guestKey,state,guest})=>{
    localStorage.setItem(storageKey,JSON.stringify(state));
    localStorage.setItem(guestKey,JSON.stringify(guest));
  },{storageKey,guestKey,state,guest});
  await page.goto(`${baseUrl}${path}`,{waitUntil:'networkidle'});
  if(path.startsWith('/menu/')) {
    const language=guest?.language||'English';
    const gate=page.locator(`[data-action="select-language"][data-lang="${language}"]`);
    if(await gate.count()) { try { await gate.click({timeout:1500}); } catch {} }
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
}
async function persisted() {
  const raw=await page.evaluate(key=>localStorage.getItem(key),storageKey);
  return raw?JSON.parse(raw):null;
}
async function verify(id,fn) {
  const bucket={passed:0,failed:0,cases:[]}; results[id]=bucket;
  const check=async(name,run)=>{
    try { await run(); bucket.passed++; bucket.cases.push({name,status:'pass'}); }
    catch(e) { bucket.failed++; bucket.cases.push({name,status:'fail',error:String(e?.message||e)}); }
  };
  await fn(check);
}
function visible(el) { if(!el) return false; const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; }

/* 11.4 — missing and mixed photos, all layouts × treatments × item/category. */
await verify('11.4', async check => {
  for (const [layout,defaults] of layouts) for (const [itemStyle,catStyle] of treatments) {
    await check(`${layout} item ${itemStyle} mixed photos`, async()=>{
      const s=clone(baseState); clearPromotions(s); applyLayout(s,layout,defaults);
      const a=findItem(s,'truffle-burger'), b=findItem(s,'burrata'); assert(a&&b,'Fixture items missing');
      a.item.image=''; b.item.image='/hap/assets/burrata-tomato.webp'; a.item.promotion=itemPromotion(itemStyle);
      await seed(s); await page.locator('.public-root').waitFor();
      const m=await page.evaluate(()=>{
        const missing=document.querySelector('[data-item-id="truffle-burger"]');
        const present=document.querySelector('[data-item-id="burrata"]');
        const img=present?.querySelector('.product-img');
        return {missingExists:!!missing,missingImg:!!missing?.querySelector('.product-img'),title:(missing?.querySelector('h3')?.textContent||'').trim(),price:(missing?.querySelector('.product-price')?.textContent||'').trim(),presentImg:!!img,imgLoaded:!!img&&img.complete&&img.naturalWidth>0,overflow:document.documentElement.scrollWidth-window.innerWidth};
      });
      assert(m.missingExists,'Missing-photo item disappeared'); assert(!m.missingImg,'Missing-photo item rendered a broken image slot'); assert(m.title&&m.price,'Missing-photo item lost title or price'); assert(m.presentImg===(layout!=='editorial'),`Valid-photo rendering mismatch in ${layout}`); assert(m.overflow<=1,'Mixed-photo layout overflowed');
    });
    await check(`${layout} category ${catStyle} mixed photos`, async()=>{
      const s=clone(baseState); clearPromotions(s); applyLayout(s,layout,defaults);
      const cat=categories(s).find(c=>c.id==='desserts'); assert(cat&&cat.items?.length>=2,'Dessert fixture missing');
      cat.items[0].image=''; cat.items[1].image='/hap/assets/pistachio-cheesecake.webp'; cat.promotion=categoryPromotion(catStyle);
      await seed(s); await page.locator('#cat-desserts').waitFor();
      const m=await page.evaluate(()=>{
        const cat=document.querySelector('#cat-desserts'),items=[...cat.querySelectorAll('.menu-product')];
        const first=items[0],second=items[1],img=second?.querySelector('.product-img');
        return {count:items.length,firstImg:!!first?.querySelector('.product-img'),firstTitle:(first?.querySelector('h3')?.textContent||'').trim(),firstPrice:(first?.querySelector('.product-price')?.textContent||'').trim(),secondImg:!!img,imgLoaded:!!img&&img.complete&&img.naturalWidth>0,featured:cat.classList.contains('is-featured'),overflow:document.documentElement.scrollWidth-window.innerWidth};
      });
      assert(m.count>=2,'Mixed-photo category lost items'); assert(!m.firstImg,'Missing-photo category item rendered image slot'); assert(m.firstTitle&&m.firstPrice,'Missing-photo category item lost content'); assert(m.secondImg===(layout!=='editorial'),`Mixed-photo rendering mismatch in ${layout}`); assert(m.featured,'Category treatment disappeared'); assert(m.overflow<=1,'Category mixed-photo layout overflowed');
    });
  }
});

/* 11.5 — light/dark and primary/guest currency, with item + category promotion on every case. */
await verify('11.5', async check => {
  const modePairs=new Map();
  for (const [layout,defaults] of layouts) for (const [itemStyle,catStyle] of treatments) for (const mode of ['light','dark']) for (const display of ['ALL','EUR']) {
    await check(`${layout} ${itemStyle}/${catStyle} ${mode} ${display}`, async()=>{
      const s=clone(baseState); clearPromotions(s); applyLayout(s,layout,defaults,mode);
      s.restaurant.currency={primary:'ALL',conversionsEnabled:true,rates:[{code:'EUR',rate:100,source:'manual',updatedAt:'2026-09-08'}]};
      const item=findItem(s,'truffle-burger'); const cat=categories(s).find(c=>c.id==='desserts'); assert(item&&cat,'Currency fixtures missing');
      item.item.price=1250; item.item.variants=[]; item.item.promotion=itemPromotion(itemStyle); cat.promotion=categoryPromotion(catStyle);
      await seed(s,'/menu/sofra',{language:'English',displayCurrency:display}); await page.locator('.public-root').waitFor();
      if(display==='EUR'){ await page.locator('[data-action="display-currency"]').click(); await page.locator('[data-action="set-display-currency"][data-code="EUR"]').click(); await page.locator('.public-root').waitFor(); }
      const m=await page.evaluate(()=>{
        const root=document.querySelector('.public-root'),item=document.querySelector('[data-item-id="truffle-burger"]'),cat=document.querySelector('#cat-desserts');
        const cs=getComputedStyle(root),price=item?.querySelector('.product-price-main')?.textContent?.trim()||'',approx=item?.querySelector('.product-price-approx')?.textContent?.trim()||'';
        return {dark:root.classList.contains('dark-menu'),price,approx,color:cs.color,bg:cs.backgroundColor,itemPromoted:item?.classList.contains('is-promoted'),catPromoted:cat?.classList.contains('is-featured')};
      });
      assert(m.dark===(mode==='dark'),`Menu mode class wrong: ${JSON.stringify(m)}`); assert(m.color&&m.bg,'Menu colours missing'); assert(m.itemPromoted&&m.catPromoted,'Promotion appearance lost in mode/currency case');
      if(display==='ALL'){ assert(m.price.includes('1,250')&&m.price.includes('Lek'),`ALL price wrong: ${m.price}`); assert(m.approx.includes('€12.50'),`EUR approximation wrong: ${m.approx}`); }
      else { assert(m.price.includes('€12.50'),`EUR display price wrong: ${m.price}`); assert(!m.approx,'Converted display should not duplicate approximate price'); }
      const key=`${layout}|${itemStyle}|${catStyle}|${display}`; const prev=modePairs.get(key); if(prev) assert(prev.price===m.price&&prev.approx===m.approx,`Currency text changed between light/dark: ${JSON.stringify({prev,m})}`); else modePairs.set(key,{price:m.price,approx:m.approx});
    });
  }
});

/* Semantic snapshot used to compare owner preview with the actual guest renderer. */
async function presentationSnapshot(rootSelector) {
  return page.locator(rootSelector).evaluate(root=>{
    const text=sel=>(root.querySelector(sel)?.textContent||'').trim();
    const item=root.querySelector('[data-item-id="truffle-burger"]'),cat=root.querySelector('#cat-popular');
    const itemClass=item?[...item.classList].filter(x=>x==='is-promoted'||x.startsWith('promo-style-')).sort():[];
    const catClass=cat?[...cat.classList].filter(x=>x==='is-featured'||x.startsWith('catstyle-')).sort():[];
    const promoLabel=item?.querySelector('.promo-notch span,.item-promo-ribbon span,.promo-strip-label')?.textContent?.trim()||'';
    const catLabel=cat?.querySelector('.category-kicker,.category-promo-ribbon')?.textContent?.trim()||'';
    return {template:[...root.classList].find(x=>x.startsWith('template-'))||'',dark:root.classList.contains('dark-menu'),itemClass,catClass,title:text('[data-item-id="truffle-burger"] h3'),price:text('[data-item-id="truffle-burger"] .product-price'),promoLabel,catTitle:text('#cat-popular .menu-category-head h2'),catLabel,itemImage:!!item?.querySelector('.product-img')};
  });
}

/* 11.6 — draft preview equals saved guest presentation semantically. */
await verify('11.6', async check => {
  for (const [layout,defaults] of layouts) for (const [itemStyle,catStyle] of treatments) {
    await check(`${layout} ${itemStyle}/${catStyle} preview parity`, async()=>{
      const s=clone(baseState); clearPromotions(s); applyLayout(s,layout,defaults,'light');
      const item=findItem(s,'truffle-burger'),cat=categories(s).find(c=>c.id==='popular'); assert(item&&cat,'Preview fixtures missing');
      item.item.promotion=itemPromotion(itemStyle,'Preview item'); cat.promotion=categoryPromotion(catStyle,'Preview category');
      await seed(s,'/r/sofra/admin/menu/design'); await page.locator('[data-draft-preview]').waitFor();
      const preview=await presentationSnapshot('[data-draft-preview]');
      await page.goto(`${baseUrl}/menu/sofra`,{waitUntil:'networkidle'}); await page.locator('.public-root').waitFor();
      const guest=await presentationSnapshot('.public-root');
      assert(JSON.stringify(preview)===JSON.stringify(guest),`Preview/guest mismatch: ${JSON.stringify({preview,guest})}`);
    });
  }
});

/* 11.7 — Back, Cancel and preview expansion retain draft semantics. */
await verify('11.7', async check => {
  await check('design Back + Expand + Cancel', async()=>{
    const s=clone(baseState); applyLayout(s,'modern',layouts[0][1]); const original=clone(s.appearance);
    await seed(s,'/r/sofra/admin/menu/design'); await page.locator('[data-action="design-choice"][data-key="template"][data-value="grid"]').click();
    await page.locator('[data-action="design-step"][data-step="1"]').click();
    await page.locator('[data-action="design-step"][data-step="0"]').click();
    assert(await page.locator('[data-action="design-choice"][data-key="template"][data-value="grid"]').getAttribute('aria-pressed')==='true','Design draft lost on Back');
    const expand=page.locator('[data-action="expand-draft-preview"]'); await expand.click(); assert(await expand.getAttribute('aria-expanded')==='true','Preview did not expand');
    await page.locator('[data-action="design-cancel"]').click();
    const after=await persisted(); assert(JSON.stringify(after.appearance)===JSON.stringify(original),'Design Cancel persisted draft changes');
    assert(await page.evaluate(()=>window.HapRuntime?.currentPath?.())==='/r/sofra/admin/menu','Design Cancel did not return to Menu items');
  });
  await check('promotion Back + Expand + Cancel', async()=>{
    const s=clone(baseState); clearPromotions(s); const original=clone(findItem(s,'truffle-burger').item.promotion);
    await seed(s,'/r/sofra/admin/menu/promotions'); await page.locator('[data-action="promo-chooser"]').click(); await page.locator('[data-action="promotion-target"][data-id="truffle-burger"]').click();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.locator('[data-action="promo-temp"][data-key="style"][data-value="ribbon"]').click();
    const input=page.locator('[data-action="promo-temp-input"][data-key="label"]'); await input.fill('Draft survives Back');
    await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.getByRole('button',{name:'Back',exact:true}).click();
    assert(await input.inputValue()==='Draft survives Back','Promotion draft lost on Back');
    const expand=page.locator('[data-action="expand-draft-preview"]'); await expand.click(); assert(await expand.getAttribute('aria-expanded')==='true','Promotion preview did not expand');
    await page.locator('[data-action="close-sheet"]').click();
    const after=await persisted(),saved=findItem(after,'truffle-burger').item.promotion; assert(JSON.stringify(saved)===JSON.stringify(original),'Promotion Cancel persisted draft');
  });
});

async function breakRestaurantWrites() {
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    window.__hapRestoreSetItem=()=>{Storage.prototype.setItem=original;};
    Storage.prototype.setItem=function(k,v){ if(k===key) return; return original.call(this,k,v); };
  },storageKey);
}
async function restoreRestaurantWrites() { await page.evaluate(()=>{window.__hapRestoreSetItem?.(); delete window.__hapRestoreSetItem;}); }

/* 11.8 — a storage failure leaves the draft on screen and persisted data unchanged. */
await verify('11.8', async check => {
  await check('design failed save retains draft', async()=>{
    const s=clone(baseState); applyLayout(s,'modern',layouts[0][1]); const original=clone(s.appearance);
    await seed(s,'/r/sofra/admin/menu/design'); await page.locator('[data-action="design-choice"][data-key="template"][data-value="grid"]').click();
    await page.locator('[data-action="design-step"][data-step="1"]').click(); await page.locator('[data-action="design-step"][data-step="2"]').click();
    await breakRestaurantWrites(); await page.locator('[data-action="design-save"]').click();
    const warn=page.locator('.promo-warn[role="alert"]'); await warn.waitFor(); assert((await warn.textContent()).trim().length>0,'No design save error shown');
    assert((await page.locator('#design-summary').textContent()).includes('Gallery'),'Design draft selection not retained after failure');
    const after=await persisted(); assert(JSON.stringify(after.appearance)===JSON.stringify(original),'Failed design save altered persisted appearance'); await restoreRestaurantWrites();
  });
  await check('promotion failed save retains draft', async()=>{
    const s=clone(baseState); clearPromotions(s); const original=clone(findItem(s,'truffle-burger').item.promotion);
    await seed(s,'/r/sofra/admin/menu/promotions'); await page.locator('[data-action="promo-chooser"]').click(); await page.locator('[data-action="promotion-target"][data-id="truffle-burger"]').click();
    await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.locator('[data-action="promo-temp"][data-key="style"][data-value="ribbon"]').click();
    await page.locator('[data-action="promo-temp-input"][data-key="label"]').fill('Failure draft label'); await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.getByRole('button',{name:'Continue',exact:true}).click();
    await breakRestaurantWrites(); await page.locator('[data-action="promotion-save"]').click();
    const warn=page.locator('.promo-warn[role="alert"]'); await warn.waitFor(); assert((await warn.textContent()).trim().length>0,'No promotion save error shown');
    assert((await page.locator('#promotion-summary').textContent()).includes('Failure draft label'),'Promotion draft summary lost after failed save');
    const after=await persisted(),saved=findItem(after,'truffle-burger').item.promotion; assert(JSON.stringify(saved)===JSON.stringify(original),'Failed promotion save altered persisted promotion'); await restoreRestaurantWrites();
  });
});

/* 11.9 — hidden/sold-out/empty category rules across all three layouts. */
await verify('11.9', async check => {
  for (const [layout,defaults] of layouts) {
    await check(`${layout} sold-out visible; hidden + empty absent`,async()=>{
      const s=clone(baseState); applyLayout(s,layout,defaults); clearPromotions(s); s.hideSoldOut=false;
      const tr=findItem(s,'truffle-burger'),bu=findItem(s,'burrata'); tr.item.status='hidden'; bu.item.status='soldout';
      categories(s).push({id:'empty-test',name:'Empty Test',items:[{...clone(findItem(s,'caesar').item),id:'empty-hidden',name:'Should not appear',status:'hidden'}]});
      await seed(s); await page.locator('.public-root').waitFor();
      const m=await page.evaluate(()=>({hidden:!!document.querySelector('[data-item-id="truffle-burger"]'),sold:!!document.querySelector('[data-item-id="burrata"]'),soldStatus:!!document.querySelector('[data-item-id="burrata"] .product-status'),empty:!!document.querySelector('#cat-empty-test')}));
      assert(!m.hidden,'Hidden item remained public'); assert(m.sold&&m.soldStatus,'Sold-out item/status missing when hideSoldOut=false'); assert(!m.empty,'Category with no public items remained visible');
    });
    await check(`${layout} hideSoldOut removes sold-out category`,async()=>{
      const s=clone(baseState); applyLayout(s,layout,defaults); clearPromotions(s); s.hideSoldOut=true;
      findItem(s,'truffle-burger').item.status='hidden'; findItem(s,'burrata').item.status='soldout';
      await seed(s); await page.locator('.public-root').waitFor();
      assert(await page.locator('[data-item-id="truffle-burger"]').count()===0,'Hidden item visible'); assert(await page.locator('[data-item-id="burrata"]').count()===0,'Sold-out item visible with hideSoldOut=true'); assert(await page.locator('#cat-popular').count()===0,'Now-empty category remained visible');
    });
  }
});

/* 11.10 — canonical/legacy routes, permission fallbacks, filters/search, item details, admin expand. */
await verify('11.10', async check => {
  const routeCases=[
    ['/r/sofra/admin','/r/sofra/admin'],
    ['/r/sofra/admin/menu','/r/sofra/admin/menu'],
    ['/r/sofra/admin/menu/design','/r/sofra/admin/menu/design'],
    ['/r/sofra/admin/menu/promotions','/r/sofra/admin/menu/promotions'],
    ['/r/sofra/admin/insights','/r/sofra/admin/insights'],
    ['/r/sofra/admin/settings/restaurant','/r/sofra/admin/settings/restaurant'],
    ['/r/sofra/admin/settings/team','/r/sofra/admin/settings/team'],
    ['/r/sofra/admin/promotions','/r/sofra/admin/menu/promotions'],
    ['/r/sofra/admin/appearance','/r/sofra/admin/menu/design'],
  ];
  for (const [path,expected] of routeCases) await check(`route ${path}`,async()=>{
    const s=clone(baseState); await seed(s,path); await page.locator('#app').waitFor();
    const runtime=await page.evaluate(()=>window.HapRuntime?.currentPath?.()); assert(runtime===expected,`Expected ${expected}, got ${runtime}`);
  });
  await check('permissions block design and promotions cleanly',async()=>{
    const s=clone(baseState); s.session={...(s.session||{}),access:{...(s.session?.access||{}),menu:true,design:false,promotions:false}};
    await seed(s,'/r/sofra/admin/menu/design'); assert(await page.locator('.no-permission').count()===1,'Design permission fallback missing');
    await seed(s,'/r/sofra/admin/menu/promotions'); assert(await page.locator('.no-permission').count()===1,'Promotion permission fallback missing');
    await seed(s,'/r/sofra/admin/menu'); assert(await page.locator('.no-permission').count()===0,'Allowed Menu route was blocked');
  });
  await check('public search and dietary filter',async()=>{
    const s=clone(baseState); await seed(s); await page.locator('#public-search-input').fill('Octopus');
    await page.locator('[data-item-id="truffle-burger"]').waitFor({state:'hidden'});
    const search=await page.evaluate(()=>[...document.querySelectorAll('.menu-product')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.dataset.itemId));
    assert(search.length===1&&search[0]==='octopus',`Search result wrong: ${JSON.stringify(search)}`);
    await page.locator('#public-search-input').fill(''); await page.locator('[data-action="filters-sheet"]').click(); await page.locator('[data-action="diet-toggle"][data-diet="vegetarian"]').click(); await page.locator('[data-action="filters-apply"]').click();
    const filtered=await page.evaluate(()=>[...document.querySelectorAll('.menu-product')].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.dataset.itemId));
    assert(filtered.length>0,'Diet filter returned nothing unexpectedly'); assert(!filtered.includes('octopus'),'Vegetarian filter left non-vegetarian octopus visible'); assert(filtered.includes('margherita'),'Vegetarian filter hid a vegetarian dish');
  });
  await check('public item details opens correct dish',async()=>{
    const s=clone(baseState); await seed(s); const btn=page.locator('[data-action="item-details"][data-id="octopus"]'); await btn.scrollIntoViewIfNeeded(); await btn.click();
    const sheet=page.locator('.sheet'); await sheet.waitFor(); assert((await sheet.textContent()).includes('Grilled Octopus'),'Item-detail sheet has wrong content');
  });
  await check('admin item expand still works',async()=>{
    const s=clone(baseState); await seed(s,'/r/sofra/admin/menu'); const row=page.locator('[data-action="expand-item"][data-id="truffle-burger"]'); await row.scrollIntoViewIfNeeded(); await row.click();
    assert(await row.getAttribute('aria-expanded')==='true','Admin item did not expand'); assert(await page.locator('.admin-item-wrap.is-open').filter({has:row}).count()===1,'Expanded admin item body missing');
  });
});

await browser.close();
const summary=Object.fromEntries(Object.entries(results).map(([id,r])=>[id,{passed:r.passed,failed:r.failed}]));
const failed=Object.values(results).reduce((n,r)=>n+r.failed,0);
console.log(JSON.stringify({summary,failed,results},null,2));
if(failed) process.exitCode=1;
