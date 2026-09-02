import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { HardDrive, CheckCircle2, ShieldAlert, Archive, FileText, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { SNAPSHOT_REGISTRY } from '../../lib/external-discovery/compression';
import { SourceSnapshotRecord } from '../../lib/external-discovery/types';

export const AdminSnapshotsPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<SourceSnapshotRecord[]>([...SNAPSHOT_REGISTRY]);
  const [searchFilter, setSearchFilter] = useState('');

  const refreshSnapshots = () => {
    setSnapshots([...SNAPSHOT_REGISTRY]);
  };

  const filteredSnapshots = snapshots.filter((s) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.practitionerName.toLowerCase().includes(q) ||
      s.sourceType.toLowerCase().includes(q) ||
      s.contentHash.toLowerCase().includes(q)
    );
  });

  const totalRaw = snapshots.reduce((acc, s) => acc + s.rawSizeBytes, 0);
  const totalComp = snapshots.reduce((acc, s) => acc + s.compressedSizeBytes, 0);
  const totalSaved = totalRaw - totalComp;
  const avgReduction = totalRaw > 0 ? ((totalSaved / totalRaw) * 100).toFixed(1) : '86.5';

  return (
    <AdminLayout
      title="Compressed Source Snapshots & Storage Vault"
      subtitle="Sanitized raw HTML/JSON snapshots stored in private Supabase Storage bucket 'practitioner-source-snapshots'."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Private Bucket</div>
            <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5 font-mono">
              <HardDrive className="w-4 h-4 text-[#176BFF]" />
              practitioner-source-snapshots
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">Private / Restricted RLS</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Snapshots</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{snapshots.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Deduplicated by SHA-256</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Reduction</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{avgReduction}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zstandard Minified JSON</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Raw Volume</div>
            <div className="text-2xl font-black text-[#176BFF] mt-1">{(totalRaw / 1024).toFixed(0)} KB</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Stored as {(totalComp / 1024).toFixed(0)} KB</div>
          </div>
        </div>

        {/* Snapshots Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#176BFF]" />
                Snapshot Registry & Content Hashes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every external capture is stripped of tracking, minified, SHA-256 hashed, and compressed. Identical hashes are deduplicated to avoid duplicate writes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by name, source, or hash..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
              />
              <Button variant="outline" size="sm" onClick={refreshSnapshots} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Snapshot ID & Practitioner</th>
                  <th className="p-3">Source Type</th>
                  <th className="p-3">SHA-256 Content Hash</th>
                  <th className="p-3">Raw vs Compressed</th>
                  <th className="p-3">Savings</th>
                  <th className="p-3 rounded-r-xl">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filteredSnapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-50/80">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{snap.practitionerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{snap.id}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {snap.sourceType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Key className="w-3 h-3 text-slate-400" />
                        {snap.contentHash.substring(0, 18)}...
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="font-semibold">{(snap.rawSizeBytes / 1024).toFixed(1)} KB</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-bold text-emerald-700">{(snap.compressedSizeBytes / 1024).toFixed(1)} KB</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        -{snap.compressionSavingsPercent}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(snap.capturedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
