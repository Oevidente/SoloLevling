import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#090303]/95 border border-rose-500/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.35)] text-xs font-mono backdrop-blur-md animate-pulse"
    >
      <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
      <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
      <div className="flex flex-col">
        <span className="font-bold tracking-wider text-[11px] text-rose-200 uppercase">
          MODO OFFLINE ATIVADO
        </span>
        <span className="text-[10px] text-rose-400/80">
          Progresso e hábitos gravados em cache local
        </span>
      </div>
    </div>
  );
};
