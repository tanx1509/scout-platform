import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const systemPrompt = `
You are a Global Recruiter Assistant for the Scout ATS platform.
You are helping a recruiter find the best talent.
Provide concise, helpful answers (max 2 short paragraphs).
If asked about candidates, you can simulate a realistic answer based on a high-performing software engineering pipeline.
Maintain a professional, AI-assistant persona.
    `;

    const answer = await aiProvider.generateText(question, systemPrompt, false);

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("Global Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
