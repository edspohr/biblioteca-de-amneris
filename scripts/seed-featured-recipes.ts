/**
 * Marks 5 recipes as `destacadaPreview: true` so anonymous visitors can read
 * them without registering. Curated by Amneris; can be changed later from
 * /admin/recetas/[slug]/editar (checkbox "Mostrar como receta gratis").
 *
 * Selection rule: one recipe per `tipo_comida` when possible (desayuno,
 * almuerzo, merienda, cena, colacion). The script picks the recipe with the
 * lowest `numero` per tipo. Override the list via the FEATURED_IDS env var
 * (comma-separated slugs) if Amneris wants a different curation.
 *
 * Usage (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *     npx tsx scripts/seed-featured-recipes.ts
 *
 * Idempotent: setting `destacadaPreview: false` on non-selected recipes is
 * NOT done — this script only turns the flag ON. To unfeature, use the
 * admin UI. This keeps the script safe to re-run without unfeaturing
 * recipes that were manually promoted from /admin.
 */
import { readFileSync } from "node:fs";
import { cert, initializeApp, type ServiceAccount } from "firebase-admin/app";
import {
  getFirestore,
  type DocumentData,
} from "firebase-admin/firestore";

const MEAL_TYPES = ["desayuno", "almuerzo", "merienda", "cena", "colacion"];

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_ADMIN_SA;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json (or FIREBASE_ADMIN_SA=<json>) before running."
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
}

async function pickFeaturedIds(db: FirebaseFirestore.Firestore): Promise<string[]> {
  const override = process.env.FEATURED_IDS?.trim();
  if (override) return override.split(",").map((s) => s.trim()).filter(Boolean);

  const snap = await db.collection("recetas").get();
  const byMeal = new Map<string, { id: string; numero: number }[]>();
  snap.docs.forEach((d) => {
    const data = d.data() as DocumentData;
    const meal = data.tipo_comida as string | undefined;
    if (!meal) return;
    const numero = typeof data.numero === "number" ? data.numero : 9999;
    if (!byMeal.has(meal)) byMeal.set(meal, []);
    byMeal.get(meal)!.push({ id: d.id, numero });
  });

  const picked: string[] = [];
  for (const meal of MEAL_TYPES) {
    const list = byMeal.get(meal);
    if (!list || list.length === 0) continue;
    list.sort((a, b) => a.numero - b.numero);
    picked.push(list[0].id);
  }
  return picked;
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  const ids = await pickFeaturedIds(db);
  if (ids.length === 0) {
    // eslint-disable-next-line no-console
    console.log("No hay recetas para marcar. ¿Está vacía la colección?");
    return;
  }

  for (const id of ids) {
    const ref = db.collection("recetas").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      // eslint-disable-next-line no-console
      console.log(`⨯ ${id} — no existe, se omite`);
      continue;
    }
    await ref.update({ destacadaPreview: true });
    // eslint-disable-next-line no-console
    console.log(`✓ ${id} — destacada como preview`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${ids.length} receta(s) destacada(s).`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
