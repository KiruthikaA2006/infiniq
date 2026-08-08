import { NextResponse } from "next/server";
import { getCandidates } from "@/data/loaders";

export async function GET() {
  try {
    const list = await getCandidates();
    return NextResponse.json(list);
  } catch (error) {
    console.error("Failed to load candidates:", error);
    return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
  }
}
