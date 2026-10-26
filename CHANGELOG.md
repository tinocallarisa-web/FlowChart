# Changelog

All notable changes to the Flow Chart Power BI custom visual are documented here.

## [1.2.0.0] - 2026-10 (in progress)

### Added
- **Twelve languages.** English, Spanish, French, German, Italian, Portuguese (Brazil and Portugal), Dutch, Polish, Japanese, Simplified Chinese and Korean — the Format pane, the toolbar, tooltips, messages, the start screen and the setup tips. Until now the visual was in English only.
- **Style templates (free):** Default, Clean, Outline, Contrast, Compact and Minimal. A template only fills settings you have not changed yourself.
- **Setup tips while you edit (free):** which wells are filled, the templates in one click, and link labels, level headers and direction as one-click switches. Close them with ✕; *Format → Style template → Show setup tips* brings them back. Never shown in reading view.
- **Start screen** of the TCViz series when the visual has no fields: the three steps and links to the guide, the product page and the video, in three sizes. Links open only on a click, through Power BI. With a single level it says that a flow needs a second one.
- **Link labels (free):** the value, its share of the total, or both, on each link. When two labels would overlap, the larger link keeps its label.
- **Level headers (free):** the name of each Levels field above (or beside) its column of nodes.
- **Background grid (free)** and **step numbers on or off** (*Nodes → Step number*).
- **Background (free):** *Layout → Background* paints the visual and gives the toolbar, legend and minimap the same color; without it they are transparent over the report background instead of white boxes.
- **Image background and shape (free):** *Nodes → Image background* puts a color behind node images, and *Image shape* (rounded, circle, square) also crops the image.
- **Legend options:** position (bottom left, bottom right, top right), text size and color, and the field names instead of "Level 1, 2, 3".
- **Color rules (Pro):** up to three rules that paint a node by its value, its share of the total or its variance against Target.
- **Toolbar and minimap options (free):** *Layout → Toolbar*, *Zoom buttons* and *Minimap* show or hide them (the diagram already fits itself on load), and *Toolbar size* scales the search box and buttons.
- **Format on the canvas:** in format mode, click a node, a link, a link label, the legend, a level header or the toolbar to format it there.
- **Keyboard:** one tab stop for the diagram; the arrow keys move along the flow and within a level, Home and End go to the first and last step. Visible focus ring.

### Changed
- **Numbers use the format of your model by default** (*Value format → Model format*), dynamic format strings included, in the report's language. Reports that never chose a format will show the measure's own format after the update; the previous options are still there.
- **Large diagrams fit the visual when they load** (*Layout → Fit large diagrams to the visual*), instead of opening at 100% with most of the diagram out of view.
- **Node name and value are centered together** in the node, with the same margin above and below; the value no longer sits on the bottom edge.
- **The diagram is centered by the visual**, horizontally and vertically, and zooming grows it from the center. Before, zooming in pushed it down. The space for the toolbar is kept above the diagram, so it is centered in the area below it, also top to bottom.
- **Zoom without buttons:** Ctrl + mouse wheel over the diagram, and + / − / 0 with the keyboard, so readers can still zoom when the author hides the zoom buttons.
- **Top to bottom:** the collapse button sits under the node, where the flow continues, instead of on its side.
- **Smaller visuals:** below 320 px wide the toolbar keeps only *Fit*; the minimap hides below 360 × 240 and the legend below 140 px high. The minimap moved to the top right, where it no longer covers the first or the last nodes (bottom right if the legend is at the top right).
- **Pro preview** while editing without a licence now draws the Pro layers on the five largest nodes, two swimlanes and three variants, under the watermark — enough to see them working on your data. Reading view is unchanged: the free diagram.
- New icon of the TCViz series.
- Tooling: powerbi-visuals-tools 7.2.1, ESLint with the certification plugin, `hostCapabilities.allowInteractions`.

## [1.1.0.0] - 2026-09-22

### Changed
- **The nine-node cap is gone. The free tier now draws the whole diagram, always.** An org chart, a process or a sales funnel go past nine nodes almost every time, so the free tier handed back a diagram cut in half — a picture of a flow that does not exist, with nothing saying so. A node cap punishes exactly the person who has real data and would pay, while giving someone with eight nodes no reason to. What is bought now is the layer on top: the tools that only matter at scale, and the analyst wells.
- **Free vs Pro.** Free: the complete diagram, nodes, links, layout, legend, zoom, fit and tooltips. Pro: collapse and expand branches, the node search, the Variants panel, swimlanes, node images, the KPI badge and extra tooltip fields. Nothing that would misrepresent the data is behind the licence.

### Fixed
- **There was no purchase path at all.** The visual called `notifyFeatureBlocked()` and nothing else: the message read "Pro removes the node cap" and there was no button anywhere, because `notifyLicenseRequired()` — the call that carries the Upgrade bar — was never invoked. It was the only visual in the portfolio without a way to buy. The sequence is now `clearLicenseNotification()` → the banner naming the feature → and, after ~10 s, the Upgrade bar.
- **No `innerHTML` anywhere, and no lint suppression.** The render built the whole DOM as text and injected it with `innerHTML`, with `powerbi-visuals/no-inner-outer-html` disabled by hand — the exact pattern a sibling visual was rejected for under the XSS policy. The toolbar, the SVG, nodes, links, swimlanes, legend, minimap and the variants panel are now built with `createElement` and `createElementNS`. `escapeHtml()` was removed entirely: while an escaping helper exists, escaping stays the responsibility of whoever writes the next line, and forgetting once is an XSS. Labels now go through `textContent` and identifiers through `setAttribute`, neither of which ever interprets markup.
- **A collapsed branch could survive the loss of a licence**, leaving the diagram trimmed with no control to reopen it. The collapsed state is cleared when Pro is not in effect.

### Added
- **Pro preview.** Without a licence, and **in edit mode only**, a Pro feature is drawn *working* under a "Pro preview" watermark naming it, with Power BI's own purchase notice. Reading view — and any environment where licences cannot be read — draws the free result with no watermark, so a published report never uses an unpaid feature. Granted per feature. Above nine nodes the scale tools appear in preview, which is where they start to matter.
- The four Pro wells now say so: `Swimlane (Pro)`, `Level images (Pro)`, `Target — KPI badge (Pro)`, `Tooltip fields (Pro)`.

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
