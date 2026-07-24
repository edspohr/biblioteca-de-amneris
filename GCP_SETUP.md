# Configuración de Google Cloud — Bocaditos del Corazón

Pasos únicos en la consola de Google Cloud antes de que el asistente
funcione en el proyecto `biblioteca-amneris`. Todo se hace una vez.

## 1. Habilitar Vertex AI

1. Abre: <https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=biblioteca-amneris>
2. Botón **"Habilitar"** (Enable).
3. Espera a que confirme (30-60 s).

Sin esto, `POST /api/asistente` devuelve un error al primer llamado.

## 2. IAM: rol de Vertex AI para la cuenta de servicio

La misma cuenta de servicio (`serviceAccountKey.json`) que usa Firebase
Admin necesita permiso para llamar a Vertex AI.

1. Abre: <https://console.cloud.google.com/iam-admin/iam?project=biblioteca-amneris>
2. Encuentra la fila de la cuenta de servicio que usa la app. Suele
   llamarse `firebase-adminsdk-XXXXX@biblioteca-amneris.iam.gserviceaccount.com`
   (la que descargaste como `serviceAccountKey.json`).
3. Botón lápiz (✏) → **"Agregar otro rol"** → busca **"Vertex AI User"**
   (o `roles/aiplatform.user`) → **Guardar**.

Cuando App Hosting despliegue, su cuenta de servicio de runtime también
necesita este rol. Para averiguar cuál es:

- Firebase Console → App Hosting → tu backend → pestaña **Configuración**
  → verás la Service Account asignada (algo como
  `<projectnumber>-compute@developer.gserviceaccount.com` o
  `firebase-app-hosting-compute@biblioteca-amneris.iam.gserviceaccount.com`).
- Agrégale el mismo rol **Vertex AI User** en IAM.

## 3. (Opcional) Ajustar región del modelo

Por defecto uso `us-central1` para Gemini. Si prefieres otra región
soportada (por ejemplo `southamerica-east1`), define
`VERTEX_LOCATION=southamerica-east1` en `.env.local` y en `apphosting.yaml`.

## Verificación

Con Vertex habilitado y el rol asignado, corre localmente:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npm run dev
```

Abre <http://localhost:3000/>, haz clic en el botón flotante "Pregunta al
libro" y pregunta: *"Recetas rápidas con pollo"*. Debería responder con
recetas reales enlazadas a `/recetas/…`.

Si aparece un error de la API, revisa:

- `Vertex AI API` habilitada en el proyecto correcto.
- La cuenta de servicio en `serviceAccountKey.json` tiene el rol.
- La región de `VERTEX_LOCATION` soporta Gemini 2.5 Flash
  (todas las regiones estándar lo hacen a fecha 2026-07).

---

## 4. App Check enforcement (Fase 6)

App Check ya está inicializado en el cliente (reCAPTCHA v3). Falta encender el
enforcement en la consola para que los servicios de Firebase rechacen las
llamadas sin token. Con el enforcement encendido, un scraper que use tu API
key expuesta en el bundle no puede robar cuota de Firestore/Storage/Auth.

### Paso previo: registrar la app en App Check

Solo si no está registrada aún.

1. Abre: <https://console.firebase.google.com/project/biblioteca-amneris/appcheck>
2. Pestaña **Apps** → busca `biblioteca-amneris-web` → **Registrar**.
3. Proveedor **reCAPTCHA v3**. Pega la **secret key** de reCAPTCHA (la de
   <https://www.google.com/recaptcha/admin>, distinta del site key que ya
   está en `.env.local`).
4. TTL del token: deja el default (1 hora).
5. **Guardar**.

### Encender enforcement — uno por uno

En la misma pantalla App Check, pestaña **APIs**. Verás una lista de servicios
(Authentication, Cloud Firestore, Cloud Storage, Vertex AI, etc.), cada uno con
tres modos: **Unenforced**, **Monitor**, **Enforced**.

Recomendado, en este orden:

1. **Cloud Firestore** → Enforced. Si algo del reader deja de cargar, pasa a
   Monitor y avisa.
2. **Cloud Storage** → Enforced. Igual: si las fotos dejan de cargar, Monitor.
3. **Authentication** → Enforced. Prueba iniciar sesión y crear cuenta ANTES
   de dejarlo. Si sign-up rompe, Monitor.

**No es necesario habilitarlo en Vertex AI** — el asistente llama a Vertex desde
el servidor, no desde el cliente. La verificación de token en `/api/asistente`
la hace nuestro código (ver `APP_CHECK_ENFORCE` abajo).

### Debug token para desarrollo local

Con enforcement encendido, tu dev local se bloquea porque `localhost` no puede
resolver el desafío de reCAPTCHA. Solución:

1. Levanta `npm run dev` y abre la app en el navegador.
2. Abre la consola (F12) → busca una línea tipo
   `[App Check] Debug token: 12345678-ABCD-...`. Cópiala.
3. Pega en `.env.local`:
   ```
   NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=12345678-ABCD-...
   ```
4. En Firebase Console → App Check → pestaña **Apps** →
   `biblioteca-amneris-web` → menú de tres puntos → **Manage debug tokens** →
   **Add debug token**. Pega el mismo string.
5. Reinicia `npm run dev`. Ya no te bloquea.

### Encender la verificación en /api/asistente

En `.env.local` (y luego en `apphosting.yaml` para producción):

```
APP_CHECK_ENFORCE=true
```

Con `false` (o sin definir), el endpoint acepta llamadas sin token pero
verifica los que sí llegan. Útil durante la migración.
