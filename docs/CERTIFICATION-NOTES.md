Flow Chart v1.0.3.0 — Certification Notes

The 2.500-character version to paste into Partner Center is
docs/CERTIFICATION-NOTES-SHORT.txt. This file is the full reference the reviewer reaches
through the certification branch; do not paste it, it gets cut at 2.500 without warning.

Certification branch: https://github.com/tinocallarisa-web/FlowChart/tree/certification

RESUBMISSION — WHAT CHANGED SINCE THE PREVIOUS REVIEW
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

FREE VS PRO
Free: all features unlocked (KPI badges, swimlanes, dominant path, variants, collapse/expand, zoom,
minimap, search, full formatting). Diagrams capped at 9 nodes, kept as a connected sub-tree from the
root, with a neutral "Showing 9 of N nodes" note in the toolbar. The purchase path is Power BI's own
notifyFeatureBlocked, fired only when the cap actually bites; the visual draws no licensing UI of
its own and there is no watermark.
Pro: same features, unlimited nodes.

PRIVACY / NETWORK
No external network calls, no telemetry, no browser storage (no localStorage, no sessionStorage, no
cookies). Data processed comes only from the Power BI dataView (Levels, Level images, Value, Target,
Swimlane, Tooltip fields), including optional base64 level images supplied by the data model —
nothing fetched from URLs, nothing persisted outside the report.

TESTING — FREE (the submitted package, account with no active plan)
1. Import the submitted .pbiviz; the licence check runs for real.
2. Drag 3+ fields into Levels + a Value measure, using a dataset with 10+ nodes.
3. Verify only 9 nodes render (connected sub-tree) with the neutral "Showing 9 of N nodes" note,
   and that the call to upgrade arrives as Power BI's own notification rather than as text drawn
   inside the chart.
4. Click a node/link — verify cross-filtering on other visuals.
5. Right-click a node — verify the context menu opens, and still opens correctly after the report
   has been refreshed several times (fixed in 1.0.2.0).
6. Put a double quote inside a level value and verify it renders as text, with no broken markup:
   node and link ids now reach element attributes HTML-escaped (fixed in 1.0.3.0).

TESTING — PRO (the same package, account with an active "flow-chart-tcviz" plan)
1. Import the submitted .pbiviz.
2. Same dataset — verify the full diagram renders, no limit message.
3. Add a Target measure — verify KPI badge (value + up/down %).
4. Add a Swimlane field — verify colored bands.
5. Open Variants panel, click a variant — verify it traces on the diagram.
6. Collapse a mid-level node — verify downstream values/badges recalculate.
Without an active plan, steps 3–6 can also be verified on Free with a dataset of 9 nodes or fewer:
Free and Pro share every feature and differ only in the node count.

CAPABILITIES
All 5 required flags present (supportsHighlight, supportsSynchronizingFilterState,
supportsLandingPage, supportsKeyboardFocus, supportsMultiVisualSelection). privileges is an empty
array — the visual requires no host privileges. Tooltips declared with both default and canvas
supported types, plus supportEnhancedTooltips. Rendering events (renderingStarted/Finished/Failed)
on every code path in update(). Table dataView mapping — Power BI filters by row count, no
highlight-array handling needed.

DOCUMENTATION
support.html documents all six field wells and every setting of the seven Format Pane cards, with an
in-page search and a FAQ. changelog.html is generated from CHANGELOG.md by tools/build-changelog.mjs,
which reads the current version from pbiviz.json and fails the build if the two disagree — added
after this rejection so the published version can no longer drift from the manifest.

KNOWN WARNING (non-blocking): Localizations — single-language visual, stringResources intentionally
empty.
