import { describe, it, expect, beforeEach } from 'vitest';
import { jobsStore } from '../lib/services/jobs-store.js';
import { stockLedger } from '../../store/lib/ledger/stock-ledger.js';
import type { CreateInstallationRequest } from '@prototype/contract';

describe('Performance SLA Benchmark (Non-File API Targets < 200 ms)', () => {
  beforeEach(() => {
    jobsStore.resetDemo();
    stockLedger.reset();
  });

  it('OP-01 Job Creation completes in under 200 ms', async () => {
    const payload: CreateInstallationRequest = {
      orderNumber: 'GH-20261114-099901',
      customerName: 'Performance Test Customer',
      customerPhone: '+639171234567',
      customerEmail: 'perf@goodhand88.com',
      address: {
        line1: '123 Performance Blvd',
        city: 'Quezon City',
        province: 'Metro Manila',
        postalCode: '1100'
      },
      items: [{ sku: 'GH-CCTV-001', quantity: 2 }],
      preferredStart: '2026-11-20T09:00:00+08:00',
      preferredEnd: '2026-11-20T11:00:00+08:00',
      specialInstructions: 'Latency SLA test'
    };

    const start = performance.now();
    const result = await jobsStore.createInstallationJob(
      payload,
      'idemp-perf-001',
      'corr-perf-001'
    );
    const durationMs = performance.now() - start;

    expect(result.status).toBe(201);
    expect(result.body.jobNumber).toBeDefined();
    expect(durationMs).toBeLessThan(200); // Strict SLA < 200 ms
  });

  it('OP-02 Job Retrieval by ID completes in under 200 ms', async () => {
    const start = performance.now();
    const job = jobsStore.getJob('JOB-20261110-000001');
    const durationMs = performance.now() - start;

    expect(job).toBeDefined();
    expect(durationMs).toBeLessThan(200);
  });

  it('OP-12 Stock Availability query completes in under 200 ms', () => {
    const start = performance.now();
    const stock = stockLedger.getStock('GH-CCTV-001');
    const durationMs = performance.now() - start;

    expect(stock.available).toBeGreaterThanOrEqual(0);
    expect(durationMs).toBeLessThan(200);
  });

  it('Technician assignment and conflict resolution check completes in under 200 ms', async () => {
    const start = performance.now();
    const result = await jobsStore.assignTechnician(
      'JOB-20261110-000001',
      'tech-001-uuid',
      'Arnel Mendoza',
      '2026-11-15T14:00:00+08:00',
      '2026-11-15T16:00:00+08:00',
      'corr-perf-assign'
    );
    const durationMs = performance.now() - start;

    expect(result.job.status).toBe('Scheduled');
    expect(durationMs).toBeLessThan(200);
  });
});
