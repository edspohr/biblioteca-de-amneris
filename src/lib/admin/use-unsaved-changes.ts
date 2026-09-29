"use client";

import { useEffect } from "react";

// Prompt the user on tab close / hard reload if a form has unsaved changes.
// SPA navigations inside the app are best handled by keeping the form open
// and blocking the submit button while pending; this hook only covers the
// browser-level exit event.
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
