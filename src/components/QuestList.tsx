import React, { useState, useEffect } from 'react';
import { Quest, PillarType } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { Check, Plus, Trash2, Clock, Flame, Brain, Compass, Lightbulb, Play, Pause, RotateCcw } from 'lucide-react';

interface QuestListProps {
  quests: Quest[];
  onToggleQuest: (questId: string) => void;
  onDeleteQuest: (questId: string) => void;
  onOpenNewQuestModal: () => void;
}

export const QuestList: React.FC<QuestListProps> = ({
  quests,
  onToggleQuest,
  onDeleteQuest,
  onOpenNewQuestModal,
}) => {
  const [filter, setFilter] = useState<'todos' | PillarType>('todos');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  // Timer de Hiperfoco do Caçador (Ferramenta TDA)
  const [timerMinutes, setTimerMinutes] = useState<number>(20);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      soundEffects.playLevelUp(); // Notificação triunfante de término de foco!
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  const selectTimerDuration = (mins: number) => {
    soundEffects.playSystemBeep();
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => {
    soundEffects.playSystemBeep();
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    soundEffects.playSystemBeep();
    setIsTimerRunning(false);
    setSecondsRemaining(timerMinutes * 60);
  };

  const formatTimerTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredQuests = quests.filter((q) => {
    if (filter === 'todos') return true;
    return q.category === filter;
  });

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalCount = quests.length;
  const progressRatio = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const pillarIcons: Record<PillarType, React.ReactNode> = {
    fisico: <Flame className="w-3.5 h-3.5 text-emerald-400" />,
    mental: <Brain className="w-3.5 h-3.5 text-teal-400" />,
    espiritual: <Compass className="w-3.5 h-3.5 text-green-400" />,
  };

  const pillarLabels: Record<PillarType, string> = {
    fisico: 'Pilar Físico',
    mental: 'Pilar Mental',
    espiritual: 'Pilar Espiritual',
  };

  return (
    <div className="space-y-6">
      
      {/* Timer de Hiperfoco do Caçador (Auxílio de Foco TDA) em Verde Neon */}
      <div className="system-window rounded-lg p-5 border-emerald-500/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-4 border-b border-emerald-500/20 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Timer de Hiperfoco do Caçador
            </h3>
            <span className="text-xs text-emerald-400 font-mono">
              [Anti-Cegueira Temporal]
            </span>
          </div>

          {/* Duração selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded border border-slate-800">
            {[10, 15, 20, 25].map((mins) => (
              <button
                key={mins}
                onClick={() => selectTimerDuration(mins)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
                  timerMinutes === mins
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-300 neon-text-green tabular-nums tracking-widest">
              {formatTimerTime(secondsRemaining)}
            </div>

            <p className="text-xs text-slate-400 max-w-xs leading-relaxed hidden sm:block">
              Para o TDA, um bloco curto e visível destrói a paralisia. Comece sem compromisso de terminar tudo.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={toggleTimer}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Iniciar Foco</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-2.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Reiniciar Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Missões Header e Filtros */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
              Missões Diárias dos Três Pilares
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 tabular-nums">
              {completedCount}/{totalCount} ({progressRatio}%)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Conclua micro-ações diárias para ganhar XP e alimentar o loop de recompensa.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded border border-slate-800">
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setFilter('todos');
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                filter === 'todos'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setFilter('fisico');
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                filter === 'fisico'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Físico
            </button>

            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setFilter('mental');
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                filter === 'mental'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mental
            </button>

            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setFilter('espiritual');
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                filter === 'espiritual'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Espiritual
            </button>
          </div>

          {/* Add custom quest button */}
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              onOpenNewQuestModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-400/50 hover:bg-emerald-500/25 rounded transition-all cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(34,197,94,0.25)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Hábito</span>
          </button>
        </div>
      </div>

      {/* Lista de Missões */}
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <div className="system-window rounded-lg p-8 text-center text-slate-400">
            <p className="text-sm">Nenhuma missão encontrada nesta categoria.</p>
            <button
              onClick={onOpenNewQuestModal}
              className="mt-3 text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              + Adicionar primeira missão personalizada
            </button>
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const isTipOpen = expandedTipId === quest.id;
            return (
              <div
                key={quest.id}
                className={`system-window rounded-lg p-4 transition-all ${
                  quest.isCompleted
                    ? 'border-emerald-500/35 bg-emerald-950/20 opacity-80'
                    : 'hover:border-emerald-400/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Checkbox Holográfica */}
                  <button
                    onClick={() => onToggleQuest(quest.id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      quest.isCompleted
                        ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-[0_0_12px_rgba(34,197,94,0.6)]'
                        : 'border-slate-600 bg-slate-900/80 hover:border-emerald-400 text-transparent'
                    }`}
                    aria-label={`Completar ${quest.title}`}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${quest.isCompleted ? 'block' : 'hidden'}`} />
                  </button>

                  {/* Informações da Missão */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                        {pillarIcons[quest.category]}
                        <span>{pillarLabels[quest.category]}</span>
                      </span>

                      <span className="text-slate-600 text-xs">·</span>

                      <span className="text-[11px] font-mono text-emerald-400 font-bold tabular-nums">
                        +{quest.xpReward} XP
                      </span>

                      <span className="text-slate-600 text-xs">·</span>

                      <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>~{quest.estimatedMinutes} min</span>
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-semibold transition-colors ${
                        quest.isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-100'
                      }`}
                    >
                      {quest.title}
                    </h4>

                    {quest.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {quest.description}
                      </p>
                    )}

                    {/* Dica Anti-Inércia para TDA */}
                    {quest.microStepTip && (
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            soundEffects.playSystemBeep();
                            setExpandedTipId(isTipOpen ? null : quest.id);
                          }}
                          className="flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          <Lightbulb className="w-3 h-3 text-amber-400" />
                          <span>{isTipOpen ? 'Ocultar Dica Anti-Inércia TDA' : 'Ver Dica de Ignição (Para TDA)'}</span>
                        </button>

                        {isTipOpen && (
                          <div className="mt-1.5 p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed font-sans">
                            💡 <strong className="text-amber-100">Ativação TDA:</strong> {quest.microStepTip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      soundEffects.playSystemBeep();
                      onDeleteQuest(quest.id);
                    }}
                    className="p-1.5 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors shrink-0 cursor-pointer"
                    title="Excluir Missão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
