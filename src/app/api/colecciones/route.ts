import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { coleccionSchema } from "@/lib/schema";
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
    const parsed = coleccionSchema.parse(withId);
    const existing = await repo.getColeccion(parsed.id);
    if (existing) {
      return conflict(`Ya existe una colección con el identificador "${parsed.id}"`);
    }
    await repo.saveColeccion(parsed);
    const saved = await verifyWrite(() => repo.getColeccion(parsed.id), parsed, [
      "nombre",
      "estado",
    ]);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
