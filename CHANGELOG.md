# Changelog

All notable changes to the Flow Chart Power BI custom visual are documented here.

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
