import prisma from '@/lib/db/prisma';
import { extractTextFromUrl } from './pdf-extractor';
import { parseResume } from './resume-parser';
import { calculateProfileCompleteness } from './completeness';
import { SectionType, ResumeStatus } from '@prisma/client';
import { aiProvider } from '../ai/provider';

async function generateManualReview(text: string, parsed: any): Promise<any> {
  const prompt = `
You are a specialized AI Resume Auditor.
Analyze the following parsed resume data and the original raw text.
Provide deep, nuanced insights about the candidate.

Parsed Data:
${JSON.stringify(parsed, null, 2)}

Raw Text Snippet (first 3000 chars):
${text.substring(0, 3000)}

Return ONLY a valid JSON object with the exact following structure:
{
  "resumeSummary": "A 2-sentence executive summary of the candidate.",
  "leadershipSignals": ["Evidence of leadership or mentoring", "Another point"],
  "technicalDepth": "Evaluation of their technical depth based on projects/skills.",
  "projectImpact": "Evaluation of whether their projects show measurable business/technical impact.",
  "writingQuality": "Assessment of resume clarity and grammar.",
  "genericPhrases": ["List of buzzwords used without context", "Another buzzword"],
  "manualReviewSuggestions": ["Nuanced suggestions for recruiter review", "Red flags or gaps"]
}
`;

  try {
    const aiResponse = await aiProvider.generateText(prompt, "You are an expert technical recruiter AI.", true);
    return JSON.parse(aiResponse);
  } catch (e) {
    console.error("Resume LLM error", e);
    return {
      resumeSummary: "Failed to generate AI insights.",
      leadershipSignals: [],
      technicalDepth: "Unknown",
      projectImpact: "Unknown",
      writingQuality: "Unknown",
      genericPhrases: [],
      manualReviewSuggestions: ["Heuristics: Review manually due to AI failure."]
    };
  }
}

export async function processResumePipeline(candidateId: string, resumeUrl: string) {
  try {
    // 1. Set status to PROCESSING
    let resume = await prisma.resume.findUnique({ where: { candidateId } });
    if (!resume) {
      resume = await prisma.resume.create({
        data: {
          candidateId,
          sourceUrl: resumeUrl,
          status: ResumeStatus.PROCESSING,
        }
      });
    } else {
      resume = await prisma.resume.update({
        where: { candidateId },
        data: { status: ResumeStatus.PROCESSING }
      });
    }

    // 2. Download and extract
    const extraction = await extractTextFromUrl(resumeUrl);
    
    if (!extraction.success) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { 
          status: ResumeStatus.FAILED,
          errorMessage: extraction.error
        }
      });
      return;
    }

    // 3. Parse
    const parsed = parseResume(extraction.text);

    // 4. Store sections
    // Clear old sections first
    await prisma.resumeSection.deleteMany({ where: { resumeId: resume.id } });
    
    for (let i = 0; i < parsed.sections.length; i++) {
      const sec = parsed.sections[i];
      // map string to enum gracefully
      const typeStr = sec.type.toUpperCase();
      const validTypes = Object.values(SectionType);
      const sType = validTypes.includes(typeStr as SectionType) ? (typeStr as SectionType) : SectionType.OTHER;

      await prisma.resumeSection.create({
        data: {
          resumeId: resume.id,
          sectionType: sType,
          rawContent: sec.rawContent,
          confidence: sec.confidence,
          orderIndex: i
        }
      });
    }

    // 5. Store profile
    const completeness = calculateProfileCompleteness({
      hasResume: true,
      hasEducation: parsed.education.length > 0,
      hasExperience: parsed.experience.length > 0,
      hasProjects: parsed.projects.length > 0,
      hasSkills: Object.values(parsed.skills).some(arr => arr.length > 0),
      hasGithub: !!parsed.personalInfo.github,
      hasLinkedin: !!parsed.personalInfo.linkedin,
      hasPhone: !!parsed.personalInfo.phone,
      hasCertifications: parsed.certifications.length > 0,
      hasResearch: parsed.research.length > 0
    });

    const manualReview = await generateManualReview(extraction.text, parsed);

    await prisma.candidateProfile.upsert({
      where: { candidateId },
      create: {
        candidateId,
        personalInfo: parsed.personalInfo as any,
        education: parsed.education as any,
        experience: parsed.experience as any,
        projects: parsed.projects as any,
        skills: parsed.skills as any,
        research: parsed.research as any,
        achievements: parsed.achievements as any,
        certifications: parsed.certifications as any,
        languages: parsed.languages as any,
        timeline: parsed.timeline as any,
        manualReview: manualReview as any,
      },
      update: {
        personalInfo: parsed.personalInfo as any,
        education: parsed.education as any,
        experience: parsed.experience as any,
        projects: parsed.projects as any,
        skills: parsed.skills as any,
        research: parsed.research as any,
        achievements: parsed.achievements as any,
        certifications: parsed.certifications as any,
        languages: parsed.languages as any,
        timeline: parsed.timeline as any,
        manualReview: manualReview as any,
      }
    });

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { profileCompleteness: completeness }
    });

    // 6. Update resume status
    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        rawText: extraction.text,
        status: ResumeStatus.PARSED,
        parsingConfidence: parsed.confidence,
        parsedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Pipeline error:", error);
    await prisma.resume.update({
      where: { candidateId },
      data: { 
        status: ResumeStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown pipeline error"
      }
    });
  }
}
