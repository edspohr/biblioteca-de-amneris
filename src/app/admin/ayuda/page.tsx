import Link from "next/link";

export default function AyudaPage() {
  return (
    <>
      <h1>Ayuda</h1>
      <p>
        Todo lo que necesitas para usar el panel está en el{" "}
        <strong>Manual de Amneris</strong>, un documento en lenguaje sencillo
        con el paso a paso de cada tarea:
      </p>
      <ul>
        <li>
          Cómo editar recetas y subir fotos
        </li>
        <li>
          Cómo crear menús con vista previa de lista de compras
        </li>
        <li>
          Cómo gestionar usuarios y otorgar/quitar permisos
        </li>
        <li>
          Qué muestra la vista del asistente
        </li>
        <li>
          Qué hacer si algo falla
        </li>
      </ul>

      <p>El manual vive junto al código:</p>
      <ul>
        <li>
          <strong>MANUAL_AMNERIS.md</strong> — guía completa del panel
        </li>
        <li>
          <strong>PENDIENTES_VERIFICAR.md</strong> — datos de la landing por confirmar
          contigo (biografía, endoso profesional, contactos)
        </li>
        <li>
          <strong>INFORME_FINAL.md</strong> — costos estimados y qué queda antes
          de cobrar dinero
        </li>
      </ul>

      <p style={{ marginTop: "1.5rem" }}>
        Si algo no está en el manual o algo no funciona, escríbele a Edmundo
        con un pantallazo y una descripción breve de qué estabas haciendo.
      </p>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/admin">← Volver al panel</Link>
      </p>
    </>
  );
}
