# Flow Chart — Tips & Hints

## Getting Started

Minimum setup: drag **two or more fields** into **Levels** (in order — the first one becomes the root) and a measure into **Value**. The tree builds itself; nodes with the same value at the same level automatically merge.

## Field Wells

| Field | What it does |
|---|---|
| **Levels** | One field per hierarchy level, dragged in the order you want them to appear |
| **Level images** | Optional base64 image per level (aligned by order with Levels) |
| **Value** | The metric propagated through every parent → child transition |
| **Target** | Optional — turns on the KPI badge (value + ▲/▼ variation %) |
| **Swimlane** | Optional — groups nodes into colored bands |
| **Tooltip fields** | Optional extra measures shown in tooltips |

## Format Pane

- **Free vs Pro**
  - Free: full feature set, capped at **9 nodes** total
  - Pro: unlimited nodes
- **Layout**: direction (horizontal/vertical), node gap, layer gap
- **Nodes**: width, height, corner radius, font, image size, border, shadow (auto-disabled in high contrast)
- **Value/KPI badge**: font, colors, background opacity, up/down KPI colors
- **Value format**: plain / thousands / compact (K/M) / percent of total, decimals, prefix/suffix
- **Links**: color, base width, curvature, golden-path highlight, top-variant highlight
- **Swimlanes**: on/off, 4 band colors, opacity, label style
- **Legend**: on/off (level color legend)
- **Data colors**: default color, or per-level (up to 6 configurable colors)

## Tips & Best Practices

- Order matters: the sequence you drag fields into **Levels** defines the hierarchy top to bottom, not the field names.
- A node can have more than one parent (e.g. two channels feeding the same downstream step) — the diagram handles this correctly, including collapse/expand.
- Collapsing a node hides its whole branch and recalculates values/targets/link widths for everything downstream, cutting only the contribution that passed through that branch.
- Use the Variants panel (toolbar button) to see the 8 highest-value complete paths and trace one on the diagram.
- Toggle tooltips off from the toolbar if you're projecting the report and want a cleaner view.
- The minimap appears automatically once the diagram has more than 6 nodes.

## Troubleshooting

- **Nothing renders**: check that at least 2 fields are in Levels and a measure is in Value.
- **Diagram looks cut off**: you're on the Free tier and the dataset has more than 9 nodes — upgrade to Pro for the full diagram.
- **A node isn't in the swimlane band I expect**: a node only joins a band if *every* row feeding it shares the same swimlane value; otherwise it stays neutral.
- **Page tooltip doesn't trigger on a node with 3+ hierarchy levels**: known limitation — falls back to the basic tooltip. Page tooltips work correctly on links.
