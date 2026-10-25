import { z } from "zod";
import { sellsValues, standsValues } from "../content/home";
import { utmKeys } from "./attribution";

/**
 * What a signup or demo request may contain, from any of the three forms
 * (hero, setup quiz, /demo). Error messages are shown to visitors, so they
 * are copy.
 */

/** Hidden field real visitors never see or fill; bots fill everything. */
export const honeypotField = "website";

// Form-encoded posts send "" for an empty field; treat that as absent.
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const utmFields = Object.fromEntries(
  utmKeys.map((key) => [key, optionalText(200)]),
) as Record<(typeof utmKeys)[number], ReturnType<typeof optionalText>>;

export const leadSchema = z
  .object({
    email: z
      .string({ error: "Enter your email address." })
      .trim()
      .toLowerCase()
      // An empty box arrives as "" (form posts always send the field), so the
      // missing-email message has to come from here, not the type check.
      .min(1, { error: "Enter your email address." })
      .pipe(
        z.email({ error: "Enter an email address like you@yourstand.com." }),
      ),
    intent: z.enum(["signup", "demo"]),
    source: z.enum(["hero", "setup", "demo"]),
    stands: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(standsValues, { error: "Choose how many stands you run." })
        .optional(),
    ),
    // Answers to "What do you sell?", any number of them.
    sells: z.array(z.enum(sellsValues)).max(sellsValues.length).optional(),
    name: optionalText(120),
    note: optionalText(2000),
    referrer: optionalText(500),
    distinct_id: optionalText(200),
    ...utmFields,
  })
  .superRefine((lead, ctx) => {
    if (lead.intent === "demo" && !lead.name) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Tell us who to ask for.",
      });
    }
  });

export type Lead = z.infer<typeof leadSchema>;
export type LeadErrors = Partial<Record<string, string>>;

export type LeadParseResult =
  { ok: true; lead: Lead } | { ok: false; errors: LeadErrors };

export function parseLead(input: unknown): LeadParseResult {
  const result = leadSchema.safeParse(input);
  if (result.success) return { ok: true, lead: result.data };
  const errors: LeadErrors = {};
  for (const [field, messages] of Object.entries(
    z.flattenError(result.error).fieldErrors,
  )) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) errors[field] = first;
  }
  return { ok: false, errors };
}
