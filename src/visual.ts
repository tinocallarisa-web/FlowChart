"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import {
    HtmlSubSelectableClass, HtmlSubSelectionHelper, SubSelectableDisplayNameAttribute,
    SubSelectableObjectNameAttribute, SubSelectableTypeAttribute
} from "powerbi-visuals-utils-onobjectutils";
import "./../style/visual.less";
import { I18N } from "./i18n";
import { STRINGS } from "./strings";
import { LANDING_ICON } from "./landingIcon";

const URL_GUIDE = "https://tinocallarisa-web.github.io/FlowChart/support.html";
const URL_PRODUCT = "https://tcviz.com/product/flow-chart/?ref=visual-flowchart";
// Vídeo de la 1.1; se cambia cuando Tino grabe el de la 1.2.
const URL_VIDEO = "https://www.youtube.com/watch?v=wXvxscw7e4k";

/** Vista previa Pro (editando, sin licencia): las capas Pro se dibujan solo en los nodos de más valor, para enseñarlas
 *  sin que sirvan de trabajo real (decisión 26-10-2026). Con licencia no hay límite. */
const PREVIEW_NODES = 5;
const PREVIEW_BANDS = 2;
const PREVIEW_VARIANTS = 3;

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import DataViewTableRow = powerbi.DataViewTableRow;
import IVisualLicenseManager = powerbi.extensibility.IVisualLicenseManager;

const SP_IDENTIFIER = "flow-chart-tcviz";

// spIdentifier = Service ID completo (editor.oferta.plan); se acepta también el Plan ID solo
function matchesPlan(spIdentifier: unknown, planId: string): boolean {
    const sp = String(spIdentifier ?? "");
    return sp === planId || sp.endsWith("." + planId);
}

/** ServicePlanState es un const enum; los numeros hacen falta en runtime.
 *  Warning es el periodo de gracia de pago: quien tiene un problema de
 *  facturacion sin resolver no debe perder el diagrama completo. */
/**
 * Por encima de este tamaño un diagrama deja de leerse de un vistazo y las herramientas
 * de escala —colapsar, buscar, variants— pasan de adorno a necesarias. NO es un tope:
 * el diagrama se dibuja ENTERO siempre, con licencia y sin ella. Solo marca cuando esas
 * herramientas empiezan a hacer falta, que es cuando se ofrecen en vista previa.
 */
const BIG_DIAGRAM_NODES = 9;

const STATE_ACTIVE = 1;
const STATE_WARNING = 2;

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
    private contextMenuBound: boolean = false;
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
    private licenseManager: IVisualLicenseManager;
    private isPro: boolean = false;
    private fullNodeCount: number = 0;
    private lastOptions: VisualUpdateOptions | null = null;
    private licenseRequested: boolean = false;
    private licenseNotified: boolean = false;
    private licenseEnvUnsupported: boolean = false;
    private licenseResolved: boolean = false;
    /** Edit mode, de options.viewMode. NO es Desktop contra Service: ambos lo informan. */
    private editing = false;
    /** Funciones Pro que el informe pide ahora mismo, por sus pozos. */
    private attemptedPro: string[] = [];
    private notifiedPro: string[] = [];
    private licenseIconTimer: number | null = null;
    private noticeShown = false;
    private watermarkEl: HTMLDivElement | null = null;
    private watermarkWhy: HTMLDivElement | null = null;
    private loc: powerbi.extensibility.ILocalizationManager;
    /** Formato desde el lienzo (on-object): en modo formato el clic elige qué formatear, no filtra datos. */
    public visualOnObjectFormatting: powerbi.extensibility.visual.VisualOnObjectFormatting;
    private subSelectionHelper: HtmlSubSelectionHelper;
    private formatMode = false;
    /** Propiedades que el autor ha fijado en el panel: las plantillas solo rellenan las demás. */
    private explicitProps: powerbi.DataViewObjects = {};
    /** Pozos con campo, para los consejos de configuración. */
    private fields = { levels: 0, value: false, target: false, swimlane: false, images: false, tips: false };
    /** Nombre de cada campo de Levels, para la leyenda y las cabeceras. */
    private levelNames: string[] = [];
    /** Formato de la medida Value (el dinámico de la primera fila si lo hay). */
    private valueFormatString: string | undefined;
    /** Nodos con capas Pro en la vista previa (los de más valor). Vacío = sin límite. */
    private previewNodeIds: Set<string> | null = null;
    /** Nodo con el foco de teclado (tabindex móvil). */
    private focusNodeId: string | null = null;
    /** Contador para los ids de recorte de las imágenes (únicos en la página). */
    private clipSeq = 0;
    /** Firma del diagrama ya ajustado al visual, para no reajustar en cada repintado. */
    private fittedKey = "";

    constructor(options: VisualConstructorOptions) {
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.events = this.host.eventService;
        this.licenseManager = options.host.licenseManager;
        this.loc = options.host.createLocalizationManager();

        this.target.style.overflow = "hidden";
        this.target.tabIndex = 0;
        this.injectStyles();

        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
            selectionIdCallback: () => undefined,
        });
        this.visualOnObjectFormatting = {
            getSubSelectionStyles: (subs) => this.getSubSelectionStyles(subs),
            getSubSelectionShortcuts: (subs) => this.getSubSelectionShortcuts(subs),
            getSubSelectables: (filter) => this.subSelectionHelper.getAllSubSelectables(filter),
        };

        // Marcadores y selección hecha desde fuera: solo repinta la atenuación (nunca persistProperties aquí).
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

    /**
     * update() es SINCRONA a proposito.
     *
     * Antes era `async` y hacia `await licenseManager.getAvailableServicePlans()`
     * entre renderingStarted y el dibujado, en cada update. Eso tenia dos costes.
     * El diagrama no se pintaba hasta que la llamada de licencia resolvia, y Power
     * BI llama a update() muy seguido al redimensionar: dos updates solapados
     * podian emitir el renderingFinished del primero despues del renderingStarted
     * del segundo, que es justo el desajuste que mira el validador.
     *
     * Ahora la licencia se resuelve en diferido y solo repinta si pasa de Free a
     * Pro. La licencia nunca esta en el camino critico del render.
     */
    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);
        try {
            this.lastOptions = options;
            // ViewMode.View = 0. Edit e InFocusEdit son ambos edicion. Esto NO distingue
            // Desktop de Service: los dos informan de los dos modos, y hacerlo por host
            // dejaria la vista previa visible en un informe publicado.
            const viewMode = (options as unknown as { viewMode?: number }).viewMode;
            if (typeof viewMode === "number") { this.editing = viewMode !== 0; }
            this.formatMode = !!(options as unknown as { formatMode?: boolean }).formatMode;
            this.subSelectionHelper.setFormatMode(this.formatMode);
            this.draw(options);
            this.updateOutlines(options);
            this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, String(e));
        }
        // Fuera del try: que un fallo al pedir la licencia o al notificar no
        // convierta un render correcto en renderingFailed.
        this.requestLicenseDeferred();
        this.syncLicenseNotification();
    }

    /** Todo el dibujado. No emite rendering events: los emite update(), y tambien
     *  se llama desde applyLicense(), que repinta con las mismas options. */
    private draw(options: VisualUpdateOptions): void {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            options.dataViews && options.dataViews[0]
        );
        this.explicitProps = options.dataViews?.[0]?.metadata?.objects ?? {};
        this.applyTemplate();
        this.localizeModel();

        this.width = options.viewport.width;
        this.height = options.viewport.height;
        this.direction = this.formattingSettings?.layoutCard?.direction?.value?.value?.toString() ?? "horizontal";

        const dataView = options.dataViews && options.dataViews[0];
        const conNiveles = (dataView?.table?.columns || []).filter(c => c.roles && c.roles["levels"]).length;
        if (!dataView || !dataView.table || conNiveles === 0) {
            this.renderEmpty();
            return;
        }

        this.data = this.parseDataView(dataView);
        // Con un solo nivel, o sin filas que formen una cadena, no hay diagrama: se explica qué falta.
        if (this.data.nodes.length === 0) {
            this.renderEmpty(conNiveles < 2 ? this.t("UI_NeedTwoLevels", "Add a second field to Levels: a flow needs at least two steps.") : this.t("UI_NoRows", "No row has two or more levels filled in."));
            return;
        }

        // El tope de nodos se ha ido en 1.1.0.0.
        //
        // Eran 9, y un organigrama, un proceso o un embudo reales pasan de 9 casi
        // siempre: el usuario conectaba sus datos y veia el diagrama partido por la
        // mitad. Un tope de nodos castiga justo a quien tiene datos de verdad, que es
        // el que pagaria, mientras que a quien tiene ocho no le da ninguna razon para
        // pagar. Ahora el tier gratuito dibuja el diagrama ENTERO y lo que se compra
        // son las capas de analisis encima: swimlanes, imagenes, badge de KPI y
        // tooltips. Ver freeSettings().
        this.fullNodeCount = this.data.nodes.length;

        // Sin Pro no puede quedar una rama colapsada de cuando si lo habia: el diagrama
        // gratuito se veria recortado sin ningun control para volver a abrirlo.
        if (!this.proNow() && this.collapsedNodes.size > 0) { this.collapsedNodes.clear(); }

        this.computeLayout();
        this.render();
    }

    /** Pide la licencia una vez, fuera del camino critico. Si no resuelve, se
     *  queda en Free: un catch que inventa Pro oculta el fallo que importa. */
    private requestLicenseDeferred(): void {
        if (this.licenseRequested || this.isPro) return;
        this.licenseRequested = true;

        setTimeout(() => {
            try {
                // Las typings de powerbi-visuals-api no declaran las dos primeras
                // propiedades, de ahi el cast.
                const lm = this.licenseManager as unknown as {
                    isLicenseUnsupportedEnv?: boolean;
                    isLicenseInfoAvailable?: boolean;
                    getAvailableServicePlans: () => {
                        then: (ok: (r: unknown) => void, err: () => void) => void;
                    };
                };

                // Publish to Web, embedding y exportacion a PDF no pueden consultar
                // la licencia. Ahi se renderiza la experiencia gratuita y NO se pide
                // comprar: quien ya paga no debe ver una llamada a comprar lo que
                // tiene, y en ese entorno no hay forma de saber si la tiene.
                if (lm?.isLicenseUnsupportedEnv === true || lm?.isLicenseInfoAvailable === false) {
                    this.licenseEnvUnsupported = true;
                    return;
                }

                // getAvailableServicePlans devuelve IPromise2, no una Promise: se
                // consume con los dos callbacks de then, no con await ni catch.
                lm.getAvailableServicePlans().then(
                    (result: unknown) => {
                        this.licenseResolved = true;
                        const plans = (result as { plans?: { spIdentifier?: string; state?: number }[] })?.plans ?? [];
                        // Comparar el spIdentifier es lo unico que funciona: si la
                        // oferta publica un plan gratuito, "tiene algun plan activo"
                        // es cierto tambien para quien no ha pagado.
                        this.applyLicense(plans.some(pl =>
                            matchesPlan(pl.spIdentifier, SP_IDENTIFIER) &&
                            ((pl.state as number) === STATE_ACTIVE ||
                             (pl.state as number) === STATE_WARNING)));
                        // Free confirmado: ahora si puede avisar del limite.
                        this.syncLicenseNotification();
                    },
                    // Sin licencia legible no se pide comprar: podria haberla pagado.
                    () => { this.licenseEnvUnsupported = true; });
            } catch (_) { this.licenseEnvUnsupported = true; }
        }, 0);
    }

    /** Solo actua de Free a Pro. Si la licencia no resuelve, no toca el DOM. */
    private applyLicense(isPro: boolean): void {
        if (!isPro || this.isPro) {
            // Tambien hay que repintar cuando resuelve a FREE.
            //
            // Power BI recrea la instancia en cada cambio de pagina, asi que al volver
            // el primer render ocurre con la licencia sin resolver y la vista previa
            // apagada. Si aqui solo se notificase, el usuario se quedaria sin previa
            // hasta tocar un ajuste. Era correcto antes de que existiera la previa,
            // porque nada de lo dibujado dependia de la licencia para un gratuito.
            if (this.proNow() && this.lastOptions) {
                try { this.draw(this.lastOptions); } catch (_) { /* se queda lo pintado */ }
            }
            this.syncLicenseNotification();
            return;
        }
        this.isPro = true;
        if (!this.lastOptions) return;
        try {
            this.draw(this.lastOptions);
            this.syncLicenseNotification();
        } catch (_) { /* el diagrama gratuito ya pintado se queda */ }
    }

    /**
     * Lo que se DIBUJA: Pro de verdad, o la vista previa con marca de agua.
     *
     * La previa vive solo en EDICION y solo cuando la licencia ya se resolvio. Sin lo
     * primero, un informe publicado usaria funciones sin pagar; sin lo segundo, un
     * cliente Pro veria marca de agua en el primer frame.
     */
    private proNow(): boolean {
        if (this.isPro) { return true; }
        return this.editing && this.licenseResolved && !this.licenseEnvUnsupported;
    }

    /** La marca solo aparece si hay alguna funcion Pro realmente pedida. */
    private updateWatermark(): void {
        if (!this.watermarkEl) {
            this.watermarkEl = document.createElement("div");
            this.watermarkEl.setAttribute("aria-hidden", "true");
            this.watermarkEl.style.cssText =
                "position:absolute;left:0;top:0;right:0;bottom:0;display:none;" +
                "align-items:center;justify-content:center;flex-direction:column;" +
                "text-align:center;pointer-events:none;z-index:5;" +
                "font-family:'Segoe UI',sans-serif;font-weight:700;letter-spacing:0.06em;" +
                "color:#FFFFFF;opacity:0.72;transform:rotate(-20deg);" +
                "text-shadow:0 0 3px rgba(46,52,64,0.95),0 2px 6px rgba(46,52,64,0.75);";
            const titulo = document.createElement("div");
            titulo.textContent = this.t("UI_ProPreview", "Pro preview");
            this.watermarkWhy = document.createElement("div");
            this.watermarkEl.appendChild(titulo);
            this.watermarkEl.appendChild(this.watermarkWhy);
            if (getComputedStyle(this.target).position === "static") {
                this.target.style.position = "relative";
            }
        }
        // El render reconstruye el contenido, asi que la marca se reinserta: encenderla
        // sobre un nodo desconectado no pinta nada.
        if (this.watermarkEl.parentNode !== this.target) {
            this.target.appendChild(this.watermarkEl);
        }
        const activa = !this.isPro && this.proNow() && this.attemptedPro.length > 0;
        this.watermarkEl.style.display = activa ? "flex" : "none";
        if (!activa) { return; }

        const etiquetas = this.attemptedPro.length <= 2
            ? this.attemptedPro
            : this.attemptedPro.slice(0, 2).concat([`+${this.attemptedPro.length - 2}`]);
        if (this.watermarkWhy) { this.watermarkWhy.textContent = etiquetas.join(" · "); }

        const size = Math.round(Math.max(26, Math.min(88, this.width / 7.5, this.height / 3.5)));
        this.watermarkEl.style.fontSize = `${size}px`;
        if (this.watermarkWhy) {
            this.watermarkWhy.style.cssText =
                `font-size:${Math.round(size * 0.32)}px;font-weight:600;`
                + "margin-top:0.25em;opacity:0.95;";
        }
    }

    private cancelLicenseIcon(): void {
        if (this.licenseIconTimer !== null) {
            window.clearTimeout(this.licenseIconTimer);
            this.licenseIconTimer = null;
        }
    }

    /**
     * La ruta de compra la pone Power BI, no el visual.
     *
     * Hasta 1.0.4.0 esto solo llamaba a notifyFeatureBlocked. El mensaje decia "Pro
     * removes the node cap" y NO HABIA NINGUN BOTON: notifyLicenseRequired, que es la
     * llamada que lleva la barra de Upgrade, no se invocaba nunca. Era el unico visual
     * de la cartera sin ruta de compra en ningun momento.
     *
     * Y el orden importa: Power BI muestra UNA notificacion a la vez y la ultima
     * sustituye a la anterior, asi que la barra va DESPUES del banner, no antes.
     */
    private syncLicenseNotification(): void {
        const lm = this.licenseManager as unknown as {
            notifyFeatureBlocked?: (m: string) => void;
            notifyLicenseRequired?: (t: number) => void;
            clearLicenseNotification?: () => unknown;
        };
        if (!lm) { return; }
        try {
            if (this.isPro || this.attemptedPro.length === 0) {
                this.cancelLicenseIcon();
                if (this.noticeShown) {
                    this.noticeShown = false;
                    this.notifiedPro = [];
                    lm.clearLicenseNotification?.();
                }
                return;
            }
            // Sin licencia legible no se pide comprar: podria haberla pagado ya.
            if (!this.licenseResolved || this.licenseEnvUnsupported) { return; }

            const nuevas = this.attemptedPro.filter(a => this.notifiedPro.indexOf(a) === -1);
            this.notifiedPro = this.attemptedPro.slice();
            if (nuevas.length === 0) { return; }
            this.noticeShown = true;

            const msg = this.t("UI_ProNotice", "Flow Chart: {0} — part of the Pro plan, shown here as a watermarked preview on the largest nodes. Reading view shows the free result.")
                .replace("{0}", nuevas.join(", "));

            const mostrar = () => {
                try { lm.notifyFeatureBlocked?.(msg.slice(0, 500)); } catch (_) { /* best effort */ }
                this.cancelLicenseIcon();
                this.licenseIconTimer = window.setTimeout(() => {
                    this.licenseIconTimer = null;
                    if (this.isPro || this.attemptedPro.length === 0) { return; }
                    // LicenseNotificationType.General es const enum: 0 en runtime.
                    try { lm.notifyLicenseRequired?.(0); } catch (_) { /* best effort */ }
                }, 10500);
            };
            const limpiado = lm.clearLicenseNotification?.();
            if (limpiado && typeof (limpiado as { then?: unknown }).then === "function") {
                (limpiado as Promise<unknown>).then(mostrar, mostrar);
            } else { mostrar(); }
        } catch (_) { /* nunca romper el render por un aviso */ }
    }


    /** Sin datos: la pantalla de inicio de la serie TCViz, en tres tamaños; con un aviso si falta algo concreto. */
    private renderEmpty(aviso?: string): void {
        while (this.target.firstChild) { this.target.removeChild(this.target.firstChild); }
        this.svgRoot = null;
        this.attemptedPro = [];
        if (this.watermarkEl) { this.watermarkEl.style.display = "none"; }
        const w = this.width || this.target.clientWidth || 0, h = this.height || this.target.clientHeight || 0;
        const size = (w >= 560 && h >= 300) ? "l" : (w >= 320 && h >= 200) ? "m" : "s";
        const pal = this.host.colorPalette as unknown as { isHighContrast?: boolean; foreground?: { value: string }; background?: { value: string } };
        const hc = !!pal?.isHighContrast;
        const fg = hc ? (pal.foreground?.value || "#FFFFFF") : "";
        const el = document.createElement("div");
        el.className = "fc-landing fc-landing-" + size;
        el.setAttribute("role", "status");
        if (hc) el.style.background = pal.background?.value || "#000000";
        const mk = (tag: string, cls?: string, text?: string): HTMLElement => {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text !== undefined) n.textContent = text;
            if (fg) n.style.color = fg;
            return n;
        };
        const head = mk("div", "cl-head");
        const img = document.createElement("img");
        img.src = LANDING_ICON; img.alt = ""; img.className = "cl-icon";
        head.appendChild(img);
        const titles = mk("div");
        titles.appendChild(mk("div", "cl-title", this.t("UI_LandingTitle", "Flow Chart by TCViz")));
        if (size !== "s") titles.appendChild(mk("div", "cl-tag", this.t("UI_LandingTagline", "Where the volume goes, where it comes back and where it stops.")));
        head.appendChild(titles);
        el.appendChild(head);
        if (aviso) el.appendChild(mk("p", "cl-warn", aviso));
        const link = (txt: string, url: string, cls: string, sub?: string): HTMLElement => {
            // Sin href: ni el clic central ni "abrir en pestaña" se saltan host.launchUrl.
            const a = mk("a", cls) as HTMLAnchorElement;
            a.setAttribute("role", "link"); a.tabIndex = 0;
            a.appendChild(document.createTextNode(txt));
            if (sub) a.appendChild(mk("span", "cl-sub", sub));
            if (hc) { a.style.background = "transparent"; a.style.borderColor = fg; }
            const open = (e: Event): void => { e.preventDefault(); e.stopPropagation(); if (this.canInteract) this.host.launchUrl(url); };
            a.addEventListener("click", open);
            a.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") open(e); });
            return a;
        };
        if (size === "s") {
            el.appendChild(mk("p", "cl-do", this.t("UI_Step1Short", "Drag one field per step into Levels, in order, plus a Value measure.")));
            el.appendChild(link(this.t("UI_LandingGuide", "Guide"), URL_GUIDE, "cl-a"));
            this.target.appendChild(el);
            return;
        }
        const cols = mk("div", "cl-cols");
        const pasos = mk("div");
        pasos.appendChild(mk("div", "cl-lbl", this.t("UI_LandingSteps", "Get started")));
        const ol = mk("ol", "cl-steps");
        const paso = (n: string, bold: string, txt: string) => {
            const li = mk("li");
            const num = mk("span", "cl-n", n);
            if (hc) Object.assign(num.style, { background: "transparent", border: "1px solid " + fg });
            li.appendChild(num);
            const sp = mk("span");
            sp.appendChild(mk("b", "cl-well", bold));
            sp.appendChild(document.createTextNode(" — " + txt));
            li.appendChild(sp);
            ol.appendChild(li);
        };
        paso("1", this.t("UI_LevelsShort", "Levels"), this.t("UI_LandingStep1", "one field per step of the process, in order"));
        paso("2", this.t("Role_value", "Value"), this.t("UI_LandingStep2", "sizes the links; without it, each row counts 1"));
        paso("3", this.t("Obj_style", "Style template"), this.t("UI_LandingStep3", "then direction, link labels and level headers"));
        pasos.appendChild(ol);
        if (size === "l") {
            const pro = mk("div", "cl-pro");
            const chip = mk("span", "cl-chip", "Pro");
            if (hc) { chip.style.background = "transparent"; chip.style.border = "1px solid " + fg; }
            pro.appendChild(chip);
            pro.appendChild(mk("span", "", this.t("UI_LandingPro", "Swimlanes, the KPI badge, node images, color rules, collapse, search and the Variants panel.")));
            pasos.appendChild(pro);
        }
        cols.appendChild(pasos);
        const links = mk("div");
        links.appendChild(mk("div", "cl-lbl", this.t("UI_LandingHelpTitle", "Help")));
        const ll = mk("div", "cl-links");
        ll.appendChild(link(this.t("UI_LandingGuide", "Guide"), URL_GUIDE, "cl-card", this.t("UI_LandingGuideSub", "support page")));
        ll.appendChild(link(this.t("UI_LandingProduct", "Product page"), URL_PRODUCT, "cl-card", "tcviz.com"));
        if (size === "l") ll.appendChild(link(this.t("UI_LandingVideo", "Video"), URL_VIDEO, "cl-card", "YouTube"));
        links.appendChild(ll);
        cols.appendChild(links);
        el.appendChild(cols);
        this.target.appendChild(el);
    }

    private get canInteract(): boolean {
        const h = this.host as unknown as { hostCapabilities?: { allowInteractions?: boolean }; allowInteractions?: boolean };
        return (h?.hostCapabilities?.allowInteractions ?? h?.allowInteractions) !== false;
    }

    /** Texto por clave: primero la tabla del bundle (Desktop solo traduce con getDisplayName las claves de capabilities). */
    private t(key: string, fallback: string): string {
        const loc = String(this.host?.locale || "");
        const tabla = STRINGS[loc] || STRINGS[Object.keys(STRINGS).find(l => l.slice(0, 2) === loc.slice(0, 2)) || ""];
        if (tabla && tabla[key]) return tabla[key];
        try { const v = this.loc.getDisplayName(key); return v && v !== key ? v : fallback; } catch { return fallback; }
    }

    /** Traduce tarjetas, ajustes y opciones de las listas con las claves de capabilities (src/i18n.ts). */
    private localizeModel(): void {
        const cards = (this.formattingSettings?.cards || []) as unknown as { name: string; displayName: string; slices: { name: string; displayName: string; items?: { value: string; displayName: string }[]; value?: { value?: unknown; displayName?: string } }[] }[];
        for (const card of cards) {
            const ci = I18N[card.name];
            if (!ci) continue;
            if (ci.k) card.displayName = this.t(ci.k, card.displayName);
            for (const s of card.slices || []) {
                const pi = ci.p[s.name];
                if (!pi) continue;
                if (pi.k) s.displayName = this.t(pi.k, s.displayName);
                if (s.items) {
                    s.items = s.items.map(it => ({ value: it.value, displayName: pi.e[it.value] ? this.t(pi.e[it.value], it.displayName) : it.displayName }));
                    const cur = s.items.find(it => it.value === s.value?.value);
                    if (cur) s.value = cur;
                }
            }
        }
    }

    /**
     * Plantillas de estilo: rellenan solo los ajustes que el autor no ha tocado (los que no están en metadata.objects).
     * "default" no cambia nada: es el aspecto de siempre.
     */
    private applyTemplate(): void {
        const fs = this.formattingSettings;
        const tpl = String(fs?.styleCard?.template?.value?.value ?? "default");
        const P: Record<string, [string, string, unknown][]> = {
            clean: [["linkSettings", "color", "#D8DEE9"], ["linkSettings", "highlightDominant", false], ["nodeSettings", "cornerRadius", 12],
                    ["nodeSettings", "showShadow", true], ["nodeSettings", "shadowBlur", 6], ["nodeSettings", "shadowOpacity", 18],
                    ["nodeSettings", "showStepNumber", false]],
            outline: [["dataPoint", "defaultColor", "#FFFFFF"], ["dataPoint", "colorByLevel", false], ["nodeSettings", "textColor", "#2E3440"],
                      ["nodeSettings", "badgeTextColor", "#4C566A"], ["nodeSettings", "colorBorderByLevel", true], ["nodeSettings", "borderWidth", 2],
                      ["linkSettings", "color", "#C9CFDB"]],
            contrast: [["dataPoint", "colorByLevel", false], ["dataPoint", "defaultColor", "#1F2A37"], ["nodeSettings", "textColor", "#FFFFFF"],
                       ["nodeSettings", "badgeTextColor", "#E5E9F0"], ["linkSettings", "color", "#5FA8F5"], ["linkSettings", "topVariantColor", "#F5A623"]],
            compact: [["nodeSettings", "height", 28], ["nodeSettings", "fontSize", 11], ["nodeSettings", "badgeFontSize", 8],
                      ["nodeSettings", "showBadge", false], ["nodeSettings", "showStepNumber", false],
                      ["layoutSettings", "nodeGap", 12], ["layoutSettings", "layerGap", 70]],
            minimal: [["dataPoint", "colorByLevel", false], ["dataPoint", "defaultColor", "#ECEFF4"], ["nodeSettings", "textColor", "#2E3440"],
                      ["nodeSettings", "badgeTextColor", "#4C566A"], ["nodeSettings", "showStepNumber", false], ["linkSettings", "color", "#C9CFDB"],
                      ["linkSettings", "highlightDominant", false], ["legendSettings", "show", false]],
        };
        const lista = P[tpl];
        if (!lista || !fs) return;
        const porNombre: Record<string, unknown> = {};
        for (const c of fs.cards as unknown as { name: string; slices: { name: string }[] }[]) porNombre[c.name] = c;
        for (const [obj, prop, val] of lista) {
            if (this.explicitProps?.[obj]?.[prop] !== undefined) continue;
            const card = porNombre[obj] as { slices: { name: string; value: unknown; items?: { value: string }[] }[] } | undefined;
            const s = card?.slices.find(x => x.name === prop);
            if (!s) continue;
            if (typeof val === "string" && val.startsWith("#")) s.value = { value: val };
            else if (s.items) s.value = s.items.find(i => i.value === val) ?? s.value;
            else s.value = val;
        }
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
        const type = fmt?.format?.value?.value?.toString() ?? "model";
        const decimals = fmt?.decimals?.value ?? 0;
        const prefix = fmt?.prefix?.value ?? "";
        const suffix = fmt?.suffix?.value ?? "";

        // Separadores del idioma del informe en todos los formatos (antes solo en Thousands, y con el del navegador).
        const dec = Math.max(0, Math.min(10, decimals));
        const num = (v: number, grupos = true) => v.toLocaleString(this.host?.locale || undefined,
            { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grupos });
        let body: string;
        if (type === "model") {
            // El formato de la medida (también el dinámico) y el idioma del informe, como un visual nativo.
            // Decimal places solo cuenta si el autor lo ha fijado.
            const decFijado = this.explicitProps?.["valueFormatSettings"]?.["decimals"] !== undefined;
            try {
                const f = valueFormatter.create({
                    format: this.valueFormatString || "#,0.##",
                    precision: decFijado ? Math.max(0, Math.min(10, decimals)) : undefined,
                    cultureSelector: this.host?.locale
                });
                body = f.format(value);
            } catch {
                body = value.toLocaleString(this.host?.locale || undefined);
            }
        } else if (type === "compact") {
            const abs = Math.abs(value);
            if (abs >= 1e6) body = num(value / 1e6) + "M";
            else if (abs >= 1e3) body = num(value / 1e3) + "K";
            else body = num(value);
        } else if (type === "percent") {
            const base = percentBase && percentBase > 0 ? percentBase : (this.data?.totalValue || 0);
            const pct = base > 0 ? (value / base) * 100 : 0;
            body = num(pct) + "%";
        } else if (type === "plain") {
            body = num(value, false);
        } else {
            body = num(value);
        }
        return `${prefix}${body}${suffix}`;
    }

    private parseDataView(dataView: DataView): ParsedData {
        const table = dataView.table;
        const columns = table.columns;

        const levelIdxs = columns.map((c, i) => (c.roles && c.roles["levels"] ? i : -1)).filter(i => i >= 0);
        // Las cuatro funciones Pro se detectan por su POZO, que es donde el usuario las
        // pide. Un pozo enlazado no deja rastro en metadata.objects, asi que mirar ahi
        // —como se hace con los ajustes del panel— no las veria nunca.
        const pideImagenes = columns.some(c => c.roles && c.roles["levelImages"]);
        const pideSwimlane = columns.some(c => c.roles && c.roles["swimlane"]);
        const pideTarget   = columns.some(c => c.roles && c.roles["target"]);
        const pideTooltips = columns.some(c => c.roles && c.roles["tooltips"]);
        // El recuento decide si las herramientas de escala entran en juego. Las filas
        // son una cota inferior barata del numero de nodos y basta para el umbral.
        const pideDiagramaGrande = (table.rows || []).length > BIG_DIAGRAM_NODES;

        const pideReglas = this.rulesActive();

        this.attemptedPro = [];
        if (pideSwimlane) { this.attemptedPro.push(this.t("Feat_swimlanes", "swimlanes")); }
        if (pideDiagramaGrande) { this.attemptedPro.push(this.t("Feat_tools", "large-diagram tools")); }
        if (pideImagenes) { this.attemptedPro.push(this.t("Feat_images", "node images")); }
        if (pideTarget)   { this.attemptedPro.push(this.t("Feat_kpi", "the KPI badge")); }
        if (pideTooltips) { this.attemptedPro.push(this.t("Feat_tooltips", "extra tooltips")); }
        if (pideReglas)   { this.attemptedPro.push(this.t("Feat_rules", "color rules")); }

        // Con licencia o en vista previa se dibujan; sin ninguna de las dos, el pozo se
        // ignora y el diagrama sale completo pero sin esa capa.
        const conPro = this.proNow();

        const levelImageIdxs = !conPro ? [] :
            columns.map((c, i) => (c.roles && c.roles["levelImages"] ? i : -1)).filter(i => i >= 0);
        const valueIdx = columns.findIndex(c => c.roles && c.roles["value"]);

        // Pozos para los consejos, nombres de los niveles para la leyenda y las cabeceras, y el formato de Value
        // (el dinámico de la fila si la medida lo tiene: general.formatString llega en los objetos de la fila).
        this.fields = {
            levels: levelIdxs.length, value: valueIdx >= 0, target: pideTarget, swimlane: pideSwimlane,
            images: pideImagenes, tips: pideTooltips
        };
        this.levelNames = levelIdxs.map(i => columns[i].displayName);
        this.valueFormatString = valueIdx >= 0 ? columns[valueIdx].format : undefined;
        const filaObjs = (table.rows?.[0] as DataViewTableRow | undefined)?.objects;
        if (valueIdx >= 0 && filaObjs) {
            const candidatos = [filaObjs[valueIdx], ...filaObjs];
            for (const o of candidatos) {
                const fsDin = (o as powerbi.DataViewObjects | undefined)?.["general"]?.["formatString"];
                if (typeof fsDin === "string" && fsDin) { this.valueFormatString = fsDin; break; }
            }
        }
        const targetIdx = !conPro ? -1 : columns.findIndex(c => c.roles && c.roles["target"]);
        const swimlaneIdx = !conPro ? -1 : columns.findIndex(c => c.roles && c.roles["swimlane"]);
        const tooltipIdxs = !conPro ? [] : columns
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

        // Vista previa Pro (editando, sin licencia): las capas Pro solo en los nodos de más valor, dos carriles y tres
        // variantes. Se ve cómo funciona con los datos propios, pero no sirve de trabajo terminado. Con licencia, todo.
        const previaLimitada = conPro && !this.isPro;
        const variants = Array.from(variantMap.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, previaLimitada ? PREVIEW_VARIANTS : 8);

        const totalValue = Array.from(nodeMap.values())
            .filter(n => n.layer === 0)
            .reduce((sum, n) => sum + n.outValue, 0);

        nodeMap.forEach((n, key) => {
            const seen = swimlaneSeen.get(key);
            n.swimlane = seen && seen.size === 1 ? Array.from(seen)[0] : null;
        });

        this.previewNodeIds = null;
        if (previaLimitada) {
            const top = Array.from(nodeMap.values())
                .sort((a, b) => Math.max(b.inValue, b.outValue) - Math.max(a.inValue, a.outValue))
                .slice(0, PREVIEW_NODES);
            this.previewNodeIds = new Set(top.map(n => n.id));
            const bandas: string[] = [];
            nodeMap.forEach(n => {
                if (n.swimlane && bandas.indexOf(n.swimlane) < 0) bandas.push(n.swimlane);
            });
            const bandasVisibles = new Set(bandas.slice(0, PREVIEW_BANDS));
            nodeMap.forEach(n => {
                if (n.swimlane && !bandasVisibles.has(n.swimlane)) n.swimlane = null;
                if (!this.previewNodeIds.has(n.id)) {
                    n.image = null;
                    n.hasTarget = false;
                    n.extraTooltips = [];
                }
            });
            linkMap.forEach(l => { if (!this.previewNodeIds.has(l.targetId)) { l.extra = []; l.targetValue = 0; } });
        }

        linkMap.forEach(link => {
            const s = nodeMap.get(link.sourceId);
            const t = nodeMap.get(link.targetId);
            link.tooltipItems = [
                { displayName: this.t("UI_Tip_Source", "Source"), value: s?.label ?? link.sourceId },
                { displayName: this.t("UI_Tip_To", "To"), value: t?.label ?? link.targetId },
                { displayName: this.t("Role_value", "Value"), value: this.formatValue(link.value, totalValue) },
                ...link.extra
            ];
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

        // Hueco para la barra de herramientas, que flota arriba a la izquierda: sin él tapaba la primera fila.
        const TOOLBAR_H = 30;
        nodes.forEach(n => { n.y += TOOLBAR_H; });
        if (isHorizontal) this.swimlaneBands.forEach(b => { b.start += TOOLBAR_H; b.end += TOOLBAR_H; });

        // Hueco para las cabeceras de nivel: arriba en horizontal, a la izquierda en vertical.
        if (this.formattingSettings?.layoutCard?.showLevelHeaders?.value) {
            const hs = this.formattingSettings?.layoutCard?.headerSize?.value ?? 11;
            if (isHorizontal) {
                const pad = hs + 16;
                nodes.forEach(n => { n.y += pad; });
                this.swimlaneBands.forEach(b => { b.start += pad; b.end += pad; });
            } else {
                const ff = this.formattingSettings?.nodeCard?.fontFamily?.value?.value?.toString() ?? "'Segoe UI',sans-serif";
                const pad = Math.ceil(Math.max(0, ...this.levelNames.map(s => this.measureTextWidth(s, hs, ff)))) + 18;
                nodes.forEach(n => { n.x += pad; });
                this.swimlaneBands.forEach(b => { b.start += pad; b.end += pad; });
            }
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

        // Centrado: lo hace el contenedor (flex + margin:auto), no un desplazamiento de los nodos. Antes se sumaba un
        // hueco arriba calculado al 100 % y, al ampliar, ese hueco crecía con el zoom y empujaba el diagrama hacia abajo.
        this.centeringApplied = true;

        const isHighContrast = this.host.colorPalette.isHighContrast;
        // Fondo propio (Diseño → Fondo). Sin él, el visual es transparente y la barra, la leyenda y el minimapa también,
        // para no dibujar recuadros blancos sobre el fondo del informe.
        const conFondo = !!this.formattingSettings?.layoutCard?.fillBackground?.value;
        const fondo = this.formattingSettings?.layoutCard?.backgroundColor?.value?.value || "#FFFFFF";
        const panelBg = isHighContrast ? this.host.colorPalette.background.value : (conFondo ? this.hexToRgba(fondo, 0.92) : "transparent");
        this.target.style.background = isHighContrast ? this.host.colorPalette.background.value : (conFondo ? fondo : "transparent");
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
        const showLinkLabels = this.formattingSettings?.linkCard?.showLabels?.value ?? false;
        const labelContent = String(this.formattingSettings?.linkCard?.labelContent?.value?.value ?? "value");
        const linkLabelSize = this.formattingSettings?.linkCard?.labelSize?.value ?? 9;
        const linkLabelColor = isHighContrast ? this.host.colorPalette.foreground.value
            : (this.formattingSettings?.linkCard?.labelColor?.value?.value || "#4C566A");
        const linkLabels: SVGElement[] = [];
        const candidatas: { el: SVGElement; x: number; y: number; w: number; h: number; v: number }[] = [];

        const linkPaths: SVGElement[] = links.map(l => {
            const s = nodeById.get(l.sourceId);
            const t = nodeById.get(l.targetId);
            if (!s || !t) return null;
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
            const opacity = isTopVariant ? "1" : (isDominant ? "0.95" : (highlightDominant ? "0.3" : "0.7"));
            const strokeW = isTopVariant ? w * dominantEmphasis * 1.15 : (isDominant ? w * dominantEmphasis : w);
            const strokeColor = isTopVariant ? topVariantColor : linkColor;
            l.displayColor = strokeColor;
            // aria-label y data-link-id van por setAttribute, que nunca interpreta markup:
            // ya no hace falta escapar a mano, y por tanto no hay forma de olvidarlo.
            const clases = "flow-link" + (isBackEdge ? " flow-link-back" : "")
                + (isDominant ? " flow-link-dominant" : "")
                + (isTopVariant ? " flow-link-variant" : "");
            // Etiqueta del enlace: en el punto medio de la curva (t = 0.5 de la Bézier cúbica = media de los 4 puntos
            // ponderada 1-3-3-1). Las vueltas atrás no llevan etiqueta: se leerían encima de los nodos.
            if (showLinkLabels && !isBackEdge) {
                const nums = path.replace(/[MC]/g, " ").trim().split(/[\s,]+/).map(Number);
                if (nums.length === 8 && nums.every(v => isFinite(v))) {
                    const mx = (nums[0] + 3 * nums[2] + 3 * nums[4] + nums[6]) / 8;
                    const my = (nums[1] + 3 * nums[3] + 3 * nums[5] + nums[7]) / 8;
                    const v = linkValue(l);
                    const pct = this.data.totalValue > 0 ? (v / this.data.totalValue) * 100 : 0;
                    const pctTxt = pct.toLocaleString(this.host?.locale || undefined, { maximumFractionDigits: 1 }) + "%";
                    const txt = labelContent === "percent" ? pctTxt
                        : labelContent === "both" ? `${this.formatValue(v, this.data.totalValue)} · ${pctTxt}`
                        : this.formatValue(v, this.data.totalValue);
                    const lbl = this.svgEl("text", {
                        "aria-hidden": "true", class: "flow-link-label", x: mx, y: my, dy: "-0.35em", "text-anchor": "middle",
                        "font-size": linkLabelSize, "font-family": fontFamily, fill: linkLabelColor,
                        "paint-order": "stroke", stroke: isHighContrast ? this.host.colorPalette.background.value : "#FFFFFF",
                        "stroke-width": 3, "stroke-linejoin": "round"
                    }, txt);
                    this.subSelectable(lbl, "linkLabels", this.t("Prop_linkSettings_showLabels", "Link labels"), powerbi.visuals.SubSelectionStylesType.Text);
                    const lw = this.measureTextWidth(txt, linkLabelSize, fontFamily) + 6;
                    candidatas.push({ el: lbl, x: mx - lw / 2, y: my - linkLabelSize * 1.2, w: lw, h: linkLabelSize + 3, v });
                }
            }
            const pathEl = this.svgEl("path", {
                class: clases,
                "data-link-id": l.id,
                d: path,
                stroke: strokeColor,
                "stroke-width": strokeW,
                fill: "none",
                opacity,
                "stroke-dasharray": isBackEdge ? "4 3" : null,
                tabindex: "-1",
                role: "button",
                "aria-label": this.t("UI_AriaLink", "{0} to {1}").replace("{0}", s.label).replace("{1}", t.label) + ", "
                    + this.formatValue(l.value, this.data.totalValue) + (isBackEdge ? ", " + this.t("UI_Rework", "rework") : "")
            });
            this.subSelectable(pathEl, "linkSettings", this.t("Obj_linkSettings", "Links"), powerbi.visuals.SubSelectionStylesType.Shape);
            return pathEl;
        }).filter((e): e is SVGElement => e !== null);

        // Etiquetas que no se pisan: se colocan de mayor a menor valor y se omite la que chocaría con otra ya puesta.
        const puestas: { x: number; y: number; w: number; h: number }[] = [];
        candidatas.sort((a, b) => b.v - a.v).forEach(c => {
            const choca = puestas.some(p => c.x < p.x + p.w && c.x + c.w > p.x && c.y < p.y + p.h && c.y + c.h > p.y);
            if (choca) return;
            puestas.push(c);
            linkLabels.push(c.el);
        });

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
        let shadowDefsEl: SVGElement | null = null;
        if (showShadow) {
            shadowDefsEl = this.svgEl("defs", {});
            const filtro = this.svgEl("filter", {
                id: "flow-node-shadow", x: "-50%", y: "-50%", width: "200%", height: "200%"
            });
            filtro.appendChild(this.svgEl("feDropShadow", {
                dx: shadowOffsetX, dy: shadowOffsetY, stdDeviation: shadowBlur,
                "flood-color": shadowColor, "flood-opacity": shadowOpacity
            }));
            shadowDefsEl.appendChild(filtro);
        }
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

        // Reglas de color (Pro): pintan el nodo por su valor, su parte del total o su desviación frente al objetivo.
        const conReglas = this.rulesActive() && this.proNow();
        const showStepNumber = this.formattingSettings?.nodeCard?.showStepNumber?.value ?? true;
        const enPrevia = (id: string) => !this.previewNodeIds || this.previewNodeIds.has(id);
        // Tabindex móvil: un solo nodo en el orden de tabulación; las flechas recorren el resto.
        if (!this.focusNodeId || !nodes.some(n => n.id === this.focusNodeId)) {
            this.focusNodeId = nodes.slice().sort((a, b) => a.layer - b.layer || a.order - b.order)[0]?.id ?? null;
        }

        const nodeShapes = nodes.map(n => {
            const reglaColor = conReglas && enPrevia(n.id) ? this.ruleColor(n) : null;
            const nodeFill = isHighContrast
                ? this.host.colorPalette.background.value
                : (reglaColor ?? (colorByLevel ? levelColors[n.layer % levelColors.length] : defaultColor));
            n.displayColor = nodeFill;
            const effectiveBorderColor = colorBorderByLevel ? levelColors[n.layer % levelColors.length] : borderColor;
            const nodeStroke = isHighContrast
                ? `stroke="${this.host.colorPalette.foreground.value}" stroke-width="1.5"`
                : ((borderWidth > 0 || colorBorderByLevel) ? `stroke="${effectiveBorderColor}" stroke-width="${Math.max(borderWidth, colorBorderByLevel ? 2 : 0)}"` : "");
            const hasBadge = showBadge;
            const imageOffset = n.image ? imageSize + IMAGE_PADDING : 0;
            const labelCenterX = imageOffset + (n.width - imageOffset) / 2;
            // Nombre y valor como un bloque centrado: el mismo margen arriba y abajo (antes el valor iba pegado al borde).
            const bloque = hasBadge ? fontSize + 4 + badgeFontSize : fontSize;
            const arribaBloque = (n.height - bloque) / 2;
            const labelY = hasBadge ? arribaBloque + fontSize / 2 : n.height / 2;
            const badgeEls: SVGElement[] = [];
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
                const badgeY = arribaBloque + fontSize + 4 + badgeFontSize / 2;
                const kpiColor = isUp ? kpiUpColor : kpiDownColor;
                const pillFill = isKpi ? this.hexToRgba(kpiColor, 0.85) : this.hexToRgba(badgeBackgroundColor, badgeBackgroundOpacity);
                const showPill = isKpi || badgeBackgroundOpacity > 0;
                const textFill = isKpi ? "#FFFFFF" : badgeTextColor;
                if (showPill) {
                    const textW = this.measureTextWidth(badgeText, badgeFontSize, badgeFontFamily);
                    const padX = 6;
                    badgeEls.push(this.svgEl("rect", {
                        x: labelCenterX - textW / 2 - padX, y: badgeY - badgeFontSize / 2 - 2,
                        width: textW + padX * 2, height: badgeFontSize + 4,
                        rx: (badgeFontSize + 4) / 2, fill: pillFill
                    }));
                }
                badgeEls.push(this.svgEl("text", {
                    "aria-hidden": "true", x: labelCenterX, y: badgeY, dy: "0.35em",
                    "text-anchor": "middle", "font-size": badgeFontSize,
                    "font-family": badgeFontFamily, fill: textFill, opacity: "0.95"
                }, badgeText));
            }
            const positionCode = `${n.layer + 1}.${n.order + 1}`;
            const visibleActual = this.visibleInValue.get(n.id) || this.visibleOutValue.get(n.id) || 0;
            const nivelNombre = this.levelNames[n.layer] || this.t("UI_Level", "Level {0}").replace("{0}", String(n.layer + 1));
            const ariaParts = [`${n.label}, ${nivelNombre} (${n.layer + 1})`, `${this.t("Role_value", "Value")} ${this.formatValue(visibleActual, this.data.totalValue)}`];
            const visibleTargetAria = this.visibleTargetValue.get(n.id) || 0;
            if (n.hasTarget && visibleTargetAria !== 0) {
                const pct = (visibleActual - visibleTargetAria) / visibleTargetAria * 100;
                ariaParts.push((pct >= 0 ? this.t("UI_AriaAbove", "{0}% above target") : this.t("UI_AriaBelow", "{0}% below target"))
                    .replace("{0}", Math.abs(pct).toFixed(1)));
            }

            const g = this.svgEl("g", {
                class: "flow-node", "data-node-id": n.id, tabindex: n.id === this.focusNodeId ? "0" : "-1", role: "button",
                "aria-label": ariaParts.join(", "),
                transform: `translate(${n.x},${n.y})`,
                filter: showShadow ? "url(#flow-node-shadow)" : null
            });
            this.subSelectable(g, "nodeSettings", this.t("Obj_nodeSettings", "Nodes"), powerbi.visuals.SubSelectionStylesType.Text);

            const rect = this.svgEl("rect", {
                width: n.width, height: n.height, rx: cornerRadius, fill: nodeFill, opacity: "0.95"
            });
            if (isHighContrast) {
                rect.setAttribute("stroke", this.host.colorPalette.foreground.value);
                rect.setAttribute("stroke-width", "1.5");
            } else if (borderWidth > 0 || colorBorderByLevel) {
                rect.setAttribute("stroke", effectiveBorderColor);
                rect.setAttribute("stroke-width", String(Math.max(borderWidth, colorBorderByLevel ? 2 : 0)));
            }
            g.appendChild(rect);

            // La imagen es un data URI del modelo. href por setAttribute: aunque llegara
            // algo raro, no puede convertirse en markup.
            if (n.image) {
                // Fondo opcional detrás de la imagen (Nodos → Fondo de la imagen) y forma: un icono transparente o oscuro
                // se lee igual sobre cualquier color de nodo. Con "Círculo" la imagen también se recorta en círculo.
                const ix = 4, iy = (n.height - imageSize) / 2;
                const forma = String(this.formattingSettings?.nodeCard?.imageShape?.value?.value ?? "rounded");
                const radio = forma === "circle" ? imageSize / 2 : forma === "rounded" ? Math.round(imageSize * 0.22) : 0;
                if (this.formattingSettings?.nodeCard?.imageBackground?.value) {
                    const pad = 2;
                    g.appendChild(this.svgEl("rect", {
                        "aria-hidden": "true", x: ix - pad, y: iy - pad, width: imageSize + pad * 2, height: imageSize + pad * 2,
                        rx: radio ? radio + pad : 0,
                        fill: isHighContrast ? this.host.colorPalette.background.value
                            : (this.formattingSettings?.nodeCard?.imageBackgroundColor?.value?.value || "#FFFFFF")
                    }));
                }
                let clip: string | null = null;
                if (radio > 0) {
                    clip = "fc-img-" + (++this.clipSeq);
                    const cp = this.svgEl("clipPath", { id: clip });
                    cp.appendChild(this.svgEl("rect", { x: ix, y: iy, width: imageSize, height: imageSize, rx: radio }));
                    g.appendChild(cp);
                }
                g.appendChild(this.svgEl("image", {
                    x: ix, y: iy, width: imageSize, height: imageSize,
                    href: n.image, preserveAspectRatio: "xMidYMid slice",
                    "clip-path": clip ? `url(#${clip})` : null
                }));
            }

            // Número de paso (nivel.orden): el mismo código que el tooltip llama "Position".
            if (showStepNumber) {
                g.appendChild(this.svgEl("text", {
                    "aria-hidden": "true", x: n.width - 6, y: 10, "text-anchor": "end",
                    "font-size": 9, "font-family": fontFamily, fill: textColor, opacity: "0.7"
                }, positionCode));
            }

            g.appendChild(this.svgEl("text", {
                "aria-hidden": "true", x: labelCenterX, y: labelY, dy: "0.35em",
                "text-anchor": "middle", "font-size": fontSize,
                "font-family": fontFamily, fill: textColor
            }, n.label));

            badgeEls.forEach(e => g.appendChild(e));

            const hasChildren = (childrenOf.get(n.id) || []).length > 0;
            const isCollapsed = this.collapsedNodes.has(n.id);
            // Colapsar es Pro: con nueve nodos no hace falta, con doscientos es lo primero
            // que se busca. El diagrama entero se dibuja igual, con licencia o sin ella.
            if (hasChildren && this.proNow()) {
                const tg = this.svgEl("g", {
                    class: "flow-collapse-toggle", "data-node-id": n.id, tabindex: "0", role: "button",
                    "aria-label": (isCollapsed ? this.t("UI_Expand", "Expand {0}") : this.t("UI_Collapse", "Collapse {0}")).replace("{0}", n.label),
                    transform: `translate(${n.width},${n.height / 2})`, style: "cursor:pointer;"
                });
                tg.appendChild(this.svgEl("circle", { r: 7, fill: "#ffffff", stroke: nodeFill, "stroke-width": "1.5" }));
                tg.appendChild(this.svgEl("text", {
                    "aria-hidden": "true", x: 0, y: 0, dy: "0.35em", "text-anchor": "middle",
                    "font-size": 10, "font-family": fontFamily, fill: nodeFill
                }, isCollapsed ? "+" : "−"));
                g.appendChild(tg);
            }
            return g;
        });

        this.contentWidth = maxX;
        this.contentHeight = maxY;
        // Ajustar al visual un diagrama que no cabe, una vez por forma y tamaño (luego manda el zoom del lector).
        const fitOnLoad = this.formattingSettings?.layoutCard?.fitOnLoad?.value ?? true;
        const fitKey = `${nodes.length}|${this.direction}|${Math.round(maxX)}x${Math.round(maxY)}|${Math.round(this.width)}x${Math.round(this.height)}`;
        if (fitOnLoad && fitKey !== this.fittedKey && this.width > 0 && this.height > 0) {
            this.fittedKey = fitKey;
            const escala = Math.min(this.width / maxX, this.height / maxY);
            this.zoomScale = escala < 1 ? Math.max(0.35, escala) : 1;
        }
        const svgWidth = maxX * this.zoomScale;
        const svgHeight = maxY * this.zoomScale;

        const showLegend = (this.formattingSettings?.legendCard?.show?.value ?? true) && this.height >= 140;
        const legendPos = String(this.formattingSettings?.legendCard?.position?.value?.value ?? "bottomLeft");
        const legendFieldNames = this.formattingSettings?.legendCard?.useFieldNames?.value ?? true;
        const legendSize = this.formattingSettings?.legendCard?.fontSize?.value ?? 11;
        const legendColor = isHighContrast ? this.host.colorPalette.foreground.value
            : (this.formattingSettings?.legendCard?.textColor?.value?.value || "#333333");
        const legendBg = panelBg;
        const nombreNivel = (li: number) => (legendFieldNames && this.levelNames[li])
            ? this.levelNames[li] : this.t("UI_Level", "Level {0}").replace("{0}", String(li + 1));
        const usedLevels = Array.from(new Set(nodes.map(n => n.layer))).sort((a, b) => a - b);
        let legendEl: HTMLElement | null = null;
        if (showLegend && colorByLevel && usedLevels.length) {
            const lado = legendPos === "bottomRight" ? "bottom:0;right:0;" : legendPos === "topRight" ? "top:0;right:0;" : "bottom:0;left:0;";
            legendEl = this.htmlEl("div", {
                class: "flow-legend", role: "list", "aria-label": this.t("Obj_legendSettings", "Legend"),
                style: `position:absolute;${lado}z-index:2;background:${legendBg};max-width:calc(100% - 8px);`
                     + `font:${legendSize}px 'Segoe UI',sans-serif;padding:4px 6px;color:${legendColor};`
                     + "display:flex;flex-wrap:wrap;row-gap:2px;box-sizing:border-box;"
            });
            usedLevels.forEach(li => {
                const item = this.htmlEl("span", {
                    role: "listitem",
                    style: "display:inline-flex;align-items:center;gap:4px;margin-right:12px;"
                });
                item.appendChild(this.htmlEl("span", {
                    style: `width:10px;height:10px;border-radius:2px;display:inline-block;flex-shrink:0;`
                         + `background:${isHighContrast ? legendColor : levelColors[li % levelColors.length]};`
                }));
                item.appendChild(document.createTextNode(nombreNivel(li)));
                legendEl.appendChild(item);
            });
            this.subSelectable(legendEl, "legendSettings", this.t("Obj_legendSettings", "Legend"), powerbi.visuals.SubSelectionStylesType.Text);
        }

        // Cabeceras de nivel: el nombre de cada campo encima (o a la izquierda) de su columna de nodos.
        const showHeaders = this.formattingSettings?.layoutCard?.showLevelHeaders?.value ?? false;
        const headerSize = this.formattingSettings?.layoutCard?.headerSize?.value ?? 11;
        const headerColor = isHighContrast ? this.host.colorPalette.foreground.value
            : (this.formattingSettings?.layoutCard?.headerColor?.value?.value || "#4C566A");
        const headerEls: SVGElement[] = [];
        if (showHeaders) {
            const arriba = Math.min(...nodes.map(n => n.y));
            usedLevels.forEach(li => {
                const capa = nodes.filter(n => n.layer === li);
                if (!capa.length) return;
                const x = isHorizontal ? Math.min(...capa.map(n => n.x)) + Math.max(...capa.map(n => n.width)) / 2 : 6;
                const y = isHorizontal ? arriba - 10 : capa[0].y + capa[0].height / 2;
                const h = this.svgEl("text", {
                    class: "flow-level-header", x, y, dy: isHorizontal ? null : "0.35em", "text-anchor": isHorizontal ? "middle" : "start",
                    "font-size": headerSize, "font-weight": "600", "font-family": fontFamily, fill: headerColor
                }, nombreNivel(li));
                this.subSelectable(h, "layoutSettings", this.t("Prop_layoutSettings_showLevelHeaders", "Level headers"), powerbi.visuals.SubSelectionStylesType.Text);
                headerEls.push(h);
            });
        }

        const variants = this.data.variants;
        let variantsPanelEl: HTMLElement | null = null;
        if (variants.length) {
            variantsPanelEl = this.htmlEl("div", {
                class: "flow-variants-panel",
                style: `display:${this.variantsPanelOpen ? "block" : "none"};position:absolute;top:34px;`
                     + "left:0;z-index:3;background:rgba(255,255,255,0.97);border:1px solid #ccc;"
                     + "border-radius:3px;padding:8px;width:460px;max-height:420px;overflow-y:auto;"
                     + "font-family:'Segoe UI',sans-serif;"
            });
            variantsPanelEl.appendChild(this.htmlEl("div", {
                style: "font-size:11px;font-weight:600;color:#333;margin-bottom:4px;"
            }, this.t("UI_TopVariants", "Top variants (full paths)")));

            variants.forEach((v, i) => {
                const pct = this.data.totalValue > 0 ? (v.value / this.data.totalValue) * 100 : 0;
                const isActive = this.tracedVariantPath === v.path;
                const row = this.htmlEl("div", {
                    class: "flow-variant-row", "data-variant-index": i,
                    style: `cursor:pointer;padding:4px 6px;border-radius:3px;${isActive ? "background:#e8f0fe;" : ""}`
                });
                // v.path es la concatenacion de etiquetas del usuario: textContent y title,
                // nunca markup.
                const ruta = this.htmlEl("div", {
                    title: v.path,
                    style: "font-size:11px;color:#333;white-space:nowrap;overflow:hidden;"
                         + "text-overflow:ellipsis;max-width:440px;"
                }, v.path);
                const barra = this.htmlEl("div", { style: "display:flex;align-items:center;gap:6px;" });
                const pista = this.htmlEl("div", {
                    style: "flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden;"
                });
                pista.appendChild(this.htmlEl("div", {
                    style: `width:${Math.min(100, pct)}%;height:100%;background:#2B6CB0;`
                }));
                barra.appendChild(pista);
                barra.appendChild(this.htmlEl("div", {
                    style: "font-size:10px;color:#666;white-space:nowrap;"
                }, `${this.formatValue(v.value, this.data.totalValue)} · ${pct.toFixed(1)}%`));
                row.appendChild(ruta);
                row.appendChild(barra);
                variantsPanelEl.appendChild(row);
            });
        }

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
        const swimlaneBandEls: SVGElement[] = [];
        this.swimlaneBands.forEach((band, i) => {
            const bg = this.hexToRgba(swimlaneBandColors[i % swimlaneBandColors.length], swimlaneBandOpacity);
            const axisStart = Math.max(0, band.axisStart - 14);
            const horiz = isHorizontal;
            swimlaneBandEls.push(this.svgEl("rect", {
                "aria-hidden": "true",
                x: horiz ? axisStart : band.start,
                y: horiz ? band.start : axisStart,
                width: horiz ? maxX - axisStart : band.end - band.start,
                height: horiz ? band.end - band.start : maxY - axisStart,
                fill: bg
            }));
            if (band.label) {
                // La etiqueta es dato del usuario: va por textContent, no por markup.
                swimlaneBandEls.push(this.svgEl("text", {
                    "aria-hidden": "true",
                    x: horiz ? axisStart + 4 : band.start + 4,
                    y: horiz ? band.start + 12 : axisStart + 14,
                    "font-size": swimlaneLabelSize,
                    "font-family": swimlaneFontFamily,
                    fill: swimlaneTextColor,
                    opacity: "0.9"
                }, band.label));
            }
        });

        const MINIMAP_MAX_W = 160;
        const MINIMAP_MAX_H = 100;
        this.minimapScale = nodes.length ? Math.min(MINIMAP_MAX_W / maxX, MINIMAP_MAX_H / maxY) : 1;
        const minimapW = Math.max(1, maxX * this.minimapScale);
        const minimapH = Math.max(1, maxY * this.minimapScale);
        // En un visual pequeño el minimapa taparía el diagrama.
        const showMinimap = nodes.length > 6 && this.width >= 360 && this.height >= 240;
        let minimapEl: HTMLElement | null = null;
        if (showMinimap) {
            minimapEl = this.htmlEl("div", {
                class: "flow-minimap", "aria-hidden": "true",
                // Abajo a la derecha: arriba a la izquierda tapaba el primer nodo y su cabecera.
                style: `position:absolute;${legendPos === "bottomRight" ? "top:38px" : "bottom:4px"};right:4px;z-index:2;background:${panelBg};`
                     + "border:1px solid #ccc;border-radius:3px;padding:2px;"
            });
            const msvg = this.svgEl("svg", {
                class: "flow-minimap-svg", width: minimapW, height: minimapH,
                viewBox: `0 0 ${minimapW} ${minimapH}`, style: "display:block;cursor:pointer;"
            });
            msvg.appendChild(this.svgEl("rect", { x: 0, y: 0, width: minimapW, height: minimapH, fill: "#f4f4f4" }));
            nodes.forEach(n => {
                const color = isHighContrast
                    ? this.host.colorPalette.foreground.value
                    : (colorByLevel ? levelColors[n.layer % levelColors.length] : defaultColor);
                msvg.appendChild(this.svgEl("rect", {
                    x: n.x * this.minimapScale, y: n.y * this.minimapScale,
                    width: Math.max(1, n.width * this.minimapScale),
                    height: Math.max(1, n.height * this.minimapScale),
                    fill: color, opacity: "0.9"
                }));
            });
            msvg.appendChild(this.svgEl("rect", {
                class: "minimap-viewport", fill: "rgba(43,108,176,0.2)",
                stroke: "#2B6CB0", "stroke-width": "1"
            }));
            minimapEl.appendChild(msvg);
        }

        this.target.style.position = "relative";
        while (this.target.firstChild) { this.target.removeChild(this.target.firstChild); }

        const barra = this.htmlEl("div", {
            class: "flow-toolbar",
            style: "position:absolute;top:0;left:0;z-index:2;display:flex;gap:6px;padding:4px;"
                 + `background:${panelBg};width:max-content;`
        });
        const ESTILO_BOTON = "font:12px 'Segoe UI',sans-serif;padding:2px 8px;border:1px solid #ccc;"
                           + "border-radius:3px;cursor:pointer;";
        // Visual estrecho: solo Ajustar, para no tapar el diagrama.
        const estrecho = this.width < 320;
        if (this.proNow() && !estrecho) {
            barra.appendChild(this.htmlEl("input", {
                type: "text", class: "flow-search", placeholder: this.t("UI_Search", "Search node..."),
                "aria-label": this.t("UI_SearchAria", "Search node by name"),
                style: "font:12px 'Segoe UI',sans-serif;padding:2px 6px;border:1px solid #ccc;border-radius:3px;"
            }));
        }
        if (!estrecho) {
            barra.appendChild(this.htmlEl("button", {
                type: "button", class: "flow-zoom-out", title: this.t("UI_ZoomOut", "Zoom out"), "aria-label": this.t("UI_ZoomOut", "Zoom out"),
                style: "font:14px 'Segoe UI',sans-serif;width:24px;padding:0;border:1px solid #ccc;"
                     + "border-radius:3px;background:#fff;cursor:pointer;"
            }, "−"));
            barra.appendChild(this.htmlEl("button", {
                type: "button", class: "flow-zoom-in", title: this.t("UI_ZoomIn", "Zoom in"), "aria-label": this.t("UI_ZoomIn", "Zoom in"),
                style: "font:14px 'Segoe UI',sans-serif;width:24px;padding:0;border:1px solid #ccc;"
                     + "border-radius:3px;background:#fff;cursor:pointer;"
            }, "+"));
        }
        barra.appendChild(this.htmlEl("button", {
            type: "button", class: "flow-fit", "aria-label": this.t("UI_FitAria", "Fit diagram to view"),
            style: ESTILO_BOTON + "background:#fff;"
        }, this.t("UI_Fit", "Fit")));
        if (variants.length && this.proNow() && !estrecho) {
            barra.appendChild(this.htmlEl("button", {
                type: "button", class: "flow-variants-toggle",
                "aria-label": this.t("UI_VariantsAria", "Toggle top variants panel"),
                "aria-pressed": String(this.variantsPanelOpen),
                style: ESTILO_BOTON + `background:${this.variantsPanelOpen ? "#e8f0fe" : "#fff"};`
            }, this.t("UI_Variants", "Variants")));
        }
        if (!estrecho) {
            barra.appendChild(this.htmlEl("button", {
                type: "button", class: "flow-tooltips-toggle", title: this.t("UI_TooltipsAria", "Toggle tooltips"),
                "aria-label": this.t("UI_TooltipsAria", "Toggle tooltips"), "aria-pressed": String(this.tooltipsEnabled),
                style: ESTILO_BOTON + `background:${this.tooltipsEnabled ? "#fff" : "#e8f0fe"};padding:2px 6px;`
            }, "ⓘ"));  // ⓘ: el texto traducido ("Información sobre herramientas") no cabe en la barra; va en title y aria-label
        }
        this.subSelectable(barra, "layoutSettings", this.t("Obj_layoutSettings", "Layout"), powerbi.visuals.SubSelectionStylesType.Shape);
        this.target.appendChild(barra);

        if (variantsPanelEl) { this.target.appendChild(variantsPanelEl); }

        const scroll = this.htmlEl("div", {
            class: "flow-scroll", style: "position:absolute;inset:0;overflow:auto;display:flex;"
        });
        const svg = this.svgEl("svg", {
            width: svgWidth, height: svgHeight, viewBox: `0 0 ${maxX} ${maxY}`,
            style: "display:block;margin:auto;flex-shrink:0;", role: "group",
            "aria-label": this.t("UI_AriaDiagram", "Flow diagram with {0} nodes. Use the arrow keys to move between steps.").replace("{0}", String(nodes.length))
        });
        if (shadowDefsEl) { svg.appendChild(shadowDefsEl); }

        // Cuadrícula de fondo opcional, detrás de todo.
        if (this.formattingSettings?.layoutCard?.showGrid?.value && !isHighContrast) {
            const gc = this.formattingSettings?.layoutCard?.gridColor?.value?.value || "#E5E9F0";
            const defs = this.svgEl("defs", {});
            const pat = this.svgEl("pattern", { id: "flow-grid", width: 20, height: 20, patternUnits: "userSpaceOnUse" });
            pat.appendChild(this.svgEl("path", { d: "M20 0 L0 0 0 20", fill: "none", stroke: gc, "stroke-width": 1 }));
            defs.appendChild(pat);
            svg.appendChild(defs);
            svg.appendChild(this.svgEl("rect", { "aria-hidden": "true", class: "flow-grid", x: 0, y: 0, width: maxX, height: maxY, fill: "url(#flow-grid)" }));
        }

        const capaSwim = this.svgEl("g", { class: "swimlane-layer" });
        swimlaneBandEls.forEach(e => capaSwim.appendChild(e));
        const capaLinks = this.svgEl("g", { class: "links-layer" });
        linkPaths.forEach(e => capaLinks.appendChild(e));
        const capaNodos = this.svgEl("g", { class: "nodes-layer" });
        nodeShapes.forEach(e => capaNodos.appendChild(e));
        const capaTextos = this.svgEl("g", { class: "labels-layer" });
        linkLabels.forEach(e => capaTextos.appendChild(e));
        headerEls.forEach(e => capaTextos.appendChild(e));
        svg.appendChild(capaSwim);
        svg.appendChild(capaLinks);
        svg.appendChild(capaNodos);
        svg.appendChild(capaTextos);

        scroll.appendChild(svg);
        this.target.appendChild(scroll);

        if (legendEl) { this.target.appendChild(legendEl); }
        if (minimapEl) { this.target.appendChild(minimapEl); }

        this.svgRoot = this.target.querySelector("svg");
        this.attachInteractions();
        this.updateMinimapViewport();
        this.applySelectionDimming();
        // render() también se llama al plegar una rama: la marca y los consejos se reponen aquí.
        this.updateWatermark();
        this.renderGuide();
    }

    // ── Construccion del DOM ──────────────────────────────────────────────────
    //
    // Hasta 1.0.4.0 el render montaba todo como texto y lo inyectaba con innerHTML,
    // con la regla powerbi-visuals/no-inner-outer-html SUPRIMIDA a mano. Un visual
    // hermano fue rechazado por XSS exactamente por eso, y la supresion es lo que ve
    // el revisor: no audita si escapas bien, aplica la politica. Ademas invita a que
    // el siguiente cambio meta un dato sin escapar sin que nadie se entere.
    //
    // Estos dos ayudantes cubren el 95% del render. Nada de lo que viene del usuario
    // pasa ya por markup: va por textContent o por setAttribute.

    /** Elemento SVG con atributos. Los null/undefined se omiten. */
    private svgEl(tag: string, attrs: Record<string, string | number | null | undefined>,
                  text?: string): SVGElement {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag) as SVGElement;
        for (const k of Object.keys(attrs)) {
            const v = attrs[k];
            if (v === null || v === undefined || v === "") { continue; }
            el.setAttribute(k, String(v));
        }
        if (text !== undefined) { el.textContent = text; }
        return el;
    }

    /** Elemento HTML con atributos y estilo en bloque. */
    private htmlEl(tag: string, attrs: Record<string, string | number | null | undefined>,
                   text?: string): HTMLElement {
        const el = document.createElement(tag);
        for (const k of Object.keys(attrs)) {
            const v = attrs[k];
            if (v === null || v === undefined || v === "") { continue; }
            if (k === "style") { el.style.cssText = String(v); continue; }
            el.setAttribute(k, String(v));
        }
        if (text !== undefined) { el.textContent = text; }
        return el;
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

        if (!this.contextMenuBound) {
            this.contextMenuBound = true;
            this.target.addEventListener("contextmenu", (e: MouseEvent) => {
                e.preventDefault();
                if (!this.canInteract || this.formatMode) return;
                const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
                const linkEl = (e.target as Element).closest(".flow-link") as SVGPathElement;
                const node = nodeEl ? this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id")) : null;
                const link = linkEl ? this.data.links.find(l => l.id === linkEl.getAttribute("data-link-id")) : null;
                const selectionId = node?.selectionIds?.[0] ?? link?.selectionIds?.[0] ?? undefined;
                this.selectionManager.showContextMenu(selectionId ?? {}, { x: e.clientX, y: e.clientY });
            });
        }

        this.svgRoot.addEventListener("click", (e: MouseEvent) => {
            // Interacciones desactivadas por el autor, o modo formato (el clic elige qué formatear): no se filtra.
            if (!this.canInteract || this.formatMode) return;
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
            const nodeEl = (e.target as Element).closest(".flow-node") as SVGGElement;
            if (!nodeEl) return;
            const node = this.data.nodes.find(n => n.id === nodeEl.getAttribute("data-node-id"));
            if (!node) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (this.canInteract && !this.formatMode) this.toggleSelection(node.selectionIds, e.ctrlKey);
                return;
            }
            // Flechas: a lo largo del flujo (siguiente / anterior nivel) y dentro del nivel. Home y End: primero y último.
            const visibles = Array.from(this.svgRoot.querySelectorAll(".flow-node"))
                .map(el => this.data.nodes.find(n => n.id === el.getAttribute("data-node-id")))
                .filter((n): n is FlowNode => !!n);
            const horiz = this.direction === "horizontal";
            const adelante = horiz ? "ArrowRight" : "ArrowDown", atras = horiz ? "ArrowLeft" : "ArrowUp";
            const sig = horiz ? "ArrowDown" : "ArrowRight", ant = horiz ? "ArrowUp" : "ArrowLeft";
            let dest: FlowNode | undefined;
            const mismoNivel = visibles.filter(n => n.layer === node.layer).sort((a, b) => a.order - b.order);
            const cerca = (capa: number) => visibles.filter(n => n.layer === capa)
                .sort((a, b) => Math.abs(a.order - node.order) - Math.abs(b.order - node.order))[0];
            if (e.key === adelante) dest = cerca(node.layer + 1);
            else if (e.key === atras) dest = cerca(node.layer - 1);
            else if (e.key === sig) dest = mismoNivel[mismoNivel.indexOf(node) + 1];
            else if (e.key === ant) dest = mismoNivel[mismoNivel.indexOf(node) - 1];
            else if (e.key === "Home") dest = visibles.slice().sort((a, b) => a.layer - b.layer || a.order - b.order)[0];
            else if (e.key === "End") dest = visibles.slice().sort((a, b) => b.layer - a.layer || b.order - a.order)[0];
            else return;
            e.preventDefault();
            if (!dest) return;
            this.focusNodeId = dest.id;
            this.svgRoot.querySelectorAll(".flow-node").forEach(el =>
                el.setAttribute("tabindex", el.getAttribute("data-node-id") === dest.id ? "0" : "-1"));
            const destEl = this.svgRoot.querySelector(`.flow-node[data-node-id="${CSS.escape(dest.id)}"]`) as SVGGElement | null;
            destEl?.focus();
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
                            { displayName: this.t("UI_Tip_Target", "Target"), value: this.formatValue(visibleTarget, this.data.totalValue) },
                            { displayName: this.t("UI_Tip_Variance", "Variance"), value: `${variancePct >= 0 ? "+" : ""}${variancePct.toFixed(1)}%` }
                        );
                    }
                    this.host.tooltipService.show({
                        dataItems: [
                            { displayName: this.levelNames[node.layer] || this.t("UI_Tip_Step", "Step"), value: node.label, color: node.displayColor },
                            { displayName: this.t("UI_Tip_Level", "Level"), value: String(node.layer + 1) },
                            { displayName: this.t("UI_Tip_Position", "Position"), value: `${node.layer + 1}.${node.order + 1}` },
                            { displayName: this.t("UI_Tip_Origin", "Origin"), value: node.originLabels.join(", ") || "—" },
                            { displayName: this.t("UI_Tip_Inflow", "Inflow"), value: this.formatValue(visibleIn, this.data.totalValue) },
                            { displayName: this.t("UI_Tip_Outflow", "Outflow"), value: this.formatValue(visibleOut, this.data.totalValue) },
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

    // ── Reglas de color (Pro) ────────────────────────────────────────────────

    private rulesActive(): boolean {
        const r = this.formattingSettings?.rulesCard;
        return !!(r?.rule1On?.value || r?.rule2On?.value || r?.rule3On?.value);
    }

    /** Color de la primera regla que cumple el nodo, o null. "% vs target" solo se evalúa si el nodo tiene objetivo. */
    private ruleColor(n: FlowNode): string | null {
        const r = this.formattingSettings?.rulesCard;
        if (!r) return null;
        const basis = String(r.basis?.value?.value ?? "value");
        const actual = this.visibleInValue.get(n.id) || this.visibleOutValue.get(n.id) || 0;
        let v: number | null = actual;
        if (basis === "share") {
            v = this.data.totalValue > 0 ? (actual / this.data.totalValue) * 100 : null;
        } else if (basis === "variance") {
            const tg = this.visibleTargetValue.get(n.id) || 0;
            v = n.hasTarget && tg !== 0 ? ((actual - tg) / tg) * 100 : null;
        }
        if (v === null || !isFinite(v)) return null;
        const reglas: [boolean, string, number, string][] = [
            [!!r.rule1On.value, String(r.rule1Op.value?.value), r.rule1Value.value, r.rule1Color.value?.value],
            [!!r.rule2On.value, String(r.rule2Op.value?.value), r.rule2Value.value, r.rule2Color.value?.value],
            [!!r.rule3On.value, String(r.rule3Op.value?.value), r.rule3Value.value, r.rule3Color.value?.value]
        ];
        for (const [on, op, umbral, col] of reglas) {
            if (!on || !col) continue;
            if ((op === "lt" && v < umbral) || (op !== "lt" && v > umbral)) return col;
        }
        return null;
    }

    // ── Consejos de configuración (solo editando) ─────────────────────────────

    /**
     * Abajo, solo editando, con datos y si cabe: qué pozos hay, plantillas y las dos opciones que más cambian el
     * diagrama, en un clic. persistProperties solo desde un clic. ✕ los cierra (style.guide = false).
     */
    private renderGuide(): void {
        this.target.querySelectorAll(".fc-guide").forEach(n => n.remove());
        const fs = this.formattingSettings;
        if (!this.editing || this.formatMode || !this.canInteract || !(fs?.styleCard?.guide?.value ?? true)
            || this.width < 380 || this.height < 240 || !this.svgRoot) return;
        const pal = this.host.colorPalette as unknown as { isHighContrast?: boolean; foreground?: { value: string }; background?: { value: string }; foregroundSelected?: { value: string } };
        const hc = !!pal?.isHighContrast;
        const azul = hc ? (pal.foregroundSelected?.value || "#FFFF00") : "#2B6CB0";
        const fg = hc ? (pal.foreground?.value || "#FFF") : "";
        const g = document.createElement("div");
        g.className = "fc-guide";
        g.setAttribute("role", "region");
        g.setAttribute("aria-label", this.t("UI_GuideTitle", "Setup tips"));
        if (hc) Object.assign(g.style, { background: pal.background?.value || "#000", color: fg, borderColor: azul });
        g.addEventListener("click", e => e.stopPropagation());
        g.addEventListener("keydown", e => e.stopPropagation());
        const fila = (titulo: string) => {
            const f = document.createElement("div");
            f.className = "fc-g-row";
            const l = document.createElement("span");
            l.className = "fc-g-lbl";
            l.textContent = titulo;
            f.appendChild(l);
            g.appendChild(f);
            return f;
        };
        const guardar = (obj: string, props: Record<string, powerbi.DataViewPropertyValue>) =>
            this.host.persistProperties({ merge: [{ objectName: obj, selector: null, properties: props }] });
        const boton = (f: HTMLElement, texto: string, on: boolean, accion: () => void) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "fc-g-btn";
            b.textContent = texto;
            b.setAttribute("aria-pressed", String(on));
            b.style.borderColor = azul;
            if (on) { b.style.background = azul; b.style.color = hc ? (pal.background?.value || "#000") : "#FFFFFF"; } else b.style.color = azul;
            b.addEventListener("click", accion);
            f.appendChild(b);
        };
        const p = this.fields;
        const f0 = fila(this.t("UI_GuideFields", "Fields:"));
        const marca = (ok: boolean, texto: string) => {
            const s = document.createElement("span");
            s.className = "fc-g-field" + (ok ? " ok" : "");
            s.textContent = (ok ? "✓ " : "○ ") + texto;
            f0.appendChild(s);
        };
        marca(p.levels >= 2, this.t("UI_LevelsShort", "Levels") + " (" + p.levels + ")");
        marca(p.value, this.t("Role_value", "Value"));
        marca(p.swimlane, this.t("Role_swimlane", "Swimlane (Pro)"));
        marca(p.target, this.t("UI_TargetShort", "Target (Pro)"));
        marca(p.images, this.t("Role_levelImages", "Level images (Pro)"));
        const f1 = fila(this.t("UI_GuideStyle", "Try a style:"));
        const tplActual = String(fs?.styleCard?.template?.value?.value ?? "default");
        ([["default", "Enum_style_template_Default", "Default"], ["clean", "Enum_style_template_Clean", "Clean"],
          ["outline", "Enum_style_template_Outline", "Outline"], ["contrast", "Enum_style_template_Contrast", "Contrast"],
          ["compact", "Enum_style_template_Compact", "Compact"], ["minimal", "Enum_style_template_Minimal", "Minimal"]] as [string, string, string][])
            .forEach(([v, k, d]) => boton(f1, this.t(k, d), tplActual === v, () => guardar("style", { template: v })));
        const f2 = fila(this.t("UI_GuideShow", "Show:"));
        const etiquetas = !!fs?.linkCard?.showLabels?.value;
        boton(f2, this.t("Prop_linkSettings_showLabels", "Link labels"), etiquetas, () => guardar("linkSettings", { showLabels: !etiquetas }));
        const cabeceras = !!fs?.layoutCard?.showLevelHeaders?.value;
        boton(f2, this.t("Prop_layoutSettings_showLevelHeaders", "Level headers"), cabeceras, () => guardar("layoutSettings", { showLevelHeaders: !cabeceras }));
        const vertical = this.direction === "vertical";
        boton(f2, this.t("Enum_layoutSettings_direction_Vertical", "Top to bottom"), vertical,
            () => guardar("layoutSettings", { direction: vertical ? "horizontal" : "vertical" }));
        const x = document.createElement("button");
        x.type = "button";
        x.className = "fc-g-close";
        x.textContent = "✕";
        x.title = this.t("UI_GuideClose", "Hide tips (Format → Style template)");
        x.setAttribute("aria-label", x.title);
        if (hc) x.style.color = fg;
        x.addEventListener("click", () => guardar("style", { guide: false }));
        g.appendChild(x);
        this.target.appendChild(g);
    }

    private injectStyles(): void {
        const ID = "fc-styles";
        if (document.getElementById(ID)) return;
        const st = document.createElement("style");
        st.id = ID;
        st.textContent = [
            ".flow-node{outline:none}",
            ".flow-node:focus-visible>rect{stroke:#005A9E;stroke-width:3px}",
            "@media (forced-colors: active){.flow-node:focus-visible>rect{stroke:Highlight}}",
            // Pantalla de inicio de la serie
            ".fc-landing{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:22px 28px;box-sizing:border-box;overflow:hidden;color:#605E5C;font-family:'Segoe UI',wf_segoe-ui_normal,helvetica,arial,sans-serif}",
            ".fc-landing .cl-head{display:flex;gap:12px;align-items:center}",
            ".fc-landing .cl-icon{width:44px;height:44px;border-radius:9px;flex-shrink:0}",
            ".fc-landing .cl-title{font-size:20px;font-weight:600;color:#252423}",
            ".fc-landing .cl-tag{font-size:14px;margin-top:2px}",
            ".fc-landing .cl-warn{margin:0;font-size:13px;color:#A4262C}",
            ".fc-landing .cl-cols{display:grid;grid-template-columns:1.2fr 1fr;gap:26px}",
            ".fc-landing .cl-lbl{font-size:10.5px;font-weight:600;letter-spacing:1.3px;text-transform:uppercase;color:#8A8886;margin-bottom:7px}",
            ".fc-landing .cl-steps{list-style:none;margin:0;padding:0;display:grid;gap:7px;font-size:13.5px}",
            ".fc-landing .cl-steps li{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start}",
            ".fc-landing .cl-n{display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#2B6CB0;color:#FFFFFF;font-size:10.5px}",
            ".fc-landing .cl-well{color:#252423}",
            ".fc-landing .cl-pro{display:flex;gap:8px;align-items:center;margin-top:12px;font-size:12.5px}",
            ".fc-landing .cl-chip{font-size:10px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:#E3F2E8;color:#2F7A47;flex-shrink:0}",
            ".fc-landing .cl-links{display:grid;gap:7px}",
            ".fc-landing .cl-card{display:flex;align-items:center;gap:9px;padding:7px 10px;border:1px solid #E1DFDD;border-radius:6px;background:#F7F6F3;color:#252423;text-decoration:none;font-size:13.5px;cursor:pointer}",
            ".fc-landing .cl-card:hover{border-color:#2B6CB0}",
            ".fc-landing .cl-card:focus-visible{border-color:#2B6CB0;outline:2px solid #005A9E;outline-offset:1px}",
            ".fc-landing .cl-sub{margin-left:auto;color:#8A8886;font-size:11px}",
            ".fc-landing .cl-a{color:#2B6CB0;font-weight:600;text-decoration:none;cursor:pointer;font-size:12px}",
            ".fc-landing .cl-a:hover,.fc-landing .cl-a:focus-visible{text-decoration:underline}",
            ".fc-landing .cl-do{margin:0;font-size:12px;line-height:1.45}",
            ".fc-landing-m{gap:11px;padding:14px 18px}",
            ".fc-landing-m .cl-icon{width:34px;height:34px}",
            ".fc-landing-m .cl-title{font-size:16px}",
            ".fc-landing-m .cl-tag,.fc-landing-m .cl-steps,.fc-landing-m .cl-card{font-size:12.5px}",
            ".fc-landing-m .cl-cols{grid-template-columns:1fr;gap:10px}",
            ".fc-landing-m .cl-links{grid-template-columns:1fr 1fr}",
            ".fc-landing-s{gap:8px;padding:10px 12px}",
            ".fc-landing-s .cl-icon{width:26px;height:26px;border-radius:6px}",
            ".fc-landing-s .cl-title{font-size:14px}",
            // Consejos de configuración
            ".fc-guide{position:absolute;left:8px;right:8px;bottom:8px;z-index:40;display:flex;flex-direction:column;gap:4px;padding:6px 30px 6px 8px;border:1px solid #2B6CB0;border-radius:8px;background:#FFFFFF;color:#252423;box-shadow:0 4px 14px rgba(0,0,0,.16);font:11.5px 'Segoe UI',sans-serif;cursor:default}",
            ".fc-guide .fc-g-row{display:flex;flex-wrap:wrap;align-items:center;gap:5px}",
            ".fc-guide .fc-g-lbl{font-weight:600;margin-right:2px}",
            ".fc-guide .fc-g-field{color:#605E5C;margin-right:6px}",
            ".fc-guide .fc-g-field.ok{color:#107C10}",
            ".fc-guide .fc-g-btn{border:1px solid;border-radius:999px;background:transparent;padding:2px 9px;font:inherit;cursor:pointer}",
            ".fc-guide .fc-g-close{position:absolute;top:4px;right:6px;border:none;background:transparent;cursor:pointer;color:#605E5C;font-size:12px}",
            ".fc-guide button:focus-visible{outline:2px solid #005A9E;outline-offset:1px}",
        ].join("\n");
        (document.head || this.target).appendChild(st);
    }

    // ── Formato desde el lienzo (on-object) ───────────────────────────────────

    /** Marca un elemento como formateable en el lienzo. Solo en modo formato: fuera de él no cambia nada. */
    private subSelectable(el: Element, objectName: string, displayName: string, type: powerbi.visuals.SubSelectionStylesType): void {
        if (!this.formatMode) return;
        el.classList.add(HtmlSubSelectableClass);
        el.setAttribute(SubSelectableObjectNameAttribute, objectName);
        el.setAttribute(SubSelectableDisplayNameAttribute, displayName);
        el.setAttribute(SubSelectableTypeAttribute, String(type));
    }

    private updateOutlines(options: VisualUpdateOptions): void {
        if (!this.formatMode) return;
        const subs = (options as unknown as { subSelections?: powerbi.visuals.CustomVisualSubSelection[] }).subSelections;
        this.subSelectionHelper.updateOutlinesFromSubSelections(subs ?? [], true);
    }

    private getSubSelectionStyles(subs: powerbi.visuals.CustomVisualSubSelection[]): powerbi.visuals.SubSelectionStyles | undefined {
        const name = subs[0]?.customVisualObjects[0]?.objectName;
        const ref = (objectName: string, propertyName: string, label: string) => ({ reference: { objectName, propertyName }, label });
        switch (name) {
            case "nodeSettings":
                return {
                    type: powerbi.visuals.SubSelectionStylesType.Text,
                    fontFamily: ref("nodeSettings", "fontFamily", this.t("Prop_nodeSettings_fontFamily", "Font family")),
                    fontSize: ref("nodeSettings", "fontSize", this.t("Prop_nodeSettings_fontSize", "Label size")),
                    fontColor: ref("nodeSettings", "textColor", this.t("Prop_nodeSettings_textColor", "Text color")),
                    background: ref("dataPoint", "defaultColor", this.t("Prop_dataPoint_defaultColor", "Default node color")),
                } as unknown as powerbi.visuals.SubSelectionStyles;
            case "linkSettings":
                return {
                    type: powerbi.visuals.SubSelectionStylesType.Shape,
                    stroke: ref("linkSettings", "color", this.t("Prop_linkSettings_color", "Link color")),
                } as unknown as powerbi.visuals.SubSelectionStyles;
            case "linkLabels":
            case "legendSettings":
            case "layoutSettings": {
                const [obj, size, color] = name === "linkLabels" ? ["linkSettings", "labelSize", "labelColor"]
                    : name === "legendSettings" ? ["legendSettings", "fontSize", "textColor"] : ["layoutSettings", "headerSize", "headerColor"];
                return {
                    type: powerbi.visuals.SubSelectionStylesType.Text,
                    fontSize: ref(obj, size, this.t(`Prop_${obj}_${size}`, "Size")),
                    fontColor: ref(obj, color, this.t(`Prop_${obj}_${color}`, "Color")),
                } as unknown as powerbi.visuals.SubSelectionStyles;
            }
        }
        return undefined;
    }

    private getSubSelectionShortcuts(subs: powerbi.visuals.CustomVisualSubSelection[]): powerbi.visuals.VisualSubSelectionShortcuts | undefined {
        const name = subs[0]?.customVisualObjects[0]?.objectName;
        const id = (objectName: string, propertyName: string) => ({ objectName, propertyName });
        const nav = (card: string, label: string) => ({ type: powerbi.visuals.VisualShortcutType.Navigate, destinationInfo: { cardUid: card + "-card" }, label });
        const toggle = (obj: string, prop: string, on: string, off: string) =>
            ({ type: powerbi.visuals.VisualShortcutType.Toggle, ...id(obj, prop), relatedToggledFormattingIds: [id(obj, prop)], enabledLabel: on, disabledLabel: off });
        let lista: unknown[] | undefined;
        switch (name) {
            case "nodeSettings":
                lista = [
                    { type: powerbi.visuals.VisualShortcutType.Picker, ...id("style", "template"), label: this.t("Obj_style", "Style template") },
                    toggle("nodeSettings", "showStepNumber", this.t("UI_HideStep", "Hide step number"), this.t("UI_ShowStep", "Show step number")),
                    toggle("nodeSettings", "showBadge", this.t("UI_HideBadge", "Hide value badge"), this.t("UI_ShowBadge", "Show value badge")),
                    { type: powerbi.visuals.VisualShortcutType.Divider },
                    { type: powerbi.visuals.VisualShortcutType.Reset, relatedResetFormattingIds: [id("nodeSettings", "fontFamily"), id("nodeSettings", "fontSize"), id("nodeSettings", "textColor"), id("dataPoint", "defaultColor")] },
                    nav("nodeSettings", this.t("Obj_nodeSettings", "Nodes")),
                ];
                break;
            case "linkSettings":
            case "linkLabels":
                lista = [
                    toggle("linkSettings", "showLabels", this.t("UI_HideLinkLabels", "Hide link labels"), this.t("UI_ShowLinkLabels", "Show link labels")),
                    { type: powerbi.visuals.VisualShortcutType.Picker, ...id("linkSettings", "labelContent"), label: this.t("Prop_linkSettings_labelContent", "Label shows") },
                    { type: powerbi.visuals.VisualShortcutType.Divider },
                    { type: powerbi.visuals.VisualShortcutType.Reset, relatedResetFormattingIds: [id("linkSettings", "color"), id("linkSettings", "labelSize"), id("linkSettings", "labelColor")] },
                    nav("linkSettings", this.t("Obj_linkSettings", "Links")),
                ];
                break;
            case "legendSettings":
                lista = [
                    { type: powerbi.visuals.VisualShortcutType.Picker, ...id("legendSettings", "position"), label: this.t("Prop_legendSettings_position", "Position") },
                    toggle("legendSettings", "show", this.t("UI_HideLegend", "Hide legend"), this.t("UI_ShowLegend", "Show legend")),
                    { type: powerbi.visuals.VisualShortcutType.Divider },
                    nav("legendSettings", this.t("Obj_legendSettings", "Legend")),
                ];
                break;
            case "layoutSettings":
                lista = [
                    { type: powerbi.visuals.VisualShortcutType.Picker, ...id("layoutSettings", "direction"), label: this.t("Prop_layoutSettings_direction", "Direction") },
                    toggle("layoutSettings", "showLevelHeaders", this.t("UI_HideHeaders", "Hide level headers"), this.t("UI_ShowHeaders", "Show level headers")),
                    { type: powerbi.visuals.VisualShortcutType.Divider },
                    nav("layoutSettings", this.t("Obj_layoutSettings", "Layout")),
                ];
                break;
        }
        return lista as unknown as powerbi.visuals.VisualSubSelectionShortcuts;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
