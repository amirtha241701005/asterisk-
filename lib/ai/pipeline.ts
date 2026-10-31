import { getInspiration, type InspirationResult } from "@/lib/inspo";
import { generateDesign, AiServiceError } from "./service";
import {
  analyzeProduct,
  blueprintToUxReasoning,
  compactBlueprint,
  inspirationQueryFrom,
  type DesignBlueprint,
} from "./blueprint";
import {
  auditDesign,
  repairDesignLocally,
} from "./quality-rules";
import {
  validateDesignGenerationOutput,
  type DesignGenerationOutput,
  type UxReasoning,
} from "./schemas";

export type DesignPipelineResult = {
  design: DesignGenerationOutput;
  uxReasoning: UxReasoning | null;
  inspiration: InspirationResult;
  blueprint: DesignBlueprint;
};

const blueprintCache = new Map<string, DesignBlueprint>();

function getBlueprint(prompt: string): DesignBlueprint {
  const key = prompt.trim().toLowerCase();
  const cached = blueprintCache.get(key);
  if (cached) return cached;
  const blueprint = analyzeProduct(prompt);
  blueprintCache.set(key, blueprint);
  return blueprint;
}

function finalizeDesign(
  raw: DesignGenerationOutput,
  blueprint: DesignBlueprint,
  uxReasoning: UxReasoning,
): DesignGenerationOutput {
  const repaired = repairDesignLocally(
    validateDesignGenerationOutput(raw),
    blueprint,
  );
  const design: DesignGenerationOutput = {
    ...repaired,
    uxReasoning: repaired.uxReasoning || uxReasoning,
    userFlow: {
      title: repaired.userFlow.title || `${blueprint.productType} flow`,
      steps:
        repaired.userFlow.steps.length > 1
          ? repaired.userFlow.steps
          : blueprint.screenRelationships.length
            ? blueprint.screenRelationships
            : blueprint.screens.map((screen) => screen.name),
    },
  };
  auditDesign(design, blueprint);
  return design;
}

export async function runDesignPipeline(
  prompt: string,
  options: { skipInspo?: boolean } = {},
): Promise<DesignPipelineResult> {
  const blueprint = getBlueprint(prompt);
  const uxReasoning = blueprintToUxReasoning(blueprint);

  const inspiration = options.skipInspo
    ? {
        available: false,
        query: prompt,
        references: [],
        components: [],
        summary: "",
        toolsInvoked: [],
      }
    : await getInspiration(inspirationQueryFrom(blueprint));

  const generationOptions = {
    uxReasoning,
    blueprint: compactBlueprint(blueprint),
    inspirationSummary: inspiration.summary || undefined,
  };

  const rawDesign = await generateDesign(prompt, generationOptions);
  const design = finalizeDesign(rawDesign, blueprint, uxReasoning);

  return {
    design,
    uxReasoning,
    inspiration,
    blueprint,
  };
}

export { AiServiceError };
