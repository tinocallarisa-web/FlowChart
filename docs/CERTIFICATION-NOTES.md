Flow Chart v1.2.0.0 — Certification Notes

The 2.500-character version to paste into Partner Center is
docs/CERTIFICATION-NOTES-SHORT.txt. This file is the full reference the reviewer reaches
through the certification branch; do not paste it, it gets cut at 2.500 without warning.

Certification branch: https://github.com/tinocallarisa-web/FlowChart/tree/certification

1.2.0.0 — LANGUAGES, SETUP, FORMATTING AND COLOR RULES

1. TWELVE LANGUAGES. Every role, card, setting and option has a displayNameKey in
   capabilities.json, with stringResources for en-US, es-ES, fr-FR, de-DE, it-IT, pt-BR, pt-PT,
   nl-NL, pl-PL, ja-JP, zh-CN and ko-KR. The visual's own texts (toolbar, tooltips, messages,
   start screen, setup tips, licence notice) travel in the bundle (src/strings.ts), because
   Desktop only translates keys declared in capabilities.
2. START SCREEN AND SETUP TIPS. Without fields, a start screen with the three steps and links
   to the support page, the product page and the video; the links open only on a click,
   through host.launchUrl. With one Levels field, a message asks for a second. While EDITING
   only, setup tips at the bottom list the wells and apply a template, link labels, level
   headers or the direction in one click. persistProperties is called only from those clicks
   (style.template, style.guide, linkSettings.showLabels, layoutSettings.showLevelHeaders,
   layoutSettings.direction) — never from an update or a selection callback.
3. NEW FREE SETTINGS. Style templates (fill only settings the author has not changed), link
   labels (value, % of total or both; overlapping labels are skipped), level headers,
   background grid, background colour, step number, image background and shape, legend
   position / size / field names, toolbar, zoom buttons, toolbar size and minimap.
4. COLOR RULES (PRO). Up to three rules colour a node by its value, its share of the total or
   its variance against Target.
5. ON-OBJECT FORMATTING. supportsOnObjectFormatting and enablePointerEventsFormatMode, with
   powerbi-visuals-utils-onobjectutils. In format mode a click selects what to format and
   never filters data.
6. NUMBERS. The default number format is the measure's own (valueFormatter), dynamic format
   strings included (general.formatString), in the report's locale. Separators follow the
   locale in every format.
7. KEYBOARD. One tab stop (roving tabindex); arrow keys along the flow and within a level,
   Home/End, Enter/Space select, Escape clears, + / - / 0 zoom; visible focus ring.
8. INTERACTIONS. hostCapabilities.allowInteractions is respected for clicks, keyboard
   selection, the context menu and the start-screen links.
9. LAYOUT. Large diagrams fit the visual on load (again only on new data, direction or a
   size change of more than 15%); centred between the toolbar and the legend; minimap at the
   top right; Ctrl + mouse wheel zoom.
10. PRO PREVIEW, LIMITED. In edit mode without a licence the Pro layers are drawn on the 5
    largest nodes, 2 swimlanes and 3 variants only.
11. TOOLING. powerbi-visuals-tools 7.2.1, API 5.11.1, ESLint with eslint-plugin-powerbi-visuals:
    0 errors. npm audit --omit=dev: 0 vulnerabilities.

1.1.0.0 — CERTIFICATION BLOCKER, FREE/PRO SPLIT AND THE PURCHASE PATH

1. NO innerHTML ANYWHERE, AND NO LINT SUPPRESSION.
   The render built the whole DOM as a string and injected it with innerHTML, wrapped in
   /* eslint-disable powerbi-visuals/no-inner-outer-html */. A sibling visual was rejected
   under the XSS policy for exactly that pattern. The toolbar, the SVG, nodes, links,
   swimlanes, legend, minimap and the variants panel are now built with createElement and
   createElementNS.
   escapeHtml() was removed entirely rather than kept "just in case": while an escaping
   helper exists, escaping stays the responsibility of whoever writes the next line, and
   forgetting once is an XSS. Labels now go through textContent and identifiers through
   setAttribute, neither of which ever interprets markup.

2. THE 9-NODE CAP IS GONE. See FREE VS PRO below.

3. THERE WAS NO PURCHASE PATH AT ALL.
   The visual called notifyFeatureBlocked() and nothing else. notifyLicenseRequired() — the
   call that carries the Upgrade bar — was never invoked, so the message read "Pro removes
   the node cap" with no button anywhere to act on it. Power BI shows one licence
   notification at a time and the last call replaces the previous one, so the order matters:
   clearLicenseNotification() → the banner naming the feature → and, after ~10 s, the
   Upgrade bar.

4. PRO PREVIEW. Without a licence, in EDIT MODE ONLY, a Pro feature is drawn working under
   a "Pro preview" watermark naming it (since 1.2.0.0 limited to the 5 largest nodes,
   2 swimlanes and 3 variants). Reading view, the frames before the licence
   resolves, and any environment where licences cannot be read all draw the free result with
   no watermark and no prompt. The gate is options.viewMode, not Desktop against Service:
   both hosts report both modes, and gating by host would leave the preview visible in a
   published report. It is granted per feature, not in bulk.

5. A collapsed branch could survive the loss of a licence, leaving the diagram trimmed with
   no control to reopen it. The collapsed state is cleared when Pro is not in effect.

1.0.4.0 — LICENCE FIX
1.0.3.0 is published. 1.0.4.0 changes only the licence check, and the diff shows it:
- The Licensing API documentation defines spIdentifier as the Service ID generated in Partner
  Center (publisher.offer.plan). The code compared it with the short Plan ID "flow-chart-tcviz",
  which never matches, so a buyer stayed on the free tier. matchesPlan() now accepts the full
  Service ID or the Plan ID on its own.
- syncLicenseNotification() ran on every update, before getAvailableServicePlans() had answered, so
  a large diagram could raise the purchase prompt for a user who owns Pro. It now waits for the
  licence to resolve; if the licence cannot be read, no purchase prompt is shown.
- Documentation no longer says "unlimited nodes": the Power BI data
  row limit still applies.

RESUBMISSION HISTORY (1.0.2.0 AND 1.0.3.0)
The previous submission (1.0.1.0) was returned under 1200.1.1.3: the pbiviz.json in the repository
showed 1.0.0.0 while the submitted package was 1.0.1.0, because the certification branch had not
been updated with the release commit. That is now fixed — the certification branch points at the
same commit as main, and its pbiviz.json reports the submitted version exactly. The version was
incremented to 1.0.2.0 because 1.0.1.0 had already been consumed by the returned submission;
1.0.1.0 was never published and reached no customers, so its changes are documented under 1.0.2.0
in the changelog. Author contact email and apiVersion were corrected in the same release.
Documentation pages were rewritten and expanded.

1.0.3.0 carries three further fixes, found in an internal audit rather than by a reviewer, and all
three are visible in the diff:
- Node and link ids are built from the values of the Levels columns and were written into element
  attributes without escaping, while the diagram is assembled as an HTML string. A level value
  containing a double quote closed the attribute and what followed was parsed as markup. The escape
  helper already existed and was applied to the visible labels and the aria labels; it was missing
  on exactly data-node-id and data-link-id.
- The licence was resolved inside update() with await, between renderingStarted and the drawing, on
  every update. See LICENSE VALIDATION below for how it works now.
- The chart drew its own red "upgrade to Pro" line and never called any of the host's licence
  notifications, so the text asked the reader to upgrade and offered nowhere to do it.

SOURCE CODE REPOSITORY ACCESS
Repository: https://github.com/tinocallarisa-web/FlowChart (public, no invitation needed).
The certification branch points to the exact commit submitted for review.
Support: https://tinocallarisa-web.github.io/FlowChart/support.html
Privacy: https://tinocallarisa-web.github.io/FlowChart/privacy.html
Terms: https://tinocallarisa-web.github.io/FlowChart/terms.html
Changelog: https://tinocallarisa-web.github.io/FlowChart/changelog.html
Video: https://www.youtube.com/watch?v=wXvxscw7e4k

LICENSE VALIDATION
Resolved via the official IVisualLicenseManager API (getAvailableServicePlans), checked against
Plan ID "flow-chart-tcviz", accepting Active and Warning so a payment grace period does not cost
the full diagram. Requested once, deferred with setTimeout, and never inside the render path:
update() is synchronous and the licence only triggers a repaint if it resolves from Free to Pro.
Where the licence cannot be queried — Publish to Web, embedding, export — isLicenseUnsupportedEnv
and isLicenseInfoAvailable are honoured, the free diagram renders and nothing asks the viewer to
buy, because there is no way to know there whether they already did. No external servers, no user
data sent. Any failure stays on Free; no code path invents Pro.

FREE VS PRO (changed in 1.1.0.0; color rules added in 1.2.0.0)
Free: THE COMPLETE DIAGRAM — every node, every link, always, including in a published report
(up to the rows Power BI sends the visual, 1,000 by default). Layout, legend, zoom, fit,
tooltips, cross-filtering, keyboard, high contrast, 12 languages, style templates, setup tips,
link labels, level headers, grid, backgrounds, legend and toolbar options, on-canvas formatting.
Pro: the layer on top — collapse and expand branches, the node search, the Variants panel,
swimlanes, node images, the KPI badge, extra tooltip fields and color rules.

Until 1.0.4.0 the free tier drew 9 nodes of N. A diagram cut in half is not a smaller diagram: it
shows a flow that does not exist and says nothing about it. Nothing that would misrepresent the
data is behind the licence now; what is gated are the tools that only matter at scale and the
analyst wells.

PRIVACY / NETWORK
No external network calls, no telemetry, no browser storage (no localStorage, no sessionStorage, no
cookies). The start-screen links open only on a click, through host.launchUrl. Data processed comes only from the Power BI dataView (Levels, Level images, Value, Target,
Swimlane, Tooltip fields), including optional base64 level images supplied by the data model —
nothing fetched from URLs, nothing persisted outside the report.

TESTING — FREE (the submitted package, account with no active plan)
1. Import the submitted .pbiviz; the licence check runs for real.
2. Drag 3+ fields into Levels plus a Value measure, with MORE than 9 nodes.
3. Verify the WHOLE diagram renders — no cap, no truncation note.
4. In EDIT mode, verify the scale tools (search box, the collapse handles on nodes, the Variants
   button) appear under a "Pro preview" watermark naming the feature, that Power BI's own banner
   fires, and that after roughly ten seconds the Upgrade bar appears. Until 1.0.4.0 there was no
   Upgrade bar at all: notifyLicenseRequired was never called.
5. Drag a field to Swimlane, Level images, Target or Tooltip fields — each renders WORKING under
   the watermark, on the largest nodes. Remove it and both watermark and notice go.
5b. Format > Color rules (Pro) > Rule 1 on — the largest nodes take the rule colour under the
   watermark.
5c. Remove all fields — the start screen. One Levels field — a message asks for a second one.
5d. Edit mode — setup tips at the bottom; click Clean, then Link labels: both apply. ✕ hides them.
5e. Format mode — click a node or a link: the on-object panes open and nothing is filtered.
6. Switch to reading view — the whole diagram, with no scale tools, no watermark and no notice.
7. Switch to another report page and back — the state is kept.
8. Click a node or a link — verify cross-filtering on other visuals.
9. Right-click a node — verify the context menu opens, and still opens after several refreshes
   (fixed in 1.0.2.0).
10. Put a double quote and a <script> tag inside a level value — both render as literal text.
    Since 1.1.0.0 there is no innerHTML anywhere: labels go through textContent and identifiers
    through setAttribute, neither of which interprets markup.

TESTING — PRO (the same package, account with an active "flow-chart-tcviz" plan)
1. The same features render with no watermark and no notice.
2. Add a Target measure — verify the KPI badge (value plus up/down %).
3. Add a Swimlane field — verify the coloured bands.
4. Open the Variants panel and click a variant — verify it traces on the diagram.
5. Collapse a mid-level node — verify downstream values and badges recalculate.
6. Format > Color rules > Compare: % vs target, Rule 1 "Less than 0" — nodes below target
   take the rule colour on every node, with no watermark.

CAPABILITIES
All 5 required flags present (supportsHighlight, supportsSynchronizingFilterState,
supportsLandingPage, supportsKeyboardFocus, supportsMultiVisualSelection). privileges is an empty
array — the visual requires no host privileges. Tooltips declared with both default and canvas
supported types, plus supportEnhancedTooltips. Rendering events (renderingStarted/Finished/Failed)
on every code path in update(). Table dataView mapping — Power BI filters by row count, no
highlight-array handling needed. supportsOnObjectFormatting and enablePointerEventsFormatMode are
declared; general.formatString enables dynamic format strings; hostCapabilities.allowInteractions is
read for every interaction.

DOCUMENTATION
support.html documents all six field wells and every setting of the nine Format Pane cards, with an
in-page search and a FAQ. changelog.html is generated from CHANGELOG.md by tools/build-changelog.mjs,
which reads the current version from pbiviz.json and fails the build if the two disagree — added
after this rejection so the published version can no longer drift from the manifest.

LOCALIZATION: 12 languages (capabilities keys + stringResources; the visual's own texts in the
bundle, src/strings.ts).
