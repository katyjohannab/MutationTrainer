# Mobile Layout Contract

## Purpose
This document defines the required mobile layout behavior for the filters drawer, header controls, pills, and safe-area handling. It is a contract for implementation and QA on small screens.

## Required behavior: mobile filters drawer
- **Open:** Tapping the mobile filters toggle must open the drawer and set `aria-expanded="true"` on the toggle.
- **Close:** The drawer must close via (a) the close button, (b) tapping the backdrop, and (c) pressing **Escape**. Closing returns focus to the toggle when possible.
- **Backdrop:** The backdrop must cover the viewport and block interaction with background content.
- **Focus trap:** When open, focus must be trapped within the drawer until it closes.
- **Scroll lock:** Background scroll must be prevented while the drawer is open.
- **Internal scroll:** The drawer body must scroll internally when content exceeds available height.
- **Mobile-only overlay:** The drawer must behave as an overlay (not in-flow), anchored to the viewport.

## Required layout: mobile header controls
- **No wrap chaos:** Mobile header controls (language toggle + filters toggle + help) must not wrap into multiple rows on typical phone widths.
- **Order:** Language toggles remain grouped; the filters toggle and help button remain aligned in the header control row.
- **Hit targets:** Minimum tap target height is 44px, while maintaining compact spacing.

## Required pill sizing (density)
- **Pill padding targets:**
  - Vertical padding: **4px** (0.25rem).
  - Horizontal padding: **8px** (0.5rem).
- **Font size target:** ~**0.65rem** on mobile to match the current compact density.
- **No chunky pills:** Avoid large padding or oversized border radius increases on mobile.

## Required safe-area rules
- Drawer and mobile action bars must respect device safe areas:
  - Use `env(safe-area-inset-top)` for top padding as needed.
  - Use `env(safe-area-inset-bottom)` for bottom padding on the drawer and fixed mobile action bars.
- Mobile layouts must account for the combined safe-area + fixed action bar height when setting drawer height.

## Definition of Done (manual)
- [ ] Mobile filters toggle opens the drawer and sets `aria-expanded="true"`.
- [ ] Close works via X button, backdrop tap, and **Escape**.
- [ ] Focus remains trapped inside the drawer when open.
- [ ] Background scroll is prevented while the drawer is open.
- [ ] Drawer body scrolls independently when content is long.
- [ ] Header controls remain on one line without wrapping on common phone widths.
- [ ] Pills match compact padding targets (4px vertical / 8px horizontal).
- [ ] Safe-area padding is applied to drawer and fixed action bars.
