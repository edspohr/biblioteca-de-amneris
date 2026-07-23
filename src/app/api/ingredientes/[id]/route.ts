import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { ingredienteSchema } from "@/lib/schema";
import { badRequest, conflict, handleZodError, notFound } from "@/lib/api-errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.id && body.id !== id) return badRequest("El identificador no se puede cambiar");
    const parsed = ingredienteSchema.parse({ ...body, id });
    const all = await repo.getIngredientes();
    if (!all.some((i) => i.id === id)) return notFound("El ingrediente no existe");
    await repo.saveIngrediente(parsed);
    return NextResponse.json(parsed);
  } catch (err) {
    return handleZodError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const using = await repo.getRecetasUsingIngrediente(id);
  if (using.length > 0) {
    return conflict(
      `No se puede eliminar: este ingrediente se usa en ${using.length} receta(s)`,
      using.map((r) => ({ id: r.id, titulo: r.titulo }))
    );
  }
  await repo.deleteIngrediente(id);
  return NextResponse.json({ ok: true });
}
