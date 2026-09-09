# Two premium promotion looks for the public menu

Add the ticket and the dark-green folded-corner promotion treatments from the reference pack to Hap's existing public menu card. They become two more choices in the promotion editor, alongside the current Framed, Ribbon and Band looks. Nothing about ordering, data, prices, translations or item details changes.

## What the guest sees

**Ticket**
Warm cream card with a thin dashed red outline, two small round notches cut into the left and right edges, and a dashed rule separating a narrow price column on the right. Small red uppercase promo label, dish name, description, then the price (old price above the new one when one is set). Same footprint and rhythm as a normal menu item.

**Chef's pick (folded corner)**
Deep green card with fine gold double-line framing, a small contained gold fold in the top-right corner carrying the promo label, gold eyebrow text, white title and description, and a gold price in a controlled column. Very restrained background motif.

Both open the existing item detail sheet on tap. No cart, ordering or purchase controls.

## Where they appear

- Live public menu, for any item whose promotion uses the new look.
- Promotion editor preview — this already renders through the same public item renderer, so the preview and the live menu stay identical by construction. No separate preview styling will be written.

## Scope guardrails

- Existing Framed / Ribbon / Band looks stay untouched.
- Category promotions, admin item lists and the rest of the menu are not modified.
- No new libraries, no data-model change; the promotion already stores a `style` value, and the two new looks are simply two more values it can hold.

## Technical notes

Files: `public/hap/app.js` (small additions), `public/hap/styles.css` (new modifier block).

- `PROMO_STYLES` gains `['ticket', …]` and `['premiumFold', …]`; `itemStyleId` accepts them.
- `renderPublicItem` adds two chrome branches only: `<span class="promo-ticket-label">` and `<span class="promo-fold"><span>…</span></span>`. The article keeps its existing classes, gaining `promo-style-ticket` / `promo-style-premiumFold`. Image, copy and `priceColumn()` markup are unchanged, so currency, variants, "from" pricing, was-price and sold-out overlay all keep working.
- CSS is written as modifiers on `.menu-product` reusing the existing `96px minmax(0,1fr) auto` grid: surface colour, border, dashed divider on the price column (`border-left` / padding), and colour overrides for `.product-copy h3`, `p`, `.badge-pill`, `.product-price*`.
- Decorative only via pseudo-elements/absolute children: ticket notches (`::before`/`::after`, vertically centred, `overflow:hidden` on the card so they never widen it) and the fold (fixed ~54px triangle, `pointer-events:none`, title gets right padding on this style so the fold never covers it).
- Price stays at the existing `.product-price-main` scale — no size increase.
- Existing 2-line clamp on the description and the narrow-width rule at `max-width:365px` are reused rather than duplicated.

## Verification before finishing

Playwright at 320 / 375 / 390 / 430 px on the public menu and inside the promotion editor preview, checking: zero horizontal overflow, no clipped or overlapping text, fold and notches contained, price contained, long title (2 lines), long description, missing image, discount and label-only states, sold-out + promoted, a second currency, and no console errors.
