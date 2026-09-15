# Changelog

All notable changes to the Flow Chart Power BI custom visual are documented here.

## [1.0.4.0] - 2026-09-15

### Fixed
- **A paying user could stay on the free tier.** The licence check compared
  `spIdentifier` with the short Plan ID (`flow-chart-tcviz`). The Licensing API returns
  the full Service ID (`publisher.offer.plan`), so the comparison never matched. It now
  accepts both the Service ID and the Plan ID on its own.
- **The purchase notification could fire before the licence had answered.** A large
  diagram on first paint raised Power BI's purchase prompt even for a user who owns
  Pro. The notification now waits for the licence to resolve, and if the licence cannot
  be read, nobody is asked to buy.

### Documentation
- "Unlimited nodes" replaced with "no node cap". Pro removes the 9-node cap, but the
  Power BI data row limit still applies.

## [1.0.3.0] - 2026-09-12

### Fixed
- **Node and link ids taken from the data were written into element attributes without
  escaping.** The ids are built from the values of the Levels columns, and the diagram is
  assembled as an HTML string. A level value containing a double quote closed the
  attribute and whatever followed was parsed as markup, so a crafted value could inject
  an event handler — the rejection cause Microsoft lists as a security issue. The escape
  helper already existed and was applied to the visible labels and the aria labels; it
  was missing on exactly the `data-node-id` and `data-link-id` attributes.
- **The licence was resolved on the critical render path.** `update()` was `async` and
  awaited `getAvailableServicePlans()` between `renderingStarted` and the drawing, on
  every update. The diagram did not paint until the licence call resolved, and because
  Power BI calls `update()` repeatedly while a visual is resized, two overlapping updates
  could emit the first `renderingFinished` after the second `renderingStarted`. The
  licence is now requested once, deferred, and only repaints if it resolves from Free to
  Pro; the drawing moved to a private `draw()` that emits no events of its own.
- **A licence in its payment grace period was treated as absent.** `Warning` is accepted
  alongside `Active`, so a billing problem being resolved no longer costs the full
  diagram.
- **Publish to Web, embedding and export asked a paying customer to buy.** Where the
  licence cannot be queried, `isLicenseUnsupportedEnv` and `isLicenseInfoAvailable` are
  honoured: the free diagram renders and nothing is shown about upgrading, because in
  that environment there is no way to know whether the viewer already paid.

### Changed
- **The purchase path is Power BI's, not the visual's.** The chart used to draw its own
  red line reading "Free: showing 9 of N nodes — upgrade to Pro to see the full diagram",
  while none of the host's licence notifications were ever called: the text asked the
  reader to upgrade and offered nowhere to do it. It is replaced by a neutral
  "Showing 9 of N nodes" note plus `notifyFeatureBlocked`, which carries the real
  purchase path and fires only when the limit actually bites. `clearLicenseNotification`
  clears it when it stops biting.
- `build-test.js` now patches the `isPro` field initializer instead of the licence block
  inside `update()`, which no longer exists there.

### Documentation
- **`docs/CERTIFICATION-NOTES-SHORT.txt` added.** The Partner Center notes field saves
  2.500 characters and discards the rest without warning; the full notes are 4.579, so
  the whole TESTING — FREE and TESTING — PRO sections were being lost, which is exactly
  what a reviewer marks as a soft failure when it is missing. The short file is 2.498
  characters and keeps both testing sections intact.

## [1.0.2.0] - 2026-09-07

### Fixed
- **Context menu binding** — the listener is now attached once to the visual target instead of
  being re-bound to the SVG root on every render. Handlers no longer accumulate as the report
  refreshes, so right-click keeps behaving consistently in long-lived report sessions.

### Changed
- Support contact address updated to [support@tcviz.com](mailto:support@tcviz.com).
- Power BI Visuals API pinned to `5.11.1`.

### Documentation
- Support, privacy, terms and changelog pages rewritten and expanded: full field-well reference,
  complete Format Pane documentation, FAQ, and in-page documentation search.
- `changelog.html` is now generated from this file by `tools/build-changelog.mjs`, so the published
  page cannot drift from the manifest version.
- Certification notes updated for resubmission.

## [1.0.0.0] - 2026-08-28

### Added
- Initial release.
- Data-driven hierarchical process flow diagram (Levels, Value, Target, Swimlane, Tooltip fields data roles).
- Automatic tree construction from column order, with branch merging for repeated values.
- Horizontal/vertical layout, per-layer centering, barycenter-based node ordering to minimize crossings.
- Back-edge (cyclic) detection and routing as discontinuous loops.
- Golden path and top-variant highlighting.
- Collapse/expand branches with cascading value recalculation.
- Zoom, native scroll, minimap, search, and "fit to view".
- Variants panel with top 8 paths by value.
- Swimlanes (color bands across levels).
- KPI badges (target vs. actual, with variation %).
- Native Power BI selection, cross-filtering, context menu, and tooltips (including report/page tooltips on links).
- Keyboard focus and high-contrast mode support.
- Full format pane customization (layout, nodes, badges, value format, links, swimlanes, legend, data colors).
- Free tier: diagrams limited to 9 nodes. Pro tier: unlimited nodes, validated via Microsoft AppSource licensing.

### Documentation
- Privacy policy, terms of use, and support pages published via GitHub Pages.
