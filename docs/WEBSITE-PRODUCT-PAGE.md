# Flow Chart — Product Page Content

## Overview

Most Power BI process/flow visuals force a choice: rich navigation (zoom, minimap, drill) *or* native Power BI integration (selection, cross-filtering, tooltips) — rarely both. **Flow Chart** doesn't make you choose.

Drop a flat table into the visual with one field per hierarchy level, and it builds a fully interactive, cross-filterable process diagram automatically — no DAX, no pre-aggregated edge tables. Built for anyone mapping a process, funnel, distribution network, or org structure and needing it to behave like a first-class Power BI visual, not an embedded iframe.

**At a glance**: hierarchical flow diagram · KPI badges · swimlanes · variant analysis · golden path · native selection & cross-filtering · full format pane control.

## Features

### Core diagram
- Automatic tree construction from column order — drag fields into Levels, done
- Branch merging for nodes sharing the same value at the same level
- Horizontal or vertical layout, auto-centered per layer
- Barycenter node ordering to minimize crossing links
- Cyclic (back-edge) detection, routed as discontinuous loops
- Collapse/expand branches with cascading value recalculation

### Navigation
- Zoom, native scroll, minimap with click-to-navigate
- Search field — centers and highlights the first matching node
- Fit-to-view button
- Toolbar toggle for tooltips

### Analysis
- **Golden path**: highlights the highest-value outgoing link from every node
- **Variants panel**: top 8 complete root-to-leaf paths, ranked by value, click to trace
- **KPI badges** *(Pro & Free)*: drag a Target measure to show value + ▲/▼ variation

### Swimlanes
- Group nodes into color bands across levels by a secondary dimension
- Nodes only band when every contributing row agrees on the swimlane value

### Native Power BI integration
- Full selection with multi-row identities per node/link — accurate cross-filtering
- Ctrl/Cmd+click multi-select, click-to-clear
- Native context menu
- Tooltips (basic and report/page) on both nodes and links
- Keyboard focus and high-contrast mode

| Feature | Free | Pro |
|---|:---:|:---:|
| All diagram features (KPI, swimlanes, variants, golden path...) | ✅ | ✅ |
| Diagram size | Up to 9 nodes | Unlimited |

## Technical

- **Data roles**: Levels (grouping, multiple), Level images (measure, multiple, optional), Value (measure), Target (measure, optional), Swimlane (grouping, optional), Tooltip fields (measure, multiple, optional)
- **Rendering**: SVG, built as a string per update for performance
- **Licensing**: Microsoft AppSource `IVisualLicenseManager`, resolved asynchronously off the render path
- **Privacy**: no network calls, no telemetry, no browser storage — everything stays inside the Power BI session
- **Compatibility**: Power BI Desktop and Power BI Service, API 5.3.0
- **Support**: [support.html](../support.html) · [privacy.html](../privacy.html) · [terms.html](../terms.html)

## Changelog

See [CHANGELOG.md](../CHANGELOG.md).
