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
  process.env.OLLAMA_URL?.trim() ||
  "http://localhost:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL?.trim() ||
  "qwen3.5:4b-q4_K_M";

const OLLAMA_TIMEOUT_MS = 180_000;

/* -------------------------------------------------------------------------- */
/* JSON HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function cleanJsonString(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
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
/* DESIGN COMPACTION                                                          */
/* -------------------------------------------------------------------------- */

/*
 * Qwen 3.5 4B is capable of producing the Asterisk schema, but asking it to
 * generate several large screens with many states/interactions causes it to
 * hit its output limit.
 *
 * For the MVP we deliberately constrain the first generation to one polished
 * screen. Once this works reliably, multi-screen generation can be added
 * through a separate generation step.
 */
function makeCompactDesignPrompt(
  promptText: string,
): string {
  return `${promptText}

IMPORTANT FINAL OUTPUT CONSTRAINTS FOR THIS LOCAL MODEL:

Generate ONLY ONE polished mobile screen for the requested product.

The screen must still be production-quality and visually rich.

Keep the output compact enough to finish completely.

Requirements:
- Exactly 1 item in the "screens" array.
- Maximum 6 components in that screen.
- Use realistic content.
- Keep persona concise.
- Keep userFlow to a maximum of 3 steps.
- Keep uxReasoning to a maximum of 3 short items.
- Keep requirements to a maximum of 4 items.
- Keep designDirection concise.
- Do not create unnecessary components.
- Do not create large arrays of repeated data.
- Do not create multiple variants of the same component.
- Keep each component's states array to ONE state.
- Keep interactions arrays empty unless an interaction is essential.
- Keep props concise.
- Do not include explanations outside the JSON.
- Return ONE complete valid JSON object.
- Make absolutely sure the JSON closes with all required brackets and braces before finishing.

Prioritize a complete valid response over extra detail.`;
}

/* -------------------------------------------------------------------------- */
/* OLLAMA                                                                     */
/* -------------------------------------------------------------------------- */

async function callOllamaJson(
  promptText: string,
  systemInstruction: string,
  compactDesign = false,
): Promise<unknown> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

  try {
    console.log(
      `[Asterisk AI] Ollama request: ${OLLAMA_MODEL}`,
    );

    const finalPrompt = compactDesign
      ? makeCompactDesignPrompt(promptText)
      : promptText;

    const response = await fetch(
      `${OLLAMA_URL}/api/chat`,
      {
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
              content: finalPrompt,
            },
          ],

          format: "json",

          /*
           * Disable extended thinking for the MVP.
           */
          think: false,

          stream: false,

          /*
           * A smaller generation budget is intentional.
           *
           * We are asking the model for one complete screen rather
           * than letting it spend several minutes generating a huge
           * multi-screen JSON document.
           */
          options: {
            temperature: 0.15,
            num_ctx: 8192,
            num_predict: 5000,
          },
        }),
      },
    );

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

    console.log(
      "[Asterisk AI] Ollama response received:",
      {
        model: OLLAMA_MODEL,
        hasContent:
          typeof rawText === "string" &&
          rawText.trim().length > 0,
        responseLength:
          typeof rawText === "string"
            ? rawText.length
            : 0,
        doneReason: data.done_reason,
        done: data.done,
      },
    );

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

    if (!cleaned.trim()) {
      throw new AiServiceError(
        "Ollama returned empty JSON.",
        502,
        "EMPTY_JSON_RESPONSE",
      );
    }

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "[Asterisk AI] Invalid JSON from Ollama:",
        {
          error,
          doneReason: data.done_reason,
          responseLength:
            typeof rawText === "string"
              ? rawText.length
              : 0,
          lastCharacters:
            typeof rawText === "string"
              ? rawText.slice(-1000)
              : "",
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
    "You are Asterisk AI's senior UX strategy engine. Return compact valid JSON only.",
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
      buildDesignPrompt(
        userPrompt,
        options,
      ),
      DESIGN_SYSTEM_PROMPT,
      true,
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
      true,
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
    buildQualityPrompt(
      design,
      uxReasoning,
    ),
    "You are a design quality reviewer. Return actionable findings as JSON only.",
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
      true,
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