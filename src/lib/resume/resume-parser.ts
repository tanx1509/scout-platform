import type { 
  PersonalInfo, 
  Education, 
  Experience, 
  Project, 
  SkillTaxonomy, 
  Research, 
  Achievement, 
  Certification, 
  TimelineEvent 
} from '@/types/candidate';

export interface ParsedResume {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: SkillTaxonomy;
  research: Research[];
  achievements: Achievement[];
  certifications: Certification[];
  languages: string[];
  timeline: TimelineEvent[];
  confidence: number;
  sections: { type: string; rawContent: string; confidence: number }[];
}

const SKILLS_DICT = {
  programming: ['Python', 'Java', 'C++', 'C', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'Kotlin', 'Swift', 'Scala', 'R', 'MATLAB', 'Perl', 'PHP', 'Dart', 'Lua', 'Shell', 'Bash', 'Assembly', 'Haskell', 'Elixir', 'Clojure', 'Julia'],
  ai_ml: ['TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'OpenCV', 'NLTK', 'spaCy', 'Hugging Face', 'LangChain', 'NumPy', 'Pandas', 'Matplotlib', 'Seaborn', 'XGBoost', 'LightGBM', 'YOLO', 'GANs', 'Transformers', 'BERT', 'GPT', 'Stable Diffusion', 'Reinforcement Learning', 'Computer Vision', 'NLP', 'Deep Learning', 'Machine Learning', 'Neural Networks', 'CNNs', 'RNNs', 'LSTMs', 'RAG'],
  frontend: ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Material UI', 'jQuery', 'Redux', 'Zustand', 'Three.js', 'WebGL', 'Figma'],
  backend: ['Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'NestJS', 'GraphQL', 'REST API', 'gRPC', 'Microservices', 'WebSockets'],
  cloud: ['AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify', 'Firebase', 'Supabase', 'DigitalOcean', 'Lambda', 'S3', 'EC2', 'CloudFormation', 'Terraform'],
  devops: ['Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'CI/CD', 'Nginx', 'Apache', 'Linux', 'Git', 'Ansible', 'Prometheus', 'Grafana'],
  databases: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'DynamoDB', 'Cassandra', 'Neo4j', 'Prisma', 'Sequelize', 'Mongoose'],
  soft_skills: ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking', 'Agile', 'Scrum', 'Project Management', 'Public Speaking', 'Mentoring']
};

export function parseResume(text: string): ParsedResume {
  const sections = extractSections(text);
  const personalInfo = extractPersonalInfo(text);
  const education = extractEducation(sections['EDUCATION'] || '');
  const experience = extractExperience(sections['EXPERIENCE'] || '');
  const projects = extractProjects(sections['PROJECTS'] || '');
  const skills = extractSkills(sections['SKILLS'] || '' + text);
  const research = extractResearch(sections['RESEARCH'] || '');
  const achievements = extractAchievements(sections['ACHIEVEMENTS'] || '');
  const certifications = extractCertifications(sections['CERTIFICATIONS'] || '');
  const languages = extractLanguages(sections['LANGUAGES'] || '');
  
  const timeline = generateTimeline(education, experience, projects, achievements, certifications, research);
  const confidence = calculateConfidence(text, personalInfo, education, experience, sections);

  const sectionArray = Object.entries(sections).map(([type, rawContent]) => ({
    type,
    rawContent,
    confidence: 100 // placeholder
  }));

  return {
    personalInfo,
    education,
    experience,
    projects,
    skills,
    research,
    achievements,
    certifications,
    languages,
    timeline,
    confidence,
    sections: sectionArray
  };
}

function extractSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  let currentSection = 'SUMMARY';
  const sections: Record<string, string[]> = { 'SUMMARY': [] };

  const sectionKeywords: Record<string, RegExp> = {
    'EDUCATION': /^(EDUCATION|ACADEMIC|QUALIFICATION|UNIVERSITY)\b/i,
    'EXPERIENCE': /^(EXPERIENCE|WORK|EMPLOYMENT|CAREER|PROFESSIONAL)\b/i,
    'PROJECTS': /^(PROJECTS|PORTFOLIO|PERSONAL PROJECTS?|ACADEMIC PROJECTS?)\b/i,
    'SKILLS': /^(SKILLS|TECHNICAL SKILLS|COMPETENCIES|EXPERTISE|TECHNOLOGIES)\b/i,
    'CERTIFICATIONS': /^(CERTIFICATIONS?|CERTIFICATES?|LICENSES?|CREDENTIALS?)\b/i,
    'ACHIEVEMENTS': /^(ACHIEVEMENTS?|AWARDS?|HONORS?|RECOGNITIONS?|ACCOMPLISHMENTS?)\b/i,
    'RESEARCH': /^(RESEARCH|PUBLICATIONS?|PAPERS?|THESIS)\b/i,
    'LANGUAGES': /^(LANGUAGES?)\b/i,
    'SUMMARY': /^(SUMMARY|OBJECTIVE|ABOUT|PROFILE|INTRODUCTION)\b/i,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matchedSection = null;
    if (trimmed.length < 50) {
      for (const [key, regex] of Object.entries(sectionKeywords)) {
        if (regex.test(trimmed)) {
          matchedSection = key;
          break;
        }
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(line);
    }
  }

  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(sections)) {
    if (val.length > 0) result[key] = val.join('\n');
  }
  return result;
}

function extractPersonalInfo(text: string): PersonalInfo {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const name = lines.length > 0 ? lines[0] : 'Unknown';

  return {
    name,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : undefined,
    github: githubMatch ? `https://${githubMatch[0]}` : undefined,
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : undefined,
  };
}

function extractEducation(text: string): Education[] {
  if (!text) return [];
  // Basic heuristic: split by newlines, look for degree keywords
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const results: Education[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/B\.?Tech|B\.?E\.|M\.?Tech|M\.?S\.|B\.?S\.|Ph\.?D|Bachelor|Master/i.test(line)) {
      results.push({
        degree: line,
        institution: lines[i+1] || 'Unknown',
        startDate: 'Unknown',
        endDate: 'Unknown'
      });
    }
  }
  return results.length > 0 ? results : [{ degree: 'Extracted Education', institution: 'See raw text' }];
}

function extractExperience(text: string): Experience[] {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  // Basic heuristic
  return [{
    company: lines[0] || 'Unknown',
    role: lines[1] || 'Unknown',
    description: lines.slice(2, Math.min(5, lines.length)).join(' ')
  }];
}

function extractProjects(text: string): Project[] {
  if (!text) return [];
  return [{
    title: 'Extracted Projects',
    description: text.substring(0, 100) + '...'
  }];
}

function extractSkills(text: string): SkillTaxonomy {
  const result: SkillTaxonomy = {
    programming: [], ai_ml: [], cloud: [], devops: [], frontend: [], backend: [], databases: [], soft_skills: [], other: []
  };
  
  for (const [category, skills] of Object.entries(SKILLS_DICT)) {
    for (const skill of skills) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        (result as any)[category].push(skill);
      }
    }
  }
  return result;
}

function extractResearch(text: string): Research[] {
  if (!text) return [];
  return [{ title: 'Extracted Research', description: text.substring(0, 100) }];
}

function extractAchievements(text: string): Achievement[] {
  if (!text) return [];
  return [{ title: 'Extracted Achievement', description: text.substring(0, 100) }];
}

function extractCertifications(text: string): Certification[] {
  if (!text) return [];
  return [{ name: 'Extracted Certification' }];
}

function extractLanguages(text: string): string[] {
  if (!text) return [];
  return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function generateTimeline(
  education: Education[], 
  experience: Experience[], 
  projects: Project[], 
  achievements: Achievement[], 
  certifications: Certification[], 
  research: Research[]
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];
  
  education.forEach(e => timeline.push({ type: 'education', title: e.degree, subtitle: e.institution, date: e.startDate || 'Unknown', endDate: e.endDate }));
  experience.forEach(e => timeline.push({ type: 'experience', title: e.role, subtitle: e.company, date: e.startDate || 'Unknown', endDate: e.endDate, description: e.description }));
  projects.forEach(p => timeline.push({ type: 'project', title: p.title, date: p.date || 'Unknown', description: p.description }));
  
  return timeline; // Simple version, ideally sort by date
}

function calculateConfidence(text: string, pi: PersonalInfo, edu: Education[], exp: Experience[], sections: Record<string, string>): number {
  let score = 100;
  if (!pi.email) score -= 5;
  if (!pi.phone) score -= 5;
  if (edu.length === 0) score -= 15;
  if (exp.length === 0) score -= 15;
  if (!sections['EDUCATION']) score -= 10;
  if (!sections['EXPERIENCE']) score -= 10;
  if (text.length < 200) score -= 10;
  return Math.max(5, score);
}
