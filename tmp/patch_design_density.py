from pathlib import Path

APP = Path('public/hap/app.js')
CSS = Path('public/hap/styles.css')

app = APP.read_text()
css = CSS.read_text()


def replace_once(text, old, new, label):
    if new in text:
        return text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one old match, found {count}')
    return text.replace(old, new, 1)

app = replace_once(
    app,
    '<div class="design-section-head"><div><span class="design-section-kicker">Layout</span><strong id="design-layout-title">Choose the structure</strong></div><small id="design-layout-current">${escapeHtml(currentLayout.name)}</small></div>',
    '<div class="design-section-head"><strong id="design-layout-title">Layout</strong><small id="design-layout-current">${escapeHtml(currentLayout.name)}</small></div>',
    'compact layout heading',
)
app = replace_once(
    app,
    '\n  <p id="design-layout-hint" class="design-layout-hint">${escapeHtml(currentLayout.sub)}</p>',
    '',
    'remove duplicate layout hint',
)
app = replace_once(
    app,
    '<div class="page-head design-page-head"><div><div class="eyebrow">Your menu</div><h1 class="page-title">Design</h1><p class="page-subtitle">One preview. Change the look without changing your menu.</p></div></div>',
    '<div class="page-head design-page-head"><div><h1 class="page-title">Design</h1><p class="page-subtitle">Preview updates instantly.</p></div></div>',
    'simplify Design header',
)
app = replace_once(
    app,
    '\n  <p id="design-summary" class="wizard-summary design-summary" aria-live="polite">${escapeHtml(designSummary())}</p>',
    '',
    'remove repeated Design summary',
)
app = replace_once(
    app,
    'sharedDraftPreview({ appearance: a, limit: d.expanded ? undefined : 2, fullMenu: d.expanded })',
    'sharedDraftPreview({ appearance: a, limit: d.expanded ? undefined : 1, fullMenu: d.expanded })',
    'show one representative preview item',
)
app = replace_once(
    app,
    '<div class="design-savebar"><button type="button" class="btn" data-action="design-cancel">Cancel</button><button type="button" class="btn primary" data-action="design-save">Save design</button><span>Changes go live only after Save.</span></div>',
    '<div class="design-savebar"><button type="button" class="btn" data-action="design-cancel">Cancel</button><button type="button" class="btn primary" data-action="design-save">Save design</button></div>',
    'compact save bar',
)

start_marker = '/* --- Design: compact single-screen editor --- */'
end_marker = '@media(prefers-reduced-motion:reduce){.design-disclosure>summary>svg{transition:none}.design-palette-strip{scroll-snap-type:none}}'
start = css.find(start_marker)
end = css.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('Design compact CSS block markers not found')
end += len(end_marker)

new_block = r'''/* --- Design: compact single-screen editor --- */
.design-compact-page{container-type:inline-size;padding-bottom:2px;gap:8px}
.design-compact-page .design-page-head{margin-bottom:0}
.design-compact-page .design-page-head .page-subtitle{margin-top:3px;line-height:1.3}
.design-compact-page .draft-preview-panel{padding:6px;margin:0;border-radius:12px}
.design-compact-page .draft-preview-panel>.section-row{min-height:44px;margin:0 0 4px;padding:0 2px}
.design-compact-page .draft-preview-panel .btn{min-height:44px;padding:0 9px;font-size:10px}
.design-compact-page .draft-preview-content{max-height:150px}
.design-compact-page .draft-preview-content.expanded{max-height:62vh}
.design-section{margin-top:0;padding:9px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.design-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
.design-section-head>strong{font-size:12.5px}.design-section-head>small{flex:none;color:var(--brand);font-size:10.5px;font-weight:800}
.design-layout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.design-layout-option{appearance:none;min-width:0;min-height:70px;padding:6px 4px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--text);font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-align:center}
.design-layout-option strong{font-size:10.5px;line-height:1.1;overflow-wrap:anywhere}.design-layout-option small{font-size:8px;line-height:1.05;color:var(--muted);min-height:9px}
.design-layout-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);background:color-mix(in srgb,var(--brand) 7%,var(--surface))}
.design-layout-icon{display:grid;place-items:center;width:27px;height:27px;border-radius:8px;background:var(--surface);color:var(--muted);border:1px solid var(--line)}
.design-layout-option.selected .design-layout-icon{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 45%,var(--line))}
.design-disclosures{display:grid;gap:5px;margin-top:0}
.design-disclosure{margin:0;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.design-disclosure>summary{list-style:none;cursor:pointer;min-height:44px;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:var(--text)}
.design-disclosure>summary::-webkit-details-marker{display:none}
.design-disclosure>summary>span{display:grid;gap:1px;min-width:0}.design-disclosure>summary strong{font-size:12px}.design-disclosure>summary small{font-size:9.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.design-disclosure>summary>svg{flex:none;color:var(--muted);transition:transform .16s var(--ease)}.design-disclosure[open]>summary>svg{transform:rotate(180deg)}
.design-disclosure-body{padding:9px;border-top:1px solid var(--line)}
.design-mode{margin-bottom:8px}.design-mode>button{min-height:44px}
.design-palette-strip{display:flex;gap:7px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;padding:1px 1px 6px;scrollbar-width:none}.design-palette-strip::-webkit-scrollbar{display:none}
.design-palette-option{appearance:none;flex:0 0 70px;min-width:70px;min-height:63px;padding:6px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--text);font:inherit;display:grid;justify-items:center;gap:4px;scroll-snap-align:start}
.design-palette-option .palette-chip{width:36px;height:28px;border-radius:8px}.design-palette-option strong{font-size:9px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.design-palette-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand)}
.design-background-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.design-background-option{appearance:none;min-width:0;min-height:44px;padding:7px 5px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);color:var(--text);font:inherit;font-size:9.5px;line-height:1.2}
.design-background-option.selected{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand);font-weight:800}
.design-fine-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.design-fine-grid .field{display:grid;gap:5px;margin:0;font-size:10px}.design-fine-grid select{min-height:44px}.design-fine-grid input[type=color]{width:100%;height:44px;min-height:44px;padding:3px}
.design-essential-option{grid-column:1/-1;min-height:44px;margin:0}.design-essential-option[hidden]{display:none}
.design-error{margin:0}
.design-savebar{position:sticky;bottom:0;z-index:4;display:grid;grid-template-columns:1fr 1.35fr;gap:7px;margin-top:0;padding:6px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(12px);box-shadow:0 -8px 22px rgba(26,23,19,.06)}
.design-savebar .btn{min-height:44px}
@media(max-width:340px){.design-layout-option{min-height:66px;padding-inline:3px}.design-layout-option strong{font-size:10px}.design-section{padding:8px}.design-fine-grid{grid-template-columns:1fr}.design-essential-option{grid-column:1}.design-background-option{font-size:9px}}
@media(prefers-reduced-motion:reduce){.design-disclosure>summary>svg{transition:none}.design-palette-strip{scroll-snap-type:none}}'''

css = css[:start] + new_block + css[end:]

APP.write_text(app)
CSS.write_text(css)
