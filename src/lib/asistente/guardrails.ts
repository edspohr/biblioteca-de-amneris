import { repo } from "@/lib/repo";

// Symptoms, reactions, diagnoses, dosing — these ALWAYS short-circuit to a
// pediatrician redirect. The model shouldn't try to answer them.
const MEDICAL_CONSULT_PATTERNS = [
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
  /sarpullid/i,
  /rash/i,
  /crecimiento/i,
  /crece\s+(poco|mal|bien|normal)/i,
  /desarrollo/i,
  /enferm/i,
  /dolor(?!\s+de\s+(cabeza\s+m[íi]a|panza\s+m[íi]a))/i,
  /reflujo/i,
  /c[óo]lico/i,
  /estre[ñn]imiento/i,
  /diagn[óo]stico/i,
  /medicamento/i,
  /remedio/i,
  /cu[áa]nt[oa]s?\s+\w+\s+(le\s+doy|dar|puedo\s+dar)/i,
  /es normal que/i,
];

// Mentions of allergy/intolerance used as a FILTER for recipes. These should
// NOT short-circuit — the model handles them normally and `detectAllergens`
// enriches the question with `alergenos_excluidos` when appropriate.
const ALLERGY_FILTER_PATTERNS = [
  /al[eé]rgic[ao]\s+a/i,
  /alergia\s+a/i,
  /intolera(?:nte|ncia)\s+a/i,
  /sin\s+(gluten|lact[eé]os?|huevo|frutos\s+secos|soja|pescado|maris|mostaza|s[eé]samo|apio)/i,
  /no\s+(puede|come|le\s+doy|le\s+da|tolera)/i,
  /libre\s+de/i,
  /evitar/i,
];

export const MEDICAL_REDIRECT_TEXT = `Eso ya entra en terreno de tu pediatra — el libro no puede dar consejo médico. Cualquier duda sobre reacciones, síntomas, o cómo está creciendo tu bebé, mejor consultarlo con quien lo conoce y puede verlo. 💛

Si quieres, te puedo ayudar a buscar recetas del libro que se adapten a lo que tu pediatra te indique.`;

export function needsMedicalRedirect(question: string): boolean {
  const consult = MEDICAL_CONSULT_PATTERNS.some((rx) => rx.test(question));
  if (consult) return true;
  // If the only "medical" signal is an allergy-as-filter, pass through.
  const filterOnly = ALLERGY_FILTER_PATTERNS.some((rx) => rx.test(question));
  if (filterOnly) return false;
  return false;
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
// Markers that precede an allergen when the user wants it EXCLUDED. If the
// allergen name appears in the question but none of these markers appears
// close before it, we do NOT treat it as an exclusion — otherwise "recetas
// con pescado" gets silently rewritten to "recetas SIN pescado".
const NEG_MARKERS = [
  "sin",
  "no puede",
  "no come",
  "no le doy",
  "no le da",
  "no tolera",
  "alergic[ao] a",
  "alergia a",
  "intolera(?:nte|ncia) a",
  "intolerante al",
  "evitar",
  "libre de",
  "nada de",
  "excluir",
  "excepto",
];
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export async function detectAllergens(question: string): Promise<string[]> {
  const list = await loadAllergens();
  const normalized = normalize(question);
  const hit = new Set<string>();
  for (const a of list) {
    const targets = [normalize(a.name), a.slug.replace(/-/g, " ")];
    for (const target of targets) {
      // Only count as exclusion if a negation/allergy marker sits within a
      // short window BEFORE the allergen mention.
      const rx = new RegExp(
        `(?:${NEG_MARKERS.join("|")})\\s+(?:\\w+\\s+){0,3}${target}\\b`,
        "i"
      );
      if (rx.test(normalized)) {
        hit.add(a.slug);
        break;
      }
    }
  }
  return [...hit];
}

