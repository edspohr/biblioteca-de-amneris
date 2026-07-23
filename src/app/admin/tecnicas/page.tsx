import { repo } from "@/lib/repo";
import { TecnicasEditor } from "./editor";

export default async function AdminTecnicasPage() {
  const [tecnicas, recetas] = await Promise.all([
    repo.getTecnicas(),
    repo.getRecetas(),
  ]);
  const usage: Record<string, { id: string; titulo: string }[]> = {};
  for (const r of recetas) {
    for (const rt of r.receta_tecnicas) {
      (usage[rt.tecnica_id] ??= []).push({ id: r.id, titulo: r.titulo });
    }
  }
  return (
    <>
      <h1>Técnicas</h1>
      <TecnicasEditor initial={tecnicas} usage={usage} />
    </>
  );
}
