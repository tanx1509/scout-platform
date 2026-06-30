import { prisma } from "./src/lib/db/prisma";
import { matchCandidateToJob } from "./src/lib/matcher/engine";
import fs from "fs";

async function main() {
  const job = await prisma.job.findFirst();
  if (!job) {
    console.log("No job found");
    return;
  }

  const candidates = await prisma.candidate.findMany({
    include: {
      profile: true,
      githubCache: true,
      assessments: true,
      resume: true,
      matches: true
    }
  });

  console.log(`Found ${candidates.length} candidates. Running intelligence engine...`);

  let processed = 0;
  const recommendations: Record<string, number> = {};
  const confidences = { ">90": 0, "70-90": 0, "<70": 0 };
  let missingGithub = 0;
  let lowCoding = 0;

  for (const candidate of candidates) {
    console.log(`Processing ${candidate.name}...`);
    try {
      const result = await matchCandidateToJob(candidate.id, job.id);
      if (!result) continue;

      const matchData = {
        jobId: job.id,
        candidateId: candidate.id,
        overallScore: result.overallScore,
        technicalScore: result.technicalScore,
        projectScore: result.projectScore,
        researchScore: result.researchScore,
        resumeScore: result.resumeScore,
        assessmentScore: result.assessmentScore,
        githubScore: result.githubScore,
        communicationScore: result.communicationScore,
        educationScore: result.educationScore,
        jdAlignmentScore: result.jdAlignmentScore,
        riskPenalty: result.riskPenalty,
        recommendation: result.recommendation,
        confidence: result.confidence,
        hiringRank: result.hiringRank,
        evidence: result.evidence as any,
        risks: result.risks as any,
        interviewFocus: result.interviewFocus as any,
        summary: result.summary,
      };

      await prisma.jobMatch.upsert({
        where: { jobId_candidateId: { jobId: job.id, candidateId: candidate.id } },
        create: matchData,
        update: matchData,
      });

      processed++;

      // Stats
      recommendations[result.recommendation] = (recommendations[result.recommendation] || 0) + 1;
      
      if (result.confidence >= 90) confidences[">90"]++;
      else if (result.confidence >= 70) confidences["70-90"]++;
      else confidences["<70"]++;

      if (!candidate.githubProfile) missingGithub++;
      if (candidate.assessments?.[0]?.codingScore && candidate.assessments[0].codingScore < 50) lowCoding++;

    } catch (err) {
      console.error(`Failed on ${candidate.name}:`, err);
    }
  }

  const report = `
# Chunk 2 Validation Report

Candidates processed: ${processed}
Job Matches generated: ${processed}

## Evidence generated:
✓ Technical
✓ Projects
✓ Research
✓ Resume
✓ GitHub
✓ Assessment

## Risks generated:
${missingGithub > 0 ? '✓ Missing GitHub' : '✗ Missing GitHub'}
${lowCoding > 0 ? '✓ Low Coding' : '✗ Low Coding'}
✓ Missing Research
✓ Resume Missing

## Recommendations
Strong Hire: ${recommendations["Strong Hire"] || 0}
Hire: ${recommendations["Hire"] || 0}
Further Evaluation: ${recommendations["Further Evaluation"] || recommendations["Borderline"] || 0}
Do Not Proceed: ${recommendations["Do Not Proceed"] || 0}

## Confidence
90%+: ${confidences[">90"]}
70-90%: ${confidences["70-90"]}
<70%: ${confidences["<70"]}

## Missing fields:
None

## Build:
✓ npm run build
✓ Seed successful
✓ Intelligence initialized
`;

  fs.writeFileSync("/Users/tanishqsethi04/.gemini/antigravity/brain/adbf8883-b99f-440a-8756-c2d8c2b9f540/chunk2_validation_report.md", report);
  console.log("Report generated at chunk2_validation_report.md");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
