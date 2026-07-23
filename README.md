# Bocaditos del Corazón

Guía digital de alimentación complementaria para bebés de 6 a 24 meses, por Amneris.

Este proyecto convierte el manuscrito original (`docs/Bocaditos_TODOS_menus_COMPLETO.docx`) en una app local con:

1. Un **lector** para navegar, filtrar y buscar recetas, ver menús con sus listas de compras, y consultar técnicas de cocina.
2. Una **interfaz de autoría** (`/admin`) para agregar y editar recetas, ingredientes, alérgenos y técnicas sin tocar código.

---

## Cómo arrancar la app en tu computadora

**Paso 1 — Instala Node.js** (una sola vez):

- Ve a https://nodejs.org y descarga la versión LTS.
- Instálala haciendo doble clic en el archivo descargado.

**Paso 2 — Abre una terminal en la carpeta del proyecto** y ejecuta:

```
npm install
npm run dev
```

**Paso 3 — Abre tu navegador** en http://localhost:3000

Cuando termines de usar la app, en la terminal presiona `Ctrl+C`.

---

## Qué cambió visualmente

Este ciclo se enfocó en dos cosas: **rediseño visual completo** para reflejar la calidez del libro impreso, y **rework mobile-first** para que sea cómodo leer las recetas en el teléfono, con una mano, mientras se cocina.

### El lenguaje visual

Se extrajo el diseño real del manuscrito Word (ver [DISENO.md](DISENO.md) para el detalle con evidencia). Los ejes:

- **Tipografía:** Fraunces para títulos y Source Serif 4 para el cuerpo — dos serifs cálidos que sustituyen a la Cambria del manuscrito. Se cargan desde Google Fonts automáticamente.
- **Color:** fondo crema `#FDF6EE`, tinta marrón cálido `#3D3530` (nunca negro puro), y una tinta de marca terracota `#C45E32` — el color que aparece 4 452 veces en el manuscrito original. Los tres colores de etapa (verde/naranja/morado) siguen viniendo de `data/etapas.json`.
- **Ritmo:** más aire entre líneas que el libro impreso (1.55 en cuerpo, no 1.15), párrafos más generosos, bordes redondeados solo en la app (no en el libro).
- **Contraste:** todo el texto cumple WCAG AA. El terracota original no pasa contraste para cuerpo, así que para texto se usa una variante más oscura (`#7A2F0F`). Los colores pastel de las etapas se reservan para fondos, bordes e iconos — nunca para texto.

### El diseño móvil

- La app está diseñada primero para pantallas de 360 px de ancho y luego se ensancha.
- Todos los botones y controles miden al menos 44×44 px (el mínimo cómodo para el dedo pulgar).
- Nunca hay scroll horizontal: las tablas se convierten en tarjetas apilables en móvil.
- Los pasos de cada receta se muestran como círculos grandes numerados en terracota, para ver bien el número de paso mientras se cocina.
- Las fotos usan `next/image` y se descargan solo cuando entran en pantalla, para que la app abra rápido incluso con las 120 recetas.
- Se respetan las áreas seguras del iPhone (la barra inferior nunca queda debajo de la muesca del sistema).

---

## Cómo funciona el selector de etapa

**La etapa NO filtra recetas.** Todas las recetas aplican a las tres etapas. Lo único que cambia entre etapas es la **textura** con la que se prepara y la **porción** que corresponde a la edad del bebé.

Por eso el selector es persistente y global:

- **En el móvil** aparece en una barra fija abajo, siempre al alcance del pulgar. Muestra "Viendo para 6 a 9 meses" (o la edad que corresponda) para que sepas en todo momento en qué etapa estás.
- **En el escritorio** aparece como una pastilla flotante en la esquina superior derecha.
- **Al elegir una etapa**, cambia la paleta de acentos de la app y, en cada receta, la textura y porción visibles pasan a las de esa etapa.
- La preferencia se recuerda entre visitas (guardada en el navegador).

Cada etapa tiene además su propia página con contexto y guía (accesible desde la portada, ya no desde el menú superior porque no eran destinos separados, eran modos de vista).

---

## Estructura de las páginas

- **Inicio** (`/`) — portada del libro con acceso a recetas, menús, técnicas, y las tres páginas de etapa.
- **Recetas** (`/recetas`) — buscador y filtros: tipo de comida, tiempo máximo, solo congelables, excluir alérgenos. En móvil los filtros abren desde una hoja inferior; en escritorio, como un panel desplegable. El contador de filtros activos siempre está visible.
- **Detalle de receta** (`/recetas/[slug]`) — foto, título, tiempo/kcal/congelable, variante de la etapa activa (textura y porción), ingredientes escaneables, pasos grandes numerados en terracota, y bloque de información (conservación, alérgenos, técnicas, vitaminas, notas).
- **Menús** (`/menus`) — menús semanales agrupados por etapa.
- **Detalle de menú** (`/menus/[slug]`) — plan semanal como tarjetas por día y lista de compras por categoría, calculada automáticamente.
- **Técnicas** (`/tecnicas`) — glosario, con lista de recetas que usan cada técnica.
- **Etapa** (`/etapas/etapa-1|2|3`) — descripción de la etapa, tabla de porciones y texturas, y recetas mostradas con la variante correspondiente.
- **Autoría** (`/admin`) — panel para crear/editar/eliminar recetas, ingredientes, alérgenos y técnicas.

---

## Cuando cambies el manuscrito de Word

Si actualizas el archivo `.docx` en la carpeta `docs/`, ejecuta en la terminal:

```
npm run extract
```

Esto vuelve a leer el manuscrito y regenera todas las recetas, ingredientes, alérgenos, técnicas, menús y porciones. Al final aparecerá el archivo `data/EXTRACCION_REPORTE.md` con el resumen de qué se extrajo, qué campos quedaron vacíos y qué requiere revisión manual.

---

## Cómo agregar o editar una receta

Desde el panel de autoría en `/admin` puedes crear recetas nuevas, editar las existentes y mantener los catálogos de ingredientes, alérgenos y técnicas. Cambios que hagas allí se guardan en los archivos JSON dentro de `data/`.

**Importante:** este flujo funciona en tu computadora local. Cuando lleguemos al ciclo de despliegue en Firebase (ver siguiente sección), el guardado se hará contra Firestore y podrás editar recetas también desde el teléfono con conexión a internet.

---

## Próximo ciclo: despliegue en Firebase

Este ciclo no incluye despliegue. El proyecto Firebase (`biblioteca-amneris`) ya está creado con App Hosting y Firestore, pero **todavía no está conectado a la app** — hoy la app usa los archivos JSON de la carpeta `data/` como base de datos.

El detalle de qué hay que hacer para desplegar de forma segura (sin perder tus cambios del admin) está en [REPORTE_DESPLIEGUE.md](REPORTE_DESPLIEGUE.md). En resumen: hay que reemplazar el adaptador de datos por uno que hable con Firestore, subir las fotos a Firebase Storage, y luego sí desplegar. Se hará en el próximo ciclo.

---

## Estructura del proyecto (para referencia técnica)

- `docs/` — el manuscrito original en Word.
- `data/` — dataset generado por el extractor (JSON legible, versionado en git).
- `public/images/recetas/` — fotos de cada receta.
- `scripts/extract.ts` — script que lee el manuscrito y genera el dataset.
- `src/app/` — páginas de la aplicación (App Router de Next.js).
- `src/lib/repo/` — capa única de acceso a datos (todo lo que lee o escribe pasa por aquí).
- `src/lib/schema/` — validación de datos con Zod.
- `src/lib/etapa-activa/` — contexto de React que mantiene la etapa activa y aplica su paleta.
- `src/styles/tokens.css` — tokens de diseño (color, tipografía, espaciado, radios, sombras).
- `src/styles/components.css` — estilos de todos los componentes, escritos en CSS plano usando los tokens.
- `DISENO.md` — extracción del lenguaje visual del manuscrito y sistema de tokens propuesto.
- `REPORTE_DESPLIEGUE.md` — análisis previo al despliegue en Firebase.
