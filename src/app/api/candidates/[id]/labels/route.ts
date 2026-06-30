import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const candidateLabels = await prisma.candidateLabel.findMany({
      where: { candidateId: resolvedParams.id },
      include: { label: true },
    });
    return NextResponse.json(candidateLabels.map((cl) => cl.label));
  } catch (error) {
    console.error("Labels GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const { labelName } = await req.json();

    if (!labelName) {
      return NextResponse.json({ error: "labelName is required" }, { status: 400 });
    }

    // Find or create the label
    let label = await prisma.label.findUnique({
      where: { name: labelName },
    });

    if (!label) {
      label = await prisma.label.create({
        data: { name: labelName },
      });
    }

    // Link it to the candidate
    const candidateLabel = await prisma.candidateLabel.upsert({
      where: {
        candidateId_labelId: {
          candidateId: resolvedParams.id,
          labelId: label.id,
        },
      },
      create: {
        candidateId: resolvedParams.id,
        labelId: label.id,
      },
      update: {},
      include: { label: true },
    });

    return NextResponse.json(candidateLabel.label, { status: 201 });
  } catch (error) {
    console.error("Labels POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(req.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json({ error: "labelId is required" }, { status: 400 });
    }

    await prisma.candidateLabel.delete({
      where: {
        candidateId_labelId: {
          candidateId: resolvedParams.id,
          labelId,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Labels DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
