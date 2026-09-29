import { NextResponse } from "next/server";
import { z } from "zod";
import { repo } from "@/lib/repo";
import { slug } from "@/lib/schema/common";
import { handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { verifyWrite } from "@/lib/repo/verify";

// Adds/removes recipes to/from a colección by editing each recipe's
// `coleccionIds`. Every touched recipe is re-read to confirm the write.
const bodySchema = z.object({
  agregar: z.array(slug).default([]),
  quitar: z.array(slug).default([]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin();
    const { id } = await params;
    const { agregar, quitar } = bodySchema.parse(await req.json());
    const coleccion = await repo.getColeccion(id);
    if (!coleccion) return notFound("La colección no existe");

    const tocadas: string[] = [];
    for (const recetaId of new Set([...agregar, ...quitar])) {
      const receta = await repo.getReceta(recetaId);
      if (!receta) return notFound(`La receta "${recetaId}" no existe`);
      const actuales = new Set(receta.coleccionIds ?? []);
      if (agregar.includes(recetaId)) actuales.add(id);
      if (quitar.includes(recetaId)) actuales.delete(id);
      const next = { ...receta, coleccionIds: [...actuales] };
      await repo.saveReceta(next);
      await verifyWrite(() => repo.getReceta(recetaId), next, ["coleccionIds"]);
      tocadas.push(recetaId);
    }
    return NextResponse.json({ ok: true, recetas: tocadas });
  } catch (err) {
    return handleZodError(err);
  }
}
