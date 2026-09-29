import React from 'react';
import { PlayerProfile } from '../types/hunter';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  previousLevel: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  player,
  previousLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="system-window-gold rounded-lg max-w-md w-full p-6 sm:p-8 text-center relative border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-in zoom-in-90 fade-in duration-300">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* System Notification Tag */}
        <span className="px-3 py-1 rounded bg-amber-950/80 border border-amber-400 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-3 inline-block">
          NOTIFICAÇÃO DO SISTEMA
        </span>

        {/* Epic Title */}
        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 neon-text-gold uppercase my-2">
          VOCÊ SUBIU DE NÍVEL!
        </h2>

        <p className="text-xs text-amber-200/80 font-mono tracking-wide mb-6">
          Seu corpo e mente se reestruturam. Sua persistência superou os limites do cansaço.
        </p>

        {/* Level Transition Graphic */}
        <div className="flex items-center justify-center gap-6 p-4 rounded-lg bg-slate-950/80 border border-amber-500/40 mb-6">
          <div>
            <span className="text-[11px] text-slate-400 font-mono block">NÍVEL ANTERIOR</span>
            <span className="text-2xl font-black font-mono text-slate-400 tabular-nums">
              {previousLevel}
            </span>
          </div>

          <ArrowRight className="w-6 h-6 text-amber-400 animate-pulse" />

          <div>
            <span className="text-[11px] text-amber-400 font-mono block">NOVO NÍVEL</span>
            <span className="text-3xl font-black font-mono text-amber-300 neon-text-gold tabular-nums">
              {player.level}
            </span>
          </div>
        </div>

        {/* Recompensas da Subida */}
        <div className="space-y-2 mb-6 text-left p-3.5 rounded bg-slate-900/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pontos de Atributo Concedidos:</span>
            </span>
            <span className="font-mono font-bold text-amber-300">+3 Pts</span>
          </div>

          <div className="flex items-center justify-between text-slate-200">
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Recuperação Vital:</span>
            </span>
            <span className="font-mono font-bold text-emerald-300">100% HP & MP</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
        >
          Aceitar Recompensa & Continuar
        </button>

      </div>
    </div>
  );
};
