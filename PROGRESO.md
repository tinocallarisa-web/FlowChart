# flowChart — Visual personalizado de Power BI

Resumen del desarrollo hasta la fecha. Visual de diagrama de flujo jerárquico (tipo Sankey/decomposition tree) con integración nativa de Power BI, construido a partir del benchmark de 5 visuales de la competencia (From Visuals Process Chart, process.science, Organizational Chart, SCvation Process Flow, Power Automate Process Mining).

## Modelo de datos

El visual usa un mapeo de tabla plana (`table` dataViewMapping) con estos roles:

| Rol | Tipo | Descripción |
|---|---|---|
| **Levels** | Grouping (múltiple) | Un campo por nivel jerárquico, en el orden en que se arrastran (Level 1, Level 2, Level 3...). El visual construye el árbol automáticamente por la posición de la columna. Nodos con el mismo valor en el mismo nivel se fusionan (soporta "merging" de ramas). |
| **Level images** | Measure (múltiple) | Imagen base64 opcional por nivel, alineada por orden con Levels. Se valida el prefijo `data:image/...` antes de renderizar. |
| **Value** | Measure | Métrica principal; se propaga y suma por cada transición padre→hijo del árbol. |
| **Target** | Measure (opcional) | Activa el modo KPI: el badge del nodo pasa a mostrar `valor  ▲/▼ variación%` con color (verde/rojo configurable), sin perder el valor absoluto. |
| **Swimlane** | Grouping (opcional) | Agrupa nodos en bandas de color (horizontales o verticales según orientación) que atraviesan varios niveles. Un nodo solo se banda si **todas** las filas que lo generan coinciden en el mismo valor de swimlane; si no, queda neutro (sin banda). |
| **Tooltip fields** | Measure (múltiple) | Campos adicionales mostrados en el tooltip tanto de nodos como de enlaces (toma el valor de la fila hoja más profunda que generó el nodo/enlace). |

Roles descartados durante el desarrollo: `Source`/`Target`/`Status`/`Duration`/`Area` (el modelo original de aristas se sustituyó por el de niveles jerárquicos; `Area` se eliminó al no encajar como filtro transversal en este modelo).

## Layout y navegación

- **Direcciones**: horizontal (izquierda→derecha) o vertical (arriba→abajo), configurable.
- **Centrado por capa**: cada nivel se centra respecto al más ancho/alto, en vez de alinearse arriba/izquierda.
- **Centrado del diagrama en el visor**: si el contenido es más pequeño que el visor, se centra en el espacio disponible (una sola vez por cálculo de layout, no se re-aplica en cada colapso/expansión para evitar que el diagrama "derive" con cada click).
- **Ordenamiento por baricentro**: los nodos de cada nivel (salvo el primero) se ordenan según la posición media de sus nodos padre, agrupando visualmente las ramas y minimizando cruces de líneas.
- **Enlaces cíclicos (back-edges)**: detectados automáticamente (destino en la misma capa o anterior) y enrutados como un bucle discontinuo separado, evitando que crucen el resto del diagrama.
- **Golden path**: el enlace de mayor valor saliente de cada nodo se resalta (grosor y opacidad configurables); el resto se atenúa.
- **Variante dominante (conformance simplificado)**: opción para resaltar de punta a punta la ruta completa más frecuente/voluminosa, con color propio.
- **Colapsar/expandir ramas**: cada nodo con hijos muestra un botón `−`/`+` en su borde; oculta/muestra toda la rama y sus enlaces. Las posiciones no se recalculan al colapsar (queda el hueco), solo se oculta/muestra.
  - **Visibilidad correcta en grafos no-árbol**: un nodo puede tener más de un padre (ej. un canal alimentado tanto por "Distribución Directa" como "Distribución Indirecta"). Un nodo es visible si **al menos un** camino no colapsado llega hasta él (no basta con que uno de sus padres esté colapsado para ocultarlo); el enlace que sale del nodo colapsado siempre se oculta igualmente, aunque el destino siga visible por otro camino.
  - **Recalculo en cascada de valores**: al colapsar, el valor, el target y el grosor de enlace mostrados en cada nodo/enlace se recalculan desde las filas originales, cortando la contribución de cada fila en el primer nodo colapsado de su recorrido. El corte se propaga a **todos los niveles posteriores** (no solo al enlace inmediato), así que si colapsas un nodo de nivel 2, los niveles 3 y 4 aguas abajo también reflejan solo lo que sigue conectado.
- **Zoom**: botones `+`/`−` en la barra de herramientas (centran el zoom en el centro de la vista actual).
- **Scroll nativo**: el SVG se dimensiona exactamente a `contenido × zoom`; el navegador muestra barras de desplazamiento solo cuando el contenido excede el visor.
- **Minimap**: vista miniatura (esquina superior izquierda, bajo la barra de herramientas) con rectángulo de posición sincronizado; clic/arrastre para navegar. Aparece automáticamente con más de 6 nodos.
- **Búsqueda**: campo de texto que centra y resalta el primer nodo coincidente.
- **Fit to view**: reencuadra todo el contenido en el visor.
- **Toggle de tooltips**: botón en la barra de herramientas para desactivar/reactivar todos los tooltips (básico y de página) sin tocar el panel de formato.

## Análisis de variantes

- Se calculan las rutas completas (raíz→hoja) agregando valor entre filas que comparten la misma secuencia (ej. distintas filas de "Area").
- Panel "Variants" (botón en la barra de herramientas) con lista de las 8 rutas de mayor valor: ruta completa, barra proporcional, valor formateado y % del total.
- Clic en una variante traza esos enlaces exactos en el diagrama (opacidad plena) y atenúa el resto; clic de nuevo la limpia.

## Swimlanes

- Bandas de color que agrupan nodos por una dimensión secundaria (equipo, área, dueño...), perpendiculares a la dirección de flujo.
- Solo se aplica el posicionamiento por banda a los niveles que tienen al menos un nodo con swimlane asignado; los niveles 100% neutros (ancestros compartidos) usan el centrado normal, sin banda de fondo.
- Nodos hijos se centran dentro del ancho/alto de su banda respecto a sus propios hijos.
- Espacio reservado para la etiqueta de la banda (no se solapa con el primer nodo) y margen de seguridad alrededor de cada banda para que las tarjetas no sobresalgan.
- Configurable: mostrar/ocultar, 4 colores de banda, opacidad, fuente y color de la etiqueta, tamaño de etiqueta.

## Interacción y selección

- Selección nativa de Power BI: cada nodo/enlace acumula las identidades de **todas** las filas que lo alimentan (no solo una fila arbitraria), por lo que el cross-filtering hacia otros visuales de la página funciona correctamente.
- Clic en un nodo/enlace ya seleccionado lo deselecciona (toggle); Ctrl/Cmd+clic para selección múltiple.
- Menú contextual (clic derecho) nativo de Power BI.
- Tooltips nativos con datos del nodo (posición, origen, inflow/outflow, target/variación si aplica, campos de "Tooltip fields") y del enlace (origen, destino, valor, campos adicionales); primer renglón con cuadrito de color a juego con el nodo/enlace, como los tooltips nativos estándar.
- Soporte de **tooltips de página** (report/canvas tooltips): el autor del informe puede asignar una página del propio reporte como tooltip visual. **Limitación conocida**: con 3+ niveles, el tooltip de página puede no dispararse en nodos (cae al básico) porque Power BI no resuelve bien identidades multi-fila para ese propósito; en enlaces sí funciona. Se decidió mantener el cross-filtering correcto (identidades completas) en vez de sacrificarlo por este caso.
- Foco de teclado (`tabindex`, `role="button"`, `aria-label` descriptivo) y detección de modo alto contraste de Power BI (colores de paleta del host) — **verificado en vivo**: alto contraste se ve bien, navegación solo-teclado (Tab/Enter) funciona correctamente entre nodos y controles.

## Formato configurable (panel de Power BI)

- **Layout**: dirección, espaciado entre nodos, espaciado entre niveles.
- **Nodes**: ancho, alto, radio de esquina, fuente y tamaño de etiqueta, color de texto, tamaño de imagen, borde (grosor/color/por nivel), **sombra** (on/off, color, difuminado, offset X/Y, opacidad — desactivada automáticamente en alto contraste).
- **Badge de valor/KPI**: mostrar sí/no, fuente, tamaño, color de texto, color y opacidad de fondo, colores de KPI subida/bajada.
- **Value format**: plano / miles / compacto (K/M) / porcentaje (real, calculado sobre el total del flujo), decimales, prefijo, sufijo.
- **Links**: color, grosor base, curvatura, resaltado de ruta dominante (on/off + multiplicador de grosor), resaltado de variante top (on/off + color).
- **Swimlanes**: on/off, 4 colores de banda, opacidad, fuente/color/tamaño de etiqueta.
- **Legend**: on/off (leyenda de colores por nivel).
- **Data colors**: color por defecto, color por nivel (on/off + 6 colores configurables).

## Funcionalidades probadas y descartadas

- **Exportar a PNG**: se implementó completo (SVG→canvas→PNG, luego overlay con imagen visible para guardar manualmente) pero se descartó porque el sandbox del iframe de Power BI Desktop bloquea tanto la descarga programática (`<a download>`) como, aparentemente, el "Guardar imagen como" del menú contextual nativo. Es una limitación de la plataforma, no del código. Se quitó el botón y todo el código asociado.

## Datasets de ejemplo generados

- `sample_data.csv` — flujo de estados de ticket (Source/Target, modelo antiguo).
- `sample_data_with_images.csv` — mismo flujo con iconos SVG embebidos en base64.
- `sample_data_numeric_ids.csv` — IDs numéricos con etiquetas separadas.
- `sample_data_distribucion.csv` / `sample_data_levels.csv` — jerarquía Fabricante → Distribución Directa/Indirecta → AFH/HOME → 6 canales, con iconos por nivel.
- `sample_data_swimlanes.csv` — igual que el anterior, con columna `Equipo` (Horeca/Retail) para probar swimlanes.

## Comparativa uno a uno frente a la competencia

| Competidor | Su fuerte | Nuestra posición |
|---|---|---|
| **From Visuals Process Chart** | Vista dual detalle/agrupada, navegación en canvas denso | Igualamos su navegación (zoom/minimap/búsqueda) y superamos en selección nativa + leyenda + personalización. Panel de variantes cubre parte de su "vista agrupada". **Ganamos.** |
| **process.science Process Mining** | Swimlanes, target-vs-actual, duración, sin tooltips/selección nativos | Cubrimos swimlanes, KPI target con variación, formato de valor, y además tenemos selección/tooltips nativos que ellos no tienen. **Ganamos claramente.** |
| **Organizational Chart** | El más fuerte en integración nativa (selección, tooltips, bookmarks), KPI overlay, imágenes | Mismo nivel de integración nativa; superamos en configurabilidad (fuente/color/badge/sombra/formato de valor) e imágenes por nivel. **El rival más parejo — a la par o algo por delante.** |
| **Process Flow (SCvation)** | Variantes, golden path, minimap/zoom, sin interacción nativa | Replicamos variantes + golden path + minimap/zoom, y añadimos la integración nativa que les falta. **Ganamos.** |
| **Power Automate Process Mining** | Métricas intercambiables (frecuencia/tiempo/coste), diseño limpio, sin leyenda | Tenemos leyenda y más flexibilidad de formato; no replicamos el cambio de métrica de énfasis en caliente. **Ganamos en integración y leyenda.** |

**Resumen**: por delante claro en 4 de 5 comparativas; a la par (sin debilidad clara) en la más fuerte del grupo (Organizational Chart). En ningún caso por detrás.

## Estado frente a la competencia (resumen por capacidad)

| Capacidad | Estado |
|---|---|
| Integración nativa (selección, cross-filter, tooltips) | ✅ Ventaja frente a los 5 competidores |
| Golden path / ruta dominante | ✅ |
| Variantes con panel y trazado | ✅ |
| Conformance (ruta esperada vs. real) | ⚠️ Simplificado (variante top automática, no ruta manual) — decisión consciente, sin caso de uso identificado |
| Minimap + zoom + búsqueda + colapsar ramas | ✅ |
| Swimlanes | ✅ |
| KPI por nodo (target vs. actual) | ✅ |
| Leyenda | ✅ (ningún competidor la tenía) |
| Imágenes por nivel | ✅ (ningún competidor lo ofrecía así) |
| Personalización visual (fuente/color/borde/sombra/formato de valor) | ✅ Muy por encima de la media |
| Accesibilidad (ARIA, alto contraste, teclado) | ✅ Verificado en vivo |
| Exportar imagen | ❌ Descartado (limitación de plataforma) |

## Nota técnica: recálculo por filas (`rowChains`)

Además de los nodos/enlaces agregados, `ParsedData` guarda `rowChains`: un array con la cadena de niveles (`chain: string[]`), `value` y `targetValue` de **cada fila** original. En cada render se recorre este array y, para cada fila, se calcula el punto de corte (el primer nodo de su cadena que está colapsado); solo la parte de la cadena antes de ese corte contribuye a los mapas `visibleInValue` / `visibleOutValue` / `visibleTargetValue` (por nodo) y `edgeVisibleValue` / `edgeVisibleTarget` (por enlace), que son los que alimentan el badge, el tooltip, el aria-label y el grosor de los enlaces. La lista estructural de nodos/enlaces a dibujar (qué existe en el DOM) sigue un cálculo aparte por alcanzabilidad (BFS) que ya contempla nodos con varios padres.

## Pendiente / backlog

- Conformance completo: permitir definir manualmente una ruta objetivo (no solo la variante más frecuente) — sin caso de uso urgente identificado, queda en espera.
