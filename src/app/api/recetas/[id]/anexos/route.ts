import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { PhotoUploadError } from "@/lib/storage/photos";
import { uploadRecipeAnexo } from "@/lib/storage/anexos";

// Stores the file only. The anexo entry is added to the recipe by the form
// and persisted with "Guardar cambios", like every other field.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperadmin();
    const { id } = await params;

    const existing = await repo.getReceta(id);
    if (!existing) return notFound("La receta no existe");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes adjuntar un archivo en el campo 'file'." },
        { status: 400 }
      );
    }

    const uploaded = await uploadRecipeAnexo(id, {
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type,
      name: file.name,
    });
    return NextResponse.json(uploaded, { status: 201 });
  } catch (err) {
    if (err instanceof PhotoUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleZodError(err);
  }
}
