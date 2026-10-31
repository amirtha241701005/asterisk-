import {
  DESIGN_SYSTEM_PROMPT,
  buildDesignPrompt,
  buildImprovementPrompt,
  buildQualityPrompt,
  buildRefinementPrompt,
  buildUxReasoningPrompt,
} from "./prompts";

import {
  validateDesignGenerationOutput,
  validateQualityReport,
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
        temperature: 0.15,
        num_ctx: 16384,
        num_predict: 10000,
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
    console.log(
      `[ARQUO AI] Ollama request: ${OLLAMA_MODEL} (${mode})`,
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
    };

    const rawText = data.message?.content ?? data.response ?? "";

    console.log("[ARQUO AI] Ollama response received:", {
      model: OLLAMA_MODEL,
      mode,
      hasContent: typeof rawText === "string" && rawText.trim().length > 0,
      responseLength: typeof rawText === "string" ? rawText.length : 0,
      doneReason: data.done_reason,
      done: data.done,
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
  const text = instruction.toLowerCase();

  const targetedPatterns = [
    /\bchange only\b/,
    /\bonly change\b/,
    /\bkeep everything else\b/,
    /\bkeep all other\b/,
    /\bdo not change any other\b/,
    /\bdo not modify any other\b/,
    /\bpreserve all\b/,
    /\bexactly as they are\b/,
    /\brename\b/,
    /\bchange the title\b/,
    /\bchange the heading\b/,
    /\bchange the text\b/,
    /\bchange the colour\b/,
    /\bchange the color\b/,
    /#[0-9a-f]{6}\b/,
    /\bmove\b.+\b(before|after|above|below)\b/,
    /\breorder\b/,
  ];

  const visualRedesignPatterns = [
    /\bmake\b.+\b(premium|polished|professional|modern|beautiful|cleaner)\b/,
    /\bvisual redesign\b/,
    /\bredesign\b/,
    /\bvisual polish\b/,
    /\bimprove (the )?(overall )?(visual|design|appearance|look|styling|hierarchy|spacing|typography)\b/,
    /\bimprove spacing\b/,
    /\bimprove typography\b/,
    /\bcard hierarchy\b/,
    /\bmore polished\b/,
    /\bmore premium\b/,
    /\brefine the overall design\b/,
    /\bmodernize\b/,
  ];

  const explicitlyTargeted = targetedPatterns.some((pattern) =>
    pattern.test(text),
  );

  const asksForRedesign = visualRedesignPatterns.some((pattern) =>
    pattern.test(text),
  );

  if (asksForRedesign && !explicitlyTargeted) {
    return "visual-redesign";
  }

  return "targeted";
}

export async function refineDesign(
  instruction: string,
  currentDesign: DesignGenerationOutput,
): Promise<DesignGenerationOutput> {
  try {
    const refinementMode = classifyRefinementInstruction(instruction);

    const refinementSystemInstruction =
      refinementMode === "visual-redesign"
        ? `
You are ARQUO's senior product designer performing a visual redesign.

The user has asked for meaningful visual improvement, not merely a metadata edit.

Make deliberate, visible improvements to the existing design:
- establish a clearer hierarchy between screen titles, section headings, cards, and supporting text
- improve spacing, alignment, density, and rhythm
- improve typography scale and weight where needed
- improve card and list styling, surface contrast, borders, and radii
- improve the balance and consistency of the screen
- use the existing design system and requested accent colors
- remove unnecessary decoration when it weakens clarity

Do not merely restate the existing design or make token-only changes.

Preserve the product's domain, content meaning, existing screen IDs, component IDs, screen count, and screen order.
Keep component order unchanged unless the user's instruction explicitly asks to change it.
Do not invent unrelated content, metrics, features, or screens.
Do not change text content unless needed to fix an obvious placeholder or the user explicitly requests it.
Keep the changes proportional to the request, but make them visually noticeable.

Return the complete updated design as valid JSON only.
`.trim()
        : `
You are ARQUO's precise UI editing engine.

Apply the user's specific edit to the existing design.

Preserve all screen IDs, component IDs, screen count, screen order, and unrelated content.
Modify only the properties and component order needed to fulfil the request.
Do not replace existing screens with different screens.
Do not remove or add components unless the instruction requires it.
Do not make unrelated visual changes.
Keep the content consistent with the product domain.
Return the complete updated design as valid JSON only.
`.trim();

    console.log("[ARQUO AI] Refinement mode:", refinementMode);

    const raw = await callOllamaJson(
      buildRefinementPrompt(instruction, currentDesign),
      refinementSystemInstruction,
      "refinement",
    );

    const validated = validateDesignGenerationOutput(raw);

    const originalScreenIds = currentDesign.screens.map(
      (screen) => screen.id,
    );

    const updatedScreenIds = validated.screens.map(
      (screen) => screen.id,
    );

    const sameScreenIds =
      originalScreenIds.length === updatedScreenIds.length &&
      originalScreenIds.every(
        (id, index) => id === updatedScreenIds[index],
      );

    if (!sameScreenIds) {
      throw new AiServiceError(
        "The AI attempted to replace or reorder existing screens. Your original design has not been accepted. Try a smaller refinement.",
        502,
        "REFINEMENT_CHANGED_SCREEN_STRUCTURE",
      );
    }

    const originalComponentIds = currentDesign.screens.map((screen) =>
      screen.components.map((component) => component.id).sort(),
    );

    const updatedComponentIds = validated.screens.map((screen) =>
      screen.components.map((component) => component.id).sort(),
    );

    const sameComponentIds =
      originalComponentIds.length === updatedComponentIds.length &&
      originalComponentIds.every((originalIds, screenIndex) => {
        const updatedIds = updatedComponentIds[screenIndex];

        return (
          originalIds.length === updatedIds.length &&
          originalIds.every((id, index) => id === updatedIds[index])
        );
      });

    if (!sameComponentIds) {
      throw new AiServiceError(
        "The AI changed the existing component set unexpectedly. Your original design has not been accepted. Try a more specific refinement.",
        502,
        "REFINEMENT_CHANGED_COMPONENT_STRUCTURE",
      );
    }

    return validated;
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    throw new AiServiceError(
      error instanceof Error
        ? error.message
        : "Refinement could not be validated.",
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