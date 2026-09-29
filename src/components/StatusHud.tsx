import React, { useState } from 'react';
import { PlayerProfile, Quest, PillarType } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { Shield, Zap, Sparkles, Check, RefreshCw, Plus, Trash2, Clock, RotateCcw, Share2, Lock, Pencil, AlertTriangle, X } from 'lucide-react';

interface StatusHudProps {
  player: PlayerProfile;
  quests: Quest[];
  onToggleQuest: (questId: string) => void;
  onDeleteQuest: (questId: string) => void;
  onEditQuest: (quest: Quest) => void;
  onOpenNewQuestModal: (category?: PillarType) => void;
  onRenewDay: () => void;
  onChangeName: (newName: string) => void;
  onChangeTitle: (newTitle: string) => void;
  onOpenLootBox: () => void;
  onOpenCycleReport: () => void;
}

export const StatusHud: React.FC<StatusHudProps> = ({
  player,
  quests,
  onToggleQuest,
  onDeleteQuest,
  onEditQuest,
  onOpenNewQuestModal,
  onRenewDay,
  onChangeName,
  onChangeTitle,
  onOpenLootBox,
  onOpenCycleReport,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.name);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(player.hunterTitle);

  // Timer de Hiperfoco TDA
  const [timerMinutes, setTimerMinutes] = useState(20);
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Toast / feedback de missão travada
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Confirmação de exclusão
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      soundEffects.playLevelUp();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onChangeName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onChangeTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleQuestClick = (quest: Quest) => {
    if (quest.isCompleted) {
      soundEffects.playAlertNotice();
      setLockedNotice(`“${quest.title}” já foi cumprida neste ciclo diário! A recompensa já foi contabilizada.`);
      setTimeout(() => setLockedNotice(null), 3500);
      return;
    }
    onToggleQuest(quest.id);
  };

  const confirmDelete = () => {
    if (questToDelete) {
      soundEffects.playSystemBeep();
      onDeleteQuest(questToDelete.id);
      setQuestToDelete(null);
    }
  };

  const xpPercent = Math.min(100, Math.round((player.currentXp / player.nextLevelXp) * 100));

  const fisicoQuests = quests.filter((q) => q.category === 'fisico');
  const mentalQuests = quests.filter((q) => q.category === 'mental');
  const espiritualQuests = quests.filter((q) => q.category === 'espiritual');

  const pendingFisico = fisicoQuests.filter((q) => !q.isCompleted).length;
  const pendingMental = mentalQuests.filter((q) => !q.isCompleted).length;
  const pendingEspiritual = espiritualQuests.filter((q) => !q.isCompleted).length;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      
      {/* Moldura Principal de Status com Cantoneiras Holográficas */}
      <div className="system-window rounded-2xl p-4 sm:p-7 space-y-5 relative">
        
        {/* Top Header: Tag, Título, Nível, Botão Relatório e Botão Renovar Dia */}
        <div className="space-y-4 pb-2">
          <div>
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-emerald-400 block mb-1 uppercase">
              [ SISTEMA DE EVOLUÇÃO: TRÍADE BALANCEADA ]
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-widest text-slate-100 uppercase">
              PAINEL DE STATUS
            </h1>
          </div>

          {/* Linha de Nível Atual e Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 tracking-widest block uppercase">
                NÍVEL ATUAL
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 neon-text-green font-display tracking-wide">
                LV. {player.level}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  soundEffects.playSystemBeep();
                  onOpenCycleReport();
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.45)] border border-emerald-300/80 transition-all cursor-pointer"
                title="Ver Relatório Diário de Conquistas"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Relatório do Ciclo (Print)</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playLevelUp();
                  onRenewDay();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-400 font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                title="Renovar ciclo diário e resetar missões para um novo dia"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renovar Dia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 1: JOGADOR */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 relative space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              JOGADOR
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 uppercase tracking-widest">
                RANK {player.hunterRank}
              </span>
            </div>
          </div>

          {/* Nome Editável */}
          <div className="flex items-center justify-between gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="bg-slate-900 border border-emerald-500 text-slate-100 px-2.5 py-1 text-base rounded outline-none w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 text-xs font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-display tracking-wide">
                  {player.name}
                </h2>
                <button
                  onClick={() => {
                    setNameInput(player.name);
                    setIsEditingName(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 p-1 transition-opacity cursor-pointer"
                  title="Editar nome"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Título / Subtítulo Editável */}
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="bg-slate-900 border border-emerald-500 text-slate-100 px-2.5 py-1 text-xs rounded outline-none w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 text-xs font-bold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-xs sm:text-sm font-semibold text-emerald-400 neon-text-green">
                  {player.hunterTitle}
                </p>
                <button
                  onClick={() => {
                    setTitleInput(player.hunterTitle);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 p-0.5 transition-opacity cursor-pointer"
                  title="Editar título"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: PROGRESSO DE EXPERIÊNCIA (XP) */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              PROGRESSO DE EXPERIÊNCIA (XP)
            </span>
            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
              {player.currentXp} / {player.nextLevelXp} XP
            </span>
          </div>
          
          <div className="w-full h-3.5 bg-slate-950/90 rounded-full border border-slate-800 p-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-300 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: Timer de Hiperfoco (Anti-Cegueira Temporal) */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                Timer de Hiperfoco (Anti-Cegueira Temporal):
              </span>
            </div>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setIsTimerRunning(!isTimerRunning);
              }}
              className="px-4 py-2 rounded-lg border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.2)]"
            >
              {isTimerRunning ? 'PAUSAR' : `INICIAR ${timerMinutes}M`}
            </button>
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setIsTimerRunning(false);
                setSecondsRemaining(timerMinutes * 60);
              }}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Reiniciar Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aviso de missão travada no ciclo diário */}
        {lockedNotice && (
          <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lockedNotice}</span>
            </div>
            <button
              onClick={() => setLockedNotice(null)}
              className="text-amber-400 hover:text-amber-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Linha dos 3 Pilares da Tríade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start pt-2">
          
          {/* PILAR 1: FÍSICO */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-emerald-400 tracking-wider uppercase font-display">
                      FÍSICO
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums uppercase tracking-wider ${
                        pendingFisico === 0
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                      }`}
                    >
                      {pendingFisico === 0 ? '✓ 0 PENDENTES' : `${pendingFisico} PENDENTE${pendingFisico > 1 ? 'S' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Corpo e Vitalidade</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('fisico')}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/40 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Físico"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Missões do Pilar Físico */}
            <div className="space-y-3">
              {fisicoQuests.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  Nenhuma missão cadastrada.
                  <button
                    onClick={() => onOpenNewQuestModal('fisico')}
                    className="block text-emerald-400 hover:underline mx-auto mt-1 cursor-pointer font-semibold"
                  >
                    + Adicionar Meta Física
                  </button>
                </div>
              ) : (
                fisicoQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group relative ${
                      quest.isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleQuestClick(quest)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          quest.isCompleted
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-emerald-400 text-transparent'
                        }`}
                        title={
                          quest.isCompleted
                            ? 'Missão concluída neste ciclo diário (bloqueada contra repetição)'
                            : 'Marcar missão como cumprida'
                        }
                        aria-label={`Alternar ${quest.title}`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${quest.isCompleted ? 'block' : 'hidden'}`} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            onClick={() => handleQuestClick(quest)}
                            className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors leading-snug ${
                              quest.isCompleted
                                ? 'text-emerald-300/90 font-medium'
                                : 'text-slate-100 hover:text-emerald-300'
                            }`}
                          >
                            {quest.title}
                          </h4>

                          {quest.isCompleted && (
                            <span
                              className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center gap-0.5 shrink-0"
                              title="Missão cumprida e travada para este ciclo"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Ciclo OK</span>
                            </span>
                          )}
                        </div>

                        {quest.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {quest.description}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação: Editar e Excluir */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            onEditQuest(quest);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-all cursor-pointer"
                          title="Editar missão"
                          aria-label={`Editar ${quest.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            setQuestToDelete(quest);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Excluir missão"
                          aria-label={`Excluir ${quest.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 tabular-nums">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* PILAR 2: MENTAL */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-teal-400 fill-teal-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-teal-400 tracking-wider uppercase font-display">
                      MENTAL
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums uppercase tracking-wider ${
                        pendingMental === 0
                          ? 'bg-teal-950/80 text-teal-300 border-teal-500/60 shadow-[0_0_8px_rgba(45,212,191,0.3)]'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                      }`}
                    >
                      {pendingMental === 0 ? '✓ 0 PENDENTES' : `${pendingMental} PENDENTE${pendingMental > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Código e Carreira</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('mental')}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-teal-400 hover:border-teal-400 hover:bg-teal-950/40 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Mental"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Missões do Pilar Mental */}
            <div className="space-y-3">
              {mentalQuests.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  Nenhuma missão cadastrada.
                  <button
                    onClick={() => onOpenNewQuestModal('mental')}
                    className="block text-teal-400 hover:underline mx-auto mt-1 cursor-pointer font-semibold"
                  >
                    + Adicionar Meta Mental
                  </button>
                </div>
              ) : (
                mentalQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group relative ${
                      quest.isCompleted
                        ? 'border-teal-500/30 bg-teal-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleQuestClick(quest)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          quest.isCompleted
                            ? 'bg-teal-500/25 border-teal-400 text-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.4)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-teal-400 text-transparent'
                        }`}
                        title={
                          quest.isCompleted
                            ? 'Missão concluída neste ciclo diário (bloqueada contra repetição)'
                            : 'Marcar missão como cumprida'
                        }
                        aria-label={`Alternar ${quest.title}`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${quest.isCompleted ? 'block' : 'hidden'}`} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            onClick={() => handleQuestClick(quest)}
                            className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors leading-snug ${
                              quest.isCompleted
                                ? 'text-teal-300/90 font-medium'
                                : 'text-slate-100 hover:text-teal-300'
                            }`}
                          >
                            {quest.title}
                          </h4>

                          {quest.isCompleted && (
                            <span
                              className="text-[9px] font-mono text-teal-400 bg-teal-950/80 px-1.5 py-0.2 rounded border border-teal-500/40 flex items-center gap-0.5 shrink-0"
                              title="Missão cumprida e travada para este ciclo"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Ciclo OK</span>
                            </span>
                          )}
                        </div>

                        {quest.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {quest.description}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação: Editar e Excluir */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            onEditQuest(quest);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-all cursor-pointer"
                          title="Editar missão"
                          aria-label={`Editar ${quest.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            setQuestToDelete(quest);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Excluir missão"
                          aria-label={`Excluir ${quest.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-500/30 tabular-nums">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* PILAR 3: ESPIRITUAL */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-amber-400 tracking-wider uppercase font-display">
                      ESPIRITUAL
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums uppercase tracking-wider ${
                        pendingEspiritual === 0
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                      }`}
                    >
                      {pendingEspiritual === 0 ? '✓ 0 PENDENTES' : `${pendingEspiritual} PENDENTE${pendingEspiritual > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Comunhão e Paz</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('espiritual')}
                className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700 text-amber-400 hover:border-amber-400 hover:bg-amber-950/40 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Espiritual"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de Missões do Pilar Espiritual */}
            <div className="space-y-3">
              {espiritualQuests.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  Nenhuma missão cadastrada.
                  <button
                    onClick={() => onOpenNewQuestModal('espiritual')}
                    className="block text-amber-400 hover:underline mx-auto mt-1 cursor-pointer font-semibold"
                  >
                    + Adicionar Meta Espiritual
                  </button>
                </div>
              ) : (
                espiritualQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group relative ${
                      quest.isCompleted
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleQuestClick(quest)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          quest.isCompleted
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'border-slate-700 bg-slate-900/80 hover:border-amber-400 text-transparent'
                        }`}
                        title={
                          quest.isCompleted
                            ? 'Missão concluída neste ciclo diário (bloqueada contra repetição)'
                            : 'Marcar missão como cumprida'
                        }
                        aria-label={`Alternar ${quest.title}`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${quest.isCompleted ? 'block' : 'hidden'}`} />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            onClick={() => handleQuestClick(quest)}
                            className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors leading-snug ${
                              quest.isCompleted
                                ? 'text-amber-300/90 font-medium'
                                : 'text-slate-100 hover:text-amber-200'
                            }`}
                          >
                            {quest.title}
                          </h4>

                          {quest.isCompleted && (
                            <span
                              className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/40 flex items-center gap-0.5 shrink-0"
                              title="Missão cumprida e travada para este ciclo"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Ciclo OK</span>
                            </span>
                          )}
                        </div>

                        {quest.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {quest.description}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação: Editar e Excluir */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            onEditQuest(quest);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all cursor-pointer"
                          title="Editar missão"
                          aria-label={`Editar ${quest.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            setQuestToDelete(quest);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Excluir missão"
                          aria-label={`Excluir ${quest.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 tabular-nums">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Modal de Confirmação de Exclusão */}
      {questToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="system-window rounded-2xl max-w-md w-full p-6 border-2 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                  Excluir Missão?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tem certeza que deseja remover a missão <span className="font-semibold text-rose-300">"{questToDelete.title}"</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
              <button
                onClick={() => setQuestToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Baús de Suprimentos */}
      {player.lootBoxesAvailable > 0 && (
        <div className="system-window-gold rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <h4 className="text-sm font-bold text-amber-200 tracking-wide uppercase">
                Caixa de Suprimentos Pronta!
              </h4>
              <p className="text-xs text-amber-300/80">
                Você conquistou um baú de recompensas por manter o ritmo de evolução.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playLootOpen();
              onOpenLootBox();
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all cursor-pointer whitespace-nowrap"
          >
            Abrir Baú ({player.lootBoxesAvailable})
          </button>
        </div>
      )}

    </div>
  );
};
