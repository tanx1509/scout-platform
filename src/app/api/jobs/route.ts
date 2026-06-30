import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parseJobDescription } from "@/lib/matcher/jd-parser";

export async function GET() {
  await requireAuth();

  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { rawText } = await req.json();
    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    const structuredData = await parseJobDescription(rawText);
    
    if (!structuredData || !structuredData.title) {
      return NextResponse.json({ error: "Failed to parse job description" }, { status: 500 });
    }

    const job = await prisma.job.create({
      data: {
        title: structuredData.title,
        department: structuredData.department,
        rawText,
        structuredData: structuredData as any,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
