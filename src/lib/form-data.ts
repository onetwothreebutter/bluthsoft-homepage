// Shared by the lead endpoint (form posts without JavaScript) and the forms'
// own script (which sends the same fields as JSON). Kept apart from lead.ts so
// the browser bundle doesn't pull in the validation library.

/** A form-encoded body as a plain object. `sells` is the only multi-value field. */
export function formDataToObject(form: FormData): Record<string, unknown> {
  const object: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    object[key] =
      key === "sells"
        ? form.getAll(key).map(String)
        : String(form.get(key) ?? "");
  }
  return object;
}
