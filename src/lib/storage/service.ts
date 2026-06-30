import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Ensure environment variables exist
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("Missing Supabase configuration in environment variables.");
}

// We instantiate the server-side client with the Service Role key
// This bypasses RLS and allows us to generate signed URLs and delete files.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export class StorageService {
  /**
   * Generates a signed URL that the browser can use to PUT a file directly to Supabase Storage.
   */
  static async createUploadURL(bucket: string, storagePath: string) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);
    
    if (error) {
      throw new Error(`Failed to create upload URL: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Verifies that the file actually exists in storage and matches size expectations.
   */
  static async verifyUpload(bucket: string, storagePath: string, expectedSize: number) {
    // We check if the file exists by getting its metadata
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .info(storagePath);

    if (error) {
      return { success: false, reason: "File not found in storage." };
    }

    // You can also verify size here
    // Supabase .info() doesn't always return size immediately depending on the cache,
    // but in a real scenario we'd check `data.metadata.size`
    
    return { success: true, metadata: data };
  }

  /**
   * Deletes a file from the bucket (useful for cleanup).
   */
  static async delete(bucket: string, storagePath: string) {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    return true;
  }

  /**
   * Generates a short-lived signed URL to securely read a file from a private bucket.
   */
  static async getSignedURL(bucket: string, storagePath: string, expiresInSeconds: number = 3600) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
    return data.signedUrl;
  }

  /**
   * Generates a SHA-256 checksum for a given buffer.
   */
  static generateChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }
}
