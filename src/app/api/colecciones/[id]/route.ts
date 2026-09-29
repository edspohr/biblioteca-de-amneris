import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { coleccionSchema } from "@/lib/schema";
import { badRequest, handleZodError, notFound } from "@/lib/api-errors";
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
    if (body.id && body.id !== id) return badRequest("El identificador no se puede cambiar");
    const parsed = coleccionSchema.parse({ ...body, id });
    const existing = await repo.getColeccion(id);
    if (!existing) return notFound("La colección no existe");
    await repo.saveColeccion(parsed);
    const saved = await verifyWrite(() => repo.getColeccion(id), parsed, [
      "nombre",
      "estado",
      "orden",
      "tono",
      "fechaLanzamiento",
    ]);
    return NextResponse.json(saved);
  } catch (err) {
    return handleZodError(err);
  }
}
