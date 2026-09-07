# Reenvío de Flow Chart 1.0.2.0 — pasos de terminal

Todo lo que se podía escribir ya está escrito. Esto es lo que queda, en orden.
Ejecutar desde `C:\tcviz\dev\Flow Chart\flowChart`.

---

## 0. Copiar los ficheros generados al repo

| Fichero generado | Destino en el repo |
|---|---|
| `support.html` | raíz — sobrescribe |
| `privacy.html` | raíz — sobrescribe |
| `terms.html` | raíz — sobrescribe |
| `changelog.html` | raíz — nuevo |
| `CHANGELOG.md` | raíz — sobrescribe |
| `README.md` | raíz — sobrescribe |
| `docs/CERTIFICATION-NOTES.md` | `docs/` — sobrescribe |
| `tools/build-changelog.mjs` | `tools/` — nuevo |
| `tools/changelog.template.html` | `tools/` — nuevo |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | nuevo |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | nuevo |
| `.github/ISSUE_TEMPLATE/config.yml` | nuevo |

Las páginas van a la **raíz**, no a `docs/`. Las URLs de `pbiviz.json` y de la oferta
apuntan ahí y moverlas rompería enlaces vivos.

---

## 1. Subir la versión en `pbiviz.json`

Partner Center no reutiliza un número ya enviado, aunque el envío fuera rechazado.
1.0.1.0 está quemado. Edita `pbiviz.json`:

```json
"version": "1.0.2.0"
```

Cuatro dígitos. El `guid` no se toca.

La fecha del `CHANGELOG.md` está puesta a `2026-09-07`; ajústala si compilas otro día.

---

## 2. Versión de npm

```powershell
npm version 1.0.2 --no-git-tag-version
```

Tres dígitos en `package.json`, cuatro en `pbiviz.json`. Un cuarto dígito en
`package.json` rompe `npm install` con *"Invalid Version"* sin decir por qué.

---

## 3. Regenerar el changelog publicado y validar

```powershell
node tools/build-changelog.mjs
node tools/build-changelog.mjs --check
```

El `--check` debe salir en verde. Si dice *version mismatch*, falta la entrada de
1.0.2.0 en `CHANGELOG.md` — arréglalo antes de seguir.

---

## 4. Limpiar la rama local muerta

```powershell
git branch -D certification
```

Está parada en `ccc3efe` (v1.0.0.0). Las remotas ya están bien; esta solo es una
mina esperando a que alguien la empuje.

---

## 5. Commit y push

```powershell
git add -A
git status --short
git commit -m "docs: rewrite support/privacy/terms, add generated changelog, issue templates

- author email to support@tcviz.com
- package.json version to 1.0.1
- changelog.html generated from CHANGELOG.md by tools/build-changelog.mjs"
git push origin main
```

Revisa el `git status --short` antes de commitear: debe salir `pbiviz.json`
modificado más los ficheros nuevos, y nada de `dist/`, `.tmp/` ni `node_modules/`.

---

## 6. Verificar las páginas publicadas

Espera un minuto a que GitHub Pages despliegue y **pide las URLs**, no las deduzcas:

```powershell
"support","privacy","terms","changelog" | % {
  $u = "https://tinocallarisa-web.github.io/FlowChart/$_.html"
  try { "$((Invoke-WebRequest $u -UseBasicParsing -Headers @{'Cache-Control'='no-cache'}).StatusCode)  $_" }
  catch { "ERROR  $_" }
}
```

Cuatro `200`. Y abre `support.html` en el navegador con Ctrl+F5 para probar el
buscador.

---

## 7. Comprobaciones antes de compilar

```powershell
npx tsc --noEmit
Get-Content pbiviz.json | Select-String "version|email|apiVersion|guid"
Select-String -Path src\*.ts -Pattern "console\.log|BUILD-|DEBUG" | Select-Object -First 20
```

- `version` = `1.0.2.0`
- `email` = `support@tcviz.com`
- `guid` sin sufijo `_test`
- `isPro` resuelto por el licence manager, no forzado
- sin instrumentación de debug

**Y verifica en Power BI Desktop la navegación por teclado y el modo de alto
contraste.** La documentación los describe y yo no leí los manejadores en
`visual.ts`. Si no se comportan como está escrito, corrige el texto antes de
publicar.

---

## 8. Build de producción

Solo después de confirmar que las pruebas pasan.

```powershell
npx pbiviz package
```

Sale en `dist/` como `flowChart69C501A62F7E49748AD3DA7D4E840200.1.0.2.0.pbiviz`.
**No lo renombres** — ese es el nombre que espera Partner Center.

Comprobar que lo empaquetado es lo que crees:

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = Resolve-Path ".\dist\flowChart69C501A62F7E49748AD3DA7D4E840200.1.0.2.0.pbiviz"
$zip = [IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.Entries | Where-Object { $_.Name -like "*.pbiviz.json" }
$reader = New-Object IO.StreamReader($entry.Open())
$j = $reader.ReadToEnd() | ConvertFrom-Json
$reader.Close(); $zip.Dispose()
"version : " + $j.visual.version
"guid    : " + $j.visual.guid
"email   : " + $j.author.email
"api     : " + $j.apiVersion
```

Tiene que decir `1.0.2.0` y `support@tcviz.com`. Si no, no lo subas.

---

## 9. Tag, certification y archivo

```powershell
git tag -a v1.0.2.0 -m "Enviado a AppSource 2026-09-XX"
git push origin main --follow-tags
git push origin main:certification
```

Y verifica **abriendo el fichero en GitHub**, no dando por hecho que el push hizo
lo que crees:
`https://github.com/tinocallarisa-web/FlowChart/blob/certification/pbiviz.json`

Archiva el paquete fuera de `dist/`, que se limpia:

```powershell
New-Item -ItemType Directory -Force _releases | Out-Null
Copy-Item dist\*.pbiviz _releases\
```

Es la única copia recuperable de lo que verán los clientes.

---

## 10. Partner Center

- Subir el `.pbiviz` de 1.0.2.0
- **Rellenar otra vez las notas de certificación** copiando
  `docs/CERTIFICATION-NOTES.md`. Ese campo se borra en cada reenvío y dejarlo vacío
  es rechazo automático.
- Actualizar la descripción de la oferta si hace falta

Si Partner Center vuelve a rechazar el paquete por versión duplicada, sube a
`1.0.3.0` y repite desde el paso 1 — `pbiviz.json`, `package.json`, `CHANGELOG.md`,
regenerar, commit, tag, build. Cada número enviado queda consumido para siempre.

---

## 11. GitHub — dos ajustes de un minuto

Settings → General → Features → **activar Discussions**. Es una de las nueve señales
de soporte y el `config.yml` de las plantillas de issue ya enlaza ahí.

Y confirma que la rama por defecto es `main`: el README es la portada de la rama por
defecto, y si apunta a otra parte no lo ve nadie.
