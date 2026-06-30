import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const notes = await prisma.note.findMany({
      where: { candidateId: resolvedParams.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Notes GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        candidateId: resolvedParams.id,
        content,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Notes POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
