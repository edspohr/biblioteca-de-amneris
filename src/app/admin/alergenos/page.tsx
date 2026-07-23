import { repo } from "@/lib/repo";
import { AlergenosEditor } from "./editor";

export default async function AdminAlergenosPage() {
  const [alergenos, recetas] = await Promise.all([
    repo.getAlergenos(),
    repo.getRecetas(),
  ]);
  const usage: Record<string, { id: string; titulo: string }[]> = {};
  for (const r of recetas) {
    for (const ra of r.receta_alergenos) {
      (usage[ra.alergeno_id] ??= []).push({ id: r.id, titulo: r.titulo });
    }
  }
  return (
    <>
      <h1>Alérgenos</h1>
      <AlergenosEditor initial={alergenos} usage={usage} />
    </>
  );
}
