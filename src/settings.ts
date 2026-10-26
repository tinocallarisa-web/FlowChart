"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// Los textos van en inglés; la traducción la aplica Visual.localizeModel() con las claves de src/i18n.ts
// (generadas desde tools/gen_capabilities.py, que es la fuente de capabilities.json).

const FONTS = [
    { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" },
    { value: "Arial,sans-serif", displayName: "Arial" },
    { value: "Calibri,sans-serif", displayName: "Calibri" },
    { value: "Georgia,serif", displayName: "Georgia" },
    { value: "Consolas,monospace", displayName: "Consolas" }
];
const color = (name: string, displayName: string, value: string) =>
    new formattingSettings.ColorPicker({ name, displayName, value: { value } });
const num = (name: string, displayName: string, value: number) =>
    new formattingSettings.NumUpDown({ name, displayName, value });
const toggle = (name: string, displayName: string, value: boolean) =>
    new formattingSettings.ToggleSwitch({ name, displayName, value });
const pick = (name: string, displayName: string, items: { value: string; displayName: string }[], value = 0) =>
    new formattingSettings.ItemDropdown({ name, displayName, items, value: items[value] });

export const TEMPLATES = [
    { value: "default", displayName: "Default" },
    { value: "clean", displayName: "Clean" },
    { value: "outline", displayName: "Outline" },
    { value: "contrast", displayName: "Contrast" },
    { value: "compact", displayName: "Compact" },
    { value: "minimal", displayName: "Minimal" }
];

class StyleCardSettings extends FormattingSettingsCard {
    template = pick("template", "Template", TEMPLATES);
    guide = toggle("guide", "Show setup tips", true);
    name: string = "style";
    displayName: string = "Style template";
    slices: Array<FormattingSettingsSlice> = [this.template, this.guide];
}

class DataPointCardSettings extends FormattingSettingsCard {
    defaultColor = color("defaultColor", "Default node color", "#6B7A99");
    colorByLevel = toggle("colorByLevel", "Color nodes by level", true);
    levelColor1 = color("levelColor1", "Level 1 color", "#2B6CB0");
    levelColor2 = color("levelColor2", "Level 2 color", "#3E9C5B");
    levelColor3 = color("levelColor3", "Level 3 color", "#D9A441");
    levelColor4 = color("levelColor4", "Level 4 color", "#8E5FC4");
    levelColor5 = color("levelColor5", "Level 5 color", "#C9524A");
    levelColor6 = color("levelColor6", "Level 6 color", "#0E9AA7");

    name: string = "dataPoint";
    displayName: string = "Data colors";
    slices: Array<FormattingSettingsSlice> = [
        this.defaultColor, this.colorByLevel,
        this.levelColor1, this.levelColor2, this.levelColor3, this.levelColor4, this.levelColor5, this.levelColor6
    ];
}

class NodeCardSettings extends FormattingSettingsCard {
    width = num("width", "Node width", 140);
    height = num("height", "Node height", 36);
    cornerRadius = num("cornerRadius", "Corner radius", 6);
    fontFamily = pick("fontFamily", "Font family", FONTS);
    fontSize = num("fontSize", "Label size", 12);
    textColor = color("textColor", "Text color", "#FFFFFF");
    showStepNumber = toggle("showStepNumber", "Step number", true);
    showBadge = toggle("showBadge", "Show value badge in chip", true);
    badgeFontFamily = pick("badgeFontFamily", "Badge font", FONTS);
    badgeFontSize = num("badgeFontSize", "Badge font size", 9);
    badgeTextColor = color("badgeTextColor", "Badge text color", "#FFFFFF");
    badgeBackgroundColor = color("badgeBackgroundColor", "Badge background", "#000000");
    badgeBackgroundOpacity = num("badgeBackgroundOpacity", "Badge background opacity %", 0);
    kpiUpColor = color("kpiUpColor", "KPI up color", "#3E9C5B");
    kpiDownColor = color("kpiDownColor", "KPI down color", "#C9524A");
    borderWidth = num("borderWidth", "Border width", 0);
    borderColor = color("borderColor", "Border color", "#FFFFFF");
    colorBorderByLevel = toggle("colorBorderByLevel", "Color border by level", false);
    showShadow = toggle("showShadow", "Show node shadow", false);
    shadowColor = color("shadowColor", "Shadow color", "#000000");
    shadowBlur = num("shadowBlur", "Shadow blur", 4);
    shadowOffsetX = num("shadowOffsetX", "Shadow offset X", 0);
    shadowOffsetY = num("shadowOffsetY", "Shadow offset Y", 2);
    shadowOpacity = num("shadowOpacity", "Shadow opacity %", 35);
    imageSize = num("imageSize", "Image size", 24);
    imageBackground = toggle("imageBackground", "Image background", false);
    imageBackgroundColor = color("imageBackgroundColor", "Image background color", "#FFFFFF");
    imageShape = pick("imageShape", "Image shape", [
        { value: "rounded", displayName: "Rounded" },
        { value: "circle", displayName: "Circle" },
        { value: "square", displayName: "Square" }
    ]);

    name: string = "nodeSettings";
    displayName: string = "Nodes";
    slices: Array<FormattingSettingsSlice> = [
        this.width, this.height, this.cornerRadius,
        this.fontFamily, this.fontSize, this.textColor, this.showStepNumber,
        this.showBadge, this.badgeFontFamily, this.badgeFontSize, this.badgeTextColor,
        this.badgeBackgroundColor, this.badgeBackgroundOpacity, this.kpiUpColor, this.kpiDownColor,
        this.borderWidth, this.borderColor, this.colorBorderByLevel,
        this.imageSize, this.imageBackground, this.imageBackgroundColor, this.imageShape,
        this.showShadow, this.shadowColor, this.shadowBlur, this.shadowOffsetX, this.shadowOffsetY, this.shadowOpacity
    ];
}

class ValueFormatCardSettings extends FormattingSettingsCard {
    // "model" (el formato de la medida, también el dinámico) es el valor por defecto desde 1.2.0.0.
    format = pick("format", "Number format", [
        { value: "model", displayName: "Model format" },
        { value: "thousands", displayName: "Thousands (1,234)" },
        { value: "compact", displayName: "Compact (1.2K / 3.4M)" },
        { value: "plain", displayName: "Plain (1234)" },
        { value: "percent", displayName: "Percent (12.3%)" }
    ]);
    decimals = num("decimals", "Decimal places", 0);
    prefix = new formattingSettings.TextInput({ name: "prefix", displayName: "Prefix", value: "", placeholder: "e.g. $" });
    suffix = new formattingSettings.TextInput({ name: "suffix", displayName: "Suffix", value: "", placeholder: "e.g. L" });

    name: string = "valueFormatSettings";
    displayName: string = "Value format";
    slices: Array<FormattingSettingsSlice> = [this.format, this.decimals, this.prefix, this.suffix];
}

class LinkCardSettings extends FormattingSettingsCard {
    color = color("color", "Link color", "#B7C0D8");
    width = num("width", "Base link width", 2);
    curvature = num("curvature", "Curvature", 0.5);
    highlightDominant = toggle("highlightDominant", "Highlight dominant path", true);
    dominantEmphasis = num("dominantEmphasis", "Dominant path thickness x", 1.3);
    highlightTopVariant = toggle("highlightTopVariant", "Highlight top end-to-end variant", false);
    topVariantColor = color("topVariantColor", "Top variant color", "#F5A623");
    showLabels = toggle("showLabels", "Link labels", false);
    labelContent = pick("labelContent", "Label shows", [
        { value: "value", displayName: "Value" },
        { value: "percent", displayName: "% of total" },
        { value: "both", displayName: "Value and %" }
    ]);
    labelSize = num("labelSize", "Label size", 9);
    labelColor = color("labelColor", "Label color", "#4C566A");

    name: string = "linkSettings";
    displayName: string = "Links";
    slices: Array<FormattingSettingsSlice> = [
        this.color, this.width, this.curvature, this.highlightDominant, this.dominantEmphasis,
        this.highlightTopVariant, this.topVariantColor,
        this.showLabels, this.labelContent, this.labelSize, this.labelColor
    ];
}

const OPS = [{ value: "gt", displayName: "Greater than" }, { value: "lt", displayName: "Less than" }];

class RulesCardSettings extends FormattingSettingsCard {
    basis = pick("basis", "Compare", [
        { value: "value", displayName: "Node value" },
        { value: "share", displayName: "% of total" },
        { value: "variance", displayName: "% vs target" }
    ]);
    rule1On = toggle("rule1On", "Rule 1", false);
    rule1Op = pick("rule1Op", "Condition", OPS);
    rule1Value = num("rule1Value", "Value", 0);
    rule1Color = color("rule1Color", "Color", "#C9524A");
    rule2On = toggle("rule2On", "Rule 2", false);
    rule2Op = pick("rule2Op", "Condition", OPS, 1);
    rule2Value = num("rule2Value", "Value", 0);
    rule2Color = color("rule2Color", "Color", "#3E9C5B");
    rule3On = toggle("rule3On", "Rule 3", false);
    rule3Op = pick("rule3Op", "Condition", OPS);
    rule3Value = num("rule3Value", "Value", 0);
    rule3Color = color("rule3Color", "Color", "#D9A441");

    name: string = "rules";
    displayName: string = "Color rules (Pro)";
    slices: Array<FormattingSettingsSlice> = [
        this.basis,
        this.rule1On, this.rule1Op, this.rule1Value, this.rule1Color,
        this.rule2On, this.rule2Op, this.rule2Value, this.rule2Color,
        this.rule3On, this.rule3Op, this.rule3Value, this.rule3Color
    ];
}

class SwimlaneCardSettings extends FormattingSettingsCard {
    show = toggle("show", "Show swimlane bands", true);
    labelSize = num("labelSize", "Label size", 11);
    fontFamily = pick("fontFamily", "Label font", FONTS);
    textColor = color("textColor", "Label color", "#666666");
    bandColor1 = color("bandColor1", "Band 1 color", "#2B6CB0");
    bandColor2 = color("bandColor2", "Band 2 color", "#3E9C5B");
    bandColor3 = color("bandColor3", "Band 3 color", "#D9A441");
    bandColor4 = color("bandColor4", "Band 4 color", "#8E5FC4");
    bandOpacity = num("bandOpacity", "Band opacity %", 6);

    name: string = "swimlaneSettings";
    displayName: string = "Swimlanes";
    slices: Array<FormattingSettingsSlice> = [
        this.show, this.labelSize, this.fontFamily, this.textColor,
        this.bandColor1, this.bandColor2, this.bandColor3, this.bandColor4, this.bandOpacity
    ];
}

class LegendCardSettings extends FormattingSettingsCard {
    show = toggle("show", "Show legend", true);
    position = pick("position", "Position", [
        { value: "bottomLeft", displayName: "Bottom left" },
        { value: "bottomRight", displayName: "Bottom right" },
        { value: "topRight", displayName: "Top right" }
    ]);
    useFieldNames = toggle("useFieldNames", "Use field names", true);
    fontSize = num("fontSize", "Text size", 11);
    textColor = color("textColor", "Text color", "#333333");

    name: string = "legendSettings";
    displayName: string = "Legend";
    slices: Array<FormattingSettingsSlice> = [this.show, this.position, this.useFieldNames, this.fontSize, this.textColor];
}

class LayoutCardSettings extends FormattingSettingsCard {
    direction = pick("direction", "Direction", [
        { value: "horizontal", displayName: "Left to right" },
        { value: "vertical", displayName: "Top to bottom" }
    ]);
    nodeGap = num("nodeGap", "Spacing between nodes", 24);
    layerGap = num("layerGap", "Spacing between levels", 100);
    fitOnLoad = toggle("fitOnLoad", "Fit large diagrams to the visual", true);
    showToolbar = toggle("showToolbar", "Toolbar", true);
    showZoomButtons = toggle("showZoomButtons", "Zoom buttons", true);
    toolbarSize = num("toolbarSize", "Toolbar size", 12);
    showMinimap = toggle("showMinimap", "Minimap", true);
    showLevelHeaders = toggle("showLevelHeaders", "Level headers", false);
    headerSize = num("headerSize", "Header size", 11);
    headerColor = color("headerColor", "Header color", "#4C566A");
    fillBackground = toggle("fillBackground", "Background", false);
    backgroundColor = color("backgroundColor", "Background color", "#FFFFFF");
    showGrid = toggle("showGrid", "Background grid", false);
    gridColor = color("gridColor", "Grid color", "#E5E9F0");

    name: string = "layoutSettings";
    displayName: string = "Layout";
    slices: Array<FormattingSettingsSlice> = [
        this.direction, this.nodeGap, this.layerGap, this.fitOnLoad, this.showToolbar, this.showZoomButtons, this.toolbarSize, this.showMinimap,
        this.showLevelHeaders, this.headerSize, this.headerColor, this.fillBackground, this.backgroundColor,
        this.showGrid, this.gridColor
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    styleCard = new StyleCardSettings();
    dataPointCard = new DataPointCardSettings();
    nodeCard = new NodeCardSettings();
    valueFormatCard = new ValueFormatCardSettings();
    linkCard = new LinkCardSettings();
    rulesCard = new RulesCardSettings();
    layoutCard = new LayoutCardSettings();
    swimlaneCard = new SwimlaneCardSettings();
    legendCard = new LegendCardSettings();

    cards = [this.styleCard, this.layoutCard, this.nodeCard, this.valueFormatCard, this.linkCard, this.rulesCard,
             this.swimlaneCard, this.legendCard, this.dataPointCard];
}
