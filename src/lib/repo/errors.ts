export class RepoWriteError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "RepoWriteError";
    this.cause = cause;
  }
}

export async function wrapWrite<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    // Zod errors are validation errors — bubble those up untouched so the
    // route can translate them into 400s. Everything else becomes a 503.
    if ((err as { name?: string })?.name === "ZodError") throw err;
    throw new RepoWriteError(
      "No se pudo guardar. Intenta de nuevo en unos segundos.",
      err
    );
  }
}
