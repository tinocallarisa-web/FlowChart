# Certification Notes — Flow Chart v1.0.0.0

## Visual Information

| Field | Value |
|---|---|
| Display Name | Flow Chart |
| GUID | flowChart69C501A62F7E49748AD3DA7D4E840200 |
| Version | 1.0.0.0 |
| Author | Tino Callarisa / TCViz |
| Support URL | https://tinocallarisa-web.github.io/FlowChart/support.html |
| Privacy URL | https://tinocallarisa-web.github.io/FlowChart/privacy.html |

## Links

- **Certification branch:** https://github.com/tinocallarisa-web/FlowChart/tree/certification
- **Support page:** https://tinocallarisa-web.github.io/FlowChart/support.html
- **Privacy policy:** https://tinocallarisa-web.github.io/FlowChart/privacy.html
- **Terms of service:** https://tinocallarisa-web.github.io/FlowChart/terms.html
- **Demo video:** https://www.youtube.com/watch?v=wXvxscw7e4k

---

## License Validation

License is resolved via the official Power BI `IVisualLicenseManager` API:

```typescript
const licenseResult = await this.licenseManager.getAvailableServicePlans();
this.isPro = licenseResult.plans?.some(
    plan => plan.spIdentifier === "flow-chart-tcviz" &&
            plan.state === ServicePlanState.Active
) ?? false;
```

- No external server calls for license validation
- Resolution is asynchronous and does not block rendering
- If validation fails or is unavailable, the visual falls back gracefully to the Free tier
- `ServicePlanState.Active` is used as an imported enum value (not the numeric literal trick — see visual.ts)
- `spIdentifier` must match the Plan ID configured for this offer in Partner Center exactly: `flow-chart-tcviz`

---

## Free vs Pro Features

### Free tier (no license required)
- Full hierarchical flow diagram: Levels, Value, Target, Swimlane, Tooltip fields — all data roles available
- KPI badges (target vs. actual with variation %)
- Golden path / dominant-route highlighting
- Top-variant highlighting and Variants panel
- Swimlanes, collapse/expand, zoom, minimap, search, fit-to-view
- Native selection, cross-filtering, context menu, tooltips (basic and report/page)
- Full format pane customization
- **Diagrams are capped at 9 nodes.** Diagrams with more nodes are trimmed (kept as a connected sub-tree from the root) and a message is shown in the toolbar.

### Pro tier (requires AppSource license)
- Unlimited nodes — no diagram size restriction
- All Free tier features

---

## Privacy & Network Access

This visual makes **no external network requests** of any kind.

- No telemetry
- No analytics calls
- No CDN or font loading at runtime
- No data leaves the Power BI environment
- All computation is local and in-memory

Data processed: level labels, numeric Value/Target measures, optional Swimlane and Tooltip field values, and optional base64 Level images — all sourced exclusively from the Power BI dataView passed to `update()`. Level images are rendered directly from the base64 string supplied by the data model; no image is fetched from a URL or persisted outside the report.

---

## Capabilities Compliance

All five required flags are present in `capabilities.json`:

```json
"supportsHighlight": true,
"supportsSynchronizingFilterState": true,
"supportsLandingPage": true,
"supportsKeyboardFocus": true,
"supportsMultiVisualSelection": true
```

Rendering events are implemented in all code paths of `update()`:

```typescript
this.events.renderingStarted(options);
try {
    // render logic
    this.events.renderingFinished(options);
} catch (e) {
    this.events.renderingFailed(options, String(e));
}
```

Selection/cross-filtering: each node and link accumulates the identities of every row that feeds it (not just one arbitrary row), so cross-filtering to other visuals reflects the full contribution.

---

## Testing Instructions

### Free tier test
1. Import the `_test` build (run `node build-test.js --free`) into Power BI Desktop
2. Drag 3+ fields into **Levels** (in order) and a measure into **Value**, using a dataset with more than 9 total nodes (e.g. `sample_data_levels.csv` or `sample_data_swimlanes.csv`)
3. Verify: only 9 nodes render, kept as a connected sub-tree from the root, with a "Free: showing 9 of N nodes" message in the toolbar
4. Click a node/link — verify cross-filtering works on other visuals
5. Verify collapse/expand, zoom, minimap, search all work normally within the 9-node limit

### Pro tier test
_(Use the default test build — `node build-test.js`, `isPro` forced to `true`)_
1. Use the same dataset with more than 9 nodes — verify the full diagram renders, no limit message
2. Drag a measure into **Target** — verify KPI badges show actual value + ▲/▼ variation %
3. Drag a field into **Swimlane** — verify colored bands appear across levels
4. Open the Variants panel — verify top paths are listed and clicking one traces it in the diagram
5. Collapse a mid-level node — verify downstream values/badges/link thickness recalculate correctly

---

## Known Warnings (non-blocking)

The following warning appears in the pbiviz build output and is informational only:

- `Localizations`: `stringResources` is empty (single-language visual, no UI strings hardcoded in English that need translation beyond the format pane, which uses plain `displayName` strings via `powerbi-visuals-utils-formattingmodel`). Not required for certification.
