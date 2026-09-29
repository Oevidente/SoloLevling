import React from 'react';
import { PlayerProfile } from '../types/hunter';
import { Sparkles, Trophy, ArrowRight, X, ShieldAlert, Zap, Gift } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

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
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-lg flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background Rotating Sunburst / Divine Light Rays */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[800px] h-[800px] sm:w-[1200px] sm:h-[1200px] opacity-25 animate-spin-rays origin-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-400">
            {Array.from({ length: 18 }).map((_, i) => (
              <polygon
                key={i}
                points="50,50 47,0 53,0"
                transform={`rotate(${i * 20} 50 50)`}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Expanding Holographic Shockwave Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-amber-400/60 animate-shockwave" />
        <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-yellow-300/40 animate-shockwave [animation-delay:0.7s]" />
      </div>

      {/* Floating Light Sparks (Solo Leveling awakening motes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { left: '15%', delay: '0s', size: 'w-2 h-2', bg: 'bg-amber-300' },
          { left: '30%', delay: '0.8s', size: 'w-3 h-3', bg: 'bg-yellow-400' },
          { left: '45%', delay: '1.5s', size: 'w-1.5 h-1.5', bg: 'bg-amber-200' },
          { left: '60%', delay: '0.3s', size: 'w-2.5 h-2.5', bg: 'bg-emerald-300' },
          { left: '75%', delay: '1.1s', size: 'w-2 h-2', bg: 'bg-amber-400' },
          { left: '85%', delay: '1.9s', size: 'w-3 h-3', bg: 'bg-yellow-200' },
        ].map((particle, i) => (
          <div
            key={i}
            className={`absolute bottom-0 rounded-full blur-[1px] particle-rise ${particle.size} ${particle.bg}`}
            style={{ left: particle.left, animationDelay: particle.delay }}
          />
        ))}
      </div>

      {/* Main Level Up Holographic Card */}
      <div className="system-window-gold rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center relative border-2 border-amber-400/90 shadow-[0_0_60px_rgba(245,158,11,0.6)] animate-in zoom-in-90 fade-in duration-300 z-10 bg-slate-950/95 backdrop-blur-xl">
        
        {/* Close button */}
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-amber-200 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* System Notification Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-400/80 text-amber-300 text-[11px] font-mono font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>SISTEMA: DESPERTAR DE NÍVEL</span>
        </div>

        {/* Epic Title with Glowing Pulse */}
        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 neon-text-gold uppercase my-1">
          VOCÊ SUBIU DE NÍVEL!
        </h2>

        <p className="text-xs sm:text-sm text-amber-200/90 font-mono tracking-wide mb-6 max-w-md mx-auto">
          O Sistema reconhece seu esforço. Sua capacidade neural e física foram expandidas.
        </p>

        {/* Level Transition Graphic Badge */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-950/90 to-slate-900/90 border-2 border-amber-500/50 mb-6 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <div className="text-center">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono font-bold block uppercase tracking-wider">
                NÍVEL ANTERIOR
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-500 tabular-nums">
                LV. {previousLevel}
              </span>
            </div>

            <div className="p-3 rounded-full bg-amber-500/20 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <ArrowRight className="w-6 h-6 text-amber-300 animate-pulse stroke-[3]" />
            </div>

            <div className="text-center animate-levelup-badge">
              <span className="text-[10px] sm:text-[11px] text-amber-400 font-mono font-bold block uppercase tracking-wider">
                NOVO NÍVEL
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 neon-text-gold tabular-nums">
                LV. {player.level}
              </span>
            </div>
          </div>

          {/* Hunter Rank status indicator */}
          <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-mono">RANK ATUAL:</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.6)]">
              {player.hunterRank}
            </span>
          </div>
        </div>

        {/* Recompensas da Subida de Nível */}
        <div className="space-y-2.5 mb-6 text-left text-xs font-mono">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 text-slate-200">
            <span className="flex items-center gap-2 font-sans font-medium">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Pontos de Atributo Concedidos:</span>
            </span>
            <span className="font-bold text-amber-300 text-sm tabular-nums">+3 Pontos</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-slate-200">
            <span className="flex items-center gap-2 font-sans font-medium">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Restauração Vital Completa:</span>
            </span>
            <span className="font-bold text-emerald-300 text-sm">100% HP & MP</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-teal-500/30 text-slate-200">
            <span className="flex items-center gap-2 font-sans font-medium">
              <Gift className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Baú de Suprimentos Conquistado:</span>
            </span>
            <span className="font-bold text-teal-300 text-sm tabular-nums">+1 Caixa</span>
          </div>
        </div>

        {/* Confirm Button with glowing aura */}
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            onClose();
          }}
          className="w-full py-3.5 rounded-xl font-black font-display text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-[0_0_30px_rgba(245,158,11,0.6)] cursor-pointer active:scale-[0.98]"
        >
          ACEITAR RECOMPENSA & CONTINUAR
        </button>

      </div>
    </div>
  );
};
