import { NextResponse } from "next/server";
import { repo } from "@/lib/repo";
import { handleZodError, notFound } from "@/lib/api-errors";
import { requireSuperadmin } from "@/lib/auth/require";
import { bustCache, PhotoUploadError, uploadRecipePhoto } from "@/lib/storage/photos";

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
        { error: "Debes adjuntar una imagen en el campo 'file'." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadRecipePhoto(id, {
      bytes,
      mimeType: file.type,
    });

    // Persist the new URL on the recipe with a cache-busting suffix so the
    // browser picks up the change even though the storage path is stable.
    const foto = bustCache(uploaded.url);
    await repo.saveReceta({ ...existing, foto });

    return NextResponse.json({
      foto,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
    });
  } catch (err) {
    if (err instanceof PhotoUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleZodError(err);
  }
}
