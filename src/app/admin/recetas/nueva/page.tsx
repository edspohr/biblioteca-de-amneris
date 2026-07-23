import { repo } from "@/lib/repo";
import { ETAPA_IDS, type Receta, type VarianteEtapa } from "@/lib/schema";
import { RecetaForm } from "../receta-form";

export default async function NuevaRecetaPage() {
  const [etapas, ingredientes, alergenos, tecnicas, porciones] = await Promise.all([
    repo.getEtapas(),
    repo.getIngredientes(),
    repo.getAlergenos(),
    repo.getTecnicas(),
    repo.getPorcionesTexturas(),
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
  };

  return (
    <>
      <h1>Nueva receta</h1>
      <RecetaForm
        mode="create"
        initial={initial}
        etapas={etapas}
        ingredientes={ingredientes}
        alergenos={alergenos}
        tecnicas={tecnicas}
      />
    </>
  );
}
