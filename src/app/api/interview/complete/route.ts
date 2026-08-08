import { NextRequest, NextResponse } from "next/server";
import { compileFinalReport } from "@/lib/interview/orchestrator";
import { z } from "zod";

const CompleteSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = CompleteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid body. 'sessionId' is required." },
        { status: 400 }
      );
    }

    const report = await compileFinalReport(result.data.sessionId);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error in POST /api/interview/complete:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile final interview scorecard." },
      { status: 500 }
    );
  }
}
