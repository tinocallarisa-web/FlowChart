# Flow Chart — Power BI Custom Visual

Data-driven process flow chart with native Power BI selection, cross-filtering and KPI-aware nodes.
Built by [TCViz](https://tcviz.com).

[Support & documentation](https://tinocallarisa-web.github.io/FlowChart/support.html) ·
[Changelog](https://tinocallarisa-web.github.io/FlowChart/changelog.html) ·
[Privacy](https://tinocallarisa-web.github.io/FlowChart/privacy.html) ·
[Terms](https://tinocallarisa-web.github.io/FlowChart/terms.html) ·
[Video walkthrough](https://www.youtube.com/watch?v=FotaI7ziHxg)

## What it does

Turns a flat table into a process diagram. Each field you drop into **Levels** becomes one stage of
the flow, in the order you place them; rows sharing a value at a given level merge into one node,
which is how branches form. The **Value** measure weights every node and link (optional: without it each
row counts 1). The visual is available in 12 languages.

- **Structure from field order** — no hierarchy column, no DAX preparation
- **Cycle detection** — transitions back to an earlier stage are drawn as discontinuous loops
  instead of distorting the layer order
- **Dominant path and top variant** highlighting, plus a variants panel (Pro) with the top 8
  end-to-end routes by value
- **KPI badges (Pro)** — value against target with a variation percentage
- **Swimlanes (Pro)** — colour bands across the levels
- **Collapse and expand (Pro)** branches, with cascading value recalculation downstream
- **Color rules (Pro)** — up to three, by value, share of total or variance against Target
- **Navigation** — zoom (buttons, Ctrl + wheel, keyboard), native scroll, minimap, fit to view;
  in-diagram search (Pro)
- **Make it yours** — 12 languages, style templates and setup tips, link labels, level headers,
  grid, backgrounds, legend and toolbar options, on-canvas formatting
- **Native integration** — selection, cross-filtering, context menu, standard and report page
  tooltips, keyboard navigation, high contrast

## Data roles

| Field well | Kind | Required | Purpose |
|---|---|---|---|
| Levels | Grouping (multiple) | Yes — two or more | One field per stage, in process order |
| Level images (Pro) | Measure (optional) | No | Base64 image strings from your model |
| Value | Measure | No — each row counts 1 without it | Weights nodes, links and the dominant path |
| Target — KPI badge (Pro) | Measure (optional) | No | Enables the KPI badge |
| Swimlane (Pro) | Grouping (optional) | No | Colour bands across levels |
| Tooltip fields (Pro) | Measure (multiple, optional) | No | Extra measures on hover |

Full setup instructions, the complete Format Pane reference and the FAQ are in
[support.html](https://tinocallarisa-web.github.io/FlowChart/support.html).

## Free vs Pro

- **Free** — the whole diagram, every node (up to the rows Power BI sends the visual, 1,000 by
  default), plus templates, link labels, level headers, grid, backgrounds, legend and toolbar
  options and 12 languages
- **Pro** — collapse/expand, node search, the Variants panel, swimlanes, node images, the KPI
  badge, extra tooltip fields and color rules, licensed through Microsoft AppSource. While editing
  without a licence, Pro is previewed on the five largest nodes under a watermark.

See [terms.html](https://tinocallarisa-web.github.io/FlowChart/terms.html) for the full breakdown.

## Privacy

No network calls of its own, no telemetry, no browser storage. Everything is computed from the
Power BI data view inside the report. The one outbound call is the licence check to Microsoft's own
licensing API. The start-screen links open only when clicked, through Power BI. See [privacy.html](https://tinocallarisa-web.github.io/FlowChart/privacy.html).

## Support

Open an [issue](https://github.com/tinocallarisa-web/FlowChart/issues), start a
[discussion](https://github.com/tinocallarisa-web/FlowChart/discussions), or email
[support@tcviz.com](mailto:support@tcviz.com). Including the visual version and your Power BI
Desktop build gets you an answer faster.

## Development

```bash
npm install
npx pbiviz start           # dev server
npx tsc --noEmit           # type-check
node build-test.js         # test build (Pro, forced) — guid_test, never uploaded
node build-test.js --free  # test build (Free, real licence check)
```

The source tree is always in production state: `isPro` resolved by the licence manager, GUID without
the `_test` suffix, no debug instrumentation. The test script patches, packages and restores — never
the other way round.

### Documentation build

`changelog.html` is generated, not edited by hand:

```bash
node tools/build-changelog.mjs           # regenerate changelog.html
node tools/build-changelog.mjs --check   # validate only
```

It reads the release history from `CHANGELOG.md` and the current version from `pbiviz.json`, and
exits non-zero if they disagree. Run the check before packaging.

### Production build

`npx pbiviz package` — only after tests have been confirmed. It uses the real GUID and resolves
Free/Pro through the actual AppSource licence. That package is the one and only artefact submitted
to Partner Center.

## Certification

The `certification` branch points at the exact commit of the submitted build. Review notes are in
[docs/CERTIFICATION-NOTES.md](docs/CERTIFICATION-NOTES.md).
