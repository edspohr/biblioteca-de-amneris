import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { menuSchema } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import { badRequest, conflict, handleZodError } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { verifyWrite } from "@/lib/repo/verify";

export async function POST(req: Request) {
  try {
    await requireSuperadmin();
    const body = await req.json();
    const withId = {
      ...body,
      id: body.id?.trim() || (body.nombre ? slugify(String(body.nombre)) : ""),
    };
    if (!withId.id) return badRequest("El nombre es obligatorio para generar el identificador");
    const parsed = menuSchema.parse(withId);
    const existing = await repo.getMenu(parsed.id);
    if (existing) {
      return conflict(`Ya existe un menú con el identificador "${parsed.id}"`);
    }
    await repo.saveMenu(parsed);
    const saved = await verifyWrite(() => repo.getMenu(parsed.id), parsed, [
      "nombre",
      "etapa_id",
    ]);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
