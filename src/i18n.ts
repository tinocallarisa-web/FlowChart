/**
 * Claves de traducción del panel de formato (objeto -> propiedad -> clave, y clave de cada opción).
 * Generado por tools/gen_capabilities.py: no editar a mano.
 */
export interface I18nProp { k: string | null; e: Record<string, string>; }
export interface I18nCard { k: string | null; p: Record<string, I18nProp>; }
export const I18N: Record<string, I18nCard> = {
    "general": {
        "k": null,
        "p": {
            "formatString": {
                "k": null,
                "e": {}
            }
        }
    },
    "style": {
        "k": "Obj_style",
        "p": {
            "template": {
                "k": "Prop_style_template",
                "e": {
                    "default": "Enum_style_template_Default",
                    "clean": "Enum_style_template_Clean",
                    "outline": "Enum_style_template_Outline",
                    "contrast": "Enum_style_template_Contrast",
                    "compact": "Enum_style_template_Compact",
                    "minimal": "Enum_style_template_Minimal"
                }
            },
            "guide": {
                "k": "Prop_style_guide",
                "e": {}
            }
        }
    },
    "layoutSettings": {
        "k": "Obj_layoutSettings",
        "p": {
            "direction": {
                "k": "Prop_layoutSettings_direction",
                "e": {
                    "horizontal": "Enum_layoutSettings_direction_Horizontal",
                    "vertical": "Enum_layoutSettings_direction_Vertical"
                }
            },
            "nodeGap": {
                "k": "Prop_layoutSettings_nodeGap",
                "e": {}
            },
            "layerGap": {
                "k": "Prop_layoutSettings_layerGap",
                "e": {}
            },
            "fitOnLoad": {
                "k": "Prop_layoutSettings_fitOnLoad",
                "e": {}
            },
            "showLevelHeaders": {
                "k": "Prop_layoutSettings_showLevelHeaders",
                "e": {}
            },
            "headerSize": {
                "k": "Prop_layoutSettings_headerSize",
                "e": {}
            },
            "headerColor": {
                "k": "Prop_layoutSettings_headerColor",
                "e": {}
            },
            "fillBackground": {
                "k": "Prop_layoutSettings_fillBackground",
                "e": {}
            },
            "backgroundColor": {
                "k": "Prop_layoutSettings_backgroundColor",
                "e": {}
            },
            "showGrid": {
                "k": "Prop_layoutSettings_showGrid",
                "e": {}
            },
            "gridColor": {
                "k": "Prop_layoutSettings_gridColor",
                "e": {}
            }
        }
    },
    "nodeSettings": {
        "k": "Obj_nodeSettings",
        "p": {
            "width": {
                "k": "Prop_nodeSettings_width",
                "e": {}
            },
            "height": {
                "k": "Prop_nodeSettings_height",
                "e": {}
            },
            "cornerRadius": {
                "k": "Prop_nodeSettings_cornerRadius",
                "e": {}
            },
            "fontFamily": {
                "k": "Prop_nodeSettings_fontFamily",
                "e": {
                    "'Segoe UI',sans-serif": "Enum_nodeSettings_fontFamily_SegoeUIsansserif",
                    "Arial,sans-serif": "Enum_nodeSettings_fontFamily_Arialsansserif",
                    "Calibri,sans-serif": "Enum_nodeSettings_fontFamily_Calibrisansserif",
                    "Georgia,serif": "Enum_nodeSettings_fontFamily_Georgiaserif",
                    "Consolas,monospace": "Enum_nodeSettings_fontFamily_Consolasmonospace"
                }
            },
            "fontSize": {
                "k": "Prop_nodeSettings_fontSize",
                "e": {}
            },
            "textColor": {
                "k": "Prop_nodeSettings_textColor",
                "e": {}
            },
            "showStepNumber": {
                "k": "Prop_nodeSettings_showStepNumber",
                "e": {}
            },
            "showBadge": {
                "k": "Prop_nodeSettings_showBadge",
                "e": {}
            },
            "badgeFontFamily": {
                "k": "Prop_nodeSettings_badgeFontFamily",
                "e": {
                    "'Segoe UI',sans-serif": "Enum_nodeSettings_badgeFontFamily_SegoeUIsansserif",
                    "Arial,sans-serif": "Enum_nodeSettings_badgeFontFamily_Arialsansserif",
                    "Calibri,sans-serif": "Enum_nodeSettings_badgeFontFamily_Calibrisansserif",
                    "Georgia,serif": "Enum_nodeSettings_badgeFontFamily_Georgiaserif",
                    "Consolas,monospace": "Enum_nodeSettings_badgeFontFamily_Consolasmonospace"
                }
            },
            "badgeFontSize": {
                "k": "Prop_nodeSettings_badgeFontSize",
                "e": {}
            },
            "badgeTextColor": {
                "k": "Prop_nodeSettings_badgeTextColor",
                "e": {}
            },
            "badgeBackgroundColor": {
                "k": "Prop_nodeSettings_badgeBackgroundColor",
                "e": {}
            },
            "badgeBackgroundOpacity": {
                "k": "Prop_nodeSettings_badgeBackgroundOpacity",
                "e": {}
            },
            "kpiUpColor": {
                "k": "Prop_nodeSettings_kpiUpColor",
                "e": {}
            },
            "kpiDownColor": {
                "k": "Prop_nodeSettings_kpiDownColor",
                "e": {}
            },
            "borderWidth": {
                "k": "Prop_nodeSettings_borderWidth",
                "e": {}
            },
            "borderColor": {
                "k": "Prop_nodeSettings_borderColor",
                "e": {}
            },
            "colorBorderByLevel": {
                "k": "Prop_nodeSettings_colorBorderByLevel",
                "e": {}
            },
            "imageSize": {
                "k": "Prop_nodeSettings_imageSize",
                "e": {}
            },
            "imageBackground": {
                "k": "Prop_nodeSettings_imageBackground",
                "e": {}
            },
            "imageBackgroundColor": {
                "k": "Prop_nodeSettings_imageBackgroundColor",
                "e": {}
            },
            "imageShape": {
                "k": "Prop_nodeSettings_imageShape",
                "e": {
                    "rounded": "Enum_nodeSettings_imageShape_Rounded",
                    "circle": "Enum_nodeSettings_imageShape_Circle",
                    "square": "Enum_nodeSettings_imageShape_Square"
                }
            },
            "showShadow": {
                "k": "Prop_nodeSettings_showShadow",
                "e": {}
            },
            "shadowColor": {
                "k": "Prop_nodeSettings_shadowColor",
                "e": {}
            },
            "shadowBlur": {
                "k": "Prop_nodeSettings_shadowBlur",
                "e": {}
            },
            "shadowOffsetX": {
                "k": "Prop_nodeSettings_shadowOffsetX",
                "e": {}
            },
            "shadowOffsetY": {
                "k": "Prop_nodeSettings_shadowOffsetY",
                "e": {}
            },
            "shadowOpacity": {
                "k": "Prop_nodeSettings_shadowOpacity",
                "e": {}
            }
        }
    },
    "valueFormatSettings": {
        "k": "Obj_valueFormatSettings",
        "p": {
            "format": {
                "k": "Prop_valueFormatSettings_format",
                "e": {
                    "model": "Enum_valueFormatSettings_format_Model",
                    "thousands": "Enum_valueFormatSettings_format_Thousands",
                    "compact": "Enum_valueFormatSettings_format_Compact",
                    "plain": "Enum_valueFormatSettings_format_Plain",
                    "percent": "Enum_valueFormatSettings_format_Percent"
                }
            },
            "decimals": {
                "k": "Prop_valueFormatSettings_decimals",
                "e": {}
            },
            "prefix": {
                "k": "Prop_valueFormatSettings_prefix",
                "e": {}
            },
            "suffix": {
                "k": "Prop_valueFormatSettings_suffix",
                "e": {}
            }
        }
    },
    "linkSettings": {
        "k": "Obj_linkSettings",
        "p": {
            "color": {
                "k": "Prop_linkSettings_color",
                "e": {}
            },
            "width": {
                "k": "Prop_linkSettings_width",
                "e": {}
            },
            "curvature": {
                "k": "Prop_linkSettings_curvature",
                "e": {}
            },
            "highlightDominant": {
                "k": "Prop_linkSettings_highlightDominant",
                "e": {}
            },
            "dominantEmphasis": {
                "k": "Prop_linkSettings_dominantEmphasis",
                "e": {}
            },
            "highlightTopVariant": {
                "k": "Prop_linkSettings_highlightTopVariant",
                "e": {}
            },
            "topVariantColor": {
                "k": "Prop_linkSettings_topVariantColor",
                "e": {}
            },
            "showLabels": {
                "k": "Prop_linkSettings_showLabels",
                "e": {}
            },
            "labelContent": {
                "k": "Prop_linkSettings_labelContent",
                "e": {
                    "value": "Enum_linkSettings_labelContent_Value",
                    "percent": "Enum_linkSettings_labelContent_Percent",
                    "both": "Enum_linkSettings_labelContent_Both"
                }
            },
            "labelSize": {
                "k": "Prop_linkSettings_labelSize",
                "e": {}
            },
            "labelColor": {
                "k": "Prop_linkSettings_labelColor",
                "e": {}
            }
        }
    },
    "rules": {
        "k": "Obj_rules",
        "p": {
            "basis": {
                "k": "Prop_rules_basis",
                "e": {
                    "value": "Enum_rules_basis_Value",
                    "share": "Enum_rules_basis_Share",
                    "variance": "Enum_rules_basis_Variance"
                }
            },
            "rule1On": {
                "k": "Prop_rules_rule1On",
                "e": {}
            },
            "rule1Op": {
                "k": "Prop_rules_rule1Op",
                "e": {
                    "gt": "Enum_rules_rule1Op_Gt",
                    "lt": "Enum_rules_rule1Op_Lt"
                }
            },
            "rule1Value": {
                "k": "Prop_rules_rule1Value",
                "e": {}
            },
            "rule1Color": {
                "k": "Prop_rules_rule1Color",
                "e": {}
            },
            "rule2On": {
                "k": "Prop_rules_rule2On",
                "e": {}
            },
            "rule2Op": {
                "k": "Prop_rules_rule2Op",
                "e": {
                    "gt": "Enum_rules_rule2Op_Gt",
                    "lt": "Enum_rules_rule2Op_Lt"
                }
            },
            "rule2Value": {
                "k": "Prop_rules_rule2Value",
                "e": {}
            },
            "rule2Color": {
                "k": "Prop_rules_rule2Color",
                "e": {}
            },
            "rule3On": {
                "k": "Prop_rules_rule3On",
                "e": {}
            },
            "rule3Op": {
                "k": "Prop_rules_rule3Op",
                "e": {
                    "gt": "Enum_rules_rule3Op_Gt",
                    "lt": "Enum_rules_rule3Op_Lt"
                }
            },
            "rule3Value": {
                "k": "Prop_rules_rule3Value",
                "e": {}
            },
            "rule3Color": {
                "k": "Prop_rules_rule3Color",
                "e": {}
            }
        }
    },
    "swimlaneSettings": {
        "k": "Obj_swimlaneSettings",
        "p": {
            "show": {
                "k": "Prop_swimlaneSettings_show",
                "e": {}
            },
            "labelSize": {
                "k": "Prop_swimlaneSettings_labelSize",
                "e": {}
            },
            "fontFamily": {
                "k": "Prop_swimlaneSettings_fontFamily",
                "e": {
                    "'Segoe UI',sans-serif": "Enum_swimlaneSettings_fontFamily_SegoeUIsansserif",
                    "Arial,sans-serif": "Enum_swimlaneSettings_fontFamily_Arialsansserif",
                    "Calibri,sans-serif": "Enum_swimlaneSettings_fontFamily_Calibrisansserif",
                    "Georgia,serif": "Enum_swimlaneSettings_fontFamily_Georgiaserif",
                    "Consolas,monospace": "Enum_swimlaneSettings_fontFamily_Consolasmonospace"
                }
            },
            "textColor": {
                "k": "Prop_swimlaneSettings_textColor",
                "e": {}
            },
            "bandColor1": {
                "k": "Prop_swimlaneSettings_bandColor1",
                "e": {}
            },
            "bandColor2": {
                "k": "Prop_swimlaneSettings_bandColor2",
                "e": {}
            },
            "bandColor3": {
                "k": "Prop_swimlaneSettings_bandColor3",
                "e": {}
            },
            "bandColor4": {
                "k": "Prop_swimlaneSettings_bandColor4",
                "e": {}
            },
            "bandOpacity": {
                "k": "Prop_swimlaneSettings_bandOpacity",
                "e": {}
            }
        }
    },
    "legendSettings": {
        "k": "Obj_legendSettings",
        "p": {
            "show": {
                "k": "Prop_legendSettings_show",
                "e": {}
            },
            "position": {
                "k": "Prop_legendSettings_position",
                "e": {
                    "bottomLeft": "Enum_legendSettings_position_BottomLeft",
                    "bottomRight": "Enum_legendSettings_position_BottomRight",
                    "topRight": "Enum_legendSettings_position_TopRight"
                }
            },
            "useFieldNames": {
                "k": "Prop_legendSettings_useFieldNames",
                "e": {}
            },
            "fontSize": {
                "k": "Prop_legendSettings_fontSize",
                "e": {}
            },
            "textColor": {
                "k": "Prop_legendSettings_textColor",
                "e": {}
            }
        }
    },
    "dataPoint": {
        "k": "Obj_dataPoint",
        "p": {
            "defaultColor": {
                "k": "Prop_dataPoint_defaultColor",
                "e": {}
            },
            "colorByLevel": {
                "k": "Prop_dataPoint_colorByLevel",
                "e": {}
            },
            "levelColor1": {
                "k": "Prop_dataPoint_levelColor1",
                "e": {}
            },
            "levelColor2": {
                "k": "Prop_dataPoint_levelColor2",
                "e": {}
            },
            "levelColor3": {
                "k": "Prop_dataPoint_levelColor3",
                "e": {}
            },
            "levelColor4": {
                "k": "Prop_dataPoint_levelColor4",
                "e": {}
            },
            "levelColor5": {
                "k": "Prop_dataPoint_levelColor5",
                "e": {}
            },
            "levelColor6": {
                "k": "Prop_dataPoint_levelColor6",
                "e": {}
            }
        }
    }
};
