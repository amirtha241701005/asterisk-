import { NextResponse } from "next/server";
import { refineDesign, AiServiceError } from "@/lib/ai/service";
import { validateDesignGenerationOutput } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const instruction =
      typeof body.instruction === "string" ? body.instruction.trim() : "";
    const currentDesign = body.design;

    if (!instruction) {
      return NextResponse.json(
        { success: false, error: "A refinement instruction is required.", code: "MISSING_INSTRUCTION" },
        { status: 400 },
      );
    }

    if (!currentDesign) {
      return NextResponse.json(
        { success: false, error: "Current design context is required.", code: "MISSING_DESIGN" },
        { status: 400 },
      );
    }

    const validated = validateDesignGenerationOutput(currentDesign);
    const design = await refineDesign(instruction, validated);

    return NextResponse.json({ success: true, data: design });
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
