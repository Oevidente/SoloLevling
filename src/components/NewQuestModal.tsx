import React, { useState, useEffect } from 'react';
import { PillarType, Quest } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { Plus, X, Shield, Zap, Sparkles } from 'lucide-react';

interface NewQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuest: (quest: Omit<Quest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  initialCategory?: PillarType;
}

export const NewQuestModal: React.FC<NewQuestModalProps> = ({
  isOpen,
  onClose,
  onAddQuest,
  initialCategory = 'fisico',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PillarType>(initialCategory);
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [xpReward, setXpReward] = useState(500);
  const [microStepTip, setMicroStepTip] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEffects.playSystemBeep();
    onAddQuest({
      title: title.trim(),
      description: description.trim(),
      category,
      estimatedMinutes: Number(estimatedMinutes) || 10,
      xpReward: Number(xpReward) || 300,
      statReward: category,
      isCompleted: false,
      microStepTip: microStepTip.trim() || 'Quebre em um micro-passo de 2 minutos para iniciar sem resistência.',
      isDailyMandatory: false,
    });

    setTitle('');
    setDescription('');
    setMicroStepTip('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="system-window rounded-2xl max-w-lg w-full p-6 sm:p-7 relative border-2 border-emerald-400/80 shadow-[0_0_35px_rgba(34,197,94,0.3)] animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <span className="px-3 py-1 rounded bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase mb-3 inline-block shadow-[0_0_10px_rgba(34,197,94,0.2)]">
          SISTEMA DE EVOLUÇÃO · NOVA MISSÃO
        </span>

        <h3 className="text-xl font-bold font-display text-slate-100 tracking-wide mb-1 uppercase">
          Registrar Missão do Caçador
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Cadastre uma meta diária conectada a um dos 3 pilares vitais.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Título da Missão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Estudo de Arquitetura / Stack MV Sistemas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 text-slate-100 text-sm px-3.5 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Descrição / Objetivo
            </label>
            <input
              type="text"
              placeholder="Ex: Manter a espada afiada para o primeiro dia de trabalho."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 text-slate-100 text-sm px-3.5 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>

          {/* Seleção do Pilar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Pilar da Tríade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSystemBeep();
                  setCategory('fisico');
                }}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'fisico'
                    ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Físico</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSystemBeep();
                  setCategory('mental');
                }}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'mental'
                    ? 'bg-teal-950/60 border-teal-400 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.3)]'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4 text-teal-400" />
                <span>Mental</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSystemBeep();
                  setCategory('espiritual');
                }}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === 'espiritual'
                    ? 'bg-amber-950/60 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Espiritual</span>
              </button>
            </div>
          </div>

          {/* Duração & XP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Tempo (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 text-slate-100 text-sm px-3.5 py-2.5 rounded-lg outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Recompensa XP
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 text-slate-100 text-sm px-3.5 py-2.5 rounded-lg outline-none font-mono"
              />
            </div>
          </div>

          {/* Dica Anti-Inércia para TDA */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dica Anti-Inércia TDA (Micro-Ignição)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Abrir apenas 1 arquivo para vencer o primeiro minuto de atrito"
              value={microStepTip}
              onChange={(e) => setMicroStepTip(e.target.value)}
              className="w-full bg-slate-950/90 border border-amber-500/40 focus:border-amber-400 text-slate-100 text-sm px-3.5 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 hover:from-emerald-300 hover:to-green-200 transition-all shadow-[0_0_20px_rgba(34,197,94,0.45)] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar ao Painel</span>
          </button>

        </form>

      </div>
    </div>
  );
};
