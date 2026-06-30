import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as xlsx from 'xlsx';
import * as path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter, log: ['query'] });

async function main() {
  console.log("🌱 Resetting and Seeding Database with Generic Ingestion Engine...");

  // 1. Wipe existing data
  await prisma.jobMatch.deleteMany({});
  await prisma.agentActivity.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.candidateLabel.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.githubCache.deleteMany({});
  await prisma.storedFile.deleteMany({});
  await prisma.jobAnalysis.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.importWarning.deleteMany({});
  await prisma.importRecord.deleteMany({});
  await prisma.importBatch.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.label.deleteMany({});

  // 2. Create the Founding AI Engineer Job
  const foundingEngineerJob = await prisma.job.create({
    data: {
      title: "Founding AI Engineer",
      department: "Engineering",
      recruiterName: "Rishabh Choudhary",
      rawText: `
        Seeking a Founding AI Engineer with strong background in ML, Python, and scalable backend systems.
        Must have experience with TensorFlow or PyTorch.
        Bonus if you have published research or open-source contributions.
      `,
      structuredData: {
        mustHaves: ["Python", "Machine Learning", "TensorFlow", "PyTorch"],
        niceToHaves: ["Research Publications", "Open Source", "Next.js"],
      }
    }
  });

  // 3. Create Default Labels
  const labels = [
    { name: "Top Talent", color: "blue" },
    { name: "Interview Today", color: "green" },
    { name: "Research Heavy", color: "purple" },
    { name: "Coding Strong", color: "orange" },
  ];
  for (const label of labels) {
    await prisma.label.create({ data: label });
  }

  // 4. Create Import Batch
  const importBatch = await prisma.importBatch.create({
    data: {
      fileName: "candidate_dataset.xlsx",
      source: "SEED"
    }
  });

  // 5. Ingest Raw Dataset Records
  const datasetPath = path.resolve(process.cwd(), 'Requisites', 'candidate_dataset.xlsx');
  console.log(`📊 Reading dataset from ${datasetPath}...`);
  
  let dataset: any[] = [];
  try {
    const workbook = xlsx.readFile(datasetPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    dataset = xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error("❌ Failed to read candidate_dataset.xlsx. Make sure it exists in the Requisites folder.", error);
    process.exit(1);
  }

  console.log(`Found ${dataset.length} candidates. Seeding raw records...`);

  const seenEmails = new Set<string>();

  for (let i = 0; i < dataset.length; i++) {
    const row = dataset[i];
    if (!row.email) continue;
    
    // Dataset Identity
    const datasetRow = String(row.s_no || i + 1);

    try {
      // 5. Create Candidate (No inferred data)
      const candidate = await prisma.candidate.create({
        data: {
          name: row.name || "Unknown Candidate",
          email: row.email,
          college: row.college,
          branch: row.branch,
          cgpa: typeof row.cgpa === 'number' ? row.cgpa : parseFloat(row.cgpa) || null,
          bestAiProject: row.best_ai_project,
          researchWork: row.research_work,
          githubProfile: row.github,
          source: "Dataset Upload",
        }
      });
      
      // 5b. Create Import Record
      const importRecord = await prisma.importRecord.create({
        data: {
          batchId: importBatch.id,
          candidateId: candidate.id,
          datasetRow,
          status: "IMPORTED"
        }
      });
      console.log(`✅ Inserted candidate: ${candidate.name} (${candidate.email}) [datasetRow: ${datasetRow}]`);

      // 5c. Generate Import Warnings
      if (seenEmails.has(row.email)) {
        await prisma.importWarning.create({
          data: {
            recordId: importRecord.id,
            issueType: "DUPLICATE_EMAIL",
            message: `Duplicate email detected: ${row.email}`,
            severity: "WARNING"
          }
        });
      }
      seenEmails.add(row.email);

      if (!row.github) {
        await prisma.importWarning.create({
          data: {
            recordId: importRecord.id,
            issueType: "MISSING_GITHUB",
            message: "Candidate is missing a GitHub URL",
            severity: "WARNING"
          }
        });
      }

      if (!row.resume) {
        await prisma.importWarning.create({
          data: {
            recordId: importRecord.id,
            issueType: "MISSING_RESUME",
            message: "Candidate is missing a Resume link",
            severity: "WARNING"
          }
        });
      }

      // 6. Create Initial Match Record
      await prisma.jobMatch.create({
        data: {
          jobId: foundingEngineerJob.id,
          candidateId: candidate.id,
          status: "APPLIED",
        }
      });

      // 7. Store Resume URL with Uploaded status (Agents trigger later)
      if (row.resume) {
        await prisma.resume.create({
          data: {
            candidateId: candidate.id,
            sourceUrl: row.resume,
            status: "PENDING", 
          }
        });
      }

      // 8. Create Assessment Record with Test Scores
      if (row.test_la || row.test_code) {
        await prisma.assessment.create({
          data: {
            candidateId: candidate.id,
            jobId: foundingEngineerJob.id,
            logicalScore: typeof row.test_la === 'number' ? row.test_la : parseInt(row.test_la) || null,
            codingScore: typeof row.test_code === 'number' ? row.test_code : parseInt(row.test_code) || null,
            status: "SUBMITTED",
            submittedAt: new Date(),
          }
        });
      }
    } catch (error) {
      console.error(`❌ Failed to insert candidate ${row.name || row.email}:`, error);
    }
  }

  console.log("✅ Seed complete! Raw dataset has been ingested.");
  console.log("🚀 Next step: Click 'Initialize Candidate Intelligence' in the UI to trigger parsing agents.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
