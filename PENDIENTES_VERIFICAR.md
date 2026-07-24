# Pendientes por verificar con Amneris

Lista de datos que aparecían en la landing anterior (`recetas-web`) y que
**no** ship aquí porque no están confirmados. Cada ítem tiene tres estados
posibles:

- ✅ **Confirmado** — Amneris lo aprueba con el texto exacto. Muévelo al
  componente correspondiente.
- ✏️ **Reescribir** — el fondo es cierto pero la redacción o el número
  cambia. Amneris entrega la versión final.
- ❌ **No ship** — no se confirma. Se queda fuera de la landing hasta nuevo
  aviso.

## Biografía de Amneris

Ubicación en la landing: sección "Soy Amneris" (`src/app/page.tsx`,
componente `Manifesto`).

| # | Afirmación | Estado |
|---|---|---|
| B1 | "30 años en ingeniería" | pendiente |
| B2 | "Calculé estructuras, incluido el edificio más alto de Maracay" | pendiente |
| B3 | Dos hijas adultas / profesionales exitosas | pendiente |
| B4 | Foto real de Amneris (hoy es un placeholder con las iniciales) | pendiente — enviar JPG cuadrado, mínimo 800×800 |

Copy neutro que sí ship hoy: *"Soy ingeniera, madre, y creadora de este
sistema. Este libro nació en mi cocina, alimentando a mi propia hija, y
creció con la disciplina de quien está acostumbrada a que las estructuras
se sostengan por razones, no por intuición."*

## Endoso profesional

| # | Afirmación | Estado |
|---|---|---|
| P1 | "Revisado por nutricionistas pediátricos" | **removida** hasta tener nombre + firma |
| P2 | "Validación clínica externa" (paso 06 del método) | **removida** — el método se muestra con 6 pasos, no 7 |

Si Amneris consigue el aval formal de uno o más profesionales, agregar al
manifiesto como "Con la revisión de [Nombre, credencial]" y regresar el
paso 06 al método.

## Números y pruebas sociales

| # | Afirmación en la landing anterior | Estado |
|---|---|---|
| N1 | "+5.000 mamás nos acompañan" | **removida** — no hay fuente |
| N2 | "4.8/5" estrellas | **removida** — no hay fuente |
| N3 | Testimonios (Carolina/Javiera/Daniela) | **sección completa retirada** — no ship hasta tener testimonios reales con permiso escrito |

## Contacto

Todo esto vive en `src/lib/site.ts` como `null`. Al confirmar,
reemplazar los valores; el footer los mostrará automáticamente.

| # | Dato | Nota |
|---|---|---|
| C1 | `CONTACT_WHATSAPP` — número real | Formato `+56900000000`. El source repo tenía `+56912345678` como placeholder. |
| C2 | `INSTAGRAM_HANDLE` — cuenta real | El source tenía `bibliotecaanmerys` mal escrito. Confirmar el handle actual o dejar en `null` si no hay IG activa. |
| C3 | `CONTACT_EMAIL` — correo real | El source usaba `hola@bibliotecaanmerys.cl` (dominio mal escrito). |

## Alcance del proyecto

| # | Afirmación anterior | Corrección |
|---|---|---|
| A1 | "Biblioteca que crece cada mes / Nuevos libros mensualmente" | **removida** — hoy hay un solo libro y no se promete calendario |
| A2 | "Libro II Neurodivergentes / Libro III Congelar" | **secciones retiradas** — no anunciamos volúmenes futuros |
| A3 | "6 meses a 12 años" | **corregida** — el libro cubre 6 a 24 meses |

Si en el futuro un segundo libro se acerca a fecha de lanzamiento,
recuperar la sección "biblioteca en crecimiento" del audit.
