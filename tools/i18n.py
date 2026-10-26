# -*- coding: utf-8 -*-
"""stringResources (12 idiomas) y src/strings.ts desde tools/caps_en.json + tools/ui_en.json + tools/traducciones.json.

Las traducciones van por TEXTO inglés, no por clave. Orden de cada fila: es, pt (BR y PT), fr, de, it, nl, pl, ja, zh, ko.
Ejecutar desde la raíz:  python tools/gen_capabilities.py && python tools/extract_ui.py && python tools/i18n.py
"""
import io, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = ["es-ES", "pt-BR", "fr-FR", "de-DE", "it-IT", "nl-NL", "pl-PL", "ja-JP", "zh-CN", "ko-KR"]


def cargar(nombre):
    return json.load(io.open(os.path.join(ROOT, "tools", nombre), encoding="utf-8"))


def main():
    caps, ui, T = cargar("caps_en.json"), cargar("ui_en.json"), cargar("traducciones.json")
    todo = dict(caps)
    todo.update(ui)
    faltan = sorted({v for v in todo.values() if v not in T})
    if faltan:
        sys.exit("Sin traducción (%d): %s" % (len(faltan), " | ".join(faltan[:10])))
    por_idioma = {"en-US": dict(todo)}
    for i, lang in enumerate(L):
        por_idioma[lang] = {k: T[v][i] for k, v in todo.items()}
    por_idioma["pt-PT"] = dict(por_idioma["pt-BR"])
    for lang, d in por_idioma.items():
        carpeta = os.path.join(ROOT, "stringResources", lang)
        os.makedirs(carpeta, exist_ok=True)
        # resources.resjson: solo las claves de capabilities (es lo que lee Power BI para el panel)
        res = {k: d[k] for k in caps}
        io.open(os.path.join(carpeta, "resources.resjson"), "w", encoding="utf-8", newline="\n").write(
            json.dumps(res, indent=2, ensure_ascii=False, sort_keys=True) + "\n")
    # strings.ts: todo (capabilities y textos propios), porque Desktop no traduce lo que no está en capabilities
    tabla = {lang: d for lang, d in por_idioma.items() if lang != "en-US"}
    ts = ("// Textos del visual por idioma. Generado por tools/i18n.py: no editar a mano.\n"
          "// Desktop solo traduce con getDisplayName las claves de capabilities; el resto viaja en el bundle.\n"
          "export const STRINGS: Record<string, Record<string, string>> = "
          + json.dumps(tabla, ensure_ascii=False, indent=1, sort_keys=True) + ";\n")
    io.open(os.path.join(ROOT, "src", "strings.ts"), "w", encoding="utf-8", newline="\n").write(ts)
    print("%d claves, %d idiomas" % (len(todo), len(por_idioma)))


if __name__ == "__main__":
    main()
