import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { alergenoSchema } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import { badRequest, conflict, handleZodError } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const withId = {
      ...body,
      id: body.id?.trim() || (body.nombre ? slugify(String(body.nombre)) : ""),
    };
    if (!withId.id) return badRequest("El nombre es obligatorio");
    const parsed = alergenoSchema.parse(withId);
    const all = await repo.getAlergenos();
    if (all.some((a) => a.id === parsed.id)) {
      return conflict(`Ya existe un alérgeno con el identificador "${parsed.id}"`);
    }
    await repo.saveAlergeno(parsed);
    return NextResponse.json(parsed, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
