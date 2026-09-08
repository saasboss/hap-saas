# Batch 1 — Items screen: contextual adding + cleaner filtering

Scope is limited to the Menu → Items screen (`adminMenuItems` / `renderAdminCategory` in `public/hap/app.js`, plus the matching styles in `public/hap/styles.css`). Nothing else changes.

## 1. Contextual adding

- Remove the primary "Add" button from the Items page header (it currently opens the add-item / add-category chooser).
- Put a secondary, text-style "+ New category" action in the header instead, going straight to the add-category form.
- Inside every expanded category, replace today's small "Add to [Category]" pill with a full-width, soft-filled final row: "+ Add item to [Category Name]". It already passes the category id through, so a new dish is created inside that category — that behaviour is kept and verified.
- The add chooser sheet stays in the code (it is reachable from elsewhere); it is simply no longer opened from this header.

## 2. Contextual status summary instead of permanent chips

- Remove the always-visible All / Sold out / Hidden / Promoted chip row.
- When any of sold out, hidden or promoted dishes exist, show one compact line above the category list, e.g. `2 sold out · 1 hidden · 3 on promo · View all`.
  - Each count is a tappable control that applies that filter; the active one is visually marked.
  - "View all" clears the filter and only appears while a filter is applied.
- When nothing is sold out, hidden or promoted, the bar is hidden entirely, leaving search plus the existing view-density and "More" actions.
- Search and the existing filter logic are reused as-is; only the control that sets the filter changes.

## Technical notes

- `ui.menuFilter` and the existing filtering expression stay unchanged, so search + filter combinations keep working.
- New CSS: a `.status-summary` row and a full-width variant of `.add-to-cat` (including the grid-view span rule already present).
- The tour step that targets the header add button is repointed or dropped so the guided tour does not break.

## Verification

Headless pass over `/r/sofra/admin/menu` at 320, 390 and 430px: no horizontal overflow, no console errors, add-in-category creates the item in the right category, each status count filters, and the bar disappears when no dish is sold out, hidden or promoted.
