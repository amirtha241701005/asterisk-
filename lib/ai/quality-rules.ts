import type { DesignBlueprint } from "./blueprint";
import type {
  DesignGenerationOutput,
  GeneratedComponent,
  GeneratedScreen,
} from "./schemas";
import { getScreens } from "./schemas";

export type QualityIssue = {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
};

const PLACEHOLDER_RE =
  /\b(lorem|ipsum|placeholder|untitled|grid container|example component|generic section|n\/a|todo|tbd|lorem ipsum)\b/i;

const GENERIC_ACTION_RE = /^(action|continue|submit|click me|button|item|items)$/i;

const GENERIC_VISIBLE_COPY_RE = /^(action|item|items|content|details|section|component|frame|container|placeholder)$/i;

const GENERIC_LABEL_RE =
  /^(section|component|frame|container|content|items|card|header|details|action)$/i;

const FINANCE_LEAK =
  /\b(account balance|total balance|recent transactions|transfer money|wallet balance|revenue|investment portfolio)\b/i;

function walkComponents(
  components: GeneratedComponent[],
  visit: (component: GeneratedComponent) => void,
) {
  for (const component of components) {
    visit(component);
    if (component.children?.length) walkComponents(component.children, visit);
  }
}

function textBlob(component: GeneratedComponent) {
  const props = component.props || {};
  return [
    component.name,
    component.accessibilityLabel,
    props.title,
    props.subtitle,
    props.label,
    props.placeholder,
    props.actionText,
    props.emptyText,
    props.text,
    props.value,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

function uniqueIds(prefix: string, used: Set<string>, raw: string) {
  let id = raw || prefix;
  if (!used.has(id)) {
    used.add(id);
    return id;
  }
  let i = 2;
  while (used.has(`${id}-${i}`)) i += 1;
  const next = `${id}-${i}`;
  used.add(next);
  return next;
}

function collectNavLabels(component: GeneratedComponent): string[] {
  const props = component.props || {};
  if (Array.isArray(props.tabs)) {
    return props.tabs.filter((item): item is string => typeof item === "string");
  }
  if (Array.isArray(props.items)) {
    return props.items
      .map((item) => item.title)
      .filter((item): item is string => Boolean(item));
  }
  return [];
}

function setNavLabels(component: GeneratedComponent, labels: string[]) {
  if (Array.isArray(component.props.tabs)) {
    component.props.tabs = labels;
  } else if (Array.isArray(component.props.items)) {
    component.props.items = labels.map((title) => ({ title }));
  } else {
    component.props.tabs = labels;
  }
}

export function auditDesign(
  design: DesignGenerationOutput,
  blueprint?: DesignBlueprint | null,
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const screens = getScreens(design);
  const screenIds = screens.map((s) => s.id);
  const screenNames = screens.map((s) => s.name.toLowerCase());

  if (!screens.length) {
    issues.push({
      id: "no-screens",
      severity: "high",
      message: "No screens were generated.",
    });
    return issues;
  }

  const seenScreenIds = new Set<string>();
  for (const screen of screens) {
    if (seenScreenIds.has(screen.id)) {
      issues.push({
        id: `dup-screen-${screen.id}`,
        severity: "high",
        message: `Duplicate screen id: ${screen.id}`,
      });
    }
    seenScreenIds.add(screen.id);

    if (!screen.components.length) {
      issues.push({
        id: `empty-${screen.id}`,
        severity: "high",
        message: `Screen ${screen.name} has no components.`,
      });
    }

    const componentIds = new Set<string>();
    walkComponents(screen.components, (component) => {
      if (componentIds.has(component.id)) {
        issues.push({
          id: `dup-comp-${component.id}`,
          severity: "high",
          message: `Duplicate component id ${component.id} on ${screen.name}`,
        });
      }
      componentIds.add(component.id);

      const blob = textBlob(component);
      if (PLACEHOLDER_RE.test(blob)) {
        issues.push({
          id: `placeholder-${component.id}`,
          severity: "high",
          message: `Placeholder copy on ${screen.name}: ${component.name}`,
        });
      }
      if (GENERIC_LABEL_RE.test(component.name.trim())) {
        issues.push({
          id: `generic-name-${component.id}`,
          severity: "medium",
          message: `Generic component name "${component.name}" on ${screen.name}`,
        });
      }

      const visibleCopy = [
        component.name,
        component.props.title,
        component.props.label,
        component.props.actionText,
        component.props.placeholder,
        component.props.emptyText,
        component.props.text,
        component.props.value,
      ].filter((value): value is string => typeof value === "string");

      if (visibleCopy.some((value) => GENERIC_VISIBLE_COPY_RE.test(value.trim()))) {
        issues.push({
          id: `generic-copy-${component.id}`,
          severity: "medium",
          message: `Generic visible copy on ${screen.name}: ${component.name}. Replace it with product-specific wording.`,
        });
      }

      // List/grid data is user-visible too; inspect item titles and descriptions.
      if (Array.isArray(component.props.items)) {
        component.props.items.forEach((item, itemIndex) => {
          if (!item || typeof item !== "object") return;
          const record = item as Record<string, unknown>;
          for (const field of ["title", "description", "meta", "tag"]) {
            const value = record[field];
            if (typeof value === "string" && GENERIC_VISIBLE_COPY_RE.test(value.trim())) {
              issues.push({
                id: `generic-item-${component.id}-${itemIndex}-${field}`,
                severity: "medium",
                message: `Generic list content on ${screen.name}: ${component.name} item ${itemIndex + 1} has a generic ${field}.`,
              });
            }
          }
        });
      }

      if (
        (component.type === "button" || component.type === "link") &&
        GENERIC_ACTION_RE.test(
          String(component.props.label || component.props.actionText || ""),
        )
      ) {
        issues.push({
          id: `generic-cta-${component.id}`,
          severity: "medium",
          message: `Generic button label on ${screen.name}`,
        });
      }

      if (
        (component.type === "input" || component.type === "search") &&
        !String(component.props.label || component.props.placeholder || "").trim()
      ) {
        issues.push({
          id: `unlabeled-input-${component.id}`,
          severity: "medium",
          message: `Input on ${screen.name} is missing a label/placeholder`,
        });
      }

      if (
        (component.type === "navigation" || component.type === "tabbar") &&
        collectNavLabels(component).some(
          (label) => !screenNames.includes(label.toLowerCase()),
        )
      ) {
        issues.push({
          id: `nav-mismatch-${component.id}`,
          severity: "high",
          message: `Navigation on ${screen.name} points at screens that were not generated.`,
        });
      }

      for (const interaction of component.interactions || []) {
        const target = interaction.result.match(/screen[:\s]+([a-z0-9-]+)/i)?.[1];
        if (target && !screenIds.includes(target)) {
          issues.push({
            id: `bad-target-${component.id}`,
            severity: "medium",
            message: `Interaction targets unknown screen ${target}`,
          });
        }
      }
    });
  }

  const names = screens.map((s) => `${s.name}|${s.purpose}`.toLowerCase());
  if (new Set(names).size !== names.length) {
    issues.push({
      id: "duplicate-screens",
      severity: "high",
      message: "Two screens share the same name/purpose.",
    });
  }

  const domain = `${blueprint?.productType || ""} ${design.persona.role || ""}`.toLowerCase();
  const financialProduct = /\b(finance|bank|budget|money|wallet|invest)\b/.test(
    domain,
  );
  if (!financialProduct) {
    for (const screen of screens) {
      walkComponents(screen.components, (component) => {
        if (FINANCE_LEAK.test(textBlob(component))) {
          issues.push({
            id: `domain-leak-${component.id}`,
            severity: "high",
            message: `Financial copy leaked into a non-finance product on ${screen.name}`,
          });
        }
      });
    }
  }

  if (blueprint) {
    const plannedNav = blueprint.navigation.primary.map((n) => n.toLowerCase());
    const generatedNav = screens
      .filter((s) =>
        s.components.some((c) => c.type === "tabbar" || c.type === "navigation"),
      )
      .map((s) => s.id);

    if (
      blueprint.navigation.model === "bottom-tabs" &&
      plannedNav.length >= 3 &&
      generatedNav.length === 0
    ) {
      issues.push({
        id: "missing-nav",
        severity: "medium",
        message: "Blueprint expects persistent navigation but none was generated.",
      });
    }
  }

  return issues;
}

function remapNav(component: GeneratedComponent, screens: GeneratedScreen[]) {
  if (component.type !== "navigation" && component.type !== "tabbar") return;
  const allowed = screens
    .filter((screen) =>
      ["home", "explore", "search", "dashboard", "profile", "settings"].includes(
        screen.kind,
      ),
    )
    .map((screen) => screen.name);
  const labels = (allowed.length ? allowed : screens.map((s) => s.name)).slice(
    0,
    5,
  );
  if (labels.length) setNavLabels(component, labels);
}

export function repairDesignLocally(
  design: DesignGenerationOutput,
  blueprint?: DesignBlueprint | null,
): DesignGenerationOutput {
  const usedScreenIds = new Set<string>();
  const screens = getScreens(design).map((screen, index) => {
    const id = uniqueIds(`screen-${index + 1}`, usedScreenIds, screen.id);
    const usedComponentIds = new Set<string>();

    const mapComponent = (
      component: GeneratedComponent,
      idx: number,
    ): GeneratedComponent => ({
      ...component,
      id: uniqueIds(`component-${idx + 1}`, usedComponentIds, component.id),
      accessibilityLabel:
        component.accessibilityLabel ||
        component.name ||
        String(component.props.title || component.props.label || component.type),
      children: component.children?.map(mapComponent),
    });

    return {
      ...screen,
      id,
      components: screen.components.map(mapComponent),
      designRationale:
        screen.designRationale ||
        `This screen supports ${screen.purpose || "the primary product workflow"}.`,
      contentDensity:
        screen.contentDensity ||
        (screen.components.length >= 10
          ? "comfortable"
          : screen.components.length >= 6
            ? "compact"
            : "spacious"),
    };
  });

  for (const screen of screens) {
    walkComponents(screen.components, (component) => {
      if (blueprint?.navigation.model === "bottom-tabs") {
        const generated = blueprint.navigation.primary.filter((name) =>
          screens.some((s) => s.name.toLowerCase() === name.toLowerCase()),
        );
        if (generated.length) setNavLabels(component, generated);
        else remapNav(component, screens);
      } else {
        remapNav(component, screens);
      }
    });
  }

  return {
    ...design,
    screens,
    screen: screens[0],
  };
}

export function shouldRetry(issues: QualityIssue[]) {
  return issues.some((issue) => issue.severity === "high");
}
