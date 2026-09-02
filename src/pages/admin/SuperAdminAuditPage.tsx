import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Activity,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Code,
  CheckCircle2,
} from 'lucide-react';

export const SuperAdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>(
    Chunk8OperationsService.getAuditLogs()
  );
  const [filterActor, setFilterActor] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const filteredLogs = logs.filter((l) => {
    if (!filterActor) return true;
    return (
      l.actorName.toLowerCase().includes(filterActor.toLowerCase()) ||
      l.action.toLowerCase().includes(filterActor.toLowerCase()) ||
      l.targetEntity.toLowerCase().includes(filterActor.toLowerCase())
    );
  });

  return (
    <AdminLayout
      title="System Audit Trail & Immutability Logs"
      subtitle="Complete chronological ledger of administrative operations, statutory reviews, and database alterations."
      isSuperAdmin
    >
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#176BFF]" />
              Immutable Audit Events ({logs.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Encrypted event ledger signed with SHA-256 integrity hashes for statutory compliance.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by actor, action or entity..."
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#176BFF]"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Actor</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Action</th>
                  <th className="py-3.5 px-4 font-bold">Target Entity</th>
                  <th className="py-3.5 px-4 font-bold">IP Address</th>
                  <th className="py-3.5 px-4 font-bold text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.actorName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-700">{log.action}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{log.targetEntity}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Code className="w-3 h-3" />}
                      >
                        Inspect Payload
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Inspection Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Audit Event Payload ({selectedLog.id})
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <strong>Action:</strong> {selectedLog.action}
                </div>
                <div>
                  <strong>Actor:</strong> {selectedLog.actorName} ({selectedLog.role})
                </div>
                <div>
                  <strong>Target Entity:</strong> {selectedLog.targetEntity}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">State Modification JSON:</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
