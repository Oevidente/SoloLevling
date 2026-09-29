import React, { useEffect, useState } from 'react';
import { ExpRewardEvent } from '../types/hunter';
import { Zap, Sparkles, X, Shield, Brain, Compass, CheckCircle2 } from 'lucide-react';

interface ExpRewardPopupProps {
  reward: ExpRewardEvent | null;
  onClose: () => void;
}

export const ExpRewardPopup: React.FC<ExpRewardPopupProps> = ({ reward, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!reward) return;

    setSecondsLeft(5);

    // Intervalo de contagem regressiva de segundos
    const countdownInterval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss após exatos 5000ms (5 segundos)
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [reward, onClose]);

  if (!reward) return null;

  const pillarDetails = {
    fisico: {
      label: 'Pilar Físico',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60',
      attr: '+1 Atributo Físico',
    },
    mental: {
      label: 'Pilar Mental',
      icon: <Brain className="w-4 h-4 text-teal-400" />,
      color: 'text-teal-400 border-teal-500/40 bg-teal-950/60',
      attr: '+1 Atributo Mental',
    },
    espiritual: {
      label: 'Pilar Espiritual',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400 border-amber-500/40 bg-amber-950/60',
      attr: '+1 Atributo Espiritual',
    },
  };

  const pillar = pillarDetails[reward.category] || pillarDetails.fisico;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <div className="system-window rounded-2xl p-4 sm:p-5 border-2 border-emerald-400/80 shadow-[0_0_35px_rgba(34,197,94,0.45)] relative overflow-hidden bg-slate-950/95 backdrop-blur-xl">
        
        {/* Subtle glowing ambient background burst */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top bar with System badge and close button */}
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              NOTIFICAÇÃO DO SISTEMA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              Auto-fecha em {secondsLeft}s
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Fechar notificação"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main XP Display & Quest Info */}
        <div className="my-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-wider uppercase block">
                  EXPERIÊNCIA ADQUIRIDA!
                </span>
                <div className="text-2xl sm:text-3xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 neon-text-green tabular-nums">
                  +{reward.xpEarned} EXP
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded-lg border ${pillar.color}`}>
                {pillar.icon}
                <span>{pillar.attr}</span>
              </span>
            </div>
          </div>

          {/* Missão Concluída Name */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-200 font-medium truncate flex-1">
              {reward.questTitle}
            </p>
          </div>
        </div>

        {/* 5-second Animated Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/20 mt-2">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-300 rounded-full animate-countdown-5s shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
        </div>

      </div>
    </div>
  );
};
