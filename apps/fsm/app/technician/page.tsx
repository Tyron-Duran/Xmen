'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StatusChip } from '@prototype/ui';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  PackageCheck,
  AlertCircle,
  CheckSquare,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Phone,
  Navigation,
  Camera,
  PenTool,
  RotateCcw,
  Upload
} from 'lucide-react';
import Link from 'next/link';

export default function TechnicianMyJobsPage() {
  const [jobStatus, setJobStatus] = useState<'Scheduled' | 'In Progress' | 'Completed'>('Scheduled');
  const [loadedConfirmed, setLoadedConfirmed] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    item1: false,
    item2: false
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Completion form state
  const [serial1, setSerial1] = useState('SN-CAM-4MP-8831');
  const [serial2, setSerial2] = useState('SN-CAM-4MP-8832');
  const [returnedQty, setReturnedQty] = useState(0);
  const [completionNotes, setCompletionNotes] = useState('Clean installation completed. Cables concealed inside conduits.');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Network listener & offline queue load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        syncOfflineQueue();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const savedQueue = localStorage.getItem('fsm_technician_offline_queue');
      if (savedQueue) {
        try {
          const parsed = JSON.parse(savedQueue);
          setOfflineQueueCount(parsed.length || 0);
        } catch {}
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Update loaded state when checklist changes
  useEffect(() => {
    if (checklist.item1 && checklist.item2) {
      setLoadedConfirmed(true);
    } else {
      setLoadedConfirmed(false);
    }
  }, [checklist]);

  const queueOfflineAction = (action: string, payload: any) => {
    const queue = JSON.parse(localStorage.getItem('fsm_technician_offline_queue') || '[]');
    queue.push({
      action,
      payload,
      idempotencyKey: crypto.randomUUID(),
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('fsm_technician_offline_queue', JSON.stringify(queue));
    setOfflineQueueCount(queue.length);
  };

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('fsm_technician_offline_queue') || '[]');
    if (queue.length === 0) return;

    localStorage.removeItem('fsm_technician_offline_queue');
    setOfflineQueueCount(0);
    setSubmittedMessage(`Synced ${queue.length} offline operation(s) to server.`);
  };

  const handleStartJob = () => {
    if (!loadedConfirmed) return;
    setJobStatus('In Progress');
    if (!isOnline) {
      queueOfflineAction('START_JOB', { jobNumber: 'JOB-20261110-000001' });
      setSubmittedMessage('Offline Mode: Job marked "In Progress" locally. Buffered for sync.');
    }
  };

  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    setJobStatus('Completed');
    setShowCompletionModal(false);
    if (!isOnline) {
      queueOfflineAction('COMPLETE_JOB', {
        jobNumber: 'JOB-20261110-000001',
        serial1,
        serial2,
        returnedQty,
        completionNotes,
        hasSignature: true
      });
      setSubmittedMessage('Offline Mode: Completion report saved locally. Queued for automatic sync.');
    } else {
      setSubmittedMessage('Job Completed! OP-07 and OP-08 dispatched to System A.');
    }
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0e2378';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 min-h-screen bg-slate-100 pb-20 text-slate-800">
      {/* Network Status & Simulator Toggle */}
      <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm transition-colors ${
        isOnline ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-950 border border-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />}
          <span>{isOnline ? 'Network Connected (Live Sync)' : 'Offline Driver Mode Active'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 rounded-lg font-bold"
            title="Simulate network drop"
          >
            {isOnline ? 'Test Offline' : 'Go Online'}
          </button>
          {offlineQueueCount > 0 && (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded-lg text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              Sync ({offlineQueueCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile App Header */}
      <div className="bg-[#0e2378] text-white p-5 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] text-blue-200 uppercase font-black tracking-wider">Technician Portal</span>
          <h1 className="text-xl font-black">Arnel Mendoza</h1>
          <span className="text-xs text-blue-300 font-mono">ID: TECH-001 • CCTV & Alarms Certified</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/technician/feedback"
            className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-2 rounded-xl transition-colors border border-white/20"
          >
            ⭐ Reviews
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-black text-sm border border-white/20">
            AM
          </div>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black text-slate-600 uppercase tracking-wider">Current Assigned Mission</h2>
        <span className="text-xs bg-blue-100 text-blue-800 font-black px-2.5 py-0.5 rounded-full">Metro Manila</span>
      </div>

      {/* Assigned Job Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <span className="font-mono text-sm font-black text-[#0e2378]">JOB-20261110-000001</span>
          <StatusChip status={jobStatus} />
        </div>

        {/* Customer & Location */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-700">
          <div className="font-black text-slate-900 text-base">
            Juan Dela Cruz
          </div>

          <div className="flex items-start gap-2 text-slate-600 font-medium">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>123 Ayala Avenue, Tower One, Makati City, Metro Manila</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Target: 09:00 AM – 12:00 PM</span>
          </div>

          {/* Quick Actions (Call & GPS) */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href="tel:+639171234567"
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Call Customer
            </a>
            <button
              onClick={() => alert('GPS Navigation initiated: Route to 123 Ayala Avenue, Makati.')}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold text-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Directions
            </button>
          </div>
        </div>

        {/* Hardware Loading Gate (Pre-Departure Checklist) */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-indigo-600" />
              Vehicle Loading Checklist
            </span>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
              loadedConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {loadedConfirmed ? '✓ 100% Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 text-xs font-medium">
            <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checklist.item1}
                  disabled={jobStatus !== 'Scheduled'}
                  onChange={e => setChecklist(prev => ({ ...prev, item1: e.target.checked }))}
                  className="rounded w-4 h-4 text-[#0e2378]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Dahua 4MP Fixed Dome</span>
                  <span className="font-mono text-[10px] text-slate-500">SKU: GH-CCTV-001 (Unit 1)</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">Qty: 1</span>
            </label>

            <label className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checklist.item2}
                  disabled={jobStatus !== 'Scheduled'}
                  onChange={e => setChecklist(prev => ({ ...prev, item2: e.target.checked }))}
                  className="rounded w-4 h-4 text-[#0e2378]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Dahua 4MP Fixed Dome</span>
                  <span className="font-mono text-[10px] text-slate-500">SKU: GH-CCTV-001 (Unit 2)</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">Qty: 1</span>
            </label>
          </div>
        </div>

        {/* Start Job Button */}
        {jobStatus === 'Scheduled' && (
          <div className="pt-2">
            {!loadedConfirmed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You must physically check off both items above before departure.</span>
              </div>
            )}
            <button
              onClick={handleStartJob}
              disabled={!loadedConfirmed}
              className={`w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all ${
                loadedConfirmed
                  ? 'bg-[#0e2378] hover:bg-[#193893] text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Depart & Start Job (OP-06)
            </button>
          </div>
        )}

        {/* Complete Job Trigger */}
        {jobStatus === 'In Progress' && (
          <div className="pt-2 space-y-2">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium">
              Job is currently <strong>In Progress</strong>. Finish physical installation and record serial numbers.
            </div>
            <button
              onClick={() => setShowCompletionModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <CheckSquare className="w-4 h-4" />
              Fill Completion Report (Serials & PoD)
            </button>
          </div>
        )}

        {jobStatus === 'Completed' && (
          <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <span className="font-black text-sm text-emerald-950 block">Installation Successfully Completed</span>
            <span className="text-xs text-emerald-800 font-semibold">12-Month digital warranty activated in System A</span>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="border-b pb-3 flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">Completion Report</h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold bg-slate-100 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteJob} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 mb-1">Camera 1 Serial Number</label>
                <input
                  type="text"
                  value={serial1}
                  onChange={e => setSerial1(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">Camera 2 Serial Number</label>
                <input
                  type="text"
                  value={serial2}
                  onChange={e => setSerial2(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs font-bold"
                />
              </div>

              {/* Photo Proof of Delivery */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-black text-slate-800">
                  Proof of Delivery Photo (Max 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File exceeds 5 MB cap!');
                        e.target.value = '';
                        setPhotoPreview(null);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setPhotoPreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-[#0e2378] file:text-white file:font-bold"
                />
                {photoPreview && (
                  <div className="relative rounded-xl overflow-hidden border h-24 bg-black flex items-center justify-center">
                    <img src={photoPreview} alt="Preview" className="max-h-full object-contain" />
                    <span className="absolute bottom-1 right-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      ✓ Valid Size
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Digital Signature Canvas */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-800">Customer Digital Sign-Off</label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 cursor-crosshair touch-none"
                  />
                  {!hasSignature && (
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400 pointer-events-none font-medium">
                      Customer sign with finger or mouse here
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">Technician Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="w-1/2 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md"
                >
                  Submit Report (OP-07)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
