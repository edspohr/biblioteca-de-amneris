import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { recetaSchema } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import { badRequest, conflict, handleZodError } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // If no id provided, derive from titulo
    const withId = {
      ...body,
      id: body.id?.trim() || (body.titulo ? slugify(String(body.titulo)) : ""),
    };
    if (!withId.id) return badRequest("El título es obligatorio para generar el identificador");
    const parsed = recetaSchema.parse(withId);

    const existing = await repo.getReceta(parsed.id);
    if (existing) {
      return conflict(`Ya existe una receta con el identificador "${parsed.id}"`);
    }
    await repo.saveReceta(parsed);
    return NextResponse.json(parsed, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
