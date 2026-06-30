import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { prisma } from "@/lib/db/prisma";
import { aiProvider } from "@/lib/ai/provider";

export class EvaluatorAgent implements Agent {
  name = "EvaluatorAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "EVALUATION_REQUESTED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = ["EvaluatorLLM"];
    const reasoning: string[] = [];
    const candidate = context.candidate;
    const job = context.job;

    try {
      reasoning.push(`Starting evaluation for candidate: ${candidate.name} against job: ${job.title}`);

      // 1. Gather all candidate data
      const githubCache = await prisma.githubCache.findUnique({
        where: { candidateId: candidate.id }
      });
      
      const assessment = await prisma.assessment.findFirst({
        where: { candidateId: candidate.id, jobId: job.id }
      });

      let resumeText = "No resume text available.";
      if (candidate.resume && candidate.resume.status === "PARSED" && candidate.resume.rawText) {
        resumeText = candidate.resume.rawText.substring(0, 3000); // Truncate for prompt
      } else {
        reasoning.push("Resume parsing failed or unavailable. Falling back to dataset fields.");
      }

      // 2. Prepare the prompt
      const prompt = `
        You are an expert AI Technical Recruiter. Evaluate the following candidate for the role of ${job.title}.
        
        Job Requirements:
        ${job.rawText}

        Candidate Information:
        Name: ${candidate.name}
        College: ${candidate.college || 'Not provided'}
        Branch: ${candidate.branch || 'Not provided'}
        CGPA: ${candidate.cgpa || 'Not provided'}
        Best AI Project: ${candidate.bestAiProject || 'Not provided'}
        Research Work: ${candidate.researchWork || 'Not provided'}

        Test Scores (0-100):
        Logical Ability: ${assessment?.logicalScore || candidate.testLa || 'Not taken'}
        Coding Ability: ${assessment?.codingScore || candidate.testCode || 'Not taken'}

        GitHub Analysis:
        ${githubCache ? JSON.stringify(githubCache.data, null, 2) : 'No GitHub data available.'}

        Resume Text Excerpt:
        ${resumeText}

        Provide a comprehensive evaluation formatted EXACTLY as a JSON object with the following schema:
        {
          "overallScore": number (0-100),
          "technicalScore": number (0-100, based on coding test, github, and projects),
          "projectScore": number (0-100, based on best_ai_project and github),
          "educationScore": number (0-100, based on college, branch, cgpa),
          "recommendation": string (must be one of: "STRONG_HIRE", "HIRE", "FURTHER_EVALUATION", "REJECT"),
          "confidence": number (0-100),
          "summary": string (1-2 paragraph summary of why they fit or don't fit),
          "evidence": [ { "component": string, "fact": string } ],
          "risks": [ { "severity": "HIGH" | "MEDIUM" | "LOW", "reason": string, "mitigation": string } ],
          "interviewFocus": [ string ] (3-5 suggested technical interview questions)
        }
        
        CRITICAL: ONLY return valid JSON. Do not include markdown formatting or backticks around the JSON.
      `;


      // Deterministic fallback evaluation using multiple candidate signals
      const getDeterministicFallback = () => {
        reasoning.push("Using deterministic fallback evaluation.");
        const githubData =
          githubCache?.data && typeof githubCache.data === "object" && !Array.isArray(githubCache.data)
            ? (githubCache.data as Record<string, unknown>)
            : {};
        // Base education score from CGPA (0-10 scale)
        const cgpaScore = candidate.cgpa ? Math.min(10, candidate.cgpa) * 10 : 50;
        // Test scores (coding and logical) weighted
        const codingScore = assessment?.codingScore || candidate.testCode || 0;
        const logicalScore = assessment?.logicalScore || candidate.testLa || 0;
        const testScore = (codingScore + logicalScore) / 2; // average 0-100
        // GitHub score if cache exists
        const githubScore = typeof githubData.score === "number" ? githubData.score : 0;
        // Project relevance: simple keyword overlap count between best AI project and job description
        const projectKeywords = candidate.bestAiProject ? candidate.bestAiProject.toLowerCase().split(/\s+/) : [];
        const jdText = job.rawText ? job.rawText.toLowerCase() : '';
        const overlap = projectKeywords.filter((k: string) => jdText.includes(k)).length;
        const projectScore = Math.min(100, overlap * 20); // each matching word adds 20 up to 100
        // Research presence adds bonus
        const researchScore = candidate.researchWork ? 10 : 0;
        // Combine into overall score (weights sum to 100)
        const overallScore = Math.min(100,
          0.3 * cgpaScore +
          0.3 * testScore +
          0.2 * githubScore +
          0.1 * projectScore +
          0.1 * researchScore
        );
        // Recommendation based on thresholds
        let recommendation = "FURTHER_EVALUATION";
        if (overallScore >= 90) recommendation = "STRONG_HIRE";
        else if (overallScore >= 80) recommendation = "HIRE";
        else if (overallScore < 60) recommendation = "REJECT";
        // Evidence array
        const evidence = [];
        evidence.push({ component: "Education", fact: `CGPA ${candidate.cgpa ?? 'N/A'}` });
        evidence.push({ component: "Coding Test", fact: `Score ${codingScore}` });
        evidence.push({ component: "Logical Test", fact: `Score ${logicalScore}` });
        evidence.push({ component: "GitHub", fact: `Score ${githubScore}` });
        evidence.push({ component: "Project Overlap", fact: `${overlap} keyword matches` });
        if (candidate.researchWork) evidence.push({ component: "Research", fact: `Present` });
        // Risks array
        const risks = [];
        if (!candidate.githubProfile) risks.push({ severity: "LOW", reason: "Missing GitHub profile", mitigation: "Manual portfolio review" });
        if (!candidate.bestAiProject) risks.push({ severity: "LOW", reason: "No AI project listed", mitigation: "Ask during interview" });
        // Interview focus suggestions
        const interviewFocus = [
          "Explain your most significant AI project",
          "Discuss problem‑solving approach in coding tests",
          "Describe any research experience",
          "Explain how you stay updated with ML trends"
        ];
        return {
          overallScore,
          technicalScore: testScore,
          projectScore,
          educationScore: cgpaScore,
          recommendation,
          confidence: 70,
          summary: `Deterministic evaluation based on available data. Overall score ${overallScore.toFixed(1)}.`,
          evidence,
          risks,
          interviewFocus,
          githubScore,
          assessmentScore: testScore,
          researchScore,
          jdAlignmentScore: projectScore,
          fallbackUsed: true
        };
      };


      

      let output: any;
      let success = false;
      const MAX_RETRIES = 3;

      if (process.env.AI_PROVIDER) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const text = await aiProvider.generateText(prompt, "", false);
            // Clean up markdown just in case the provider wrapped it
            const cleanedText = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
            output = JSON.parse(cleanedText);
            output.fallbackUsed = false;
            success = true;
            reasoning.push(`Successfully generated LLM evaluation using ${process.env.AI_PROVIDER} on attempt ${attempt}.`);
            break; // Exit retry loop on success
          } catch (e) {
            console.error(`Evaluation failed on attempt ${attempt}:`, e);
            if (attempt < MAX_RETRIES) {
              // Wait with exponential backoff (e.g., 2s, 4s) to respect rate limits
              await new Promise(res => setTimeout(res, 2000 * Math.pow(2, attempt - 1)));
            }
          }
        }
      }

      if (!success) {
        console.warn(`All ${MAX_RETRIES} AI attempts failed, falling back to deterministic.`);
        output = getDeterministicFallback();
      }

      // 3. Update the Job Match
      await prisma.jobMatch.upsert({
        where: {
          jobId_candidateId: {
            jobId: job.id,
            candidateId: candidate.id
          }
        },
        update: {
          status: "SCREENING",
          overallScore: output.overallScore,
          technicalScore: output.technicalScore,
          projectScore: output.projectScore,
          educationScore: output.educationScore,
          recommendation: output.recommendation,
          confidence: output.confidence,
          summary: output.summary,
          evidence: output.evidence,
          risks: output.risks,
          interviewFocus: output.interviewFocus,
          githubScore: output.githubScore,
          assessmentScore: output.assessmentScore,
          researchScore: output.researchScore,
          jdAlignmentScore: output.jdAlignmentScore,
          fallbackUsed: output.fallbackUsed
        },
        create: {
          fallbackUsed: output.fallbackUsed,
          jobId: job.id,
          candidateId: candidate.id,
          status: "SCREENING",
          overallScore: output.overallScore,
          technicalScore: output.technicalScore,
          projectScore: output.projectScore,
          educationScore: output.educationScore,
          recommendation: output.recommendation,
          confidence: output.confidence,
          summary: output.summary,
          evidence: output.evidence,
          risks: output.risks,
          interviewFocus: output.interviewFocus,
          githubScore: output.githubScore,
          assessmentScore: output.assessmentScore,
          researchScore: output.researchScore,
          jdAlignmentScore: output.jdAlignmentScore
        }
      });

      return {
        success: true,
        confidence: output.confidence / 100,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output,
        requiresHumanReview: false
      };
    } catch (e) {
      console.error("Evaluation failed:", e);
      return {
        success: false,
        confidence: 0,
        reasoning: ["Failed to evaluate candidate", String(e)],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }
  }
}
