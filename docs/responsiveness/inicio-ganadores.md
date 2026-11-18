# Banca Inicio and Ganadores responsiveness

## Scope and breakpoints

Only `/banca/inicio` and `/banca/ganadores` enable the `banca-responsive` class in the root layout (including trailing-slash URLs). All selectors in `src/routes/banca-responsive.css` require this class. `layout.css` is unchanged. The shared Sidebar defaults to its existing presentation; its mobile dialog is rendered only for these two routes. The shared Report's additional matrix wrapper uses `display: contents` outside these routes, and its keyboard scroll region is explicitly enabled only by Banca Inicio.

| View | Width | Layout |
| --- | --- | --- |
| Desktop | >=1280px | Sidebar, Inicio actions on the right, Ganadores panels side by side, four totals. |
| Tablet | 768-1279px | Same menu button and navigation drawer as mobile, stacked panels, two-column filters, Inicio actions above the filters/matrix, two totals per row. |
| Mobile | <768px | Menu button and native modal navigation drawer, single-column filters and totals, full-width main actions, reduced padding. |

## CSS adjustments

- Flexible children can shrink with `min-width: 0`; panel widths include their padding and borders.
- Tables, report summary and both matrix modes scroll in their own containers. The matrix starts at its first column rather than centering overflowing content. Amount input widths grow with report values to keep large amounts readable.
- Shared multi-select controls fit their filter fields. Dropdowns are bounded in height, long selections truncate in the trigger, and full option labels remain available in the dropdown.
- Restricted-number entries wrap. Report summary and devolution breakdown stack below desktop width.
- Ganadores panels use natural height instead of the existing 96vh limit. Interactive winner controls have 44px touch targets and descriptive labels.
- Page dialogs are bounded by viewport width/height and scroll internally. Their stacking level places them above the desktop sidebar.
- Mobile navigation uses a native `dialog` for focus containment and Escape dismissal. Closing restores focus to the menu trigger. Route changes and resizing to desktop (>=1280px) close the drawer. Resizing within tablet/mobile keeps it open. Account details and logout participate in its scrollable content.

## Follow-up: tablet navigation and desktop matrix cells

- Tablet uses the same navigation drawer as mobile below 1280px. The desktop sidebar starts at 1280px. Tablet filters and panels retain their existing arrangement.
- Desktop matrix amount inputs grow to fill the existing column tracks. The original grid sizing and full matrix width are preserved; unused space in upper cells is filled. This applies to both matrix modes and populated cells.
- Each desktop total input now matches the width and horizontal position of its price input above. A 40px left margin leaves the number-label area empty. Number-label inputs keep a consistent 40px width even on populated rows; the full matrix width remains unchanged.
- Chrome checks passed at 375, 768, 1024, 1279, 1280 and 1440px on both pages, with no document overflow. The tablet drawer stays open when resizing from 1024 to 1279px and closes at 1280px.
- Verified both 10x10 and 20x5 at 1280 and 1440px, with zero values and a 123456789 report. Compared matrix widths with the new flex growth enabled and disabled: widths were identical in all eight scenarios. Upper inputs align with their totals cells after the existing animations finish. Each total input's left edge, width and text center match the amount input above within one pixel in every column.
- All 23 follow-up browser checks passed. Earlier results below describe the initial implementation.

## Initial browser verification performed

Chrome headless with DevTools Protocol viewport emulation, using a temporary local mock API and a synthetic banking session; no real account data or mutations. Screenshots were visually inspected. No browser automation packages were added.

- Both pages checked at 320, 375, 390, 767, 768, 1024, 1279, 1280 and 1440px, including both breakpoint boundaries. No page-level horizontal overflow in any of the 18 checks.
- Ganadores also resized incrementally from 320 to 1440px in 40px steps. No page-level horizontal overflow.
- Confirmed mobile menu opens, Escape closes it and focus returns to its trigger on both pages.
- Inicio: switched to 20x5, confirmed local matrix scrolling, selected filters, loaded a report total of 123456789, and opened the export dialog within the mobile viewport.
- Ganadores: rendered a winning ticket with a long description and a 90000000 payout; entered multiplier editing and verified the save control appears.
- Navigated to `/banca/tiquetes`: responsive route class and mobile menu are absent.
## Checks and remaining validation

- `git diff --check`: passed.
- `npm run check`: blocked because this checkout has no `tsconfig.json`. A temporary config extending `.svelte-kit/tsconfig.json` was used to compare the original files with the implementation: both report 35 errors and 62 warnings in 25 files. No increase in diagnostics. Existing issues include Ganadores' incomplete `WinnerTicketRow` object and missing component props elsewhere. The temporary config was removed.
- `npm run build`: client/server compilation and Azure adapter packaging completed after rerunning outside the sandbox. The initial sandbox run was blocked by adapter directory access restrictions.
- **Pending acceptance requirement:** manually drag-resize a visible browser window and check these routes with browser responsive-design tools in an authenticated test environment. Headless emulation and incremental programmatic resizing were performed; interactive DevTools/manual window resizing were not available in this environment.
- Verify actual winner assignment/deletion, multiplier persistence, ticket preview, restricted-number changes and export completion against test data. These backend workflows were not exercised against a live API.
- Wide matrices and tables intentionally require horizontal scrolling on narrow screens. All columns remain present; the document itself stays within the viewport.
- Existing hover-based matrix and devolution detail tooltips still need a dedicated touch/keyboard interaction review. Their behavior was not redesigned in this ticket; tooltip clipping near scroll-container edges remains a limitation to assess.
- Other browsers, real mobile keyboards, landscape orientations and device testing remain to be checked.
