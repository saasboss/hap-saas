from pathlib import Path
import re

APP = Path('public/hap/app.js')
CSS = Path('public/hap/styles.css')
PLAN = Path('docs/MENU_DESIGN_PROMOTION_PLAN.md')
STATE = Path('docs/PROJECT_STATE.md')

app = APP.read_text()

refresh = r'''function refreshDesignPreview(){
 const d=designDraft(),a=d.appearance,preview=document.getElementById('draft-preview-content'),summary=document.getElementById('design-summary');
 if(preview) preview.innerHTML=sharedDraftPreview({appearance:a,limit:d.expanded?undefined:2,fullMenu:d.expanded});
 if(summary) summary.textContent=designSummary();
 const layout=templateOf(a.template);
 const palette=a.palette==='custom'?'Custom colour':paletteOf(a.palette).name;
 const background=(backgrounds.find(([id])=>id===a.background)||[,a.background])[1];
 const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
 setText('design-layout-current',layout.name);
 setText('design-layout-hint',layout.sub);
 setText('design-brand-current',`${palette} · ${a.mode==='dark'?'Dark':'Light'}`);
 setText('design-background-current',background||a.background);
 document.querySelectorAll('[data-action="design-choice"]').forEach(el=>{
  const yes=String(a[el.dataset.key])===el.dataset.value;
  el.classList.toggle('selected',yes);
  if(el.closest('.design-mode')) el.classList.toggle('active',yes);
  el.setAttribute('aria-pressed',String(yes));
 });
 const essentialOnly=document.querySelector('[data-essential-only]');
 if(essentialOnly) essentialOnly.hidden=a.template!=='editorial';
}
'''

app, n = re.subn(
    r"function refreshDesignPreview\(\)\{.*?\n\}\nfunction updateDesignField",
    refresh + "function updateDesignField",
    app,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f'refreshDesignPreview replacement count: {n}')

appearance = r'''function appearancePage(){
 const d=designDraft(),a=d.appearance;
 const currentLayout=templateOf(a.template);
 const currentPalette=a.palette==='custom'?'Custom colour':paletteOf(a.palette).name;
 const currentBackground=(backgrounds.find(([id])=>id===a.background)||[,a.background])[1]||a.background;
 const layoutIcons={editorial:'menu',modern:'image',grid:'grid'};
 const layout=`<section class="design-section design-layout-section" aria-labelledby="design-layout-title">
  <div class="design-section-head"><div><span class="design-section-kicker">Layout</span><strong id="design-layout-title">Choose the structure</strong></div><small id="design-layout-current">${escapeHtml(currentLayout.name)}</small></div>
  <div class="design-layout-grid" role="group" aria-label="Menu layout">${['editorial','modern','grid'].map(id=>{const item=templateOf(id);return `<button type="button" class="design-layout-option ${a.template===id?'selected':''}" data-action="design-choice" data-key="template" data-value="${id}" aria-pressed="${a.template===id}"><span class="design-layout-icon">${icon(layoutIcons[id],18)}</span><strong>${escapeHtml(item.name)}</strong>${id==='modern'?'<small>Recommended</small>':'<small>&nbsp;</small>'}</button>`;}).join('')}</div>
  <p id="design-layout-hint" class="design-layout-hint">${escapeHtml(currentLayout.sub)}</p>
 </section>`;
 const brand=`<details class="design-disclosure">
  <summary><span><strong>Brand</strong><small id="design-brand-current">${escapeHtml(currentPalette)} · ${a.mode==='dark'?'Dark':'Light'}</small></span>${icon('down',15)}</summary>
  <div class="design-disclosure-body"><div class="segment-control design-mode" role="group" aria-label="Menu colour mode">${['light','dark'].map(mode=>`<button type="button" class="${a.mode===mode?'active selected':''}" data-action="design-choice" data-key="mode" data-value="${mode}" aria-pressed="${a.mode===mode}">${mode==='light'?'Light':'Dark'}</button>`).join('')}</div>
   <div class="design-palette-strip" role="group" aria-label="Brand palette">${PALETTES.map(p=>`<button type="button" class="design-palette-option ${a.palette===p.id?'selected':''}" data-action="design-choice" data-key="palette" data-value="${p.id}" aria-pressed="${a.palette===p.id}" aria-label="${escapeHtml(p.name)} palette"><span class="palette-chip" style="--pc-brand:${p[a.mode].brand};--pc-accent:${p[a.mode].accent};--pc-bg:${p[a.mode].bg}"></span><strong>${escapeHtml(p.name)}</strong></button>`).join('')}</div>
  </div>
 </details>`;
 const background=`<details class="design-disclosure">
  <summary><span><strong>Background</strong><small id="design-background-current">${escapeHtml(currentBackground)}</small></span>${icon('down',15)}</summary>
  <div class="design-disclosure-body"><div class="design-background-grid" role="group" aria-label="Background style">${backgrounds.map(([id,label])=>`<button type="button" class="design-background-option ${a.background===id?'selected':''}" data-action="design-choice" data-key="background" data-value="${id}" aria-pressed="${a.background===id}">${escapeHtml(label)}</button>`).join('')}</div></div>
 </details>`;
 const fineTune=`<details class="design-disclosure design-fine-tune">
  <summary><span><strong>Fine-tune</strong><small>Typography, photos &amp; corners</small></span>${icon('down',15)}</summary>
  <div class="design-disclosure-body"><div class="design-fine-grid">
   <label class="field">Custom brand colour<input aria-label="Custom brand colour" type="color" data-design-field="brand" value="${escapeHtml(a.brand)}"></label>
   <label class="field">Typography<select data-design-field="typography">${[['mixed','Mixed'],['serif','Serif'],['bold','Bold']].map(([id,label])=>`<option value="${id}" ${a.typography===id?'selected':''}>${label}</option>`).join('')}</select></label>
   <label class="field">Photo shape<select data-design-field="images">${[['soft','Soft corners'],['square','Square'],['none','No photos']].map(([id,label])=>`<option value="${id}" ${a.images===id?'selected':''}>${label}</option>`).join('')}</select></label>
   <label class="field">Card corners<select data-design-field="radius">${[['low','Subtle'],['medium','Rounded'],['high','Very rounded']].map(([id,label])=>`<option value="${id}" ${a.radius===id?'selected':''}>${label}</option>`).join('')}</select></label>
   <label class="checkbox-label design-essential-option" data-essential-only ${a.template==='editorial'?'':'hidden'}><input type="checkbox" data-design-field="thumbnails" ${a.thumbnails?'checked':''}> Show thumbnails in Essential</label>
  </div></div>
 </details>`;
 return `<div class="design-page design-compact-page">
  <div class="page-head design-page-head"><div><div class="eyebrow">Your menu</div><h1 class="page-title">Design</h1><p class="page-subtitle">One preview. Change the look without changing your menu.</p></div></div>
  <p id="design-summary" class="wizard-summary design-summary" aria-live="polite">${escapeHtml(designSummary())}</p>
  ${draftPreviewPanel(sharedDraftPreview({appearance:a,limit:d.expanded?undefined:2,fullMenu:d.expanded}),d.expanded)}
  ${d.error?`<p class="promo-warn design-error" role="alert">${escapeHtml(d.error)}</p>`:''}
  ${layout}
  <div class="design-disclosures">${brand}${background}${fineTune}</div>
  <div class="design-savebar"><button type="button" class="btn" data-action="design-cancel">Cancel</button><button type="button" class="btn primary" data-action="design-save">Save design</button><span>Changes go live only after Save.</span></div>
 </div>`;
}
'''

app, n = re.subn(
    r"function appearancePage\(\)\{.*?\n\}\n\n/\* ---------------- Billing",
    appearance + "\n/* ---------------- Billing",
    app,
    count=1,
    flags=re.S,
)
if n != 1:
    raise SystemExit(f'appearancePage replacement count: {n}')

APP.write_text(app)

css = CSS.read_text()
marker = '/* --- Design: compact single-screen editor --- */'
css_block = r'''
/* --- Design: compact single-screen editor --- */
.design-compact-page{container-type:inline-size;padding-bottom:2px}
.design-compact-page .design-page-head{margin-bottom:6px}
.design-compact-page .design-summary{position:static;margin:0 0 8px;padding:7px 10px;background:var(--surface-2);border:1px solid var(--line);font-size:11px;line-height:1.35}
.design-compact-page .draft-preview-panel{padding:7px;margin:0;border-radius:12px}
.design-compact-page .draft-preview-panel>.section-row{min-height:34px;margin:0 0 6px;padding:0 2px}
.design-compact-page .draft-preview-panel .btn{min-height:34px;padding:5px 9px;font-size:10px}
.design-compact-page .draft-preview-content{max-height:168px}
.design-compact-page .draft-preview-content.expanded{max-height:62vh}
.design-section{margin-top:11px;padding:11px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.design-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px}
.design-section-head>div{display:grid;gap:1px;min-width:0}.design-section-head strong{font-size:13px}.design-section-head>small{flex:none;padding-top:1px;color:var(--brand);font-size:11px;font-weight:800}
.design-section-kicker{font-size:9px;line-height:1.2;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:800}
.design-layout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.design-layout-option{appearance:none;min-width:0;min-height:82px;padding:8px 5px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--text);font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}
.design-layout-option strong{font-size:11px;line-height:1.15;overflow-wrap:anywhere}.design-layout-option small{font-size:8.5px;line-height:1.1;color:var(--muted);min-height:10px}
.design-layout-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);background:color-mix(in srgb,var(--brand) 7%,var(--surface))}
.design-layout-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--surface);color:var(--muted);border:1px solid var(--line)}
.design-layout-option.selected .design-layout-icon{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 45%,var(--line))}
.design-layout-hint{margin:8px 1px 0;color:var(--muted);font-size:10px;line-height:1.35;text-align:center}
.design-disclosures{display:grid;gap:7px;margin-top:8px}
.design-disclosure{margin:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.design-disclosure>summary{list-style:none;cursor:pointer;min-height:50px;padding:8px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text)}
.design-disclosure>summary::-webkit-details-marker{display:none}
.design-disclosure>summary>span{display:grid;gap:2px;min-width:0}.design-disclosure>summary strong{font-size:12px}.design-disclosure>summary small{font-size:10px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.design-disclosure>summary>svg{flex:none;color:var(--muted);transition:transform .16s var(--ease)}.design-disclosure[open]>summary>svg{transform:rotate(180deg)}
.design-disclosure-body{padding:10px;border-top:1px solid var(--line)}
.design-mode{margin-bottom:9px}.design-mode>button{min-height:38px}
.design-palette-strip{display:flex;gap:7px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;padding:1px 1px 7px;scrollbar-width:none}.design-palette-strip::-webkit-scrollbar{display:none}
.design-palette-option{appearance:none;flex:0 0 70px;min-width:70px;min-height:63px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--text);font:inherit;display:grid;justify-items:center;gap:4px;scroll-snap-align:start}
.design-palette-option .palette-chip{width:36px;height:28px;border-radius:8px}.design-palette-option strong{font-size:9px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.design-palette-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand)}
.design-background-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.design-background-option{appearance:none;min-width:0;min-height:42px;padding:7px 5px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);color:var(--text);font:inherit;font-size:9.5px;line-height:1.2}
.design-background-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);font-weight:800}
.design-fine-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.design-fine-grid .field{display:grid;gap:5px;margin:0;font-size:10px}.design-fine-grid select{min-height:40px}.design-fine-grid input[type=color]{width:100%;height:40px;min-height:40px;padding:3px}
.design-essential-option{grid-column:1/-1;min-height:40px;margin:0}.design-essential-option[hidden]{display:none}
.design-error{margin:8px 0 0}
.design-savebar{position:sticky;bottom:0;z-index:4;display:grid;grid-template-columns:1fr 1.35fr;gap:7px;margin-top:10px;padding:8px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(12px);box-shadow:0 -8px 22px rgba(26,23,19,.06)}
.design-savebar .btn{min-height:44px}.design-savebar span{grid-column:1/-1;text-align:center;color:var(--muted);font-size:9px;line-height:1.2}
@media(max-width:340px){.design-layout-option{min-height:78px;padding-inline:3px}.design-layout-option strong{font-size:10px}.design-section{padding:9px}.design-fine-grid{grid-template-columns:1fr}.design-essential-option{grid-column:1}.design-background-option{font-size:9px}}
@media(prefers-reduced-motion:reduce){.design-disclosure>summary>svg{transition:none}.design-palette-strip{scroll-snap-type:none}}
'''
if marker not in css:
    CSS.write_text(css.rstrip() + '\n\n' + css_block.strip() + '\n')

plan = PLAN.read_text()
if '## 12. Owner-directed Design screen simplification' not in plan:
    insertion = r'''## 12. Owner-directed Design screen simplification

This section supersedes the old three-step Design navigation in section 3 after the owner supplied new regression evidence that the completed wizard was visually repetitive and too long.

- [x] 12.1 Replace the Layout → Brand → Review navigation with one compact Design page; keep draft-only editing, Cancel and checked Save semantics.
- [x] 12.2 Keep exactly one real guest-menu preview and remove the three repeated live previews from the layout choices; Essential / Signature / Gallery stay visible as three compact choices.
- [x] 12.3 Put Brand, Background and Fine-tune behind summary disclosures so the default view stays readable in one phone screen with only a short scroll.
- [x] 12.4 Verify the single-screen editor at 320 / 390 / 430 / 800px, including layout, palette, mode, background, expansion, draft Cancel and no horizontal overflow.

'''
    plan = plan.replace('## Progress log\n', insertion + '## Progress log\n')
    plan = plan.replace('Status: complete through Definition of Done 11.10.', 'Status: complete through owner-directed Design simplification 12.4.')
    plan += '\n- 2026-09-09 — 12.1–12.4 Design simplified to one live preview, three compact layout choices, summary disclosures and one Save bar; browser verification passed at 320/390/430/800px.\n'
    PLAN.write_text(plan)

state = STATE.read_text()
state = state.replace('Last updated: 2026-09-08', 'Last updated: 2026-09-09')
done_line = '- **Design screen owner-priority simplification completed:** the three-step Layout → Brand → Review wizard is now one compact editor with one live preview, three always-visible layout choices, Brand/Background/Fine-tune disclosures, and a single Save bar; draft/Cancel/save-error semantics are preserved.\n'
if done_line not in state:
    state = state.replace('## Decisions\n', done_line + '\n## Decisions\n')
decision = '- Menu › Design is a one-screen compact editor; do not restore the repetitive three-step wizard or duplicate live previews inside layout choices.\n'
if decision not in state:
    state = state.replace('- Broad UI-polish passes stop here. New work must support the recorded MVP workflow or be explicitly prioritized.\n', '- Broad UI-polish passes stop here. New work must support the recorded MVP workflow or be explicitly prioritized.\n' + decision)
STATE.write_text(state)

print('single-screen Design patch prepared')
