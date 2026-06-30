import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { processResumePipeline } from '@/lib/resume/pipeline';
import { ResumeStatus } from '@prisma/client';
import { WorkflowCoordinator } from '@/lib/agents/core/coordinator';

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { candidates, jobId } = await req.json();
    
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'No valid candidates to import' }, { status: 400 });
    }
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Create an Import Batch
    const importBatch = await prisma.importBatch.create({
      data: {
        source: "UI_UPLOAD"
      }
    });

    let importedCount = 0;

    for (const candidateData of candidates) {
      // Basic validation
      if (!candidateData.name || !candidateData.email) continue;
      
      const email = candidateData.email.toLowerCase();
      
      let cgpa = null;
      if (candidateData.cgpa) {
        const parsed = parseFloat(candidateData.cgpa);
        if (!isNaN(parsed)) cgpa = parsed;
      }

      // Upsert candidate manually (update if exists, create if new)
      const existingCandidate = await prisma.candidate.findFirst({
        where: { email }
      });

      let candidate;
      if (existingCandidate) {
        candidate = await prisma.candidate.update({
          where: { id: existingCandidate.id },
          data: {
            name: candidateData.name,
            phone: candidateData.phone || null,
            college: candidateData.college || null,
            branch: candidateData.branch || null,
            cgpa,
            githubProfile: candidateData.githubProfile || null,
            linkedinProfile: candidateData.linkedinProfile || null,
            bestAiProject: candidateData.bestAiProject || null,
            researchWork: candidateData.researchWork || null,
          }
        });
      } else {
        candidate = await prisma.candidate.create({
          data: {
            name: candidateData.name,
            email,
            phone: candidateData.phone || null,
            college: candidateData.college || null,
            branch: candidateData.branch || null,
            cgpa,
            githubProfile: candidateData.githubProfile || null,
            linkedinProfile: candidateData.linkedinProfile || null,
            bestAiProject: candidateData.bestAiProject || null,
            researchWork: candidateData.researchWork || null,
          }
        });
      }

      // Upsert Import Record (since candidateId is unique in ImportRecord)
      const existingImportRecord = await prisma.importRecord.findFirst({
        where: { candidateId: candidate.id }
      });

      let importRecord;
      if (existingImportRecord) {
        importRecord = await prisma.importRecord.update({
          where: { id: existingImportRecord.id },
          data: {
            batchId: importBatch.id,
            status: "IMPORTED"
          }
        });
      } else {
        importRecord = await prisma.importRecord.create({
          data: {
            batchId: importBatch.id,
            candidateId: candidate.id,
            status: "IMPORTED"
          }
        });
      }

      // Upsert JobMatch
      const existingJobMatch = await prisma.jobMatch.findFirst({
        where: { jobId, candidateId: candidate.id }
      });
      
      if (!existingJobMatch) {
        await prisma.jobMatch.create({
          data: {
            jobId,
            candidateId: candidate.id,
            status: "APPLIED"
          }
        });
      }

      importedCount++;

      // If test scores are provided, upsert an Assessment
      if (candidateData.testLa || candidateData.testCode) {
        const laScore = candidateData.testLa ? parseFloat(candidateData.testLa) : null;
        const codeScore = candidateData.testCode ? parseFloat(candidateData.testCode) : null;
        
        const existingAssessment = await prisma.assessment.findFirst({
          where: { candidateId: candidate.id }
        });

        if (existingAssessment) {
          await prisma.assessment.update({
            where: { id: existingAssessment.id },
            data: {
              logicalScore: !isNaN(laScore as number) ? laScore : null,
              codingScore: !isNaN(codeScore as number) ? codeScore : null,
              status: "COMPLETED",
            }
          });
        } else {
          await prisma.assessment.create({
            data: {
              candidateId: candidate.id,
              jobId: jobId,
              logicalScore: !isNaN(laScore as number) ? laScore : null,
              codingScore: !isNaN(codeScore as number) ? codeScore : null,
              status: "COMPLETED",
            }
          });
        }
      }

      if (!candidateData.githubProfile) {
        await prisma.importWarning.create({
          data: {
            recordId: importRecord.id,
            issueType: "MISSING_GITHUB",
            message: "Candidate is missing a GitHub URL",
            severity: "WARNING"
          }
        });
      }

      // If there's a resume link, create or update PENDING resume and trigger pipeline
      if (candidateData.resumeLink) {
        await prisma.resume.upsert({
          where: { candidateId: candidate.id },
          update: {
            sourceUrl: candidateData.resumeLink,
            status: ResumeStatus.PENDING,
          },
          create: {
            candidateId: candidate.id,
            sourceUrl: candidateData.resumeLink,
            status: ResumeStatus.PENDING,
          }
        });

        // Fire and forget pipeline
        processResumePipeline(candidate.id, candidateData.resumeLink).catch(console.error);
      } else {
        await prisma.importWarning.create({
          data: {
            recordId: importRecord.id,
            issueType: "MISSING_RESUME",
            message: "Candidate is missing a Resume link",
            severity: "WARNING"
          }
        });
      }
      
      // Dispatch agent events asynchronously
      WorkflowCoordinator.dispatch({
        id: crypto.randomUUID(),
        type: "CANDIDATE_UPLOADED",
        payload: { source: "batch_upload" },
        jobId: jobId,
        candidateId: candidate.id,
        timestamp: Date.now()
      }).catch(console.error);
      
      WorkflowCoordinator.dispatch({
        id: crypto.randomUUID(),
        type: "EVALUATION_REQUESTED",
        payload: { trigger: "batch_upload" },
        jobId: jobId,
        candidateId: candidate.id,
        timestamp: Date.now()
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, imported: importedCount, batchId: importBatch.id });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to import candidates' }, { status: 500 });
  }
}
