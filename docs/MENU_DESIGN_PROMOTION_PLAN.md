# Hap — menu design and promotion plan (living checklist)

Status: in progress (see Progress log at the end). **Rule for every agent/remix:** read this file first, pick the
first unchecked box, do it, then tick the box (`- [x]`) and add a one-line note with
the date. Never re-audit or redo checked items. Never delete unchecked items.

Boundaries for all tasks: work in `public/hap/app.js`, `public/hap/styles.css`, and
`public/hap/services.js` only if save/error handling requires it. Keep the existing
app host and data-service boundary. No broad redesign, no template builder, no
dependency upgrades, no new discount engine.

## 1. Product direction (reference, not a task)

Keep Menu with Items / Design / Promotions. One screen per meaningful decision, with
the current selection visible throughout. Small price edits stay quick; full design or
promotion choices get a guided flow. Layouts serve products, menus, or service prices;
restaurant-only data (allergens) shows only when it exists.

## 2. Exactly three templates

- [x] 2.1 Define three layouts that differ by layout, not colour:
      **Essential** (category headings, compact rows, protected price column, optional
      small thumbnails), **Signature** (image+text cards, one per row on phones,
      recommended default), **Gallery** (uniform photo cards in a wrapping grid, two
      columns only when comfortable, one on narrow screens).
- [x] 2.2 All three share category nav, search, filters, item details, availability
      behaviour, price formatting, promotion rules, light/dark, brand palettes,
      deliberate missing-image layout, and readable long/translated text.
- [x] 2.3 Separate colour/decoration from template choice: switching layout preserves
      palette, background, and mode (today a template switch can reset the palette).
- [x] 2.4 Gallery browses vertically — remove the Kiosk horizontal pager/dots
      behaviour rather than renaming it.
- [x] 2.5 Featured section works inside every template; it is not a fourth layout.

## 3. Menu-design flow: Layout → Brand → Review

- [x] 3.1 Layout screen: three clear choices, real menu rendered in the selection; no
      carousel of unreadable miniatures.
- [x] 3.2 Brand screen: palette + light/dark, with custom colour and background under
      "More options"; preview updates immediately.
- [x] 3.3 Review screen: full preview, Edit links back to Layout or Brand, "Save design".
- [x] 3.4 Draft semantics: nothing persists until Save; back/preview keep the draft;
      Cancel discards it.

## 4. Promotion flow: Target → Appearance & message → Timing → Review

- [x] 4.1 Target: Item / Category then a searchable picker; one item or one category per
      promotion; selected name shown immediately; categories show total and publicly
      visible item counts; entering from an existing item/category skips this screen.
- [x] 4.2 Appearance & message: one of Framed / Ribbon / Band, a suggested label or
      custom text, optional terms and previous price behind "Offer details", intensity
      under advanced (existing values preserved when editing), real content in preview.
- [x] 4.3 Timing: Start now / Until tonight / Specific dates / Repeat weekly, revealing
      date, day, and time controls only when the mode needs them.
- [x] 4.4 Review: one readable summary line (e.g. "Desserts · Band · Seasonal selection ·
      Friday, 18:00–23:00"), customer-facing result below, single Save/Schedule action;
      existing promotions open populated with direct access to Appearance or Timing.
- [x] 4.5 Keep meanings explicit: an item highlight does not change its price; a category
      promotion highlights the section and does not discount its items.

## 5. Exactly three promotion treatments

- [x] 5.1 Framed — item: restrained accent border with a label interrupting the top edge;
      category: one border round the section with clear heading and label.
- [x] 5.2 Ribbon — item: folded ribbon in a reserved corner/label area; category: folded
      ribbon attached to the category header, above its content.
- [x] 5.3 Band — item: in-flow label strip with optional terms and a consistent price
      block; category: tinted heading band then the normal item list.
- [x] 5.4 Defaults: Framed for items, Band for categories; Ribbon is the expressive option.
      Keep the folded ribbon effect and promo borders, improving geometry and readability.
- [x] 5.5 A category promotion decorates its section once — no automatic heavy ribbon or
      border on every child item; an independently promoted item keeps its own treatment.

## 6. Fix the ribbon structurally

- [x] 6.1 Split item and category ribbon selectors, including folded pseudo-elements
      (today a shared `.promo-ribbon` leaks category styling into items).
- [x] 6.2 Reserve real layout space for the ribbon instead of an absolutely positioned
      112×112 corner; keep title, price, badges, and controls out of the painted area.
- [x] 6.3 Place the ribbon over a dedicated image/header area where suitable; fall back to
      a compact horizontal folded tab when a diagonal ribbon cannot fit.
- [x] 6.4 Give the price block room for previous price, current price, "From", and currency.
- [x] 6.5 Clip decoration locally without clipping content or keyboard focus outlines.
      No fixes by shrinking prices, stacking z-index, or arbitrary small margins.
- [x] 6.6 Framed: correct surface colour behind the notched label, wrapping long labels,
      consistent border thickness, and no card-size change when selected.

## 7. Make the preview trustworthy

- [x] 7.1 Preview uses the same item/category renderers as the guest menu, receiving draft
      appearance, language, currency, and promotion context explicitly, including the
      template's typography, image, and corner settings.
- [x] 7.2 Category preview renders actual items under the heading; every promotion input
      refreshes the visual, not just stored draft values.
- [x] 7.3 Preview updates on label, terms, price, colour, and timing changes while keeping
      input focus and cursor position.
- [x] 7.4 Preview records no customer analytics and never triggers customer promo popups.
- [x] 7.5 Phones: compact real preview above the choices, "Expand preview" action, and a
      small selection summary that stays visible when the preview scrolls away.
- [x] 7.6 Larger screens: preview beside the editor where space permits (a broader
      desktop-admin redesign stays out of scope).
- [x] 7.7 Scheduled promotions preview as they will appear while active, labelled
      "Scheduled preview".

## 8. Keep everyday editing fast

- [x] 8.1 Price or availability: direct quick editor, small result preview, Save.
- [x] 8.2 Item create/edit: Basics (name, category, price) → Details (photo, description,
      variants, dietary) → Review.
- [x] 8.3 Category create/rename: one short screen.
- [x] 8.4 Promote item/category uses the shared promotion flow; reordering keeps existing
      controls.
- [x] 8.5 Variant editing uses draft data — no immediate saves that make Cancel misleading.

## 9. Price and scheduling corrections

- [x] 9.1 Format previous and current price through the same guest-currency path.
- [x] 9.2 Validate previous price against the effective price; suppress ambiguous old/new
      comparisons for multi-variant items until per-variant comparison exists.
- [x] 9.3 Rename "Until closing" to "Until tonight" and show the exact end time (real
      closing behaviour needs business hours and timezone data).
- [x] 9.4 Overnight recurrence: attach the after-midnight portion to the starting day —
      Friday 18:00–02:00 includes Saturday 01:00.
- [x] 9.5 Conflict checks compare scheduled overlapping periods, not only live promotions,
      on save and on resume.
- [x] 9.6 Keep current emphasis limits (one strong item promotion, one featured category,
      plus normal/subtle item promotions) and explain them in the UI.
- [x] 9.7 Keep Active / Scheduled / Past views with Paused clearly identified (calendar and
      multiple future campaigns per item need a separate data-model change — deferred).

## 10. Compatibility mapping

- [x] 10.1 Template IDs: keep `modern` (Signature), `editorial` (Essential), `grid`
      (Gallery); flatten `street` → `modern`, `noir` → `editorial`, and every older alias
      to a surviving ID.
- [x] 10.2 Preserve content, prices, palette, custom brand, background, and intended mode;
      reading or previewing legacy settings must not rewrite stored records.
- [x] 10.3 Item promotion styles: framed → Framed, ribbon → Ribbon, offer → Band,
      filled → Framed, editorial → Band.
- [x] 10.4 Category promotion styles: ribbon → Ribbon, stamp → Framed, band / spotlight /
      marquee → Band.
- [x] 10.5 Scheduling and offer data stay intact; layout choice never alters prices.

## 11. Definition of done (verify all three layouts × three treatments, items and categories)

- [x] 11.1 No overlapping ribbon, title, price, badge, or action.
- [x] 11.2 No horizontal overflow at 320, 390, and 430px.
- [ ] 11.3 Readable enlarged text, long labels, large prices, translated names.
- [ ] 11.4 Correct layouts with missing photos and mixed image availability.
- [ ] 11.5 Consistent light/dark appearance and currency display.
- [ ] 11.6 Preview matches the saved guest presentation.
- [ ] 11.7 Back, Cancel, and preview navigation behave correctly.
- [ ] 11.8 Failed saves retain the draft and show an error.
- [ ] 11.9 Hidden/sold-out items and empty categories handled consistently.
- [ ] 11.10 Existing routes, permissions, filters, and item-detail interactions still work.

## Progress log

Append one line per completed box: `- 2026-09-07 — 2.4 Gallery pager removed.`

- 2026-09-07 — 10.1 Templates flattened to three IDs in `public/hap/app.js`: `modern` =
  Signature, `editorial` = Essential, `grid` = Gallery. `street`/`bodega`/`aria` → modern;
  `noir`/`market`/`luxury`/`classy`/`bistro`/`gazette` → editorial; `kiosk`/`imageFirst` →
  grid. Old `noir`/`street` CSS blocks left in place, unused and harmless.
- 2026-09-07 — 2.3 Colour separated from layout: `applyTemplateDefaults` no longer
  overwrites palette, custom brand, background or mode; per-template `palettes` lists
  removed so all palettes are offered for every layout; `paletteFor` shows the palette in
  use in all three layout previews. Verified in-browser at 390px: palette `forest`,
  background `paper`, mode `light` survive a switch to Gallery; no console errors, no
  horizontal overflow.
- Next unchecked box: 2.1 (rework Essential/Signature/Gallery layout CSS so the three
  differ structurally), then 2.4 (remove the Gallery horizontal pager).

- 2026-09-07 — Stage 1: scoped folded ribbons, in-flow notched borders and shared guest-currency prices. 72 browser geometry cases and three price tests passed; build and TypeScript passed. Full builder diff review completed; independent review could not complete due reviewer usage limit.

- 2026-09-07 — Stage 2: Essential uses genuine image-free rows (optional thumbnails), Signature comfortable cards, Gallery vertical wrapping with uniform promotion sizing. Exactly three treatments and legacy mappings. 108 browser layout/treatment cases, 72 decoration cases, four behavior tests and build passed; legacy storage unchanged on read.

- 2026-09-08 — Stage 3: isolated Layout → Brand → Review draft, shared guest renderers with explicit context, inert compact preview, actual storage failure detection and rollback. Six behavior tests and four-width browser draft/save checks pass. Existing shell stays narrow on desktop.

- 2026-09-08 — Stage 4: one promotion wizard, searchable target picker, preserved fields, live category/item preview, understandable schedule modes and checked final save. Seven tests and four-width browser wizard/failure/Back/Cancel checks passed. Read-only findings fixed: same-selection drafts/bounds, category terms, publication activity.

- 2026-09-08 — Stage 5: isolated Basics/Details/Review, draft variant operations, direct price/availability preview, atomic item/category services. Eight behavior tests, browser fields/variants/Back/Cancel/move/failure/quick/create checks at four widths and build passed. Optional description survives reload; Duplicate and reordering retained. Reviewer caught restored status constant; full builder review completed after reviewer limit.

- 2026-09-08 — Stage 6: start-day overnight recurrence, strict date/day/time validation, future interval conflict checks on save and resume, explicit device-local timing, derived expiry without storage writes. Fourteen tests include 80 sampled calendar comparisons; browser service/lifecycle/validation checks passed. Full builder diff reviewed; independent reviewer unavailable after usage limit.

- 2026-09-08 — 11.1 final overlap verification: 54 Chromium cases (3 layouts × 3 treatments × item/category × 320/390/430px) passed on the real HAP browser build with no measured collisions between promotion chrome, titles, prices, badges/actions, category heading/count, or first item. Build passed in GitHub Actions run 34255077040.

- 2026-09-08 — 11.2 final horizontal-overflow verification: 54 Chromium cases (3 layouts × 3 treatments × item/category × 320/390/430px) passed on the real HAP browser build with no document, public-root, or promoted-target horizontal overflow. Build passed in GitHub Actions run 34255671480.
