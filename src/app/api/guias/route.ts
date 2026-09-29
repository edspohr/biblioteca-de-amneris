import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { guiaSchema } from "@/lib/schema";
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
      id: body.id?.trim() || (body.titulo ? slugify(String(body.titulo)) : ""),
    };
    if (!withId.id) return badRequest("El título es obligatorio");
    const parsed = guiaSchema.parse(withId);
    const existing = await repo.getGuia(parsed.id);
    if (existing) return conflict(`Ya existe una guía con id "${parsed.id}"`);
    await repo.saveGuia(parsed);
    const saved = await verifyWrite(() => repo.getGuia(parsed.id), parsed, [
      "titulo",
      "coleccionId",
    ]);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
