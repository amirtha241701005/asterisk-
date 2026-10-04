export type ComponentStateName =
  | "default"
  | "active"
  | "disabled"
  | "loading"
  | "empty"
  | "error"
  | "success"
  | "selected"
  | "focused";

export type ComponentType =
  | "status"
  | "header"
  | "search"
  | "hero"
  | "categories"
  | "feed"
  | "tabbar"
  | "button"
  | "card"
  | "container"
  | "stack"
  | "grid"
  | "text"
  | "heading"
  | "link"
  | "icon"
  | "image"
  | "avatar"
  | "badge"
  | "input"
  | "select"
  | "checkbox"
  | "radio"
  | "switch"
  | "tabs"
  | "navigation"
  | "list"
  | "table"
  | "alert"
  | "banner"
  | "progress"
  | "divider"
  | "form"
  | "dialog"
  | "media"
  | "chart"
  | "custom";

export type ScreenKind =
  | "home"
  | "explore"
  | "product"
  | "checkout"
  | "detail"
  | "profile"
  | "settings"
  | "dashboard"
  | "search"
  | "onboarding"
  | "custom";

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface Persona {
  name: string;
  age: number | string;
  role: string;
  bio: string;
  goals: string[];
  painPoints: string[];
}

export interface UserFlow {
  title: string;
  steps: string[];
}

export interface UxReasoning {
  userGoals: string[];
  primaryTask: string;
  userContext: string;
  informationArchitecture: string[];
  navigationModel: string;
  contentHierarchy: string[];
  interactionPatterns: string[];
  accessibility: string[];
  responsiveBehavior: string;
  emptyLoadingErrorStates: string[];
  designRationale: string;
  platform?: string;
  jobsToBeDone?: string[];
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: "must" | "should" | "could";
}

export interface DesignDirection {
  theme: string;
  colorPalette: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    accent: string;
  };
  typography: string;
  tone: string;
  notes: string;
}

export interface GeneratedComponentItem {
  title: string;
  meta?: string;
  description?: string;
  price?: string;
  tag?: string;
  imageHint?: string;
  state?: ComponentStateName;
}

export interface InteractionMetadata {
  trigger: string;
  feedback: string;
  result: string;
}

export interface ComponentState {
  name: ComponentStateName;
  description: string;
}

export interface GeneratedComponent {
  id: string;
  type: ComponentType;
  name: string;
  variant?: string;
  relationship?: string;
  hierarchyRole?: "primary" | "secondary" | "supporting" | "navigation";
  states?: ComponentState[];
  interactions?: InteractionMetadata[];
  rationale?: string;
  accessibilityLabel?: string;
  role?: string;
  activeState?: ComponentStateName;
  children?: GeneratedComponent[];
  props: {
    title?: string;
    subtitle?: string;
    label?: string;
    badge?: string;
    placeholder?: string;
    categories?: string[];
    items?: GeneratedComponentItem[];
    tabs?: string[];
    actionText?: string;
    accentColor?: string;
    emptyText?: string;
    loadingText?: string;
    errorText?: string;
    columns?: number;
    gap?: string;
    direction?: "row" | "column";
    href?: string;
    value?: string;
    checked?: boolean;
    progress?: number;
    severity?: "info" | "warning" | "error" | "success";
    [key: string]: unknown;
  };
}

export interface ScreenAction {
  id: string;
  label: string;
  target?: string;
  priority: "primary" | "secondary";
}

export interface TypographyTokens {
  display: string;
  title: string;
  body: string;
  caption: string;
}

export interface ColorTokens {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface GeneratedScreen {
  id: string;
  name: string;
  kind: ScreenKind;
  purpose?: string;
  title: string;
  subtitle?: string;
  primaryAction?: ScreenAction;
  secondaryActions?: ScreenAction[];
  aboveTheFoldPriority?: string[];
  sectionOrdering?: string[];
  layoutStrategy?: string;
  contentDensity?: "compact" | "comfortable" | "spacious";
  typographyTokens?: TypographyTokens;
  colorTokens?: ColorTokens;
  spacingTokens?: SpacingTokens;
  radius?: string;
  elevation?: string;
  realisticContent?: string;
  designRationale?: string;
  responsiveBehavior?: string;
  accessibilityNotes?: string[];
  previewState?: ComponentStateName;
  components: GeneratedComponent[];
}

export interface DesignGenerationOutput {
  persona: Persona;
  userFlow: UserFlow;
  uxReasoning?: UxReasoning;
  requirements: Requirement[];
  designDirection: DesignDirection;
  screens: GeneratedScreen[];
  /** @deprecated use screens */
  screen?: GeneratedScreen;
}

export interface QualityFinding {
  id: string;
  category:
    | "task"
    | "hierarchy"
    | "ia"
    | "navigation"
    | "interaction"
    | "visual"
    | "components"
    | "content"
    | "states"
    | "accessibility"
    | "responsive"
    | "density";
  severity: "low" | "medium" | "high";
  finding: string;
  recommendation: string;
}

export interface DesignQualityReport {
  passed: boolean;
  findings: QualityFinding[];
  summary: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;
}

const COMPONENT_TYPES = new Set<string>([
  "status", "header", "search", "hero", "categories", "feed", "tabbar",
  "button", "card", "container", "stack", "grid", "text", "heading", "link",
  "icon", "image", "avatar", "badge", "input", "select", "checkbox", "radio",
  "switch", "tabs", "navigation", "list", "table", "alert", "banner", "progress",
  "divider", "form", "dialog", "media", "chart", "custom",
]);

const SCREEN_KINDS = new Set<string>([
  "home", "explore", "product", "checkout", "detail", "profile", "settings",
  "dashboard", "search", "onboarding", "custom",
]);

function sanitizeComponent(value: unknown, index: number): GeneratedComponent {
  const component = isRecord(value) ? value : {};
  const props = isRecord(component.props) ? component.props : {};
  const rawType = asString(component.type, "custom");
  const type = COMPONENT_TYPES.has(rawType) ? rawType : "custom";

  const children = Array.isArray(component.children)
    ? component.children.map(sanitizeComponent)
    : undefined;

  return {
    id: asString(component.id, `component-${index + 1}`),
    type: type as ComponentType,
    name: asString(component.name, type),
    variant: asString(component.variant, undefined),
    relationship: asString(component.relationship, undefined),
    hierarchyRole: asString(
      component.hierarchyRole,
      undefined,
    ) as GeneratedComponent["hierarchyRole"],
    states: Array.isArray(component.states)
      ? component.states.filter(isRecord).map((state) => ({
          name: asString(state.name, "default") as ComponentStateName,
          description: asString(state.description, ""),
        }))
      : undefined,
    interactions: Array.isArray(component.interactions)
      ? component.interactions.filter(isRecord).map((interaction) => ({
          trigger: asString(interaction.trigger, "tap"),
          feedback: asString(interaction.feedback, "Subtle visual response"),
          result: asString(interaction.result, "Continues the primary flow"),
        }))
      : undefined,
    rationale: asString(component.rationale, undefined),
    accessibilityLabel: asString(component.accessibilityLabel, undefined),
    role: asString(component.role, undefined),
    activeState: asString(component.activeState, undefined) as
      | ComponentStateName
      | undefined,
    children: children?.length ? children : undefined,
    props,
  };
}

function sanitizeScreen(value: unknown, index: number, fallbackPalette: ColorTokens): GeneratedScreen {
  const screen = isRecord(value) ? value : {};
  const components = Array.isArray(screen.components)
    ? screen.components.map(sanitizeComponent)
    : [];

  const colorTokens = isRecord(screen.colorTokens)
    ? {
        background: asString(screen.colorTokens.background, fallbackPalette.background),
        surface: asString(screen.colorTokens.surface, fallbackPalette.surface),
        primary: asString(screen.colorTokens.primary, fallbackPalette.primary),
        secondary: asString(screen.colorTokens.secondary, fallbackPalette.secondary),
        accent: asString(screen.colorTokens.accent, fallbackPalette.accent),
        text: asString(screen.colorTokens.text, fallbackPalette.text),
        muted: asString(screen.colorTokens.muted, fallbackPalette.muted),
      }
    : fallbackPalette;

  const typographyTokens = isRecord(screen.typographyTokens)
    ? {
        display: asString(screen.typographyTokens.display, "28px"),
        title: asString(screen.typographyTokens.title, "20px"),
        body: asString(screen.typographyTokens.body, "14px"),
        caption: asString(screen.typographyTokens.caption, "11px"),
      }
    : undefined;

  const spacingTokens = isRecord(screen.spacingTokens)
    ? {
        xs: asString(screen.spacingTokens.xs, "4px"),
        sm: asString(screen.spacingTokens.sm, "8px"),
        md: asString(screen.spacingTokens.md, "16px"),
        lg: asString(screen.spacingTokens.lg, "24px"),
        xl: asString(screen.spacingTokens.xl, "32px"),
      }
    : undefined;

  const kind = asString(screen.kind, "custom");
  return {
    id: asString(screen.id, `screen-${index + 1}`),
    name: asString(screen.name, `Screen ${index + 1}`),
    kind: (SCREEN_KINDS.has(kind) ? kind : "custom") as ScreenKind,
    purpose: asString(screen.purpose, undefined),
    title: asString(screen.title, "Generated Screen"),
    subtitle: asString(screen.subtitle, undefined),
    aboveTheFoldPriority: asStringArray(screen.aboveTheFoldPriority),
    sectionOrdering: asStringArray(screen.sectionOrdering),
    layoutStrategy: asString(screen.layoutStrategy, undefined),
    contentDensity: ["compact", "comfortable", "spacious"].includes(
      asString(screen.contentDensity),
    )
      ? (screen.contentDensity as GeneratedScreen["contentDensity"])
      : "comfortable",
    typographyTokens,
    colorTokens,
    spacingTokens,
    radius: asString(screen.radius, "12px"),
    elevation: asString(screen.elevation, undefined),
    realisticContent: asString(screen.realisticContent, undefined),
    designRationale: asString(screen.designRationale, undefined),
    responsiveBehavior: asString(screen.responsiveBehavior, undefined),
    accessibilityNotes: asStringArray(screen.accessibilityNotes),
    previewState: asString(screen.previewState, undefined) as
      | ComponentStateName
      | undefined,
    components,
  };
}

function sanitizeUxReasoning(value: unknown): UxReasoning | undefined {
  if (!isRecord(value)) return undefined;
  return {
    userGoals: asStringArray(value.userGoals, ["Complete the primary task"]),
    primaryTask: asString(value.primaryTask, "Complete the core task"),
    userContext: asString(value.userContext, "Using the product in context"),
    informationArchitecture: asStringArray(value.informationArchitecture),
    navigationModel: asString(value.navigationModel, "Primary navigation model"),
    contentHierarchy: asStringArray(value.contentHierarchy),
    interactionPatterns: asStringArray(value.interactionPatterns),
    accessibility: asStringArray(value.accessibility),
    responsiveBehavior: asString(value.responsiveBehavior, "Mobile-first layout"),
    emptyLoadingErrorStates: asStringArray(value.emptyLoadingErrorStates),
    designRationale: asString(value.designRationale, ""),
    platform: asString(value.platform, undefined),
    jobsToBeDone: asStringArray(value.jobsToBeDone),
  };
}

export function defaultColorTokens(palette?: DesignDirection["colorPalette"]): ColorTokens {
  return {
    background: palette?.background ?? "#0c0a18",
    surface: palette?.surface ?? "#141022",
    primary: palette?.primary ?? "#7c5cff",
    secondary: palette?.secondary ?? "#4f46e5",
    accent: palette?.accent ?? "#a78bfa",
    text: "#f4f4f8",
    muted: "#9a9bb3",
  };
}

export function getScreens(design: DesignGenerationOutput): GeneratedScreen[] {
  if (design.screens?.length) return design.screens;
  if (design.screen) return [design.screen];
  return [];
}

export function getActiveScreen(
  design: DesignGenerationOutput | null,
  screenId: string,
): GeneratedScreen | null {
  if (!design) return null;
  return getScreens(design).find((s) => s.id === screenId) ?? getScreens(design)[0] ?? null;
}

export function validateDesignGenerationOutput(
  value: unknown,
): DesignGenerationOutput {
  if (!isRecord(value)) {
    throw new Error("Generated response is not an object.");
  }

  const persona = isRecord(value.persona) ? value.persona : {};
  const userFlow = isRecord(value.userFlow) ? value.userFlow : {};
  const designDirection = isRecord(value.designDirection)
    ? value.designDirection
    : {};
  const palette = isRecord(designDirection.colorPalette)
    ? designDirection.colorPalette
    : {};
  const fallbackPalette = defaultColorTokens({
    primary: asString(palette.primary, "#7c5cff"),
    secondary: asString(palette.secondary, "#4f46e5"),
    background: asString(palette.background, "#0c0a18"),
    surface: asString(palette.surface, "#141022"),
    accent: asString(palette.accent, "#a78bfa"),
  });

  const rawScreens = Array.isArray(value.screens)
    ? value.screens
    : value.screen
    ? [value.screen]
    : isRecord(value.screen)
    ? [value.screen]
    : [];

  const screens = rawScreens.map((s, i) => sanitizeScreen(s, i, fallbackPalette));

  if (!screens.length || !screens.some((s) => s.components.length > 0)) {
    throw new Error("Generated response is missing screen components.");
  }

  const result: DesignGenerationOutput = {
    persona: {
      name: asString(persona.name, "Primary user"),
      age:
        typeof persona.age === "number" || typeof persona.age === "string"
          ? persona.age
          : "N/A",
      role: asString(persona.role, "User"),
      bio: asString(persona.bio, "A focused user trying to complete a task."),
      goals: asStringArray(persona.goals, ["Complete the primary task quickly"]),
      painPoints: asStringArray(persona.painPoints, [
        "Unclear navigation",
        "Too much friction",
      ]),
    },
    userFlow: {
      title: asString(userFlow.title, "Core task flow"),
      steps: asStringArray(userFlow.steps, [
        "Open",
        "Explore",
        "Choose",
        "Confirm",
      ]),
    },
    uxReasoning: sanitizeUxReasoning(value.uxReasoning),
    requirements: Array.isArray(value.requirements)
      ? value.requirements.filter(isRecord).map((requirement, index) => ({
          id: asString(requirement.id, `req-${index + 1}`),
          title: asString(requirement.title, "Requirement"),
          description: asString(requirement.description, ""),
          priority: ["must", "should", "could"].includes(
            asString(requirement.priority),
          )
            ? (requirement.priority as Requirement["priority"])
            : "should",
        }))
      : [],
    designDirection: {
      theme: asString(designDirection.theme, "Adaptive product interface"),
      colorPalette: {
        primary: asString(palette.primary, "#7c5cff"),
        secondary: asString(palette.secondary, "#4f46e5"),
        background: asString(palette.background, "#0c0a18"),
        surface: asString(palette.surface, "#141022"),
        accent: asString(palette.accent, "#a78bfa"),
      },
      typography: asString(designDirection.typography, "Geist Sans"),
      tone: asString(designDirection.tone, "Clear, useful, modern"),
      notes: asString(
        designDirection.notes,
        "A task-focused interface with intentional hierarchy.",
      ),
    },
    screens,
    screen: screens[0],
  };

  return result;
}

export function validateQualityReport(value: unknown): DesignQualityReport {
  if (!isRecord(value)) {
    return { passed: true, findings: [], summary: "No evaluation available." };
  }
  const findings = Array.isArray(value.findings)
    ? value.findings.filter(isRecord).map((f, i) => ({
        id: asString(f.id, `finding-${i + 1}`),
        category: asString(f.category, "visual") as QualityFinding["category"],
        severity: ["low", "medium", "high"].includes(asString(f.severity))
          ? (f.severity as QualityFinding["severity"])
          : "medium",
        finding: asString(f.finding, ""),
        recommendation: asString(f.recommendation, ""),
      }))
    : [];
  return {
    passed: findings.filter((f) => f.severity === "high").length === 0,
    findings: findings.filter((f) => f.finding),
    summary: asString(value.summary, "Design quality evaluated."),
  };
}
