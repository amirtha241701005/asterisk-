import type {
  InspirationResult,
  InspoDesignSystem,
  InspoReference,
} from "./types";

export type { InspirationResult, InspoReference, InspoDesignSystem } from "./types";

const INSPO_MCP_URL =
  process.env.INSPO_MCP_URL || "https://inspomcp.dev/api/mcp";
const CACHE_TTL_MS = 1000 * 60 * 20;
const cache = new Map<string, { expires: number; result: InspirationResult }>();

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function cleanList(values: unknown[], limit = 8) {
  return Array.from(
    new Set(values.flatMap((value) => asStringArray(value)).filter(Boolean)),
  ).slice(0, limit);
}

async function callInspoTool<T extends JsonRecord>(
  name: string,
  args: JsonRecord,
): Promise<T> {
  const response = await fetch(INSPO_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `${name}-${Date.now()}`,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!response.ok) {
    throw new Error("Inspo MCP request failed.");
  }

  const payload = await response.json();
  const text = payload?.result?.content?.find(
    (part: unknown) => isRecord(part) && part.type === "text",
  )?.text;

  if (typeof text !== "string") {
    throw new Error("Inspo MCP returned no text payload.");
  }

  return JSON.parse(text) as T;
}

function normalizeReference(source: JsonRecord): InspoReference {
  const tags = isRecord(source.tags) ? source.tags : {};
  const macro = isRecord(source.macrostructure) ? source.macrostructure : {};
  const slug = asString(source.slug);
  const palette = asStringArray(source.palette);
  const typography = asStringArray(source.fonts);
  const tagComponents = asStringArray(tags.components);

  return {
    id: slug || asString(source.title, `reference-${Date.now()}`),
    slug: slug || undefined,
    name: asString(source.title, slug || "Design reference"),
    url: asString(source.sourceUrl, undefined),
    screenshotUrl: asString(source.mobile, asString(source.image, undefined)),
    thumbnailUrl: asString(source.thumb, asString(source.mobile, undefined)),
    macrostructure: asString(
      macro.label,
      asString(macro.slug, asString(source.macrostructure, undefined)),
    ),
    visualHierarchy: asString(source.northstar, undefined),
    palette,
    typography,
    components: tagComponents,
    interactions: [],
    tone: cleanList([tags.vibe], 4).join(", ") || undefined,
    rationale: asString(source.autopsy, asString(source.description, undefined)),
  };
}

function mergeReference(
  base: InspoReference,
  detail: JsonRecord | undefined,
): InspoReference {
  if (!detail) return base;
  const detailReference = normalizeReference(detail);

  return {
    ...base,
    ...detailReference,
    id: base.id,
    slug: base.slug || detailReference.slug,
    name: detailReference.name || base.name,
    palette: detailReference.palette.length
      ? detailReference.palette
      : base.palette,
    typography: detailReference.typography.length
      ? detailReference.typography
      : base.typography,
    components: detailReference.components.length
      ? detailReference.components
      : base.components,
  };
}

function normalizeDesignSystem(
  slug: string | undefined,
  payload: JsonRecord | undefined,
): InspoDesignSystem | undefined {
  if (!payload) return undefined;
  const tokens = isRecord(payload.tokens) ? payload.tokens : payload;

  return {
    source: slug,
    colors: cleanList([
      payload.palette,
      tokens.palette,
      tokens.colors,
      tokens.color,
    ]),
    typography: cleanList([payload.fonts, tokens.fonts, tokens.typography]),
    spacing: cleanList([tokens.spacing, tokens.space]),
    radius: cleanList([tokens.radius, tokens.radii]),
    shadows: cleanList([tokens.shadows, tokens.elevation]),
  };
}

function normalizeComponents(payload: JsonRecord | undefined): string[] {
  if (!payload) return [];
  const rows = Array.isArray(payload.components)
    ? payload.components
    : Array.isArray(payload.results)
    ? payload.results
    : [];

  return rows
    .filter(isRecord)
    .map((row) =>
      [
        asString(row.type),
        asString(row.label),
        asString(row.macro),
        asString(row.note),
      ]
        .filter(Boolean)
        .join(": "),
    )
    .filter(Boolean)
    .slice(0, 8);
}

function buildSummary(
  references: InspoReference[],
  designSystem: InspoDesignSystem | undefined,
  components: string[],
  recommendation: JsonRecord,
) {
  const pick = isRecord(recommendation.pick) ? recommendation.pick : {};
  const macro = isRecord(pick.macrostructure)
    ? asString(pick.macrostructure.label, asString(pick.macrostructure.slug))
    : references[0]?.macrostructure;
  const palette = Array.from(
    new Set([
      ...references.flatMap((reference) => reference.palette),
      ...(designSystem?.colors || []),
    ]),
  ).slice(0, 8);
  const typography = Array.from(
    new Set([
      ...references.flatMap((reference) => reference.typography),
      ...(designSystem?.typography || []),
    ]),
  ).slice(0, 6);

  return [
    `Macrostructure: ${macro || "brief-led adaptive composition"}.`,
    references[0]?.visualHierarchy
      ? `Visual hierarchy: ${references[0].visualHierarchy}`
      : "",
    palette.length ? `Palette signals: ${palette.join(", ")}.` : "",
    typography.length ? `Typography signals: ${typography.join(", ")}.` : "",
    components.length
      ? `Component patterns: ${components.slice(0, 5).join(" | ")}.`
      : "",
    `Interaction patterns: strong first action, scannable cards, clear navigation feedback, graceful empty/loading/error states.`,
    `Originality constraint: synthesize these signals for the user's brief; do not copy any reference.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function unavailable(query: string, toolsInvoked: string[] = []): InspirationResult {
  return {
    available: false,
    query,
    references: [],
    components: [],
    summary:
      "Inspiration research unavailable — continuing with Asterisk's design reasoning.",
    toolsInvoked,
    error: "INSPIRATION_UNAVAILABLE",
  };
}

export async function getInspiration(
  brief: string,
): Promise<InspirationResult> {
  const query = brief.trim();
  if (!query) return unavailable(query);

  const cached = cache.get(query);
  if (cached && cached.expires > Date.now()) return cached.result;

  const toolsInvoked: string[] = [];

  try {
    toolsInvoked.push("recommend");
    const recommendation = await callInspoTool<JsonRecord>("recommend", {
      brief: query,
      device: "mobile",
      detail: "standard",
      maxTokens: 4500,
    });

    const exemplars = Array.isArray(recommendation.exemplars)
      ? recommendation.exemplars.filter(isRecord)
      : [];
    const initialReferences = exemplars.slice(0, 4).map(normalizeReference);

    const detailedReferences = await Promise.all(
      initialReferences.map(async (reference) => {
        if (!reference.slug) return reference;
        try {
          toolsInvoked.push("get_screen");
          const detail = await callInspoTool<JsonRecord>("get_screen", {
            slug: reference.slug,
          });
          return mergeReference(reference, detail);
        } catch {
          return reference;
        }
      }),
    );

    const firstSlug = detailedReferences[0]?.slug;
    let designSystem: InspoDesignSystem | undefined;
    if (firstSlug) {
      try {
        toolsInvoked.push("get_design_system");
        designSystem = normalizeDesignSystem(
          firstSlug,
          await callInspoTool<JsonRecord>("get_design_system", {
            slug: firstSlug,
            live: false,
          }),
        );
      } catch {
        designSystem = undefined;
      }
    }

    let componentPatterns: string[] = normalizeComponents(recommendation);
    try {
      toolsInvoked.push("find_components");
      componentPatterns = [
        ...componentPatterns,
        ...normalizeComponents(
          await callInspoTool<JsonRecord>("find_components", {
            type: "hero",
            device: "mobile",
            limit: 4,
            maxTokens: 1600,
          }),
        ),
      ].slice(0, 8);
    } catch {
      // Component patterns are useful, not required.
    }

    const result: InspirationResult = {
      available: detailedReferences.length > 0,
      query,
      references: detailedReferences,
      components: componentPatterns,
      designSystem,
      summary: buildSummary(
        detailedReferences,
        designSystem,
        componentPatterns,
        recommendation,
      ),
      toolsInvoked: Array.from(new Set(toolsInvoked)),
    };

    cache.set(query, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  } catch {
    return unavailable(query, toolsInvoked);
  }
}
