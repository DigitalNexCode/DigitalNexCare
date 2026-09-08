import React from 'react';
import { Sparkles, Radio, CheckCircle2, Clock, MapPin, Database, Loader2, ArrowRight } from 'lucide-react';
import { LiveSearchStatus } from '../../lib/location/types';

interface LiveSearchStreamerBannerProps {
  isStreaming: boolean;
  status: LiveSearchStatus;
  statusMessage: string;
  streamedCount: number;
  areaName?: string;
  metrics?: {
    timeToFirstDbResultMs?: number | null;
    timeToFirstExternalResultMs?: number | null;
    numberStreamed?: number;
  };
  onCancel?: () => void;
}

export const LiveSearchStreamerBanner: React.FC<LiveSearchStreamerBannerProps> = ({
  isStreaming,
  status,
  statusMessage,
  streamedCount,
  areaName,
  metrics,
  onCancel,
}) => {
  if (!isStreaming && status !== 'STREAMING_RESULTS' && status !== 'EXTERNAL_DISCOVERY_STARTED' && status !== 'SEARCHING_DATABASE') {
    return null;
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white shadow-lg border border-blue-500/30 overflow-hidden relative animate-fadeIn">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#176BFF]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00E5D4]/15 rounded-full blur-3xl pointer-events-none -mb-20" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
            {status === 'STREAMING_RESULTS' ? (
              <Radio className="w-5 h-5 text-[#00E5D4] animate-pulse" />
            ) : status === 'EXTERNAL_DISCOVERY_STARTED' ? (
              <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
            ) : (
              <Database className="w-5 h-5 text-[#176BFF] animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00E5D4] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00E5D4] animate-ping" />
                Live Practitioner Discovery Engine
              </span>
              {areaName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white/90 text-[11px] font-medium border border-white/10">
                  <MapPin className="w-3 h-3 text-cyan-300" />
                  {areaName}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-white/95 mt-1 leading-snug">
              {statusMessage || 'Scanning National Practitioner Index and South African public registers...'}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-blue-200/80 flex-wrap">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>{streamedCount} practitioner{streamedCount === 1 ? '' : 's'} streamed live</span>
              </span>

              {metrics?.timeToFirstDbResultMs !== undefined && metrics.timeToFirstDbResultMs !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>DB latency: {metrics.timeToFirstDbResultMs}ms</span>
                </span>
              )}

              {metrics?.timeToFirstExternalResultMs !== undefined && metrics.timeToFirstExternalResultMs !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>1st external stream: {metrics.timeToFirstExternalResultMs}ms</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold transition border border-white/15"
            >
              Stop Live Discovery
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
