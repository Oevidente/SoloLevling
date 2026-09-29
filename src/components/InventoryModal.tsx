import React, { useState } from 'react';
import { InventoryItem } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { Package, Award, CheckCircle2, Sparkles, Scroll, Shield, Tag, ArrowLeft } from 'lucide-react';

interface InventoryModalProps {
  inventory: InventoryItem[];
  onUseItem: (itemId: string) => void;
  onSetTitle?: (title: string) => void;
  onBackToStatus?: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  onUseItem,
  onSetTitle,
  onBackToStatus,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'buff' | 'pergaminho' | 'relic' | 'titulo'>('all');

  const rarityStyles: Record<string, { border: string; bg: string; text: string; badge: string; shadow: string }> = {
    comum: {
      border: 'border-slate-700/80',
      bg: 'bg-slate-900/60',
      text: 'text-slate-300',
      badge: 'bg-slate-800 text-slate-300 border-slate-600',
      shadow: '',
    },
    raro: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/25',
      text: 'text-emerald-300',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
      shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
    },
    epico: {
      border: 'border-purple-500/50',
      bg: 'bg-purple-950/25',
      text: 'text-purple-300',
      badge: 'bg-purple-950 text-purple-300 border-purple-500/60',
      shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
    lendario: {
      border: 'border-amber-500/60',
      bg: 'bg-amber-950/30',
      text: 'text-amber-300',
      badge: 'bg-amber-950 text-amber-300 border-amber-500/70',
      shadow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    },
  };

  const filteredInventory = inventory.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const counts = {
    all: inventory.length,
    buff: inventory.filter((i) => i.type === 'buff').length,
    pergaminho: inventory.filter((i) => i.type === 'pergaminho').length,
    relic: inventory.filter((i) => i.type === 'relic').length,
    titulo: inventory.filter((i) => i.type === 'titulo').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Header do Inventário */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-emerald-500/20 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display text-slate-100 uppercase tracking-wide">
              Inventário do Caçador
            </h2>
            <span className="text-xs font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 tabular-nums font-bold">
              {inventory.length} itens coletados
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Itens colhidos das Caixas de Suprimentos do Sistema: pergaminhos neurocientíficos, relíquias de foco e títulos de honra.
          </p>
        </div>

        {onBackToStatus && (
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              onBackToStatus();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-emerald-300 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>
        )}
      </div>

      {/* Categorias / Filtros de Inventário */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setFilterType('all');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Todos ({counts.all})</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setFilterType('buff');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'buff'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Buffs & Poções ({counts.buff})</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setFilterType('pergaminho');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'pergaminho'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scroll className="w-3.5 h-3.5" />
          <span>Pergaminhos ({counts.pergaminho})</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setFilterType('relic');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'relic'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Relíquias ({counts.relic})</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playSystemBeep();
            setFilterType('titulo');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            filterType === 'titulo'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Títulos ({counts.titulo})</span>
        </button>
      </div>

      {/* Lista de Itens */}
      {filteredInventory.length === 0 ? (
        <div className="system-window rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-300 font-semibold">
            {inventory.length === 0
              ? 'Seu inventário está vazio no momento.'
              : 'Nenhum item encontrado nesta categoria.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {inventory.length === 0
              ? 'Complete missões diárias dos 3 pilares ou acione a Masmorra de Redenção para abrir Caixas de Suprimentos do Sistema!'
              : 'Alterne a aba para visualizar os outros itens coletados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const style = rarityStyles[item.rarity] || rarityStyles.comum;
            return (
              <div
                key={item.id}
                className={`rounded-xl p-4 border transition-all space-y-3 flex flex-col justify-between ${style.border} ${style.bg} ${style.shadow}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Award className="w-3.5 h-3.5" />
                      <span>{item.type}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${style.badge}`}>
                      {item.rarity}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 leading-snug">
                    {item.name}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                  <div className="text-xs text-emerald-300 font-medium">
                    ✨ {item.effect}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.acquiredAt ? new Date(item.acquiredAt).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>

                    {item.type === 'titulo' && onSetTitle ? (
                      <button
                        onClick={() => {
                          soundEffects.playLevelUp();
                          onSetTitle(item.name.replace('Título: ', ''));
                        }}
                        className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-amber-500/20 border border-amber-400 text-amber-200 hover:bg-amber-500/35 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      >
                        Equipar Título
                      </button>
                    ) : item.isUsed ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ativado</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          soundEffects.playSystemBeep();
                          onUseItem(item.id);
                        }}
                        className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-200 hover:bg-emerald-500/35 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                      >
                        Ativar / Usar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
