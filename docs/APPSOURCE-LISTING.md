# AppSource listing copy — Flow Chart v1.2.0.0

Copy ready to paste into Partner Center, English only (the listing; the visual itself has 12
languages). **The marketplace description is the documentation most people read** — update it on
every release.

Limits measured in Partner Center: *Search results summary* 100 characters, *Description*
5,000 (truncated silently). **Editing this file does not change the offer**: the field
Microsoft reviews lives only in the console.

Counted with Python on 2026-10-27: summary **92** characters, description **4,072** characters (4,135 counting CRLF line breaks).

**TODO before submitting:** Tino records the 1.2 video. Replace `wXvxscw7e4k` here, in
`src/visual.ts` (URL_VIDEO), `docs/support.html` (iframe), `docs/CERTIFICATION-NOTES*`, `README.md`
and in Partner Center → Offer listing → Videos — canonical `https://www.youtube.com/watch?v=…` only.

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

Drag one field per level, in order. That is the whole setup. The visual builds the nodes, links them, orders each layer so the lines cross as little as possible, and sizes every link by your measure — or by the number of rows when there is none.

THE DIAGRAM

• One field per level, in the order you drag them — the field names do not matter
• Link width by value, so the main route is visible before anyone reads a number
• A node can have more than one parent: two channels feeding the same step draw correctly
• Rework loops back to an earlier level are drawn as dashed returns, not hidden
• Horizontal or vertical, with node and layer spacing under your control
• Zoom, fit and a minimap; large diagrams fit the visual when they load, and the toolbar, zoom buttons and minimap can be hidden

MAKE IT YOURS (FREE)

• Twelve languages, following Power BI
• Six style templates, and setup tips while you edit that apply them in one click
• Link labels: the value, its share of the total, or both
• Level headers with your field names, a background grid, a background colour and step numbers
• Node images with a background and a round, rounded or square shape
• Legend position, size and field names
• Format on the canvas: click a node, a link or the legend to format it there
• Numbers in your model's format, dynamic format strings included

NATIVE INTEGRATION

• Click a node or a link to cross-filter the report; Escape clears the selection
• Filters from other visuals are reflected in the diagram
• Tooltips on nodes and links: value, share of the total, inflow, outflow and origin
• Keyboard: arrow keys along the flow, Home and End, + / − / 0 to zoom; screen reader labels and high contrast

PRO

• Collapse and expand branches — the first thing you reach for past thirty nodes
• Node search, to find one step in a diagram you cannot read at a glance
• The Variants panel: the most travelled end-to-end paths, ranked, and traceable on the diagram
• Swimlanes: labelled bands by department, region or phase
• Node images from a Base64 column already in your model
• The KPI badge: add a Target measure and every node shows actual against target
• Color rules: up to three rules that colour a node by its value, its share of the total or its variance against Target
• Extra measures in the tooltip

FREE AND PRO

The free tier draws your whole diagram — every node, every link, in a published report too. What Pro adds is the layer on top: the tools that only start to matter once a diagram is too big to read at a glance, and the wells that turn it into an analysis.

While you edit a report without a licence, the Pro features you turn on are drawn working on the five largest nodes, under a "Pro preview" watermark naming them, so you can see them on your own data. Reading view shows the free result with no watermark, so a published report never uses a feature you have not paid for.

PRIVACY

The visual makes no network requests of any kind: no analytics, no telemetry, no external scripts. Your data never leaves the report. Node images must already be embedded in your model as Base64 — links to images on a web server are rejected on purpose, which is what makes that claim literally true.

GETTING STARTED

1. Drag two or more fields into Levels, in order from root to leaf.
2. Optionally add a measure to Value; without it each row counts 1.
3. Pick a style template from the setup tips. Pro: add a Target for the KPI badge, or a field to Swimlane to band the diagram.

Documentation and sample data: https://tinocallarisa-web.github.io/FlowChart/support.html
Support: support@tcviz.com

WHAT'S NEW IN 1.2.0.0

Twelve languages, style templates and setup tips, link labels, level headers, grid and backgrounds, legend and toolbar options, format on the canvas, keyboard navigation, and numbers in your model's format. New in Pro: color rules.
```

---

## URLs to keep in sync

| Field | URL |
|---|---|
| Support / documentation | https://tinocallarisa-web.github.io/FlowChart/support.html |
| Privacy policy | https://tinocallarisa-web.github.io/FlowChart/privacy.html |
| Terms / licence | https://tinocallarisa-web.github.io/FlowChart/terms.html |
| GitHub repo | https://github.com/tinocallarisa-web/FlowChart |
| Video | https://www.youtube.com/watch?v=wXvxscw7e4k (TODO: 1.2 video) |

Canonical YouTube URL only (policy 100.3.3.3). Shortened links, `/shorts/` and `/embed/` are
rejected automatically.

## Search keywords (max 3)

```
flow chart
process flow
process mining
```

**`process mining` replaces `Organization Chart` (2026-10-27).** That keyword was a bet,
made on 2026-09-22, on a parent–child mode for Flow Chart. Org charts went to their own visual
instead (Org Chart by TCViz, `Employee` + `Manager`), so the keyword was promising something Flow
Chart does not do: people arrived with the wrong data shape. Measured against the 85 visuals in
this niche, the most used keywords are `hierarchy` (18), `process mining` (10), `flow` (7) and
`tree` (5); `process mining` describes what the Variants panel and the rework loops actually do.

**`KPI` was dropped earlier.** It brought the wrong audience — someone searching KPI wants a card,
not a diagram — and it competed with KPI Card Pro for one of only three slots.

## Plan

| Field | Value |
|---|---|
| Plan ID | `flow-chart-tcviz` — Service ID `tino_callarisa.flow-chart.flow-chart-tcviz`, matched by `SP_IDENTIFIER` in `src/visual.ts` |
| Plan name | Flow Chart Pro |
| Plan description | Unlocks collapse and expand, the node search, the Variants panel, swimlanes, node images, the KPI badge, extra tooltip fields and color rules. |

## Images

| Asset | File |
|---|---|
| Offer screenshot | `docs/infographic.html` → *Download PNG*, 1366×768 (updated for 1.2; re-export and upload) |
| Offer icon | `assets/icon300.png` (new TCViz series icon, 300×300), uploaded by hand: it does not travel inside the package |
| Package icon | `assets/icon.png`, embedded as `content.iconBase64` |

## What to paste in Partner Center for 1.2.0.0

1. Offer listing → Description (the block above) and, if changed, the summary.
2. Search keywords: replace `Organization Chart` with `process mining`.
3. Screenshots: the re-exported infographic. Logo: `assets/icon300.png`.
4. Plan "Flow Chart Pro" → Plan description (adds color rules).
5. Videos: the 1.2 video when it exists (canonical URL).
6. Notes for certification: `docs/CERTIFICATION-NOTES-SHORT.txt` (the field empties on every submission).
