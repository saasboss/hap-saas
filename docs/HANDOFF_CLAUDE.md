# Handoff overview: Hap, for continuing in Claude

## What Hap is
A mobile-first restaurant menu and admin prototype. Owners manage categories and dishes, prices, availability, promotions, menu design, a QR code, settings and basic insights. Guests see a public menu at `/menu/:slug`. No real login, database, payments or analytics yet. Everything is demo state.

## How the code is laid out
- TanStack Start + React 19 + Vite + Tailwind v4 host app (`src/`).
- The real product UI is plain JS/CSS in `public/hap/` (`app.js`, `styles.css`, `data.js`, `services.js`, `ops.js`). React mounts it through `src/components/hap-app.tsx` (no iframe).
- Routes and legacy redirects: `src/lib/hap-routes.ts`. Admin lives under `/r/:slug/admin/...`. Promotions URL: `/r/:slug/admin/menu/promotions`.
- Tests: `tests/hap-behavior.test.cjs`. Checks: `npm run build`, `npm run lint`.
- Rules for agents: `AGENTS.md` and `CLAUDE.md` (read first), then `docs/START_HERE.md`, `docs/PROJECT_STATE.md`, `docs/MODEL_ROUTING.md`, `docs/AI_WORK_LOG.md`, `docs/MENU_DESIGN_PROMOTION_PLAN.md`. Handoff form: `docs/HANDOFF_TEMPLATE.md`.

## Done in this Lovable session (all in `public/hap/app.js` and `public/hap/styles.css`)
1. **Items: adding and filtering.** Removed the global "Add item". Each open category ends with "+ Add item to [Category]". "New category" is now a secondary action. The permanent filter chips are replaced by a status bar ("2 sold out · 1 hidden · 3 on promo → View all") that only appears when needed.
2. **Items: tap to expand.** Rows show photo, name, price and status. Tapping a row opens Sold out and Hidden toggles plus "Edit price" and "Full editor". A 3px left border shows the state: promo, sold out (amber) or hidden (gray). The toggle style is named `item-switch` so it doesn't clash with the existing `.switch`.
3. **Categories.** You can rename a category in place (✓ / ✕). A star in the header turns promotion on and off. The More menu now only has "Delete category", with an Undo message after deleting.
4. **Public menu promotions.** Added a ticket/perforated look and a premium folded-corner look, based on the `hap-promo-lovable-pack.zip` reference. These are for display only: guests can't order.
5. **Design screen redesign.** Step 1 is Layout (Essential / Signature / Gallery). Step 2 is Style (colour mode, palette, background, fine-tune). Buttons: Cancel / Next, then Back / Save design. A real, scaled-down menu preview stays pinned at the top. It shows 2 dishes and fades briefly when you pick an option. "Expand preview" opens the full menu.

## Not finished (start here in Claude)
**Design screen preview polish.** In the last attempt the sideways cut-off was fixed: the preview now renders at phone width and scales to fill the card. Still open:
- The two dishes are slightly cut off at the bottom of the preview card.
- The card still takes too much height. Trim the empty space at the top of the miniature and retune the height limit. Aim for the size two dishes have on the real public menu.
- Check at 320 / 390 / 430px with all three layouts and both steps. Also check that it stays pinned while scrolling: the page that scrolls is the phone screen container, not the preview panel's parent. Confirm no sideways overflow and no console errors.
- Relevant code: `designStage()`, `refreshDesignPreview()`, `fitDesignStage()` in `app.js`; `.design-compact-page`, `.design-stage`, `.design-stage-panel` in `styles.css`.

## Known caveats
- An automated check of the promo looks flagged a possible overlap between the decoration and the content. It may be a false alarm and still needs a visual check at 320–430px.
- `docs/PROJECT_STATE.md` still says broad UI polish should stop until the MVP scope is set. This session went ahead on the owner's direct request. Record that in `docs/AI_WORK_LOG.md`.
- The repo docs mention two different GitHub repos (`saasboss/eeee` in the README, `saasboss/remix-of-trying` in PROJECT_STATE). Confirm which one you pushed to.
- Deferred: menu bulk actions (Task 12), a desktop/tablet admin layout, a Hap Control redesign, real auth, data storage and billing.

## Moving the project
1. Push from Lovable to GitHub (Git sync).
2. Download the zip. Manus works, or use GitHub's own "Download ZIP", which is simpler.
3. In Claude, start with: "Read AGENTS.md and CLAUDE.md, then the docs they list. Continue only the 'Not finished' section of `.lovable/plan.md` on a `claude/design-preview-fit` branch."
4. Watch out: if Claude edits a zip copy, its changes won't reach GitHub or Lovable unless someone commits them back. Having Claude work directly on the GitHub repo avoids losing work.
