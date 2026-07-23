import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { recetaSchema } from "@/lib/schema";
import { badRequest, handleZodError, notFound } from "@/lib/api-errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.id && body.id !== id) {
      return badRequest("El identificador no se puede cambiar");
    }
    const parsed = recetaSchema.parse({ ...body, id });
    const existing = await repo.getReceta(id);
    if (!existing) return notFound("La receta no existe");
    await repo.saveReceta(parsed);
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
  const existing = await repo.getReceta(id);
  if (!existing) return notFound("La receta no existe");
  await repo.deleteReceta(id);
  return NextResponse.json({ ok: true });
}
