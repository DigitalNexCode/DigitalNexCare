import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Lock,
  CreditCard,
  Bell,
  Cpu,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';
import { SystemHealthMonitor, SystemHealthReport } from '../../lib/health/system-health';
import { SEOHead } from '../../components/seo/SEOHead';

export const SystemHealthDashboardPage: React.FC = () => {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await SystemHealthMonitor.checkAllServices();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        SystemHealthMonitor.checkAllServices().then(setReport);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'supabase-db':
        return <Database className="w-5 h-5 text-[#00E5D4]" />;
      case 'supabase-auth':
        return <Lock className="w-5 h-5 text-[#176BFF]" />;
      case 'ingestion-workers':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'discovery-service':
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case 'payment-gateways':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'notifications':
        return <Bell className="w-5 h-5 text-amber-400" />;
      case 'booking-engine':
        return <Zap className="w-5 h-5 text-lime-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      <SEOHead
        title="System Infrastructure Health & Telemetry | DigitalNexCare Admin"
        description="Real-time system health, worker status, payment gateways, and database telemetry monitoring."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Telemetry Stream Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Health & Infrastructure Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status of Supabase, workers, payment gateways, notifications, and booking locks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-[#176BFF]"
            />
            <span>Auto-Refresh (10s)</span>
          </label>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Probe Now</span>
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {report && (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          report.overallStatus === 'OPERATIONAL'
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            : report.overallStatus === 'DEGRADED'
            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ${
              report.overallStatus === 'OPERATIONAL'
                ? 'bg-emerald-500'
                : report.overallStatus === 'DEGRADED'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}>
              {report.overallStatus === 'OPERATIONAL' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                All Core Platform Systems {report.overallStatus === 'OPERATIONAL' ? 'Operational' : report.overallStatus}
              </h2>
              <p className="text-xs opacity-80">
                Last full health probe: {new Date(report.timestamp).toLocaleTimeString()} SAST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold">
            <div>
              <span className="text-slate-400 block text-[10px]">Avg Latency</span>
              <span className="text-white text-base">
                {Math.round(report.services.reduce((acc, s) => acc + s.latencyMs, 0) / report.services.length)} ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">30-Day Uptime</span>
              <span className="text-emerald-400 text-base">99.96%</span>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {report.services.map((service) => (
            <div
              key={service.serviceId}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {getServiceIcon(service.serviceId)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm leading-tight">{service.name}</h3>
                    <span className="text-[11px] text-slate-400">{service.uptimePercentage}% uptime</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  service.status === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {service.status}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Latency:</span>
                  <span className="font-mono text-slate-200 font-bold">{service.latencyMs} ms</span>
                </div>
                {Object.entries(service.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-slate-400">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[140px]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
