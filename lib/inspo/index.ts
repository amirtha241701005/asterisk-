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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("INSPO_TIMEOUT")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function pickBestMatch(references: InspoReference[], query: string): InspoReference[] {
  if (references.length <= 1) return references;
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  const scored = references.map((reference) => {
    const hay = `${reference.name} ${reference.macrostructure} ${reference.tone} ${reference.components.join(" ")}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? 1 : 0), 0);
    return { reference, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return [scored[0].reference, ...scored.slice(1).map((row) => row.reference)].slice(0, 3);
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
    const recommendation = await withTimeout(
      callInspoTool<JsonRecord>("recommend", {
        brief: query.slice(0, 900),
        device: "mobile",
        detail: "compact",
        maxTokens: 1800,
      }),
      8000,
    );

    const exemplars = Array.isArray(recommendation.exemplars)
      ? recommendation.exemplars.filter(isRecord)
      : [];
    const references = pickBestMatch(
      exemplars.slice(0, 5).map(normalizeReference),
      query,
    );
    const componentPatterns = normalizeComponents(recommendation);
    const result: InspirationResult = {
      available: references.length > 0,
      query,
      references,
      components: componentPatterns,
      summary: buildSummary(references, undefined, componentPatterns, recommendation),
      toolsInvoked,
    };

    cache.set(query, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  } catch {
    return unavailable(query, toolsInvoked);
  }
}
