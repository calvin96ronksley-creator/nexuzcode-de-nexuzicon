import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-slate-950 shadow-lg shadow-amber-500/20 border border-amber-400">
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Offline-Modus — Lokale & zwischengespeicherte Daten aktiv.</span>
    </div>
  );
};
