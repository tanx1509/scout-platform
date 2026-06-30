export class ClientStorageService {
  /**
   * Uploads a File directly to Supabase Storage using Signed URLs.
   * Includes SHA-256 checksum generation, Pre-flight requests, and 3x Retries.
   */
  static async uploadFile(file: File, bucket: "resumes" | "assessments", candidateId?: string) {
    // 1. Calculate SHA-256 checksum (Client-side)
    const arrayBuffer = await file.arrayBuffer();
    const checksum = await this.calculateSHA256(arrayBuffer);

    // 2. Request Signed URL (Pre-flight Validation)
    const preflightRes = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checksum,
        bucket,
        candidateId
      })
    });

    if (!preflightRes.ok) {
      const err = await preflightRes.json();
      throw new Error(err.error || "Pre-flight validation failed");
    }

    const { uploadUrl, storedFileId } = await preflightRes.json();

    // 3. Perform Direct PUT Upload with 3x Retry
    let attempt = 0;
    const maxRetries = 3;
    let uploadSuccess = false;

    while (attempt < maxRetries && !uploadSuccess) {
      try {
        attempt++;
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type
          }
        });

        if (!putRes.ok) throw new Error("Upload failed");
        uploadSuccess = true;
      } catch (error) {
        if (attempt >= maxRetries) {
          throw new Error("Failed to upload file after 3 attempts. Please check your network.");
        }
        // Exponential backoff
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }

    // 4. Verify Upload & Dispatch Pipeline
    const verifyRes = await fetch("/api/storage/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storedFileId })
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || "Verification failed");
    }

    return { success: true, storedFileId };
  }

  /**
   * Fast SHA-256 calculation using Web Crypto API.
   */
  private static async calculateSHA256(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
}
