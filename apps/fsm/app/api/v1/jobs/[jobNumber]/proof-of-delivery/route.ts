import { NextResponse, type NextRequest } from 'next/server';
import { supabaseStorageService } from '@/lib/storage/supabase-storage';
import { createErrorResponse } from '@/lib/errors';
import { jobsStore } from '@/lib/services/jobs-store';
import { logger } from '@prototype/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobNumber: string }> }
) {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const { jobNumber } = await params;

  const job = jobsStore.getJob(jobNumber);
  if (!job) {
    return createErrorResponse('NOT_FOUND', `Job ${jobNumber} not found`, correlationId);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const notes = (formData.get('notes') as string) || '';
    const uploadedBy = (formData.get('uploadedBy') as string) || job.technicianName || 'technician';

    if (!file) {
      return createErrorResponse('VALIDATION_FAILED', 'File is required in form-data field "file"', correlationId, 'file');
    }

    // Strict 5 MB file size check (5 * 1024 * 1024 = 5,242,880 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return createErrorResponse(
        'VALIDATION_FAILED',
        `File size (${file.size} bytes) exceeds the strict 5 MB limit.`,
        correlationId,
        'file',
        422
      );
    }

    const mimeType = file.type || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return createErrorResponse(
        'VALIDATION_FAILED',
        `Invalid file type '${mimeType}'. Only JPEG, PNG, and WebP images are permitted.`,
        correlationId,
        'file',
        422
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Asynchronous upload handling to Supabase Storage
    const uploadResult = await supabaseStorageService.uploadProofOfDelivery(
      jobNumber,
      buffer,
      file.name,
      mimeType,
      correlationId
    );

    // Record PoD on job in jobsStore
    (job as any).proofOfDelivery = {
      fileName: file.name,
      fileUrl: uploadResult.fileUrl,
      storagePath: uploadResult.storagePath,
      sizeBytes: uploadResult.sizeBytes,
      uploadedAt: uploadResult.uploadedAt,
      uploadedBy,
      notes
    };

    logger.info(
      {
        correlationId,
        jobNumber,
        storagePath: uploadResult.storagePath,
        sizeBytes: uploadResult.sizeBytes
      },
      'Proof of Delivery image successfully processed'
    );

    return NextResponse.json(
      {
        success: true,
        jobNumber,
        proofOfDelivery: (job as any).proofOfDelivery
      },
      { status: 201 }
    );
  } catch (err: any) {
    logger.error({ correlationId, jobNumber, error: err.message }, 'Proof of delivery upload failed');
    return createErrorResponse('UNEXPECTED_ERROR', err.message || 'Upload failed', correlationId);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobNumber: string }> }
) {
  const { jobNumber } = await params;
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (path) {
    const file = supabaseStorageService.getLocalFile(path);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return new Response(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  const job = jobsStore.getJob(jobNumber);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    jobNumber,
    proofOfDelivery: (job as any).proofOfDelivery || null
  });
}
