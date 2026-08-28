# Flow Chart — Power BI Custom Visual

Data-driven process flow chart with native Power BI selection, cross-filtering and KPI-aware nodes. Built by TCViz.

## What it does

Turns a flat table into a hierarchical flow/decomposition diagram, built automatically from the order in which you drag fields into **Levels**. Supports KPI badges (target vs. actual), swimlanes, golden-path and variant highlighting, collapsible branches, zoom/minimap/search navigation, and full native Power BI interactivity (selection, cross-filtering, tooltips).

## Data roles

| Role | Kind | Required |
|---|---|---|
| Levels | Grouping (multiple) | Yes (at least 2) |
| Level images | Measure (multiple, optional) | No |
| Value | Measure | Yes |
| Target | Measure (optional) | No |
| Swimlane | Grouping (optional) | No |
| Tooltip fields | Measure (multiple, optional) | No |

See [support.html](support.html) for full setup instructions and FAQ.

## Free vs Pro

- **Free**: diagrams up to 9 nodes, all features unlocked.
- **Pro**: unlimited nodes. Licensed through Microsoft AppSource.

See [terms.html](terms.html) for full tier details.

## Links

- [Support](support.html)
- [Privacy Policy](privacy.html)
- [Terms of Use](terms.html)
- Video walkthrough: https://www.youtube.com/watch?v=wXvxscw7e4k

## Development

```bash
npm install
npx pbiviz start        # dev server
npx tsc --noEmit         # type-check
node build-test.js       # test build (Pro, forced) — guid_test, never uploaded
node build-test.js --free # test build (Free, real license check)
```

Production build (`npx pbiviz package`, only after explicit confirmation) uses the real GUID and resolves Free/Pro via the actual Microsoft AppSource license — the one and only package submitted to Partner Center.
