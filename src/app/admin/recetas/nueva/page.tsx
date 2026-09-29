import Link from "next/link";
import { repo } from "@/lib/repo";
import { ETAPA_IDS, type Receta, type VarianteEtapa } from "@/lib/schema";
import { RecetaForm } from "../receta-form";

export default async function NuevaRecetaPage({
  searchParams,
}: {
  searchParams: Promise<{ coleccion?: string }>;
}) {
  const [{ coleccion }, etapas, ingredientes, alergenos, tecnicas, porciones, colecciones] = await Promise.all([
    searchParams,
    repo.getEtapas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
    repo.getPorcionesTexturas(),
    repo.getColecciones().catch(() => []),
  ]);

  const porcionByEtapa = new Map(porciones.map((p) => [p.etapa_id, p]));
  const variantes: Record<string, VarianteEtapa> = {};
  for (const id of ETAPA_IDS) {
    const p = porcionByEtapa.get(id);
    variantes[id] = { textura: p?.textura ?? "", porcion: p?.porcion ?? "" };
  }

  const initial: Receta = {
    id: "",
    numero: null,
    titulo: "",
    destacadaPreview: false,
    variantes,
    tipo_comida: "desayuno",
    minutos_prep: null,
    kcal_100g: null,
    vitaminas: [],
    congelable: null,
    conservacion: null,
    pasos: [],
    notas: null,
    foto: null,
    receta_ingredientes: [],
    receta_alergenos: [],
    receta_tecnicas: [],
    // Preselect the collection when coming from its page.
    coleccionIds: colecciones.some((c) => c.id === coleccion) ? [coleccion!] : [],
  };

  return (
    <>
      <p className="admin-back">
        <Link href="/admin/recetas">← Recetas</Link>
      </p>
      <header className="admin-head">
        <div>
          <p className="admin-head__eyebrow">Nueva receta</p>
          <h1 className="admin-head__title">Una receta nueva</h1>
        </div>
      </header>
      <RecetaForm
        mode="create"
        initial={initial}
        etapas={etapas}
        ingredientes={ingredientes}
        alergenos={alergenos}
        tecnicas={tecnicas}
        colecciones={colecciones}
      />
    </>
  );
}
