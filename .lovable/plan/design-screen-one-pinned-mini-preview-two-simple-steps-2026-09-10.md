# Design screen: one pinned mini preview, two simple steps

Rebuild the Design screen so it is a single, non-scrolling screen: a real menu preview rendered small and pinned at the top, with the choices underneath and the bottom navigation untouched. Choosing an option swaps the preview content instantly, without the preview changing size, position or scroll.

## Layout of the screen

```text
 Design                       (compact title row)
 ┌───────────────────────────┐
 │  live menu preview        │  fixed height, ~1/3 of screen
 │  (real render, miniature) │  never resizes or moves
 └───────────────────────────┘
  Step 1 Layout · Step 2 Style   (two-dot step indicator)

  Choose the structure
  [Essential] [Signature] [Gallery]
  one-line hint for the selected one

  [Cancel]              [Next →]
 ────────────────────────────
  Home  Menu  Insights  Settings   (unchanged)
```

Step 2 replaces only the area below the preview: colour mode, palette, background, and the fine-tune details (typography, photo shape, corners, custom colour, Essential thumbnails). Its buttons are `Back` and `Save design`. The preview stays exactly where it is across both steps.

## Behaviour

- The preview is the same real renderer used by the public menu, drawn at full phone width and visually scaled down, so what is shown is genuinely what guests see — not an approximation.
- Selecting a layout, palette, background or detail re-renders only the inside of the preview. Fixed height, fixed scroll position, short cross-fade of about 140ms; no jump, no resize, no reflow of anything around it.
- "Expand preview" stays available as a single control on the preview header, opening the full menu; collapsing returns to the same pinned frame.
- Nothing goes live until Save design, same as today.
- Cancel discards the draft and returns, same as today.

## Technical notes

Files: `public/hap/app.js`, `public/hap/styles.css` only.

- `appearancePage()` splits into a fixed preview stage plus a step body driven by the existing `designDraft().step` (currently unused at 0). Step 0 renders the existing `layout` markup; step 1 renders the existing `brand`, `background` and `fineTune` content inlined (no `<details>` wrappers), so no new controls or state are invented.
- Two new actions, `design-step-next` / `design-step-back`, mutate `designDraft().step` and re-render only the step body — the preview node is left in the DOM untouched.
- `refreshDesignPreview()` keeps its current job but writes into the pinned stage and applies the fade class; `sharedDraftPreview` and `menuDraftContext` are unchanged.
- New CSS: `.design-stage` (fixed height via `clamp`, `overflow:hidden`, contains a `430px`-wide inner node with `transform: scale(...)` and `transform-origin: top center`), plus a step-indicator and a static (non-sticky) action row. `.design-compact-page` height rules make the page fill the available area without page scroll; the step body scrolls internally if a phone is very short.
- `prefers-reduced-motion` disables the cross-fade.

## Verification

Checked at 320, 390 and 430px: no horizontal overflow, no page scroll on the Layout step, preview keeps identical box geometry across every choice and across both steps, bottom navigation unaffected, no console errors.
