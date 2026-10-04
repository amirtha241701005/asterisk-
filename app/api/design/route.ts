import { NextResponse } from "next/server";
import { runDesignPipeline, AiServiceError } from "@/lib/ai/pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "A design prompt or brief is required.", code: "MISSING_PROMPT" },
        { status: 400 },
      );
    }

    const result = await runDesignPipeline(prompt, {
      skipInspo: true,
    });
    return NextResponse.json({
      success: true,
      data: result.design,
      uxReasoning: result.uxReasoning,
      inspiration: result.inspiration,
    });
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
