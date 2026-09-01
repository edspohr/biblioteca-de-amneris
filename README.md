# La Biblioteca de Amneris

Suscripción única con recetas, menús y planes de alimentación para papás y mamás de bebés de 0 a 2 años. La primera sección disponible es **Bocaditos del Corazón** (recetas rápidas y nutritivas); las próximas (**Batch Cooking Pollo** en octubre, **Batch Cooking Pescado** en noviembre 2026) entran en el mismo plan.

Este proyecto convierte el manuscrito original de Bocaditos (`docs/Bocaditos_TODOS_menus_COMPLETO.docx`) en una app con:

1. Un **lector** para navegar, filtrar y buscar recetas, ver menús con sus listas de compras, y consultar técnicas de cocina.
2. Una **interfaz de autoría** (`/admin`) para agregar y editar recetas, ingredientes, alérgenos y técnicas sin tocar código.
3. Un **modelo de acceso** con prueba gratis de 30 días, suscripción mensual/anual y estados de cortesía.

> Los nombres de secciones, bajadas y fechas de lanzamiento viven en `src/lib/marca.ts` — al cambiarlos ahí se propagan a landing, portada del lector y CTAs.

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

Para uso diario, mejor mira [MANUAL_AMNERIS.md](MANUAL_AMNERIS.md) — ahí está la guía paso a paso en lenguaje sencillo. Este README es más técnico.

---

## Estructura general de la app

Tres superficies:

1. **Landing** (`/`) — página pública para presentar el libro y captar cuentas nuevas.
2. **Lector** (`/libro`, `/recetas`, `/menus`, `/tecnicas`, `/etapas/*`) — el libro mismo. Público, gratuito.
3. **Panel de autoría** (`/admin`) — sólo para superadmins. Aquí Amneris gestiona recetas, menús, ingredientes, alérgenos, técnicas, usuarios, y ve las preguntas frecuentes del asistente.

Además hay un **asistente flotante** en toda página pública, powered by Gemini 2.5 Flash — responde sólo con contenido real del libro vía function calling.

---

## Firebase (Fases 1 a 5)

El proyecto Firebase `biblioteca-amneris` está conectado a la app. Auth,
Firestore y Storage viven aquí:

- **Autenticación** por Firebase Auth (Google + correo/contraseña). Sólo
  las dos cuentas con la custom claim `superadmin` acceden a `/admin`.
  Se otorgan corriendo `npm run seed:superadmins`.
- **Datos** en Firestore. Un solo módulo (`src/lib/repo/`) sabe si usar
  Firestore o los JSON locales: si hay credenciales de admin configuradas
  usa Firestore, si no, JSON. Se puede forzar con `REPO_ADAPTER=json|firestore`.
- **Fotos** en Firebase Storage (`recetas/{id}/main.webp`), subidas
  vía el panel de autoría; se redimensionan a 1200 px y se guardan como WebP.

### Configuración local

1. Copia `.env.local.example` a `.env.local` y completa las variables
   `NEXT_PUBLIC_FIREBASE_*` desde Firebase Console → Configuración del
   proyecto → Tus apps.
2. Descarga una clave de cuenta de servicio (Configuración → Cuentas de
   servicio → Generar nueva clave) y guárdala como `serviceAccountKey.json`
   en la raíz. Está en `.gitignore`.
3. Pega también el site key de reCAPTCHA v3 en
   `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` (App Check). En local, si App Check
   te bloquea, define `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` con el token que
   imprime la consola del navegador la primera vez.

### Migración inicial (una sola vez)

Sube todos los JSON + fotos al proyecto Firebase:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run migrate:firestore
```

El script rechaza correr si alguna colección ya tiene documentos; pasa
`--force` para sobreescribir por id.

### Sincronizar Firestore → git (periódico)

Firestore es la fuente de verdad en producción, pero `data/*.json`
sigue siendo la historia legible del libro. Corre este comando cada
tanto para volcar Firestore a JSON y luego commitea el diff:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run export:firestore
git diff data/          # revisa
git add data/ && git commit -m "Sincronizar dataset con Firestore"
```

### Reglas de seguridad

- `firestore.rules`: lectura pública en catálogos y recetas; **toda
  escritura desde el cliente está denegada**. Las mutaciones sólo pasan
  por la API de Next.js, que usa el Admin SDK y bypassea reglas después
  de verificar la sesión de superadmin.
- `storage.rules`: lectura pública en `recetas/`; escritura denegada. Las
  subidas de fotos sólo entran por `POST /api/recetas/[id]/foto`.

Deploy de las reglas cuando cambien:

```
firebase deploy --only firestore:rules,storage
```

### Tests de reglas

```
npm run test:rules
```

Corre 34 tests con el emulador local: cada colección × cada rol × read/write. Requiere Java (Firestore emulator). `brew install openjdk@21` en macOS si no lo tienes.

### Asistente conversacional (Fase 5)

- Vive en el botón flotante bottom-right de toda página pública.
- Llama a Gemini 2.5 Flash desde el servidor (`/api/asistente`) — nunca desde el cliente.
- Cinco herramientas deterministas (`src/lib/asistente/tools.ts`): `buscarRecetas`, `obtenerReceta`, `buscarMenus`, `sugerirMenu`, `listaDeCompras`.
- Reglas duras aplicadas en código, no sólo en prompt: redirect médico (regex de síntomas), inyección de alérgenos detectados, sanitización de URLs inventadas.
- Rate limit por sesión: 20/hora, 100/día.
- Logs en `conversaciones/{sessionId}/mensajes/{id}` — sólo pregunta + resumen (150 chars), 30 días.
- Ver preguntas frecuentes en `/admin/asistente`.
- Limpieza mensual: `npm run cleanup:asistente`.

Setup de Google Cloud (una vez): [GCP_SETUP.md](GCP_SETUP.md).

### App Check

- Init del cliente en `src/lib/firebase/client.ts` con reCAPTCHA v3.
- El asistente API verifica el token si `APP_CHECK_ENFORCE=true` (opt-in).
- Enforcement de Auth/Firestore/Storage se activa en Firebase Console (ver [GCP_SETUP.md](GCP_SETUP.md)).

---

## Cuentas y período de prueba

Este ciclo cerró el modelo de acceso: cualquier persona puede registrarse gratis, y se activa un **período de prueba de 30 días** con acceso completo. Al terminar, la cuenta degrada a "modo lectura pública" (mismo que un visitante anónimo) sin perder datos. Cuando exista pasarela de pago, el mismo modelo de estados aguanta suscripciones reales.

### Cómo se registra alguien

- `/registro` — **solo Google en la UI** (un botón "Continuar con Google" + casilla obligatoria de política de datos [/privacidad](https://biblioteca-amneris.web.app/privacidad)).
- Después del registro, el usuario pasa por un onboarding corto de 3 pasos (fecha de nacimiento del bebé + datos opcionales) y llega a la biblioteca con la etapa que corresponde a la edad de su bebé preseleccionada. El nombre viene precargado desde Google, editable.
- `/ingresar` — para usuarios que ya se registraron. Solo Google.
- El trial arranca en el momento en que el usuario **acepta la política de privacidad** (paso 1 del onboarding). Sin consent, la cuenta existe pero no tiene acceso — así cumplimos la Ley 21.719.

**Sobre email/contraseña:** el proveedor sigue habilitado en Firebase y toda la lógica del servidor (creación de cuentas, sesiones) lo soporta. Está oculto en la UI para simplificar la experiencia. Sirve para: cuentas creadas por bulk import desde `/admin/usuarios`, invitaciones futuras por link, y cualquier reactivación de la vía email/contraseña sin tocar backend.

**Firebase "una cuenta por email":** el proyecto está configurado con la opción *"Link accounts that use the same email"* activada. Las cuentas creadas por bulk import quedan huérfanas hasta que la persona entra con Google usando el mismo correo — en ese momento Firebase las vincula automáticamente y el `usuarios/{uid}` mirror queda intacto. Contactos que solo tengan teléfono (sin email) necesitan invitación explícita.

### Qué ve cada tipo de usuario

| Superficie | Anónimo | En prueba / Activa / Cortesía | Prueba vencida |
| --- | --- | --- | --- |
| Portada, etapas, técnicas, privacidad | ✅ | ✅ | ✅ |
| Recetas destacadas (`destacadaPreview: true`) | ✅ | ✅ | ✅ |
| Recetas normales | Se ven con foto borrosa + chip 🔒 | ✅ | Vuelven a modo bloqueado |
| Menús semanales | Bloqueados con CTA de registro | ✅ | Bloqueados |
| `/cuenta`, `/admin` | Redirige a `/ingresar` | ✅ (según rol) | ✅ |

**Nunca hay un dead-end**: al hacer click en un contenido bloqueado se abre un panel cálido con "Regístrate gratis" y "Ya tengo cuenta".

### Estados de suscripción

Cada usuario tiene un doc `usuarios/{uid}` con un bloque `subscription` que puede estar en uno de estos cuatro estados:

- `trial` — período de 30 días, arranca al aceptar consent
- `activa` — suscripción de pago activa (aún sin implementar, campos listos para provider/plan/renewsAt)
- `cortesia` — regalo con fecha de expiración y valor CLP anclado ("acceso valorado en $1.990")
- `vencida` — sin acceso; el usuario ve la app en modo lectura pública

### Panel de administración

`/admin/usuarios` (solo superadmin) muestra la lista completa de leads y suscriptores con filtros por estado y fuente, acciones por fila (dar cortesía, extender trial, dar/quitar autoría, eliminar cuenta), y un botón **Descargar CSV** que exporta todo para trabajar la lista de leads fuera de la app.

Para dar cortesía: click en "Dar cortesía" en la fila del usuario → elige fecha de expiración + monto CLP + nota interna. El usuario ve automáticamente su nuevo estado en `/cuenta` con el mensaje "acceso de regalo valorado en $X".

### Constantes de negocio

- Trial: **30 días** (`TRIAL_DAYS` en `src/lib/schema/usuario.ts`).
- Precio mensual público: **$1.990 CLP** (`MONTHLY_PRICE_CLP` en `src/lib/pricing.ts`).
- Precio anual público: **$19.990 CLP** (`ANNUAL_PRICE_CLP`) — equivale a 10 meses; ahorra 2 (`ANNUAL_SAVINGS_MONTHS`).
- Nombres, bajadas y fechas de secciones (activa, próxima, futura) viven en **`src/lib/marca.ts`**. `SECCION_PROXIMA.nombre` es provisional (`"Batch Cooking Pollo"`): al cambiarlo ahí se propaga a todas las superficies.
- Contador de leads: `metrics/registrations` en Firestore. Incrementa automáticamente en cada primer signin y por fuente cuando el usuario responde "cómo nos conociste".

### Recetas destacadas (preview gratuito)

Cinco recetas están marcadas con `destacadaPreview: true` y son visibles sin cuenta — sirven como muestra del contenido para convertir visitantes en cuentas registradas.

**Seed inicial** (una sola vez, después de tener recetas en Firestore):

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run seed:featured
```

Marca automáticamente una receta por tipo de comida (desayuno, almuerzo, merienda, cena, colación), eligiendo la de menor `numero`. Para forzar un set específico:

```
FEATURED_IDS=slug-1,slug-2,slug-3 npm run seed:featured
```

Para cambiar qué recetas son destacadas después: entra a `/admin/recetas/[slug]/editar` y marca/desmarca **"Mostrar como receta gratis"**. El script `seed:featured` es aditivo — nunca desmarca — así que se puede correr sin miedo.

### Rangos de edad de las etapas

La auto-selección de etapa según la edad del bebé usa dos campos numéricos en cada doc de `etapa`: `edad_min_meses` y `edad_max_meses`. Backfill inicial:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run backfill:etapa-edad
```

Aplica: etapa-1: 6-9m · etapa-2: 10-11m · etapa-3: 12-24m. Todo cálculo de edad usa `America/Santiago` para no perder días por husos horarios.

### Pendientes explícitos

- **Emails transaccionales**: hay `// TODO` markers en `startTrial` (bienvenida) y donde debería ir el aviso "3 días antes de vencer". No hay integración con proveedor de correo aún.
- **Verificación de email**: no se exige. El trial arranca sin verificar. Firebase igual guarda `emailVerified: false` — se puede activar un banner "verifica tu correo" en un ciclo futuro.
- **Eliminación de cuenta**: el botón en `/cuenta` abre un `mailto:` a Amneris. Un endpoint dedicado que gatille el workflow legal queda pendiente.
- **Política de privacidad**: `/privacidad` tiene el borrador base cubriendo Ley 21.719. Requiere revisión de un abogado antes del lanzamiento público.

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
