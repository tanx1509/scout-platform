import { aiProvider } from "../ai/provider";
import { prisma } from "../db/prisma";

export interface MatchResult {
  technicalScore: number;
  projectScore: number;
  researchScore: number;
  resumeScore: number;
  assessmentScore: number;
  githubScore: number;
  communicationScore: number;
  educationScore: number;
  jdAlignmentScore: number;
  riskPenalty: number;
  overallScore: number;
  
  recommendation: string;
  confidence: number;
  hiringRank: number;
  
  evidence: any;
  risks: any;
  interviewFocus: any;
  summary: string;
}

export async function matchCandidateToJob(candidateId: string, jobId: string): Promise<MatchResult | null> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { 
      profile: true, 
      githubCache: true,
      assessments: true,
      resume: true
    },
  });
  
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!candidate || !job || !job.structuredData) return null;

  const profile = candidate.profile as any || {};
  const jd = job.structuredData as any;
  const github = candidate.githubCache?.data as any || null;
  const assessment = candidate.assessments?.[0] || null;
  
  // 1. Calculate Assessment Score Deterministically
  let assessmentScore = 0;
  if (assessment && assessment.logicalScore != null && assessment.codingScore != null) {
    assessmentScore = (assessment.logicalScore + assessment.codingScore) / 2;
  } else if (assessment && assessment.score != null) {
    assessmentScore = assessment.score;
  }

  // 2. Generate Structured Evaluation using LLM
  const prompt = `
You are an elite Technical Recruiter AI computing an explainable, deterministic hiring profile.
Analyze the Candidate against the Job Requirements.

Job Requirements:
${JSON.stringify(jd, null, 2)}

Candidate Profile:
${JSON.stringify({
  personal: profile.personalInfo,
  skills: profile.skills,
  experience: profile.experience,
  projects: profile.projects,
  research: profile.research,
  education: profile.education,
  achievements: profile.achievements,
  github: github,
  assessment: assessment ? { logical: assessment.logicalScore, coding: assessment.codingScore } : null
}, null, 2)}

Provide your evaluation strictly in this JSON format:
{
  "scores": {
    "technicalScore": 0-100, // Based on hard skills matching JD
    "projectScore": 0-100, // Based on depth and relevance of projects
    "researchScore": 0-100, // Based on research publications or academic work
    "resumeScore": 0-100, // Based on clarity, impact metrics, completeness
    "githubScore": 0-100, // Based on repo count, stars, and activity
    "communicationScore": 0-100, // Based on clarity of writing in resume
    "educationScore": 0-100, // Based on degree match
    "jdAlignmentScore": 0-100 // Based on overall trajectory match
  },
  "evidence": {
    "technical": ["bullet 1", "bullet 2"], // MUST provide evidence if score > 0
    "projects": ["bullet 1", "bullet 2"],
    "research": ["bullet 1"],
    "resume": ["bullet 1"],
    "github": ["bullet 1"],
    "assessment": ["bullet 1"],
    "communication": ["bullet 1"],
    "education": ["bullet 1"],
    "jdAlignment": ["bullet 1"]
  },
  "risks": [
    {
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "reason": "Missing critical skill X",
      "evidence": "Not found in resume",
      "mitigation": "Test in technical screen"
    }
  ],
  "riskPenalty": 0-20, // Points to deduct from overall score based on risks
  "recommendationCategory": "Strong Hire" | "Hire" | "Borderline" | "Further Evaluation" | "Do Not Proceed",
  "recommendationReason": "Why this recommendation was chosen",
  "confidenceScore": 0-100, // Based on amount of data available (e.g., missing github reduces confidence)
  "summary": "100-word concise recruiter summary of the candidate.",
  "interviewFocus": {
    "technical": ["question 1"],
    "behavioral": ["question 1"],
    "portfolio": ["question 1"]
  }
}
`;

  const responseText = await aiProvider.generateText(prompt, "You are a specialized AI recruitment reasoning engine.", true);
  
  let evaluation: any;
  try {
    evaluation = JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse AI evaluation:", e);
    return null;
  }

  // 3. Compute Final Weighted Score
  const wTech = 0.25;
  const wProj = 0.20;
  const wAssessment = 0.20;
  const wGithub = 0.10;
  const wRes = 0.05;
  const wEdu = 0.05;
  const wComm = 0.05;
  const wJD = 0.10;
  
  // Base Score
  let baseScore = (
    (evaluation.scores.technicalScore * wTech) +
    (evaluation.scores.projectScore * wProj) +
    (assessmentScore * wAssessment) +
    (evaluation.scores.githubScore * wGithub) +
    (evaluation.scores.researchScore * wRes) + // Using research weight
    (evaluation.scores.educationScore * wEdu) +
    (evaluation.scores.communicationScore * wComm) +
    (evaluation.scores.jdAlignmentScore * wJD)
  );

  let finalScore = Math.max(0, Math.min(100, baseScore - (evaluation.riskPenalty || 0)));

  // 4. Compute Hiring Rank (Tie-breaker logic: Score -> Assessment -> Projects -> GitHub)
  // For now, we will store a calculated rank metric that can be sorted on the DB level.
  // Formula: finalScore * 1000 + assessmentScore * 10 + projectScore
  const hiringRank = Math.floor((finalScore * 1000) + (assessmentScore * 10) + evaluation.scores.projectScore);

  return {
    technicalScore: evaluation.scores.technicalScore,
    projectScore: evaluation.scores.projectScore,
    researchScore: evaluation.scores.researchScore,
    resumeScore: evaluation.scores.resumeScore,
    assessmentScore,
    githubScore: evaluation.scores.githubScore,
    communicationScore: evaluation.scores.communicationScore,
    educationScore: evaluation.scores.educationScore,
    jdAlignmentScore: evaluation.scores.jdAlignmentScore,
    riskPenalty: evaluation.riskPenalty,
    overallScore: finalScore,
    
    recommendation: evaluation.recommendationCategory,
    confidence: evaluation.confidenceScore,
    hiringRank,
    
    evidence: evaluation.evidence,
    risks: evaluation.risks,
    interviewFocus: evaluation.interviewFocus,
    summary: evaluation.summary
  };
}
