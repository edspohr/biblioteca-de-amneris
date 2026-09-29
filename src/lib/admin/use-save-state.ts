"use client";

import { useCallback, useState } from "react";
import type { FieldError, SaveResult } from "./save-with-verify";

// Hook that pairs with <SaveStatus />. Wraps a save action so the UI can
// render a persistent error banner on failure and a "Guardado a las HH:MM"
// toast on confirmed success (with an explicit reread — see saveWithVerify).

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string; details?: FieldError[] };

export function useSaveState() {
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const runSave = useCallback(
    async <T>(action: () => Promise<SaveResult<T>>): Promise<SaveResult<T>> => {
      setStatus({ kind: "saving" });
      const res = await action();
      if (res.ok) setStatus({ kind: "saved", at: new Date() });
      else setStatus({ kind: "error", message: res.error, details: res.details });
      return res;
    },
    []
  );

  const clearError = useCallback(() => {
    setStatus((s) => (s.kind === "error" ? { kind: "idle" } : s));
  }, []);

  return { status, runSave, clearError };
}
