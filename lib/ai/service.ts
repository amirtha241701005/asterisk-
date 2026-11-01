import {
  DESIGN_SYSTEM_PROMPT,
  buildDesignPrompt,
  buildImprovementPrompt,
  buildQualityPrompt,
  classifyRefinementMode,
  buildUxReasoningPrompt,
} from "./prompts";

import {
  validateDesignGenerationOutput,
  validateQualityReport,
  getScreens,
  type DesignGenerationOutput,
  type DesignQualityReport,
  type QualityFinding,
  type UxReasoning,
} from "./schemas";

export class AiServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = "AI_SERVICE_ERROR",
  ) {
    super(message);
    this.name = "AiServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* -------------------------------------------------------------------------- */
/* LOCAL OLLAMA CONFIG                                                        */
/* -------------------------------------------------------------------------- */

const OLLAMA_URL =
  process.env.OLLAMA_URL?.trim() || "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL?.trim() || "qwen3.5:4b-q4_K_M";

const OLLAMA_TIMEOUT_MS = 240_000;

/* -------------------------------------------------------------------------- */
/* JSON HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function cleanJsonString(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

/* -------------------------------------------------------------------------- */
/* OLLAMA                                                                     */
/* -------------------------------------------------------------------------- */

type CallMode =
  | "reasoning"
  | "design"
  | "refinement"
  | "quality"
  | "improvement";

function generationOptions(mode: CallMode) {
  switch (mode) {
    case "reasoning":
      return {
        temperature: 0.1,
        num_ctx: 8192,
        num_predict: 2200,
      };

    case "quality":
      return {
        temperature: 0.1,
        num_ctx: 8192,
        num_predict: 2600,
      };

    case "refinement":
      return {
        temperature: 0.1,
        num_ctx: 8192,
        num_predict: 3200,
      };

    case "improvement":
      return {
        temperature: 0.2,
        num_ctx: 16384,
        num_predict: 7000,
      };

    case "design":
    default:
      return {
        temperature: 0.15,
        num_ctx: 16384,
        num_predict: 6000,
      };
  }
}

async function callOllamaJson(
  promptText: string,
  systemInstruction: string,
  mode: CallMode,
): Promise<unknown> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  try {
    const startedAt = Date.now();
    console.log(
      `[ARQUO AI] Ollama request: ${OLLAMA_MODEL} (${mode})`,
      { promptCharacters: promptText.length, systemCharacters: systemInstruction.length },
    );

    const options = generationOptions(mode);

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content: systemInstruction,
          },
          {
            role: "user",
            content: promptText,
          },
        ],
        format: "json",
        think: false,
        stream: false,
        options,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("[ARQUO AI] Ollama error:", response.status, errorText);

      throw new AiServiceError(
        `Ollama returned an error (${response.status}). ${errorText}`,
        response.status,
        "OLLAMA_PROVIDER_ERROR",
      );
    }

    const data = (await response.json()) as {
      message?: {
        role?: string;
        content?: string;
      };
      response?: string;
      done_reason?: string;
      done?: boolean;
      prompt_eval_count?: number;
      eval_count?: number;
      total_duration?: number;
      prompt_eval_duration?: number;
      eval_duration?: number;
    };

    const rawText = data.message?.content ?? data.response ?? "";

    console.log("[ARQUO AI] Ollama response received:", {
      model: OLLAMA_MODEL,
      mode,
      hasContent: typeof rawText === "string" && rawText.trim().length > 0,
      responseLength: typeof rawText === "string" ? rawText.length : 0,
      doneReason: data.done_reason,
      done: data.done,
      promptTokens: data.prompt_eval_count,
      generatedTokens: data.eval_count,
      totalSeconds: data.total_duration ? Math.round(data.total_duration / 1e9) : undefined,
      promptSeconds: data.prompt_eval_duration ? Math.round(data.prompt_eval_duration / 1e9) : undefined,
      generationSeconds: data.eval_duration ? Math.round(data.eval_duration / 1e9) : undefined,
      wallSeconds: Math.round((Date.now() - startedAt) / 1000),
    });

    if (typeof rawText !== "string" || !rawText.trim()) {
      throw new AiServiceError(
        "Ollama returned an empty response.",
        502,
        "EMPTY_RESPONSE",
      );
    }

    const cleaned = cleanJsonString(rawText);

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[ARQUO AI] Invalid JSON from Ollama:", {
        error,
        mode,
        doneReason: data.done_reason,
        responseLength: rawText.length,
        lastCharacters: rawText.slice(-1000),
      });

      throw new AiServiceError(
        data.done_reason === "length"
          ? "The local AI model reached its output limit before completing the design. Try a smaller refinement or a model with a larger output capacity."
          : "Ollama returned invalid JSON. Please try again.",
        502,
        "INVALID_JSON_RESPONSE",
      );
    }
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiServiceError(
        "The local AI model took too long to respond. Please try again.",
        504,
        "OLLAMA_TIMEOUT",
      );
    }

    console.error("[ARQUO AI] Ollama connection error:", error);

    throw new AiServiceError(
      error instanceof Error
        ? error.message
        : "Could not connect to the local Ollama AI model.",
      503,
      "OLLAMA_CONNECTION_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------------------------------------------------- */
/* UX REASONING                                                               */
/* -------------------------------------------------------------------------- */

export async function generateUxReasoning(
  userPrompt: string,
): Promise<UxReasoning> {
  const raw = await callOllamaJson(
    buildUxReasoningPrompt(userPrompt),
    "You are ARQUO's senior UX strategy engine. Return compact valid JSON only.",
    "reasoning",
  );

  return raw as UxReasoning;
}

/* -------------------------------------------------------------------------- */
/* DESIGN GENERATION                                                          */
/* -------------------------------------------------------------------------- */

export async function generateDesign(
  userPrompt: string,
  options: {
    uxReasoning?: UxReasoning | null;
    inspirationSummary?: string;
  } = {},
): Promise<DesignGenerationOutput> {
  try {
    const raw = await callOllamaJson(
      buildDesignPrompt(userPrompt, options),
      "You are ARQUO's UI design generator. Return only valid JSON matching the requested schema.",
      "design",
    );

    return validateDesignGenerationOutput(raw);
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    throw new AiServiceError(
      error instanceof Error
        ? error.message
        : "Generated response could not be validated.",
      500,
      "SCHEMA_VALIDATION_ERROR",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DESIGN REFINEMENT                                                          */
/* -------------------------------------------------------------------------- */

function classifyRefinementInstruction(
  instruction: string,
): "targeted" | "visual-redesign" {
  return classifyRefinementMode(instruction);
}

type ComponentTreeNode = { id: string; children?: ComponentTreeNode[] };

function collectComponentIds(components: ComponentTreeNode[]): string[] {
  return components.flatMap((component) => [
    component.id,
    ...collectComponentIds(component.children ?? []),
  ]);
}

function buildScreenRefinementPrompt(
  instruction: string,
  screen: DesignGenerationOutput["screens"][number],
  mode: "targeted" | "visual-redesign",
): string {
  return `You are ARQUO's UI editor. Edit ONLY the supplied screen.

USER REQUEST:
${instruction}

MODE: ${mode === "visual-redesign" ? "VISUAL REDESIGN OF THIS SCREEN ONLY" : "TARGETED EDIT OF THIS SCREEN ONLY"}

RULES:
- Return exactly one JSON object representing the updated screen, not the full app.
- Preserve this screen's id, name, kind, component IDs, component count, nested component structure and order.
- Do not add or remove components. Change existing component props and screen-level visual tokens only when needed for the request.
- For targeted edits, preserve all unrelated content, layout, colours, typography, spacing, radii and hierarchy.
- For visual redesign, make coordinated visible improvements only within this screen while preserving its identity and component structure.
- Do not use placeholder labels such as Item, Content, Details, Action or Section when meaningful product-specific content is required.
- Keep text readable against its actual surface. Preserve intentional light and dark surfaces.
- Keep all existing required fields. Do not invent unrelated features or screens.
- Output valid JSON only. No markdown or explanation.

SCREEN JSON:
${JSON.stringify(screen)}
`;
}

export async function refineDesign(
  instruction: string,
  currentDesign: DesignGenerationOutput,
  targetScreenId?: string,
): Promise<DesignGenerationOutput> {
  try {
    const refinementMode = classifyRefinementInstruction(instruction);
    const screens = getScreens(currentDesign);
    const targetScreen = targetScreenId
      ? screens.find((screen) => screen.id === targetScreenId)
      : screens[0];

    if (!targetScreen) {
      throw new AiServiceError(
        targetScreenId
          ? "The selected screen could not be found. Please select it again and retry."
          : "There is no screen available to refine.",
        400,
        "NO_SCREEN_TO_REFINE",
      );
    }

    console.log("[ARQUO AI] Refinement mode:", refinementMode, {
      targetScreenId: targetScreen.id,
      totalScreens: screens.length,
      strategy: "single-screen",
    });

    // Ask the local model to regenerate only the active screen. The remaining
    // screens and all root-level product metadata stay local and untouched.
    const raw = await callOllamaJson(
      buildScreenRefinementPrompt(instruction, targetScreen, refinementMode),
      "Return one updated ARQUO screen object as strict JSON. Do not return the full design.",
      "refinement",
    );

    const candidate = raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
    const returnedScreen = candidate && candidate.screen && typeof candidate.screen === "object"
      ? candidate.screen
      : candidate;

    if (!returnedScreen || typeof returnedScreen !== "object") {
      throw new AiServiceError("The model did not return an updated screen object. Your original design is unchanged.", 502, "INVALID_REFINEMENT_SCREEN");
    }

    const returned = returnedScreen as Record<string, unknown>;
    if (returned.id !== targetScreen.id) {
      throw new AiServiceError("The model changed the target screen identity. Your original design is unchanged.", 502, "REFINEMENT_CHANGED_SCREEN_ID");
    }

    const originalIds = collectComponentIds(targetScreen.components);
    const returnedComponents = Array.isArray(returned.components) ? returned.components as ComponentTreeNode[] : [];
    const returnedIds = collectComponentIds(returnedComponents);
    if (originalIds.length !== returnedIds.length || originalIds.some((id, index) => id !== returnedIds[index])) {
      throw new AiServiceError("The model changed the component structure. Your original design is unchanged. Try a more specific edit.", 502, "REFINEMENT_CHANGED_COMPONENT_STRUCTURE");
    }

    const mergedScreens = screens.map((screen) =>
      screen.id === targetScreen.id ? returnedScreen : screen,
    );

    const validated = validateDesignGenerationOutput({
      ...currentDesign,
      screens: mergedScreens,
      screen: undefined,
    });

    // Guard against a structurally valid response that made no actual change.
    const updatedTarget = getScreens(validated).find((screen) => screen.id === targetScreen.id);
    const visibleBefore = JSON.stringify({
      title: targetScreen.title,
      subtitle: targetScreen.subtitle,
      colorTokens: targetScreen.colorTokens,
      typographyTokens: targetScreen.typographyTokens,
      spacingTokens: targetScreen.spacingTokens,
      radius: targetScreen.radius,
      components: targetScreen.components,
    });
    const visibleAfter = updatedTarget ? JSON.stringify({
      title: updatedTarget.title,
      subtitle: updatedTarget.subtitle,
      colorTokens: updatedTarget.colorTokens,
      typographyTokens: updatedTarget.typographyTokens,
      spacingTokens: updatedTarget.spacingTokens,
      radius: updatedTarget.radius,
      components: updatedTarget.components,
    }) : "";

    if (!updatedTarget || visibleAfter === visibleBefore) {
      throw new AiServiceError(
        "The model returned the screen without making a meaningful change. Your original design is unchanged.",
        502,
        "REFINEMENT_NO_EFFECT",
      );
    }

    return validated;
  } catch (error: unknown) {
    if (error instanceof AiServiceError) throw error;
    throw new AiServiceError(
      error instanceof Error ? error.message : "Refinement could not be validated.",
      500,
      "SCHEMA_VALIDATION_ERROR",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* QUALITY EVALUATION                                                         */
/* -------------------------------------------------------------------------- */

export async function evaluateDesignQuality(
  design: DesignGenerationOutput,
  uxReasoning: UxReasoning | null,
): Promise<DesignQualityReport> {
  const raw = await callOllamaJson(
    buildQualityPrompt(design, uxReasoning),
    "You are ARQUO's senior design quality reviewer. Return actionable JSON only.",
    "quality",
  );

  try {
    return validateQualityReport(raw);
  } catch (error: unknown) {
    throw new AiServiceError(
      error instanceof Error
        ? error.message
        : "Quality report could not be validated.",
      500,
      "QUALITY_VALIDATION_ERROR",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* DESIGN IMPROVEMENT                                                         */
/* -------------------------------------------------------------------------- */

export async function improveDesign(
  design: DesignGenerationOutput,
  findings: QualityFinding[],
  uxReasoning: UxReasoning | null,
): Promise<DesignGenerationOutput> {
  try {
    const raw = await callOllamaJson(
      buildImprovementPrompt(design, findings, uxReasoning),
      DESIGN_SYSTEM_PROMPT,
      "improvement",
    );

    return validateDesignGenerationOutput(raw);
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    throw new AiServiceError(
      error instanceof Error
        ? error.message
        : "Design improvement could not be validated.",
      500,
      "SCHEMA_VALIDATION_ERROR",
    );
  }
}