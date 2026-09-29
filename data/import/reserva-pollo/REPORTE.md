# Reporte de import — Bocaditos de reserva: Pollo

Generado: 2026-09-29T19:03:38.331Z

Este documento resume qué se extrajo del docx `Cocina_en_un_Dia_Bebe_Amneris.docx` y qué necesita revisión antes de cargar a Firestore. Nada se ha cargado todavía — corre `npm run import:load -- --apply` cuando lo apruebes.

## Resumen

- **Recetas mergeadas por título**: 22 (a partir de 24 cards del docx)
- **Menús semanales**: 12
- **Guías técnicas**: 8
- **Recetas de preparación fresca (no congelan)**: 3
- **Ingredientes propuestos (no matchean con catálogo)**: 67
- **Alérgenos propuestos**: 0

## Recetas mergeadas

Cada fila corresponde a UNA `Receta` en Firestore. Si aparece más de un código en "Códigos fuente", significa que se detectaron varias cards del docx con el mismo título y se fusionaron en una sola receta con variantes por etapa.

| ID | Título | Etapas | Códigos fuente | Fresca | Warnings |
|----|--------|--------|-----------------|--------|----------|
| `arroz-salteado-con-pollo-en-cubos-y-verduras` | Arroz Salteado con Pollo en Cubos y Verduras | E3 | E3-P1-R8 | no | 0 |
| `avena-con-huevo` | Avena con Huevo | E1 | E1-H1-R1 | sí | 1 |
| `bastones-de-pollo-y-camote` | Bastones de Pollo y Camote | E1 | E1-P1-R2 | no | 0 |
| `bollitos-de-maiz-con-pollo` | Bollitos de Maíz con Pollo | E1, E2, E3 | E1-P1-R8, E2-P1-R7, E3-P1-R6 | no | 0 |
| `crema-de-pollo-camote-y-zanahoria` | Crema de Pollo, Camote y Zanahoria | E1 | E1-P1-R6 | no | 0 |
| `crema-de-pollo-zapallo-y-zanahoria` | Crema de Pollo, Zapallo y Zanahoria | E1 | E1-P1-R3 | no | 0 |
| `deditos-de-pollo-crujientes-en-harina-de-maiz` | Deditos de Pollo Crujientes en Harina de Maíz | E3 | E3-P1-R2 | no | 0 |
| `deditos-de-pollo-en-harina-de-maiz` | Deditos de Pollo en Harina de Maíz | E2 | E2-P1-R2 | no | 0 |
| `estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria` | Estofado de Pollo en Cubos con Lentejas y Zanahoria | E3 | E3-P1-R1 | no | 0 |
| `funche-de-huevo-con-harina-de-maiz-y-leche` | Funche de Huevo con Harina de Maíz y Leche | E3 | E3-H1-R1 | sí | 1 |
| `funche-de-pollo-con-leche` | Funche de Pollo con Leche | E1 | E1-P1-R7 | sí | 1 |
| `funche-de-pollo-con-verduras-chafadas` | Funche de Pollo con Verduras Chafadas | E2 | E2-P1-R6 | no | 0 |
| `mini-albondigas-humedas-en-salsa-de-tomate-natural` | Mini Albóndigas Húmedas en Salsa de Tomate Natural | E2 | E2-P1-R1 | no | 0 |
| `mini-muffins-de-pollo-y-espinaca` | Mini Muffins de Pollo y Espinaca | E2 | E2-P1-R3 | no | 0 |
| `mini-muffins-de-pollo-brocoli-y-queso` | Mini Muffins de Pollo, Brócoli y Queso | E3 | E3-P1-R5 | no | 0 |
| `nuggets-blandos-de-pollo-y-arroz` | Nuggets Blandos de Pollo y Arroz | E2 | E2-P1-R5 | no | 0 |
| `panqueques-de-pollo-y-platano` | Panqueques de Pollo y Plátano | E3 | E3-P1-R3 | no | 0 |
| `panquequitos-de-pollo-y-manzana` | Panquequitos de Pollo y Manzana | E2 | E2-P1-R4 | no | 0 |
| `papilla-de-pollo-manzana-y-avena` | Papilla de Pollo, Manzana y Avena | E1 | E1-P1-R1 | no | 0 |
| `papilla-de-pollo-zanahoria-y-avena` | Papilla de Pollo, Zanahoria y Avena | E1 | E1-P1-R4 | no | 0 |
| `pastelitos-de-pollo-brocoli-y-queso-al-horno` | Pastelitos de Pollo, Brócoli y Queso al Horno | E3 | E3-P1-R7 | no | 0 |
| `pure-proteico-de-pollo-lentejas-y-zapallo` | Puré Proteico de Pollo, Lentejas y Zapallo | E1 | E1-P1-R5 | no | 0 |

### Recetas con warnings de parseo (3)

- **Avena con Huevo** (`avena-con-huevo`):
  - [E1-H1-R1] Sin rendimiento (🍽)
- **Funche de Huevo con Harina de Maíz y Leche** (`funche-de-huevo-con-harina-de-maiz-y-leche`):
  - [E3-H1-R1] Sin rendimiento (🍽)
- **Funche de Pollo con Leche** (`funche-de-pollo-con-leche`):
  - [E1-P1-R7] Sin rendimiento (🍽)

## Alérgenos inferidos por receta

Detectados desde los nombres de ingredientes con heurística conservadora (huevo, lácteos, gluten, pescado, soja, sésamo). Están marcados `inferido: true` en la carga — el editor de recetas permite quitarlos.

Recetas con al menos un alérgeno inferido: **16**

| Receta | Alérgenos inferidos |
|--------|---------------------|
| Arroz Salteado con Pollo en Cubos y Verduras | huevo |
| Avena con Huevo | gluten, huevo, lacteos |
| Bollitos de Maíz con Pollo | gluten |
| Deditos de Pollo Crujientes en Harina de Maíz | gluten |
| Deditos de Pollo en Harina de Maíz | gluten |
| Funche de Huevo con Harina de Maíz y Leche | gluten, huevo, lacteos |
| Funche de Pollo con Leche | gluten, lacteos |
| Funche de Pollo con Verduras Chafadas | gluten |
| Mini Muffins de Pollo y Espinaca | gluten, huevo |
| Mini Muffins de Pollo, Brócoli y Queso | huevo, lacteos |
| Nuggets Blandos de Pollo y Arroz | huevo |
| Panqueques de Pollo y Plátano | gluten, huevo |
| Panquequitos de Pollo y Manzana | gluten, huevo |
| Papilla de Pollo, Manzana y Avena | gluten |
| Papilla de Pollo, Zanahoria y Avena | gluten |
| Pastelitos de Pollo, Brócoli y Queso al Horno | huevo, lacteos |

## Ingredientes propuestos

El pipeline nunca crea ingredientes en silencio. Cada nombre nuevo se propone acá con sus mejores matches del catálogo actual. Revisa y decide:

- Si el nombre nuevo YA existe con otro nombre → renombra la variante en el docx o en la normalización.
- Si es un ingrediente genuinamente nuevo → apruébalo y se creará en la carga con el `idPropuesto`.

| Nombre en docx | ID propuesto | Usado en | Candidatos cercanos |
|----------------|--------------|----------|---------------------|
| Aceite de oliva virgen extra | `⭐aceite-de-oliva-virgen-extra` | E1-P1-R8, E2-P1-R2, E2-P1-R5, E2-P1-R7, E3-H1-R1 (+3) | Aceite Oliva Extra (0.60) · Aceite Oliva (0.40) · Aceite Coco (0.20) |
| Agua de cocción | `⭐agua-de-coccion` | E1-P1-R3, E1-P1-R4, E1-P1-R6 | Agua Coccion (0.67) · Agua (0.33) · Agua O Caldo (0.33) |
| Agua de cocción de avena | `⭐agua-de-coccion-de-avena` | E1-P1-R1 | Agua Coccion (0.50) · Agua (0.25) · Agua O Caldo (0.25) |
| Agua de cocción del pollo | `⭐agua-de-coccion-del-pollo` | E1-P1-R7 | Agua Coccion (0.40) · Agua (0.20) · Agua O Caldo (0.20) |
| Agua o leche (materna, fórmula o preferencia) | `⭐agua-o-leche-materna-formula-o-preferencia` | E1-H1-R1 | Agua O Leche (0.50) · Leche Materna, Formula (0.50) · Leche Materna O (0.50) |
| Agua tibia o caldo de pollo sin sal | `⭐agua-tibia-o-caldo-de-pollo-sin-sal` | E1-P1-R8, E2-P1-R7 | Agua O Caldo (0.38) · Caldo Pollo Sin (0.38) · Caldo Sin Sal (0.38) |
| Ajo en polvo (opcional) | `⭐ajo-en-polvo-opcional` | E2-P1-R2, E2-P1-R3, E2-P1-R5, E3-P1-R2 | Ajo (0.25) · Canela Polvo (0.25) · Curcuma Polvo (0.25) |
| Arroz blanco o integral cocido | `⭐arroz-blanco-o-integral-cocido` | E3-P1-R8 | Arroz Blanco (0.40) · Arroz Integral (0.40) · Agua O Caldo (0.20) |
| Arroz blanco o integral cocido pasado de agua | `⭐arroz-blanco-o-integral-cocido-pasado-de-agua` | E2-P1-R5 | Agua O Caldo (0.25) · Agua O Leche (0.25) · Arroz Blanco (0.25) |
| Avena en hojuelas o harina | `⭐avena-en-hojuelas-o-harina` | E1-H1-R1 | Avena Remojada O (0.40) · Agua O Caldo (0.20) · Agua O Leche (0.20) |
| Avena fina | `⭐avena-fina` | E2-P1-R3 | Avena Molida (0.50) · Polenta Fina (0.50) · Avena Integral Copos (0.33) |
| Brócoli cocido al vapor — arbolitos picados | `⭐brocoli-cocido-al-vapor-arbolitos-picados` | E3-P1-R5, E3-P1-R7 | Brocoli (0.17) |
| Brócoli cocido al vapor en arbolitos pequeños | `⭐brocoli-cocido-al-vapor-en-arbolitos-pequenos` | E3-P1-R8 | Brocoli (0.14) |
| Caldo casero de pollo sin sal | `⭐caldo-casero-de-pollo-sin-sal` | E2-P1-R6, E3-P1-R6 | Caldo Pollo Sin (0.50) · Caldo Sin Sal (0.50) · Caldo Verduras Sin (0.33) |
| Caldo casero de verduras sin sal | `⭐caldo-casero-de-verduras-sin-sal` | E1-P1-R5, E3-P1-R1 | Caldo Sin Sal (0.50) · Caldo Verduras Sin (0.50) · Caldo Pollo Sin (0.33) |
| Caldo de verduras casero sin sal | `⭐caldo-de-verduras-casero-sin-sal` | E2-P1-R1 | Caldo Sin Sal (0.50) · Caldo Verduras Sin (0.50) · Caldo Pollo Sin (0.33) |
| Camote cocido sin piel | `⭐camote-cocido-sin-piel` | E1-P1-R2 | Albaricoques Sin Hueso (0.25) · Alubias Blancas Sin (0.25) · Bacalao Desalado Sin (0.25) |
| Camote sin piel | `⭐camote-sin-piel` | E1-P1-R6 | Albaricoques Sin Hueso (0.33) · Alubias Blancas Sin (0.33) · Bacalao Desalado Sin (0.33) |
| Canela en polvo (opcional) | `⭐canela-en-polvo-opcional` | E2-P1-R4, E3-H1-R1, E3-P1-R3 | Canela Polvo (0.50) · Curcuma Polvo (0.25) · Curry Suave Polvo (0.25) |
| Cebolla, ajo o cilantro licuado (opcional) | `⭐cebolla-ajo-o-cilantro-licuado-opcional` | E1-P1-R8, E2-P1-R7 | Agua O Caldo (0.17) · Agua O Leche (0.17) · Ajo (0.17) |
| Cúrcuma en polvo (opcional) | `⭐curcuma-en-polvo-opcional` | E2-P1-R6, E3-P1-R8 | Curcuma Polvo (0.50) · Canela Polvo (0.25) · Curry Suave Polvo (0.25) |
| Espinaca fresca picada finamente a cuchillo | `⭐espinaca-fresca-picada-finamente-a-cuchillo` | E2-P1-R3 | Espinaca (0.17) · Espinaca Blanqueada (0.17) · Espinaca O Congelada (0.17) |
| Harina de avena | `⭐harina-de-avena` | E1-P1-R1, E1-P1-R4, E3-P1-R3 | Avena Integral Copos (0.33) · Avena Molida (0.33) · Avena Para Bebe (0.33) |
| Harina de garbanzo o avena fina | `⭐harina-de-garbanzo-o-avena-fina` | E2-P1-R4 | Avena Remojada O (0.33) · Agua O Caldo (0.17) · Agua O Leche (0.17) |
| Harina de maíz precocida | `⭐harina-de-maiz-precocida` | E1-P1-R8, E2-P1-R7, E3-P1-R6 | Maiz Dulce Sin (0.25) |
| Harina de maíz precocida — funche (opcional) | `⭐harina-de-maiz-precocida-funche-opcional` | E1-H1-R1 | Maiz Dulce Sin (0.17) |
| Harina de maíz precocida (funche) | `⭐harina-de-maiz-precocida-funche` | E1-P1-R7, E2-P1-R2, E2-P1-R6, E3-H1-R1, E3-P1-R2 | Maiz Dulce Sin (0.20) |
| Huevo batido | `⭐huevo-batido` | E3-P1-R8 | Huevo (0.50) |
| Huevo completo batido | `⭐huevo-completo-batido` | E3-H1-R1 | Huevo (0.33) |
| Huevos batidos | `⭐huevos-batidos` | E2-P1-R3, E2-P1-R4, E2-P1-R5, E3-P1-R3, E3-P1-R5 (+1) | _(ninguno)_ |
| Leche (materna, fórmula, entera o vegetal) | `⭐leche-materna-formula-entera-o-vegetal` | E3-H1-R1 | Leche Materna, Formula (0.50) · Leche Materna O (0.50) · Agua O Leche (0.33) |
| Leche materna, fórmula o agua | `⭐leche-materna-formula-o-agua` | E1-P1-R7 | Agua O Leche (0.60) · Leche Materna, Formula (0.60) · Leche Materna O (0.60) |
| Lentejas cocidas enteras | `⭐lentejas-cocidas-enteras` | E3-P1-R1 | Lentejas (0.33) · Lentejas Rojas (0.33) |
| Lentejas rojas o sin piel | `⭐lentejas-rojas-o-sin-piel` | E1-P1-R5 | Lentejas Rojas (0.40) · Agua O Caldo (0.20) · Agua O Leche (0.20) |
| Manzanas grandes | `⭐manzanas-grandes` | E1-P1-R1 | _(ninguno)_ |
| Orégano seco (opcional) | `⭐oregano-seco-opcional` | E2-P1-R2, E3-P1-R5 | _(ninguno)_ |
| Papel vegetal | `⭐papel-vegetal` | E1-P1-R2 | Aceite Vegetal (0.50) |
| Pechuga de pollo | `⭐pechuga-de-pollo` | E1-P1-R1, E1-P1-R4, E1-P1-R5 | Pechuga Pollo Sin (0.67) · Caldo Pollo Sin (0.33) · Pechuga Pavo Sin (0.33) |
| Pechuga de pollo cocida y desmechada en tiras medianas | `⭐pechuga-de-pollo-cocida-y-desmechada-en-tiras-medianas` | E3-P1-R6 | Pechuga Pollo Sin (0.22) · Caldo Pollo Sin (0.11) · Pechuga Pavo Sin (0.11) |
| Pechuga de pollo cocida y desmechada muy fina | `⭐pechuga-de-pollo-cocida-y-desmechada-muy-fina` | E2-P1-R7 | Pechuga Pollo Sin (0.25) · Caldo Pollo Sin (0.13) · Pechuga Pavo Sin (0.13) |
| Pechuga de pollo cocida y procesada muy fina | `⭐pechuga-de-pollo-cocida-y-procesada-muy-fina` | E1-P1-R7, E1-P1-R8 | Pechuga Pollo Sin (0.25) · Caldo Pollo Sin (0.13) · Pechuga Pavo Sin (0.13) |
| Pechuga de pollo en cubitos de 1 cm | `⭐pechuga-de-pollo-en-cubitos-de-1-cm` | E3-P1-R1, E3-P1-R8 | Pechuga Pollo Sin (0.29) · Caldo Pollo Sin (0.14) · Pechuga Pavo Sin (0.14) |
| Pechuga de pollo en tiras del tamaño de un dedo adulto | `⭐pechuga-de-pollo-en-tiras-del-tamano-de-un-dedo-adulto` | E3-P1-R2 | Pechuga Pollo Sin (0.20) · Caldo Pollo Sin (0.10) · Pechuga Pavo Sin (0.10) |
| Pechuga de pollo picada en cubitos de 5mm | `⭐pechuga-de-pollo-picada-en-cubitos-de-5mm` | E2-P1-R2 | Pechuga Pollo Sin (0.29) · Caldo Pollo Sin (0.14) · Pechuga Pavo Sin (0.14) |
| Pimentón dulce (opcional) | `⭐pimenton-dulce-opcional` | E3-P1-R7 | Maiz Dulce Sin (0.33) |
| Pimentón dulce o cilantro fresco (opcional) | `⭐pimenton-dulce-o-cilantro-fresco-opcional` | E3-P1-R6 | Agua O Caldo (0.17) · Agua O Leche (0.17) · Arandanos O Congelados (0.17) |
| Pimentón dulce o paprika (opcional) | `⭐pimenton-dulce-o-paprika-opcional` | E3-P1-R2 | Agua O Caldo (0.20) · Agua O Leche (0.20) · Arandanos O Congelados (0.20) |
| Plátanos maduros | `⭐platanos-maduros` | E3-P1-R3 | _(ninguno)_ |
| Pollo (pechuga o muslo deshuesado) | `⭐pollo-pechuga-o-muslo-deshuesado` | E1-P1-R3, E1-P1-R6 | Pechuga Pollo Sin (0.40) · Agua O Caldo (0.20) · Agua O Leche (0.20) |
| Pollo cocido desmechado muy fino | `⭐pollo-cocido-desmechado-muy-fino` | E2-P1-R6, E3-P1-R3 | Caldo Pollo Sin (0.20) · Pechuga Pollo Sin (0.20) · Pollo Desmenuzado (0.20) |
| Pollo cocido procesado fino | `⭐pollo-cocido-procesado-fino` | E2-P1-R4 | Caldo Pollo Sin (0.25) · Pechuga Pollo Sin (0.25) · Pollo Desmenuzado (0.25) |
| Pollo molido | `⭐pollo-molido` | E2-P1-R1, E2-P1-R5 | Pollo Desmenuzado (0.50) · Caldo Pollo Sin (0.33) · Pechuga Pollo Sin (0.33) |
| Pollo molido crudo | `⭐pollo-molido-crudo` | E1-P1-R2, E2-P1-R3 | Caldo Pollo Sin (0.33) · Pechuga Pollo Sin (0.33) · Pollo Desmenuzado (0.33) |
| Pollo molido o picado en cubitos de 5mm | `⭐pollo-molido-o-picado-en-cubitos-de-5mm` | E3-P1-R7 | Agua O Caldo (0.13) · Agua O Leche (0.13) · Arandanos O Congelados (0.13) |
| Pollo molido o picado muy fino | `⭐pollo-molido-o-picado-muy-fino` | E3-P1-R5 | Agua O Caldo (0.17) · Agua O Leche (0.17) · Arandanos O Congelados (0.17) |
| Puré de manzana natural sin azúcar | `⭐pure-de-manzana-natural-sin-azucar` | E2-P1-R4 | Yogur Natural Sin (0.33) · Albaricoques Sin Hueso (0.17) · Alubias Blancas Sin (0.17) |
| Queso tierno rallado bajo en sal | `⭐queso-tierno-rallado-bajo-en-sal` | E3-P1-R5, E3-P1-R7 | Caldo Sin Sal (0.17) · Garbanzos Sin Sal (0.17) · Queso Crema O (0.17) |
| Tomates maduros licuados y colados | `⭐tomates-maduros-licuados-y-colados` | E2-P1-R1 | _(ninguno)_ |
| Yema de huevo o huevo bien cocido | `⭐yema-de-huevo-o-huevo-bien-cocido` | E1-H1-R1 | Agua O Caldo (0.17) · Agua O Leche (0.17) · Arandanos O Congelados (0.17) |
| Zanahoria cocida chafada con tenedor | `⭐zanahoria-cocida-chafada-con-tenedor` | E2-P1-R6 | Zanahoria (0.20) |
| Zanahoria en cubitos pequeños | `⭐zanahoria-en-cubitos-pequenos` | E3-P1-R1 | Zanahoria (0.25) |
| Zanahoria en cubitos pequeños cocida | `⭐zanahoria-en-cubitos-pequenos-cocida` | E3-P1-R8 | Zanahoria (0.20) |
| Zanahorias | `⭐zanahorias` | E1-P1-R3, E1-P1-R4, E1-P1-R6 | _(ninguno)_ |
| Zapallo cocido | `⭐zapallo-cocido` | E2-P1-R1 | _(ninguno)_ |
| Zapallo cocido chafado con tenedor | `⭐zapallo-cocido-chafado-con-tenedor` | E2-P1-R6 | _(ninguno)_ |
| Zapallo limpio sin semillas | `⭐zapallo-limpio-sin-semillas` | E1-P1-R3, E1-P1-R5 | Melon Sin Semillas (0.50) · Sandia Sin Semillas (0.50) · Albaricoques Sin Hueso (0.25) |
| Zapallo rallado (espesante natural) | `⭐zapallo-rallado-espesante-natural` | E3-P1-R1 | Yogur Natural Entero (0.25) · Yogur Natural Sin (0.25) |

## Menús semanales

| Código | Etapa | Semana | Celdas | Items lista | Warnings |
|--------|-------|--------|--------|-------------|----------|
| `E1-P1-S1` | etapa-1 | 1 | 21 | 10 | 0 |
| `E1-P1-S2` | etapa-1 | 2 | 21 | 10 | 0 |
| `E1-P1-S3` | etapa-1 | 3 | 21 | 10 | 0 |
| `E1-P1-S4` | etapa-1 | 4 | 21 | 10 | 0 |
| `E2-P1-S1` | etapa-2 | 1 | 21 | 12 | 6 |
| `E2-P1-S2` | etapa-2 | 2 | 21 | 12 | 5 |
| `E2-P1-S3` | etapa-2 | 3 | 21 | 12 | 2 |
| `E2-P1-S4` | etapa-2 | 4 | 21 | 12 | 3 |
| `E3-P1-S1` | etapa-3 | 1 | 21 | 12 | 13 |
| `E3-P1-S2` | etapa-3 | 2 | 21 | 12 | 12 |
| `E3-P1-S3` | etapa-3 | 3 | 21 | 12 | 13 |
| `E3-P1-S4` | etapa-3 | 4 | 21 | 12 | 12 |

### Menús con warnings
- **E2-P1-S1**:
  - Celda mar/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda vie/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda dom/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda lun/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda jue/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda dom/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
- **E2-P1-S2**:
  - Celda lun/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda mie/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda sab/desayuno: fuzzy match "Pan quequitos pollo y manzana" → papilla-de-pollo-manzana-y-avena (score 0.50)
  - Celda mar/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda vie/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
- **E2-P1-S3**:
  - Celda mie/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda sab/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
- **E2-P1-S4**:
  - Celda lun/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda jue/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
  - Celda sab/almuerzo: fuzzy match "Albóndigas en salsa de tomate" → mini-albondigas-humedas-en-salsa-de-tomate-natural (score 0.50)
- **E3-P1-S1**:
  - Celda vie/desayuno: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda lun/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda mie/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda jue/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda sab/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda dom/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda lun/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda mar/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda mie/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda jue/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda vie/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda sab/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda dom/cena: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
- **E3-P1-S2**:
  - Celda sab/desayuno: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda mar/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda jue/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda vie/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda dom/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda lun/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda mar/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda mie/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda jue/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda vie/cena: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda sab/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda dom/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
- **E3-P1-S3**:
  - Celda jue/desayuno: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda lun/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda mar/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda jue/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda sab/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda dom/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda lun/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda mar/cena: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda mie/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda jue/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda vie/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda sab/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda dom/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
- **E3-P1-S4**:
  - Celda mar/desayuno: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda lun/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda mie/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda vie/almuerzo: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda sab/almuerzo: fuzzy match "Estofado pollo, lentejas y zanahoria" → estofado-de-pollo-en-cubos-con-lentejas-y-zanahoria (score 0.80)
  - Celda lun/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda mar/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda mie/cena: fuzzy match "Deditos pollo crujientes" → deditos-de-pollo-crujientes-en-harina-de-maiz (score 0.60)
  - Celda jue/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda vie/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)
  - Celda sab/cena: fuzzy match "Arroz salteado pollo en cubos" → arroz-salteado-con-pollo-en-cubos-y-verduras (score 0.80)
  - Celda dom/cena: fuzzy match "Pastelitos pollo, brócoli y queso" → pastelitos-de-pollo-brocoli-y-queso-al-horno (score 0.80)

## Guías técnicas

| Código | Título | Bloques |
|--------|--------|---------|
| `B3-P1` | Equipos y Utensilios Necesarios | 31 |
| `B3-P2` | Estrategia de Congelación y Almacenamiento Seguro | 44 |
| `B3-P3` | Cronograma del Día de Batch Cooking | 22 |
| `B3-P4` | Guía de Descongelación Segura | 20 |
| `B3-P5` | Cómo Revivir la Textura Original al Recalentar | 25 |
| `B3-P6` | Guía de Condimentos Permitidos por Etapa | 60 |
| `B3-P7` | Tabla de Gramajes por Porción | 24 |
| `B3-P8` | Tabla de Rendimiento para el Batch Cooking Mensual | 57 |

## Gaps de contenido conocidos (del brief)

Estos se surface acá para que Amneris decida — el pipeline no los "arregla" en silencio:

1. **Nutrientes con disclaimer**: cada tabla incluye "Valores aproximados por porción cocida. Consultar con nutricionista antes de publicar." Se cargan con `aproximado: true` en el schema.
2. **Recetas de preparación fresca (no congelan)**: 3 previstas (Avena con Huevo, Panquequitos de Pollo y Manzana, Funche de Huevo con Harina de Maíz y Leche). Detectadas por `❄️ NO CONGELA ❌`. Revisa el conteo arriba.
3. **Listas de compras semanales vs mensual**: el docx repite la misma lista para las 4 semanas de cada etapa, y la lista mensual base puede no reconciliar exactamente (ej. 3 kg/semana pero 4 kg/mes). Se cargan tal como aparecen; la comparación queda al editor.
4. **Porciones en header vs tabla B3-P7**: los `Xg c/u` del header de cada card no siempre coinciden con los gramos-por-comida definidos por etapa. Se guardan ambos.

## Próximos pasos

1. Revisa esta tabla, en particular:
   - Ingredientes propuestos → ¿coinciden con alguno existente? Si sí, edita `normalize.ts` o renombra en el docx.
   - Recetas con warnings → decide si cargar como están (el editor lo corrige después) o volver al docx.
2. Corre `npm run import:load -- --dry-run` para ver EXACTAMENTE qué se escribiría.
3. Corre `npm run import:load -- --apply` para escribir (con backup reciente).

La colección `bocaditos-de-reserva-pollo` queda con `estado: oculta` — no se muestra en el reader hasta el flip manual el 5 de octubre.