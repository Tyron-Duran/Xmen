import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseStorageService } from '../lib/storage/supabase-storage.js';
import { jobsStore } from '../lib/services/jobs-store.js';

describe('Proof of Delivery & Supabase Storage (5 MB Cap)', () => {
  beforeEach(() => {
    jobsStore.resetDemo();
  });

  it('successfully accepts image upload under 5 MB with async handling', async () => {
    const smallBuffer = Buffer.from('fake-jpeg-image-binary-stream-123456');
    const result = await supabaseStorageService.uploadProofOfDelivery(
      'JOB-20261110-000001',
      smallBuffer,
      'test-pod.jpg',
      'image/jpeg',
      'corr-pod-1'
    );

    expect(result.success).toBe(true);
    expect(result.storagePath).toContain('JOB-20261110-000001');
    expect(result.sizeBytes).toBe(smallBuffer.length);
    expect(result.fileUrl).toBeDefined();
  });

  it('strictly rejects files exceeding the 5 MB cap', async () => {
    // 5 MB + 1 byte = 5,242,881 bytes
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);

    await expect(
      supabaseStorageService.uploadProofOfDelivery(
        'JOB-20261110-000001',
        oversizedBuffer,
        'huge-photo.jpg',
        'image/jpeg',
        'corr-pod-oversize'
      )
    ).rejects.toThrow(/exceeds the maximum allowable 5 MB cap/);
  });

  it('rejects unsupported file formats', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 test content');

    await expect(
      supabaseStorageService.uploadProofOfDelivery(
        'JOB-20261110-000001',
        pdfBuffer,
        'document.pdf',
        'application/pdf',
        'corr-pod-pdf'
      )
    ).rejects.toThrow(/Invalid MIME type/);
  });
});
