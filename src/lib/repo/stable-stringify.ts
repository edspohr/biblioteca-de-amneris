export function stableStringify(value: unknown, indent = 2): string {
  return JSON.stringify(value, (_, v) => sortKeys(v), indent);
}

function sortKeys(v: unknown): unknown {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return v;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as object).sort()) {
    out[k] = (v as Record<string, unknown>)[k];
  }
  return out;
}
