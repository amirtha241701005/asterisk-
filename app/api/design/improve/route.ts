import { NextResponse } from "next/server";
import { improveDesign, AiServiceError } from "@/lib/ai/service";
import {
  validateDesignGenerationOutput,
  type QualityFinding,
  type UxReasoning,
} from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body.design) {
      return NextResponse.json(
        { success: false, error: "Design context is required.", code: "MISSING_DESIGN" },
        { status: 400 },
      );
    }

    const design = validateDesignGenerationOutput(body.design);
    const uxReasoning = (body.uxReasoning as UxReasoning | null | undefined) ?? design.uxReasoning ?? null;
    const findings = Array.isArray(body.findings)
      ? (body.findings as QualityFinding[]).filter((f) => f.severity === "high")
      : [];

    if (!findings.length) {
      return NextResponse.json(
        { success: false, error: "No high-severity findings to apply.", code: "MISSING_FINDINGS" },
        { status: 400 },
      );
    }

    const improved = validateDesignGenerationOutput(
      await improveDesign(design, findings, uxReasoning),
    );

    return NextResponse.json({ success: true, data: improved });
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
