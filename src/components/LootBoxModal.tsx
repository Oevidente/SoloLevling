import React, { useState } from 'react';
import { InventoryItem } from '../types/hunter';
import { getRandomLoot } from '../data/lootTable';
import { soundEffects } from '../services/soundEffects';
import { Gift, Sparkles, X, Award, Check, Package } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LootBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimItem: (item: InventoryItem) => void;
  availableBoxes: number;
  onOpenInventory?: () => void;
}

export const LootBoxModal: React.FC<LootBoxModalProps> = ({
  isOpen,
  onClose,
  onClaimItem,
  availableBoxes,
  onOpenInventory,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [droppedItem, setDroppedItem] = useState<InventoryItem | null>(null);

  if (!isOpen) return null;

  const handleOpenBox = () => {
    setIsOpening(true);
    soundEffects.playLootOpen();

    setTimeout(() => {
      const rawLoot = getRandomLoot();
      const newItem: InventoryItem = {
        ...rawLoot,
        id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        acquiredAt: new Date().toISOString(),
      };

      setDroppedItem(newItem);
      setIsOpening(false);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#22c55e', '#a855f7', '#4ade80'],
        });
      } catch {}
    }, 1100);
  };

  const handleClaim = (goToInventory = false) => {
    if (droppedItem) {
      soundEffects.playSystemBeep();
      onClaimItem(droppedItem);
      setDroppedItem(null);
      if (goToInventory && onOpenInventory) {
        onClose();
        onOpenInventory();
      } else if (availableBoxes <= 1) {
        onClose();
      }
    }
  };

  const rarityBorders: Record<string, string> = {
    comum: 'border-slate-500 bg-slate-900/60 text-slate-300',
    raro: 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.35)]',
    epico: 'border-purple-400 bg-purple-950/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    lendario: 'border-amber-400 bg-amber-950/40 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)]',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="system-window-gold rounded-xl max-w-md w-full p-6 sm:p-7 relative border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] text-center animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="px-3 py-1 rounded bg-amber-950/80 border border-amber-400 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-3 inline-block">
          RECOMPENSA DO SISTEMA
        </span>

        <h3 className="text-xl font-bold font-display text-amber-100 tracking-wide mb-2 uppercase">
          Caixa de Suprimentos do Sistema
        </h3>

        {!droppedItem ? (
          <div className="py-6 space-y-6">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 via-cyan-500/10 to-amber-950/40 border-2 border-amber-400/80 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce">
                <Gift className="w-12 h-12 text-amber-300" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin" />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              Baús contêm buffs saudáveis, autorizações de descanso sem culpa, escudos de streak ou títulos de prestígio!
            </p>

            <button
              onClick={handleOpenBox}
              disabled={isOpening}
              className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer disabled:opacity-50"
            >
              {isOpening ? 'Abrindo Caixa do Sistema...' : `Abrir Caixa de Suprimentos (${availableBoxes})`}
            </button>
          </div>
        ) : (
          <div className="py-5 space-y-4 animate-in zoom-in-90 fade-in duration-300">
            <div className={`p-4 sm:p-5 rounded-lg border-2 text-left space-y-2.5 ${rarityBorders[droppedItem.rarity] || rarityBorders.comum}`}>
              <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{droppedItem.type}</span>
                </span>
                <span className="tracking-widest">Raridade: {droppedItem.rarity}</span>
              </div>

              <h4 className="text-base font-bold text-slate-100">
                {droppedItem.name}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {droppedItem.description}
              </p>

              <div className="pt-2 border-t border-slate-700/50 text-xs font-semibold text-emerald-300">
                ✨ Efeito: {droppedItem.effect}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleClaim(false)}
                className="flex-1 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar</span>
              </button>

              {onOpenInventory && (
                <button
                  onClick={() => handleClaim(true)}
                  className="py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-400/60 hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Abrir Inventário</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
