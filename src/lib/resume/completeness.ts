export function calculateProfileCompleteness(data: {
  hasResume: boolean;
  hasEducation: boolean;
  hasExperience: boolean;
  hasProjects: boolean;
  hasSkills: boolean;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasPhone: boolean;
  hasCertifications: boolean;
  hasResearch: boolean;
}): number {
  let score = 0;
  if (data.hasResume) score += 15;
  if (data.hasEducation) score += 15;
  if (data.hasExperience) score += 15;
  if (data.hasProjects) score += 15;
  if (data.hasSkills) score += 10;
  if (data.hasGithub) score += 10;
  if (data.hasLinkedin) score += 5;
  if (data.hasPhone) score += 5;
  if (data.hasCertifications) score += 5;
  if (data.hasResearch) score += 5;
  return score;
}
