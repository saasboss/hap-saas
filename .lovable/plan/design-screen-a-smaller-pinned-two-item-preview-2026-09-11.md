# Design screen: a smaller, pinned two-item preview

Refine the Design screen preview so it matches the sketch: a compact preview card showing exactly two example dishes, rendered smaller, that stays stuck to the top of the screen while the choices below scroll.

## What changes

1. **Two items only.** The pinned preview always renders one category with its first two items — never three — so the card keeps a predictable, short height regardless of layout choice. Expanded preview still shows the full menu.
2. **Smaller render.** The miniature is scaled down a touch further than today so both dish cards, the category header and the item counter fit comfortably inside the frame with no internal scrolling on the Layout step.
3. **Locked on scroll.** The preview panel is pinned to the top of the scrolling area: scrolling the layout/style choices moves only the content underneath, and the preview never leaves the screen or changes size while a choice is being made.
4. **Unchanged:** the header, step indicator, Cancel/Next and Back/Save buttons, the bottom navigation, and everything about what saving does.

## Technical notes

Files: `public/hap/app.js`, `public/hap/styles.css` only.

- `designStage()` and `refreshDesignPreview()` pass `limit: 2` for the pinned (non-expanded) stage instead of `3`.
- `fitDesignStage()` keeps the real 430px render scaled by frame width, with a slightly reduced factor so the two cards read smaller; stage height in `.design-compact-page .design-stage` is retuned to the resulting content height so there is no dead space or clipping.
- The sticky behaviour of `.design-stage-panel` is verified against the actual scroll container used by the page (the phone scroller, not the panel's own parent) and corrected if the current `position:sticky` rule has no effect there; a background and small bottom edge keep the scrolling content from bleeding through.
- No changes to draft state, save/cancel, promotion or public-menu rendering.

## Verification

Checked at 320, 390 and 430px: exactly two items in the preview, no clipped card or price, no horizontal overflow, preview remains fixed in place and identical in size while scrolling and while switching between layout and style options, no console errors.
