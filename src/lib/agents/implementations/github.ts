import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { prisma } from "@/lib/db/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

export class GithubAgent implements Agent {
  name = "GithubAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "CANDIDATE_UPLOADED" || event.type === "GITHUB_ANALYSIS_REQUESTED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = ["GithubAPI"];
    const reasoning: string[] = [];
    const candidate = context.candidate;

    if (!candidate.githubProfile) {
      // Upsert a deterministic cache indicating missing GitHub profile
      const defaultCache = {
        username: null,
        repoCount: 0,
        totalStars: 0,
        topLanguages: [],
        aiProjectsCount: 0,
        score: 0,
        summary: "No GitHub profile provided",
        risks: [{ severity: "LOW", reason: "Missing GitHub profile", mitigation: "Manual portfolio review" }],
        status: "MISSING",
        lastActive: null
      };
      await prisma.githubCache.upsert({
        where: { candidateId: candidate.id },
        update: { data: defaultCache },
        create: { candidateId: candidate.id, data: defaultCache }
      });
      return {
        success: false,
        confidence: 0,
        reasoning: ["No GitHub profile provided. Stored default cache."],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: false
      };
    }

    try {
      // 1. Extract username
      let username = candidate.githubProfile;
      try {
        const url = new URL(candidate.githubProfile);
        username = url.pathname.split('/').filter(Boolean)[0];
      } catch (e) {
        // If not a URL, assume it's just the username
        username = candidate.githubProfile.replace('@', '');
      }

      reasoning.push(`Extracted GitHub username: ${username}`);

      // 2. Fetch deterministic data from GitHub API
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Scout-AI-Agent'
      };
      
      // Use token if available to avoid rate limits
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const userResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!userResponse.ok) {
        throw new Error(`GitHub API error: ${userResponse.statusText}`);
      }
      const userData = (await userResponse.json()) as any;

      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers });
      let reposData: any[] = [];
      if (reposResponse.ok) {
        reposData = (await reposResponse.json()) as any[];
      }

      reasoning.push(`Fetched user data and ${reposData.length} repositories`);

      // 3. Process languages and activity
      const languages: Record<string, number> = {};
      let totalStars = 0;
      let aiProjects = 0;
      let latestCommitStr = userData.updated_at;

      const aiKeywords = ['ai', 'ml', 'machine-learning', 'llm', 'deep-learning', 'gpt', 'nlp', 'vision', 'pytorch', 'tensorflow'];

      for (const repo of reposData) {
        totalStars += repo.stargazers_count;
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }

        // Check if it's an AI project based on description or name
        const description = (repo.description || '').toLowerCase();
        const name = (repo.name || '').toLowerCase();
        
        if (aiKeywords.some(kw => description.includes(kw) || name.includes(kw))) {
          aiProjects++;
        }
      }

      // 4. Run LLM summary if we have repos
      let llmSummary = "Could not generate summary.";
      let score = 50;

      if (reposData.length > 0 && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'fallback') {
        try {
          toolsUsed.push("GeminiLLM");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          const prompt = `
            Analyze the following GitHub repository data for a candidate applying for an AI Engineer position.
            
            Candidate Name: ${candidate.name}
            Total Repositories: ${reposData.length}
            Total Stars: ${totalStars}
            Languages Used: ${JSON.stringify(languages)}
            
            Top 5 Most Recent Repositories:
            ${reposData.slice(0, 5).map((r: any) => `- ${r.name}: ${r.description || 'No description'} (Stars: ${r.stargazers_count}, Language: ${r.language})`).join('\n')}
            
            Job Context:
            ${JSON.stringify(context.job.structuredData)}

            Provide:
            1. A brief summary of their technical capability (2-3 sentences).
            2. A score from 0-100 indicating their GitHub profile strength specifically for an AI role. Focus on evidence of Python, ML frameworks, or complex system building.
            
            Format as JSON: { "summary": "...", "score": 85 }
          `;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          
          // Extract JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            llmSummary = parsed.summary;
            score = parsed.score;
            reasoning.push("Generated LLM summary of GitHub profile.");
          }
        } catch (e) {
          console.error("Gemini GitHub analysis failed:", e);
          reasoning.push("LLM analysis failed, falling back to deterministic scoring.");
          
          // Deterministic fallback score
          score = Math.min(100, 
            (aiProjects * 10) + 
            (totalStars * 2) + 
            (reposData.length > 10 ? 20 : reposData.length * 2) +
            (languages['Python'] ? 20 : 0)
          );
        }
      } else {
        // Pure deterministic score
        score = Math.min(100, 
          (aiProjects * 10) + 
          (totalStars * 2) + 
          (reposData.length > 10 ? 20 : reposData.length * 2) +
          (languages['Python'] ? 20 : 0)
        );
        llmSummary = `Analyzed ${reposData.length} repositories with ${totalStars} total stars. Top languages: ${Object.keys(languages).slice(0, 3).join(', ')}. Found ${aiProjects} potential AI-related projects.`;
      }

      const output = {
        username,
        repoCount: reposData.length,
        totalStars,
        topLanguages: Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]),
        aiProjectsCount: aiProjects,
        score,
        summary: llmSummary,
        lastActive: latestCommitStr,
        risks: [],
        status: "SUCCESS"
      };

      // 5. Cache the data
      await prisma.githubCache.upsert({
        where: { candidateId: candidate.id },
        update: { data: output },
        create: {
          candidateId: candidate.id,
          data: output
        }
      });

      return {
        success: true,
        confidence: 0.9,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output,
        requiresHumanReview: false
      };
    } catch (e: any) {
      // On any error, store a failure cache so evaluator can still proceed
      const failureCache = {
        username: candidate.githubProfile || null,
        repoCount: 0,
        totalStars: 0,
        topLanguages: [],
        aiProjectsCount: 0,
        score: 0,
        summary: `GitHub analysis failed: ${e.message}`,
        risks: [{ severity: "HIGH", reason: "GitHub API error", mitigation: "Manual review or retry later" }],
        status: "ERROR",
        lastActive: null
      };
      await prisma.githubCache.upsert({
        where: { candidateId: candidate.id },
        update: { data: failureCache },
        create: { candidateId: candidate.id, data: failureCache }
      });
      return {
        success: false,
        confidence: 0,
        reasoning: ["Failed to analyze GitHub profile", String(e)],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }
  }
}
