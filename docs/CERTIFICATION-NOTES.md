Flow Chart v1.0.2.0 — Certification Notes

Certification branch: https://github.com/tinocallarisa-web/FlowChart/tree/certification

RESUBMISSION — WHAT CHANGED SINCE THE PREVIOUS REVIEW
The previous submission (1.0.1.0) was returned under 1200.1.1.3: the pbiviz.json in the repository
showed 1.0.0.0 while the submitted package was 1.0.1.0, because the certification branch had not
been updated with the release commit. That is now fixed — the certification branch points at the
same commit as main, and its pbiviz.json reports 1.0.2.0, matching the submitted package exactly.
The version was incremented to 1.0.2.0 because 1.0.1.0 had already been consumed by the returned
submission; 1.0.1.0 was never published and reached no customers, so its changes are documented
under 1.0.2.0 in the changelog. Author contact email and apiVersion were corrected in the same
release. Documentation pages were rewritten and expanded.

SOURCE CODE REPOSITORY ACCESS
Repository: https://github.com/tinocallarisa-web/FlowChart
Read-only collaborator access has been granted to GitHub users "OSDC1033" and "pbicvsupport"
(two-factor authentication requirement disabled for this repository so both accounts can accept
without blockers). Please accept the pending collaborator invitations to browse the source. The
certification branch above points to the exact commit submitted for review.
Support: https://tinocallarisa-web.github.io/FlowChart/support.html
Privacy: https://tinocallarisa-web.github.io/FlowChart/privacy.html
Terms: https://tinocallarisa-web.github.io/FlowChart/terms.html
Changelog: https://tinocallarisa-web.github.io/FlowChart/changelog.html
Video: https://www.youtube.com/watch?v=wXvxscw7e4k

LICENSE VALIDATION
Resolved via the official IVisualLicenseManager API (getAvailableServicePlans), checked against
Plan ID "flow-chart-tcviz". Async, off the render path. No external servers, no user data sent.
Falls back to Free on any error.

FREE VS PRO
Free: all features unlocked (KPI badges, swimlanes, dominant path, variants, collapse/expand, zoom,
minimap, search, full formatting). Diagrams capped at 9 nodes, kept as a connected sub-tree from the
root, with a message reporting how many nodes were omitted.
Pro: same features, unlimited nodes.

PRIVACY / NETWORK
No external network calls, no telemetry, no browser storage (no localStorage, no sessionStorage, no
cookies). Data processed comes only from the Power BI dataView (Levels, Level images, Value, Target,
Swimlane, Tooltip fields), including optional base64 level images supplied by the data model —
nothing fetched from URLs, nothing persisted outside the report.

TESTING — FREE
1. Import the _test build with --free flag applied (real license check, no active plan).
2. Drag 3+ fields into Levels + a Value measure, using a dataset with 10+ nodes.
3. Verify only 9 nodes render (connected sub-tree) with a "Free: showing 9 of N" message.
4. Click a node/link — verify cross-filtering on other visuals.
5. Right-click a node — verify the context menu opens, and still opens correctly after the report
   has been refreshed several times (fixed in 1.0.2.0).

TESTING — PRO
1. Import the _test build with isPro forced true.
2. Same dataset — verify the full diagram renders, no limit message.
3. Add a Target measure — verify KPI badge (value + up/down %).
4. Add a Swimlane field — verify colored bands.
5. Open Variants panel, click a variant — verify it traces on the diagram.
6. Collapse a mid-level node — verify downstream values/badges recalculate.

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
