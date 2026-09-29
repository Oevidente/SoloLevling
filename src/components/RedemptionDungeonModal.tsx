import React, { useState } from 'react';
import { soundEffects } from '../services/soundEffects';
import { Shield, Sparkles, Check, X, Flame, Brain, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RedemptionDungeonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteRedemption: () => void;
}

export const RedemptionDungeonModal: React.FC<RedemptionDungeonModalProps> = ({
  isOpen,
  onClose,
  onCompleteRedemption,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<'fisico' | 'mental' | 'espiritual'>('fisico');

  if (!isOpen) return null;

  const redemptionTasks = {
    fisico: {
      title: 'O Gole da Vida & Descompressão Cervical',
      description: 'Beba 1 copo generoso de água fresca e gire os ombros para trás 5 vezes para destravar o tônus muscular.',
      duration: '60 segundos',
      icon: <Flame className="w-5 h-5 text-emerald-400" />,
      tag: 'Redenção do Pilar Físico',
      quote: 'Pequenos atos biológicos sinalizam ao cérebro que o perigo cessou.',
    },
    mental: {
      title: 'A Micro-Ordem (Eliminar 1 Ruído)',
      description: 'Guarde 1 único objeto que esteja fora do lugar na sua mesa ou feche 3 abas inúteis do navegador.',
      duration: '90 segundos',
      icon: <Brain className="w-5 h-5 text-teal-400" />,
      tag: 'Redenção do Pilar Mental',
      quote: 'Reduzir um único ponto de atrito visual diminui a sobrecarga cognitiva do TDA.',
    },
    espiritual: {
      title: 'O Respiro do Monarca (Autocompaixão)',
      description: 'Feche os olhos, inspire em 4 tempos e expire em 6 tempos por 5 ciclos. Diga a si mesmo: "Fiz o que pude hoje, e isso basta."',
      duration: '120 segundos',
      icon: <Compass className="w-5 h-5 text-green-400" />,
      tag: 'Redenção do Pilar Espiritual',
      quote: 'A culpa é o maior combustível da paralisia executiva. A autocompaixão é o combustível da retomada.',
    },
  };

  const currentTask = redemptionTasks[selectedPillar];

  const handleFinish = () => {
    soundEffects.playLevelUp();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#22c55e', '#f59e0b', '#4ade80'],
      });
    } catch {}

    onCompleteRedemption();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="system-window-danger rounded-lg max-w-lg w-full p-6 sm:p-7 relative border-2 border-rose-500/80 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* System Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded bg-rose-950/80 border border-rose-500/60 text-rose-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-rose-400 uppercase">
              [ALERTA DO SISTEMA: RESGATE ATIVADO]
            </span>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">
              Masmorra Secreta de Redenção
            </h3>
          </div>
        </div>

        {/* Narrative Context */}
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          O Sistema compreende a neurobiologia do Caçador com TDA. Dias difíceis acontecem.
          Em vez de punição destrutiva, execute <strong className="text-emerald-300 font-semibold">1 micro-passo de alívio</strong> para restaurar seu Vigor (HP/MP), manter seu Streak intacto e garantir um <strong className="text-amber-300">Baú de Suprimentos</strong>!
        </p>

        {/* Pillar Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['fisico', 'mental', 'espiritual'] as const).map((pillar) => (
            <button
              key={pillar}
              onClick={() => {
                soundEffects.playSystemBeep();
                setSelectedPillar(pillar);
              }}
              className={`p-2.5 rounded border text-xs font-semibold capitalize flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedPillar === pillar
                  ? 'bg-rose-950/60 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {redemptionTasks[pillar].icon}
              <span>{pillar}</span>
            </button>
          ))}
        </div>

        {/* Selected Task Card */}
        <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-700/80 mb-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-rose-400 font-bold uppercase">{currentTask.tag}</span>
            <span className="text-slate-400">{currentTask.duration}</span>
          </div>

          <h4 className="text-sm font-bold text-slate-100">
            {currentTask.title}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentTask.description}
          </p>

          <p className="text-[11px] text-emerald-400/90 italic pt-1 border-t border-slate-800">
            "{currentTask.quote}"
          </p>
        </div>

        {/* Recompensas da Redenção */}
        <div className="flex items-center justify-between p-3 rounded bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 mb-5">
          <span className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Recompensa de Sobrevivência:</span>
          </span>
          <span className="font-mono font-bold text-amber-300">
            +1 Baú do Sistema + Streak Salvo
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3 rounded font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 hover:from-rose-400 hover:to-emerald-300 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Completei o Micro-Passo! Resgatar Glória</span>
        </button>

      </div>
    </div>
  );
};
