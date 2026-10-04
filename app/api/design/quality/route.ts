import { NextResponse } from "next/server";
import { evaluateDesignQuality, AiServiceError } from "@/lib/ai/service";
import { validateDesignGenerationOutput, type UxReasoning } from "@/lib/ai/schemas";

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
    const quality = await evaluateDesignQuality(design, uxReasoning);

    return NextResponse.json({ success: true, data: quality });
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
