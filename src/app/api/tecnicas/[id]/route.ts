import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { tecnicaSchema } from "@/lib/schema";
import { badRequest, conflict, handleZodError, notFound } from "@/lib/api-errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.id && body.id !== id) return badRequest("El identificador no se puede cambiar");
    const withDefaults = {
      ...body,
      id,
      descripcion: body.descripcion ?? null,
      seccion_origen: body.seccion_origen ?? null,
    };
    const parsed = tecnicaSchema.parse(withDefaults);
    const existing = await repo.getTecnica(id);
    if (!existing) return notFound("La técnica no existe");
    await repo.saveTecnica(parsed);
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
  const using = await repo.getRecetasUsingTecnica(id);
  if (using.length > 0) {
    return conflict(
      `No se puede eliminar: esta técnica se usa en ${using.length} receta(s)`,
      using.map((r) => ({ id: r.id, titulo: r.titulo }))
    );
  }
  await repo.deleteTecnica(id);
  return NextResponse.json({ ok: true });
}
