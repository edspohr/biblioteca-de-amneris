/**
 * One-shot migration: reads every JSON in data/ + every photo in
 * public/images/recetas/ and writes them into the live Firebase project
 * pointed to by the service account.
 *
 * Refuses to run if any target collection is non-empty. Override with --force.
 *
 * Usage (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npm run migrate:firestore
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";
import {
  alergenoSchema,
  etapaSchema,
  ingredienteSchema,
  menuSchema,
  porcionTexturaSchema,
  recetaSchema,
  tecnicaSchema,
  type Receta,
} from "../src/lib/schema";

const FORCE = process.argv.includes("--force");
const BUCKET_NAME =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET;
if (!BUCKET_NAME) {
  console.error(
    "Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (or FIREBASE_STORAGE_BUCKET) before running."
  );
  process.exit(1);
}

const DATA_DIR = path.join(process.cwd(), "data");
const RECETAS_DIR = path.join(DATA_DIR, "recetas");
const PHOTOS_DIR = path.join(process.cwd(), "public", "images", "recetas");

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json before running."
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as ServiceAccount;
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)].sort();
}

async function findPhotoFor(recipeId: string): Promise<string | null> {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const p = path.join(PHOTOS_DIR, `${recipeId}.${ext}`);
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }
  return null;
}

async function main() {
  initializeApp({
    credential: cert(loadServiceAccount()),
    storageBucket: BUCKET_NAME,
  });
  const db = getFirestore();
  const bucket = getStorage().bucket();

  // Safety belt: verify bucket exists before we start uploading.
  const [bucketExists] = await bucket.exists();
  if (!bucketExists) {
    throw new Error(
      `Storage bucket "${BUCKET_NAME}" does not exist. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.`
    );
  }

  const targets = [
    "etapas",
    "porciones_texturas",
    "ingredientes",
    "alergenos",
    "tecnicas",
    "menus",
    "recetas",
  ];
  if (!FORCE) {
    for (const c of targets) {
      const snap = await db.collection(c).limit(1).get();
      if (!snap.empty) {
        console.error(
          `Refusing to run: collection "${c}" is non-empty. Pass --force to seed anyway (existing docs will be overwritten by id).`
        );
        process.exit(1);
      }
    }
  }

  // --- Load and validate everything before writing anything --------------

  const etapas = (await readJson<unknown[]>(
    path.join(DATA_DIR, "etapas.json")
  )).map((r) => etapaSchema.parse(r));
  const porciones = (await readJson<unknown[]>(
    path.join(DATA_DIR, "porciones-texturas.json")
  )).map((r) => porcionTexturaSchema.parse(r));
  const ingredientes = (await readJson<unknown[]>(
    path.join(DATA_DIR, "ingredientes.json")
  )).map((r) => ingredienteSchema.parse(r));
  const alergenos = (await readJson<unknown[]>(
    path.join(DATA_DIR, "alergenos.json")
  )).map((r) => alergenoSchema.parse(r));
  const tecnicas = (await readJson<unknown[]>(
    path.join(DATA_DIR, "tecnicas.json")
  )).map((r) => tecnicaSchema.parse(r));
  const menus = (await readJson<unknown[]>(
    path.join(DATA_DIR, "menus.json")
  )).map((r) => menuSchema.parse(r));

  const recetaFiles = (await fs.readdir(RECETAS_DIR)).filter((f) =>
    f.endsWith(".json")
  );
  const recetas: Receta[] = [];
  for (const f of recetaFiles) {
    recetas.push(recetaSchema.parse(await readJson(path.join(RECETAS_DIR, f))));
  }

  console.log(
    `Loaded: ${etapas.length} etapas, ${porciones.length} porciones, ${ingredientes.length} ingredientes, ${alergenos.length} alergenos, ${tecnicas.length} tecnicas, ${menus.length} menus, ${recetas.length} recetas.`
  );

  // --- Upload photos ------------------------------------------------------

  console.log(`\nUploading photos to gs://${BUCKET_NAME}/recetas/...`);
  const photoUrls = new Map<string, string>();
  let uploaded = 0;
  let missing = 0;
  for (const r of recetas) {
    const src = await findPhotoFor(r.id);
    if (!src) {
      missing++;
      continue;
    }
    const bytes = await fs.readFile(src);
    const processed = await sharp(bytes)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const storagePath = `recetas/${r.id}/main.webp`;
    const object = bucket.file(storagePath);
    await object.save(processed, {
      contentType: "image/webp",
      resumable: false,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    await object.makePublic();
    const url = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURI(
      storagePath
    )}`;
    photoUrls.set(r.id, url);
    uploaded++;
    if (uploaded % 20 === 0) {
      console.log(`  ${uploaded}/${recetas.length}...`);
    }
  }
  console.log(
    `Photos: ${uploaded} uploaded, ${missing} recipes without a source file.`
  );

  // --- Write catalog collections -----------------------------------------

  console.log(`\nWriting Firestore documents...`);

  async function writeAll<T extends object>(
    collection: string,
    items: T[],
    docId: (item: T) => string
  ) {
    const batch = db.batch();
    for (const item of items) {
      batch.set(
        db.collection(collection).doc(docId(item)),
        item as unknown as Record<string, unknown>
      );
    }
    await batch.commit();
    console.log(`  ${collection}: ${items.length}`);
  }

  await writeAll("etapas", etapas, (e) => e.id);
  // Porciones-texturas is a reference table keyed by etapa_id.
  await writeAll("porciones_texturas", porciones, (p) => p.etapa_id);
  await writeAll("ingredientes", ingredientes, (i) => i.id);
  await writeAll("alergenos", alergenos, (a) => a.id);
  await writeAll("tecnicas", tecnicas, (t) => t.id);
  // Menus get a denormalized `receta_ids` for array-contains queries.
  const menusForDoc = menus.map((m) => ({
    ...m,
    receta_ids: uniq(m.menu_recetas.map((x) => x.receta_id)),
  }));
  await writeAll("menus", menusForDoc, (m) => m.id);

  // --- Write recipes (with photo URLs + denormalized _ids arrays) --------

  const batch = db.batch();
  for (const r of recetas) {
    const newFoto = photoUrls.get(r.id) ?? null;
    const doc = {
      ...r,
      foto: newFoto,
      ingrediente_ids: uniq(r.receta_ingredientes.map((x) => x.ingrediente_id)),
      alergeno_ids: uniq(r.receta_alergenos.map((x) => x.alergeno_id)),
      tecnica_ids: uniq(r.receta_tecnicas.map((x) => x.tecnica_id)),
    };
    batch.set(db.collection("recetas").doc(r.id), doc);
  }
  await batch.commit();
  console.log(`  recetas: ${recetas.length}`);

  // --- Report -------------------------------------------------------------

  console.log(`\nDone.`);
  console.log(`Sample photo URL: ${[...photoUrls.values()][0] ?? "(none)"}`);
  if (missing > 0) {
    console.log(
      `\n⚠ ${missing} recipes had no source photo in public/images/recetas/. Their foto field is null.`
    );
    const withoutPhoto = recetas
      .filter((r) => !photoUrls.has(r.id))
      .map((r) => r.id);
    for (const id of withoutPhoto) console.log(`  - ${id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
