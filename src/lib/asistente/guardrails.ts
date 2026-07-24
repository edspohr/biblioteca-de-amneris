import { repo } from "@/lib/repo";

// Words that signal a medical or health question. Short-circuits BEFORE any
// model call — we don't want the model even trying to answer these.
// Kept broad on purpose; false positives (someone asks "¿la papa da alergia?")
// still get a caring "consulta con tu pediatra" reply, which is the right
// answer.
const MEDICAL_PATTERNS = [
  /alergi[ao]/i,
  /reacci[óo]n/i,
  /reacciona/i,
  /atragant/i,
  /ahog/i,
  /s[íi]ntoma/i,
  /pediatr/i,
  /fiebre/i,
  /v[óo]mit/i,
  /diarrea/i,
  /sangre/i,
  /erupci[óo]n/i,
  /rash/i,
  /peso/i,
  /crecimiento/i,
  /crece\s+(poco|mal|bien|normal)/i,
  /talla/i,
  /desarrollo/i,
  /enferm/i,
  /dolor(?!\s+de\s+(cabeza\s+m[íi]a|panza\s+m[íi]a))/i,
  /reflujo/i,
  /c[óo]lico/i,
  /estre[ñn]imiento/i,
  /diagn[óo]stico/i,
];

export const MEDICAL_REDIRECT_TEXT = `Eso ya entra en terreno de tu pediatra — el libro no puede dar consejo médico. Cualquier duda sobre reacciones, alergias, o cómo está creciendo tu bebé, mejor consultarlo con quien lo conoce y puede verlo. 💛

Si quieres, te puedo ayudar a buscar recetas del libro que se adapten a lo que tu pediatra te indique.`;

export function needsMedicalRedirect(question: string): boolean {
  return MEDICAL_PATTERNS.some((rx) => rx.test(question));
}

/**
 * Sanitize the model's final answer by stripping any receta/menu link whose
 * slug isn't in the allowlist (i.e. wasn't returned by a tool this turn).
 * Prevents the model from inventing URLs. Non-invasive: only rewrites
 * markdown links pointing at /recetas/... or /menus/....
 */
export function stripUncitedLinks(text: string, allowed: Set<string>): string {
  return text.replace(
    /\[([^\]]+)\]\(\/(recetas|menus)\/([a-z0-9-]+)\)/gi,
    (_full, label, kind, slug) => {
      return allowed.has(slug) ? _full : label;
    }
  );
}

/**
 * Very light scope check. If a question mentions none of the domain words
 * we're helpful about, we still allow the model to answer (its system prompt
 * will handle the redirect) — but we tag it as OFF_TOPIC so the log tells us
 * how often this happens.
 */
const SCOPE_WORDS = [
  "receta", "recet", "menú", "menu", "compra", "cocin", "come", "comer", "comid",
  "beb[eé]", "hij", "hija", "hijo", "mam", "papil", "pur[eé]",
  "desayun", "almuerz", "meriend", "cena", "colaci",
  "textur", "porci", "ingredient", "al[eé]rgen",
  "etapa", "6 meses", "meses", "a[ñn]o",
];
export function looksOnTopic(question: string): boolean {
  const t = question.toLowerCase();
  return SCOPE_WORDS.some((w) => new RegExp(w).test(t));
}

/**
 * Precomputed list of allergen slugs, used to enrich a user question with
 * detected allergens as `alergenos_excluidos`. The model sees the enriched
 * question so it can still choose to search or not — but the enrichment
 * means the model can't "forget" the constraint.
 */
let cachedAllergenSlugs: { slug: string; name: string }[] | null = null;
async function loadAllergens() {
  if (cachedAllergenSlugs) return cachedAllergenSlugs;
  const all = await repo.getAlergenos();
  cachedAllergenSlugs = all.map((a) => ({
    slug: a.id,
    name: a.nombre.toLowerCase(),
  }));
  return cachedAllergenSlugs;
}
export async function detectAllergens(question: string): Promise<string[]> {
  const list = await loadAllergens();
  const t = question.toLowerCase();
  const hit = new Set<string>();
  for (const a of list) {
    if (t.includes(a.name)) hit.add(a.slug);
    if (t.includes(a.slug.replace(/-/g, " "))) hit.add(a.slug);
  }
  return [...hit];
}
