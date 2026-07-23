import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { alergenoSchema } from "@/lib/schema";
import { badRequest, conflict, handleZodError, notFound } from "@/lib/api-errors";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (body.id && body.id !== id) return badRequest("El identificador no se puede cambiar");
    const parsed = alergenoSchema.parse({ ...body, id });
    const all = await repo.getAlergenos();
    if (!all.some((a) => a.id === id)) return notFound("El alérgeno no existe");
    await repo.saveAlergeno(parsed);
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
  const using = await repo.getRecetasUsingAlergeno(id);
  if (using.length > 0) {
    return conflict(
      `No se puede eliminar: este alérgeno se usa en ${using.length} receta(s)`,
      using.map((r) => ({ id: r.id, titulo: r.titulo }))
    );
  }
  await repo.deleteAlergeno(id);
  return NextResponse.json({ ok: true });
}
