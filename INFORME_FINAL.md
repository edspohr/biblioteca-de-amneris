# Informe final — Bocaditos del Corazón

**Fecha:** 2026-07-24
**Ciclo:** Fases 1–6 completas. Auth, Firestore, Storage, plataforma superadmin, landing, asistente con Gemini, hardening.
**Estado del build:** limpio, TypeScript pasa sin errores, 34/34 tests de reglas pasan, ~266 KB de JS gzipped (todos los chunks combinados, worst-case).

---

## 1. Estimación de costos operativos

Costos estimados a tres niveles de tráfico, en USD/mes. Asume que la app está desplegada en **Firebase App Hosting** con Firestore + Storage + Vertex AI + Auth.

### 1.1 Supuestos

Por cada **visita al lector** (una persona abre el sitio y navega un rato):

- **App Hosting**: 1 request al SSR + ~15 hits estáticos (chunks, imágenes ya cacheadas por CDN después de la primera). Cloud Run cobra por CPU-segundo; asumo 0.2 s de CPU por request SSR y despreciable para estáticos.
- **Firestore reads**: ~10 lecturas por sesión (home + una receta + un menú, cada una hace 2-4 reads).
- **Firestore writes**: ~1 por sesión (mirror doc si iniciaron sesión, pero solo la primera vez del día).
- **Storage bandwidth**: ~500 KB de fotos WebP servidas (~5 fotos por sesión, cache aggressively).
- **Auth**: 1 sesión iniciada / rate de sign-up.
- **Asistente**: asumo que **1 de cada 4 visitas** usa el bot con **3 mensajes** promedio → 0.75 mensajes/visita.

Por **mensaje al asistente**:

- Vertex Gemini 2.5 Flash: ~1.5K tokens input (system prompt + history + tool results) + ~200 tokens output. A precios de julio 2026 (USD 0.30/1M input, 2.50/1M output): **~USD 0.001 por mensaje**.
- Firestore: 2 writes (log + rate limit) + 1 read (rate limit check). Precios Firestore: writes USD 1.80/millón, reads USD 0.60/millón. Redondea a costo despreciable a estos volúmenes.

### 1.2 Cuadro de costos

| Servicio | 100 visitas/mes | 1 000 visitas/mes | 10 000 visitas/mes |
|---|---:|---:|---:|
| **App Hosting (Cloud Run)** | $0.00* | $0.15 | $1.50 |
| **Firestore reads** (1 000 / 10 000 / 100 000) | $0.00 | $0.01 | $0.06 |
| **Firestore writes** (100 / 1 000 / 10 000) | $0.00 | $0.01 | $0.02 |
| **Storage bandwidth** (50 MB / 500 MB / 5 GB) | $0.01 | $0.06 | $0.60 |
| **Storage almacenamiento** (~40 MB constante) | $0.01 | $0.01 | $0.01 |
| **Firebase Auth** (activos únicos) | $0.00 | $0.00 | $0.00† |
| **Vertex Gemini 2.5 Flash** (75 / 750 / 7 500 msgs) | $0.08 | $0.75 | $7.50 |
| **App Check** (reCAPTCHA v3, 1M gratis) | $0.00 | $0.00 | $0.00 |
| **TOTAL estimado USD/mes** | **~$0.10** | **~$1.00** | **~$9.70** |
| TOTAL en CLP (a 1 USD = 950 CLP) | ~$100 | ~$950 | ~$9 200 |

\* App Hosting tiene 2M requests + 360k GB-s de compute gratis al mes; a 100 visitas ni te acerca.
† Auth es gratis en Blaze hasta 50k MAU. A 10 000 visitas/mes probablemente estás en el orden de 1 000-5 000 usuarios registrados — muy por debajo del gratuito.

**Costo variable dominante: el asistente.** A 10 000 visitas/mes con 25% de usuarios pidiéndole 3 preguntas, el bot es **~77% del costo total**.

### 1.3 Peores casos y mitigaciones

- **Abuso del bot** — sin rate limit, alguien scrapeando 100 msgs/segundo cuesta USD 8.6/hora. Ya está mitigado con 20/hora + 100/día por sesión. Un atacante que rote sesiones podría escapar; App Check enforcement + verificación del token en el endpoint sería el próximo cinturón (Fase 6 lo implementó, sólo falta encender `APP_CHECK_ENFORCE=true`).
- **Foto pesada subida al Storage** — límite hard de 10 MB en el endpoint + resize obligatorio a 1200 px WebP. Amneris no puede accidentalmente subir un raw de 40 MB.
- **Firestore reads en spike** — el layout hace `getEtapas()` en cada request. Si el tráfico se multiplica x100, agregar ISR + on-demand revalidation baja los reads en dos órdenes de magnitud.

### 1.4 Piso realista

Aunque no venga nadie, hay costo mínimo:

- App Hosting min-instance 0 → **$0** cuando está frío.
- Firestore + Storage almacenamiento → **~$0.02/mes** por los ~150 documentos y 40 MB de fotos.
- reCAPTCHA v3 → gratis.
- Dominio custom (opcional, cuando se compre) → **~$12/año** (~$1/mes).

**Piso: ~$1-2/mes**, principalmente el dominio si lo compras.

---

## 2. Modelo de negocio: si algún día cobras

El plan del `MODELO_DE_NEGOCIO.md` del ciclo anterior (recetas-web v2, abril 2026) hipotetizaba estos precios:

| Producto | Precio CLP |
|---|---:|
| Trial 7 días | $990 |
| Suscripción mensual | $4 990 |
| Suscripción anual | $49 990 (2 meses de ahorro) |
| Libro individual | $9 990 |

### 2.1 Margen por suscriptor a los tres niveles de tráfico

Asumiendo el **precio mensual** de CLP 4 990 = **~USD 5.25** (a 1 USD = 950 CLP), y descontando fees típicos del procesador de pagos (5% + IVA en Chile con Flow/Transbank ≈ **~7% total**):

**Ingreso neto por suscriptor/mes: USD ~4.90**

Ahora la pregunta: ¿cuánto cuesta *servir* a un suscriptor? Depende de cuánto usa la app. Asumo:

- **Uso ligero** (5 visitas/mes al lector, 10 msgs al bot): costo variable ~USD 0.03/mes/usuario.
- **Uso medio** (20 visitas, 40 msgs): ~USD 0.10/mes/usuario.
- **Uso intenso** (60 visitas, 150 msgs): ~USD 0.35/mes/usuario.

A CLP 4 990/mes, incluso el uso intenso deja margen bruto del **93%** — el producto es rentable en cualquier escenario razonable de uso. **El gasto real de un negocio suscripción NO es la infra, es el CAC** (adquisición de clientes: publicidad, contenido, tiempo).

### 2.2 Punto de equilibrio para cubrir los costos actuales

A los tres niveles de tráfico, si un porcentaje X de visitantes se suscribiera:

| Tráfico | Costo mensual | Suscriptores necesarios (a CLP 4 990) | % de visitas convertidas |
|---|---:|---:|---:|
| 100 visitas/mes | $0.10 | 1 (con 1 pagas todo x50) | 1% |
| 1 000 visitas | $1 | 1 | 0.1% |
| 10 000 visitas | $10 | 3 | 0.03% |

Para que la infra sea rentable el número es trivial — 3 suscriptores mensuales cubren 10 000 visitas de infraestructura. **El verdadero costo del negocio está fuera de este informe** (tiempo de Amneris para producir contenido, publicidad, herramientas contables, honorarios de contador para la SpA, quizás un asistente virtual).

### 2.3 Un aviso importante

El precio de CLP 4 990/mes del modelo anterior estaba pensado para una biblioteca **que crece cada mes con contenido nuevo**. Hoy tienes **un libro terminado**. Cobrar suscripción mensual por un libro estático es cobrar un tour de un cuarto sin sala nueva. Antes de monetizar, decidir:

- **Modelo A (suscripción)**: comprometerse a producir contenido nuevo con regularidad (recetas nuevas mensuales, libros complementarios). Requiere disciplina editorial recurrente.
- **Modelo B (compra única)**: cobrar CLP 9 990 una vez por el libro. Sin obligación de contenido nuevo. Ingreso lineal con adquisición.
- **Modelo C (freemium)**: libro base gratuito (lo que tienes hoy). Cobrar por acceso al asistente ilimitado, o por menús premium, o por comunidad. Requiere construir el gate y decidir qué queda dentro/fuera del muro.

Cualquiera funciona técnicamente sobre la base actual. Cada uno tiene implicaciones de producto y trabajo diferentes.

---

## 3. Checklist antes de cobrar dinero

Lo que tienes hoy: producto listo, público, gratuito. Lo que **falta construir/definir** antes de aceptar el primer peso:

### 3.1 Legal / administrativo (fuera del código)

- [ ] **Régimen legal en Chile**: SpA o EIRL. Si vas por SpA (más flexible), constitución en Empresa en un Día (~1 semana, ~CLP 50 000 en gastos notariales/registro).
- [ ] **RUT y giro comercial** que incluya venta de contenido digital (52693 "Comercio al por menor de productos por Internet" o equivalente).
- [ ] **Cuenta corriente empresa** — Banco Chile / Estado / BCI.
- [ ] **Contador o software de contabilidad** — al menos Rindegastos + un contador por proyecto puntual. Presupuesta CLP 50 000-100 000/mes.
- [ ] **Términos y condiciones + política de privacidad** en español, con cláusula específica de "no reemplaza consejo médico". Un abogado los redacta por ~CLP 150 000-300 000, o adaptas plantillas conocidas y los revisa un abogado por menos.
- [ ] **Ley 19.628 (protección de datos personales)** — declarar el registro de titulares, especificar cómo se usan los datos de las mamás registradas.
- [ ] **Ley del consumidor (SERNAC)** — si es suscripción, botón de cancelación con la misma facilidad que el de contratación (Ley 21.398 "Pro Consumidor").

### 3.2 Proveedor de pagos

Para Chile específicamente:

- **Flow** (recomendado para inicio) — sin costo mensual, comisión ~3.5% + IVA por transacción, soporta suscripciones recurrentes, boletas electrónicas automáticas, integración directa vía API. Sirve para tarjetas + Webpay (débito).
- **Transbank** (institucional) — trato directo, más fricción para setup, útil si el volumen es alto.
- **Kushki / dLocal** — para expansión LATAM más adelante.
- **Stripe** — soporta Chile pero con menos métodos locales; mejor cuando expandes fuera de LATAM.
- **NO Hotmart** — el modelo anterior lo usaba, pero cobra 9-15% + IVA en Chile y saca al pagador del producto. Sobrecosto injustificable si el checkout puede vivir dentro de la app.

**Trabajo técnico estimado**: 2-3 días para integrar Flow (webhook para confirmar pagos, colección `pagos/{id}` en Firestore, gate en el reader que consulta `usuarios/{uid}.subscription`).

### 3.3 Facturación electrónica

En Chile toda venta a consumidor final requiere **boleta electrónica** emitida al SII. Alternativas:

- **Nubox** o **DFacil** o **Facturado** — servicios que emiten desde tu propio RUT, integran con Flow, y guardan las boletas. USD 8-15/mes.
- **Flow ya incluye boleta electrónica** en su plan Empresa (~CLP 15 000/mes) — si lo activas, no necesitas otro proveedor.

### 3.4 Producto (dentro del código)

Cambios que hay que hacer en la app antes de cobrar:

- [ ] **Modelo de suscripción en `usuarios/{uid}`**: nuevos campos `subscription: {status, tier, expiresAt, provider, providerId}`.
- [ ] **Webhook `/api/webhook/flow`** (o del proveedor elegido) que actualiza el status en Firestore.
- [ ] **Middleware / server-side gate**: si la ruta es "premium" y el usuario no tiene subscription activa, redirige al paywall. Requiere decidir *qué* es premium.
- [ ] **Página `/precios`** con los planes y CTA al checkout.
- [ ] **Auto-cancel en Firestore** cuando el proveedor notifica cancelación.
- [ ] **Recuperación de suscripción cancelada**: banner amigable en las páginas premium ofreciendo reactivar.
- [ ] **Página `/mi-cuenta`** para que el usuario vea su plan y pueda cancelar (botón obligatorio por ley chilena).

**Trabajo técnico estimado**: 5-7 días si el gate premium es simple (todas las recetas requieren suscripción). Si es más granular (algunos gratis, otros premium), agregar 2-3 días.

### 3.5 Contenido

- [ ] **Confirmar los datos de PENDIENTES_VERIFICAR.md**. En particular la biografía, endoso profesional, y contactos — antes de cobrar, la landing tiene que ser 100% verificable.
- [ ] **Decidir qué queda dentro/fuera** del muro (si eliges Modelo C freemium).

---

## 4. Prioridades sugeridas

Si tuviera que ordenar el trabajo post-Fase-6, sería:

1. **Bajarle a producción y darlo a conocer** — la app está lista. Deploy a App Hosting, comparte el link con 5-10 mamás cercanas, mira cómo lo usan. Semana 1.
2. **Confirmar los pendientes con Amneris** — biografía, contactos, foto. La landing gana mucho con la información real. Semana 1-2.
3. **Observar 4-6 semanas** — qué preguntan al asistente (usa la vista `/admin/asistente`), qué recetas leen, dónde se quedan mirando. Este ciclo es de aprendizaje de producto, no de features nuevas.
4. **Si hay uso real y crece**: decidir modelo de negocio (§ 2.3), montar la infraestructura legal (§ 3.1), integrar pagos (§ 3.4). 3-4 semanas de trabajo.
5. **Si algo grande sale del uso** — por ejemplo muchas piden algo específico que no está — decidir si vale la pena escribirlo antes de monetizar.

---

## Anexos

- Manual completo para Amneris: [MANUAL_AMNERIS.md](MANUAL_AMNERIS.md)
- Verificaciones pendientes en la landing: [PENDIENTES_VERIFICAR.md](PENDIENTES_VERIFICAR.md)
- Setup de Google Cloud (una vez): [GCP_SETUP.md](GCP_SETUP.md)
- README técnico general: [README.md](README.md)
