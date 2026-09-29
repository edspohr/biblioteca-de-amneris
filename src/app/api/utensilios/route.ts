import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { utensilioSchema } from "@/lib/schema";
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
    if (!withId.id) return badRequest("El nombre es obligatorio");
    const parsed = utensilioSchema.parse(withId);
    const existing = await repo.getUtensilio(parsed.id);
    if (existing) return conflict(`Ya existe un utensilio con id "${parsed.id}"`);
    await repo.saveUtensilio(parsed);
    const saved = await verifyWrite(() => repo.getUtensilio(parsed.id), parsed, [
      "nombre",
      "tipo",
    ]);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
