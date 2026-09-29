import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { guiaSchema } from "@/lib/schema";
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
    const parsed = guiaSchema.parse({ ...body, id });
    const existing = await repo.getGuia(id);
    if (!existing) return notFound("La guía no existe");
    await repo.saveGuia(parsed);
    const saved = await verifyWrite(() => repo.getGuia(id), parsed, [
      "titulo",
      "coleccionId",
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
    const existing = await repo.getGuia(id);
    if (!existing) return notFound("La guía no existe");
    await repo.deleteGuia(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZodError(err);
  }
}
