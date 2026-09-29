import React from 'react';
import { LayoutDashboard, Package, Plus, Share2, Shield } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface MobileBottomNavProps {
  currentTab: 'status' | 'inventory';
  setCurrentTab: (tab: 'status' | 'inventory') => void;
  openRedemption: () => void;
  openCycleReport: () => void;
  onOpenNewQuest: () => void;
  inventoryCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  openRedemption,
  openCycleReport,
  onOpenNewQuest,
  inventoryCount = 0,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020804]/95 backdrop-blur-xl border-t border-emerald-500/25 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] shadow-[0_-10px_25px_rgba(0,0,0,0.7)] touch-manipulation select-none"
      aria-label="Navegação Principal Mobile"
    >
      <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto relative">
        
        {/* Tab 1: Status / Painel da Tríade */}
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setCurrentTab('status');
          }}
          className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-all rounded-lg cursor-pointer ${
            currentTab === 'status'
              ? 'text-emerald-300'
              : 'text-slate-400 hover:text-slate-200 active:text-emerald-400'
          }`}
          aria-label="Aba de Status"
          aria-current={currentTab === 'status' ? 'page' : undefined}
        >
          <div className="relative">
            <LayoutDashboard
              className={`w-5 h-5 transition-transform ${
                currentTab === 'status' ? 'scale-110 text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : ''
              }`}
            />
            {currentTab === 'status' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(34,197,94,1)]" />
            )}
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${
              currentTab === 'status' ? 'text-emerald-300 font-bold' : 'text-slate-400'
            }`}
          >
            Status
          </span>
        </button>

        {/* Tab 2: Inventário */}
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setCurrentTab('inventory');
          }}
          className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-all rounded-lg cursor-pointer ${
            currentTab === 'inventory'
              ? 'text-amber-300'
              : 'text-slate-400 hover:text-slate-200 active:text-amber-400'
          }`}
          aria-label="Aba de Inventário"
          aria-current={currentTab === 'inventory' ? 'page' : undefined}
        >
          <div className="relative">
            <Package
              className={`w-5 h-5 transition-transform ${
                currentTab === 'inventory' ? 'scale-110 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''
              }`}
            />
            {inventoryCount > 0 && (
              <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.8)] tabular-nums">
                {inventoryCount}
              </span>
            )}
            {currentTab === 'inventory' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(245,158,11,1)]" />
            )}
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${
              currentTab === 'inventory' ? 'text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            Inventário
          </span>
        </button>

        {/* Botão Central: Criar Nova Missão (Quick Thumb Action) */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              onOpenNewQuest();
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)] border-2 border-emerald-300/80 active:scale-90 hover:scale-105 transition-all cursor-pointer"
            title="Criar Nova Missão do Sistema"
            aria-label="Criar Nova Missão"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase mt-1">
            + Missão
          </span>
        </div>

        {/* Tab 4: Relatório do Ciclo */}
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            openCycleReport();
          }}
          className="flex flex-col items-center justify-center w-full min-h-[48px] py-1 text-slate-400 hover:text-emerald-300 active:text-emerald-400 transition-all rounded-lg cursor-pointer"
          aria-label="Abrir Relatório do Ciclo"
        >
          <div className="relative">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase mt-1">
            Relatório
          </span>
        </button>

        {/* Tab 5: Redenção */}
        <button
          onClick={() => {
            soundEffects.playAlertNotice();
            openRedemption();
          }}
          className="flex flex-col items-center justify-center w-full min-h-[48px] py-1 text-rose-400/90 hover:text-rose-300 active:text-rose-200 transition-all rounded-lg cursor-pointer"
          aria-label="Dungeon de Redenção"
        >
          <div className="relative">
            <Shield className="w-5 h-5 text-rose-400" />
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase mt-1 text-rose-400">
            Redenção
          </span>
        </button>

      </div>
    </nav>
  );
};
