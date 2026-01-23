# Mobile layout checklist

## Expected layout

### Header
- Sticky header remains compact and avoids wrapping.
- Language toggle shows two text buttons (EN/CY) with clear active styling.
- Tap targets meet the 44px minimum height on mobile.

### Filters drawer
- The filters drawer opens from the top section of the page without covering the header.
- Opening the drawer sets `aria-expanded="true"` on the Filters button.
- Closing the drawer returns focus to the Filters button when possible.

### Bottom bar
- Bottom action bar stays fixed to the bottom edge with safe-area padding.
- Buttons remain visible and do not overlap the filters drawer or content.

### Safe-area usage
- Header and bottom bar respect the safe-area insets on iOS (no clipped content).
- Content padding prevents buttons from touching the device edges.

## Manual test checklist

Run the following checks on both `index.html` and `home.html`.

### 320px width
1. Resize the viewport to 320px width.
2. Confirm the header elements stay on one line or wrap gracefully without overlap.
3. Tap **Filters** to open the drawer, then close it. Verify the header remains visible.
4. Tap **EN** and **CY** to switch language; confirm the active button is highlighted.
5. Scroll to the bottom; confirm the bottom bar is visible and not overlapping content.

### 375px width
1. Resize the viewport to 375px width.
2. Open and close the filters drawer; check for any overlap with the header.
3. Switch languages with **EN**/**CY** and confirm the correct content appears.
4. Verify bottom bar buttons remain tappable and spaced from the screen edge.

### 430px width
1. Resize the viewport to 430px width.
2. Toggle the filters drawer open/closed.
3. Switch languages using the header buttons and confirm active styling.
4. Verify the bottom bar stays fixed and does not overlap the main content.
