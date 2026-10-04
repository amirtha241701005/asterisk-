import { getInspiration, type InspirationResult } from "@/lib/inspo";
import {
  generateDesign,
  generateUxReasoning,
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

export async function runDesignPipeline(
  prompt: string,
  options: { skipInspo?: boolean } = {},
): Promise<DesignPipelineResult> {
  const uxReasoning = null;
  const inspirationBrief = uxReasoning
    ? `${prompt}\nPrimary task: ${uxReasoning.primaryTask}\nContext: ${uxReasoning.userContext}`
    : prompt;

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

  let design = validateDesignGenerationOutput(
    await generateDesign(prompt, {
      uxReasoning,
      inspirationSummary: inspiration.summary || undefined,
    }),
  );

  if (uxReasoning && !design.uxReasoning) {
    design = { ...design, uxReasoning };
  }

  return { design, uxReasoning, inspiration };
}

export { AiServiceError };
