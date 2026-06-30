import { prisma } from "../db/prisma";

export interface GitHubStats {
  repos: number;
  languages: string[];
  stars: number;
  forks: number;
  lastCommit?: string;
}

export async function fetchGithubStats(username: string): Promise<GitHubStats | null> {
  try {
    // 1. Fetch user repos
    const headers: Record<string, string> = {
      "User-Agent": "Scout-AI-Recruiter",
      Accept: "application/vnd.github.v3+json",
    };

    // If a token is provided in env, use it to avoid rate limits
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
      headers,
    });

    if (!res.ok) {
      console.warn(`GitHub API failed for ${username}: ${res.statusText}`);
      return null;
    }

    const repos = await res.json();
    if (!Array.isArray(repos)) return null;

    let totalStars = 0;
    let totalForks = 0;
    const languageCounts: Record<string, number> = {};
    let lastCommit = "";

    for (const repo of repos) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;

      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }

      if (!lastCommit && repo.pushed_at) {
        lastCommit = repo.pushed_at;
      }
    }

    // Sort languages by frequency
    const languages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    return {
      repos: repos.length,
      languages,
      stars: totalStars,
      forks: totalForks,
      lastCommit: lastCommit || undefined,
    };
  } catch (error) {
    console.error(`Failed to fetch GitHub stats for ${username}:`, error);
    return null;
  }
}

export async function getCachedGithubStats(candidateId: string, githubUrl: string): Promise<GitHubStats | null> {
  const username = extractGithubUsername(githubUrl);
  if (!username) return null;

  // Check cache
  const cached = await prisma.githubCache.findUnique({
    where: { candidateId },
  });

  // If cache is less than 24 hours old, return it
  if (cached && Date.now() - cached.updatedAt.getTime() < 24 * 60 * 60 * 1000) {
    return cached.data as unknown as GitHubStats;
  }

  // Fetch new stats
  const stats = await fetchGithubStats(username);
  if (!stats) {
    // If fetch failed, return stale cache if it exists
    return cached ? (cached.data as unknown as GitHubStats) : null;
  }

  // Save to cache
  await prisma.githubCache.upsert({
    where: { candidateId },
    create: {
      candidateId,
      data: stats as any,
    },
    update: {
      data: stats as any,
    },
  });

  return stats;
}

function extractGithubUsername(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes("github.com")) return null;
    const parts = parsedUrl.pathname.split("/").filter(Boolean);
    return parts.length > 0 ? parts[0] : null;
  } catch {
    return null;
  }
}
