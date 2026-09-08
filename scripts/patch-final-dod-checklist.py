from pathlib import Path

path = Path('docs/MENU_DESIGN_PROMOTION_PLAN.md')
text = path.read_text()

for item in ('11.4', '11.5', '11.6', '11.7', '11.8', '11.9', '11.10'):
    old = f'- [ ] {item}'
    new = f'- [x] {item}'
    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise SystemExit(f'Checklist item {item} not found')

old_status = 'Status: in progress (see Progress log at the end). **Rule for every agent/remix:** read this file first, pick the'
new_status = 'Status: complete through Definition of Done 11.10. **Rule for every agent/remix:** read this file first, pick the'
if old_status in text:
    text = text.replace(old_status, new_status, 1)
elif new_status not in text:
    raise SystemExit('Checklist status line not found')

old_next = '''- Next unchecked box: 2.1 (rework Essential/Signature/Gallery layout CSS so the three
  differ structurally), then 2.4 (remove the Gallery horizontal pager).'''
new_next = '- All menu-design and promotion checklist boxes are complete through 11.10; do not reopen completed stages without new evidence of a regression.'
if old_next in text:
    text = text.replace(old_next, new_next, 1)
elif new_next not in text:
    raise SystemExit('Stale next-box note not found')

entries = '''

- 2026-09-08 — 11.4 final mixed-image verification: 18/18 Chromium cases passed across all three layouts and all three item/category promotion treatments. Missing photos retained title/price and intentional Essential image suppression was respected; no overflow was introduced. Final suite run 34262263122.
- 2026-09-08 — 11.5 final theme/currency verification: 36/36 Chromium cases passed across light/dark, ALL/EUR guest display, all three layouts, and all three promotion treatments. Final suite run 34262263122.
- 2026-09-08 — 11.6 final preview-parity verification: 9/9 layout/treatment cases matched the saved guest presentation semantically using the real guest renderer. Final suite run 34262263122.
- 2026-09-08 — 11.7 final navigation verification: Design Back/Expand/Cancel passed in the full suite; Promotion Back/Expand/Cancel was rechecked with the uniquely scoped accessible Cancel button and passed in targeted Chromium run 34262903352. Cancel left persisted promotion data unchanged.
- 2026-09-08 — 11.8 final failed-save verification: 2/2 Design and Promotion storage-failure cases retained their drafts, showed an error, and left persisted data unchanged. Final suite run 34262263122.
- 2026-09-08 — 11.9 final visibility-state verification: 6/6 cases passed across all three layouts for hidden items, sold-out visibility, hide-sold-out behavior, and empty-category removal. Final suite run 34262263122.
- 2026-09-08 — 11.10 final regression verification: 13/13 route, legacy-route, permission, search/filter, item-detail, and admin-expand cases passed. This verification exposed one real defect before the final pass: Menu › Promotions did not honor `access.promotions=false`; `adminMenu()` now renders the existing `noPermissionPage('promotions')` fallback consistently with Design. Final suite run 34262263122.
'''

marker = '- 2026-09-08 — 11.3 final content-stress verification:'
if entries.strip() not in text:
    if marker not in text:
        raise SystemExit('Progress log anchor not found')
    text = text.rstrip() + entries + '\n'

path.write_text(text)
