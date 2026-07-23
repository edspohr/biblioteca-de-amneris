import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { menuSchema } from "@/lib/schema";
import { badRequest, handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";

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
    const parsed = menuSchema.parse({ ...body, id });
    const existing = await repo.getMenu(id);
    if (!existing) return notFound("El menú no existe");
    await repo.saveMenu(parsed);
    return NextResponse.json(parsed);
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
    const existing = await repo.getMenu(id);
    if (!existing) return notFound("El menú no existe");
    await repo.deleteMenu(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleZodError(err);
  }
}
