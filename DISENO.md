# Diseño — Bocaditos del Corazón

Guía de diseño para la aplicación lectora de *Bocaditos del Corazón* de Amneris.
Se dirige a madres de bebés de 6 a 24 meses que leen el libro en el teléfono, con una sola mano, muchas veces de noche. El objetivo de este documento es traducir el diseño real del manuscrito Word a un sistema de tokens web, con evidencia de dónde viene cada decisión.

Todo lo que sigue está extraído de `/tmp/bocaditos-docx/`. Cuando cito XML, viene del manuscrito original.

---

## 1. Tipografía

### 1.1 Estilos declarados en `word/styles.xml`

El manuscrito define pocos estilos con nombre. Solo los estándar de Word (Ttulo, Ttulo1–6, Normal, Prrafodelista) y todos ellos permanecen prácticamente vacíos.

Evidencia — valores por defecto del documento (líneas 3–12 de `styles.xml`):

```xml
<w:rPrDefault>
  <w:rPr>
    <w:rFonts w:ascii="Calibri" ... />
    <w:color w:val="3D3530"/>
    <w:lang w:val="es-CL" .../>
  </w:rPr>
</w:rPrDefault>
```

Los `Ttulo1–4` traen colores azul Word (`w:color w:val="2E74B5"` / `1F4D78`) y tamaños entre 24 y 32 half‑points, pero **estos estilos nunca se aplican en el flujo del documento**: `grep '<w:pStyle' word/document.xml` devuelve una sola coincidencia (`Textoennegrita1`). Todo el formato de fuente, tamaño y color está **inline** en cada `w:rPr`.

Consecuencia: la jerarquía real hay que reconstruirla desde `document.xml`, no desde los estilos.

### 1.2 Fuentes realmente utilizadas

Frecuencia de `w:rFonts w:ascii=…` en `word/document.xml`:

| Fuente               | Ocurrencias | Rol observado                             |
|----------------------|-------------|-------------------------------------------|
| **Cambria**          | 2 533       | Cuerpo, títulos, casi todo                |
| Segoe UI Symbol      | 361         | Íconos Unicode (⏱ ⚠ 📖)                   |
| Segoe UI Emoji       | 148         | Emoji a color (🧊 🍽 📖)                   |
| Calibri Light        | 123         | Excepciones puntuales                     |
| CommercialScript BT  | 2           | Firma decorativa (portada/dedicatoria)    |

La `<w:rPrDefault>` dice Calibri, pero el cuerpo del libro está compuesto en **Cambria** (serif humanista con matriz de transición). Confirmado en `fontTable.xml` (Cambria panose `02040503050406030204`, familia `roman`).

### 1.3 Jerarquía real de tamaños

Word usa half-points, así que `w:sz w:val="60"` = 30 pt. Frecuencias (top de `<w:sz>`):

| half‑pt | pt   | Ocurrencias | Rol observado                                             |
|---------|------|-------------|-----------------------------------------------------------|
| 60      | 30   | 120         | **Título de receta** — ej. `<w:t>Papilla de Calabaza y Avena</w:t>` |
| 52      | 26   | 18          | Título de sección — `Etapas de tu bebé`, `Primeros Sabores` |
| 48      | 24   | 13          | Sub-sección                                               |
| 44      | 22   | 10          | Sub-sub-sección                                           |
| 32      | 16   | 37          | Encabezados menores                                       |
| 28      | 14   | 26          | Encabezados pequeños                                      |
| 24      | 12   | 177         | Encabezado in-flow                                        |
| 22      | 11   | 2 861       | **Cuerpo por defecto**                                    |
| 19      | 9.5  | 1 370       | Cuerpo secundario / tablas                                |
| 18      | 9    | 2 737       | **Metadatos (tiempo, etapa, encabezados de tabla)**       |
| 17      | 8.5  | 1 585       | Descripciones cortas de tabla                             |
| 16      | 8    | 889         | **Notas al paso / referencias `📖 Secc. 2`** (color mostaza) |
| 14      | 7    | 28          | Notas al pie                                              |

Hay entonces cinco tramos claros: **30, 26, 22–24, 11, 9, 8**. Es una escala amplia, tipo cookbook impreso.

### 1.4 Sustitutos para web (Google Fonts)

Cambria no es web-safe y no está en Google Fonts. Propuestas:

| Manuscrito         | Sustituto web       | Justificación (1 frase)                                                                     |
|--------------------|---------------------|---------------------------------------------------------------------------------------------|
| **Cambria** (títulos y cuerpo) | **Fraunces** (títulos) + **Source Serif 4** (cuerpo) | Fraunces reproduce la calidez y variabilidad óptica de Cambria en tamaños grandes; Source Serif 4 mantiene la matriz humanista de Cambria en cuerpo pequeño con lectura cómoda en pantalla. |
| CommercialScript BT (firma) | **Petit Formal Script** o **Alex Brush** | Script inglés fino, solo para la firma/portada; no volver a usarlo. |
| Segoe UI Emoji / Symbol | Fuente del sistema (`system-ui`, emoji nativos) | Los emoji ya se renderizan bien en iOS/Android; no bajar fuente. |

Alternativa mono-fuente si se quiere simplificar: **Fraunces** en todo (soporta un axis óptico que se comporta como display en 26–30 pt y como texto en 11 pt).

---

## 2. Paleta

### 2.1 Tema Office (`word/theme/theme1.xml`)

El `<a:clrScheme>` es el de Office por defecto — **no aporta nada al diseño real**:

```xml
<a:accent1><a:srgbClr val="4472C4"/></a:accent1>  <!-- azul -->
<a:accent2><a:srgbClr val="ED7D31"/></a:accent2>  <!-- naranja -->
...
```

Los colores auténticos están inline en `document.xml`, no en el tema.

### 2.2 Colores realmente aplicados

Frecuencia de `w:color w:val=` en `word/document.xml`:

| Hex        | Uso    | Rol observado                                                                                  |
|------------|--------|------------------------------------------------------------------------------------------------|
| **`C45E32`** | 4 452 | **Terracota** — todos los encabezados, títulos, números de paso, cifras/gramajes, línea de sección. Es la "tinta de marca" del libro. |
| `7A5C00`   | 573    | Mostaza oscuro — pasos numerados y notas cruzadas (`📖 Cocer al vapor → Secc. 2`).           |
| `6B3FA0`   | 533    | **Morado etapa 3** — encabezados `ETAPA 3`, columnas 12–24 meses.                             |
| `3D7A3D`   | 533    | **Verde etapa 2** (según manuscrito) — encabezados `ETAPA 2`.                                 |
| `F0A07A`   | 137    | Terracota clara — bordes decorativos y líneas separadoras.                                    |
| `FFFFFF`   | 118    | Texto sobre fondo terracota (etiquetas tipo `DESAYUNO · Receta 2`).                           |
| `B48FD4`   | 103    | Morado claro — variantes etapa 3.                                                             |
| `8BBF8B`   | 95     | Verde claro — variantes etapa 2.                                                              |
| `3D3530`   | (default) | **Tinta principal** para cuerpo (marrón muy oscuro, casi negro).                          |

Frecuencia de `w:shd w:fill=` (fondos):

| Hex        | Uso    | Rol                                             |
|------------|--------|-------------------------------------------------|
| `FFFFFF`   | 2 420  | Blanco                                          |
| **`FDF0E8`** | 2 123 | **Crema cálida** — fondo dominante de tarjetas / bloques |
| `F5C4A8`   | 1 548  | Melocotón medio — bloques destacados            |
| `EDF5ED`   | 635    | Verde muy pálido — bloques etapa 2              |
| `F3EEF9`   | 634    | Lila muy pálido — bloques etapa 3               |
| `F9F5F0`   | 613    | Beige neutro                                    |
| `D4B8E8`   | 71     | Lila medio                                      |
| `B8D8B8`   | 70     | Verde medio                                     |

### 2.3 Lectura de la paleta

- **Chroma / marca**: la terracota `#C45E32` es el color firmante. Aparece en cada título de receta, en la línea `ETAPA 1 · 6 a 9 meses`, en los números de paso y en los gramajes. Nada más se acerca en frecuencia.
- **Superficies**: la crema `#FDF0E8` es la "página cálida" del libro. Casi todo lo que no es blanco puro está sobre esa crema.
- **Bordes / reglas**: `#F0A07A` es el color de las líneas separadoras (`<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="F0A07A"/>`), y `#E8E0D8` para hairlines finas (`w:sz="3"`).
- **Tinta de texto**: `#3D3530` (marrón oscuro cálido), definido en `<w:rPrDefault>`. Nunca negro puro.
- **Colores por etapa**: aparecen en el propio libro:
  - Etapa 2 = verde `#3D7A3D` (ink oscuro) + `#B8D8B8` / `#EDF5ED` (superficies).
  - Etapa 3 = morado `#6B3FA0` (ink) + `#D4B8E8` / `#F3EEF9` (superficies).
  - Etapa 1 (no aparece etiqueta con verde propio en el ink map — usa la terracota como color base) — pero `data/etapas.json` ya define `#2F5D46` (verde bosque) como `ink` y esto es coherente con la crema del libro.

---

## 3. Composición de una receta

Reconstruida leyendo los párrafos 2987–3079 de `document.xml` (primera receta del libro).

Orden observado, con el estilo tipográfico entre paréntesis:

1. **Etiqueta de sección** — `DESAYUNO · Receta 2`
   *sz 16 · color `#C45E32` · fondo `#FFFFFF` · bold* — se lee como un "eyebrow label".
2. **Título de receta** — `Papilla de Calabaza y Avena`
   *sz 60 · Cambria · bold · sin color explícito (usa `#3D3530`)*.
3. **Meta única** — `⏱  Tiempo de preparación: 20 min`
   *sz 18 · bold · sin color*.
4. **Etiqueta de etapa + textura** —
   `ETAPA 1  ·  6 a 9 meses` (sz 18, bold, `#C45E32`) seguido de `Papilla lisa sin trozos` (sz 18, `#C45E32`, no bold).
5. **Encabezados de tabla** de dos columnas: `N° | INGREDIENTE | CANTIDAD` y `PASO | PREPARACIÓN PASO A PASO`
   *sz 18 · bold · `#C45E32` sobre `#FDF0E8`*.
6. **Filas alineadas**: número (bold `#C45E32`), texto negro para el nombre del ingrediente, cantidad en `#C45E32`, número de paso `#C45E32` bold, y **la instrucción del paso en sz 16 color `#7A5C00`** (mostaza) con referencia cruzada `📖 Cocer al vapor → Secc. 2`.
7. **Bloques finales** (siempre en este orden):
   - `Calorías aprox.` — `52 kcal / 100 g`
   - `Vitaminas` — `Vit. A, Vit. C, Vit. B1`
   - `Beneficio` — texto libre
   - `🧊 Congelar: Sí — en porciones individuales`
   - `⏱  Conservación: 48 horas en refrigerador`
   - `⚠️ Alérgenos: …`
8. **Tabla `Porciones y texturas por rango de edad`** con tres columnas: `6 a 9 meses`, `9 a 11 meses`, `12 a 24 meses`. Cada fila: Porción, Textura.

Las listas **no usan viñetas ni numeración de Word**: `grep 'w:numId' document.xml` es cero. Todo el "listado" está simulado con celdas de tabla o con un número en `#C45E32` bold en su propio párrafo. Esto simplifica la migración a web: podemos usar `<ol>` o `<table>` según convenga.

Iconografía en línea: ⏱ 📖 🧊 ⚠️ 🥣 🍽 se usan como marcadores semánticos — merecen ser componentes reutilizables.

---

## 4. Elementos decorativos / estructurales

- **Portada / contraportada** (candidatos por dimensiones):
  - `image1.png` (897×844, 1.35 MB) — probable portada.
  - `image150.png` (1408×768, 1.55 MB) — probable contraportada o página doble.
  - `image149.png` (1047×525, 1.54 MB) — banner horizontal.
- **Íconos / decoraciones pequeñas** (< 30 KB, aspect ~1:1):
  - `image5.png` (338×338, 5.4 KB) — logo o marca.
  - `image142.png` (1018×859, 2.8 KB) — patrón / divisor con mucho blanco.
- **Bordes de párrafo** (`<w:pBdr>`) encontrados en 3 formas:
  - Gruesa decorativa: `<w:bottom w:val="single" w:sz="12" w:space="1" w:color="F0A07A"/>` (línea terracota clara de ~1.5 pt).
  - Media: `w:sz="6" color="F0A07A"` (~0.75 pt).
  - Hairline: `w:sz="3" color="E8E0D8"` (~0.4 pt, beige).
- **Bordes de tabla**: `<w:tblBorders>` con `w:sz="4"` (0.5 pt) `color="auto"` en las cuatro caras + `insideH`/`insideV` — es decir, tablas cuadriculadas finas negras.

En resumen: dos "voces" de línea: **terracota clara para separaciones editoriales** y **hairline beige/negro para tablas**.

---

## 5. Densidad y ritmo

Valores dominantes de `<w:spacing>` en `document.xml`:

| Ajuste                                              | Ocurrencias | Interpretación                              |
|-----------------------------------------------------|-------------|---------------------------------------------|
| `w:after="200" w:line="276" w:lineRule="auto"`      | 1 844       | 200 twips (~10 pt) después + line-height 1.15 |
| `w:after="40"`                                      | 877         | Muy ceñido (celdas de tabla)                |
| `w:before="20" w:after="200" w:line="276"`          | 377         | Igual con leve preludio                     |
| `w:before="60"`                                     | 155         | Suave separación arriba                     |
| `w:after="80"`                                      | 154         | Compacto                                    |

La página está configurada como carta (`w:pgSz w:w="12240" w:h="15840"`) con márgenes de ~2.5 cm laterales y 2.5 cm arriba/abajo (`w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701"`).

**Conclusión**: el ritmo es **editorial y aireado en el flujo** (line-height 1.15, `after` de 10 pt entre párrafos) pero **denso dentro de tablas** (line-height default, `after` de 2–4 pt). Esto se debe respetar en web: párrafos con `line-height: 1.45–1.6` (mejor que 1.15 en pantalla móvil), pero listas de ingredientes/pasos más compactas.

---

## 6. Registro emocional

Es un libro **de mesa cálido, no clínico, no infantil**. La combinación Cambria + terracota + crema + hairlines finas coloca la obra en el terreno del "editorial cookbook contemporáneo" (algo entre *Ottolenghi* y *Mi cocina*). No hay tipografía redondeada tipo póster infantil, no hay caricaturas, no hay azules ni grises corporativos. El uso disciplinado de **un solo acento cromático de marca** (terracota) y tres colores de etapa suaves comunica cuidado y confianza. Los íconos emoji lo humanizan sin bajar el registro. La firma en script (`CommercialScript BT`) aporta el toque personal de autoría. Para la app móvil de lectura nocturna esto se traduce en: superficies cálidas, tinta oscura pero no negra, acentos saturados usados con parquedad, y jamás pastel puro para texto.

---

## 7. Sistema de tokens propuesto

### 7.1 Color — base

```css
--color-bg:        #FDF6EE;  /* crema muy clara — página */
--color-surface:   #FFFFFF;  /* tarjeta */
--color-surface-2: #FDF0E8;  /* superficie tibia (bloques destacados) */
--color-ink:       #3D3530;  /* texto principal — del rPrDefault del libro */
--color-ink-muted: #7A6F6A;  /* metadatos / captions — presente 15× en manuscrito */
--color-border:    #E8E0D8;  /* hairline — del pBdr sz=3 */
--color-rule:      #F0A07A;  /* separadores decorativos — del pBdr sz=6/12 */

--color-brand:     #C45E32;  /* terracota — 4 452 ocurrencias */
--color-brand-ink: #7A2F0F;  /* variante oscura para texto sobre crema (AA) */
--color-accent:    #7A5C00;  /* mostaza — pasos / referencias cruzadas */

--color-danger:    #C62828;  /* alérgenos ⚠  — ya presente 3× en doc */
--color-success:   #3D7A3D;  /* también usado como etapa 2 en el libro */
```

**Aviso crítico**: `#C45E32` sobre `#FFFFFF` da contraste 4.20 y sobre `#FDF0E8` da 3.77. **Falla WCAG AA para texto de cuerpo (< 4.5)**. Solo pasa AA-large (≥ 3.0). Reglas:

- Usar `--color-brand` **únicamente** para (a) texto de tamaño ≥ 18 pt bold (título de receta, encabezado de tabla), (b) iconos, (c) rellenos y bordes.
- Para texto de cuerpo o metadato en color de marca, usar `--color-brand-ink` (`#7A2F0F`, contraste ~9 sobre blanco).
- La tinta por defecto siempre es `--color-ink` (contraste 12 sobre blanco).

### 7.2 Paletas por etapa

Provienen de `data/etapas.json`. Verifiqué su contraste:

| Etapa | primary  | soft     | accent   | ink       | ink/soft | ink/primary | white/accent |
|-------|----------|----------|----------|-----------|----------|-------------|--------------|
| 1     | #B8E0C8  | #EAF7EF  | #7FBFA0  | #2F5D46   | 6.86 AA  | 5.24 AA     | **2.13 FAIL** |
| 2     | #FDD0B1  | #FFF1E6  | #F5A97A  | #7A4321   | 7.15 AA  | 5.59 AA     | **1.94 FAIL** |
| 3     | #D6C6EC  | #F1EBFA  | #A98BD1  | #4A3771   | 8.67 AA  | 6.33 AA     | **2.88 FAIL** |

**Reglas de uso por etapa cuando la etapa está activa**:

- `soft` sustituye a `--color-bg` (fondo general de la vista de etapa/receta).
- `primary` sustituye a `--color-surface-2` (bloques destacados, píldoras de metadato, franjas de encabezado de tabla).
- `accent` se usa para **iconos, bordes activos, barra izquierda de bloques "variante" / "nota"**, y como borde de foco (`outline`). **Nunca como color de texto** ni como fondo con texto blanco encima (todos fallan AA).
- `ink` es el **único valor seguro para texto** dentro del contexto de la etapa; funciona sobre blanco, sobre `soft` y sobre `primary`.
- Botones primarios: fondo `ink`, texto `#FFFFFF` (todos pasan AA con holgura ≥ 7.5).
- Botones secundarios: fondo `primary`, texto `ink`.
- Enlaces dentro de la etapa: `ink` subrayado; en hover, subrayado del color `accent`.

### 7.3 Tipografía

```css
--font-title:  'Fraunces',        Georgia, 'Times New Roman', serif;
--font-body:   'Source Serif 4',  Georgia, 'Times New Roman', serif;
--font-script: 'Petit Formal Script', 'Snell Roundhand', cursive; /* solo firma */
--font-ui:     system-ui, -apple-system, 'Segoe UI', sans-serif;  /* botones / chrome */

/* Escala modular (proporción ≈ 1.25, ajustada a las medidas del libro) */
--fs-xs:   12px;  /* nota al pie, alérgeno pequeño          — book 7 pt  */
--fs-sm:   14px;  /* referencias cruzadas 📖                 — book 8 pt  */
--fs-base: 16px;  /* cuerpo móvil (subimos desde 11 pt para pantalla)     */
--fs-md:   18px;  /* metadatos (⏱ tiempo, etapa)             — book 9 pt  */
--fs-lg:   22px;  /* subsección                              — book 11 pt */
--fs-xl:   28px;  /* sección                                 — book 13 pt */
--fs-2xl:  36px;  /* título de receta móvil                  — book 26 pt */
--fs-3xl:  48px;  /* portada / hero                          — book 30 pt */

--lh-tight: 1.2;   /* títulos                                              */
--lh-body:  1.55;  /* cuerpo — más aire que el libro (que era 1.15)        */
--lh-list:  1.35;  /* ingredientes / pasos                                 */

--fw-regular: 400;
--fw-medium:  500;
--fw-semibold: 600;
--fw-bold:    700;
```

### 7.4 Espaciado (base 4)

```css
--sp-1:  4px;   /* hairline gap                                  */
--sp-2:  8px;   /* entre número de paso y su texto               */
--sp-3:  12px;
--sp-4:  16px;  /* padding tarjeta                               */
--sp-5:  24px;  /* separación entre bloques                      */
--sp-6:  32px;  /* separación de secciones                       */
--sp-8:  48px;  /* headroom de título                            */
--sp-10: 64px;  /* margen entre recetas                          */
```

### 7.5 Radios

```css
--radius-sm:   4px;   /* píldoras, chips                         */
--radius-md:   8px;   /* botones, inputs                         */
--radius-lg:  16px;   /* tarjetas de receta                      */
--radius-pill: 999px; /* etiquetas de etapa, filtros            */
```

El libro impreso no usa esquinas redondeadas (todo es rectangular), pero en móvil se recomienda `--radius-lg` para tarjetas y `--radius-pill` para chips de etapa, porque comunica "tocable".

### 7.6 Sombras (suaves, cálidas)

```css
--shadow-1: 0 1px 2px rgba(61, 53, 48, 0.06);
             /* tarjeta apoyada — muy sutil                              */
--shadow-2: 0 4px 12px rgba(61, 53, 48, 0.08);
             /* modal / hoja inferior                                    */
--shadow-3: 0 12px 32px rgba(61, 53, 48, 0.12);
             /* elevación máxima                                         */
```

Sombra en marrón `--color-ink` con alfa, no negra pura — mantiene la calidez.

### 7.7 Bordes

```css
--border-hairline: 1px solid var(--color-border);    /* tablas, inputs   */
--border-rule:     2px solid var(--color-rule);      /* separadores decorativos */
--border-strong:   3px solid var(--color-brand);     /* barra lateral de bloques importantes */
```

---

## 8. Advertencia consolidada de accesibilidad (WCAG AA)

- **Nunca** poner texto blanco sobre `primary`, `soft` o `accent` de ninguna etapa.
- **Nunca** poner texto `accent` sobre ningún fondo (todos fallan).
- **Nunca** poner texto `--color-brand` (`#C45E32`) sobre blanco/crema en tamaño < 18 pt bold; para texto normal usar `--color-brand-ink` (`#7A2F0F`).
- Combos seguros de texto: `ink` sobre `bg`, `surface`, `surface-2`, o `soft`/`primary` de la etapa activa; blanco sobre `ink`.
- Íconos que transmiten información (⚠ alérgenos, ⏱ tiempo) llevan siempre un texto adyacente — no dependen solo de color.
- Foco visible obligatorio: `outline: 3px solid var(--accent-etapa); outline-offset: 2px;` (el `accent` tiene bastante saturación para ser visible como borde aunque no sirva como texto).

---

## 9. Próximos pasos (Fase 2)

1. Crear `src/styles/tokens.css` (o equivalente en Tailwind config / CSS variables) con los valores anteriores.
2. Cargar Fraunces + Source Serif 4 desde Google Fonts con `font-display: swap` y subsetting `latin` + `latin-ext`.
3. Definir `data-etapa="etapa-1|2|3"` en `<html>` o el contenedor de vista, y sobrescribir `--color-bg`, `--color-surface-2`, `--color-brand`/`--color-accent`, `--color-ink` desde los valores de `data/etapas.json`. Esto permite que todos los componentes hereden la paleta sin lógica JS extra.
4. Diseñar los componentes base: `RecetaCard`, `TablaIngredientes`, `PasoNumerado`, `MetadatoInline` (⏱ 🧊 ⚠), `EtiquetaEtapa`, `ReferenciaCruzada` (📖 → Secc. 2), `BloqueNutricion`.
5. Definir tokens de modo nocturno (el uso principal es nocturno con una mano): invertir `bg` a `#1E1A18` y `ink` a `#F5EFE8`, manteniendo `--color-brand` como `#E88562` (versión más clara y con AA sobre fondo oscuro). Verificar contraste antes de commit.
6. Documentar en `README.md` cuál Google Font es obligatoria y qué versión de la paleta de etapas está congelada.
