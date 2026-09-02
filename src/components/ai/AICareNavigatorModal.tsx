import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Bot,
  Stethoscope,
} from 'lucide-react';
import { AICareNavigator, CareNavigationRecommendation } from '../../lib/ai/care-navigator';

interface AICareNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICareNavigatorModal: React.FC<AICareNavigatorModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<CareNavigationRecommendation | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await AICareNavigator.navigateIntent(inputText);
      setRecommendation(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialty = (specialty: string) => {
    onClose();
    navigate(`/search?specialty=${encodeURIComponent(specialty)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#176BFF] to-[#00E5D4] flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                AI Healthcare Navigator
                <span className="px-2 py-0.5 rounded-full bg-[#00E5D4]/15 text-[#00E5D4] text-[10px] font-bold border border-[#00E5D4]/30">
                  Non-Diagnostic
                </span>
              </h2>
              <p className="text-xs text-slate-400">Describe what care you are looking for in plain language.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              How can we help direct your care today?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., 'I have persistent skin redness and acne' or 'Need a child doctor for high fever' or 'Sprained my knee in rugby'..."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:border-[#00E5D4] focus:ring-1 focus:ring-[#00E5D4] outline-none resize-none transition"
              />
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 self-center">Try:</span>
              {[
                'Persistent skin rash',
                'Wisdom tooth ache',
                'Back pain from lifting',
                'Baby developmental check',
                'Eye test and new glasses',
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setInputText(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition"
                >
                  {sample}
                </button>
              ))}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !inputText.trim()}
              className="mt-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{loading ? 'Finding Appropriate Specialty...' : 'Find Healthcare Specialty'}</span>
            </button>
          </div>

          {/* Results */}
          {recommendation && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00E5D4] uppercase tracking-wider">
                <Stethoscope className="w-4 h-4" />
                <span>Recommended Clinical Navigation</span>
              </div>

              {recommendation.matchedSpecialties.map((spec) => (
                <div key={spec.name} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-white">{spec.name}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{spec.description}</p>
                    </div>
                  </div>

                  {spec.urgencyGuidance && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                      {spec.urgencyGuidance}
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Typical Consultation Services
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {spec.recommendedServices.map((srv) => (
                        <span
                          key={srv}
                          className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleSelectSpecialty(spec.name)}
                      className="w-full py-3 rounded-xl bg-[#176BFF] hover:bg-[#176BFF]/90 text-white font-black text-xs flex items-center justify-center gap-2 shadow transition cursor-pointer"
                    >
                      <span>Search & Book {spec.name}s</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Consultation Preparation:</strong> {recommendation.consultationExpectation}
                </p>
              </div>

              {/* Constitutional Non-Diagnostic Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/90 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{recommendation.disclaimer}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
