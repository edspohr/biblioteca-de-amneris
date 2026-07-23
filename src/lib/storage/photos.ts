import "server-only";
import sharp from "sharp";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "@/lib/firebase/admin";

// Web-friendly ceiling; recipe photos rarely need more than 1200px wide.
const MAX_WIDTH_PX = 1200;
const WEBP_QUALITY = 82;

// Uploads accept common phone photo formats. HEIC is left out because sharp
// requires libheif at build time and App Hosting's default image doesn't
// bundle it — Amneris's iPhone lets her share as JPEG.
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export class PhotoUploadError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "PhotoUploadError";
  }
}

export interface UploadedPhoto {
  url: string;
  storagePath: string;
  bytes: number;
  width: number;
  height: number;
}

/**
 * Resizes + re-encodes a recipe photo and uploads it to the default Storage
 * bucket at `recetas/{recipeId}/main.webp`. Overwrites any existing file at
 * that path, so the URL is stable per recipe.
 */
export async function uploadRecipePhoto(
  recipeId: string,
  file: {
    bytes: Uint8Array | Buffer;
    mimeType: string;
  }
): Promise<UploadedPhoto> {
  if (!ACCEPTED_MIME.has(file.mimeType)) {
    throw new PhotoUploadError(
      415,
      `Formato no soportado (${file.mimeType}). Usa JPG, PNG o WebP.`
    );
  }
  if (file.bytes.byteLength > MAX_INPUT_BYTES) {
    throw new PhotoUploadError(
      413,
      "La imagen es demasiado grande. El máximo es 10 MB."
    );
  }

  let data: Buffer;
  let info: { width: number; height: number; size: number };
  try {
    const out = await sharp(Buffer.from(file.bytes))
      .rotate() // respect EXIF orientation
      .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });
    data = out.data;
    info = out.info;
  } catch {
    throw new PhotoUploadError(
      400,
      "No pudimos procesar la imagen. Prueba con otra foto."
    );
  }

  const storagePath = `recetas/${recipeId}/main.webp`;
  const bucket = getStorage(getAdminApp()).bucket();
  const object = bucket.file(storagePath);

  await object.save(data, {
    contentType: "image/webp",
    resumable: false,
    // Cache aggressively; the URL is unique per recipe and we bust it via a
    // query-string version tag written into the recipe doc.
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  await object.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${encodeURI(
    storagePath
  )}`;

  return {
    url,
    storagePath,
    bytes: info.size,
    width: info.width,
    height: info.height,
  };
}

export function bustCache(url: string): string {
  const v = Date.now().toString(36);
  return url.includes("?") ? `${url}&v=${v}` : `${url}?v=${v}`;
}
