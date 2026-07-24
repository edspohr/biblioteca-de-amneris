# Manual de Amneris

Guía para usar el panel de autoría de "Bocaditos del Corazón".

Este manual está pensado para hacerse a un lado del computador: acá está todo lo que necesitas para el día a día. Si algo no está aquí o algo no funciona, mira la sección **Si algo falla** al final.

---

## Cómo entrar

1. Abre <https://biblioteca-amneris.web.app/admin> en el navegador.
2. Te va a pedir iniciar sesión. Usa tu correo `amnerispinto@gmail.com` y la contraseña que te compartió Edmundo. Si prefieres, puedes iniciar sesión con Google directamente (mismo correo).
3. Ya estás dentro del panel. Vas a ver un banner amarillo arriba que dice "Modo autoría" con tu correo — así sabes que estás en el lugar correcto.

### Cambiar tu contraseña

Por ahora se hace desde Firebase Console. Pídele a Edmundo el enlace para "reset password" — es un clic y te llega un correo con instrucciones. Más adelante habrá un botón en el panel.

### Cerrar sesión

Botón "Cerrar sesión" arriba a la derecha, dentro del banner amarillo. Úsalo siempre que uses un computador que no es tuyo.

---

## El panel por dentro

Arriba tienes un menú con estas secciones:

- **Inicio** — vista general con contadores y accesos rápidos.
- **Recetas** — tus 120 recetas.
- **Menús** — planificaciones semanales (13).
- **Ingredientes** — catálogo (114).
- **Alérgenos** — el catálogo de alérgenos que las recetas pueden marcar (14).
- **Técnicas** — glosario de métodos de cocina (12).
- **Usuarios** — las mamás que se han creado cuenta.
- **Asistente** — qué le están preguntando al bot.

---

## Editar una receta

1. Ve a **Recetas**.
2. Encuentra la receta en la lista. Click en su título — se abre la vista pública. Si sólo quieres editar, click en "Editar" en la última columna.
3. Vas a ver el formulario completo. Cambia lo que necesites — título, tipo de comida, tiempos, ingredientes, pasos, notas.
4. **Importante — variantes por etapa**: cada receta tiene 3 variantes (etapa 1, 2, 3). Cada variante tiene su propia textura y porción. Cámbialas independientemente si es necesario.
5. Botón **"Guardar cambios"** abajo. Si algo tiene error (por ejemplo un campo obligatorio vacío), te va a decir qué.
6. La página del lector se actualiza al toque — puedes verificar abriendo la receta en otra pestaña.

### Cambiar la foto de una receta

En la misma página de editar receta, arriba del formulario hay un bloque "Foto de la receta":

1. Muestra la foto actual (o "Esta receta aún no tiene foto").
2. Click en **"Elegir imagen"** y selecciona el archivo desde tu celular o computador. Acepta JPG, PNG o WebP. Máximo 10 MB.
3. Aparece "Subiendo…" un momento. Cuando termina, ves la foto nueva.
4. La foto se guarda automáticamente. No necesitas apretar nada más.

**Truco**: la foto se reencuadra automáticamente a 1200 px de ancho. Si mandas una foto rectangular, se muestra tal cual — no la recorta. Si prefieres cuadrada, recórtala tú antes de subirla.

### Crear una receta nueva

1. En **Recetas**, click en **"➕ Crear nueva receta"**.
2. Llena el formulario. El identificador (slug) se genera solo desde el título — no lo tienes que escribir.
3. Guarda. Sube la foto desde la página de editar.

### Eliminar una receta

En la lista, junto a "Editar", hay un botón "Eliminar". Te pide confirmar antes de borrar. **Ojo**: si la receta está usada en algún menú, el sistema te va a decir en cuáles y no te dejará borrarla hasta que la saques de todos los menús.

---

## Los menús

Los menús son planificaciones semanales: para cada día (lunes a domingo) y cada momento (desayuno, almuerzo, merienda, cena, colación), eliges una receta.

### Crear un menú nuevo

1. Ve a **Menús** → **"➕ Crear nuevo menú"**.
2. Pon un nombre (ej. "Semana 3 · Etapa 2").
3. Elige la etapa a la que va dirigido.
4. En la grilla grande, para cada casilla (día × momento) elige una receta del desplegable. Puedes dejar casillas vacías si no aplica.
5. **Vista previa mágica**: abajo se calcula automáticamente la **lista de compras** derivada del menú, agrupada por categoría del supermercado (verduras, lácteos, cereales, etc.). Cambia el menú y la lista se recalcula al toque.
6. Guarda.

### Editar o eliminar un menú

Igual que recetas: botones en la lista. Eliminar un menú es seguro — no afecta a las recetas que estaban dentro.

---

## Ingredientes, alérgenos y técnicas

Estas son listas simples: nombre + categoría. Se editan igual que las recetas — click en Editar, cambias, guardas.

**Reglas importantes al borrar**:

- Si intentas borrar un **ingrediente** que está usado en X recetas, el sistema te bloquea y te muestra en cuáles. Primero saca el ingrediente de esas recetas, después bórralo.
- Lo mismo con **alérgenos** y **técnicas**.

Esto previene que se rompa una receta por descuido.

---

## Usuarios

Cada mamá que se crea cuenta en la landing aparece en esta lista.

### Ver quién se ha registrado

Ve a **Usuarios**. La tabla muestra: correo, nombre, cuándo se registró, cómo (Google o correo), si está activa, y si tiene permisos de autoría (superadmin).

Arriba ves tres números: total de cuentas, cuántas se registraron este mes, y cuántas tienen autoría (deberían ser 2: la tuya y la de Edmundo).

Puedes **buscar** por correo o nombre en el campo de arriba.

### Crear una cuenta manualmente

A veces querrás crear una cuenta para alguien (por ejemplo, una amiga sin correo Gmail):

1. Click en **"Crear cuenta manualmente"** para expandirlo.
2. Escribe el correo (obligatorio) y el nombre (opcional).
3. Click en **"Crear cuenta"**.
4. Aparece un **enlace de invitación** en un campo largo. Cópialo con Cmd+C.
5. Pégalo en un WhatsApp o correo a esa persona. Al abrirlo, ella elige su propia contraseña.

### Dar/quitar permisos de autoría

En la fila de un usuario, hay un botón "Dar autoría" o "Quitar autoría". Al hacer click, el sistema te pide confirmar y te explica qué significa. Sólo hazlo con personas de confianza — un superadmin puede editar y borrar todo el libro.

**No puedes quitarte los permisos a ti misma**: el botón está deshabilitado en tu propia fila. Esto es a propósito, para que no te quedes sin acceso por error.

### Deshabilitar o eliminar una cuenta

- **Deshabilitar** = la cuenta sigue existiendo pero no puede iniciar sesión. Reversible.
- **Eliminar** = borrar la cuenta para siempre. No reversible.

Ambos botones te piden confirmar. **No puedes deshabilitar ni eliminar tu propia cuenta**.

### Reenviar el enlace de invitación

Si alguien perdió su invitación o su contraseña, en su fila hay un botón "Enlace de invitación" que genera uno nuevo. Se lo compartes por WhatsApp.

---

## El asistente

En cada página pública del libro hay un botón flotante abajo a la derecha ("Pregunta al libro"). Las mamás lo abren y le preguntan cosas al bot: recetas rápidas, menús para cierta edad, sugerencias con lo que tienen en casa.

### Qué ver en Admin → Asistente

Esta página te muestra las preguntas más frecuentes de los últimos 30 días:

- Cuántas veces se hizo cada pregunta (aproximado — agrupa preguntas similares).
- Qué herramientas usó el bot para responder.
- Cuándo fue la última vez.

Es información para ti: si ves que muchas preguntan lo mismo, quizás vale la pena crear una receta o menú específico. O ajustar las que ya existen.

**Lo que NO se guarda**: la respuesta completa del bot ni la conversación entera. Sólo la pregunta y un resumen corto (150 caracteres). Los mensajes se borran automáticamente después de 30 días.

### Cuándo el asistente NO responde

- **Preguntas médicas** (alergias, fiebre, síntomas, crecimiento) — el bot cariñosamente redirige al pediatra.
- **Preguntas fuera del libro** (política, otras recetas, tiempo) — el bot dice que sólo puede hablar del libro.
- **Alguien preguntó demasiado**: hay un límite de 20 preguntas por hora y 100 por día por sesión. Es para controlar costos.

### Cuánto cuesta el asistente

Cada pregunta cuesta ~USD 0.001 (una décima de centavo). 10.000 preguntas al mes = USD 10. Ver [INFORME_FINAL.md](INFORME_FINAL.md) para el desglose completo.

---

## El lector

Igual que cualquier visitante, puedes ver el libro público desde `/libro`. Todo lo que edites en el panel se refleja al toque en el lector (no hay que esperar a "publicar").

---

## Si algo falla

Manda un mensaje a Edmundo con:

1. **Pantallazo** de lo que ves.
2. **Qué estabas haciendo** justo antes.
3. **Qué esperabas que pasara** vs. **qué pasó**.

Si es urgente (por ejemplo, la landing no carga o alguien no puede iniciar sesión), avísale por WhatsApp.

**No borres nada por prueba** si no entiendes qué está pasando. Es mucho más fácil arreglar algo que aún existe que recuperar algo borrado.

### Errores comunes

- **"No se pudo guardar. Intenta de nuevo en unos segundos."** — problema temporal de conexión con Firebase. Espera 5 segundos y guarda de nuevo. Si persiste, avisa.
- **"No se puede eliminar: se usa en N recetas/menús"** — no es un error, es una protección. Ver arriba.
- **"Tu cuenta no tiene permisos de autoría."** — te salió del `superadmin`. Avisa a Edmundo, corre `npm run seed:superadmins` y vuelve.
- **La foto que subí no aparece** — refresca la página con Cmd+Shift+R. Si sigue igual, avisa.

---

## Notas para el futuro

- Cuando quieras confirmar los datos pendientes de la landing (biografía, foto real, etc.), abre [PENDIENTES_VERIFICAR.md](PENDIENTES_VERIFICAR.md) y márcalos.
- Si en algún momento decidimos cobrar por el libro, hay que hacer varias cosas primero (proveedor de pagos, términos, boletas). Ver [INFORME_FINAL.md](INFORME_FINAL.md) para el detalle.
