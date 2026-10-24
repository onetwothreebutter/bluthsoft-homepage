/**
 * Every word on the homepage, in page order.
 *
 * Copy is verbatim from the supplied Figma frame ("BluthSoft Homepage", node
 * 4:2) unless a comment says otherwise. Components render from this file and
 * never hard-code copy, so a copy change is a one-file diff a non-engineer can
 * review. Known contradictions in the supplied copy are deliberately left as
 * designed; see DECISIONS.md.
 */

import { anchors, startFree } from "./navigation";
import { site } from "./site";

/** Quiz answers for "How many stands do you run?". The values are what the lead endpoint accepts. */
export const standsValues = ["1", "2-5", "6-20", "20+"] as const;
export type Stands = (typeof standsValues)[number];

/** Answers for "What do you sell?" (any number of them). Also what the lead endpoint accepts. */
export const sellsValues = [
  "frozen-bananas",
  "fresh-fruit",
  "drinks",
  "snacks",
] as const;
export type Sells = (typeof sellsValues)[number];

export type Tone = "ok" | "warning" | "alert";

export interface ProductPanel {
  tab: string;
  summary: string;
  title: string;
  meta: string;
  columns: readonly string[];
  rows: readonly {
    item: string;
    values: readonly string[];
    status: { label: string; tone: Tone };
  }[];
  action: string;
  why: {
    label: string;
    heading: string;
    body: string;
    stats: readonly { value: string; label: string }[];
  };
}

export const home = {
  // New copy (not in the design): the document title and meta description.
  meta: {
    title: "BluthSoft — The operating platform for banana stands",
    description:
      "Inventory, sales, staff, and restocking in one system that watches the stand so you don't have to. Free for one stand. No card.",
  },

  hero: {
    eyebrow: "Now with Bluth AI forecasting",
    heading: "Run your banana stand without going bananas.",
    lede: "BluthSoft is the operating platform for banana stands. Inventory, sales, staff, and restocking — one system that watches the stand so you don't have to.",
    form: {
      // New copy: the email field's label, read by screen readers only.
      label: "Email address",
      placeholder: "you@yourstand.com",
      submit: "Start free",
    },
    note: site.offer,
    secondary: { label: "See the platform", href: anchors.product },
    rating: {
      score: "4.9",
      source: "from 318 stand operators",
      aside: "Live in a day",
    },
    dashboard: {
      // New copy: what screen readers hear for the whole drawing.
      summary:
        "BluthSoft dashboard for the Balboa Island stand at 3:12 PM: $1,284 in sales today, 847 bananas sold, 126 left and below par. Bluth AI predicts frozen bananas run out by 3:40 PM and offers to order 300.",
      title: "Bluth Banana Stand — Balboa Island",
      status: "OPEN · 3:12 PM",
      label: "TODAY AT THE STAND",
      stats: [
        {
          value: "$1,284",
          label: "Today’s sales",
          note: "↑ 18% vs. Tue",
          tone: "up",
        },
        {
          value: "847",
          label: "Bananas sold",
          note: "62 / hour",
          tone: "neutral",
        },
        {
          value: "126",
          label: "Bananas left",
          note: "Below par level",
          tone: "warning",
        },
      ],
      // Bar heights in px of a 96px chart, 9A–5P. "sold" bars are past hours,
      // "peak" is highlighted, "now" is the current hour, "forecast" is ahead.
      chart: [
        { height: 33, kind: "sold" },
        { height: 44, kind: "sold" },
        { height: 39, kind: "sold" },
        { height: 60, kind: "sold" },
        { height: 69, kind: "peak" },
        { height: 84, kind: "peak" },
        { height: 96, kind: "now" },
        { height: 52, kind: "forecast" },
        { height: 36, kind: "forecast" },
      ],
      axis: ["9A", "11A", "1P", "3P", "5P", "7P"],
      assistant: {
        label: "BLUTH AI",
        message: {
          before: "You're likely to run out of frozen bananas by ",
          emphasis: "3:40 PM",
          after: ".",
        },
        actions: ["Order 300 bananas", "Not today"],
        confidence: "CONF. 0.91",
      },
      toast: { title: "Restock created", detail: "PO-4417 · 300 units" },
    },
  },

  trust: {
    label: "RUNNING ON BLUTHSOFT",
    brands: [
      "Bluth Original",
      "Sudden Valley Sweets",
      "Pier Fruit Co.",
      "Cornballer Carts",
      "Wee Britain Frozen",
      "Balboa Freeze",
    ],
  },

  product: {
    eyebrow: "ONE PLATFORM",
    heading: "Everything the stand needs, in one place.",
    lede: "Stop running the stand out of a cash box and a notebook. Inventory, staffing, and forecasting share the same numbers, so what you see is what’s actually happening.",
    syncStatus: "SYNCED 12s AGO",
    // New copy: names the tab list for screen readers.
    tabsLabel: "Product areas",
    // The design's tabs were Inventory · Staff · Forecast, with only Inventory
    // drawn. They're Inventory · Sales · Bluth AI (see DECISIONS.md); the
    // Inventory panel is verbatim, the other two are new copy in its layout.
    // Each row is the item, then the middle columns, then a status pill. On
    // phones only the first middle column shows, as drawn (Par is hidden).
    panels: [
      {
        tab: "Inventory",
        // New copy: what screen readers hear for the table drawing.
        summary:
          "Stock on hand: ripe bananas 126 of 300, below par; frozen bananas 41 of 120, reorder now; chocolate dip 18 of 12 pounds, healthy; chopped nuts 9 of 10 pounds, below par; 12-ounce cups 640 of 400, healthy.",
        title: "Stock on hand",
        meta: "4 items below par",
        columns: ["ITEM", "ON HAND", "PAR", "STATUS"],
        rows: [
          {
            item: "Bananas, ripe",
            values: ["126", "300"],
            status: { label: "Below par", tone: "warning" },
          },
          {
            item: "Frozen bananas",
            values: ["41", "120"],
            status: { label: "Reorder now", tone: "alert" },
          },
          {
            item: "Chocolate dip",
            values: ["18 lb", "12 lb"],
            status: { label: "Healthy", tone: "ok" },
          },
          {
            item: "Nuts, chopped",
            values: ["9 lb", "10 lb"],
            status: { label: "Below par", tone: "warning" },
          },
          {
            item: "Cups, 12 oz",
            values: ["640", "400"],
            status: { label: "Healthy", tone: "ok" },
          },
        ],
        action: "Create restock order",
        why: {
          label: "WHY IT MATTERS",
          heading: "You always know what you have.",
          body: "Counts update on every sale and every delivery. Par levels tell BluthSoft when to act — no clipboard, no guessing at 4 PM.",
          stats: [
            { value: "31%", label: "less spoilage after 90 days" },
            { value: "2 min", label: "average end-of-day close" },
          ],
        },
      },
      {
        // New copy: the whole panel. Revenue adds up to the hero card's $1,284.
        tab: "Sales",
        summary:
          "Sales today, $1,284 so far: frozen bananas 214 sold for $856, up 24%; lemonade 96 for $240, up 12%; extra nuts 168 for $126, flat; chocolate dip 124 for $62, down 6%.",
        title: "Sales today",
        meta: "$1,284 so far",
        columns: ["ITEM", "SOLD", "REVENUE", "VS. TUE"],
        rows: [
          {
            item: "Frozen bananas",
            values: ["214", "$856"],
            status: { label: "↑ 24%", tone: "ok" },
          },
          {
            item: "Lemonade",
            values: ["96", "$240"],
            status: { label: "↑ 12%", tone: "ok" },
          },
          {
            item: "Nuts, extra",
            values: ["168", "$126"],
            status: { label: "Flat", tone: "warning" },
          },
          {
            item: "Chocolate dip",
            values: ["124", "$62"],
            status: { label: "↓ 6%", tone: "alert" },
          },
        ],
        action: "Open today’s report",
        why: {
          label: "WHY IT MATTERS",
          heading: "You see the day while it’s happening.",
          body: "Every sale lands here by item and by hour, so you can staff the rush and pull what isn’t moving before close, not after.",
          stats: [
            { value: "↑ 18%", label: "sales vs. last Tuesday" },
            { value: "3 PM", label: "today’s busiest hour" },
          ],
        },
      },
      {
        // New copy: the whole panel. The first suggestion is the hero card's.
        tab: "Bluth AI",
        summary:
          "Bluth AI suggestions: order 300 frozen bananas by 3:40 PM, confidence 0.91, act now; add a second register Saturday 2 to 4 PM, 0.84, suggested; raise lemonade to $2.75 this week, 0.72, suggested; prep a third fewer nuts on weekdays, 0.88, applied.",
        title: "Suggestions",
        meta: "1 needs you today",
        columns: ["SUGGESTION", "WHEN", "CONF.", "STATUS"],
        rows: [
          {
            item: "Order 300 frozen bananas",
            values: ["By 3:40 PM", "0.91"],
            status: { label: "Act now", tone: "alert" },
          },
          {
            item: "Second register, 2–4 PM",
            values: ["Saturday", "0.84"],
            status: { label: "Suggested", tone: "warning" },
          },
          {
            item: "Lemonade to $2.75",
            values: ["This week", "0.72"],
            status: { label: "Suggested", tone: "warning" },
          },
          {
            item: "Prep a third fewer nuts",
            values: ["Weekdays", "0.88"],
            status: { label: "Applied", tone: "ok" },
          },
        ],
        action: "Review suggestions",
        why: {
          label: "WHY IT MATTERS",
          heading: "It sees the problem before you do.",
          body: "Bluth AI reads your sales, your stock and the weather, then tells you what’s coming and how sure it is. You decide what happens.",
          stats: [
            { value: "0.91", label: "confidence in today’s stockout call" },
            { value: "94% → 6%", label: "stockout risk after one reorder" },
          ],
        },
      },
    ] satisfies readonly ProductPanel[],
  },

  automation: {
    eyebrow: "AUTOMATION",
    heading: "It notices. Then it handles it.",
    lede: "Write the rule once. BluthSoft watches inventory, sales, and shifts, and takes the next step before anyone at the stand notices there was a problem.",
    bullets: [
      "Restock, reorder, and price changes run on your rules, not your memory.",
      "Every run is logged, so you can see exactly what happened and undo it.",
    ],
    cta: { label: "Build your first rule", href: anchors.getStarted },
    rule: {
      // New copy: what screen readers hear for the rule card drawing.
      summary:
        "Rule “Low frozen stock”, active. When banana inventory is below 150 units: supplier order PO-4417 for 300 units from Pier Fruit Co., done; George Michael texted to sign for the 6:15 PM delivery, done; forecast updated, stockout risk 94% to 6%, done; inventory reconciled on the delivery scan, waiting. Last run 3:41 PM.",
      label: "RULE · LOW FROZEN STOCK",
      status: "Active",
      when: {
        label: "WHEN",
        subject: "Banana inventory",
        operator: "is below",
        value: "150 units",
      },
      steps: [
        {
          number: "01",
          title: "Supplier order created",
          detail: "PO-4417 · 300 units · Pier Fruit Co.",
          status: "Done",
        },
        {
          number: "02",
          title: "George Michael notified",
          detail: "SMS · “Delivery 6:15 PM, sign for it”",
          status: "Done",
        },
        {
          number: "03",
          title: "Forecast updated",
          detail: "Stockout risk 94% → 6%",
          status: "Done",
        },
        {
          number: "04",
          title: "Inventory reconciled",
          detail: "On delivery scan",
          status: "Waiting",
        },
      ],
      lastRun: "LAST RUN 3:41 PM · 2.4s",
      history: "View run history",
    },
  },

  proof: {
    // New copy: the section's heading for screen readers (it has no visible one).
    label: "What operators say",
    rating: { score: "4.9 / 5", count: "· 318 reviews" },
    press: ["STANDREVIEW", "FRUITWARE WEEKLY", "SMB OPS AWARDS ’26"],
    // `fill` is the bar under each metric as drawn in the design (0–1).
    metrics: [
      { value: "1,400+", label: "stands on the platform", fill: 0.88 },
      { value: "31%", label: "less spoilage in 90 days", fill: 0.31 },
      { value: "6 hrs", label: "of admin saved per week", fill: 0.6 },
      { value: "$0", label: "to run your first stand", fill: 0.967 },
    ],
    testimonial: {
      quote:
        "“I used to find out we were out of bananas from a customer. Now I find out from my phone, an hour before it happens — and the order’s already placed.”",
      initials: "MB",
      name: "Michael B.",
      role: "Operator, 3 stands · Newport Beach, CA",
      locations: [
        "Balboa Island",
        "Sudden Valley",
        "Santa Monica Pier",
        "Key West",
      ],
      more: "+ 1,380 more",
    },
    receipt: {
      // New copy: what screen readers hear for the receipt drawing.
      summary:
        "A Bluth Banana Stand receipt from Balboa Island: two frozen bananas, extra nuts, two chocolate dips and a lemonade, $12.25, paid by tap at 15:41.",
      store: "BLUTH BANANA STAND",
      terminal: "BALBOA ISLAND · TERM 02",
      lines: [
        { item: "FROZEN BANANA", amount: "2 × 4.00" },
        { item: "NUTS (EXTRA)", amount: "1 × 0.75" },
        { item: "CHOC. DIP", amount: "2 × 0.50" },
        { item: "LEMONADE", amount: "1 × 2.50" },
      ],
      total: { label: "TOTAL", amount: "$12.25" },
      payment: { method: "PAID · TAP", time: "15:41:06" },
      footer: "THERE’S ALWAYS MONEY IN THE BANANA STAND. NOW IT’S ITEMIZED.",
    },
  },

  getStarted: {
    eyebrow: "GET STARTED",
    heading: "Set up your stand in three questions.",
    lede: "We’ll pre-load your inventory items, par levels, and a starter automation. No card, no call, no cornballer.",
    checklist: [
      "Free for one stand, forever",
      "Import from a spreadsheet or start clean",
      "Live before your next shift",
    ],
    // Step 1 is designed. Steps 2 and 3, the step counter's wording for other
    // steps, the buttons other than Back/Continue, the errors and the success
    // messages are new copy.
    // "STEP 1 OF 3" in the design; the numbers change with the step, and the
    // total is 2 when the email already came from the hero form.
    stepOf: "STEP {step} OF {total}",
    steps: {
      stands: {
        name: "Your stands",
        question: "How many stands do you run?",
        options: [
          { value: "1", label: "Just the one", hint: "Free forever" },
          {
            value: "2-5",
            label: "2 – 5 stands",
            hint: "Most operators start here",
          },
          {
            value: "6-20",
            label: "6 – 20 stands",
            hint: "Multi-location reporting",
          },
          {
            value: "20+",
            label: "More than 20",
            hint: "We should probably talk",
          },
        ] satisfies readonly { value: Stands; label: string; hint: string }[],
      },
      sells: {
        name: "Your menu",
        question: "What do you sell?",
        hint: "Pick any that apply. We’ll load the items for you.",
        options: [
          {
            value: "frozen-bananas",
            label: "Frozen bananas",
            hint: "Dipped, nutted, on a stick",
          },
          {
            value: "fresh-fruit",
            label: "Fresh fruit",
            hint: "Whole, sliced or in cups",
          },
          { value: "drinks", label: "Drinks", hint: "Lemonade, smoothies" },
          {
            value: "snacks",
            label: "Snacks & extras",
            hint: "Toppings, chips, merch",
          },
        ] satisfies readonly { value: Sells; label: string; hint: string }[],
      },
      email: {
        name: "Your email",
        question: "Where should we send your login?",
        placeholder: "you@yourstand.com",
      },
    },
    back: "Back",
    next: "Continue",
    submit: "Start free",
    // Shown on the Continue button when "More than 20" is chosen: it goes to /demo.
    toDemo: "Book a demo",
    errors: {
      stands: "Choose how many stands you run.",
      email: "Enter an email address like you@yourstand.com.",
      network:
        "We couldn’t reach BluthSoft. Check your connection and try again.",
    },
    success: {
      heading: "Your stand is on its way.",
      body: "We’ll email you a link to your account, with your items and par levels already loaded.",
    },
    // Replaces the hero form once its signup goes through; the page then
    // scrolls to the setup questions.
    heroSuccess:
      "You’re in. Answer two quick questions below and we’ll set up your stand.",
  },

  finalCta: {
    heading: "More bananas. Less busywork.",
    lede: "Start with one stand, free. Add the rest when you’re ready.",
    primary: startFree,
    secondary: { label: "Book a demo", href: "/demo" },
  },
} as const;
