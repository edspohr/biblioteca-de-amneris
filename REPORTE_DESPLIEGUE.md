# Reporte de despliegue — Bocaditos del Corazón

**Fecha:** 2026-07-23
**Estado del build:** `npm run build` pasa limpio, 16 rutas, sin warnings.
**Alcance:** este informe es solo diagnóstico. No aplica ningún cambio de código; corresponde al **próximo ciclo** (integración con Firebase, ya provisionado).

---

## Resumen ejecutivo

La aplicación funciona hoy porque usa el filesystem local como base de datos: cada catálogo (recetas, ingredientes, alérgenos, técnicas, menús) vive en un archivo JSON dentro de `data/`, y el admin lo modifica escribiendo directamente sobre esos archivos.

En cualquier host serverless — **Firebase App Hosting incluido** — el sistema de archivos del contenedor de ejecución es **efímero y de solo lectura para la carpeta del bundle**. Esto significa que:

- Las lecturas siguen funcionando (los JSON quedan empaquetados con la app).
- **Toda escritura del admin fallará o se perderá** al siguiente despliegue.
- El fallo hoy no está manejado con gracia: se muestra al usuario un `500 Internal Server Error` con el mensaje bruto del sistema operativo (`EROFS: read-only file system` o similar).

El plan para el ciclo Firebase es reemplazar `json-adapter.ts` por un adaptador `FirestoreRepo` **detrás de la misma interfaz `src/lib/repo/`**, sin cambiar ni una línea del resto del código. La regla de acceso único al repositorio (`feedback-repo-only`) fue diseñada precisamente para esto.

---

## Inventario exhaustivo de escrituras al filesystem

Todas las escrituras del código productivo (`src/`) ocurren en un solo archivo:
[src/lib/repo/json-adapter.ts](src/lib/repo/json-adapter.ts).

### 1. `writeJson()` — helper interno

**Ubicación:** [src/lib/repo/json-adapter.ts:30-33](src/lib/repo/json-adapter.ts#L30-L33)

```ts
async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, stableStringify(data) + "\n", "utf8");
}
```

Utilizado por todas las mutaciones del catálogo. `fs.mkdir` intentará crear directorios y `fs.writeFile` escribirá el archivo. En producción serverless ambas fallan con `EROFS` o `ENOENT` según el host.

### 2. Ingredientes

- **`saveIngrediente()`** — [json-adapter.ts:57-65](src/lib/repo/json-adapter.ts#L57-L65). Escribe `data/ingredientes.json` completo tras mutar en memoria.
- **`deleteIngrediente()`** — [json-adapter.ts:66-69](src/lib/repo/json-adapter.ts#L66-L69). Idem.

Consumido por: `PUT /api/ingredientes/[id]`, `POST /api/ingredientes`, `DELETE /api/ingredientes/[id]`, y la UI del admin en [src/app/admin/ingredientes/](src/app/admin/ingredientes/).

### 3. Alérgenos

- **`saveAlergeno()`** — [json-adapter.ts:75-83](src/lib/repo/json-adapter.ts#L75-L83).
- **`deleteAlergeno()`** — [json-adapter.ts:84-87](src/lib/repo/json-adapter.ts#L84-L87).

Consumido por las rutas `POST/PUT/DELETE /api/alergenos*` y la UI en [src/app/admin/alergenos/](src/app/admin/alergenos/).

### 4. Técnicas

- **`saveTecnica()`** — [json-adapter.ts:97-105](src/lib/repo/json-adapter.ts#L97-L105).
- **`deleteTecnica()`** — [json-adapter.ts:106-109](src/lib/repo/json-adapter.ts#L106-L109).

Consumido por `POST/PUT/DELETE /api/tecnicas*` y [src/app/admin/tecnicas/](src/app/admin/tecnicas/).

### 5. Recetas (el más crítico)

- **`saveReceta()`** — [json-adapter.ts:132-135](src/lib/repo/json-adapter.ts#L132-L135). Escribe un archivo por receta en `data/recetas/{id}.json`.
- **`deleteReceta()`** — [json-adapter.ts:136-139](src/lib/repo/json-adapter.ts#L136-L139). Hace `fs.unlink()` del archivo de la receta.

Consumido por `POST/PUT/DELETE /api/recetas*` y por el editor completo en [src/app/admin/recetas/](src/app/admin/recetas/). Es la superficie más grande y más usada del admin: crear una receta nueva, editar sus ingredientes, editar sus pasos, subir fotos, etc.

### 6. Menús

- **`saveMenu()`** — [json-adapter.ts:149-157](src/lib/repo/json-adapter.ts#L149-L157).
- **`deleteMenu()`** — [json-adapter.ts:158-161](src/lib/repo/json-adapter.ts#L158-L161).

Consumido por las rutas de menús (nota: hoy no hay API pública de menús ni admin de menús — la mutación queda expuesta solo si se agrega una ruta más adelante).

### 7. Fotos de recetas

Las 120 fotos viven en [public/images/recetas/](public/images/recetas/) y se sirven como archivos estáticos. **No hay ninguna ruta que suba fotos** hoy; si Amneris crea una receta nueva en el admin, tendrá el campo `foto` vacío o apuntando a un archivo que no existe.

### 8. Reads del filesystem (no fallan en serverless, pero importa mapearlos)

Todo se lee vía [src/lib/repo/json-adapter.ts](src/lib/repo/json-adapter.ts) desde `data/`. En serverless estos archivos van dentro del bundle y son legibles. Cada request lee y parsea el JSON completo — no hay caché — así que la latencia crece con el tamaño del catálogo. Con 120 recetas es imperceptible; a 500 empieza a notarse.

### 9. Scripts fuera del alcance (no se ejecutan en producción)

`scripts/extract.ts` y `scripts/migrate-variantes.ts` también escriben al filesystem, pero solo corren localmente para regenerar los JSON desde el manuscrito. No son código servido, así que están fuera del ámbito de este reporte.

---

## Comportamiento actual cuando una escritura falla

El código NO tiene manejo específico para errores de filesystem. La cadena de fallo típica en producción sería:

**Ruta afectada:** cualquier `PUT`/`POST`/`DELETE` bajo `/api/*`. Ejemplo con [src/app/api/recetas/[id]/route.ts](src/app/api/recetas/[id]/route.ts):

```ts
export async function PUT(req, { params }) {
  try {
    ...
    await repo.saveReceta(parsed);   // <-- lanza EROFS aquí
    return NextResponse.json(parsed);
  } catch (err) {
    return handleZodError(err);      // <-- absorbe el error
  }
}
```

`handleZodError()` ([src/lib/api-errors.ts:20-29](src/lib/api-errors.ts#L20-L29)) captura cualquier error no-Zod y devuelve **HTTP 500** con `{ "error": "EROFS: read-only file system, open '/var/task/data/recetas/xxx.json'" }`. En el cliente esto se traduce en un mensaje de error crudo del sistema operativo — no en un mensaje amigable en español.

Peor: `DELETE` en [route.ts:26-35](src/app/api/recetas/[id]/route.ts#L26-L35) **no tiene try/catch**. Un fallo de `fs.unlink()` genera una promise rejection sin manejar; Next.js devuelve un 500 vacío. La UI del admin no lo interpreta y probablemente muestra "eliminado" a pesar de que la operación falló.

**Resultado percibido por Amneris:**
- Crear/editar receta desde el admin en prod → mensaje de error críptico en inglés, el trabajo se pierde.
- En el mejor caso (host que permite escritura temporal, como algunos entornos experimentales), el trabajo parece guardarse pero **se pierde al siguiente despliegue** porque el filesystem del contenedor se recrea desde el bundle inmutable.
- Lectura de recetas para lectores finales → funciona correctamente.

---

## Modo de fallo por host

| Aspecto | Firebase App Hosting | Vercel | Cloudflare Pages | Node en VPS |
|---|---|---|---|---|
| Lectura de `data/*.json` | ✅ funciona (dentro del bundle) | ✅ | ✅ | ✅ |
| Lectura de `public/images/` | ✅ servido como estático | ✅ | ✅ | ✅ |
| Escritura del admin | ❌ EROFS | ❌ EROFS | ❌ EROFS | ✅ persiste (pero requiere backup manual) |
| Persistencia entre deploys | ❌ se sobreescribe | ❌ | ❌ | ✅ |

Firebase App Hosting corre la app en un contenedor Cloud Run administrado. El filesystem del bundle es de solo lectura; existe `/tmp` como escritura temporal, pero se recicla con el contenedor y no se comparte entre instancias, así que es inservible como storage.

---

## Plan recomendado para el próximo ciclo

El proyecto Firebase `biblioteca-amneris` ya está aprovisionado (App Hosting + Firestore + Storage). El brief del próximo ciclo debería cubrir:

1. **`FirestoreRepo` detrás de la interfaz existente.** Crear `src/lib/repo/firestore-adapter.ts` que expone exactamente las mismas funciones que `json-adapter.ts` (misma firma, mismo comportamiento). El `index.ts` del repo decide cuál usar según entorno (`FIRESTORE_PROJECT` presente → Firestore, ausente → JSON local para desarrollo). **Cero cambios fuera del repo.**
2. **Migración inicial**: script one-shot que lee `data/*.json` y `data/recetas/*.json` y hace `set()` en Firestore. Se puede correr desde local con Application Default Credentials.
3. **Storage para fotos**: subir `public/images/recetas/` a Firebase Storage; añadir un endpoint de admin para subir fotos nuevas; guardar la URL pública en `receta.foto` en vez de la ruta local.
4. **Configuración**: mover las credenciales web a `NEXT_PUBLIC_FIREBASE_*` en `.env.local` (ya guardadas en la memoria de este proyecto para ese momento). Crear `apphosting.yaml` con las variables de entorno.
5. **Reglas de seguridad de Firestore**: por defecto todo denegado. Admin necesita auth (probablemente Firebase Auth con un solo email autorizado — el de Amneris). Lectura pública para catálogos y recetas.
6. **Manejo de errores del repo**: envolver las escrituras del repo con un catch específico que devuelva 503 + mensaje en español ("No se pudo guardar. Reintenta en unos segundos.") en vez de exponer `EROFS`. Esto vale para hoy y para mañana.
7. **App Check** para prevenir abuso del endpoint de escritura.

**Coste estimado del ciclo:** entre 4 y 8 horas dependiendo de si se hace también la subida de fotos.

**Riesgo bajo:** el contrato del repo está bien delimitado — si el `FirestoreRepo` implementa las mismas firmas, ningún componente ni ruta necesita modificarse.
