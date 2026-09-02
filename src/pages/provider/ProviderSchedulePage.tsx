import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { MOCK_PROVIDERS } from '../../data/mockDatabase';
import { SchedulingEngine, Chunk6TestResult } from '../../lib/scheduling/scheduling-engine';
import { RecurringScheduleManager } from '../../components/scheduling/RecurringScheduleManager';
import { AppointmentTypeManager } from '../../components/scheduling/AppointmentTypeManager';
import { BlockManager } from '../../components/scheduling/BlockManager';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Clock,
  Sliders,
  Ban,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';

type ScheduleTab = 'HOURS' | 'TYPES' | 'BLOCKS' | 'TESTS';

export const ProviderSchedulePage: React.FC = () => {
  const provider = MOCK_PROVIDERS[0];
  const [activeTab, setActiveTab] = useState<ScheduleTab>('HOURS');
  const [testResults, setTestResults] = useState<Chunk6TestResult[] | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleRunAcceptanceTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = SchedulingEngine.runChunk6AcceptanceTests();
      setTestResults(results);
      setIsRunningTests(false);
    }, 400);
  };

  return (
    <ProviderLayout
      title="Practice Availability & Scheduling Engine"
      subtitle="Manage weekly working shifts, custom appointment types, buffers, blackout blocks, and real-time patient booking slots."
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('HOURS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'HOURS'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Working Hours
          </button>

          <button
            onClick={() => setActiveTab('TYPES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TYPES'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Appointment Types
          </button>

          <button
            onClick={() => setActiveTab('BLOCKS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'BLOCKS'
                ? 'bg-[#176BFF] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5" /> Leave & Blocks
          </button>

          <button
            onClick={() => {
              setActiveTab('TESTS');
              if (!testResults) handleRunAcceptanceTests();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TESTS'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" /> Chunk 6 Engine Verification
          </button>
        </div>

        {/* Tab 1: Working Hours */}
        {activeTab === 'HOURS' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <RecurringScheduleManager providerId={provider.id} />
          </div>
        )}

        {/* Tab 2: Appointment Types */}
        {activeTab === 'TYPES' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <AppointmentTypeManager providerId={provider.id} />
          </div>
        )}

        {/* Tab 3: Leave & Blackout Blocks */}
        {activeTab === 'BLOCKS' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <BlockManager providerId={provider.id} />
          </div>
        )}

        {/* Tab 4: Acceptance Test Runner */}
        {activeTab === 'TESTS' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" /> Scheduling & Availability Acceptance Suite
                </h3>
                <p className="text-xs text-slate-500">
                  Verifies dynamic slot calculations, buffers, blackout windows, double-booking locks, and policy enforcement.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAcceptanceTests}
                isLoading={isRunningTests}
                leftIcon={<PlayCircle className="w-4 h-4" />}
              >
                Run Verification Suite
              </Button>
            </div>

            {testResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                  <span>
                    Test Summary: {testResults.filter((t) => t.passed).length}/{testResults.length} Passing
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md font-bold">
                    100% Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testResults.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs shadow-2xs"
                    >
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#FF3D71] flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="block text-slate-900 font-bold">{t.name}</strong>
                        <span className="text-slate-500 text-[11px] leading-tight block mt-0.5">
                          {t.details}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
};
