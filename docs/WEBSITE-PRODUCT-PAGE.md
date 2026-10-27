# Flow Chart — Product Page Content (v1.2.0.0)

## Overview

Drop a flat table into the visual with one field per hierarchy level, and it builds a fully interactive, cross-filterable process diagram automatically — no DAX, no pre-aggregated edge tables. Built for anyone mapping a process, funnel or distribution network and needing it to behave like a first-class Power BI visual.

**At a glance**: hierarchical flow diagram · golden path · native selection & cross-filtering · 12 languages · style templates · link labels · KPI badges, swimlanes, variants and color rules in Pro · full format pane control.

## Features

### Core diagram
- Automatic tree construction from column order — drag two or more fields into Levels, done
- Branch merging for nodes sharing the same value at the same level
- Horizontal or vertical layout, auto-centered per layer
- Barycenter node ordering to minimize crossing links
- Cyclic (back-edge) detection, routed as discontinuous loops
- Collapse/expand branches with cascading value recalculation *(Pro)*

### Make it yours (free)
- Twelve languages, following Power BI
- Six style templates, and setup tips while you edit
- Link labels: value, % of total or both
- Level headers, background grid, background colour, step numbers
- Node images with a background and a shape
- Legend position, size and field names; toolbar, zoom buttons and minimap can be hidden
- Format on the canvas
- Numbers in the model's format, dynamic format strings included

### Navigation
- Zoom (buttons, Ctrl + mouse wheel, + / − / 0), native scroll, minimap with click-to-navigate
- Large diagrams fit the visual when they load
- Search field — centers and highlights the first matching node *(Pro)*
- Fit-to-view button
- Toolbar toggle for tooltips

### Analysis
- **Golden path**: highlights the highest-value outgoing link from every node
- **Variants panel** *(Pro)*: top 8 complete root-to-leaf paths, ranked by value, click to trace
- **KPI badges** *(Pro)*: drag a Target measure to show value + ▲/▼ variation
- **Color rules** *(Pro)*: up to three, by value, share of total or variance against Target

### Swimlanes *(Pro)*
- Group nodes into color bands across levels by a secondary dimension
- Nodes only band when every contributing row agrees on the swimlane value

### Native Power BI integration
- Full selection with multi-row identities per node/link — accurate cross-filtering
- Ctrl/Cmd+click multi-select, click empty space or press Escape to clear
- Native context menu
- Tooltips (basic and report/page) on both nodes and links, with the share of the total
- Keyboard navigation along the flow and high-contrast mode

| Feature | Free | Pro |
|---|:---:|:---:|
| The complete diagram, every node (up to the rows Power BI sends, 1,000 by default) | ✅ | ✅ |
| Layout, golden path, legend, zoom, fit, minimap, tooltips, keyboard | ✅ | ✅ |
| 12 languages, templates, link labels, level headers, grid, backgrounds, on-canvas formatting | ✅ | ✅ |
| Collapse & expand branches | — | **✓** |
| Node search | — | **✓** |
| Variants panel | — | **✓** |
| Swimlanes, node images, KPI badges, extra tooltips | — | **✓** |
| Color rules | — | **✓** |

## Technical

- **Data roles**: Levels (grouping, multiple, two or more), Level images (measure, multiple, optional, Pro), Value (measure, optional), Target (measure, optional, Pro), Swimlane (grouping, optional, Pro), Tooltip fields (measure, multiple, optional, Pro)
- **Rendering**: SVG built with createElementNS; no innerHTML
- **Licensing**: Microsoft AppSource `IVisualLicenseManager`, resolved asynchronously off the render path
- **Privacy**: no network calls, no telemetry, no browser storage — everything stays inside the Power BI session
- **Compatibility**: Power BI Desktop and Power BI Service, API 5.11.1
- **Support**: [support.html](../support.html) · [privacy.html](../privacy.html) · [terms.html](../terms.html)

## Changelog

See [CHANGELOG.md](../CHANGELOG.md).
