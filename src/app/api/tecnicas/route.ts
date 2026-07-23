import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { tecnicaSchema } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import { badRequest, conflict, handleZodError } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const withId = {
      ...body,
      id: body.id?.trim() || (body.nombre ? slugify(String(body.nombre)) : ""),
      descripcion: body.descripcion ?? null,
      seccion_origen: body.seccion_origen ?? null,
    };
    if (!withId.id) return badRequest("El nombre es obligatorio");
    const parsed = tecnicaSchema.parse(withId);
    const all = await repo.getTecnicas();
    if (all.some((t) => t.id === parsed.id)) {
      return conflict(`Ya existe una técnica con el identificador "${parsed.id}"`);
    }
    await repo.saveTecnica(parsed);
    return NextResponse.json(parsed, { status: 201 });
  } catch (err) {
    return handleZodError(err);
  }
}
