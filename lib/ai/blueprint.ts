import type { ScreenKind, UxReasoning } from "./schemas";

export type BlueprintScreen = {
  id: string;
  name: string;
  kind: ScreenKind;
  purpose: string;
  primaryTask: string;
  primaryCta: string;
  inBottomNav: boolean;
  connectsTo: string[];
  content: string[];
  states: string[];
};

export type DesignBlueprint = {
  productType: string;
  targetUsers: string;
  primaryGoal: string;
  secondaryGoals: string[];
  coreActions: string[];
  importantContent: string[];
  navigation: {
    model: "bottom-tabs" | "contextual" | "mixed";
    primary: string[];
    secondary: string[];
  };
  screens: BlueprintScreen[];
  screenRelationships: string[];
  visualDirection: {
    tone: string;
    typography: string;
    spacingDensity: "compact" | "comfortable" | "spacious";
    cornerRadius: string;
    surface: string;
    cardUsage: string;
    buttonStyle: string;
    colorDirection: string;
    hierarchy: string;
  };
  componentPatterns: string[];
  importantStates: string[];
  uxPriorities: string[];
  accessibility: string[];
};

type Intent =
  | "discovery"
  | "search"
  | "detail"
  | "commerce"
  | "tracking"
  | "creation"
  | "planning"
  | "progress"
  | "identity"
  | "social"
  | "messaging";

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function extractClause(prompt: string, pattern: RegExp, fallback: string) {
  const match = prompt.match(pattern);
  if (!match?.[1]) return fallback;
  return match[1].replace(/[.?!].*$/, "").trim();
}

function detectIntents(prompt: string): Intent[] {
  const p = prompt.toLowerCase();
  const intents: Intent[] = [];

  const rules: Array<[Intent, string[]]> = [
    ["search", ["search", "find", "look up", "query"]],
    [
      "discovery",
      [
        "discover",
        "browse",
        "explore",
        "catalog",
        "feed",
        "directory",
        "events",
        "restaurants",
        "destinations",
      ],
    ],
    [
      "detail",
      [
        "menu",
        "details",
        "destination",
        "profile of",
        "itinerary",
        "recipe",
        "workout",
      ],
    ],
    [
      "commerce",
      [
        "order",
        "checkout",
        "cart",
        "buy",
        "purchase",
        "book",
        "booking",
        "pay",
        "ticket",
      ],
    ],
    [
      "tracking",
      ["track", "status", "orders", "delivery", "history", "activity"],
    ],
    [
      "creation",
      ["create", "add", "compose", "post", "new ", "manage", "submit"],
    ],
    [
      "planning",
      [
        "plan",
        "planner",
        "itinerary",
        "calendar",
        "schedule",
        "deadline",
        "weekend",
        "trip",
      ],
    ],
    [
      "progress",
      [
        "progress",
        "budget",
        "stats",
        "metrics",
        "goal",
        "habit",
        "fitness",
        "beginner",
      ],
    ],
    ["identity", ["profile", "account", "settings", "me"]],
    ["social", ["friends", "campus", "community", "share", "follow"]],
    ["messaging", ["chat", "message", "inbox", "notify"]],
  ];

  for (const [intent, keys] of rules) {
    if (includesAny(p, keys)) intents.push(intent);
  }

  if (!intents.includes("discovery")) intents.unshift("discovery");
  if (!intents.includes("identity") && intents.length >= 3) {
    intents.push("identity");
  }

  return unique(intents) as Intent[];
}

function inferVisual(prompt: string, intents: Intent[]) {
  const p = prompt.toLowerCase();
  const exploratory =
    intents.includes("discovery") &&
    (intents.includes("planning") ||
      includesAny(p, ["travel", "event", "photo", "destination", "campus"]));
  const structured = includesAny(p, [
    "finance",
    "budget",
    "bank",
    "money",
    "invoice",
    "professional",
  ]);
  const energetic = includesAny(p, [
    "fitness",
    "workout",
    "energy",
    "sport",
    "run",
  ]);
  const focused = includesAny(p, [
    "productivity",
    "assignment",
    "task",
    "student",
    "focus",
    "study",
  ]);
  const frequent = intents.includes("commerce") || intents.includes("search");

  if (structured) {
    return {
      tone: "structured, trustworthy, information-focused",
      typography: "precise tabular-friendly sans, strong numeric hierarchy",
      spacingDensity: "compact" as const,
      cornerRadius: "8-12px restrained radii",
      surface: "quiet panels, clear dividers, low decoration",
      cardUsage: "summary metrics and grouped records, not card-everywhere",
      buttonStyle: "solid, high-contrast, confirmation-safe",
      colorDirection: "restrained neutrals with one trustworthy accent",
      hierarchy: "numbers and status first, actions second",
    };
  }

  if (energetic) {
    return {
      tone: "energetic, motivational, progress-focused",
      typography: "bold titles, compact supporting copy",
      spacingDensity: "comfortable" as const,
      cornerRadius: "16px friendly radii",
      surface: "emphasized hero progress, supporting lists below",
      cardUsage: "progress and session cards; avoid dashboard clutter",
      buttonStyle: "large primary CTA for start/continue",
      colorDirection: "vivid accent on a calm base",
      hierarchy: "today's progress, next action, supporting history",
    };
  }

  if (exploratory) {
    return {
      tone: "visual, exploratory, immersive",
      typography: "editorial titles with readable body",
      spacingDensity: "comfortable" as const,
      cornerRadius: "16-20px media-friendly radii",
      surface: "imagery-led cards with restrained chrome",
      cardUsage: "collection cards with photo + key facts",
      buttonStyle: "clear search and save actions",
      colorDirection: "atmospheric palette from imagery, one action accent",
      hierarchy: "search/context, featured places, details on demand",
    };
  }

  if (focused) {
    return {
      tone: "clean, focused, low cognitive load",
      typography: "clear workhorse sans, deadline-readable metadata",
      spacingDensity: "comfortable" as const,
      cornerRadius: "12px consistent radii",
      surface: "simple grouped lists, light surfaces, little chrome",
      cardUsage: "use lists more than stacked marketing cards",
      buttonStyle: "specific create/complete actions",
      colorDirection: "neutral canvas, one accent for priority/status",
      hierarchy: "what is due now, then lists, then secondary planning",
    };
  }

  if (frequent) {
    return {
      tone: "fast, scannable, task-efficient",
      typography: "medium titles, scannable item rows",
      spacingDensity: "compact" as const,
      cornerRadius: "12-16px",
      surface: "sticky search/header, dense lists, persistent nav",
      cardUsage: "category chips + item cards, not generic widgets",
      buttonStyle: "thumb-friendly primary actions",
      colorDirection: "one brand accent on a clean canvas",
      hierarchy: "search/context, categories, items, checkout path",
    };
  }

  return {
    tone: "calm, precise, modern, purposeful",
    typography: "clear sans hierarchy without decorative display type",
    spacingDensity: "comfortable" as const,
    cornerRadius: "12px",
    surface: "few well-separated surfaces",
    cardUsage: "group related content only",
    buttonStyle: "one obvious primary action per screen",
    colorDirection: "one accent, accessible contrast",
    hierarchy: "purpose, primary content, supporting actions",
  };
}

function componentPatternsFor(intents: Intent[]): string[] {
  const patterns: string[] = [
    "header: product context and orientation",
    "button: one meaningful primary action per screen",
  ];

  if (intents.includes("search")) {
    patterns.push("search: query field when finding is a core action");
  }
  if (intents.includes("discovery")) {
    patterns.push(
      "categories/tabs/chips: browse facets; list/grid/card: entity collections",
    );
  }
  if (intents.includes("progress")) {
    patterns.push(
      "card/progress: summary metrics only when the product tracks them",
    );
  }
  if (intents.includes("planning") || intents.includes("commerce")) {
    patterns.push(
      "progress/stepper-like sequences only for multi-step tasks",
    );
  }
  if (intents.includes("identity")) {
    patterns.push("avatar + profile sections for identity screens");
  }
  if (intents.includes("tracking")) {
    patterns.push("badge/status: order, trip, or task state");
  }
  if (intents.includes("creation")) {
    patterns.push("form/input: labeled fields for create/edit flows");
  }
  if (intents.includes("detail")) {
    patterns.push("heading + media + supporting list for entity detail");
  }

  patterns.push(
    "tabbar/navigation: only for recurring destinations that exist as screens",
  );
  patterns.push(
    "alert/empty/loading: real states, never placeholder lorem or Untitled",
  );

  return patterns;
}

function planScreens(
  prompt: string,
  intents: Intent[],
  productType: string,
  primaryGoal: string,
): BlueprintScreen[] {
  const p = prompt.toLowerCase();
  const screens: BlueprintScreen[] = [];

  const add = (screen: Omit<BlueprintScreen, "connectsTo">) => {
    screens.push({ ...screen, connectsTo: [] });
  };

  add({
    id: "home",
    name: "Home",
    kind: "home",
    purpose: "Primary entry and orientation for the core job",
    primaryTask: primaryGoal,
    primaryCta: intents.includes("search")
      ? "Search"
      : intents.includes("creation")
        ? "Create"
        : "Start",
    inBottomNav: true,
    content: [
      "Greeting or current context",
      "Primary discovery or today's focus",
      "Shortcuts into the main workflow",
    ],
    states: ["default", "loading", "empty"],
  });

  if (intents.includes("search")) {
    add({
      id: "search",
      name: "Search",
      kind: "search",
      purpose: "Find a specific item, place, or record quickly",
      primaryTask: "Search and filter results",
      primaryCta: "View result",
      inBottomNav: true,
      content: ["Search field", "Filters or recent queries", "Result list"],
      states: ["empty", "loading", "default"],
    });
  } else if (intents.includes("discovery") && !includesAny(p, ["simple", "timer", "note"])) {
    add({
      id: "explore",
      name: "Explore",
      kind: "explore",
      purpose: "Browse categories or collections beyond the home snapshot",
      primaryTask: "Browse and choose an item",
      primaryCta: "Open item",
      inBottomNav: true,
      content: ["Facets or categories", "Collection of items"],
      states: ["default", "empty"],
    });
  }

  if (
    intents.includes("detail") ||
    intents.includes("discovery") ||
    intents.includes("commerce")
  ) {
    const detailName = includesAny(p, ["restaurant", "food", "menu"])
      ? "Menu"
      : includesAny(p, ["trip", "travel", "destination"])
        ? "Destination"
        : includesAny(p, ["workout", "fitness"])
          ? "Workout"
          : includesAny(p, ["event"])
            ? "Event"
            : includesAny(p, ["assignment", "task"])
              ? "Task"
              : "Details";

    add({
      id: slugify(detailName, "detail"),
      name: detailName,
      kind: includesAny(p, ["product", "shop"]) ? "product" : "detail",
      purpose: `Inspect a single ${detailName.toLowerCase()} and act on it`,
      primaryTask: `Understand the ${detailName.toLowerCase()} and take the primary action`,
      primaryCta: intents.includes("commerce")
        ? "Add / continue"
        : intents.includes("planning")
          ? "Add to plan"
          : "Continue",
      inBottomNav: false,
      content: [
        "Identity and key facts",
        "Supporting details",
        "Primary action",
      ],
      states: ["default", "loading", "error"],
    });
  }

  if (intents.includes("commerce")) {
    add({
      id: "checkout",
      name: includesAny(p, ["book", "ticket"]) ? "Booking" : "Cart",
      kind: "checkout",
      purpose: "Review selections and complete the transaction",
      primaryTask: "Confirm items and checkout",
      primaryCta: "Checkout",
      inBottomNav: false,
      content: ["Selected items", "Totals or constraints", "Confirm action"],
      states: ["default", "empty", "error"],
    });
  }

  if (intents.includes("planning") && !screens.some((s) => s.id === "itinerary")) {
    add({
      id: "plan",
      name: includesAny(p, ["trip", "travel"]) ? "Itinerary" : "Plan",
      kind: "dashboard",
      purpose: "See the planned sequence and adjust it",
      primaryTask: "Review and edit the plan",
      primaryCta: "Edit plan",
      inBottomNav: true,
      content: ["Timeline or grouped stops", "Dates/constraints"],
      states: ["default", "empty"],
    });
  }

  if (intents.includes("tracking") && !intents.includes("commerce")) {
    add({
      id: "activity",
      name: "Activity",
      kind: "dashboard",
      purpose: "Review recent status, history, or progress",
      primaryTask: "Understand current status",
      primaryCta: "View details",
      inBottomNav: true,
      content: ["Current status", "Recent history"],
      states: ["default", "empty"],
    });
  }

  if (intents.includes("commerce") && intents.includes("tracking")) {
    add({
      id: "orders",
      name: "Orders",
      kind: "dashboard",
      purpose: "Track past and in-progress orders",
      primaryTask: "Check order status",
      primaryCta: "Track",
      inBottomNav: true,
      content: ["Active orders", "Past orders"],
      states: ["default", "empty", "loading"],
    });
  }

  if (intents.includes("progress") && !screens.some((s) => s.kind === "dashboard")) {
    add({
      id: "progress",
      name: includesAny(p, ["finance", "budget", "money"]) ? "Overview" : "Progress",
      kind: "dashboard",
      purpose: "Summarize progress against the user's goals",
      primaryTask: "Read status and decide the next action",
      primaryCta: "Continue",
      inBottomNav: true,
      content: ["Summary metrics that belong to this product", "Next action"],
      states: ["default", "empty"],
    });
  }

  if (intents.includes("creation") && includesAny(p, ["assignment", "task", "note", "post"])) {
    add({
      id: "create",
      name: "New item",
      kind: "custom",
      purpose: "Capture a new item with the required fields",
      primaryTask: "Create an item accurately",
      primaryCta: "Save",
      inBottomNav: false,
      content: ["Labeled fields", "Validation", "Submit"],
      states: ["default", "error", "success"],
    });
  }

  if (!screens.some((s) => s.kind === "profile")) {
    add({
      id: "profile",
      name: "Profile",
      kind: "profile",
      purpose: "Account, preferences, and secondary settings",
      primaryTask: "Manage identity and preferences",
      primaryCta: "Edit profile",
      inBottomNav: true,
      content: ["Identity", "Preferences", "Supportive account actions"],
      states: ["default"],
    });
  }

  const simple = includesAny(p, ["simple", "widget", "timer", "calculator"]);
  const max = simple ? 3 : Math.min(6, Math.max(3, screens.length));
  let planned = screens.slice(0, max);

  if (planned.length < 3 && !simple) {
    planned = screens.slice(0, 3);
  }

  const ids = new Set(planned.map((s) => s.id));
  const navIds = planned.filter((s) => s.inBottomNav).map((s) => s.id);

  return planned.map((screen, index) => {
    const next = planned[index + 1];
    const connectsTo = unique(
      [
        ...screen.connectsTo,
        next?.id,
        screen.kind === "home" ? planned.find((s) => s.kind === "search")?.id : undefined,
        screen.kind === "search" || screen.kind === "explore"
          ? planned.find((s) => s.kind === "detail" || s.kind === "product")?.id
          : undefined,
        screen.kind === "detail" || screen.kind === "product"
          ? planned.find((s) => s.kind === "checkout")?.id
          : undefined,
      ].filter((id): id is string => Boolean(id) && ids.has(id)),
    );

    return {
      ...screen,
      inBottomNav: screen.inBottomNav && navIds.includes(screen.id),
      connectsTo,
      content: [
        ...screen.content,
        `Stay inside the ${productType} domain`,
      ],
    };
  });
}

export function analyzeProduct(prompt: string): DesignBlueprint {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  const productType = extractClause(
    lower,
    /(?:create|design|build|make|generate)\s+(?:an?\s+)?(.+?)(?:\s+for\s+|$)/i,
    extractClause(lower, /(?:an?\s+)?(.+?)(?:\s+app|\s+product|\s+tool)/, "digital product"),
  )
    .replace(/\s+(app|application|product|tool|platform)$/i, "")
    .trim() || "digital product";

  const targetUsers = extractClause(
    trimmed,
    /\bfor\s+(.+?)(?:[.?!]|$)/i,
    "people trying to complete the product's main job",
  );

  const intents = detectIntents(lower);
  const coreActions = unique(
    [
      intents.includes("discovery") ? "browse relevant items" : "",
      intents.includes("search") ? "search" : "",
      intents.includes("detail") ? "inspect details" : "",
      intents.includes("commerce") ? "complete purchase or order" : "",
      intents.includes("tracking") ? "track status" : "",
      intents.includes("planning") ? "plan the outing or schedule" : "",
      intents.includes("creation") ? "create or update an item" : "",
      intents.includes("progress") ? "review progress" : "",
      intents.includes("identity") ? "manage profile" : "",
    ].filter(Boolean),
  );

  const primaryGoal =
    coreActions[0] ||
    `complete the main job of a ${productType} product`;

  const secondaryGoals = coreActions.slice(1, 4);
  const importantContent = unique([
    ...productType.split(/[,\s]+/).filter((word) => word.length > 3).slice(0, 6),
    ...coreActions,
  ]);

  const screens = planScreens(trimmed, intents, productType, primaryGoal);
  const navPrimary = screens.filter((s) => s.inBottomNav).map((s) => s.name);
  const navSecondary = screens.filter((s) => !s.inBottomNav).map((s) => s.name);
  const visualDirection = inferVisual(lower, intents);

  const screenRelationships = screens.flatMap((screen) =>
    screen.connectsTo.map((target) => {
      const dest = screens.find((s) => s.id === target);
      return `${screen.name} → ${dest?.name || target} (${screen.primaryCta})`;
    }),
  );

  return {
    productType,
    targetUsers,
    primaryGoal,
    secondaryGoals,
    coreActions,
    importantContent,
    navigation: {
      model: navPrimary.length >= 3 ? "bottom-tabs" : "mixed",
      primary: navPrimary,
      secondary: navSecondary,
    },
    screens,
    screenRelationships,
    visualDirection,
    componentPatterns: componentPatternsFor(intents),
    importantStates: unique(screens.flatMap((s) => s.states)),
    uxPriorities: [
      "task completion",
      "clarity",
      "hierarchy",
      "consistency",
      "visual polish",
    ],
    accessibility: [
      "Readable contrast on all text",
      "44px+ touch targets",
      "Labeled inputs, buttons, and icons",
      "Visible selected/focus states",
    ],
  };
}

export function blueprintToUxReasoning(blueprint: DesignBlueprint): UxReasoning {
  return {
    userGoals: [blueprint.primaryGoal, ...blueprint.secondaryGoals],
    primaryTask: blueprint.primaryGoal,
    userContext: `${blueprint.targetUsers} using a ${blueprint.productType} product`,
    informationArchitecture: blueprint.screens.map(
      (screen) => `${screen.name}: ${screen.purpose}`,
    ),
    navigationModel:
      blueprint.navigation.model === "bottom-tabs"
        ? `Persistent bottom navigation for ${blueprint.navigation.primary.join(", ")}. Detail/checkout/create screens stay out of the tab bar.`
        : "Contextual navigation between related screens",
    contentHierarchy: blueprint.screens[0]?.content || [
      "Context",
      "Primary content",
      "Actions",
    ],
    interactionPatterns: blueprint.coreActions,
    accessibility: blueprint.accessibility,
    responsiveBehavior:
      "Mobile-first. Reorganize to wider layouts on tablet/desktop; do not stretch a phone layout.",
    emptyLoadingErrorStates: blueprint.importantStates,
    designRationale: `Plan ${blueprint.screens.length} purposeful screens for ${blueprint.productType}. Visual direction: ${blueprint.visualDirection.tone}.`,
    platform: "responsive",
    jobsToBeDone: [
      `When I need to ${blueprint.primaryGoal}, the next useful action should be obvious.`,
    ],
  };
}

export function compactBlueprint(blueprint: DesignBlueprint) {
  return {
    productType: blueprint.productType,
    targetUsers: blueprint.targetUsers,
    primaryGoal: blueprint.primaryGoal,
    secondaryGoals: blueprint.secondaryGoals,
    coreActions: blueprint.coreActions,
    navigation: blueprint.navigation,
    screens: blueprint.screens.map((screen) => ({
      id: screen.id,
      name: screen.name,
      kind: screen.kind,
      purpose: screen.purpose,
      primaryTask: screen.primaryTask,
      primaryCta: screen.primaryCta,
      inBottomNav: screen.inBottomNav,
      connectsTo: screen.connectsTo,
      content: screen.content,
      states: screen.states,
    })),
    screenRelationships: blueprint.screenRelationships,
    visualDirection: blueprint.visualDirection,
    componentPatterns: blueprint.componentPatterns,
    importantStates: blueprint.importantStates,
    uxPriorities: blueprint.uxPriorities,
    accessibility: blueprint.accessibility,
  };
}

export function inspirationQueryFrom(blueprint: DesignBlueprint) {
  return [
    `${blueprint.productType} mobile app for ${blueprint.targetUsers}`,
    `Goal: ${blueprint.primaryGoal}`,
    `Screens: ${blueprint.screens.map((s) => s.name).join(", ")}`,
    `Visual: ${blueprint.visualDirection.tone}`,
  ].join(". ");
}
