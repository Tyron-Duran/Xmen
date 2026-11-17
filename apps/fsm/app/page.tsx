'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatusChip } from '@prototype/ui';
import {
  Briefcase,
  Users,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  Search,
  Filter,
  UserCheck,
  Clock,
  MapPin,
  X,
  Phone,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import type { JobStatus } from '@prototype/contract';

interface Job {
  jobNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  serviceArea: string;
  address: string;
  status: JobStatus;
  technicianName?: string;
  technicianId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  itemsCount: number;
}

const initialJobs: Job[] = [
  {
    jobNumber: 'JOB-20261110-000001',
    orderNumber: 'GH-20261110-000001',
    customerName: 'Juan Dela Cruz',
    customerPhone: '+639171234567',
    serviceArea: 'Metro Manila (Makati)',
    address: '123 Ayala Avenue, Tower One, Makati City',
    status: 'Scheduled',
    technicianName: 'Arnel Mendoza',
    technicianId: 'tech-001',
    scheduledStart: '2026-11-16T09:00:00+08:00',
    scheduledEnd: '2026-11-16T12:00:00+08:00',
    itemsCount: 2
  },
  {
    jobNumber: 'JOB-20261110-000002',
    orderNumber: 'GH-20261110-000002',
    customerName: 'Maria Santos',
    customerPhone: '+639189876543',
    serviceArea: 'Cavite (Bacoor)',
    address: '456 Molino Blvd, Bacoor, Cavite',
    status: 'Pending Scheduling',
    itemsCount: 1
  },
  {
    jobNumber: 'JOB-20261110-000003',
    orderNumber: 'GH-20261110-000003',
    customerName: 'Robert Tan',
    customerPhone: '+639201122334',
    serviceArea: 'Laguna (Santa Rosa)',
    address: '789 Greenfield Parkway, Santa Rosa, Laguna',
    status: 'In Progress',
    technicianName: 'Danilo Reyes',
    technicianId: 'tech-002',
    scheduledStart: '2026-11-16T13:00:00+08:00',
    scheduledEnd: '2026-11-16T16:00:00+08:00',
    itemsCount: 4
  }
];

export default function FSMDashboard() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningJob, setAssigningJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [selectedTech, setSelectedTech] = useState('Arnel Mendoza');
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const technicians = [
    { id: 'tech-001', name: 'Arnel Mendoza', skills: ['CCTV', 'Alarms', 'Smart Locks'] },
    { id: 'tech-002', name: 'Danilo Reyes', skills: ['Electric Fence', 'Networking'] }
  ];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictAlert(null);

    if (!assigningJob) return;

    // Simulate GiST exclusion conflict check
    if (selectedTech === 'Arnel Mendoza' && assigningJob.jobNumber === 'JOB-20261110-000002') {
      setConflictAlert(
        '409 SCHEDULE_CONFLICT: PostgreSQL GiST constraint violation! Arnel Mendoza already has an active overlapping appointment during this window.'
      );
      return;
    }

    // Success assignment
    setJobs(prev =>
      prev.map(j =>
        j.jobNumber === assigningJob.jobNumber
          ? {
              ...j,
              status: 'Scheduled',
              technicianName: selectedTech,
              technicianId: selectedTech === 'Arnel Mendoza' ? 'tech-001' : 'tech-002',
              scheduledStart: '2026-11-17T09:00:00+08:00',
              scheduledEnd: '2026-11-17T12:00:00+08:00'
            }
          : j
      )
    );

    setSuccessToast(`✓ Successfully assigned ${selectedTech} to ${assigningJob.jobNumber}! Dispatched OP-05 to System A.`);
    setAssigningJob(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredJobs = jobs.filter(j => {
    const matchesStatus = statusFilter === 'all' || j.status.toLowerCase().replace(/\s+/g, '_') === statusFilter.toLowerCase();
    const matchesSearch = !searchQuery ||
      j.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.serviceArea.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Console Navigation */}
      <header className="bg-slate-950 text-white py-4 px-6 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-indigo-600/30 rounded-xl border border-indigo-500/40 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block">FSM Dispatch Console</span>
              <span className="block text-xs text-indigo-300 font-medium">System B • Field Service Management</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <Link href="/" className="text-white hover:text-indigo-300 transition-colors">Jobs Queue</Link>
            <Link href="/technician" className="text-slate-300 hover:text-indigo-300 transition-colors">Technician App</Link>
            <Link href="/demo" className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl font-bold hover:bg-indigo-500 transition-colors text-xs flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              FSM Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8">
        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Scheduling</span>
              <span className="block text-3xl font-black text-amber-400 mt-1">
                {jobs.filter(j => j.status === 'Pending Scheduling').length}
              </span>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-400/40" />
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Today</span>
              <span className="block text-3xl font-black text-blue-400 mt-1">
                {jobs.filter(j => j.status === 'Scheduled').length}
              </span>
            </div>
            <Calendar className="w-8 h-8 text-blue-400/40" />
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
              <span className="block text-3xl font-black text-indigo-400 mt-1">
                {jobs.filter(j => j.status === 'In Progress').length}
              </span>
            </div>
            <CheckSquare className="w-8 h-8 text-indigo-400/40" />
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
              <span className="block text-3xl font-black text-emerald-400 mt-1">6 Techs</span>
            </div>
            <Users className="w-8 h-8 text-emerald-400/40" />
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-slate-800/60 rounded-3xl border border-slate-700/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Live Dispatch Jobs Queue</h2>
              <p className="text-xs sm:text-sm text-slate-400">Governed by GiST exclusion lock to prevent double-booking</p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search job #, customer, area..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Filter Status Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            {['all', 'pending_scheduling', 'scheduled', 'in_progress', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase font-black text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-5 py-4">Job Number</th>
                  <th className="px-5 py-4">Order Ref</th>
                  <th className="px-5 py-4">Customer & Service Area</th>
                  <th className="px-5 py-4">Hardware</th>
                  <th className="px-5 py-4">Technician</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {filteredJobs.map((job) => (
                  <tr key={job.jobNumber} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-400 text-xs sm:text-sm">{job.jobNumber}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{job.orderNumber}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{job.customerName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {job.serviceArea}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs">{job.itemsCount} unit(s)</td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-200">
                      {job.technicianName ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          {job.technicianName}
                        </span>
                      ) : (
                        <span className="text-amber-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusChip status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewingJob(job)}
                        className="text-xs font-bold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                      {job.status === 'Pending Scheduling' && (
                        <button
                          onClick={() => setAssigningJob(job)}
                          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-colors shadow"
                        >
                          Assign Tech
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Technician Modal */}
      {assigningJob && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-black text-lg text-white">Assign Technician & Time Slot</h3>
              <button
                onClick={() => { setAssigningJob(null); setConflictAlert(null); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {conflictAlert && (
              <div className="p-3.5 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{conflictAlert}</span>
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-slate-400 block text-[11px] uppercase">Job Assignment</span>
                <span className="font-black text-white text-base block">{assigningJob.jobNumber}</span>
                <span className="text-slate-300 block">{assigningJob.customerName} • {assigningJob.serviceArea}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Select Certified Field Technician</label>
                <select
                  value={selectedTech}
                  onChange={e => { setSelectedTech(e.target.value); setConflictAlert(null); }}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.skills.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Appointment Window</label>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 font-semibold text-slate-300">
                  Target Slot: Tomorrow 09:00 AM – 12:00 PM (Active GiST validation)
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAssigningJob(null); setConflictAlert(null); }}
                  className="w-1/2 py-2.5 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewingJob && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-black text-lg text-white">Installation Mission Details</h3>
              <button onClick={() => setViewingJob(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Job Number</span>
                  <span className="font-black text-indigo-400 font-mono text-sm">{viewingJob.jobNumber}</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Order Number</span>
                  <span className="font-black text-white font-mono text-sm">{viewingJob.orderNumber}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer & Delivery Site</span>
                <span className="font-bold text-white block text-sm">{viewingJob.customerName}</span>
                <span className="text-slate-300 block">{viewingJob.address}</span>
                <span className="text-indigo-300 block font-mono">{viewingJob.customerPhone}</span>
              </div>

              <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Technician Assignment</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {viewingJob.technicianName || 'Unassigned'}
                  </span>
                  <StatusChip status={viewingJob.status} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingJob(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
