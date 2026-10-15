import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";
import { slugify } from "@/lib/slug";
import { PhotoUploadError } from "./photos";

// Same ceiling as recipe photos: requests to /api/recetas/* go through the
// proxy, which buffers bodies only up to 10 MB.
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_WIDTH_PX = 1600;

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// Documents are stored as-is. Extension is the fallback when the browser
// sends an empty or generic MIME type (common for Office files on Windows).
const DOCUMENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
};

export interface UploadedAnexo {
  tipo: "imagen" | "documento";
  url: string;
  storagePath: string;
  nombreArchivo: string;
  mimeType: string;
  bytes: number;
}

/**
 * Uploads a supplementary file for a recipe to
 * `recetas/{recipeId}/anexos/{uuid}-{name}`. Images are resized and
 * re-encoded as WebP; documents are stored untouched.
 */
export async function uploadRecipeAnexo(
  recipeId: string,
  file: { bytes: Uint8Array; mimeType: string; name: string }
): Promise<UploadedAnexo> {
  if (file.bytes.byteLength > MAX_INPUT_BYTES) {
    throw new PhotoUploadError(413, "El archivo es demasiado grande. El máximo es 10 MB.");
  }

  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "";
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || "archivo";

  let tipo: UploadedAnexo["tipo"];
  let data: Buffer;
  let mimeType: string;
  let storageName: string;

  if (IMAGE_MIME.has(file.mimeType)) {
    tipo = "imagen";
    try {
      data = await sharp(Buffer.from(file.bytes))
        .rotate()
        .resize({ width: MAX_IMAGE_WIDTH_PX, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new PhotoUploadError(400, "No pudimos procesar la imagen. Prueba con otra.");
    }
    mimeType = "image/webp";
    storageName = `${base}.webp`;
  } else if (DOCUMENT_TYPES[ext]) {
    tipo = "documento";
    data = Buffer.from(file.bytes);
    mimeType = DOCUMENT_TYPES[ext];
    storageName = `${base}.${ext}`;
  } else {
    throw new PhotoUploadError(
      415,
      "Formato no soportado. Usa imágenes JPG, PNG o WebP, o documentos PDF, Word, Excel, PowerPoint, TXT o CSV."
    );
  }

  const storagePath = `recetas/${recipeId}/anexos/${randomUUID().slice(0, 8)}-${storageName}`;
  const bucket = getStorage(getAdminApp()).bucket();
  const object = bucket.file(storagePath);
  await object.save(data, {
    contentType: mimeType,
    resumable: false,
    metadata: {
      // Path is unique per upload, so it can be cached forever.
      cacheControl: "public, max-age=31536000, immutable",
      contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
  });
  await object.makePublic();

  return {
    tipo,
    url: `https://storage.googleapis.com/${bucket.name}/${encodeURI(storagePath)}`,
    storagePath,
    nombreArchivo: file.name,
    mimeType,
    bytes: data.byteLength,
  };
}

/** Best-effort cleanup of files no longer referenced by the recipe. */
export async function deleteRecipeAnexoFiles(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const bucket = getStorage(getAdminApp()).bucket();
  await Promise.all(
    storagePaths.map((p) => bucket.file(p).delete({ ignoreNotFound: true }).catch(() => undefined))
  );
}
