import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { StorageService } from "@/lib/storage/service";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "text/markdown",
  "application/json",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await requireAuth();

  const rateLimit = await checkRateLimit("upload", session.user.id);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many upload requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { filename, mimeType, sizeBytes, checksum, bucket, candidateId, assessmentId } = body;

    // 1. Pre-flight Validation
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Invalid file type. Exes and scripts are not allowed." }, { status: 400 });
    }
    if (sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });
    }
    if (!["resumes", "assessments"].includes(bucket)) {
      return NextResponse.json({ error: "Invalid storage bucket." }, { status: 400 });
    }

    // Optional: Detect Duplicate Checksums
    if (checksum) {
      const existing = await prisma.storedFile.findFirst({
        where: { checksum, bucket, status: "READY" }
      });
      if (existing) {
        return NextResponse.json({ error: "Duplicate file detected.", existingId: existing.id }, { status: 409 });
      }
    }

    // 2. Generate Storage Path
    const extension = filename.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const storagePath = `${candidateId || 'general'}/${uniqueId}.${extension}`;

    // 3. Persist Metadata in UPLOADING state
    const storedFile = await prisma.storedFile.create({
      data: {
        bucket,
        storagePath,
        originalFilename: filename,
        mimeType,
        sizeBytes,
        checksum,
        candidateId,
        assessmentId,
        status: "UPLOADING",
        uploadedBy: session.user.id
      }
    });

    // 4. Generate Signed Upload URL
    const signedData = await StorageService.createUploadURL(bucket, storagePath);

    return NextResponse.json({
      uploadUrl: signedData.signedUrl,
      token: signedData.token, // Depending on Supabase JS version, it might return token/path
      storedFileId: storedFile.id,
      storagePath
    });

  } catch (error) {
    console.error("Storage Pre-flight Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
