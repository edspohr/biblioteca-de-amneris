export const PREVIEW_COOKIE_NAME = "bocaditos_preview_v1";
export const PREVIEW_LIMIT = 3;
export const PREVIEW_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function parsePreviewCookie(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

export function serializePreviewCookie(slugs: string[]): string {
  return JSON.stringify(slugs);
}

export type PreviewDecision =
  | { action: "allow" }
  | { action: "allow-and-record"; nextValue: string }
  | { action: "gate" };

export function decidePreview(
  cookieValue: string | undefined,
  slug: string
): PreviewDecision {
  const seen = parsePreviewCookie(cookieValue);
  if (seen.includes(slug)) return { action: "allow" };
  if (seen.length < PREVIEW_LIMIT) {
    const next = [...seen, slug];
    return {
      action: "allow-and-record",
      nextValue: serializePreviewCookie(next),
    };
  }
  return { action: "gate" };
}
