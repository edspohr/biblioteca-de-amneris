import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { utensilioSchema } from "@/lib/schema";
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
    const parsed = utensilioSchema.parse({ ...body, id });
    const existing = await repo.getUtensilio(id);
    if (!existing) return notFound("El utensilio no existe");
    await repo.saveUtensilio(parsed);
    const saved = await verifyWrite(() => repo.getUtensilio(id), parsed, [
      "nombre",
      "tipo",
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
    const existing = await repo.getUtensilio(id);
    if (!existing) return notFound("El utensilio no existe");
    await repo.deleteUtensilio(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZodError(err);
  }
}
