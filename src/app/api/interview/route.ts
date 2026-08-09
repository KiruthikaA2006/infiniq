import { NextRequest, NextResponse } from "next/server";
import { startSession, processResponse, sessionsDb, getAllSessions } from "@/lib/interview/orchestrator";
import { StartRequestSchema, ConversationRequestSchema } from "@/types/interview";

export async function GET(request: NextRequest) {
  try {
    const sessions = await getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("API error in GET /api/interview:", error);
    return NextResponse.json({ error: "Failed to retrieve interview history." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Check if it is a Start Request (has candidate object)
    if (body.candidate) {
      const parseResult = StartRequestSchema.safeParse(body);
      if (!parseResult.success) {
        // Safe 4xx response without exposing internal schema errors
        return NextResponse.json(
          { error: "Invalid start request schema. Please supply sessionId and candidate." },
          { status: 400 }
        );
      }

      const { sessionId, candidate } = parseResult.data;

      // Retrieve existing session if it exists to avoid overwriting ongoing interviews
      let session = sessionsDb[sessionId];
      if (!session) {
        session = await startSession(candidate, sessionId);
      }

      const reply = `Welcome. Let's begin your interview.\n\nFirst Question: ${session.currentQuestion?.text || ""}`;
      return NextResponse.json({
        reply,
        done: false,
        question: session.currentQuestion,
        coveredTopics: session.coveredTopics,
        coveredDays: session.coveredDays,
        difficulty: session.difficulty,
        decisions: session.decisions,
      });
    }

    // 2. Otherwise treat it as a Conversation Turn Request
    const parseResult = ConversationRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload. Please supply sessionId and message." },
        { status: 400 }
      );
    }

    const { sessionId, message } = parseResult.data;

    let session = sessionsDb[sessionId];
    if (!session) {
      return NextResponse.json(
        { error: "Session not found. Please start the interview session first." },
        { status: 404 }
      );
    }

    // Process candidate answer and generate evaluation + decision + next question
    session = await processResponse(sessionId, message);

    if (session.status === "completed" || !session.currentQuestion) {
      return NextResponse.json({
        reply: "Interview completed.",
        done: true,
        feedback: session.finalFeedback,
        coveredTopics: session.coveredTopics,
        coveredDays: session.coveredDays,
        decisions: session.decisions,
      });
    }

    return NextResponse.json({
      reply: session.currentQuestion.text,
      done: false,
      question: session.currentQuestion,
      coveredTopics: session.coveredTopics,
      coveredDays: session.coveredDays,
      difficulty: session.difficulty,
      decisions: session.decisions,
    });
  } catch (error) {
    console.error("API error in /api/interview:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
