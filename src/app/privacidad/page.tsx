import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — La Biblioteca de Amneris",
  description:
    "Cómo tratamos tus datos en La Biblioteca de Amneris. Cumplimos con la Ley 21.719 de protección de datos personales de Chile.",
};

export default function PrivacidadPage() {
  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "1rem 0" }}>
      <p
        style={{
          background: "#FFF3D6",
          color: "#7A5A00",
          padding: "0.75rem 1rem",
          borderRadius: 8,
          fontSize: "0.9rem",
        }}
        role="note"
      >
        📝 <strong>Borrador para revisión legal.</strong> Este texto es un
        placeholder que cubre los mínimos de la Ley 21.719 (Chile) y será
        reemplazado por la versión definitiva antes de la salida a producción.
      </p>

      <h1>Política de privacidad</h1>
      <p>
        La Biblioteca de Amneris (en adelante, &quot;la aplicación&quot;) es un
        servicio digital operado por Amneris Pinto, con domicilio en Chile,
        que ofrece contenidos de alimentación complementaria para bebés y
        niños pequeños.
      </p>

      <h2>Qué datos recopilamos</h2>
      <ul>
        <li>
          <strong>Datos de la cuenta:</strong> correo electrónico, nombre
          (opcional), método de autenticación (Google o correo con
          contraseña).
        </li>
        <li>
          <strong>Datos del bebé:</strong> nombre (opcional) y fecha de
          nacimiento. Se utilizan únicamente para calcular la etapa de
          alimentación y personalizar recomendaciones dentro de la
          aplicación.
        </li>
        <li>
          <strong>Datos de contacto y atribución:</strong> teléfono/WhatsApp
          y cómo nos conociste. Ambos opcionales.
        </li>
        <li>
          <strong>Datos de uso:</strong> registros mínimos técnicos para
          operar el servicio (fecha del último ingreso, estado de tu
          suscripción).
        </li>
      </ul>

      <h2>Para qué usamos tus datos</h2>
      <ul>
        <li>Personalizar el contenido según la edad de tu bebé.</li>
        <li>Gestionar tu período de prueba y, más adelante, tu suscripción.</li>
        <li>
          Contactarte solo cuando sea necesario (avisos de tu cuenta o
          novedades importantes; nunca compartimos tu correo con terceros).
        </li>
      </ul>

      <h2>Base legal (Ley 21.719)</h2>
      <p>
        El tratamiento se realiza en base a tu consentimiento explícito,
        otorgado al registrarte. Puedes retirarlo en cualquier momento
        escribiendo al correo de contacto.
      </p>

      <h2>Con quién compartimos tus datos</h2>
      <p>
        Los datos se almacenan en Google Firebase (Firestore, Authentication,
        Cloud Storage y App Hosting), en centros de datos de Google Cloud.
        No compartimos datos con terceros con fines de marketing.
      </p>

      <h2>Retención</h2>
      <p>
        Conservamos tu perfil mientras tu cuenta esté activa. Si solicitas la
        eliminación de tu cuenta, borramos tus datos personales dentro de 30
        días, excepto lo que la ley nos obligue a conservar.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Tienes derecho a acceder, rectificar, cancelar y oponerte al
        tratamiento de tus datos personales. Para ejercerlos escribe a{" "}
        <a href="mailto:amnerispinto@gmail.com">amnerispinto@gmail.com</a>.
      </p>

      <h2>Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política. La versión vigente estará siempre
        publicada en <code>/privacidad</code>. Cambios significativos se
        avisarán por correo.
      </p>

      <p style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem", marginTop: "2rem" }}>
        Versión: borrador 2026-09-01.
      </p>
    </article>
  );
}
