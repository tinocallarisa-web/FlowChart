Flow Chart v1.0.0.0 — Certification Notes

Certification branch: https://github.com/tinocallarisa-web/FlowChart/tree/certification

SOURCE CODE REPOSITORY ACCESS
Repository: https://github.com/tinocallarisa-web/FlowChart
Read-only collaborator access has been granted to GitHub users "OSDC1033" and "pbicvsupport" (two-factor authentication requirement disabled for this repository so both accounts can accept without blockers). Please accept the pending collaborator invitations to browse the source. The certification branch above points to the exact commit submitted for review.
Support: https://tinocallarisa-web.github.io/FlowChart/support.html
Privacy: https://tinocallarisa-web.github.io/FlowChart/privacy.html
Terms: https://tinocallarisa-web.github.io/FlowChart/terms.html
Video: https://www.youtube.com/watch?v=wXvxscw7e4k

LICENSE VALIDATION
Resolved via the official IVisualLicenseManager API (getAvailableServicePlans), checked against Plan ID "flow-chart-tcviz". Async, off the render path. No external servers, no user data sent. Falls back to Free on any error.

FREE VS PRO
Free: all features unlocked (KPI badges, swimlanes, golden path, variants, collapse/expand, zoom, minimap, search, full formatting). Diagrams capped at 9 nodes, kept as a connected sub-tree from the root.
Pro: same features, unlimited nodes.

PRIVACY / NETWORK
No external network calls, no telemetry, no browser storage. Data processed comes only from the Power BI dataView (Levels, Value, Target, Swimlane, Tooltip fields), including optional base64 level images supplied by the data model — nothing fetched or persisted outside the report.

TESTING — FREE
1. Import the _test build with --free flag applied (real license check, no active plan).
2. Drag 3+ fields into Levels + a Value measure, using a dataset with 10+ nodes.
3. Verify only 9 nodes render (connected sub-tree) with a "Free: showing 9 of N" message.
4. Click a node/link — verify cross-filtering on other visuals.

TESTING — PRO
1. Import the _test build with isPro forced true.
2. Same dataset — verify the full diagram renders, no limit message.
3. Add a Target measure — verify KPI badge (value + up/down %).
4. Add a Swimlane field — verify colored bands.
5. Open Variants panel, click a variant — verify it traces on the diagram.
6. Collapse a mid-level node — verify downstream values/badges recalculate.

CAPABILITIES
All 5 required flags present (supportsHighlight, supportsSynchronizingFilterState, supportsLandingPage, supportsKeyboardFocus, supportsMultiVisualSelection). Rendering events (renderingStarted/Finished/Failed) on every code path in update(). Table dataView mapping — Power BI filters by row count, no highlight-array handling needed.

KNOWN WARNING (non-blocking): Localizations — single-language visual, stringResources intentionally empty.
