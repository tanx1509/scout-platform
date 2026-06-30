import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StorageService } from "@/lib/storage/service";

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { storedFileId } = await req.json();

    const storedFile = await prisma.storedFile.findUnique({
      where: { id: storedFileId }
    });

    if (!storedFile) {
      return NextResponse.json({ error: "File record not found" }, { status: 404 });
    }

    if (storedFile.status !== "UPLOADING") {
      return NextResponse.json({ error: "File already verified or processing" }, { status: 400 });
    }

    // 1. Verify Upload with Supabase Storage
    const verification = await StorageService.verifyUpload(storedFile.bucket, storedFile.storagePath, storedFile.sizeBytes);

    if (!verification.success) {
      // Storage Lifecycle: Mark as FAILED if not found
      await prisma.storedFile.update({
        where: { id: storedFileId },
        data: { status: "FAILED" }
      });
      return NextResponse.json({ error: verification.reason }, { status: 400 });
    }

    // 2. Mark as READY
    await prisma.storedFile.update({
      where: { id: storedFileId },
      data: { status: "READY" }
    });

    // 3. Internal Job Dispatcher (Mocking the async queue mechanism)
    // In a real production app, this would push to Inngest, BullMQ, or SQS
    dispatchInternalJob(storedFileId);

    return NextResponse.json({ success: true, status: "READY" });

  } catch (error) {
    console.error("Storage Verification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Mock Internal Job Dispatcher
 * Triggered asynchronously after successful upload verification.
 */
function dispatchInternalJob(storedFileId: string) {
  setTimeout(async () => {
    try {
      await prisma.storedFile.update({ where: { id: storedFileId }, data: { status: "PROCESSING" } });
      
      // Simulate Parse delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // After successful parse, you could create Resume/Assessment records
      
      await prisma.storedFile.update({ where: { id: storedFileId }, data: { status: "READY" } }); // Finished processing

    } catch (e) {
      // Storage Lifecycle Cleanup on Processing Failure
      await prisma.storedFile.update({ where: { id: storedFileId }, data: { status: "FAILED" } });
      const file = await prisma.storedFile.findUnique({ where: { id: storedFileId }});
      if (file) {
        await StorageService.delete(file.bucket, file.storagePath);
        await prisma.storedFile.update({ where: { id: storedFileId }, data: { status: "DELETED" } });
      }
    }
  }, 0);
}
