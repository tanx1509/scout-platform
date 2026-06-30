import { prisma } from "./src/lib/db/prisma";

async function main() {
  console.log("Wiping all candidates from the database...");
  const result = await prisma.candidate.deleteMany({});
  console.log(`Deleted ${result.count} candidates.`);
  
  // Wipe jobs if any
  const jobs = await prisma.job.deleteMany({});
  console.log(`Deleted ${jobs.count} jobs.`);
}
main().finally(() => prisma.$disconnect());
