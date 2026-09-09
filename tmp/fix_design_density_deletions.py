from pathlib import Path

path = Path('public/hap/app.js')
text = path.read_text()

for label, old in [
    (
        'layout hint',
        '\n  <p id="design-layout-hint" class="design-layout-hint">${escapeHtml(currentLayout.sub)}</p>',
    ),
    (
        'summary pill',
        '\n  <p id="design-summary" class="wizard-summary design-summary" aria-live="polite">${escapeHtml(designSummary())}</p>',
    ),
]:
    count = text.count(old)
    if count == 1:
        text = text.replace(old, '', 1)
    elif count != 0:
        raise SystemExit(f'{label}: expected 0 or 1 matches, found {count}')

path.write_text(text)
