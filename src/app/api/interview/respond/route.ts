import { NextRequest, NextResponse } from "next/server";
import { processResponse } from "@/lib/interview/orchestrator";
import { z } from "zod";

const RespondSchema = z.object({
  sessionId: z.string(),
  answer: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RespondSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid body. 'sessionId' and 'answer' are required." },
        { status: 400 }
      );
    }

    const { sessionId, answer } = result.data;
    const session = await processResponse(sessionId, answer);

    // Get the latest evaluation from history
    const latestResponse = session.conversationHistory[session.conversationHistory.length - 1];
    const evaluation = latestResponse?.evaluation;

    return NextResponse.json({
      evaluation,
      nextQuestion: session.currentQuestion,
      aiState: session.status,
      progress: {
        current: session.questionCount,
        total: session.maxQuestions,
        coveredDays: session.coveredDays,
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/interview/respond:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process candidate response." },
      { status: 500 }
    );
  }
}
