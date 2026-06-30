export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
  website?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  cgpa?: number;
  percentage?: number;
  startDate?: string;
  endDate?: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  description?: string;
  location?: string;
}

export interface Project {
  title: string;
  description?: string;
  technologies?: string[];
  url?: string;
  date?: string;
}

export interface Research {
  title: string;
  description?: string;
  publication?: string;
  date?: string;
}

export interface Achievement {
  title: string;
  description?: string;
  date?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface SkillTaxonomy {
  programming: string[];
  ai_ml: string[];
  cloud: string[];
  devops: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  soft_skills: string[];
  other: string[];
}

export interface TimelineEvent {
  date: string;
  endDate?: string;
  type: 'education' | 'experience' | 'project' | 'achievement' | 'certification' | 'research';
  title: string;
  subtitle?: string;
  description?: string;
}

export interface CandidateWithRelations {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  branch: string | null;
  cgpa: number | null;
  githubProfile: string | null;
  linkedinProfile: string | null;
  profileCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
  resume: {
    id: string;
    status: string;
    parsingConfidence: number | null;
    sourceUrl: string | null;
    rawText: string | null;
    errorMessage: string | null;
    parsedAt: Date | null;
  } | null;
  profile: {
    personalInfo: PersonalInfo | null;
    education: Education[] | null;
    experience: Experience[] | null;
    projects: Project[] | null;
    skills: SkillTaxonomy | null;
    research: Research[] | null;
    achievements: Achievement[] | null;
    certifications: Certification[] | null;
    languages: string[] | null;
    timeline: TimelineEvent[] | null;
  } | null;
}

export interface UploadPreviewRow {
  rowIndex: number;
  name: string;
  email: string;
  college?: string;
  branch?: string;
  cgpa?: string;
  resumeLink?: string;
  githubProfile?: string;
  bestAiProject?: string;
  researchWork?: string;
  testLa?: string;
  testCode?: string;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface UploadValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  preview: UploadPreviewRow[];
  rawData: Record<string, string>[];
}

export interface DashboardStats {
  totalCandidates: number;
  successfullyParsed: number;
  parsingFailed: number;
  recentlyUploaded: number;
  averageConfidence: number;
}
