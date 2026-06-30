import { requireAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  const session = await requireAuth();

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed endpoint disabled in production" }, { status: 403 });
  }

  if (session.user.role !== "ADMIN") {
    // For demo purposes, we might allow recruiters to reset it, but let's be safe.
    // Actually, let's allow anyone who is authenticated in a demo environment.
  }

  try {
    // Run the Prisma seed script
    const { stdout, stderr } = await execAsync("npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts");
    
    return NextResponse.json({ success: true, message: "Database re-seeded successfully", stdout });
  } catch (error) {
    console.error("Failed to seed database:", error);
    return NextResponse.json({ error: "Failed to reset demo data" }, { status: 500 });
  }
}
