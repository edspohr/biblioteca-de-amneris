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
