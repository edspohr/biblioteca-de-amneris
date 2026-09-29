import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { recetaSchema } from "@/lib/schema";
import { badRequest, conflict, handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { verifyWrite } from "@/lib/repo/verify";

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
    const parsed = recetaSchema.parse({ ...body, id });
    const existing = await repo.getReceta(id);
    if (!existing) return notFound("La receta no existe");
    await repo.saveReceta(parsed);
    const saved = await verifyWrite(() => repo.getReceta(id), parsed, [
      "titulo",
      "tipo_comida",
    ]);
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
