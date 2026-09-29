import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Volume2, VolumeX, LogIn, LogOut, Shield, Gift, LayoutDashboard, Package, Share2, Cloud, Check, RefreshCw } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentTab: 'status' | 'inventory';
  setCurrentTab: (tab: 'status' | 'inventory') => void;
  openRedemption: () => void;
  openLootBox: () => void;
  openCycleReport: () => void;
  lootBoxesCount: number;
  inventoryCount?: number;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCloudBackup: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  syncStatus?: 'synced' | 'saving' | 'offline' | 'local';
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  openRedemption,
  openLootBox,
  openCycleReport,
  lootBoxesCount,
  inventoryCount = 0,
  user,
  onLogin,
  onLogout,
  onOpenCloudBackup,
  isMuted,
  onToggleMute,
  syncStatus = 'local',
}) => {
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-500/25 bg-[#020804]/90 backdrop-blur-md">
      
      {/* ========================================================
          DESKTOP TOP BAR (Só no modo desktop: hidden md:block)
          Navegação fluida, completa e espaçosa para telas médias/grandes
          ======================================================== */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg border border-emerald-400/70 bg-emerald-950/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.45)]">
              <span className="font-mono text-emerald-400 font-black text-base">SL</span>
            </div>
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setCurrentTab('status');
              }}
              className="text-left group cursor-pointer"
            >
              <span className="font-display font-black text-base lg:text-lg tracking-wider text-slate-100 group-hover:text-emerald-300 transition-colors uppercase whitespace-nowrap">
                SYSTEM: <span className="text-emerald-400 neon-text-green">SOLO LEVELING</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Tabs (Fluida e sem atrito) */}
          <nav className="flex items-center gap-2">
            {/* Aba Status */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setCurrentTab('status');
              }}
              className={`px-3 py-1.5 text-xs lg:text-sm font-semibold tracking-wider uppercase transition-all rounded-lg flex items-center gap-2 cursor-pointer ${
                currentTab === 'status'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel da Tríade</span>
            </button>

            {/* Aba Inventário */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setCurrentTab('inventory');
              }}
              className={`px-3 py-1.5 text-xs lg:text-sm font-semibold tracking-wider uppercase transition-all rounded-lg flex items-center gap-2 cursor-pointer ${
                currentTab === 'inventory'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventário</span>
              {inventoryCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-full tabular-nums">
                  {inventoryCount}
                </span>
              )}
            </button>

            {/* Botão Relatório do Ciclo */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                openCycleReport();
              }}
              className="px-3 py-1.5 text-xs lg:text-sm font-semibold tracking-wider uppercase transition-all rounded-lg text-emerald-300 hover:text-emerald-100 hover:bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
              title="Abrir tela de relatório pronta para printar"
            >
              <Share2 className="w-4 h-4" />
              <span>Relatório</span>
            </button>

            {/* Botão Redenção */}
            <button
              onClick={() => {
                soundEffects.playAlertNotice();
                openRedemption();
              }}
              className="px-3 py-1.5 text-xs lg:text-sm font-semibold tracking-wider uppercase transition-all rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
              title="Dungeon de Redenção para dias de fadiga"
            >
              <Shield className="w-4 h-4" />
              <span>Redenção</span>
            </button>
          </nav>

          {/* Zone 3: Desktop Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Botão de Instalação do App PWA */}
            <PWAInstallButton variant="topbar" />

            {/* Caixa de Suprimentos */}
            {lootBoxesCount > 0 && (
              <button
                onClick={() => {
                  soundEffects.playLootOpen();
                  openLootBox();
                }}
                className="relative p-2 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-300 hover:bg-amber-500/30 transition-all animate-pulse cursor-pointer"
                title={`${lootBoxesCount} Caixa(s) de Recompensa Pronta(s)!`}
              >
                <Gift className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                  {lootBoxesCount}
                </span>
              </button>
            )}

            {/* Áudio SFX */}
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors cursor-pointer"
              title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
              aria-label="Controle de Áudio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Botão Backup / Nuvem com indicador de Sync */}
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                onOpenCloudBackup();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-100 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
              title="Gerenciar Backup e Sincronização Firebase/Google"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nuvem</span>
              {user && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  {syncStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                      <span className="text-amber-400">Salvando</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Sync</span>
                    </>
                  )}
                </span>
              )}
            </button>

            {/* Auth Google */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Caçador'}
                    className="w-8 h-8 rounded-full border border-emerald-400/60 object-cover shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-400 text-emerald-300 text-xs flex items-center justify-center font-bold">
                    {(user.displayName || 'C')[0]}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 border border-slate-800 rounded transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/40 border border-emerald-400/60 rounded-lg hover:bg-emerald-500/25 hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] whitespace-nowrap cursor-pointer"
                title="Fazer Login com Google"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar (Google)</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================
          MOBILE TOP HEADER (Apenas no mobile: md:hidden)
          Sem navbar superior! Apenas identidade visual + utilidades rápidas
          ======================================================== */}
      <div className="md:hidden">
        <div className="px-3.5 h-13 flex items-center justify-between gap-2">
          
          {/* Logo / Marca Compacta */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-md border border-emerald-400/70 bg-emerald-950/60 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.4)]">
              <span className="font-mono text-emerald-400 font-black text-xs">SL</span>
            </div>
            <button
              onClick={() => {
                soundEffects.playSystemBeep();
                setCurrentTab('status');
              }}
              className="text-left cursor-pointer"
            >
              <span className="font-display font-black text-xs tracking-wider text-slate-100 uppercase whitespace-nowrap">
                SYSTEM: <span className="text-emerald-400 neon-text-green">SOLO LEVELING</span>
              </span>
            </button>
          </div>

          {/* Ações Rápidas no Topo Mobile */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            {/* Botão de Instalar PWA no Mobile */}
            <PWAInstallButton variant="compact" />
            
            {/* Caixa de Suprimentos (Se disponível) */}
            {lootBoxesCount > 0 && (
              <button
                onClick={() => {
                  soundEffects.playLootOpen();
                  openLootBox();
                }}
                className="relative p-1.5 rounded-lg bg-amber-500/20 border border-amber-400/70 text-amber-300 active:scale-95 transition-all animate-pulse"
                title={`${lootBoxesCount} Recompensa(s) Disponível(is)`}
                aria-label="Abrir Caixa de Suprimentos"
              >
                <Gift className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_6px_rgba(245,158,11,1)]">
                  {lootBoxesCount}
                </span>
              </button>
            )}

            {/* Controle de Áudio SFX */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700/70 text-slate-300 active:scale-95 transition-colors cursor-pointer"
              title={isMuted ? 'Ativar Som' : 'Silenciar'}
              aria-label="Alternar Som"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Auth / Avatar Mobile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMobileProfileMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full border border-emerald-400/60 bg-emerald-950/40 active:scale-95 transition-all cursor-pointer relative"
                  aria-label="Abrir Menu do Caçador"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Caçador'}
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                      {(user.displayName || 'C')[0]}
                    </div>
                  )}
                  {syncStatus === 'saving' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>

                {/* Dropdown do perfil no mobile para logout e status */}
                {showMobileProfileMenu && (
                  <div className="absolute right-0 top-9 w-48 bg-[#030d06] border border-emerald-500/40 rounded-xl p-3 shadow-[0_10px_25px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-2 mb-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {user.displayName || 'Caçador Autenticado'}
                      </p>
                      <p className="text-[10px] text-emerald-400 truncate font-mono">
                        {user.email || 'Conta Vinculada'}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" />
                        <span>Nuvem Ativa & Sincronizada</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        onOpenCloudBackup();
                      }}
                      className="w-full mb-1.5 flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Backup & Nuvem</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenCloudBackup}
                  className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 active:scale-95 transition-all"
                  title="Backup & Configuração da Nuvem"
                  aria-label="Abrir Backup & Nuvem"
                >
                  <Cloud className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-400/60 rounded-lg active:scale-95 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)] whitespace-nowrap cursor-pointer"
                  title="Fazer Login Google"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Entrar</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

    </header>
  );
};
