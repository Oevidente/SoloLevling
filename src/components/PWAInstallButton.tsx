import React, { useState } from 'react';
import { Download, Share, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundEffects } from '../services/soundEffects';

interface PWAInstallButtonProps {
  variant?: 'topbar' | 'compact' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'topbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed in standalone mode, suppress button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    soundEffects.playSystemBeep();
    if (isInstallable) {
      const success = await install();
      if (success) {
        soundEffects.playLevelUp();
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS (e.g. unsupported desktop browser), hide or show minimal hint only if requested
  if (!isInstallable && !isIOS) {
    return null;
  }

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-mono">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Instalado!</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-400/70 text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] active:scale-95 cursor-pointer"
          title="Instalar Sistema no Dispositivo (PWA)"
          aria-label="Instalar App no dispositivo"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-900/60 to-cyan-950/60 hover:from-emerald-800/80 hover:to-cyan-900/80 border border-emerald-400/70 text-emerald-300 hover:text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95 transition-all cursor-pointer group"
          title="Instalar aplicativo no PC ou Android"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-mono">Instalar App</span>
        </button>
      )}

      {/* Modal Guia para iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#030d06] border border-emerald-500/60 p-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-emerald-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-100">
                Instalar no iPhone / iPad
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Para transformar o <span className="text-emerald-400 font-bold">System: Solo Leveling</span> em um aplicativo de tela cheia com ícone dedicado:
            </p>

            <ol className="space-y-3 text-xs text-slate-300 mb-6 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3.5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  No rodapé do Safari, toque no botão de <strong className="text-emerald-300 flex items-center gap-1 inline-flex"><Share className="w-3.5 h-3.5 inline" /> Compartilhar</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Role a lista e selecione <strong className="text-emerald-300">Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Toque em <strong className="text-emerald-300">Adicionar</strong> no canto superior direito.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
