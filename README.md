# Flow Chart — Power BI Custom Visual

Data-driven process flow chart with native Power BI selection, cross-filtering and KPI-aware nodes.
Built by [TCViz](https://tcviz.com).

[Support & documentation](https://tinocallarisa-web.github.io/FlowChart/support.html) ·
[Changelog](https://tinocallarisa-web.github.io/FlowChart/changelog.html) ·
[Privacy](https://tinocallarisa-web.github.io/FlowChart/privacy.html) ·
[Terms](https://tinocallarisa-web.github.io/FlowChart/terms.html) ·
[Video walkthrough](https://www.youtube.com/watch?v=wXvxscw7e4k)

## What it does

Turns a flat table into a process diagram. Each field you drop into **Levels** becomes one stage of
the flow, in the order you place them; rows sharing a value at a given level merge into one node,
which is how branches form. The **Value** measure weights every node and link.

- **Structure from field order** — no hierarchy column, no DAX preparation
- **Cycle detection** — transitions back to an earlier stage are drawn as discontinuous loops
  instead of distorting the layer order
- **Dominant path and top variant** highlighting, plus a variants panel with the top 8 end-to-end
  routes by value
- **KPI badges** — value against target with a variation percentage
- **Swimlanes** — colour bands across the levels
- **Collapse and expand** branches, with cascading value recalculation downstream
- **Navigation** — zoom, native scroll, minimap, in-diagram search, fit to view
- **Native integration** — selection, cross-filtering, context menu, standard and report page
  tooltips, keyboard focus, high contrast

## Data roles

| Field well | Kind | Required | Purpose |
|---|---|---|---|
| Levels | Grouping (multiple) | Yes | One field per stage, in process order |
| Level images | Measure (optional) | No | Base64 image strings from your model |
| Value | Measure | Yes | Weights nodes, links and the dominant path |
| Target | Measure (optional) | No | Enables the KPI badge |
| Swimlane | Grouping (optional) | No | Colour bands across levels |
| Tooltip fields | Measure (multiple, optional) | No | Extra measures on hover |

Full setup instructions, the complete Format Pane reference and the FAQ are in
[support.html](https://tinocallarisa-web.github.io/FlowChart/support.html).

## Free vs Pro

Every feature is unlocked in the Free tier. The only limit is size.

- **Free** — diagrams up to 9 nodes, kept as a connected sub-tree from the root
- **Pro** — unlimited nodes, licensed through Microsoft AppSource

See [terms.html](https://tinocallarisa-web.github.io/FlowChart/terms.html) for the full breakdown.

## Privacy

No network calls of its own, no telemetry, no browser storage. Everything is computed from the
Power BI data view inside the report. The one outbound call is the licence check to Microsoft's own
licensing API. See [privacy.html](https://tinocallarisa-web.github.io/FlowChart/privacy.html).

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
