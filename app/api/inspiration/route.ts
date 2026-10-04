import { NextResponse } from "next/server";
import { getInspiration } from "@/lib/inspo";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const brief = typeof body.brief === "string" ? body.brief.trim() : "";

    if (!brief) {
      return NextResponse.json(
        {
          success: false,
          error: "A design brief is required.",
          code: "MISSING_BRIEF",
        },
        { status: 400 },
      );
    }

    const inspiration = await getInspiration(brief);

    return NextResponse.json({
      success: true,
      data: inspiration,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Inspiration research unavailable.",
        code: "INSPIRATION_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
}
