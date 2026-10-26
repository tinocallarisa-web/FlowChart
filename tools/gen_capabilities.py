# -*- coding: utf-8 -*-
"""capabilities.json (objetos, roles y claves de traducción), tools/caps_en.json y src/i18n.ts desde una sola fuente.

Cada objeto y propiedad lleva displayName en inglés y displayNameKey; settings.ts conserva los mismos textos en inglés
y la traducción se aplica en tiempo de ejecución desde src/i18n.ts (Desktop solo traduce claves declaradas aquí).
Ejecutar desde la raíz:  python tools/gen_capabilities.py && python tools/extract_ui.py && python tools/i18n.py
"""
import io, json, os, re
from collections import OrderedDict as OD

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = [("'Segoe UI',sans-serif", "Segoe UI"), ("Arial,sans-serif", "Arial"), ("Calibri,sans-serif", "Calibri"),
         ("Georgia,serif", "Georgia"), ("Consolas,monospace", "Consolas")]
COLOR = {"fill": {"solid": {"color": True}}}
NUM = {"numeric": True}
BOOL = {"bool": True}
TEXT = {"text": True}
FSIZE = {"formatting": {"fontSize": True}}


def enum(items):
    return ("enum", items)


ROLES = [
    ("levels", "Grouping", "Levels (drag one field per level, in order)", "One field per step of the process, in order. Two levels at least."),
    ("levelImages", "Measure", "Level images (Pro)", "A Base64 image per level, already in your model."),
    ("value", "Measure", "Value", "Sizes the links. Without it, each row counts 1."),
    ("target", "Measure", "Target — KPI badge (Pro)", "Each node shows actual against target."),
    ("swimlane", "Grouping", "Swimlane (Pro)", "Bands by department, region or phase."),
    ("tooltips", "Measure", "Tooltip fields (Pro)", "Extra values in the tooltip."),
]

# objeto -> (título, [(propiedad, tipo, texto)])
OBJECTS = OD([
    ("general", (None, [("formatString", {"formatting": {"formatString": True}}, None)])),
    ("style", ("Style template", [
        ("template", enum([("default", "Default"), ("clean", "Clean"), ("outline", "Outline"), ("contrast", "Contrast"),
                           ("compact", "Compact"), ("minimal", "Minimal")]), "Template"),
        ("guide", BOOL, "Show setup tips"),
    ])),
    ("layoutSettings", ("Layout", [
        ("direction", enum([("horizontal", "Left to right"), ("vertical", "Top to bottom")]), "Direction"),
        ("nodeGap", NUM, "Spacing between nodes"),
        ("layerGap", NUM, "Spacing between levels"),
        ("fitOnLoad", BOOL, "Fit large diagrams to the visual"),
        ("showLevelHeaders", BOOL, "Level headers"),
        ("headerSize", NUM, "Header size"),
        ("headerColor", COLOR, "Header color"),
        ("fillBackground", BOOL, "Background"),
        ("backgroundColor", COLOR, "Background color"),
        ("showGrid", BOOL, "Background grid"),
        ("gridColor", COLOR, "Grid color"),
    ])),
    ("nodeSettings", ("Nodes", [
        ("width", NUM, "Node width"), ("height", NUM, "Node height"), ("cornerRadius", NUM, "Corner radius"),
        ("fontFamily", enum(FONTS), "Font family"), ("fontSize", FSIZE, "Label size"), ("textColor", COLOR, "Text color"),
        ("showStepNumber", BOOL, "Step number"),
        ("showBadge", BOOL, "Show value badge in chip"), ("badgeFontFamily", enum(FONTS), "Badge font"),
        ("badgeFontSize", NUM, "Badge font size"), ("badgeTextColor", COLOR, "Badge text color"),
        ("badgeBackgroundColor", COLOR, "Badge background"), ("badgeBackgroundOpacity", NUM, "Badge background opacity %"),
        ("kpiUpColor", COLOR, "KPI up color"), ("kpiDownColor", COLOR, "KPI down color"),
        ("borderWidth", NUM, "Border width"), ("borderColor", COLOR, "Border color"),
        ("colorBorderByLevel", BOOL, "Color border by level"), ("imageSize", NUM, "Image size"),
        ("imageBackground", BOOL, "Image background"), ("imageBackgroundColor", COLOR, "Image background color"),
        ("imageShape", enum([("rounded", "Rounded"), ("circle", "Circle"), ("square", "Square")]), "Image shape"),
        ("showShadow", BOOL, "Show node shadow"), ("shadowColor", COLOR, "Shadow color"), ("shadowBlur", NUM, "Shadow blur"),
        ("shadowOffsetX", NUM, "Shadow offset X"), ("shadowOffsetY", NUM, "Shadow offset Y"), ("shadowOpacity", NUM, "Shadow opacity %"),
    ])),
    ("valueFormatSettings", ("Value format", [
        ("format", enum([("model", "Model format"), ("thousands", "Thousands (1,234)"), ("compact", "Compact (1.2K / 3.4M)"),
                         ("plain", "Plain (1234)"), ("percent", "Percent (12.3%)")]), "Number format"),
        ("decimals", NUM, "Decimal places"), ("prefix", TEXT, "Prefix"), ("suffix", TEXT, "Suffix"),
    ])),
    ("linkSettings", ("Links", [
        ("color", COLOR, "Link color"), ("width", NUM, "Base link width"), ("curvature", NUM, "Curvature"),
        ("highlightDominant", BOOL, "Highlight dominant path"), ("dominantEmphasis", NUM, "Dominant path thickness x"),
        ("highlightTopVariant", BOOL, "Highlight top end-to-end variant"), ("topVariantColor", COLOR, "Top variant color"),
        ("showLabels", BOOL, "Link labels"),
        ("labelContent", enum([("value", "Value"), ("percent", "% of total"), ("both", "Value and %")]), "Label shows"),
        ("labelSize", NUM, "Label size"), ("labelColor", COLOR, "Label color"),
    ])),
    ("rules", ("Color rules (Pro)", [
        ("basis", enum([("value", "Node value"), ("share", "% of total"), ("variance", "% vs target")]), "Compare"),
        ("rule1On", BOOL, "Rule 1"), ("rule1Op", enum([("gt", "Greater than"), ("lt", "Less than")]), "Condition"),
        ("rule1Value", NUM, "Value"), ("rule1Color", COLOR, "Color"),
        ("rule2On", BOOL, "Rule 2"), ("rule2Op", enum([("gt", "Greater than"), ("lt", "Less than")]), "Condition"),
        ("rule2Value", NUM, "Value"), ("rule2Color", COLOR, "Color"),
        ("rule3On", BOOL, "Rule 3"), ("rule3Op", enum([("gt", "Greater than"), ("lt", "Less than")]), "Condition"),
        ("rule3Value", NUM, "Value"), ("rule3Color", COLOR, "Color"),
    ])),
    ("swimlaneSettings", ("Swimlanes", [
        ("show", BOOL, "Show swimlane bands"), ("labelSize", NUM, "Label size"), ("fontFamily", enum(FONTS), "Label font"),
        ("textColor", COLOR, "Label color"), ("bandColor1", COLOR, "Band 1 color"), ("bandColor2", COLOR, "Band 2 color"),
        ("bandColor3", COLOR, "Band 3 color"), ("bandColor4", COLOR, "Band 4 color"), ("bandOpacity", NUM, "Band opacity %"),
    ])),
    ("legendSettings", ("Legend", [
        ("show", BOOL, "Show legend"),
        ("position", enum([("bottomLeft", "Bottom left"), ("bottomRight", "Bottom right"), ("topRight", "Top right")]), "Position"),
        ("useFieldNames", BOOL, "Use field names"),
        ("fontSize", NUM, "Text size"), ("textColor", COLOR, "Text color"),
    ])),
    ("dataPoint", ("Data colors", [
        ("defaultColor", COLOR, "Default node color"), ("colorByLevel", BOOL, "Color nodes by level"),
    ] + [("levelColor%d" % i, COLOR, "Level %d color" % i) for i in range(1, 7)])),
])


def ident(s):
    return re.sub(r"[^A-Za-z0-9]", "", s[:1].upper() + s[1:])


def main():
    caps = json.load(io.open(os.path.join(ROOT, "capabilities.json"), encoding="utf-8"), object_pairs_hook=OD)
    en = OD()
    roles = []
    for name, kind, disp, desc in ROLES:
        k = "Role_" + name
        en[k] = disp
        en[k + "_Desc"] = desc
        roles.append(OD([("displayName", disp), ("displayNameKey", k), ("description", desc), ("descriptionKey", k + "_Desc"),
                         ("name", name), ("kind", kind)]))
    caps["dataRoles"] = roles
    objs = OD()
    i18n = OD()
    for obj, (title, props) in OBJECTS.items():
        o = OD()
        ok = "Obj_" + obj
        if title:
            o["displayName"], o["displayNameKey"] = title, ok
            en[ok] = title
        o["properties"] = OD()
        card = {"k": ok if title else None, "p": OD()}
        for prop, typ, disp in props:
            p = OD()
            pk = "Prop_%s_%s" % (obj, prop)
            if disp:
                p["displayName"], p["displayNameKey"] = disp, pk
                en[pk] = disp
            e = OD()
            if isinstance(typ, tuple):
                items = []
                for val, d in typ[1]:
                    ek = "Enum_%s_%s_%s" % (obj, prop, ident(val))
                    items.append(OD([("value", val), ("displayName", d), ("displayNameKey", ek)]))
                    en[ek] = d
                    e[val] = ek
                p["type"] = {"enumeration": items}
            else:
                p["type"] = typ
            o["properties"][prop] = p
            card["p"][prop] = {"k": pk if disp else None, "e": e}
        objs[obj] = o
        i18n[obj] = card
    caps["objects"] = objs
    caps["supportsOnObjectFormatting"] = True
    caps["enablePointerEventsFormatMode"] = True
    io.open(os.path.join(ROOT, "capabilities.json"), "w", encoding="utf-8", newline="\n").write(json.dumps(caps, indent=4, ensure_ascii=False) + "\n")
    io.open(os.path.join(ROOT, "tools", "caps_en.json"), "w", encoding="utf-8", newline="\n").write(json.dumps(en, indent=1, ensure_ascii=False) + "\n")
    ts = ["/**",
          " * Claves de traducción del panel de formato (objeto -> propiedad -> clave, y clave de cada opción).",
          " * Generado por tools/gen_capabilities.py: no editar a mano.",
          " */",
          "export interface I18nProp { k: string | null; e: Record<string, string>; }",
          "export interface I18nCard { k: string | null; p: Record<string, I18nProp>; }",
          "export const I18N: Record<string, I18nCard> = " + json.dumps(i18n, indent=4, ensure_ascii=False) + ";", ""]
    io.open(os.path.join(ROOT, "src", "i18n.ts"), "w", encoding="utf-8", newline="\n").write("\n".join(ts))
    print(len(en), "claves en inglés;", len(objs), "objetos")


if __name__ == "__main__":
    main()
