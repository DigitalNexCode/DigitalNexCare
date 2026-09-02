import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../lib/pwa/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'banner' | 'compact' }> = ({
  variant = 'nav',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          title="Install DigitalNexCare PWA App"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#176BFF]/10 text-[#176BFF] hover:bg-[#176BFF]/20 font-semibold text-xs transition border border-[#176BFF]/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#176BFF] to-[#00E5D4] px-4 py-2 text-xs font-bold text-slate-900 shadow-md shadow-[#176BFF]/15 hover:opacity-95 transition active:scale-95"
      >
        <Download className="w-4 h-4 text-slate-900" />
        <span>Install NexCare App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold text-xs transition border border-slate-700"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00E5D4]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#176BFF]/20 flex items-center justify-center text-[#00E5D4]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <p className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#176BFF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> icon in the bottom Safari toolbar (or top on iPad).</span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#176BFF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <span>Scroll down the action sheet and tap <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#00E5D4] text-slate-900 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top right to access DigitalNexCare directly from your home screen.</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
