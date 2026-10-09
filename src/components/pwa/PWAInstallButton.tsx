import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        PWA Installiert
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all"
        title="NexusPix als Desktop/Mobile App installieren"
      >
        <Download className="w-3.5 h-3.5" />
        App Installieren
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/80 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          Auf iOS installieren
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-semibold text-white">Auf iPhone / iPad installieren</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-300 leading-relaxed space-y-2">
                1. Tippe auf das <strong className="text-indigo-400">Teilen-Symbol</strong> (Share) in der Safari-Symbolleiste.<br />
                2. Scrolle etwas nach unten und wähle <strong className="text-indigo-400">Zum Home-Bildschirm</strong>.<br />
                3. Bestätige mit <strong className="text-indigo-400">Hinzufügen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                Verstanden
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        // Helpful fallback notice if browser does not trigger beforeinstallprompt yet
        alert('Tipp: Du kannst NexusPix über dein Browser-Menü (Drei Punkte oder Teilen) jederzeit als PWA zum Startbildschirm hinzufügen!');
      }}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
    >
      <Download className="w-3 h-3 text-indigo-400" />
      PWA Bereit
    </button>
  );
};
