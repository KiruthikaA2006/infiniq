import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/interview/orchestrator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getSession(resolvedParams.id);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error in GET /api/interview/session/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
