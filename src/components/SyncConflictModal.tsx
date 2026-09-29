import React from 'react';
import { Cloud, Smartphone, ArrowDownCircle, ArrowUpCircle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { PlayerProfile, Quest } from '../types/hunter';
import { GameSaveData } from '../services/firebase';
import { soundEffects } from '../services/soundEffects';

interface SyncConflictModalProps {
  isOpen: boolean;
  cloudData: GameSaveData | null;
  localPlayer: PlayerProfile;
  localQuests: Quest[];
  onChooseCloud: () => void;
  onChooseLocal: () => void;
  onCancel?: () => void;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  cloudData,
  localPlayer,
  localQuests,
  onChooseCloud,
  onChooseLocal,
}) => {
  if (!isOpen || !cloudData) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Data desconhecida';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const cloudPlayer = cloudData.player;
  const cloudQuests = cloudData.quests || [];
  const cloudCompletedQuests = cloudQuests.filter((q) => q.isCompleted).length;
  const localCompletedQuests = localQuests.filter((q) => q.isCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#030d06] border-2 border-emerald-500/80 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.35)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header no estilo do Sistema */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/80 via-[#041a0b] to-emerald-950/80 border-b border-emerald-500/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300">
            <ShieldAlert className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                SISTEMA: SINCRONIZAÇÃO DETECTADA
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-display font-black text-slate-100 uppercase tracking-wide mt-0.5">
              Escolha a Origem dos Dados
            </h2>
          </div>
        </div>

        {/* Corpo com explicação e cards comparativos */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4">
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            Identificamos dados salvos na sua conta <strong className="text-emerald-300">Google / Nuvem</strong> e também dados locais neste <strong className="text-emerald-300">Aparelho</strong>. Escolha como deseja sincronizar:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            
            {/* CARD 1: NUVEM */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gradient-to-b from-[#021307] to-[#010a04] border-2 border-emerald-500/60 hover:border-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-black font-display tracking-wider text-emerald-300 uppercase">
                      Salvo na Nuvem
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/40">
                    Remoto
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Caçador:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[140px]">{cloudPlayer.name || 'Caçador'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Rank & Nível:</span>
                    <span className="font-mono font-black text-emerald-400">
                      Rank {cloudPlayer.hunterRank || 'E'} • Nv. {cloudPlayer.level || 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">EXP Acumulada:</span>
                    <span className="font-mono text-slate-200">
                      {cloudPlayer.currentXp} / {cloudPlayer.nextLevelXp} XP
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Missões:</span>
                    <span className="font-mono text-slate-200">
                      {cloudQuests.length} total ({cloudCompletedQuests} feitas)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500">Último Sync:</span>
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]">
                      {formatDate(cloudData.updatedAt || cloudPlayer.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEffects.playQuestComplete();
                  onChooseCloud();
                }}
                className="w-full mt-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <ArrowDownCircle className="w-4 h-4 text-slate-950" />
                <span>Baixar da Nuvem</span>
              </button>
            </div>

            {/* CARD 2: ESTE DISPOSITIVO */}
            <div className="flex flex-col justify-between p-4 rounded-xl bg-gradient-to-b from-[#0b1016] to-[#040608] border-2 border-sky-500/50 hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(14,165,233,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
              
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-sky-500/20">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-black font-display tracking-wider text-sky-300 uppercase">
                      Este Dispositivo
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/90 px-2 py-0.5 rounded border border-sky-500/40">
                    Local
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Caçador:</span>
                    <span className="font-bold text-slate-100 truncate max-w-[140px]">{localPlayer.name || 'Caçador Local'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Rank & Nível:</span>
                    <span className="font-mono font-black text-sky-400">
                      Rank {localPlayer.hunterRank || 'E'} • Nv. {localPlayer.level || 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">EXP Acumulada:</span>
                    <span className="font-mono text-slate-200">
                      {localPlayer.currentXp} / {localPlayer.nextLevelXp} XP
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Missões:</span>
                    <span className="font-mono text-slate-200">
                      {localQuests.length} total ({localCompletedQuests} feitas)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/80">
                    <span className="text-slate-500">Última Ação:</span>
                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]">
                      {formatDate(localPlayer.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEffects.playLevelUp();
                  onChooseLocal();
                }}
                className="w-full mt-2 py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <ArrowUpCircle className="w-4 h-4 text-slate-950" />
                <span>Manter Dados Locais</span>
              </button>
            </div>

          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-tight">
              <strong>Nota:</strong> Se você escolher <em>Manter Dados Locais</em>, eles serão imediatamente enviados para a nuvem substituindo o save anterior. As alterações futuras serão sincronizadas de forma automática e silenciosa.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
