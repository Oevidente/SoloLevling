import React, { useRef, useState } from 'react';
import { PlayerProfile, Quest } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { X, Copy, Download, Share2, Check, Flame, Shield, Zap, Sparkles, Trophy } from 'lucide-react';

interface CycleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  quests: Quest[];
}

export const CycleReportModal: React.FC<CycleReportModalProps> = ({
  isOpen,
  onClose,
  player,
  quests,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'text-copied'>('idle');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const fisicoQuests = quests.filter((q) => q.category === 'fisico');
  const mentalQuests = quests.filter((q) => q.category === 'mental');
  const espiritualQuests = quests.filter((q) => q.category === 'espiritual');

  const completedFisico = fisicoQuests.filter((q) => q.isCompleted).length;
  const completedMental = mentalQuests.filter((q) => q.isCompleted).length;
  const completedEspiritual = espiritualQuests.filter((q) => q.isCompleted).length;

  const totalCompleted = completedFisico + completedMental + completedEspiritual;
  const totalQuests = quests.length;
  const completionRate = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;

  const completedQuestTitles = quests.filter((q) => q.isCompleted).map((q) => q.title);

  // Formatar data local amigável
  const todayDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Gerar Canvas nativo para print/cópia com resolução alta
  const renderCardToCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1350; // Proporção 4:5 perfeita para feed/story e print
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter contexto 2D');

    // Fundo escuro Solo Leveling com gradiente
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020904');
    bgGrad.addColorStop(0.5, '#05140a');
    bgGrad.addColorStop(1, '#010603');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Borda cibernética neon
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, width - 90, height - 90);

    // Header Topo
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ SISTEMA DE EVOLUÇÃO · RELATÓRIO DO CICLO ]', width / 2, 100);

    // Título Principal
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px sans-serif';
    ctx.fillText('DIÁRIO DO CAÇADOR', width / 2, 165);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px monospace';
    ctx.fillText(todayDate.toUpperCase(), width / 2, 205);

    // Box do Caçador
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.lineWidth = 3;
    roundRect(ctx, 80, 240, width - 160, 200, 20);
    ctx.fill();
    ctx.stroke();

    // Rank Badge
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CLASSIFICAÇÃO DO SISTEMA', 120, 285);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(player.name, 120, 335);

    ctx.fillStyle = '#4ade80';
    ctx.font = '22px sans-serif';
    ctx.fillText(player.hunterTitle || 'Caçador da Tríade', 120, 375);

    // Badge Rank & Nível à direita
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`NÍVEL ${player.level}`, width - 120, 300);

    ctx.fillStyle = '#22c55e';
    ctx.font = '900 64px sans-serif';
    ctx.fillText(`RANK ${player.hunterRank}`, width - 120, 365);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`🔥 STREAK: ${player.streakDays} DIAS`, width - 120, 410);

    // Seção Pilares da Tríade
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('EXECUÇÃO DA TRÍADE HOJE', 80, 485);

    // Card Físico
    drawPillarBox(ctx, 80, 510, 280, 160, 'FÍSICO', `${completedFisico}/${fisicoQuests.length}`, '#22c55e');
    // Card Mental
    drawPillarBox(ctx, 400, 510, 280, 160, 'MENTAL', `${completedMental}/${mentalQuests.length}`, '#2dd4bf');
    // Card Espiritual
    drawPillarBox(ctx, 720, 510, 280, 160, 'ESPIRITUAL', `${completedEspiritual}/${espiritualQuests.length}`, '#f59e0b');

    // Seção Missões Concluídas
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`MISSÕES CUMPRIDAS NO CICLO (${totalCompleted}/${totalQuests})`, 80, 720);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 2;
    roundRect(ctx, 80, 745, width - 160, 430, 20);
    ctx.fill();
    ctx.stroke();

    let questY = 795;
    if (completedQuestTitles.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhuma missão marcada ainda neste ciclo.', width / 2, 920);
      ctx.fillText('Dê o primeiro passo para registrar sua evolução!', width / 2, 960);
    } else {
      ctx.textAlign = 'left';
      ctx.font = '22px sans-serif';
      const maxToShow = 9;
      completedQuestTitles.slice(0, maxToShow).forEach((title) => {
        ctx.fillStyle = '#22c55e';
        ctx.fillText('✔', 120, questY);
        ctx.fillStyle = '#f1f5f9';
        const displayTitle = title.length > 55 ? `${title.slice(0, 55)}...` : title;
        ctx.fillText(displayTitle, 160, questY);
        questY += 40;
      });

      if (completedQuestTitles.length > maxToShow) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 20px sans-serif';
        ctx.fillText(`+ ${completedQuestTitles.length - maxToShow} outras micro-metas cumpridas com maestria`, 120, questY + 10);
      }
    }

    // Rodapé Inspirador
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 22px sans-serif';
    ctx.fillText('“A disciplina silenciosa de hoje constrói o Monarca de amanhã.”', width / 2, 1220);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('SISTEMA SOLO LEVELING · NEUROCIÊNCIA & CONSTÂNCIA', width / 2, 1270);

    return canvas;
  };

  const handleCopyImage = async () => {
    try {
      setIsGenerating(true);
      soundEffects.playSystemBeep();
      const canvas = await renderCardToCanvas();

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Falha ao gerar blob');
        if (navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopyStatus('copied');
            soundEffects.playQuestComplete();
            setTimeout(() => setCopyStatus('idle'), 3000);
            return;
          } catch {
            // Fallback para download se a API de área de transferência com imagem não for permitida no iframe
          }
        }

        // Fallback: faz o download direto da imagem
        handleDownloadImage();
      }, 'image/png');
    } catch (err) {
      console.error('Falha ao copiar imagem:', err);
      handleCopyText();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      soundEffects.playSystemBeep();
      const canvas = await renderCardToCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `solo_leveling_ciclo_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      soundEffects.playQuestComplete();
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('Falha ao baixar imagem:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = () => {
    soundEffects.playSystemBeep();
    const text = [
      `⚔️ SYSTEM: SOLO LEVELING · RELATÓRIO DO CICLO`,
      `📅 Data: ${todayDate}`,
      `👤 Caçador: ${player.name} (${player.hunterTitle})`,
      `🏆 Nível ${player.level} · Rank [${player.hunterRank}]`,
      `🔥 Sequência de Dias: ${player.streakDays} dias`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🛡️ FÍSICO: ${completedFisico}/${fisicoQuests.length} metas concluídas`,
      `⚡ MENTAL: ${completedMental}/${mentalQuests.length} metas concluídas`,
      `✨ ESPIRITUAL: ${completedEspiritual}/${espiritualQuests.length} metas concluídas`,
      `🎯 Total Cumprido: ${totalCompleted}/${totalQuests} (${completionRate}%)`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `"A disciplina silenciosa de hoje constrói o Monarca de amanhã."`,
      `#SoloLeveling #Produtividade #Triade #Constancia`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopyStatus('text-copied');
    setTimeout(() => setCopyStatus('idle'), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-xl w-full my-auto space-y-4">
        
        {/* Card Feito para Printar */}
        <div
          ref={cardRef}
          className="rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-b from-[#020b05] via-[#05140b] to-[#010603] p-5 sm:p-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] relative text-slate-100 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Fechar Relatório"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hologram Header */}
          <div className="text-center space-y-1 mb-5">
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40 inline-block">
              [ SISTEMA DE EVOLUÇÃO · RELATÓRIO DO CICLO ]
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-widest uppercase text-slate-50 neon-text-green">
              DIÁRIO DO CAÇADOR
            </h2>
            <p className="text-[11px] font-mono text-slate-400 uppercase">
              {todayDate}
            </p>
          </div>

          {/* Profile Card */}
          <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-3.5 sm:p-4 mb-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                CAÇADOR ATIVO
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-100 truncate">
                {player.name}
              </h3>
              <p className="text-xs text-emerald-400 font-semibold truncate">
                {player.hunterTitle || 'Monarca da Resiliência'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-bold text-slate-300">
                LV. {player.level}
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400 neon-text-green">
                RANK {player.hunterRank}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 justify-end mt-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{player.streakDays}d Streak</span>
              </div>
            </div>
          </div>

          {/* Pilares da Tríade */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/40 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-bold uppercase mb-0.5">
                <Shield className="w-3 h-3" />
                <span>FÍSICO</span>
              </div>
              <div className="text-lg font-mono font-black text-emerald-300">
                {completedFisico}/{fisicoQuests.length}
              </div>
              <span className="text-[10px] text-slate-400">metas</span>
            </div>

            <div className="rounded-lg bg-teal-950/30 border border-teal-500/40 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-teal-400 text-[11px] font-bold uppercase mb-0.5">
                <Zap className="w-3 h-3" />
                <span>MENTAL</span>
              </div>
              <div className="text-lg font-mono font-black text-teal-300">
                {completedMental}/{mentalQuests.length}
              </div>
              <span className="text-[10px] text-slate-400">metas</span>
            </div>

            <div className="rounded-lg bg-amber-950/30 border border-amber-500/40 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-[11px] font-bold uppercase mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>ESPIRITUAL</span>
              </div>
              <div className="text-lg font-mono font-black text-amber-300">
                {completedEspiritual}/{espiritualQuests.length}
              </div>
              <span className="text-[10px] text-slate-400">metas</span>
            </div>
          </div>

          {/* Lista de Metas Cumpridas no Ciclo */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 mb-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-bold uppercase">
                MISSÕES CUMPRIDAS HOJE
              </span>
              <span className="text-emerald-400 font-bold">
                {totalCompleted}/{totalQuests} ({completionRate}%)
              </span>
            </div>

            {completedQuestTitles.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                Nenhuma missão concluída no ciclo atual ainda.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {completedQuestTitles.map((title, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                    <span className="truncate">{title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rodapé Inspirador */}
          <div className="text-center pt-2 border-t border-emerald-500/20">
            <p className="text-[11px] text-slate-400 italic">
              “A disciplina silenciosa de hoje constrói o Monarca de amanhã.”
            </p>
            <span className="text-[10px] font-mono text-emerald-400/80 block mt-0.5">
              SYSTEM: SOLO LEVELING · NEUROCIÊNCIA PARA TDA
            </span>
          </div>
        </div>

        {/* Barra de Ações Rápidas (Copiar Imagem, Baixar PNG, Copiar Texto) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          
          <button
            onClick={handleCopyImage}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] cursor-pointer disabled:opacity-50"
          >
            {copyStatus === 'copied' ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Imagem</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 border border-emerald-500/50 hover:bg-emerald-950/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PNG</span>
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {copyStatus === 'text-copied' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Texto Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};

// Canvas Helper: Desenha retângulo arredondado
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Canvas Helper: Card de Pilar
function drawPillarBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  stat: string,
  color: string
) {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px monospace';
  ctx.fillText(stat, x + w / 2, y + 100);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText('metas concluídas', x + w / 2, y + 135);
}
