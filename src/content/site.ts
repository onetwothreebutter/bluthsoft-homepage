/**
 * Strings that belong to the site rather than to one page: the brand name,
 * the wording structured data uses, and interface text like the skip link.
 * The layout and pages read these instead of hard-coding them.
 */
export const site = {
  name: "BluthSoft",
  // New copy: the first sentence of the design's footer tagline, on its own.
  // Used as the Organization description in structured data.
  description: "The operating platform for banana stands.",
  // Verbatim from the hero. Also the free offer in structured data.
  offer: "Free for one stand. No card.",
  // New copy: not in the design.
  skipLink: "Skip to content",
} as const;
