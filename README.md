# Bocaditos del Corazón

Guía digital de alimentación complementaria para bebés de 6 a 24 meses, por Amneris.

Este proyecto convierte el manuscrito original (`docs/Bocaditos_TODOS_menus_COMPLETO.docx`) en una app local con:

1. Un lector para navegar, filtrar y buscar recetas, ver menús con sus listas de compras, y consultar técnicas de cocina.
2. (Próximamente, Fase 3) Una interfaz de autoría para agregar y editar recetas sin tocar código.

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

## Estructura de las páginas

- **Inicio** (`/`) — resumen y accesos rápidos.
- **Recetas** (`/recetas`) — todas las recetas con filtros por etapa, tipo de comida, tiempo, congelables, y opción de excluir alérgenos. Buscador por título o ingrediente.
- **Etapas** (`/etapas/etapa-1`, `etapa-2`, `etapa-3`) — recetas de cada etapa y su tabla de porciones/texturas por edad.
- **Menús** (`/menus`) — menús semanales con su lista de compras automática.
- **Técnicas** (`/tecnicas`) — glosario de técnicas de cocina que aparecen en las recetas.

## Cuando cambies el manuscrito de Word

Si actualizas el archivo `.docx` en la carpeta `docs/`, ejecuta en la terminal:

```
npm run extract
```

Esto vuelve a leer el manuscrito y regenera todas las recetas, ingredientes, alérgenos, técnicas, menús y porciones. Al final aparecerá el archivo `data/EXTRACCION_REPORTE.md` con el resumen de qué se extrajo, qué campos quedaron vacíos y qué requiere revisión manual.

## Cómo agregar o editar una receta

Está previsto para la Fase 3 del proyecto: una interfaz simple donde podrás crear recetas nuevas, editar las existentes, y agregar ingredientes o técnicas al catálogo. No necesitarás abrir ningún archivo JSON ni escribir código.

## Estructura del proyecto (para referencia)

- `docs/` — el manuscrito original en Word.
- `data/` — el dataset generado por el extractor (JSON legible, versionado en git).
- `public/images/recetas/` — las fotos de cada receta.
- `scripts/extract.ts` — el script que lee el manuscrito y genera el dataset.
- `src/` — el código de la aplicación web.
