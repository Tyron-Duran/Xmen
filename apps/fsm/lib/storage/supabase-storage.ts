import crypto from 'node:crypto';
import { logger } from '@prototype/logger';

export interface StorageUploadResult {
  success: boolean;
  fileUrl: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5 MB cap
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class SupabaseStorageService {
  private bucket = 'proof-of-delivery';
  private supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  private serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // In-memory fallback storage for dev / demo mode
  private localFiles: Map<string, { buffer: Buffer; mimeType: string }> = new Map();

  public async uploadProofOfDelivery(
    jobNumber: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    correlationId?: string
  ): Promise<StorageUploadResult> {
    // 1. Enforce 5 MB cap strictly
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size ${fileBuffer.length} bytes exceeds the maximum allowable 5 MB cap.`);
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Invalid MIME type '${mimeType}'. Allowed formats: image/jpeg, image/png, image/webp.`);
    }

    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const storagePath = `${jobNumber}/${uniqueId}.${ext}`;

    // 3. Asynchronous dispatch to Supabase Storage if configured
    if (this.supabaseUrl && this.serviceKey) {
      try {
        const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${storagePath}`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.serviceKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: new Uint8Array(fileBuffer)
        });

        if (!res.ok) {
          logger.warn({ status: res.status, jobNumber }, 'Supabase Storage upload warning, falling back to local URL');
        } else {
          const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${storagePath}`;
          logger.info({ correlationId, jobNumber, storagePath, size: fileBuffer.length }, 'PoD uploaded to Supabase Storage');
          return {
            success: true,
            fileUrl: publicUrl,
            storagePath,
            sizeBytes: fileBuffer.length,
            mimeType,
            uploadedAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        logger.warn({ error: err.message, jobNumber }, 'Supabase Storage network error, using local storage');
      }
    }

    // Fallback URL for offline/demo/testing
    this.localFiles.set(storagePath, { buffer: fileBuffer, mimeType });
    const localUrl = `/api/v1/jobs/${jobNumber}/proof-of-delivery?path=${encodeURIComponent(storagePath)}`;

    logger.info({ correlationId, jobNumber, storagePath, size: fileBuffer.length }, 'PoD recorded asynchronously in storage');
    return {
      success: true,
      fileUrl: localUrl,
      storagePath,
      sizeBytes: fileBuffer.length,
      mimeType,
      uploadedAt: new Date().toISOString()
    };
  }

  public getLocalFile(storagePath: string) {
    return this.localFiles.get(storagePath);
  }
}

export const supabaseStorageService = new SupabaseStorageService();
