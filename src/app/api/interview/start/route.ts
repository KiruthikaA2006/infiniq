import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/interview/orchestrator";
import { z } from "zod";

const StartSchema = z.object({
  candidateId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = StartSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid body. 'candidateId' is required." },
        { status: 400 }
      );
    }

    const session = await startSession(result.data.candidateId);
    return NextResponse.json({
      sessionId: session.id,
      question: session.currentQuestion,
      progress: {
        current: session.questionCount,
        total: session.maxQuestions,
        coveredDays: session.coveredDays,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/interview/start:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start interview session." },
      { status: 500 }
    );
  }
}
