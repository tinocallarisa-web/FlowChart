# Flow Chart — Tips & Hints (v1.2.0.0)

## Getting Started

Minimum setup: drag **two or more fields** into **Levels** (in order — the first one becomes the root) and, optionally, a measure into **Value** (without it each row counts 1). The tree builds itself; nodes with the same value at the same level automatically merge. With no fields the visual shows a start screen; with one Levels field it asks for a second.

While you edit, **setup tips** at the bottom show which wells are filled and apply a style template, link labels, level headers or the direction in one click. ✕ hides them; *Style template → Show setup tips* brings them back.

## Field Wells

| Field | What it does |
|---|---|
| **Levels** | One field per hierarchy level, dragged in the order you want them to appear. Two or more |
| **Level images (Pro)** | Optional base64 image per level (aligned by order with Levels) |
| **Value** | Optional — the metric propagated through every parent → child transition; without it each row counts 1 |
| **Target — KPI badge (Pro)** | Optional — turns on the KPI badge (value + ▲/▼ variation %) |
| **Swimlane (Pro)** | Optional — groups nodes into colored bands |
| **Tooltip fields (Pro)** | Optional extra measures shown in tooltips |

## Format Pane

- **Free vs Pro**
  - **Free: the complete diagram — every node, every link, always**, plus everything below except Color rules: layout, legend, zoom, fit, tooltips, 12 languages, style templates, link labels, level headers, grid, backgrounds, legend and toolbar options, on-canvas formatting. There is no node cap, and a published report is never trimmed.
  - **Pro: the layer on top.** Collapse and expand branches, the node search, the Variants panel, swimlanes, node images, the KPI badge, extra tooltip fields and color rules.
  - Editing without a licence, the Pro features you turn on are drawn **working** on the five largest nodes, two swimlanes and three variants, under a *Pro preview* watermark naming them, and Power BI shows its own Upgrade notice. Reading view draws the free result with no watermark, so a published report never uses a feature you have not paid for.
- **Style template**: 6 templates (Default, Clean, Outline, Contrast, Compact, Minimal) — they only fill settings you have not changed; setup tips on/off
- **Layout**: direction, node gap, layer gap, fit on load, toolbar, zoom buttons, toolbar size, minimap, level headers, background, grid
- **Nodes**: width, height, corner radius, font, step number, value badge, KPI colors, border, shadow (auto-disabled in high contrast), image size, image background and shape
- **Value format**: model format (default, dynamic format strings included) / thousands / compact (K/M) / plain / percent of total, decimals, prefix/suffix
- **Links**: color, base width, curvature, golden-path highlight, top-variant highlight, link labels (value, % or both)
- **Color rules (Pro)**: up to 3 rules by node value, % of total or % vs target
- **Swimlanes**: on/off, 4 band colors, opacity, label style
- **Legend**: on/off, position, field names, text size and colour
- **Data colors**: default color, or per-level (up to 6 configurable colors)

## Tips & Best Practices

- Order matters: the sequence you drag fields into **Levels** defines the hierarchy top to bottom, not the field names.
- A node can have more than one parent (e.g. two channels feeding the same downstream step) — the diagram handles this correctly, including collapse/expand.
- Collapsing a node (Pro) hides its whole branch and recalculates values/targets/link widths for everything downstream, cutting only the contribution that passed through that branch.
- Use the Variants panel (Pro, toolbar button) to see the 8 highest-value complete paths and trace one on the diagram.
- Toggle tooltips off from the toolbar (ⓘ) if you're projecting the report and want a cleaner view.
- The minimap appears once the diagram has more than 6 nodes and the visual is at least 360 × 240. It sits at the top right (bottom right if the legend is there) and can be hidden in *Layout → Minimap*.
- Hide the toolbar for a clean dashboard: Ctrl + mouse wheel and + / − / 0 still zoom.
- In format mode, click a node, a link, a link label, the legend or a level header to format it on the canvas.
- Keyboard: Tab enters the diagram, the arrow keys move along the flow and within a level, Enter selects, Escape clears the selection.

## Troubleshooting

- **Nothing renders**: Levels needs two or more fields; the visual tells you which is missing.
- **Numbers look different after the update**: 1.2 uses the measure's own format by default. *Value format → Thousands* restores the 1.1 look.
- **Diagram looks cut off**: it is not the licence. The free tier draws every node. Use **Fit** in the toolbar (or press 0), or check the Power BI row limit for very large models.
- **A node isn't in the swimlane band I expect**: a node only joins a band if *every* row feeding it shares the same swimlane value; otherwise it stays neutral.
- **Page tooltip doesn't trigger on a node with 3+ hierarchy levels**: known limitation — falls back to the basic tooltip. Page tooltips work correctly on links.
