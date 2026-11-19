# Responsiveness guidelines

Use this guide when implementing the next responsiveness ticket. Improvements are incremental: apply them only to the routes named in the ticket and keep previously approved pages consistent.

## 1. Define the scope before editing

- Identify the routes, shared components, dialogs and navigation used by the target pages.
- Review their current desktop layout and agree on the changes for each view before implementation.
- Preserve the existing desktop arrangement unless the ticket explicitly changes it.
- Keep unrelated pages and business logic outside the ticket. Document any separate data or behavior issue you discover.

## 2. Use three views and two breakpoints

| View | Width | Default behavior |
| --- | --- | --- |
| Desktop | >=1280px | Sidebar visible. Keep established panel arrangements, table widths and action placement. |
| Tablet | 768-1279px | Same menu button and drawer as mobile. Stack dense panels; use two-column filters where they fit. |
| Mobile | <768px | Menu drawer, single-column filters, stacked panels and summaries, full-width main actions. |

Reuse these thresholds. Do not add device-specific breakpoints for individual phones. Use flexible sizing, wrapping and local scrolling within each view.

When using the existing desktop-first stylesheet, place tablet overrides before mobile overrides:

```css
@media (max-width: 1279px) {
    /* Tablet and mobile behavior. */
}

@media (max-width: 767px) {
    /* Mobile-only refinements. */
}
```

## 3. Keep CSS changes isolated

The current implementation provides these reference points:

| File | Responsibility |
| --- | --- |
| [Root layout](../../src/routes/+layout.svelte) | Enables `banca-responsive` only for explicitly supported routes and passes the navigation opt-in. |
| [Banca responsive styles](../../src/routes/banca-responsive.css) | Contains route-scoped responsive overrides. |
| [Sidebar](../../src/lib/components/Sidebar.svelte) | Reuses navigation links for the desktop sidebar and mobile/tablet drawer. |
| [Report](../../src/lib/components/listas/Report.svelte) | Uses an explicit `responsive` option for Banca Inicio behavior. |

- Prefer component-scoped styles or a route wrapper such as `.app.banca-responsive .page-name`.
- Avoid broad edits to `layout.css`, generic elements or shared component defaults.
- Before adding a route to the responsive opt-in, audit every shared selector it will inherit, including `.filters`, `.modal` and table rules. Adding a route is an implementation change, not an automatic guarantee that the page is responsive.
- When a shared component needs different behavior, make it opt-in and preserve other consumers' defaults.
- Inspect computed styles if an override does not apply: Svelte's scoped selectors can outrank an external stylesheet. Use specific selectors; avoid accumulating `!important` rules.

## 4. Follow consistent layout and spacing rules

- Give shrinking flex/grid children `min-width: 0` and size grid tracks with `minmax(0, 1fr)` where appropriate.
- Use `box-sizing: border-box` when widths include padding and borders.
- Follow the existing spacing scale: 1rem gaps/panel padding, reduced to 0.75rem panel padding on phones. Use 0.5rem for smaller internal gaps where needed.
- Prefer natural page height on smaller screens. Do not trap whole panels inside viewport-height limits that hide actions or totals.
- Keep wide tables and matrices inside their own `overflow: auto` containers. The document itself must not scroll horizontally.
- Align overflowing content from its first column; centering can make the leftmost data unreachable.
- Preserve all relevant columns and matrix modes. Do not shrink the entire table or remove data just to fit a phone.
- Keep totals aligned with their corresponding amount columns. If a total belongs only to the price cell, match that cell's width and position rather than centering it across the number and price together.
- Verify the existing table width before and after alignment changes; do not unintentionally shorten the table or totals row.

## 5. Keep text compact and controls usable

Use the approved Ganadores phone typography as a starting point for similarly dense pages:

| Element | Phone reference |
| --- | --- |
| Section headings | 1.125rem / 18px; line-height 1.3 |
| Labels, table text, summary labels, dropdown options and empty-state messages | 0.875rem / 14px; body line-height 1.4 |
| Summary amounts | 1rem / 16px |
| Mobile date/text entry fields | Keep 16px text as the reference; verify behavior with the device keyboard. |

These are local phone overrides, not new global font defaults. Keep tablet/desktop typography unless that ticket calls for a change.

- Keep buttons and interactive option rows at least 44px high; reducing font size must not reduce their touch target.
- Check long names, dates, currency values and empty-state text. Readability matters more than squeezing every column onscreen.
- Let selected filter names wrap on mobile/tablet. For multiple selections, keep the selection count readable.
- Do not communicate essential information only through hover tooltips. Provide a reachable touch/keyboard interaction when that information is needed.

## 6. Treat filters, menus and dialogs as part of the page

- Size date/text inputs separately from checkboxes and radios. A rule such as `.filters input { width: 100%; min-height: 44px; }` also stretches dropdown checkboxes and can push labels out of view.
- Use 16x16px dropdown checkboxes inside a touch-friendly option row. Ensure labels wrap and remain inside the dropdown.
- Bound dropdown height and allow internal scrolling. Test the first and last options, individual selection, select-all, deselection and reopening.
- Reuse the existing navigation drawer below 1280px. It must contain focus, support Escape, restore focus when closed and keep account/logout actions reachable.
- Keep the drawer open when resizing within mobile/tablet; close it on route changes and when entering desktop width.
- Bound dialogs to the viewport using available width/height, with internal scrolling when needed. Check their buttons, focus behavior and stacking relative to navigation.

## 7. Verify data as well as appearance

- Trace the full path: route loader -> option labels/IDs -> selected values -> request parameters -> response fields -> displayed rows and totals.
- Compare the actual backend response with the fields the UI reads. A successful HTTP request does not prove the matrix or summary consumed the data.
- Build test fixtures from the real response contract. Do not invent an aggregated response shape that hides a frontend/backend mismatch.
- Test empty data followed by populated data, route changes and refreshed options. Avoid retaining an empty or unrelated dataset in a shared cache.
- Verify that resizing does not clear selections, duplicate requests unnecessarily or change displayed amounts.
- Distinguish tests using local fixtures from authenticated tests against a real backend. Do not claim live data validation based on mocks.

## 8. Validate in the browser before completing a ticket

CSS edits and a production build are not sufficient UI validation.

1. Use browser responsive-design tools at 320, 375 or 390, 767, 768, 1024, 1279, 1280 and 1440px. The 767/768 and 1279/1280 pairs check breakpoint boundaries; they do not introduce extra views.
2. Manually drag-resize a visible browser window across both breakpoints. Check intermediate widths, not only presets.
3. Check navigation, filters, action buttons, scroll containers, dialogs and keyboard focus. Include touch interaction and landscape orientation when available.
4. Test loading, empty, error and populated states, long labels, multiple selections, large amounts and enough rows to require scrolling.
5. Confirm there is no page-level horizontal overflow, overlap, clipped text or unreachable action. Intentional local table scrolling is acceptable.
6. Recheck the original desktop layout and at least one unrelated route that shares the changed components.
7. Run the project's relevant checks: `git diff --check`, `npm run check` and `npm run build`. Record existing failures separately from new diagnostics; do not hide or silently fix unrelated problems.

Headless viewport emulation and scripted resizing are useful supplements. They do not replace manual window resizing. If a browser, authenticated session or device is unavailable, state exactly which checks remain pending.

## 9. Record a concise handoff

For each ticket, document in its issue or PR:

- Routes/components changed and how the styles are isolated.
- Behavior in desktop, tablet and mobile, including any deliberate scrolling.
- Browser, widths, interactions and data states actually tested; whether data was mocked or live.
- Build/check results, known limitations and any checks that could not be performed.
- Separate issues for other pages or business/data problems discovered during the work.

Keep this directory as a reusable Markdown guide. Do not commit generated screenshots, JSON measurements, browser profiles, temporary configs or test logs here. Store temporary artifacts in an ignored local test directory, and update this guide only when an agreed reusable convention changes.
