import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { aiProvider } from "@/lib/ai/provider";

export async function GET() {
  const session = await requireAuth();

  const rateLimit = await checkRateLimit("ai", session.user.id);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many AI requests. Please try again later." }, { status: 429 });
  }

  try {
    // 1. Gather real data from the database
    const totalCandidates = await prisma.candidate.count();
    const totalJobs = await prisma.job.count();
    const totalMatches = await prisma.jobMatch.count();
    const matchStatusGroups = await prisma.jobMatch.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    const avgScores = await prisma.jobMatch.aggregate({
      _avg: { overallScore: true, technicalScore: true }
    });

    const dbStats = {
      totalCandidates,
      totalJobs,
      totalMatches,
      statusBreakdown: matchStatusGroups,
      averageScores: avgScores._avg
    };

    // 2. Ask Gemini to generate the Executive Summary based ONLY on this data
    const prompt = `
You are the VP of Talent Acquisition.
Analyze the following real database metrics from our ATS system.
Generate an Executive Summary for the Recruitment Health Index dashboard.
DO NOT fabricate any statistics. Rely entirely on the provided metrics.

Raw Metrics:
${JSON.stringify(dbStats, null, 2)}

Return ONLY a JSON object exactly matching this schema:
{
  "rhi": {
    "score": "number (0-100 based on funnel health and scores)",
    "breakdown": {
      "assessmentQuality": "number",
      "interviewEfficiency": "number",
      "pipelineVelocity": "number",
      "candidateQuality": "number"
    },
    "recommendation": "string (1 sentence actionable recommendation based on bottlenecks)"
  },
  "monthlySummary": {
    "prose": "string (A 3-4 sentence executive summary detailing the hiring funnel, candidate quality, and bottlenecks observed in the raw metrics)"
  }
}
`;

    const response = await aiProvider.generateText(prompt, "You are an Executive AI Analyst.", true);
    
    let analyticsData;
    try {
      analyticsData = JSON.parse(response);
    } catch (e) {
      analyticsData = {};
    }

    const analytics = AnalyticsSchema.parse(analyticsData);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}

// Zod Schema at the bottom
import { z } from "zod";

const AnalyticsSchema = z.object({
  rhi: z.object({
    score: z.number().catch(0),
    breakdown: z.object({
      assessmentQuality: z.number().catch(0),
      interviewEfficiency: z.number().catch(0),
      pipelineVelocity: z.number().catch(0),
      candidateQuality: z.number().catch(0)
    }).catch({ assessmentQuality: 0, interviewEfficiency: 0, pipelineVelocity: 0, candidateQuality: 0 }),
    recommendation: z.string().catch("No recommendation available at this time.")
  }).catch({ score: 0, breakdown: { assessmentQuality: 0, interviewEfficiency: 0, pipelineVelocity: 0, candidateQuality: 0 }, recommendation: "No recommendation available at this time." }),
  monthlySummary: z.object({
    prose: z.string().catch("Summary could not be generated.")
  }).catch({ prose: "Summary could not be generated." })
});
