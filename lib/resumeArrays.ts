/**
 * Gemini may return string | string[] | objects ({ text, bullet, ... }) for the same fields.
 * Coerce to readable strings so we never render "[object Object]".
 */

const OBJ_TEXT_KEYS = [
  "text",
  "bullet",
  "line",
  "content",
  "description",
  "title",
  "item",
  "value",
  "detail",
  "summary",
  "body",
  "point",
  "achievement",
  "name",
  "label",
] as const;

/** Single value → one display line (for titles, descriptions, dates, etc.). */
export function displayText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    return v
      .map((x) => displayText(x))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of OBJ_TEXT_KEYS) {
      const val = o[k];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    const direct = Object.values(o).filter(
      (x): x is string => typeof x === "string" && x.trim() !== ""
    );
    if (direct.length === 1) return direct[0]!.trim();
    if (direct.length > 1) return direct.map((s) => s.trim()).join(" — ");
    const nested = Object.values(o)
      .map((x) => displayText(x))
      .filter(Boolean);
    if (nested.length) return nested.join(" — ");
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
}

/** List fields (bullets, highlights, tech stacks) → string[]. */
export function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => displayText(x))
      .filter((s) => s.length > 0);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    return t
      .split(/\n+|;\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof v === "object") {
    const one = displayText(v);
    return one ? [one] : [];
  }
  return [displayText(v)].filter(Boolean);
}
