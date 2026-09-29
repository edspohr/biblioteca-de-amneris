import { RepoWriteError } from "./errors";

// After a save, re-read the document and confirm it matches what we intended
// to persist. Closes the "API returns 200 but nothing was written" hole
// (root cause of the 2025-09-19 lost-work incident).
//
// Usage in a route:
//   await repo.saveTecnica(parsed);
//   const saved = await verifyWrite(() => repo.getTecnica(parsed.id), parsed,
//     ["nombre", "descripcion"]);
//   return NextResponse.json(saved);
export async function verifyWrite<T extends { id: string }>(
  getter: () => Promise<T | null>,
  expected: T,
  fields: (keyof T)[]
): Promise<T> {
  const read = await getter();
  if (!read) {
    throw new RepoWriteError(
      `El documento "${expected.id}" no aparece tras el guardado. No se pudo verificar la escritura.`
    );
  }
  for (const field of fields) {
    if (!equal(read[field], expected[field])) {
      throw new RepoWriteError(
        `Los datos guardados de "${expected.id}" no coinciden con lo enviado (campo "${String(field)}"). Reintenta.`
      );
    }
  }
  return read;
}

function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") return JSON.stringify(a) === JSON.stringify(b);
  return false;
}
