import { prisma } from "@/lib/db/prisma";

export async function logAudit(userId: string, action: string, req?: Request) {
  try {
    let ip = "unknown";
    let userAgent = "unknown";

    if (req) {
      ip = req.headers.get("x-forwarded-for") || "unknown";
      userAgent = req.headers.get("user-agent") || "unknown";
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ip,
        userAgent
      }
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
