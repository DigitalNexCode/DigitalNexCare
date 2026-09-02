import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Database,
  Plus,
  HardDrive,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { NationalIngestionEngine } from '../../lib/external-discovery/ingestion-engine';
import { SA_PROVINCES } from '../../lib/constants';
import { SouthAfricanProvince } from '../../lib/supabase/database.types';
import { IngestionJobRecord } from '../../lib/external-discovery/types';

export const AdminIngestionJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<IngestionJobRecord[]>(NationalIngestionEngine.getJobs());
  const [metrics, setMetrics] = useState(NationalIngestionEngine.getTelemetryMetrics());
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<SouthAfricanProvince>('Gauteng');
  const [targetCity, setTargetCity] = useState('');
  const [targetSpecialty, setTargetSpecialty] = useState('General Practitioner (GP)');
  const [jobName, setJobName] = useState('');
  const [totalBatches, setTotalBatches] = useState(10);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const refreshData = () => {
    setJobs(NationalIngestionEngine.getJobs());
    setMetrics(NationalIngestionEngine.getTelemetryMetrics());
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = jobName.trim() || `${selectedProvince} ${targetSpecialty} Coverage Expansion`;
    NationalIngestionEngine.createJob({
      name: finalName,
      province: selectedProvince,
      city: targetCity.trim() || undefined,
      specialty: targetSpecialty,
      totalBatches,
    });
    setIsCreatingJob(false);
    setJobName('');
    setTargetCity('');
    refreshData();
  };

  const handleRunJob = async (jobId: string) => {
    setRunningJobId(jobId);
    try {
      await NationalIngestionEngine.runJob(jobId);
      refreshData();
    } finally {
      setRunningJobId(null);
    }
  };

  const handlePauseJob = (jobId: string) => {
    NationalIngestionEngine.pauseJob(jobId);
    refreshData();
  };

  return (
    <AdminLayout
      title="Background Practitioner Ingestion Pipelines"
      subtitle="Orchestrate controlled batch discovery workers by province, city, and healthcare category."
    >
      <div className="space-y-6">
        {/* Telemetry Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Indexed (SA)</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalIndexed}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{metrics.joinedCount} Joined • {metrics.externalCount} External</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created from Ingestion</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">+{metrics.totalCreated}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{metrics.totalUpdated} safe updates</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Storage Savings (Zstandard)</div>
            <div className="text-2xl font-black text-[#176BFF] mt-1">{metrics.overallSavingsPercent}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{metrics.compressionSavingsMB} MB saved</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Ingestion Jobs</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.runningJobs} Running</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{jobs.length} total pipelines</div>
          </div>
        </div>

        {/* Ingestion Queue Management */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Database className="w-4 h-4 text-[#176BFF]" />
                National Ingestion Queue & Job Controller
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute controlled background ingestion jobs across all 9 provinces with checkpointing and deduplication.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingJob(!isCreatingJob)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                {isCreatingJob ? 'Cancel' : 'Create Ingestion Pipeline'}
              </Button>
            </div>
          </div>

          {/* New Job Form */}
          {isCreatingJob && (
            <form onSubmit={handleCreateJob} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure New Ingestion Pipeline</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Target Province</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value as SouthAfricanProvince)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {SA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">City / Town (Optional)</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    placeholder="e.g. Pretoria, Nelspruit, Kimberley"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Healthcare Specialty</label>
                  <input
                    type="text"
                    value={targetSpecialty}
                    onChange={(e) => setTargetSpecialty(e.target.value)}
                    placeholder="e.g. Dentist, Paediatrician"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Total Batches</label>
                  <input
                    type="number"
                    value={totalBatches}
                    onChange={(e) => setTotalBatches(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button variant="primary" size="sm" type="submit" leftIcon={<Play className="w-3.5 h-3.5" />}>
                  Queue & Initialize Pipeline
                </Button>
              </div>
            </form>
          )}

          {/* Jobs List */}
          <div className="space-y-3">
            {jobs.map((job) => {
              const progressPercent = job.totalBatches > 0 ? Math.round((job.currentBatch / job.totalBatches) * 100) : 0;
              const isRunning = runningJobId === job.id || job.status === 'RUNNING';

              return (
                <div key={job.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{job.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 font-bold">({job.id})</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          job.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' :
                          job.status === 'SOURCE_BLOCKED' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Province: <strong className="text-slate-700">{job.targetProvince}</strong></span>
                        {job.targetCity && <span>City: <strong className="text-slate-700">{job.targetCity}</strong></span>}
                        {job.targetSpecialty && <span>Specialty: <strong className="text-slate-700">{job.targetSpecialty}</strong></span>}
                        <span>Batches: <strong className="text-slate-700">{job.currentBatch}/{job.totalBatches}</strong></span>
                        <span>Found: <strong className="text-slate-700">{job.recordsFound}</strong> (+{job.recordsCreated} new)</span>
                        {job.checkpoint && <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{job.checkpoint}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'RUNNING' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseJob(job.id)}
                          leftIcon={<Pause className="w-3 h-3" />}
                        >
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRunJob(job.id)}
                          isLoading={isRunning}
                          leftIcon={<Play className="w-3 h-3" />}
                        >
                          {job.status === 'COMPLETED' ? 'Re-run' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Batch Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        job.status === 'COMPLETED' ? 'bg-emerald-500' :
                        job.status === 'SOURCE_BLOCKED' ? 'bg-rose-500' :
                        'bg-[#176BFF]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
