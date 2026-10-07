import { getInspiration, type InspirationResult } from "@/lib/inspo";
import {
  generateDesign,
  AiServiceError,
} from "./service";
import {
  validateDesignGenerationOutput,
  type DesignGenerationOutput,
  type UxReasoning,
} from "./schemas";

export type DesignPipelineResult = {
  design: DesignGenerationOutput;
  uxReasoning: UxReasoning | null;
  inspiration: InspirationResult;
};

function includesAny(
  value: string,
  terms: string[],
): boolean {
  return terms.some((term) => value.includes(term));
}

function deriveLightweightUxReasoning(
  prompt: string,
): UxReasoning {
  const p = prompt.toLowerCase();

  let primaryTask =
    "Explore the product and complete its main workflow";

  let userContext =
    "A user seeking clarity and a fast path to the primary task";

  let navigationModel =
    "Contextual navigation unless multiple recurring destinations are required";

  let userGoals = [
    "Understand the current context quickly",
    "Complete the primary action with minimal friction",
  ];

  let contentHierarchy = [
    "Screen context and purpose",
    "Primary task content",
    "Supporting information and secondary actions",
  ];

  let interactionPatterns = [
    "Direct selection",
    "Clear primary action",
    "Contextual detail or edit flow",
  ];

  let informationArchitecture = [
    "Context and orientation",
    "Primary workflow",
    "Supporting detail",
  ];

  if (
    includesAny(p, [
      "food",
      "restaurant",
      "delivery",
      "grocery",
      "meal",
    ])
  ) {
    primaryTask =
      "Discover food and complete an order";

    userContext =
      "A hungry customer comparing food options and trying to order quickly";

    navigationModel =
      "Persistent navigation for discovery, search, orders, and profile, with cart access";

    userGoals = [
      "Find a suitable restaurant or dish quickly",
      "Compare useful food information",
      "Customize an order and proceed to checkout",
    ];

    contentHierarchy = [
      "Location/search context",
      "Categories and discovery",
      "Restaurants or dishes",
      "Cart and order progression",
    ];

    informationArchitecture = [
      "Home/discovery",
      "Search/results",
      "Restaurant or dish detail",
      "Cart/order flow",
    ];

    interactionPatterns = [
      "Category filtering",
      "Quick add to cart",
      "Item customization",
      "Cart progression",
    ];
  } else if (
    includesAny(p, [
      "ecommerce",
      "e-commerce",
      "shop",
      "store",
      "product",
      "buy",
    ])
  ) {
    primaryTask =
      "Discover a product, evaluate it, and purchase it";

    userContext =
      "A shopper comparing products, prices, ratings, and availability";

    navigationModel =
      "Persistent navigation for home, search, favorites, and cart";

    userGoals = [
      "Find relevant products quickly",
      "Compare important product information",
      "Add the selected product to the cart and purchase",
    ];

    contentHierarchy = [
      "Search and category context",
      "Product discovery",
      "Product information and options",
      "Cart and purchase progression",
    ];

    informationArchitecture = [
      "Home/discovery",
      "Search/category results",
      "Product detail",
      "Cart/checkout",
    ];

    interactionPatterns = [
      "Search and filtering",
      "Product selection",
      "Wishlist/favorite",
      "Add to cart",
    ];
  } else if (
    includesAny(p, [
      "fitness",
      "workout",
      "gym",
      "exercise",
      "tracker",
    ])
  ) {
    primaryTask =
      "Understand today's activity and start or complete a workout";

    userContext =
      "An active user who needs quick progress context and a clear next action";

    navigationModel =
      "Persistent navigation for today, workouts, progress, and profile";

    userGoals = [
      "Understand today's activity",
      "Start the relevant workout",
      "Track progress without unnecessary friction",
    ];

    contentHierarchy = [
      "Today's progress",
      "Next workout",
      "Exercise or routine details",
      "Historical progress when relevant",
    ];

    informationArchitecture = [
      "Today",
      "Workout detail",
      "Progress",
      "Profile/settings",
    ];

    interactionPatterns = [
      "Start workout",
      "Progress tracking",
      "Exercise completion",
      "Focused workout detail",
    ];
  } else if (
    includesAny(p, [
      "bank",
      "finance",
      "crypto",
      "wallet",
      "budget",
      "money",
    ])
  ) {
    primaryTask =
      "Understand available funds and complete a financial action";

    userContext =
      "A financial user who needs trustworthy information and low-friction actions";

    navigationModel =
      "Persistent navigation for accounts, payments/transfers, cards, and activity";

    userGoals = [
      "Understand available funds",
      "Complete a transfer, payment, or other financial action",
      "Review relevant financial activity",
    ];

    contentHierarchy = [
      "Account/balance context",
      "Primary financial actions",
      "Recent financial activity",
      "Supporting account information",
    ];

    informationArchitecture = [
      "Overview",
      "Accounts and actions",
      "Transaction/activity detail",
      "Profile/security",
    ];

    interactionPatterns = [
      "Financial action shortcuts",
      "Transaction inspection",
      "Amount entry",
      "Confirmation flow",
    ];
  } else if (
    includesAny(p, [
      "task",
      "todo",
      "to-do",
      "productivity",
      "assignment",
      "project",
      "kanban",
      "deadline",
      "student",
    ])
  ) {
    primaryTask =
      "Organize current work, prioritize deadlines, and create or update tasks";

    userContext =
      "A busy user scanning current work and deciding what needs attention next";

    navigationModel =
      "Persistent navigation for overview, tasks, projects/courses, and profile when multiple areas recur";

    userGoals = [
      "See what needs attention now",
      "Understand deadlines and priorities",
      "Create, update, or complete work items",
    ];

    contentHierarchy = [
      "Current workspace context",
      "Today's priorities",
      "Tasks/assignments with status and deadlines",
      "Upcoming work or project context",
    ];

    informationArchitecture = [
      "Overview",
      "Tasks/assignments",
      "Projects or courses",
      "Task/project detail",
      "Creation/editing flow",
    ];

    interactionPatterns = [
      "Completion controls",
      "Status filtering",
      "Priority changes",
      "Create/edit workflow",
    ];
  } else if (
    includesAny(p, [
      "form",
      "survey",
      "signup",
      "sign up",
      "register",
      "checkout",
      "application",
    ])
  ) {
    primaryTask =
      "Complete a structured input workflow accurately";

    userContext =
      "A user providing information who needs clear progression and validation";

    navigationModel =
      "Contextual back navigation with progress when the workflow has multiple steps";

    userGoals = [
      "Understand what information is required",
      "Complete fields without confusion",
      "Submit and receive clear confirmation",
    ];

    contentHierarchy = [
      "Step/context",
      "Required fields",
      "Validation and supporting guidance",
      "Specific submission action",
    ];

    informationArchitecture = [
      "Introduction/progress",
      "Input step",
      "Review",
      "Confirmation",
    ];

    interactionPatterns = [
      "Inline validation",
      "Structured field grouping",
      "Progressive disclosure",
      "Explicit submission",
    ];
  }

  return {
    primaryTask,
    userGoals,
    userContext,
    informationArchitecture,
    navigationModel,
    contentHierarchy,
    interactionPatterns,
    accessibility: [
      "High contrast text ratios",
      "Comfortable 44px+ touch targets",
      "Meaningful labels and semantic controls",
    ],
    responsiveBehavior:
      "Mobile-first composition that reorganizes into wider layouts on tablet and desktop rather than simply scaling the mobile screen",
    emptyLoadingErrorStates: [
      "Useful loading state",
      "Actionable empty state",
      "Specific recovery guidance for errors",
    ],
    designRationale:
      `The interface structure is tailored to the user's primary task: ${primaryTask}.`,
    platform: "responsive",
    jobsToBeDone: [
      `When I need to ${primaryTask.toLowerCase()}, I want the interface to make the next useful action obvious.`,
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* DETERMINISTIC COMPOSITION CHECK                                            */
/* -------------------------------------------------------------------------- */

function runCompositionSanityCheck(
  design: DesignGenerationOutput,
  prompt: string,
): DesignGenerationOutput {
  const product = prompt.toLowerCase();

  const isFinancial = includesAny(product, [
    "bank",
    "finance",
    "crypto",
    "wallet",
    "budget",
    "money",
  ]);

  const forbiddenFinancialTerms = [
    "recent transactions",
    "account balance",
    "transfer money",
    "transaction history",
  ];

  const screens = design.screens.map((screen) => {
    const componentCount = screen.components.length;

    let components = [...screen.components];

    /*
     * Do not fabricate UI components here.
     * The sanity pass only removes accidental renderer-dangerous
     * duplication/empty structures and leaves content generation to Qwen.
     */

    if (!isFinancial) {
      components = components.filter((component) => {
        const searchable = [
          component.name,
          component.props.title,
          component.props.label,
          component.props.subtitle,
        ]
          .filter(
            (value): value is string =>
              typeof value === "string",
          )
          .join(" ")
          .toLowerCase();

        return !forbiddenFinancialTerms.some((term) =>
          searchable.includes(term),
        );
      });
    }

    return {
      ...screen,
      components:
        components.length > 0
          ? components
          : screen.components,
      designRationale:
        screen.designRationale ||
        `This screen supports ${screen.purpose || "the primary product workflow"}.`,
      contentDensity:
        screen.contentDensity ||
        (componentCount >= 10
          ? "comfortable"
          : componentCount >= 6
            ? "compact"
            : "spacious"),
    };
  });

  return validateDesignGenerationOutput({
    ...design,
    screens,
    screen: screens[0],
  });
}

/* -------------------------------------------------------------------------- */
/* PIPELINE                                                                   */
/* -------------------------------------------------------------------------- */

export async function runDesignPipeline(
  prompt: string,
  options: { skipInspo?: boolean } = {},
): Promise<DesignPipelineResult> {
  const uxReasoning = deriveLightweightUxReasoning(prompt);

  const inspirationBrief = [
    prompt,
    `Primary task: ${uxReasoning.primaryTask}`,
    `User context: ${uxReasoning.userContext}`,
    `Information architecture: ${uxReasoning.informationArchitecture.join(" → ")}`,
    `Navigation: ${uxReasoning.navigationModel}`,
  ].join("\n");

  const inspiration = options.skipInspo
    ? {
      available: false,
      query: prompt,
      references: [],
      components: [],
      summary: "",
      toolsInvoked: [],
    }
    : await getInspiration(inspirationBrief);

  const rawDesign = await generateDesign(prompt, {
    uxReasoning,
    inspirationSummary: inspiration.summary || undefined,
  });

  let design = runCompositionSanityCheck(
    validateDesignGenerationOutput(rawDesign),
    prompt,
  );

  if (!design.uxReasoning) {
    design = {
      ...design,
      uxReasoning,
    };
  }

  return {
    design,
    uxReasoning,
    inspiration,
  };
}

export { AiServiceError };