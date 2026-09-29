import React, { useState } from 'react';
import { PlayerProfile, Quest, PillarType } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { Shield, Zap, Sparkles, Check, RefreshCw, Plus, Trash2, Clock, RotateCcw, Share2, Lock } from 'lucide-react';

interface StatusHudProps {
  player: PlayerProfile;
  quests: Quest[];
  onToggleQuest: (questId: string) => void;
  onDeleteQuest: (questId: string) => void;
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

  // Timer de Hiperfoco TDA embutido
  const [timerMinutes, setTimerMinutes] = useState(20);
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Toast / feedback de missão travada
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

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

  const xpPercent = Math.min(100, Math.round((player.currentXp / player.nextLevelXp) * 100));

  const fisicoQuests = quests.filter((q) => q.category === 'fisico');
  const mentalQuests = quests.filter((q) => q.category === 'mental');
  const espiritualQuests = quests.filter((q) => q.category === 'espiritual');

  const pendingFisico = fisicoQuests.filter((q) => !q.isCompleted).length;
  const pendingMental = mentalQuests.filter((q) => !q.isCompleted).length;
  const pendingEspiritual = espiritualQuests.filter((q) => !q.isCompleted).length;

  const totalPending = pendingFisico + pendingMental + pendingEspiritual;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Moldura Principal de Status */}
      <div className="system-window rounded-2xl p-5 sm:p-8 space-y-6 relative">
        
        {/* Top Header: Tag, Título, Nível, Botão Relatório e Botão Renovar Dia */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-emerald-500/20 gap-4">
          <div>
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-emerald-400 block mb-1">
              [ SISTEMA DE EVOLUÇÃO: TRÍADE BALANCEADA ]
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-widest text-slate-100 uppercase">
              PAINEL DE STATUS
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-stretch lg:self-auto justify-between lg:justify-end">
            <div className="text-left sm:text-right pr-2">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                NÍVEL ATUAL
              </span>
              <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400 neon-text-green tabular-nums">
                LV. {player.level}
              </div>
            </div>

            {/* Botão Tela de Print / Relatório do Ciclo */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                onOpenCycleReport();
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.35)] cursor-pointer whitespace-nowrap"
              title="Abre a tela de resumo pronta para printar e postar nas redes ou guardar"
            >
              <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Relatório do Ciclo (Print)</span>
            </button>

            {/* Botão Renovar Dia */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                onRenewDay();
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg transition-all shadow-[0_0_12px_rgba(34,197,94,0.15)] cursor-pointer whitespace-nowrap"
              title="Reseta o ciclo diário de missões preservando seu nível e histórico"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Renovar Dia</span>
            </button>
          </div>
        </div>

        {/* Notificação flutuante de trava diária anti-repetição */}
        {lockedNotice && (
          <div className="p-3 rounded-lg bg-amber-950/80 border border-amber-400/80 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lockedNotice}</span>
            </div>
            <button
              onClick={() => setLockedNotice(null)}
              className="text-amber-400 hover:text-amber-200 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Linha 2: Cards de JOGADOR e PROGRESSO DE EXPERIÊNCIA (XP) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Card JOGADOR */}
          <div className="md:col-span-5 rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
              JOGADOR
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="bg-slate-900 border border-emerald-400 text-slate-100 text-sm px-2 py-1 rounded outline-none w-full font-bold"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
                  {player.name}
                </h2>
                <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  (editar)
                </span>
              </div>
            )}

            {isEditingTitle ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="bg-slate-900 border border-emerald-400 text-emerald-300 text-xs px-2 py-0.5 rounded outline-none w-full font-medium"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingTitle(true)}
                className="text-xs text-emerald-400 font-semibold truncate hover:text-emerald-300 cursor-pointer transition-colors"
                title="Clique para editar o título/classe"
              >
                {player.hunterTitle || 'Desenvolvedor / Monarca da Resiliência'}
              </p>
            )}
          </div>

          {/* Card PROGRESSO DE EXPERIÊNCIA (XP) */}
          <div className="md:col-span-7 rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-center space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                PROGRESSO DE EXPERIÊNCIA (XP)
              </span>
              <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                {player.currentXp} / {player.nextLevelXp} XP
              </span>
            </div>

            <div className="h-4 w-full bg-slate-900/90 rounded-full border border-slate-800 p-0.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 rounded-full transition-all duration-500 shadow-[0_0_14px_rgba(34,197,94,0.7)]"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* Barra Rápida de Hiperfoco TDA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/50 rounded-xl px-4 py-2.5 border border-slate-800/60 text-xs gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-medium">Timer de Hiperfoco (Anti-Cegueira Temporal):</span>
            <span className="font-mono text-emerald-300 font-bold tabular-nums text-sm">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setIsTimerRunning(!isTimerRunning);
              }}
              className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
              }`}
            >
              {isTimerRunning ? 'Pausar' : 'Iniciar 20m'}
            </button>
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setIsTimerRunning(false);
                setSecondsRemaining(timerMinutes * 60);
              }}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Reiniciar timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Linha 3: AS TRÊS COLUNAS DA TRÍADE COM AS MISSÕES DIÁRIAS (Físico, Mental, Espiritual) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
          
          {/* COLUNA 1: FÍSICO (Com seletor .system-window e contador de pendentes) */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            {/* Header do Pilar com Contador de Pendentes */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
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
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      }`}
                    >
                      {pendingFisico === 0 ? '✓ 0 Faltando' : `${pendingFisico} Pendente${pendingFisico > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Corpo e Vitalidade</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('fisico')}
                className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Físico"
              >
                <Plus className="w-3.5 h-3.5" />
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
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group ${
                      quest.isCompleted
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox com trava anti-duplicação diária */}
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
                        <div className="flex items-center gap-1.5">
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

                      <button
                        onClick={() => onDeleteQuest(quest.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

          {/* COLUNA 2: MENTAL (Com seletor .system-window e contador de pendentes) */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            {/* Header do Pilar com Contador de Pendentes */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-950/60 border border-teal-500/40 flex items-center justify-center shrink-0">
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
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      }`}
                    >
                      {pendingMental === 0 ? '✓ 0 Faltando' : `${pendingMental} Pendente${pendingMental > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Código e Carreira</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('mental')}
                className="p-1.5 rounded-lg bg-teal-950/40 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Mental"
              >
                <Plus className="w-3.5 h-3.5" />
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
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group ${
                      quest.isCompleted
                        ? 'border-teal-500/30 bg-teal-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox com trava anti-duplicação diária */}
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
                        <div className="flex items-center gap-1.5">
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

                      <button
                        onClick={() => onDeleteQuest(quest.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

          {/* COLUNA 3: ESPIRITUAL (Com seletor .system-window e contador de pendentes) */}
          <div className="system-window rounded-xl p-4 sm:p-5 space-y-4">
            
            {/* Header do Pilar com Contador de Pendentes */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/90 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
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
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      }`}
                    >
                      {pendingEspiritual === 0 ? '✓ 0 Faltando' : `${pendingEspiritual} Pendente${pendingEspiritual > 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Comunhão e Paz</p>
                </div>
              </div>

              <button
                onClick={() => onOpenNewQuestModal('espiritual')}
                className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all cursor-pointer shrink-0"
                title="Adicionar meta ao Pilar Espiritual"
              >
                <Plus className="w-3.5 h-3.5" />
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
                    className={`rounded-xl p-3.5 border transition-all space-y-2 group ${
                      quest.isCompleted
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox com trava anti-duplicação diária */}
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
                        <div className="flex items-center gap-1.5">
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

                      <button
                        onClick={() => onDeleteQuest(quest.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer shrink-0"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

        {/* Linha 4: Citação de Encerramento Inspiradora */}
        <div className="pt-4 border-t border-slate-800/70 text-center">
          <p className="text-xs text-slate-400 italic font-sans leading-relaxed tracking-wide">
            “Desenvolva o corpo com disciplina, a mente com sabedoria e o espírito em comunhão com Deus.”
          </p>
        </div>

      </div>

      {/* Banner de Baús de Suprimentos (se houver disponível) */}
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
