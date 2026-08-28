"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class DataPointCardSettings extends FormattingSettingsCard {
    defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayName: "Default node color",
        value: { value: "#6B7A99" }
    });

    colorByLevel = new formattingSettings.ToggleSwitch({
        name: "colorByLevel",
        displayName: "Color nodes by level",
        value: true
    });

    levelColor1 = new formattingSettings.ColorPicker({ name: "levelColor1", displayName: "Level 1 color", value: { value: "#2B6CB0" } });
    levelColor2 = new formattingSettings.ColorPicker({ name: "levelColor2", displayName: "Level 2 color", value: { value: "#3E9C5B" } });
    levelColor3 = new formattingSettings.ColorPicker({ name: "levelColor3", displayName: "Level 3 color", value: { value: "#D9A441" } });
    levelColor4 = new formattingSettings.ColorPicker({ name: "levelColor4", displayName: "Level 4 color", value: { value: "#8E5FC4" } });
    levelColor5 = new formattingSettings.ColorPicker({ name: "levelColor5", displayName: "Level 5 color", value: { value: "#C9524A" } });
    levelColor6 = new formattingSettings.ColorPicker({ name: "levelColor6", displayName: "Level 6 color", value: { value: "#0E9AA7" } });

    name: string = "dataPoint";
    displayName: string = "Data colors";
    slices: Array<FormattingSettingsSlice> = [
        this.defaultColor, this.colorByLevel,
        this.levelColor1, this.levelColor2, this.levelColor3, this.levelColor4, this.levelColor5, this.levelColor6
    ];
}

class NodeCardSettings extends FormattingSettingsCard {
    width = new formattingSettings.NumUpDown({
        name: "width",
        displayName: "Node width",
        value: 140
    });

    height = new formattingSettings.NumUpDown({
        name: "height",
        displayName: "Node height",
        value: 36
    });

    cornerRadius = new formattingSettings.NumUpDown({
        name: "cornerRadius",
        displayName: "Corner radius",
        value: 6
    });

    fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Font family",
        items: [
            { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" },
            { value: "Arial,sans-serif", displayName: "Arial" },
            { value: "Calibri,sans-serif", displayName: "Calibri" },
            { value: "Georgia,serif", displayName: "Georgia" },
            { value: "Consolas,monospace", displayName: "Consolas" }
        ],
        value: { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Label size",
        value: 12
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Text color",
        value: { value: "#FFFFFF" }
    });

    showBadge = new formattingSettings.ToggleSwitch({
        name: "showBadge",
        displayName: "Show value badge in chip",
        value: true
    });

    badgeFontFamily = new formattingSettings.ItemDropdown({
        name: "badgeFontFamily",
        displayName: "Badge font",
        items: [
            { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" },
            { value: "Arial,sans-serif", displayName: "Arial" },
            { value: "Calibri,sans-serif", displayName: "Calibri" },
            { value: "Georgia,serif", displayName: "Georgia" },
            { value: "Consolas,monospace", displayName: "Consolas" }
        ],
        value: { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" }
    });

    badgeFontSize = new formattingSettings.NumUpDown({
        name: "badgeFontSize",
        displayName: "Badge font size",
        value: 9
    });

    badgeTextColor = new formattingSettings.ColorPicker({
        name: "badgeTextColor",
        displayName: "Badge text color",
        value: { value: "#FFFFFF" }
    });

    badgeBackgroundColor = new formattingSettings.ColorPicker({
        name: "badgeBackgroundColor",
        displayName: "Badge background",
        value: { value: "#000000" }
    });

    badgeBackgroundOpacity = new formattingSettings.NumUpDown({
        name: "badgeBackgroundOpacity",
        displayName: "Badge background opacity %",
        value: 0
    });

    kpiUpColor = new formattingSettings.ColorPicker({
        name: "kpiUpColor",
        displayName: "KPI up color",
        value: { value: "#3E9C5B" }
    });

    kpiDownColor = new formattingSettings.ColorPicker({
        name: "kpiDownColor",
        displayName: "KPI down color",
        value: { value: "#C9524A" }
    });

    borderWidth = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Border width",
        value: 0
    });

    borderColor = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Border color",
        value: { value: "#FFFFFF" }
    });

    colorBorderByLevel = new formattingSettings.ToggleSwitch({
        name: "colorBorderByLevel",
        displayName: "Color border by level",
        value: false
    });

    showShadow = new formattingSettings.ToggleSwitch({
        name: "showShadow",
        displayName: "Show node shadow",
        value: false
    });

    shadowColor = new formattingSettings.ColorPicker({
        name: "shadowColor",
        displayName: "Shadow color",
        value: { value: "#000000" }
    });

    shadowBlur = new formattingSettings.NumUpDown({
        name: "shadowBlur",
        displayName: "Shadow blur",
        value: 4
    });

    shadowOffsetX = new formattingSettings.NumUpDown({
        name: "shadowOffsetX",
        displayName: "Shadow offset X",
        value: 0
    });

    shadowOffsetY = new formattingSettings.NumUpDown({
        name: "shadowOffsetY",
        displayName: "Shadow offset Y",
        value: 2
    });

    shadowOpacity = new formattingSettings.NumUpDown({
        name: "shadowOpacity",
        displayName: "Shadow opacity %",
        value: 35
    });

    imageSize = new formattingSettings.NumUpDown({
        name: "imageSize",
        displayName: "Image size",
        value: 24
    });

    name: string = "nodeSettings";
    displayName: string = "Nodes";
    slices: Array<FormattingSettingsSlice> = [
        this.width, this.height, this.cornerRadius,
        this.fontFamily, this.fontSize, this.textColor,
        this.showBadge, this.badgeFontFamily, this.badgeFontSize, this.badgeTextColor,
        this.badgeBackgroundColor, this.badgeBackgroundOpacity, this.kpiUpColor, this.kpiDownColor,
        this.borderWidth, this.borderColor, this.colorBorderByLevel, this.imageSize,
        this.showShadow, this.shadowColor, this.shadowBlur, this.shadowOffsetX, this.shadowOffsetY, this.shadowOpacity
    ];
}

class ValueFormatCardSettings extends FormattingSettingsCard {
    format = new formattingSettings.ItemDropdown({
        name: "format",
        displayName: "Number format",
        items: [
            { value: "plain", displayName: "Plain (1234)" },
            { value: "thousands", displayName: "Thousands (1,234)" },
            { value: "compact", displayName: "Compact (1.2K / 3.4M)" },
            { value: "percent", displayName: "Percent (12.3%)" }
        ],
        value: { value: "thousands", displayName: "Thousands (1,234)" }
    });

    decimals = new formattingSettings.NumUpDown({
        name: "decimals",
        displayName: "Decimal places",
        value: 0
    });

    prefix = new formattingSettings.TextInput({
        name: "prefix",
        displayName: "Prefix",
        value: "",
        placeholder: "e.g. $"
    });

    suffix = new formattingSettings.TextInput({
        name: "suffix",
        displayName: "Suffix",
        value: "",
        placeholder: "e.g. L"
    });

    name: string = "valueFormatSettings";
    displayName: string = "Value format";
    slices: Array<FormattingSettingsSlice> = [this.format, this.decimals, this.prefix, this.suffix];
}

class LinkCardSettings extends FormattingSettingsCard {
    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Link color",
        value: { value: "#B7C0D8" }
    });

    width = new formattingSettings.NumUpDown({
        name: "width",
        displayName: "Base link width",
        value: 2
    });

    curvature = new formattingSettings.NumUpDown({
        name: "curvature",
        displayName: "Curvature",
        value: 0.5
    });

    highlightDominant = new formattingSettings.ToggleSwitch({
        name: "highlightDominant",
        displayName: "Highlight dominant path",
        value: true
    });

    dominantEmphasis = new formattingSettings.NumUpDown({
        name: "dominantEmphasis",
        displayName: "Dominant path thickness x",
        value: 1.3
    });

    highlightTopVariant = new formattingSettings.ToggleSwitch({
        name: "highlightTopVariant",
        displayName: "Highlight top end-to-end variant",
        value: false
    });

    topVariantColor = new formattingSettings.ColorPicker({
        name: "topVariantColor",
        displayName: "Top variant color",
        value: { value: "#F5A623" }
    });

    name: string = "linkSettings";
    displayName: string = "Links";
    slices: Array<FormattingSettingsSlice> = [
        this.color, this.width, this.curvature, this.highlightDominant, this.dominantEmphasis,
        this.highlightTopVariant, this.topVariantColor
    ];
}

class SwimlaneCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show swimlane bands",
        value: true
    });

    labelSize = new formattingSettings.NumUpDown({
        name: "labelSize",
        displayName: "Label size",
        value: 11
    });

    fontFamily = new formattingSettings.ItemDropdown({
        name: "fontFamily",
        displayName: "Label font",
        items: [
            { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" },
            { value: "Arial,sans-serif", displayName: "Arial" },
            { value: "Calibri,sans-serif", displayName: "Calibri" },
            { value: "Georgia,serif", displayName: "Georgia" },
            { value: "Consolas,monospace", displayName: "Consolas" }
        ],
        value: { value: "'Segoe UI',sans-serif", displayName: "Segoe UI" }
    });

    textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Label color",
        value: { value: "#666666" }
    });

    bandColor1 = new formattingSettings.ColorPicker({ name: "bandColor1", displayName: "Band 1 color", value: { value: "#2B6CB0" } });
    bandColor2 = new formattingSettings.ColorPicker({ name: "bandColor2", displayName: "Band 2 color", value: { value: "#3E9C5B" } });
    bandColor3 = new formattingSettings.ColorPicker({ name: "bandColor3", displayName: "Band 3 color", value: { value: "#D9A441" } });
    bandColor4 = new formattingSettings.ColorPicker({ name: "bandColor4", displayName: "Band 4 color", value: { value: "#8E5FC4" } });

    bandOpacity = new formattingSettings.NumUpDown({
        name: "bandOpacity",
        displayName: "Band opacity %",
        value: 6
    });

    name: string = "swimlaneSettings";
    displayName: string = "Swimlanes";
    slices: Array<FormattingSettingsSlice> = [
        this.show, this.labelSize, this.fontFamily, this.textColor,
        this.bandColor1, this.bandColor2, this.bandColor3, this.bandColor4, this.bandOpacity
    ];
}

class LegendCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show legend",
        value: true
    });

    name: string = "legendSettings";
    displayName: string = "Legend";
    slices: Array<FormattingSettingsSlice> = [this.show];
}

class LayoutCardSettings extends FormattingSettingsCard {
    direction = new formattingSettings.ItemDropdown({
        name: "direction",
        displayName: "Direction",
        items: [
            { value: "horizontal", displayName: "Left to right" },
            { value: "vertical", displayName: "Top to bottom" }
        ],
        value: { value: "horizontal", displayName: "Left to right" }
    });

    nodeGap = new formattingSettings.NumUpDown({
        name: "nodeGap",
        displayName: "Spacing between nodes",
        value: 24
    });

    layerGap = new formattingSettings.NumUpDown({
        name: "layerGap",
        displayName: "Spacing between levels",
        value: 100
    });

    name: string = "layoutSettings";
    displayName: string = "Layout";
    slices: Array<FormattingSettingsSlice> = [this.direction, this.nodeGap, this.layerGap];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    dataPointCard = new DataPointCardSettings();
    nodeCard = new NodeCardSettings();
    valueFormatCard = new ValueFormatCardSettings();
    linkCard = new LinkCardSettings();
    layoutCard = new LayoutCardSettings();
    swimlaneCard = new SwimlaneCardSettings();
    legendCard = new LegendCardSettings();

    cards = [this.layoutCard, this.nodeCard, this.valueFormatCard, this.linkCard, this.swimlaneCard, this.legendCard, this.dataPointCard];
}
