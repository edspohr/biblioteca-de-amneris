# Reporte de import — Bocaditos de reserva: Pollo

Generado: 2026-09-29T20:50:02.123Z

Este documento resume qué se extrajo del docx `Cocina_en_un_Dia_Bebe_Amneris.docx` y qué necesita revisión antes de cargar a Firestore. Nada se ha cargado todavía — corre `npm run import:load -- --apply` cuando lo apruebes.

## Resumen

- **Recetas mergeadas por título**: 22 (a partir de 24 cards del docx)
- **Menús semanales**: 12
- **Guías técnicas**: 8
- **Recetas de preparación fresca (no congelan)**: 3
- **Ingredientes propuestos (no matchean con catálogo)**: 8
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
| Ajo en polvo | `ajo-polvo` | E2-P1-R2 | _(ninguno)_ |
| Cebolla, ajo o cilantro licuado | `cebolla-ajo-cilantro-licuado` | E1-P1-R8 | _(ninguno)_ |
| Harina de maíz precocida | `harina-maiz-precocida` | E1-H1-R1, E1-P1-R7, E1-P1-R8 | _(ninguno)_ |
| Orégano seco | `oregano-seco` | E2-P1-R2 | _(ninguno)_ |
| Pimentón dulce | `pimenton-dulce` | E3-P1-R2, E3-P1-R6, E3-P1-R7 | _(ninguno)_ |
| Pollo molido | `pollo-molido` | E1-P1-R2, E2-P1-R1, E3-P1-R5, E3-P1-R7 | _(ninguno)_ |
| Queso tierno rallado bajo en sal | `queso-tierno-rallado` | E3-P1-R5 | _(ninguno)_ |
| Tomates maduros licuados y colados | `tomates-maduros-licuados` | E2-P1-R1 | _(ninguno)_ |

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