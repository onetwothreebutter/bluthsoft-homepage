/**
 * Every word on the homepage, in page order.
 *
 * Copy is verbatim from the supplied Figma frame ("BluthSoft Homepage", node
 * 4:2) unless a comment says otherwise. Components render from this file and
 * never hard-code copy, so a copy change is a one-file diff a non-engineer can
 * review. Known contradictions in the supplied copy are deliberately left as
 * designed; see DECISIONS.md.
 */

export interface Link {
  label: string;
  href: string;
}

/** Quiz answers for "How many stands do you run?". The values are what the lead endpoint accepts. */
export const standsValues = ["1", "2-5", "6-20", "20+"] as const;
export type Stands = (typeof standsValues)[number];

// In-page destinations. Links without a section on this page point at real
// paths that don't exist yet; they land on the 404 page, which records the
// click as demand for that page.
const anchors = {
  product: "#product",
  automation: "#automation",
  customers: "#customers",
  getStarted: "#get-started",
} as const;

const startFree: Link = { label: "Start free", href: anchors.getStarted };

export const home = {
  // New copy (not in the design): the document title and meta description.
  meta: {
    title: "BluthSoft — The operating platform for banana stands",
    description:
      "Inventory, sales, staff, and restocking in one system that watches the stand so you don't have to. Free for one stand. No card.",
  },

  nav: {
    brand: "BluthSoft",
    links: [
      { label: "Product", href: anchors.product },
      { label: "Automation", href: anchors.automation },
      { label: "Customers", href: anchors.customers },
      { label: "Pricing", href: "/pricing" },
    ],
    signIn: { label: "Sign in", href: "/sign-in" },
    cta: startFree,
  },

  hero: {
    eyebrow: "Now with Bluth AI forecasting",
    heading: "Run your banana stand without going bananas.",
    lede: "BluthSoft is the operating platform for banana stands. Inventory, sales, staff, and restocking — one system that watches the stand so you don't have to.",
    form: {
      placeholder: "you@yourstand.com",
      submit: "Start free",
    },
    note: "Free for one stand. No card.",
    secondary: { label: "See the platform", href: anchors.product },
    rating: {
      score: "4.9",
      source: "from 318 stand operators",
      aside: "Live in a day",
    },
    dashboard: {
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
    // Only the Inventory panel is designed. The plan replaces Staff and
    // Forecast with Sales and Bluth AI panels in the same layout (new copy,
    // added with the tabs section).
    tabs: ["Inventory", "Staff", "Forecast"],
    syncStatus: "SYNCED 12s AGO",
    inventory: {
      title: "Stock on hand",
      meta: "4 items below par",
      columns: ["ITEM", "ON HAND", "PAR", "STATUS"],
      rows: [
        {
          item: "Bananas, ripe",
          onHand: "126",
          par: "300",
          status: "Below par",
        },
        {
          item: "Frozen bananas",
          onHand: "41",
          par: "120",
          status: "Reorder now",
        },
        {
          item: "Chocolate dip",
          onHand: "18 lb",
          par: "12 lb",
          status: "Healthy",
        },
        {
          item: "Nuts, chopped",
          onHand: "9 lb",
          par: "10 lb",
          status: "Below par",
        },
        { item: "Cups, 12 oz", onHand: "640", par: "400", status: "Healthy" },
      ],
      action: "Create restock order",
    },
    whyItMatters: {
      label: "WHY IT MATTERS",
      heading: "You always know what you have.",
      body: "Counts update on every sale and every delivery. Par levels tell BluthSoft when to act — no clipboard, no guessing at 4 PM.",
      stats: [
        { value: "31%", label: "less spoilage after 90 days" },
        { value: "2 min", label: "average end-of-day close" },
      ],
    },
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
    // Step 1 is designed; steps 2 ("What do you sell?") and 3 (email) are new
    // copy, added with the quiz.
    steps: {
      stands: {
        progress: "STEP 1 OF 3",
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
    },
    back: "Back",
    next: "Continue",
  },

  finalCta: {
    heading: "More bananas. Less busywork.",
    lede: "Start with one stand, free. Add the rest when you’re ready.",
    primary: startFree,
    secondary: { label: "Book a demo", href: "/demo" },
  },

  footer: {
    brand: "BluthSoft",
    tagline:
      "The operating platform for banana stands. Built in Newport Beach.",
    columns: [
      {
        heading: "PRODUCT",
        links: [
          { label: "Inventory", href: anchors.product },
          { label: "Automation", href: anchors.automation },
          { label: "Bluth AI", href: anchors.product },
          { label: "Staff & shifts", href: "/staff" },
        ],
      },
      {
        heading: "COMPANY",
        links: [
          { label: "Customers", href: anchors.customers },
          { label: "Pricing", href: "/pricing" },
          { label: "Careers", href: "/careers" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        heading: "RESOURCES",
        links: [
          { label: "Docs", href: "/docs" },
          { label: "Operator guides", href: "/guides" },
          { label: "Rule library", href: "/rules" },
          { label: "Status", href: "/status" },
        ],
      },
    ],
    copyright: "© 2026 BLUTHSOFT, INC.",
    legal: [
      { label: "PRIVACY", href: "/privacy" },
      { label: "TERMS", href: "/terms" },
    ],
    motto: "THERE’S ALWAYS MONEY IN THE BANANA STAND.",
  },
} as const;
