import Link from "next/link";
import { repo } from "@/lib/repo";
import { ColeccionForm } from "../coleccion-form";

export default async function NuevaColeccionPage() {
  const colecciones = await repo.getColecciones().catch(() => []);
  const siguienteOrden = colecciones.reduce((m, c) => Math.max(m, c.orden), 0) + 1;
  return (
    <>
      <p className="admin-back">
        <Link href="/admin/colecciones">← Colecciones</Link>
      </p>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Nueva colección</p>
          <h1 className="admin-head__title">Un libro nuevo para tu biblioteca</h1>
          <p className="admin-head__lede">
            Parte como borrador: solo tú la ves hasta que decidas anunciarla o
            programar su publicación.
          </p>
        </div>
      </header>
      <ColeccionForm initial={null} siguienteOrden={siguienteOrden} />
    </>
  );
}
