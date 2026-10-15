import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { recetaSchema } from "@/lib/schema";
import { badRequest, conflict, handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { verifyWrite } from "@/lib/repo/verify";
import { deleteRecipeAnexoFiles } from "@/lib/storage/anexos";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin();
    const { id } = await params;
    const body = await req.json();
    if (body.id && body.id !== id) {
      return badRequest("El identificador no se puede cambiar");
    }
    const existing = await repo.getReceta(id);
    if (!existing) return notFound("La receta no existe");
    // The photo is owned by POST /foto; the form may hold a stale value from
    // before an upload, so never let it overwrite the stored one.
    const parsed = recetaSchema.parse({ ...body, id, foto: existing.foto });
    await repo.saveReceta(parsed);
    const saved = await verifyWrite(() => repo.getReceta(id), parsed, [
      "titulo",
      "tipo_comida",
    ]);
    const kept = new Set((parsed.anexos ?? []).map((a) => a.storagePath));
    const removed = (existing.anexos ?? [])
      .map((a) => a.storagePath)
      .filter((p): p is string => Boolean(p?.startsWith(`recetas/${id}/anexos/`)) && !kept.has(p));
    await deleteRecipeAnexoFiles(removed);
    return NextResponse.json(saved);
  } catch (err) {
    return handleZodError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin();
    const { id } = await params;
    const existing = await repo.getReceta(id);
    if (!existing) return notFound("La receta no existe");
    const menus = await repo.getMenusUsingReceta(id);
    if (menus.length > 0) {
      return conflict(
        `No se puede eliminar: esta receta se usa en ${menus.length} menú(s)`,
        menus.map((m) => ({ id: m.id, nombre: m.nombre }))
      );
    }
    await repo.deleteReceta(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZodError(err);
  }
}
