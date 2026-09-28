# AppSource listing copy — Flow Chart v1.1.0.0

Copy ready to paste into Partner Center, English only. **The marketplace description is the
documentation most people read** — update it on every release.

Limits measured in Partner Center: *Search results summary* 100 characters, *Description*
5,000 (truncated silently). **Editing this file does not change the offer**: the field
Microsoft reviews lives only in the console.

---

## Offer name

```
Flow Chart
```

---

## Search results summary

```
Process and hierarchy diagrams for Power BI: levels to nodes, with swimlanes and KPI badges.
```

---

## Description

```
A process lives in a table: one row per case, one column per step. Flow Chart turns those columns into the diagram people actually argue about — where the volume goes, where it comes back, and where it stops.

Drag one field per level, in order, plus a measure. That is the whole setup. The visual builds the nodes, links them, orders each layer so the lines cross as little as possible, and sizes every link by its value.

THE DIAGRAM

• One field per hierarchy level, in the order you drag them — the field names do not matter
• Link width by value, so the main route is visible before anyone reads a number
• A node can have more than one parent: two channels feeding the same step draw correctly
• Rework loops back to an earlier level are drawn as dashed returns, not hidden
• Horizontal or vertical, with node and layer spacing under your control
• Colour by level or a single colour, with a legend
• Zoom, fit and a minimap for diagrams that outgrow the canvas

NATIVE INTEGRATION

• Click a node or a link to cross-filter the report; the rest of the page follows
• Filters from other visuals are reflected in the diagram
• Tooltips on nodes and links, with the value and its share of the total
• Keyboard navigation, screen reader labels and high contrast

PRO

• Collapse and expand branches — the first thing you reach for past thirty nodes
• Node search, to find one step in a diagram you cannot read at a glance
• The Variants panel: the most travelled end-to-end paths, ranked, and traceable on the diagram
• Swimlanes: labelled bands by department, region or phase
• Node images from a Base64 column already in your model
• The KPI badge: add a Target measure and every node shows actual against target
• Extra measures in the tooltip

FREE AND PRO

The free tier draws your whole diagram — every node, every link, in a published report too. Until version 1.1.0.0 it stopped at nine nodes, which is not a smaller diagram but a picture of a flow that does not exist. What Pro adds is the layer on top: the tools that only start to matter once a diagram is too big to read at a glance, and the wells that turn it into an analysis.

While you edit a report without a licence, a Pro feature you turn on is drawn working, under a "Pro preview" watermark naming it, so you can see exactly what you would be buying. Reading view shows the free result with no watermark, so a published report never uses a feature you have not paid for.

PRIVACY

The visual makes no network requests of any kind: no analytics, no telemetry, no external scripts. Your data never leaves the report. Node images must already be embedded in your model as Base64 — links to images on a web server are rejected on purpose, which is what makes that claim literally true.

GETTING STARTED

1. Drag your hierarchy fields into Levels, in order from root to leaf.
2. Add a measure to Value.
3. Pro: add a Target for the KPI badge, or a field to Swimlane to band the diagram.

Documentation and sample data: https://tinocallarisa-web.github.io/FlowChart/support.html
Support: support@tcviz.com

WHAT'S NEW IN 1.1.0.0

The node cap is gone: the free tier now draws the whole diagram, always. Pro is the layer on top — collapse and expand, node search, the Variants panel, swimlanes, node images, the KPI badge and extra tooltips — and every one of them can be previewed before buying.
```

---

## URLs to keep in sync

| Field | URL |
|---|---|
| Support / documentation | https://tinocallarisa-web.github.io/FlowChart/support.html |
| Privacy policy | https://tinocallarisa-web.github.io/FlowChart/privacy.html |
| Terms / licence | https://tinocallarisa-web.github.io/FlowChart/terms.html |
| GitHub repo | https://github.com/tinocallarisa-web/FlowChart |
| Video | https://www.youtube.com/watch?v=wXvxscw7e4k |

Canonical YouTube URL only (policy 100.3.3.3). `youtu.be`, `/shorts/` and `/embed/` are
rejected automatically.

## Search keywords (max 3)

```
flow chart
process flow
Organization Chart
```

**`Organization Chart` is a bet on the next version, decided on 2026-09-22.** The visual
does not do org charts yet: a real one arrives as `Employee ID` + `Manager ID`, and Flow
Chart needs one field per level. The hierarchical mode that reads parent–child is the next
release.

The timing works out: a keyword is not live until roughly three weeks after submission —
one to approve, two for capabilities to reach reports — and then it takes longer still to
rank. The risk is the window in between: if that mode slips, people arrive with the wrong
data shape and cannot build what they came for.

Measured against the 85 visuals in this niche, the most used keywords are `hierarchy` (18),
`process mining` (10), `flow` (7) and `tree` (5). Only 3 use `org chart` — which is the
whole point: the niche has 26 ratings at 2.0 and nobody above 3.0.

**`KPI` was dropped.** It brought the wrong audience — someone searching KPI wants a card,
not a diagram — and it competed with KPI Card Pro for one of only three slots.

## Plan

| Field | Value |
|---|---|
| Plan ID | `flow-chart-tcviz` — Service ID `tino_callarisa.flow-chart.flow-chart-tcviz`, matched by `SP_IDENTIFIER` in `src/visual.ts` |
| Plan name | Flow Chart Pro |
| Plan description | Unlocks collapse and expand, the node search, the Variants panel, swimlanes, node images, the KPI badge and extra tooltip fields. |

## Images

| Asset | File |
|---|---|
| Offer screenshot | `docs/infographic.html` → *Download PNG*, 1366×768 |
| Offer icon | 300×300, uploaded by hand: it does not travel inside the package |
| Package icon | `assets/icon.png`, embedded as `content.iconBase64` |
