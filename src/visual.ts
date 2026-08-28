"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import DataViewTableRow = powerbi.DataViewTableRow;

import { VisualFormattingSettingsModel } from "./settings";

interface FlowNode {
    id: string;
    label: string;
    layer: number;
    order: number;
    x: number;
    y: number;
    width: number;
    height: number;
    selectionIds: ISelectionId[];
    inValue: number;
    outValue: number;
    originLabels: string[];
    image: string | null;
    swimlane: string | null;
    targetValue: number;
    hasTarget: boolean;
    displayColor: string;
    extraTooltips: TooltipItem[];
}

interface FlowLink {
    id: string;
    sourceId: string;
    targetId: string;
    value: number;
    targetValue: number;
    selectionIds: ISelectionId[];
    tooltipItems: TooltipItem[];
    extra: TooltipItem[];
    displayColor: string;
}

interface TooltipItem {
    displayName: string;
    value: string;
    header?: string;
    color?: string;
}

interface FlowVariant {
    path: string;
    value: number;
    count: number;
    linkIds: string[];
}

interface RowChain {
    chain: string[];
    value: number;
    targetValue: number;
}

interface ParsedData {
    nodes: FlowNode[];
    links: FlowLink[];
    totalValue: number;
    variants: FlowVariant[];
    rowChains: RowChain[];
}

const NODE_HEIGHT = 36;
const LAYER_GAP = 100;
const NODE_GAP = 24;
const MARGIN = 24;
const NODE_MIN_WIDTH = 100;
const NODE_H_PADDING = 24;
const IMAGE_SIZE = 24;
const IMAGE_PADDING = 8;
const LEVEL_PALETTE = ["#2B6CB0", "#3E9C5B", "#D9A441", "#8E5FC4", "#C9524A", "#0E9AA7"];

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private events: powerbi.extensibility.IVisualEventService;
    private svgRoot: SVGSVGElement;
    private data: ParsedData;
    private direction: string = "horizontal";
    private width: number = 0;
    private height: number = 0;
    private measureCtx: CanvasRenderingContext2D;
    private zoomScale: number = 1;
    private contentWidth: number = 0;
    private contentHeight: number = 0;
    private minimapScale: number = 1;
    private isDraggingMinimap: boolean = false;
    private variantsPanelOpen: boolean = false;
    private tracedVariantPath: string | null = null;
    private collapsedNodes: Set<string> = new Set();
    private visibleInValue: Map<string, number> = new Map();
    private visibleOutValue: Map<string, number> = new Map();
    private visibleTargetValue: Map<string, number> = new Map();
    private edgeVisibleValue: Map<string, number> = new Map();
    private edgeVisibleTarget: Map<string, number> = new Map();
    private tooltipsEnabled: boolean = true;
    private centeringApplied: boolean = false;
    private swimlaneBands: { label: string; start: number; end: number; axisStart: number }[] = [];

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.events = this.host.eventService;

        this.target.style.overflow = "hidden";
        this.target.tabIndex = 0;

        this.selectionManager.registerOnSelectCallback(() => {
            this.applySelectionDimming();
        });

        window.addEventListener("mousemove", (e: MouseEvent) => {
            if (this.isDraggingMinimap) {
                this.navigateFromMinimapEvent(e);
            }
        });

        window.addEventListener("mouseup", () => {
            this.isDraggingMinimap = false;
        });
    }

    private navigateFromMinimapEvent(e: MouseEvent): void {
        const minimapSvg = this.target.querySelector(".flow-minimap-svg") as SVGSVGElement;
        const scrollEl = this.target.querySelector(".flow-scroll") as HTMLElement;
        if (!minimapSvg || !scrollEl || !this.minimapScale) return;
        const rect = minimapSvg.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const contentX = clickX / this.minimapScale;
        const contentY = clickY / this.minimapScale;
        scrollEl.scrollLeft = contentX * this.zoomScale - this.width / 2;
        scrollEl.scrollTop = contentY * this.zoomScale - this.height / 2;
        this.updateMinimapViewport();
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel,
                options.dataViews && options.dataViews[0]
            );

            this.width = options.viewport.width;
            this.height = options.viewport.height;
            this.direction = this.formattingSettings?.layoutCard?.direction?.value?.value?.toString() ?? "horizontal";

            const dataView = options.dataViews && options.dataViews[0];
            if (!dataView || !dataView.table) {
                this.renderEmpty();
                this.events.renderingFinished(options);
                return;
            }

            this.data = this.parseDataView(dataView);
            this.computeLayout();
            this.render();

            this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, String(e));
        }
    }

    private renderEmpty(): void {
        /* eslint-disable powerbi-visuals/no-inner-outer-html */
        this.target.innerHTML = `<div style="padding:16px;color:#83827D;font:12px 'Segoe UI',sans-serif;">Drag one field per hierarchy level into "Levels" (in order), plus a Value measure.</div>`;
        /* eslint-enable powerbi-visuals/no-inner-outer-html */
    }

    private measureTextWidth(text: string, fontSize: number, fontFamily: string): number {
        if (!this.measureCtx) {
            const canvas = document.createElement("canvas");
            this.measureCtx = canvas.getContext("2d");
        }
        this.measureCtx.font = `${fontSize}px ${fontFamily}`;
        return this.measureCtx.measureText(text).width;
    }

    private formatValue(value: number, percentBase?: number): string {
        const fmt = this.formattingSettings?.valueFormatCard;
        const type = fmt?.format?.value?.value?.toString() ?? "thousands";
        const decimals = fmt?.decimals?.value ?? 0;
        const prefix = fmt?.prefix?.value ?? "";
        const suffix = fmt?.suffix?.value ?? "";

        let body: string;
        if (type === "compact") {
            const abs = Math.abs(value);
            if (abs >= 1e6) body = (value / 1e6).toFixed(decimals) + "M";
            else if (abs >= 1e3) body = (value / 1e3).toFixed(decimals) + "K";
            else body = value.toFixed(decimals);
        } else if (type === "percent") {
            const base = percentBase && percentBase > 0 ? percentBase : (this.data?.totalValue || 0);
            const pct = base > 0 ? (value / base) * 100 : 0;
            body = pct.toFixed(decimals) + "%";
        } else if (type === "plain") {
            body = value.toFixed(decimals);
        } else {
            body = value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
        return `${prefix}${body}${suffix}`;
    }

    private parseDataView(dataView: DataView): ParsedData {
        const table = dataView.table;
        const columns = table.columns;

        const levelIdxs = columns.map((c, i) => (c.roles && c.roles["levels"] ? i : -1)).filter(i => i >= 0);
        const levelImageIdxs = columns.map((c, i) => (c.roles && c.roles["levelImages"] ? i : -1)).filter(i => i >= 0);
        const valueIdx = columns.findIndex(c => c.roles && c.roles["value"]);
        const targetIdx = columns.findIndex(c => c.roles && c.roles["target"]);
        const swimlaneIdx = columns.findIndex(c => c.roles && c.roles["swimlane"]);
        const tooltipIdxs = columns
            .map((c, i) => (c.roles && c.roles["tooltips"] ? i : -1))
            .filter(i => i >= 0);

        const nodeMap = new Map<string, FlowNode>();
        const linkMap = new Map<string, FlowLink>();
        const variantMap = new Map<string, FlowVariant>();
        const swimlaneSeen = new Map<string, Set<string>>();
        const rowChains: RowChain[] = [];

        const fontSize = this.formattingSettings?.nodeCard?.fontSize?.value ?? 12;
        const fontFamily = this.formattingSettings?.nodeCard?.fontFamily?.value?.value?.toString() ?? "'Segoe UI',sans-serif";
        const minWidth = this.formattingSettings?.nodeCard?.width?.value ?? NODE_MIN_WIDTH;
        const nodeHeight = this.formattingSettings?.nodeCard?.height?.value ?? NODE_HEIGHT;
        const imageSize = this.formattingSettings?.nodeCard?.imageSize?.value ?? IMAGE_SIZE;

        const getOrCreateNode = (key: string, label: string, levelIndex: number, image: string | null): FlowNode => {
            if (!nodeMap.has(key)) {
                const textWidth = this.measureTextWidth(label, fontSize, fontFamily);
                const imageOffset = image ? imageSize + IMAGE_PADDING : 0;
                nodeMap.set(key, {
                    id: key,
                    label,
                    layer: levelIndex,
                    order: 0,
                    x: 0,
                    y: 0,
                    width: Math.max(minWidth, Math.ceil(textWidth) + NODE_H_PADDING * 2) + imageOffset,
                    height: nodeHeight,
                    selectionIds: [],
                    inValue: 0,
                    outValue: 0,
                    originLabels: [],
                    image,
                    swimlane: null,
                    targetValue: 0,
                    hasTarget: false,
                    displayColor: "#6B7A99",
                    extraTooltips: []
                });
            }
            return nodeMap.get(key);
        };

        (table.rows || []).forEach((row: DataViewTableRow, rowIndex: number) => {
            const value = valueIdx >= 0 ? Number(row[valueIdx]) || 0 : 1;

            const chain: { key: string; label: string; levelIndex: number }[] = [];
            for (let li = 0; li < levelIdxs.length; li++) {
                const raw = row[levelIdxs[li]];
                if (raw === null || raw === undefined || String(raw) === "") break;
                const label = String(raw);
                chain.push({ key: `L${li}::${label}`, label, levelIndex: li });
            }
            if (chain.length < 2) return;

            const swimlane = swimlaneIdx >= 0 ? String(row[swimlaneIdx] ?? "") || null : null;
            const targetVal = targetIdx >= 0 ? Number(row[targetIdx]) : null;
            const hasTargetVal = targetVal !== null && !isNaN(targetVal);
            rowChains.push({ chain: chain.map(c => c.key), value, targetValue: hasTargetVal ? targetVal : 0 });

            chain.forEach((node, li) => {
                let image: string | null = null;
                if (levelImageIdxs[li] !== undefined) {
                    const imageValue = String(row[levelImageIdxs[li]] ?? "");
                    if (/^data:image\/(png|jpe?g|gif|svg\+xml|webp);base64,/i.test(imageValue)) {
                        image = imageValue;
                    }
                }
                const flowNode = getOrCreateNode(node.key, node.label, node.levelIndex, image);
                flowNode.selectionIds.push(this.host.createSelectionIdBuilder().withTable(table, rowIndex).createSelectionId());
                if (swimlane) {
                    if (!swimlaneSeen.has(node.key)) swimlaneSeen.set(node.key, new Set());
                    swimlaneSeen.get(node.key).add(swimlane);
                }
                if (flowNode.extraTooltips.length === 0 && tooltipIdxs.length) {
                    flowNode.extraTooltips = tooltipIdxs.map(idx => ({
                        displayName: columns[idx].displayName,
                        value: String(row[idx] ?? "")
                    }));
                }
            });

            for (let i = 0; i < chain.length - 1; i++) {
                const parent = nodeMap.get(chain[i].key);
                const child = nodeMap.get(chain[i + 1].key);
                parent.outValue += value;
                child.inValue += value;
                if (hasTargetVal) {
                    child.targetValue += targetVal;
                    child.hasTarget = true;
                }
                if (!child.originLabels.includes(parent.label)) {
                    child.originLabels.push(parent.label);
                }

                const linkKey = `${parent.id}→${child.id}`;
                let link = linkMap.get(linkKey);
                if (!link) {
                    link = {
                        id: linkKey,
                        sourceId: parent.id,
                        targetId: child.id,
                        value: 0,
                        targetValue: 0,
                        selectionIds: [],
                        tooltipItems: [],
                        extra: [],
                        displayColor: "#B7C0D8"
                    };
                    linkMap.set(linkKey, link);
                }
                link.value += value;
                if (hasTargetVal) link.targetValue += targetVal;
                link.selectionIds.push(this.host.createSelectionIdBuilder().withTable(table, rowIndex).createSelectionId());

                if (i === chain.length - 2) {
                    const extra: TooltipItem[] = [];
                    tooltipIdxs.forEach(idx => {
                        extra.push({
                            displayName: columns[idx].displayName,
                            value: String(row[idx] ?? "")
                        });
                    });
                    link.extra = extra;
                }
            }

            const pathKey = chain.map(c => c.label).join(" > ");
            const linkIds = chain.slice(0, -1).map((c, i) => `${c.key}→${chain[i + 1].key}`);
            let variant = variantMap.get(pathKey);
            if (!variant) {
                variant = { path: pathKey, value: 0, count: 0, linkIds };
                variantMap.set(pathKey, variant);
            }
            variant.value += value;
            variant.count += 1;
        });

        const variants = Array.from(variantMap.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        const totalValue = Array.from(nodeMap.values())
            .filter(n => n.layer === 0)
            .reduce((sum, n) => sum + n.outValue, 0);

        linkMap.forEach(link => {
            const s = nodeMap.get(link.sourceId);
            const t = nodeMap.get(link.targetId);
            link.tooltipItems = [
                { displayName: "Source", value: s?.label ?? link.sourceId },
                { displayName: "Target", value: t?.label ?? link.targetId },
                { displayName: "Value", value: this.formatValue(link.value, totalValue) },
                ...link.extra
            ];
        });

        nodeMap.forEach((n, key) => {
            const seen = swimlaneSeen.get(key);
            n.swimlane = seen && seen.size === 1 ? Array.from(seen)[0] : null;
        });

        return { nodes: Array.from(nodeMap.values()), links: Array.from(linkMap.values()), totalValue, variants, rowChains };
    }

    private computeLayout(): void {
        this.centeringApplied = false;
        const { nodes, links } = this.data;
        const nodeById = new Map(nodes.map(n => [n.id, n]));

        const layers = new Map<number, FlowNode[]>();
        nodes.forEach(n => {
            if (!layers.has(n.layer)) layers.set(n.layer, []);
            layers.get(n.layer).push(n);
        });

        const sortedLayerIndexes = Array.from(layers.keys()).sort((a, b) => a - b);

        // Assign an initial order to the first layer, then order every later layer
        // by the average order of its parent nodes (barycenter heuristic) so that
        // branches from the same parent stay visually grouped and crossings are minimized.
        const incomingSources = new Map<string, string[]>();
        nodes.forEach(n => incomingSources.set(n.id, []));
        links.forEach(l => incomingSources.get(l.targetId)?.push(l.sourceId));

        sortedLayerIndexes.forEach((li, layerPos) => {
            const layerNodes = layers.get(li);
            if (layerPos > 0) {
                const bary = new Map<string, number>();
                layerNodes.forEach(n => {
                    const parents = (incomingSources.get(n.id) || [])
                        .map(pid => nodeById.get(pid))
                        .filter(p => !!p);
                    bary.set(n.id, parents.length ? parents.reduce((s, p) => s + p.order, 0) / parents.length : 0);
                });
                layerNodes.sort((a, b) => bary.get(a.id) - bary.get(b.id));
            }
            layerNodes.forEach((n, i) => { n.order = i; });
        });

        const isHorizontal = this.direction === "horizontal";
        const nodeGap = this.formattingSettings?.layoutCard?.nodeGap?.value ?? NODE_GAP;
        const layerGap = this.formattingSettings?.layoutCard?.layerGap?.value ?? LAYER_GAP;
        const nodeHeight = this.formattingSettings?.nodeCard?.height?.value ?? NODE_HEIGHT;
        const showSwimlanes = this.formattingSettings?.swimlaneCard?.show?.value ?? true;

        const swimlaneValues = Array.from(new Set(nodes.map(n => n.swimlane).filter((s): s is string => s !== null)));
        const hasSwimlanes = showSwimlanes && swimlaneValues.length > 0;
        const UNASSIGNED = "__none__";
        const bandLabels = hasSwimlanes ? [...swimlaneValues, UNASSIGNED] : [];
        const bandIndex = new Map(bandLabels.map((s, i) => [s, i]));
        const SWIMLANE_GAP = 28;
        const SWIMLANE_LABEL_GAP = 20;
        const SWIMLANE_PAD = 14;

        if (hasSwimlanes) {
            sortedLayerIndexes.forEach(li => {
                const layerNodes = layers.get(li);
                layerNodes.sort((a, b) => {
                    const ia = bandIndex.get(a.swimlane ?? UNASSIGNED);
                    const ib = bandIndex.get(b.swimlane ?? UNASSIGNED);
                    return ia - ib;
                });
                layerNodes.forEach((n, i) => { n.order = i; });
            });
        }

        this.swimlaneBands = [];

        if (isHorizontal) {
            let offsetY = MARGIN + (hasSwimlanes ? 40 : 0);
            const bandOffsetStart = new Map<string, number>();

            if (hasSwimlanes) {
                swimlaneValues.forEach(band => {
                    const maxCountInLayer = Math.max(0, ...sortedLayerIndexes.map(li =>
                        layers.get(li).filter(n => n.swimlane === band).length
                    ));
                    if (maxCountInLayer === 0) return;
                    const bandHeight = SWIMLANE_LABEL_GAP + maxCountInLayer * nodeHeight + (maxCountInLayer - 1) * nodeGap + SWIMLANE_PAD;
                    bandOffsetStart.set(band, offsetY + SWIMLANE_LABEL_GAP);
                    this.swimlaneBands.push({ label: band, start: offsetY, end: offsetY + bandHeight, axisStart: MARGIN });
                    offsetY += bandHeight + SWIMLANE_GAP;
                });
                if (swimlaneValues.length) offsetY -= SWIMLANE_GAP;
            }

            const layerHeights = sortedLayerIndexes.map(li => {
                const count = layers.get(li).length;
                return count * nodeHeight + (count - 1) * nodeGap;
            });
            const maxLayerHeight = Math.max(...layerHeights, offsetY - MARGIN);

            let cursorX = MARGIN;
            sortedLayerIndexes.forEach((layerIndex, i) => {
                const layerNodes = layers.get(layerIndex);
                const layerWidth = Math.max(...layerNodes.map(n => n.width));
                const offsetYCentered = MARGIN + (maxLayerHeight - layerHeights[i]) / 2;
                const layerHasAnyAssigned = layerNodes.some(n => n.swimlane !== null);

                if (hasSwimlanes && layerHasAnyAssigned) {
                    const bandCounters = new Map<string, number>();
                    layerNodes.forEach(n => {
                        const band = n.swimlane ?? UNASSIGNED;
                        const idx = bandCounters.get(band) ?? 0;
                        bandCounters.set(band, idx + 1);
                        n.x = cursorX;
                        n.y = (bandOffsetStart.get(band) ?? MARGIN) + idx * (nodeHeight + nodeGap);
                    });
                } else {
                    layerNodes.forEach((n, order) => {
                        n.order = order;
                        n.x = cursorX;
                        n.y = offsetYCentered + order * (nodeHeight + nodeGap);
                    });
                }
                cursorX += layerWidth + layerGap;
            });
        } else {
            let offsetX = MARGIN;
            const bandOffsetStart = new Map<string, number>();
            const bandWidthMap = new Map<string, number>();

            if (hasSwimlanes) {
                swimlaneValues.forEach(band => {
                    const maxWidthInLayer = Math.max(0, ...sortedLayerIndexes.map(li => {
                        const bandNodes = layers.get(li).filter(n => n.swimlane === band);
                        return bandNodes.reduce((sum, n) => sum + n.width, 0) + Math.max(0, bandNodes.length - 1) * nodeGap;
                    }));
                    if (maxWidthInLayer === 0) return;
                    bandOffsetStart.set(band, offsetX + SWIMLANE_PAD / 2);
                    bandWidthMap.set(band, maxWidthInLayer);
                    this.swimlaneBands.push({ label: band, start: offsetX, end: offsetX + maxWidthInLayer + SWIMLANE_PAD, axisStart: MARGIN });
                    offsetX += maxWidthInLayer + SWIMLANE_PAD + SWIMLANE_GAP;
                });
                if (swimlaneValues.length) offsetX -= SWIMLANE_GAP;
            }

            const layerWidths = sortedLayerIndexes.map(li => {
                const layerNodes = layers.get(li);
                return layerNodes.reduce((sum, n) => sum + n.width, 0) + (layerNodes.length - 1) * nodeGap;
            });
            const maxLayerWidth = Math.max(...layerWidths, offsetX - MARGIN);

            let cursorY = MARGIN + (hasSwimlanes ? SWIMLANE_LABEL_GAP : 0);
            sortedLayerIndexes.forEach((layerIndex, i) => {
                const layerNodes = layers.get(layerIndex);
                let cursorX = MARGIN + (maxLayerWidth - layerWidths[i]) / 2;
                const layerHasAnyAssigned = layerNodes.some(n => n.swimlane !== null);

                if (hasSwimlanes && layerHasAnyAssigned) {
                    const byBand = new Map<string, FlowNode[]>();
                    layerNodes.forEach(n => {
                        const band = n.swimlane ?? UNASSIGNED;
                        if (!byBand.has(band)) byBand.set(band, []);
                        byBand.get(band).push(n);
                    });
                    byBand.forEach((bandNodes, band) => {
                        const groupWidth = bandNodes.reduce((sum, n) => sum + n.width, 0) + (bandNodes.length - 1) * nodeGap;
                        const bandTotalWidth = bandWidthMap.get(band) ?? groupWidth;
                        let x = (bandOffsetStart.get(band) ?? MARGIN) + Math.max(0, (bandTotalWidth - groupWidth) / 2);
                        bandNodes.forEach(n => {
                            n.y = cursorY;
                            n.x = x;
                            x += n.width + nodeGap;
                        });
                    });
                    cursorY += nodeHeight + layerGap;
                    return;
                }

                layerNodes.forEach((n, order) => {
                    n.order = order;
                    n.y = cursorY;
                    n.x = cursorX;
                    cursorX += n.width + nodeGap;
                });
                cursorY += nodeHeight + layerGap;
            });
        }

        if (hasSwimlanes) {
            this.swimlaneBands.forEach(band => {
                const bandNodes = nodes.filter(n => n.swimlane === band.label);
                band.axisStart = bandNodes.length ? Math.min(...bandNodes.map(n => isHorizontal ? n.x : n.y)) : MARGIN;
            });
        }
    }

    private render(): void {
        const childrenOf = new Map<string, string[]>();
        this.data.links.forEach(l => {
            if (!childrenOf.has(l.sourceId)) childrenOf.set(l.sourceId, []);
            childrenOf.get(l.sourceId).push(l.targetId);
        });

        // A node is visible if at least one non-collapsed path reaches it from a root.
        // (The graph can have multiple parents per node — e.g. two branches merging into
        // the same downstream node — so hiding must not block a node reachable via another,
        // still-expanded parent.)
        const minLayer = Math.min(...this.data.nodes.map(n => n.layer));
        const rootIds = this.data.nodes.filter(n => n.layer === minLayer).map(n => n.id);
        const visibleNodeIds = new Set<string>(rootIds);
        const queue = [...rootIds];
        while (queue.length) {
            const id = queue.shift();
            if (this.collapsedNodes.has(id)) continue;
            (childrenOf.get(id) || []).forEach(childId => {
                if (!visibleNodeIds.has(childId)) {
                    visibleNodeIds.add(childId);
                    queue.push(childId);
                }
            });
        }

        const nodes = this.data.nodes.filter(n => visibleNodeIds.has(n.id));
        let links = this.data.links.filter(l =>
            visibleNodeIds.has(l.sourceId) && visibleNodeIds.has(l.targetId) && !this.collapsedNodes.has(l.sourceId)
        );
        const nodeById = new Map(nodes.map(n => [n.id, n]));

        // Recompute values from the original per-row chains, cutting a row's contribution
        // at the first collapsed node in its path — so collapsing a branch cascades the
        // reduction to every downstream level fed only through that branch, not just the
        // immediate edge.
        this.visibleInValue = new Map<string, number>();
        this.visibleOutValue = new Map<string, number>();
        this.visibleTargetValue = new Map<string, number>();
        this.edgeVisibleValue = new Map<string, number>();
        this.edgeVisibleTarget = new Map<string, number>();
        this.data.rowChains.forEach(rc => {
            let cutoff = rc.chain.length;
            for (let i = 0; i < rc.chain.length; i++) {
                if (this.collapsedNodes.has(rc.chain[i])) { cutoff = i + 1; break; }
            }
            for (let i = 0; i < cutoff - 1; i++) {
                const from = rc.chain[i], to = rc.chain[i + 1];
                const edgeKey = `${from}→${to}`;
                this.edgeVisibleValue.set(edgeKey, (this.edgeVisibleValue.get(edgeKey) || 0) + rc.value);
                this.edgeVisibleTarget.set(edgeKey, (this.edgeVisibleTarget.get(edgeKey) || 0) + rc.targetValue);
                this.visibleOutValue.set(from, (this.visibleOutValue.get(from) || 0) + rc.value);
                this.visibleInValue.set(to, (this.visibleInValue.get(to) || 0) + rc.value);
                this.visibleTargetValue.set(to, (this.visibleTargetValue.get(to) || 0) + rc.targetValue);
            }
        });
        links = links.filter(l => (this.edgeVisibleValue.get(l.id) || 0) > 0);

        const isHorizontal = this.direction === "horizontal";
        const backEdgeTotal = links.filter(l => {
            const s = nodeById.get(l.sourceId), t = nodeById.get(l.targetId);
            return s && t && t.layer <= s.layer;
        }).length;
        const nodeHeightSetting = this.formattingSettings?.nodeCard?.height?.value ?? NODE_HEIGHT;
        const loopBuffer = backEdgeTotal > 0 ? 30 + (Math.min(backEdgeTotal, 4) - 1) * 22 + nodeHeightSetting : 0;

        let maxX = Math.max(...nodes.map(n => n.x + n.width)) + MARGIN + (isHorizontal ? 0 : loopBuffer);
        let maxY = Math.max(...nodes.map(n => n.y + n.height)) + MARGIN + (isHorizontal ? loopBuffer : 0);

        // Center the diagram within the viewport when it is smaller than the visible area,
        // so small diagrams don't sit flush against the top/left leaving unused space.
        // Applied only once per layout pass (not on every collapse-triggered re-render),
        // otherwise the shift would compound and drift the diagram further each time.
        const centerShiftY = !this.centeringApplied && isHorizontal ? Math.max(0, (this.height - maxY) / 2) : 0;
        const centerShiftX = !this.centeringApplied && !isHorizontal ? Math.max(0, (this.width - maxX) / 2) : 0;
        if (centerShiftX || centerShiftY) {
            this.data.nodes.forEach(n => { n.x += centerShiftX; n.y += centerShiftY; });
            this.swimlaneBands.forEach(b => {
                b.start += isHorizontal ? centerShiftY : centerShiftX;
                b.end += isHorizontal ? centerShiftY : centerShiftX;
            });
            maxX += centerShiftX;
            maxY += centerShiftY;
        }
        this.centeringApplied = true;

        const isHighContrast = this.host.colorPalette.isHighContrast;
        const linkColor = isHighContrast
            ? this.host.colorPalette.foreground.value
            : (this.formattingSettings?.linkCard?.color?.value?.value || "#B7C0D8");
        const linkWidthBase = this.formattingSettings?.linkCard?.width?.value ?? 2;
        const curvature = this.formattingSettings?.linkCard?.curvature?.value ?? 0.5;
        const cornerRadius = this.formattingSettings?.nodeCard?.cornerRadius?.value ?? 6;
        const fontFamily = this.formattingSettings?.nodeCard?.fontFamily?.value?.value?.toString() ?? "'Segoe UI',sans-serif";
        const fontSize = this.formattingSettings?.nodeCard?.fontSize?.value ?? 12;
        const textColor = isHighContrast ? this.host.colorPalette.background.value : (this.formattingSettings?.nodeCard?.textColor?.value?.value || "#FFFFFF");

        const highlightDominant = this.formattingSettings?.linkCard?.highlightDominant?.value ?? true;
        const dominantEmphasis = this.formattingSettings?.linkCard?.dominantEmphasis?.value ?? 1.3;
        const linkValue = (l: FlowLink) => this.edgeVisibleValue.get(l.id) || 0;
        const maxValue = Math.max(1, ...links.map(linkValue));

        const dominantLinkIds = new Set<string>();
        if (highlightDominant) {
            const bestBySource = new Map<string, FlowLink>();
            links.forEach(l => {
                const current = bestBySource.get(l.sourceId);
                if (!current || linkValue(l) > linkValue(current)) bestBySource.set(l.sourceId, l);
            });
            bestBySource.forEach(l => dominantLinkIds.add(l.id));
        }

        const highlightTopVariant = this.formattingSettings?.linkCard?.highlightTopVariant?.value ?? false;
        const topVariantColor = this.formattingSettings?.linkCard?.topVariantColor?.value?.value || "#F5A623";
        const topVariantLinkIds = new Set<string>(
            highlightTopVariant && this.data.variants.length ? this.data.variants[0].linkIds : []
        );

        let backEdgeCount = 0;

        const linkPaths = links.map(l => {
            const s = nodeById.get(l.sourceId);
            const t = nodeById.get(l.targetId);
            if (!s || !t) return "";
            const w = Math.max(1, (linkValue(l) / maxValue) * 8 * linkWidthBase / 2);
            const isBackEdge = t.layer <= s.layer;
            const isDominant = dominantLinkIds.has(l.id);
            const isTopVariant = topVariantLinkIds.has(l.id);

            let path: string;
            if (isHorizontal) {
                if (isBackEdge) {
                    const x1 = s.x + s.width / 2, y1 = s.y + s.height;
                    const x2 = t.x + t.width / 2, y2 = t.y + t.height;
                    const loopY = Math.max(y1, y2) + 30 + (backEdgeCount++ % 4) * 22;
                    path = `M${x1},${y1} C${x1},${loopY} ${x2},${loopY} ${x2},${y2}`;
                } else {
                    const x1 = s.x + s.width, y1 = s.y + s.height / 2;
                    const x2 = t.x, y2 = t.y + t.height / 2;
                    const dx = (x2 - x1) * curvature;
                    path = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
                }
            } else {
                if (isBackEdge) {
                    const x1 = s.x + s.width, y1 = s.y + s.height / 2;
                    const x2 = t.x + t.width, y2 = t.y + t.height / 2;
                    const loopX = Math.max(x1, x2) + 30 + (backEdgeCount++ % 4) * 22;
                    path = `M${x1},${y1} C${loopX},${y1} ${loopX},${y2} ${x2},${y2}`;
                } else {
                    const x1 = s.x + s.width / 2, y1 = s.y + s.height;
                    const x2 = t.x + t.width / 2, y2 = t.y;
                    const dy = (y2 - y1) * curvature;
                    path = `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
                }
            }
            const dash = isBackEdge ? ` stroke-dasharray="4 3"` : "";
            const opacity = isTopVariant ? "1" : (isDominant ? "0.95" : (highlightDominant ? "0.3" : "0.7"));
            const strokeW = isTopVariant ? w * dominantEmphasis * 1.15 : (isDominant ? w * dominantEmphasis : w);
            const strokeColor = isTopVariant ? topVariantColor : linkColor;
            l.displayColor = strokeColor;
            const linkAriaLabel = this.escapeHtml(`${s.label} to ${t.label}, ${this.formatValue(l.value, this.data.totalValue)}${isBackEdge ? ", rework" : ""}`);
            return `<path class="flow-link${isBackEdge ? " flow-link-back" : ""}${isDominant ? " flow-link-dominant" : ""}${isTopVariant ? " flow-link-variant" : ""}" data-link-id="${l.id}" d="${path}" stroke="${strokeColor}" stroke-width="${strokeW}" fill="none" opacity="${opacity}"${dash} tabindex="0" role="button" aria-label="${linkAriaLabel}"></path>`;
        }).join("");

        const showBadge = this.formattingSettings?.nodeCard?.showBadge?.value ?? true;
        const badgeFontFamily = this.formattingSettings?.nodeCard?.badgeFontFamily?.value?.value?.toString() ?? fontFamily;
        const badgeFontSize = this.formattingSettings?.nodeCard?.badgeFontSize?.value ?? Math.max(8, fontSize - 3);
        const badgeTextColor = this.formattingSettings?.nodeCard?.badgeTextColor?.value?.value || textColor;
        const badgeBackgroundColor = this.formattingSettings?.nodeCard?.badgeBackgroundColor?.value?.value || "#000000";
        const badgeBackgroundOpacity = (this.formattingSettings?.nodeCard?.badgeBackgroundOpacity?.value ?? 0) / 100;
        const kpiUpColor = this.formattingSettings?.nodeCard?.kpiUpColor?.value?.value || "#3E9C5B";
        const kpiDownColor = this.formattingSettings?.nodeCard?.kpiDownColor?.value?.value || "#C9524A";
        const showShadow = (this.formattingSettings?.nodeCard?.showShadow?.value ?? false) && !isHighContrast;
        const shadowColor = this.formattingSettings?.nodeCard?.shadowColor?.value?.value || "#000000";
        const shadowBlur = this.formattingSettings?.nodeCard?.shadowBlur?.value ?? 4;
        const shadowOffsetX = this.formattingSettings?.nodeCard?.shadowOffsetX?.value ?? 0;
        const shadowOffsetY = this.formattingSettings?.nodeCard?.shadowOffsetY?.value ?? 2;
        const shadowOpacity = (this.formattingSettings?.nodeCard?.shadowOpacity?.value ?? 35) / 100;
        const nodeFilterAttr = showShadow ? ` filter="url(#flow-node-shadow)"` : "";
        const nodeShadowDefs = showShadow
            ? `<defs><filter id="flow-node-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="${shadowOffsetX}" dy="${shadowOffsetY}" stdDeviation="${shadowBlur}" flood-color="${shadowColor}" flood-opacity="${shadowOpacity}"></feDropShadow>
                </filter></defs>`
            : "";
        const borderWidth = this.formattingSettings?.nodeCard?.borderWidth?.value ?? 0;
        const imageSize = this.formattingSettings?.nodeCard?.imageSize?.value ?? IMAGE_SIZE;
        const borderColor = this.formattingSettings?.nodeCard?.borderColor?.value?.value || "#FFFFFF";
        const colorBorderByLevel = this.formattingSettings?.nodeCard?.colorBorderByLevel?.value ?? false;
        const colorByLevel = this.formattingSettings?.dataPointCard?.colorByLevel?.value ?? true;
        const defaultColor = this.formattingSettings?.dataPointCard?.defaultColor?.value?.value || "#6B7A99";
        const levelColors = [
            this.formattingSettings?.dataPointCard?.levelColor1?.value?.value,
            this.formattingSettings?.dataPointCard?.levelColor2?.value?.value,
            this.formattingSettings?.dataPointCard?.levelColor3?.value?.value,
            this.formattingSettings?.dataPointCard?.levelColor4?.value?.value,
            this.formattingSettings?.dataPointCard?.levelColor5?.value?.value,
            this.formattingSettings?.dataPointCard?.levelColor6?.value?.value
        ].map((c, i) => c || LEVEL_PALETTE[i]);

        const nodeShapes = nodes.map(n => {
            const label = this.escapeHtml(n.label);
            const nodeFill = isHighContrast
                ? this.host.colorPalette.background.value
                : (colorByLevel ? levelColors[n.layer % levelColors.length] : defaultColor);
            n.displayColor = nodeFill;
            const effectiveBorderColor = colorBorderByLevel ? levelColors[n.layer % levelColors.length] : borderColor;
            const nodeStroke = isHighContrast
                ? `stroke="${this.host.colorPalette.foreground.value}" stroke-width="1.5"`
                : ((borderWidth > 0 || colorBorderByLevel) ? `stroke="${effectiveBorderColor}" stroke-width="${Math.max(borderWidth, colorBorderByLevel ? 2 : 0)}"` : "");
            const hasBadge = showBadge;
            const imageOffset = n.image ? imageSize + IMAGE_PADDING : 0;
            const labelCenterX = imageOffset + (n.width - imageOffset) / 2;
            const labelY = hasBadge ? n.height / 2 - 8 : n.height / 2;
            let badge = "";
            if (hasBadge) {
                const actual = this.visibleInValue.get(n.id) || this.visibleOutValue.get(n.id) || 0;
                const visibleTarget = this.visibleTargetValue.get(n.id) || 0;
                const isKpi = n.hasTarget && visibleTarget !== 0;
                const variancePct = isKpi ? ((actual - visibleTarget) / visibleTarget) * 100 : 0;
                const isUp = variancePct >= 0;
                const valueText = this.formatValue(actual, this.data.totalValue);
                const badgeText = isKpi
                    ? `${valueText}  ${isUp ? "▲" : "▼"} ${Math.abs(variancePct).toFixed(1)}%`
                    : valueText;
                const badgeY = n.height / 2 + 13;
                const kpiColor = isUp ? kpiUpColor : kpiDownColor;
                const pillFill = isKpi ? this.hexToRgba(kpiColor, 0.85) : this.hexToRgba(badgeBackgroundColor, badgeBackgroundOpacity);
                const showPill = isKpi || badgeBackgroundOpacity > 0;
                const badgeBg = showPill
                    ? (() => {
                        const textW = this.measureTextWidth(badgeText, badgeFontSize, badgeFontFamily);
                        const padX = 6;
                        return `<rect x="${labelCenterX - textW / 2 - padX}" y="${badgeY - badgeFontSize / 2 - 2}" width="${textW + padX * 2}" height="${badgeFontSize + 4}" rx="${(badgeFontSize + 4) / 2}" fill="${pillFill}"></rect>`;
                    })()
                    : "";
                const textFill = isKpi ? "#FFFFFF" : badgeTextColor;
                badge = `${badgeBg}<text aria-hidden="true" x="${labelCenterX}" y="${badgeY}" dy="0.35em" text-anchor="middle"
                        font-size="${badgeFontSize}" font-family="${badgeFontFamily}" fill="${textFill}" opacity="0.95">${this.escapeHtml(badgeText)}</text>`;
            }
            const image = n.image
                ? `<image x="4" y="${(n.height - imageSize) / 2}" width="${imageSize}" height="${imageSize}" href="${n.image}" preserveAspectRatio="xMidYMid slice"></image>`
                : "";
            const positionCode = `${n.layer + 1}.${n.order + 1}`;
            const visibleActual = this.visibleInValue.get(n.id) || this.visibleOutValue.get(n.id) || 0;
            const ariaParts = [`${n.label}, level ${n.layer + 1}`, `value ${this.formatValue(visibleActual, this.data.totalValue)}`];
            const visibleTargetAria = this.visibleTargetValue.get(n.id) || 0;
            if (n.hasTarget && visibleTargetAria !== 0) {
                const pct = (visibleActual - visibleTargetAria) / visibleTargetAria * 100;
                ariaParts.push(`${pct >= 0 ? "above" : "below"} target by ${Math.abs(pct).toFixed(1)} percent`);
            }
            const nodeAriaLabel = this.escapeHtml(ariaParts.join(", "));
            const hasChildren = (childrenOf.get(n.id) || []).length > 0;
            const isCollapsed = this.collapsedNodes.has(n.id);
            const collapseToggle = hasChildren
                ? `<g class="flow-collapse-toggle" data-node-id="${n.id}" tabindex="0" role="button" aria-label="${isCollapsed ? "Expand" : "Collapse"} ${this.escapeHtml(n.label)}" transform="translate(${n.width},${n.height / 2})" style="cursor:pointer;">
                        <circle r="7" fill="#ffffff" stroke="${nodeFill}" stroke-width="1.5"></circle>
                        <text aria-hidden="true" x="0" y="0" dy="0.35em" text-anchor="middle" font-size="10" font-family="${fontFamily}" fill="${nodeFill}">${isCollapsed ? "+" : "−"}</text>
                    </g>`
                : "";
            return `
                <g class="flow-node" data-node-id="${n.id}" tabindex="0" role="button" aria-label="${nodeAriaLabel}" transform="translate(${n.x},${n.y})"${nodeFilterAttr}>
                    <rect width="${n.width}" height="${n.height}" rx="${cornerRadius}" fill="${nodeFill}" opacity="0.95" ${nodeStroke}></rect>
                    ${image}
                    <text aria-hidden="true" x="${n.width - 6}" y="10" text-anchor="end" font-size="9" font-family="${fontFamily}" fill="${textColor}" opacity="0.7">${positionCode}</text>
                    <text aria-hidden="true" x="${labelCenterX}" y="${labelY}" dy="0.35em" text-anchor="middle"
                        font-size="${fontSize}" font-family="${fontFamily}" fill="${textColor}">${label}</text>
                    ${badge}
                    ${collapseToggle}
                </g>`;
        }).join("");

        this.contentWidth = maxX;
        this.contentHeight = maxY;
        const svgWidth = maxX * this.zoomScale;
        const svgHeight = maxY * this.zoomScale;

        const showLegend = this.formattingSettings?.legendCard?.show?.value ?? true;
        const usedLevels = Array.from(new Set(nodes.map(n => n.layer))).sort((a, b) => a - b);
        const legendItems = colorByLevel
            ? usedLevels.map(li => {
                const color = levelColors[li % levelColors.length];
                return `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:12px;">
                            <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>Level ${li + 1}
                        </span>`;
            }).join("")
            : "";
        const legendHtml = showLegend && legendItems
            ? `<div class="flow-legend" style="position:absolute;bottom:0;left:0;z-index:2;background:rgba(255,255,255,0.9);font:11px 'Segoe UI',sans-serif;padding:4px 6px;color:#333;">${legendItems}</div>`
            : "";

        const variants = this.data.variants;
        const variantRows = variants.map((v, i) => {
            const pct = this.data.totalValue > 0 ? (v.value / this.data.totalValue) * 100 : 0;
            const isActive = this.tracedVariantPath === v.path;
            return `
                <div class="flow-variant-row" data-variant-index="${i}" style="cursor:pointer;padding:4px 6px;border-radius:3px;${isActive ? "background:#e8f0fe;" : ""}">
                    <div style="font-size:11px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:440px;" title="${this.escapeHtml(v.path)}">${this.escapeHtml(v.path)}</div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden;">
                            <div style="width:${Math.min(100, pct)}%;height:100%;background:#2B6CB0;"></div>
                        </div>
                        <div style="font-size:10px;color:#666;white-space:nowrap;">${this.formatValue(v.value, this.data.totalValue)} · ${pct.toFixed(1)}%</div>
                    </div>
                </div>`;
        }).join("");
        const variantsPanelHtml = variants.length
            ? `<div class="flow-variants-panel" style="display:${this.variantsPanelOpen ? "block" : "none"};position:absolute;top:34px;left:0;z-index:3;background:rgba(255,255,255,0.97);border:1px solid #ccc;border-radius:3px;padding:8px;width:460px;max-height:420px;overflow-y:auto;font-family:'Segoe UI',sans-serif;">
                    <div style="font-size:11px;font-weight:600;color:#333;margin-bottom:4px;">Top variants (full paths)</div>
                    ${variantRows}
                </div>`
            : "";

        const swimlaneLabelSize = this.formattingSettings?.swimlaneCard?.labelSize?.value ?? 11;
        const swimlaneFontFamily = this.formattingSettings?.swimlaneCard?.fontFamily?.value?.value?.toString() ?? "'Segoe UI',sans-serif";
        const swimlaneTextColor = this.formattingSettings?.swimlaneCard?.textColor?.value?.value || "#666666";
        const swimlaneBandOpacity = (this.formattingSettings?.swimlaneCard?.bandOpacity?.value ?? 6) / 100;
        const swimlaneBandColors = [
            this.formattingSettings?.swimlaneCard?.bandColor1?.value?.value,
            this.formattingSettings?.swimlaneCard?.bandColor2?.value?.value,
            this.formattingSettings?.swimlaneCard?.bandColor3?.value?.value,
            this.formattingSettings?.swimlaneCard?.bandColor4?.value?.value
        ].map((c, i) => c || LEVEL_PALETTE[i]);
        const swimlaneBandsHtml = this.swimlaneBands.map((band, i) => {
            const bg = this.hexToRgba(swimlaneBandColors[i % swimlaneBandColors.length], swimlaneBandOpacity);
            const axisStart = Math.max(0, band.axisStart - 14);
            if (isHorizontal) {
                return `
                    <rect aria-hidden="true" x="${axisStart}" y="${band.start}" width="${maxX - axisStart}" height="${band.end - band.start}" fill="${bg}"></rect>
                    ${band.label ? `<text aria-hidden="true" x="${axisStart + 4}" y="${band.start + 12}" font-size="${swimlaneLabelSize}" font-family="${swimlaneFontFamily}" fill="${swimlaneTextColor}" opacity="0.9">${this.escapeHtml(band.label)}</text>` : ""}`;
            }
            return `
                <rect aria-hidden="true" x="${band.start}" y="${axisStart}" width="${band.end - band.start}" height="${maxY - axisStart}" fill="${bg}"></rect>
                ${band.label ? `<text aria-hidden="true" x="${band.start + 4}" y="${axisStart + 14}" font-size="${swimlaneLabelSize}" font-family="${swimlaneFontFamily}" fill="${swimlaneTextColor}" opacity="0.9">${this.escapeHtml(band.label)}</text>` : ""}`;
        }).join("");

        const MINIMAP_MAX_W = 160;
        const MINIMAP_MAX_H = 100;
        this.minimapScale = nodes.length ? Math.min(MINIMAP_MAX_W / maxX, MINIMAP_MAX_H / maxY) : 1;
        const minimapW = Math.max(1, maxX * this.minimapScale);
        const minimapH = Math.max(1, maxY * this.minimapScale);
        const minimapRects = nodes.map(n => {
            const color = isHighContrast
                ? this.host.colorPalette.foreground.value
                : (colorByLevel ? levelColors[n.layer % levelColors.length] : defaultColor);
            return `<rect x="${n.x * this.minimapScale}" y="${n.y * this.minimapScale}" width="${Math.max(1, n.width * this.minimapScale)}" height="${Math.max(1, n.height * this.minimapScale)}" fill="${color}" opacity="0.9"></rect>`;
        }).join("");
        const showMinimap = nodes.length > 6;
        const minimapHtml = showMinimap
            ? `<div class="flow-minimap" aria-hidden="true" style="position:absolute;top:38px;left:4px;z-index:2;background:rgba(255,255,255,0.9);border:1px solid #ccc;border-radius:3px;padding:2px;">
                    <svg class="flow-minimap-svg" width="${minimapW}" height="${minimapH}" viewBox="0 0 ${minimapW} ${minimapH}" xmlns="http://www.w3.org/2000/svg" style="display:block;cursor:pointer;">
                        <rect x="0" y="0" width="${minimapW}" height="${minimapH}" fill="#f4f4f4"></rect>
                        ${minimapRects}
                        <rect class="minimap-viewport" fill="rgba(43,108,176,0.2)" stroke="#2B6CB0" stroke-width="1"></rect>
                    </svg>
                </div>`
            : "";

        /* eslint-disable powerbi-visuals/no-inner-outer-html */
        this.target.style.position = "relative";
        this.target.innerHTML = `
            <div class="flow-toolbar" style="position:absolute;top:0;left:0;z-index:2;display:flex;gap:6px;padding:4px;background:rgba(255,255,255,0.9);width:max-content;">
                <input type="text" class="flow-search" placeholder="Search node..." aria-label="Search node by name" style="font:12px 'Segoe UI',sans-serif;padding:2px 6px;border:1px solid #ccc;border-radius:3px;" />
                <button type="button" class="flow-zoom-out" title="Zoom out" aria-label="Zoom out" style="font:14px 'Segoe UI',sans-serif;width:24px;padding:0;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;">−</button>
                <button type="button" class="flow-zoom-in" title="Zoom in" aria-label="Zoom in" style="font:14px 'Segoe UI',sans-serif;width:24px;padding:0;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;">+</button>
                <button type="button" class="flow-fit" aria-label="Fit diagram to view" style="font:12px 'Segoe UI',sans-serif;padding:2px 8px;border:1px solid #ccc;border-radius:3px;background:#fff;cursor:pointer;">Fit</button>
                ${variants.length ? `<button type="button" class="flow-variants-toggle" aria-label="Toggle top variants panel" aria-pressed="${this.variantsPanelOpen}" style="font:12px 'Segoe UI',sans-serif;padding:2px 8px;border:1px solid #ccc;border-radius:3px;background:${this.variantsPanelOpen ? "#e8f0fe" : "#fff"};cursor:pointer;">Variants</button>` : ""}
                <button type="button" class="flow-tooltips-toggle" title="Toggle tooltips" aria-label="Toggle tooltips" aria-pressed="${this.tooltipsEnabled}" style="font:12px 'Segoe UI',sans-serif;padding:2px 8px;border:1px solid #ccc;border-radius:3px;background:${this.tooltipsEnabled ? "#fff" : "#e8f0fe"};cursor:pointer;">Tooltips</button>
            </div>
            ${variantsPanelHtml}
            <div class="flow-scroll" style="position:absolute;inset:0;overflow:auto;">
                <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${maxX} ${maxY}" xmlns="http://www.w3.org/2000/svg" style="display:block;" role="group" aria-label="Flow diagram with ${nodes.length} nodes">
                    ${nodeShadowDefs}
                    <g class="swimlane-layer">${swimlaneBandsHtml}</g>
                    <g class="links-layer">${linkPaths}</g>
                    <g class="nodes-layer">${nodeShapes}</g>
                </svg>
            </div>
            ${legendHtml}
            ${minimapHtml}`;
        /* eslint-enable powerbi-visuals/no-inner-outer-html */

        this.svgRoot = this.target.querySelector("svg");
        this.attachInteractions();
        this.updateMinimapViewport();
        this.applySelectionDimming();
    }

    private updateSvgSize(): void {
        if (!this.svgRoot || !this.contentWidth || !this.contentHeight) return;
        this.svgRoot.setAttribute("width", String(this.contentWidth * this.zoomScale));
        this.svgRoot.setAttribute("height", String(this.contentHeight * this.zoomScale));
        this.updateMinimapViewport();
    }

    private updateMinimapViewport(): void {
        const rect = this.target.querySelector(".minimap-viewport") as SVGRectElement;
        const scrollEl = this.target.querySelector(".flow-scroll") as HTMLElement;
        if (!rect || !scrollEl || !this.minimapScale || !this.zoomScale) return;
        const x0 = (scrollEl.scrollLeft / this.zoomScale) * this.minimapScale;
        const y0 = (scrollEl.scrollTop / this.zoomScale) * this.minimapScale;
        const w = (this.width / this.zoomScale) * this.minimapScale;
        const h = (this.height / this.zoomScale) * this.minimapScale;
        rect.setAttribute("x", String(x0));
        rect.setAttribute("y", String(y0));
        rect.setAttribute("width", String(Math.max(2, w)));
        rect.setAttribute("height", String(Math.max(2, h)));
    }

    private fitToView(): void {
        if (!this.contentWidth || !this.contentHeight) return;
        const scaleX = this.width / this.contentWidth;
        const scaleY = this.height / this.contentHeight;
        this.zoomScale = Math.min(scaleX, scaleY, 1);
        this.updateSvgSize();
        const scrollEl = this.target.querySelector(".flow-scroll") as HTMLElement;
        if (scrollEl) { scrollEl.scrollLeft = 0; scrollEl.scrollTop = 0; }
        this.updateMinimapViewport();
    }

    private hexToRgba(hex: string, alpha: number): string {
        const clean = (hex || "#6B7A99").replace("#", "");
        const bigint = parseInt(clean.length === 3
            ? clean.split("").map(c => c + c).join("")
            : clean, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    private escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
        }[c]));
    }

    private attachInteractions(): void {
        if (!this.svgRoot) return;

        const toggleCollapse = (toggleEl: Element) => {
            const nodeId = toggleEl.getAttribute("data-node-id");
            if (!nodeId) return;
            if (this.collapsedNodes.has(nodeId)) this.collapsedNodes.delete(nodeId);
            else this.collapsedNodes.add(nodeId);
            this.render();
        };
        this.svgRoot.addEventListener("click", (e: MouseEvent) => {
            const toggleEl = (e.target as Element).closest(".flow-collapse-toggle");
            if (toggleEl) {
                e.stopPropagation();
                toggleCollapse(toggleEl);
            }
        }, true);
        this.svgRoot.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const toggleEl = (e.target as Element).closest(".flow-collapse-toggle");
            if (toggleEl) {
                e.stopPropagation();
                e.preventDefault();
                toggleCollapse(toggleEl);
            }
        }, true);

        const fitButton = this.target.querySelector(".flow-fit") as HTMLButtonElement;
        if (fitButton) {
            fitButton.addEventListener("click", () => this.fitToView());
        }

        const tooltipsToggle = this.target.querySelector(".flow-tooltips-toggle") as HTMLButtonElement;
        if (tooltipsToggle) {
            tooltipsToggle.addEventListener("click", () => {
                this.tooltipsEnabled = !this.tooltipsEnabled;
                tooltipsToggle.style.background = this.tooltipsEnabled ? "#fff" : "#e8f0fe";
                tooltipsToggle.setAttribute("aria-pressed", String(this.tooltipsEnabled));
                if (!this.tooltipsEnabled) this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
            });
        }

        const minimapSvg = this.target.querySelector(".flow-minimap-svg") as SVGSVGElement;
        if (minimapSvg) {
            minimapSvg.addEventListener("mousedown", (e: MouseEvent) => {
                this.isDraggingMinimap = true;
                this.navigateFromMinimapEvent(e);
            });
        }

        const variantsToggle = this.target.querySelector(".flow-variants-toggle") as HTMLButtonElement;
        if (variantsToggle) {
            variantsToggle.addEventListener("click", () => {
                this.variantsPanelOpen = !this.variantsPanelOpen;
                const panel = this.target.querySelector(".flow-variants-panel") as HTMLElement;
                if (panel) panel.style.display = this.variantsPanelOpen ? "block" : "none";
                variantsToggle.style.background = this.variantsPanelOpen ? "#e8f0fe" : "#fff";
                variantsToggle.setAttribute("aria-pressed", String(this.variantsPanelOpen));
            });
        }

        this.target.querySelectorAll(".flow-variant-row").forEach(rowEl => {
            rowEl.addEventListener("click", () => {
                const idx = Number(rowEl.getAttribute("data-variant-index"));
                const variant = this.data.variants[idx];
                if (!variant) return;
                const isSame = this.tracedVariantPath === variant.path;
                this.tracedVariantPath = isSame ? null : variant.path;
                this.applySelectionDimming();
                this.target.querySelectorAll(".flow-variant-row").forEach(r => {
                    (r as HTMLElement).style.background = "";
                });
                if (!isSame) (rowEl as HTMLElement).style.background = "#e8f0fe";
            });
        });

        const searchInput = this.target.querySelector(".flow-search") as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const term = searchInput.value.trim().toLowerCase();
                this.svgRoot.querySelectorAll(".flow-node").forEach(el => el.classList.remove("search-hit"));
                if (!term) return;
                const match = this.data.nodes.find(n => n.label.toLowerCase().includes(term));
                if (!match) return;
                const el = this.svgRoot.querySelector(`.flow-node[data-node-id="${CSS.escape(match.id)}"]`);
                if (el) el.classList.add("search-hit");
                const centerX = match.x + match.width / 2;
                const centerY = match.y + match.height / 2;
                const scrollEl = this.target.querySelector(".flow-scroll") as HTMLElement;
                if (scrollEl) {
                    scrollEl.scrollLeft = centerX * this.zoomScale - this.width / 2;
                    scrollEl.scrollTop = centerY * this.zoomScale - this.height / 2;
                }
                this.updateMinimapViewport();
            });
        }

        const scrollContainer = this.target.querySelector(".flow-scroll") as HTMLElement;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", () => this.updateMinimapViewport());
        }

        const zoomBy = (factor: number) => {
            if (!scrollContainer) return;
            const centerX = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
            const centerY = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
            const contentX = centerX / this.zoomScale;
            const contentY = centerY / this.zoomScale;
            this.zoomScale = Math.min(4, Math.max(0.2, this.zoomScale * factor));
            this.updateSvgSize();
            scrollContainer.scrollLeft = contentX * this.zoomScale - scrollContainer.clientWidth / 2;
            scrollContainer.scrollTop = contentY * this.zoomScale - scrollContainer.clientHeight / 2;
            this.updateMinimapViewport();
        };

        const zoomInButton = this.target.querySelector(".flow-zoom-in") as HTMLButtonElement;
        if (zoomInButton) zoomInButton.addEventListener("click", () => zoomBy(1.25));

        const zoomOutButton = this.target.querySelector(".flow-zoom-out") as HTMLButtonElement;
        if (zoomOutButton) zoomOutButton.addEventListener("click", () => zoomBy(1 / 1.25));

        this.svgRoot.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
            const linkEl = (e.target as Element).closest(".flow-link") as SVGPathElement;
            const node = nodeEl ? this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id")) : null;
            const link = linkEl ? this.data.links.find(l => l.id === linkEl.getAttribute("data-link-id")) : null;
            const selectionId = node?.selectionIds?.[0] ?? link?.selectionIds?.[0] ?? undefined;
            this.selectionManager.showContextMenu(selectionId ?? {}, { x: e.clientX, y: e.clientY });
        });

        this.svgRoot.addEventListener("click", (e: MouseEvent) => {
            if ((this.host as any).allowInteractions === false) return;
            const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
            const linkEl = (e.target as Element).closest(".flow-link") as SVGPathElement;
            const multiSelect = e.ctrlKey || e.metaKey;

            if (nodeEl) {
                const node = this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id"));
                if (node) this.toggleSelection(node.selectionIds, multiSelect);
            } else if (linkEl) {
                const link = this.data.links.find(l => l.id === linkEl.getAttribute("data-link-id"));
                if (link) this.toggleSelection(link.selectionIds, multiSelect);
            } else {
                this.selectionManager.clear().then(() => this.applySelectionDimming());
            }
        });

        this.svgRoot.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
            if (nodeEl) {
                const node = this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id"));
                if (node) this.toggleSelection(node.selectionIds, e.ctrlKey);
            }
        });

        this.svgRoot.addEventListener("mousemove", (e: MouseEvent) => {
            if (!this.tooltipsEnabled) return;
            const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
            const linkEl = (e.target as Element).closest(".flow-link") as SVGPathElement;

            if (nodeEl) {
                const node = this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id"));
                if (node) {
                    const visibleIn = this.visibleInValue.get(node.id) || 0;
                    const visibleOut = this.visibleOutValue.get(node.id) || 0;
                    const kpiItems: TooltipItem[] = [];
                    if (node.hasTarget) {
                        const actual = visibleIn || visibleOut;
                        const visibleTarget = this.visibleTargetValue.get(node.id) || 0;
                        const variancePct = visibleTarget !== 0 ? ((actual - visibleTarget) / visibleTarget) * 100 : 0;
                        kpiItems.push(
                            { displayName: "Target", value: this.formatValue(visibleTarget, this.data.totalValue) },
                            { displayName: "Variance", value: `${variancePct >= 0 ? "+" : ""}${variancePct.toFixed(1)}%` }
                        );
                    }
                    this.host.tooltipService.show({
                        dataItems: [
                            { displayName: "Current", value: node.label, color: node.displayColor },
                            { displayName: "Level", value: String(node.layer + 1) },
                            { displayName: "Position", value: `${node.layer + 1}.${node.order + 1}` },
                            { displayName: "Origin", value: node.originLabels.join(", ") || "—" },
                            { displayName: "Inflow", value: this.formatValue(visibleIn, this.data.totalValue) },
                            { displayName: "Outflow", value: this.formatValue(visibleOut, this.data.totalValue) },
                            ...kpiItems,
                            ...node.extraTooltips
                        ] as any,
                        identities: node.selectionIds,
                        coordinates: [e.clientX, e.clientY],
                        isTouchEvent: false
                    });
                }
            } else if (linkEl) {
                const link = this.data.links.find(l => l.id === linkEl.getAttribute("data-link-id"));
                if (link) {
                    const items = link.tooltipItems.map((item, idx) => idx === 0 ? { ...item, color: link.displayColor } : item);
                    this.host.tooltipService.show({
                        dataItems: items as any,
                        identities: link.selectionIds,
                        coordinates: [e.clientX, e.clientY],
                        isTouchEvent: false
                    });
                }
            } else {
                this.host.tooltipService.hide({ immediately: false, isTouchEvent: false });
            }
        });

        this.svgRoot.addEventListener("mouseleave", () => {
            this.host.tooltipService.hide({ immediately: true, isTouchEvent: false });
        });
    }

    private toggleSelection(ids: ISelectionId[], multiSelect: boolean): void {
        const current = this.selectionManager.getSelectionIds() as ISelectionId[];
        const isSameSelection = current.length === ids.length && ids.every(id => current.some(c => c.equals(id)));
        if (isSameSelection && !multiSelect) {
            this.selectionManager.clear().then(() => this.applySelectionDimming());
        } else {
            this.selectionManager.select(ids, multiSelect).then(() => this.applySelectionDimming());
        }
    }

    private applySelectionDimming(): void {
        if (!this.svgRoot) return;
        const hasSelection = this.selectionManager.hasSelection();
        const selectedIds = this.selectionManager.getSelectionIds() as ISelectionId[];

        this.svgRoot.querySelectorAll(".flow-node").forEach(el => {
            const node = this.data.nodes.find(n => n.id === el.getAttribute("data-node-id"));
            const isSelected = !hasSelection || node.selectionIds.some(id => selectedIds.some(sel => sel.equals(id)));
            (el as HTMLElement).style.opacity = isSelected ? "1" : "0.25";
        });

        this.svgRoot.querySelectorAll(".flow-link").forEach(el => {
            const link = this.data.links.find(l => l.id === el.getAttribute("data-link-id"));
            const isSelected = !hasSelection || link.selectionIds.some(id => selectedIds.some(sel => sel.equals(id)));
            (el as HTMLElement).style.opacity = isSelected ? "0.7" : "0.15";
        });

        this.applyVariantTrace();
    }

    private applyVariantTrace(): void {
        if (!this.svgRoot || !this.tracedVariantPath) return;
        const variant = this.data.variants.find(v => v.path === this.tracedVariantPath);
        if (!variant) return;
        this.svgRoot.querySelectorAll(".flow-link").forEach(el => {
            const linkId = el.getAttribute("data-link-id");
            const match = variant.linkIds.includes(linkId);
            (el as HTMLElement).style.opacity = match ? "1" : "0.08";
        });
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
