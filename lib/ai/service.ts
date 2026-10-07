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

const OLLAMA_TIMEOUT_MS = 180_000;

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
    case "improvement":
      return {
        temperature: 0.15,
        num_ctx: 12288,
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
      `[Asterisk AI] Ollama request: ${OLLAMA_MODEL} (${mode})`,
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

      console.error(
        "[Asterisk AI] Ollama error:",
        response.status,
        errorText,
      );

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

    const rawText =
      data.message?.content ??
      data.response ??
      "";

    console.log("[Asterisk AI] Ollama response received:", {
      model: OLLAMA_MODEL,
      mode,
      hasContent:
        typeof rawText === "string" &&
        rawText.trim().length > 0,
      responseLength:
        typeof rawText === "string"
          ? rawText.length
          : 0,
      doneReason: data.done_reason,
      done: data.done,
    });

    if (
      typeof rawText !== "string" ||
      !rawText.trim()
    ) {
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
      console.error(
        "[Asterisk AI] Invalid JSON from Ollama:",
        {
          error,
          mode,
          doneReason: data.done_reason,
          responseLength: rawText.length,
          lastCharacters: rawText.slice(-1000),
        },
      );

      throw new AiServiceError(
        data.done_reason === "length"
          ? "The local AI model reached its output limit before completing the design. Please try again."
          : "Ollama returned invalid JSON.",
        502,
        "INVALID_JSON_RESPONSE",
      );
    }
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new AiServiceError(
        "The local AI model took too long to respond. Please try again.",
        504,
        "OLLAMA_TIMEOUT",
      );
    }

    console.error(
      "[Asterisk AI] Ollama connection error:",
      error,
    );

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

export async function refineDesign(
  instruction: string,
  currentDesign: DesignGenerationOutput,
): Promise<DesignGenerationOutput> {
  try {
    const raw = await callOllamaJson(
      buildRefinementPrompt(
        instruction,
        currentDesign,
      ),
      DESIGN_SYSTEM_PROMPT,
      "refinement",
    );

    return validateDesignGenerationOutput(raw);
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
      buildImprovementPrompt(
        design,
        findings,
        uxReasoning,
      ),
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