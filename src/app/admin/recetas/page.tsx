import Link from "next/link";
import { repo } from "@/lib/repo";
import { DeleteButton } from "./delete-button";

const TIPOS_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  colacion: "Colación",
};

export default async function AdminRecetasPage() {
  const recetas = await repo.getRecetas();

  return (
    <>
      <h1>Recetas</h1>
      <p>
        <Link href="/admin/recetas/nueva">➕ Crear nueva receta</Link>
      </p>
      <p className="muted">{recetas.length} recetas · cada una aplica a las 3 etapas</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Min</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recetas.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link href={`/recetas/${r.id}`}>{r.titulo}</Link>
                </td>
                <td>{TIPOS_LABEL[r.tipo_comida] ?? r.tipo_comida}</td>
                <td>{r.minutos_prep ?? "—"}</td>
                <td>
                  <Link href={`/admin/recetas/${r.id}/editar`}>Editar</Link>
                  {" · "}
                  <DeleteButton id={r.id} titulo={r.titulo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
