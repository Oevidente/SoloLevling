import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Check, 
  AlertTriangle, 
  X,
  FileJson,
  ShieldCheck,
  RefreshCw,
  FolderSync,
  HardDrive,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Settings,
  LogIn,
  LogOut,
  Info
} from 'lucide-react';
import { PlayerProfile, Quest } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';
import { 
  saveToGoogleDrive, 
  loadFromGoogleDrive, 
  getDriveBackupMetadata,
  formatDriveTimestamp,
  formatBytes,
  DriveFileInfo,
  HunterDriveSaveData,
  DRIVE_FOLDER_NAME,
  DRIVE_FILE_NAME
} from '../services/googleDrive';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  clearStoredFirebaseConfig, 
  currentFirebaseConfig,
  FirebaseCustomConfig
} from '../services/firebase';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  quests: Quest[];
  onImportData: (importedPlayer: PlayerProfile, importedQuests: Quest[]) => void;
  onTriggerGoogleLogin: () => Promise<void>;
  onTriggerGoogleLogout: () => Promise<void>;
  isLoggedIn: boolean;
  userEmail?: string | null;
  userName?: string | null;
  userPhoto?: string | null;
  accessToken: string | null;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  player,
  quests,
  onImportData,
  onTriggerGoogleLogin,
  onTriggerGoogleLogout,
  isLoggedIn,
  userEmail,
  userName,
  userPhoto,
  accessToken,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'local' | 'config'>('drive');
  
  // Status de operações do Google Drive
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);
  const [driveFileInfo, setDriveFileInfo] = useState<DriveFileInfo | null>(null);
  const [driveCheckedOnce, setDriveCheckedOnce] = useState(false);
  
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveFeedback, setDriveFeedback] = useState<{ status: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Confirmação para sobrescrever dados locais com os dados do Drive
  const [pendingRestoreData, setPendingRestoreData] = useState<{ data: HunterDriveSaveData; fileInfo: DriveFileInfo } | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

  // Confirmação para sobrescrever arquivo no Drive
  const [isConfirmingDriveOverwrite, setIsConfirmingDriveOverwrite] = useState(false);

  // Importação Local
  const [importFeedback, setImportFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuração Manual Opcional
  const initialConfig = getStoredFirebaseConfig() || currentFirebaseConfig;
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [projectId, setProjectId] = useState(initialConfig.projectId || '');
  const [appId, setAppId] = useState(initialConfig.appId || '');
  const [authDomain, setAuthDomain] = useState(initialConfig.authDomain || '');
  const [configSuccessFeedback, setConfigSuccessFeedback] = useState(false);

  // Checa informações do arquivo no Drive ao abrir o modal com login ativo
  useEffect(() => {
    if (isOpen && isLoggedIn && accessToken) {
      checkDriveMetadata();
    }
  }, [isOpen, isLoggedIn, accessToken]);

  const checkDriveMetadata = async () => {
    if (!accessToken) return;
    setIsCheckingDrive(true);
    setDriveFeedback(null);
    try {
      const meta = await getDriveBackupMetadata(accessToken);
      setDriveFileInfo(meta.fileInfo);
      setDriveCheckedOnce(true);
    } catch (err: any) {
      console.warn('Erro ao consultar Drive:', err);
    } finally {
      setIsCheckingDrive(false);
    }
  };

  if (!isOpen) return null;

  // 1. Salvar no Google Drive
  const handleExecuteSaveToDrive = async () => {
    if (!accessToken) {
      setDriveFeedback({
        status: 'error',
        message: 'Você precisa estar conectado com sua Conta Google para salvar no Drive.',
      });
      return;
    }

    setIsSavingDrive(true);
    setDriveFeedback(null);
    setIsConfirmingDriveOverwrite(false);

    try {
      const result = await saveToGoogleDrive(accessToken, player, quests);
      soundEffects.playLevelUp();
      setDriveFileInfo({
        id: result.fileId,
        name: DRIVE_FILE_NAME,
        modifiedTime: result.modifiedTime,
        size: String(result.size),
      });
      setDriveFeedback({
        status: 'success',
        message: `Backup salvo com sucesso na pasta "${DRIVE_FOLDER_NAME}" do seu Google Drive! O arquivo foi atualizado sem duplicatas.`,
      });
    } catch (err: any) {
      soundEffects.playAlertNotice();
      const is401 = err?.message?.includes('401') || err?.status === 401;
      setDriveFeedback({
        status: 'error',
        message: is401
          ? 'Sua autorização com o Google Drive expirou. Clique em "Renovar Acesso Google" para restabelecer a conexão.'
          : (err.message || 'Falha ao salvar no Google Drive. Verifique sua conexão e tente novamente.'),
      });
    } finally {
      setIsSavingDrive(false);
    }
  };

  // 2. Pré-visualizar restauração do Google Drive
  const handleInitiateRestoreFromDrive = async () => {
    if (!accessToken) {
      setDriveFeedback({
        status: 'error',
        message: 'Você precisa estar conectado com sua Conta Google para restaurar do Drive.',
      });
      return;
    }

    setIsLoadingDrive(true);
    setDriveFeedback(null);

    try {
      const { data, fileInfo } = await loadFromGoogleDrive(accessToken);
      soundEffects.playSystemBeep();
      setPendingRestoreData({ data, fileInfo });
      setIsConfirmingRestore(true);
    } catch (err: any) {
      soundEffects.playAlertNotice();
      const is401 = err?.message?.includes('401') || err?.status === 401;
      setDriveFeedback({
        status: 'error',
        message: is401
          ? 'Sua autorização com o Google Drive expirou. Clique em "Renovar Acesso Google" para restabelecer a conexão.'
          : (err.message || 'Falha ao ler o backup do Google Drive.'),
      });
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // 3. Confirmar e aplicar a restauração
  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;
    const { data } = pendingRestoreData;
    onImportData(data.player, data.quests);
    soundEffects.playQuestComplete();
    setIsConfirmingRestore(false);
    setPendingRestoreData(null);
    setDriveFeedback({
      status: 'success',
      message: `Save restaurado com sucesso! Nível ${data.player.level} (${data.quests.length} missões carregadas).`,
    });
  };

  // 4. Exportar arquivo JSON local
  const handleExportJson = () => {
    soundEffects.playSystemBeep();
    const dataToExport = {
      app: 'solo_leveling_system',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      player,
      quests,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hunter_backup_${player.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 5. Importar arquivo JSON local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.player || !Array.isArray(parsed.quests)) {
          throw new Error('Formato inválido: o arquivo não contém os dados do Caçador ou Missões.');
        }

        onImportData(parsed.player, parsed.quests);
        soundEffects.playQuestComplete();
        setImportFeedback({
          status: 'success',
          message: `Backup local restaurado com sucesso! Nível ${parsed.player.level} (${parsed.quests.length} missões).`,
        });
      } catch (err: any) {
        soundEffects.playAlertNotice();
        setImportFeedback({
          status: 'error',
          message: err.message || 'Falha ao ler o arquivo JSON selecionado.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 6. Salvar configuração manual
  const handleSaveConfig = () => {
    soundEffects.playSystemBeep();
    saveStoredFirebaseConfig({
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      appId: appId.trim(),
      authDomain: authDomain.trim(),
    });
    setConfigSuccessFeedback(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#030d06] border border-emerald-500/50 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-backup-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cloud-backup-title" className="text-base sm:text-lg font-black tracking-wider text-slate-100 uppercase flex items-center gap-2">
                Central de Backup <span className="text-emerald-400 neon-text-green">& Google Drive</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                Armazenamento seguro, sem duplicação de arquivos e 100% gratuito
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/40 transition-all cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-emerald-500/20 bg-emerald-950/10 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              setActiveTab('drive');
            }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-emerald-500/20 text-emerald-300 border-t border-x border-emerald-400/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/30'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              setActiveTab('local');
            }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'local'
                ? 'bg-emerald-500/20 text-emerald-300 border-t border-x border-emerald-400/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-emerald-950/30'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>Arquivo Local (JSON)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              setActiveTab('config');
            }}
            className={`ml-auto px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-500/20 text-emerald-300 border-t border-x border-emerald-400/60'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Configurações avançadas de conexão"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configurações</span>
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* ========================================================
              ABA 1: GOOGLE DRIVE (Principal)
              ======================================================== */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              
              {/* Card de Conexão com Google */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isLoggedIn && userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={userName || 'Caçador'}
                        className="w-10 h-10 rounded-full border border-emerald-400 object-cover shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-sm">
                        {isLoggedIn ? (userName ? userName[0] : 'G') : 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">
                          {isLoggedIn ? userName || 'Conta Google Conectada' : 'Google Drive Desconectado'}
                        </span>
                        {isLoggedIn && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Conectado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {isLoggedIn ? userEmail : 'Faça login para salvar seus dados diretamente no seu Drive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoggedIn ? (
                      <>
                        <button
                          onClick={onTriggerGoogleLogin}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Renovar token de acesso do Google Drive se expirar"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Renovar Acesso</span>
                        </button>
                        <button
                          onClick={onTriggerGoogleLogout}
                          className="px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-100 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Desconectar</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={onTriggerGoogleLogin}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Conectar com Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações da Pasta & Arquivo no Drive */}
              {isLoggedIn && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      <FolderSync className="w-4 h-4 text-emerald-400" />
                      <span>Destino no Google Drive</span>
                    </div>
                    <button
                      onClick={checkDriveMetadata}
                      disabled={isCheckingDrive}
                      className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Atualizar status do arquivo no Drive"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingDrive ? 'animate-spin' : ''}`} />
                      <span>Verificar</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase block">Pasta Dedicada:</span>
                      <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                        📁 {DRIVE_FOLDER_NAME}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 text-[10px] uppercase block">Arquivo Principal:</span>
                      <span className="text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                        📄 {DRIVE_FILE_NAME}
                      </span>
                    </div>
                  </div>

                  {driveCheckedOnce && (
                    <div className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        {driveFileInfo ? (
                          <>
                            <span className="text-emerald-400 font-bold">✓ Backup encontrado no Drive</span>
                            <span className="text-slate-400 block text-[10px]">
                              Última gravação: {formatDriveTimestamp(driveFileInfo.modifiedTime)} ({formatBytes(driveFileInfo.size)})
                            </span>
                          </>
                        ) : (
                          <span className="text-amber-400">
                            Nenhum backup encontrado ainda no Drive. Clique em "Salvar no Drive" para criar o primeiro.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões Principais de Ação */}
              {isLoggedIn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Botão 1: Salvar no Google Drive */}
                  <button
                    onClick={() => {
                      if (driveFileInfo) {
                        setIsConfirmingDriveOverwrite(true);
                      } else {
                        handleExecuteSaveToDrive();
                      }
                    }}
                    disabled={isSavingDrive || isLoadingDrive}
                    className="p-4 rounded-xl bg-gradient-to-b from-emerald-900/40 to-emerald-950/60 border border-emerald-400/60 hover:border-emerald-300 text-left transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
                        {isSavingDrive ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                        {driveFileInfo ? 'SOBRESCREVER' : 'CRIAR SAVE'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {isSavingDrive ? 'Salvando no Drive...' : 'Salvar no Google Drive'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Grava seu progresso atual (Nível {player.level}, {quests.length} missões) sem duplicar arquivos.
                    </p>
                  </button>

                  {/* Botão 2: Restaurar do Google Drive */}
                  <button
                    onClick={handleInitiateRestoreFromDrive}
                    disabled={isSavingDrive || isLoadingDrive}
                    className="p-4 rounded-xl bg-gradient-to-b from-cyan-900/30 to-slate-950 border border-cyan-500/40 hover:border-cyan-300 text-left transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] disabled:opacity-50 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                        {isLoadingDrive ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40">
                        BAIXAR & APLICAR
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {isLoadingDrive ? 'Lendo do Drive...' : 'Restaurar do Google Drive'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Carrega o backup salvo no Drive para este dispositivo com tela de comparação e confirmação.
                    </p>
                  </button>

                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Sincronização 100% no seu Google Drive
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Conecte sua conta do Google para gravar o save diretamente no seu Drive pessoal. Seus dados nunca passam por servidores de terceiros e ficam sempre sob seu controle.
                  </p>
                  <button
                    onClick={onTriggerGoogleLogin}
                    className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] inline-flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Conectar com Google para Usar o Drive</span>
                  </button>
                </div>
              )}

              {/* Feedbacks da Operação */}
              {driveFeedback && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
                  driveFeedback.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : driveFeedback.status === 'error'
                    ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}>
                  {driveFeedback.status === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : driveFeedback.status === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{driveFeedback.message}</div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              ABA 2: ARQUIVO LOCAL (JSON)
              ======================================================== */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <span>Backup Manual em Arquivo (.json)</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ideal para quando você estiver totalmente sem internet ou quiser guardar uma cópia física do seu progresso no seu computador ou celular.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Exportar JSON */}
                <button
                  onClick={handleExportJson}
                  className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 w-fit mb-2 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    Exportar Arquivo .JSON
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Baixa o arquivo com seu Nível {player.level} ({quests.length} missões).
                  </p>
                </button>

                {/* Importar JSON */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 hover:border-amber-400 text-left transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 w-fit mb-2 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    Importar Arquivo .JSON
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Seleciona um arquivo .json salvo anteriormente para carregar.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </button>
              </div>

              {importFeedback && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
                  importFeedback.status === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                }`}>
                  {importFeedback.status === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{importFeedback.message}</div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              ABA 3: CONFIGURAÇÃO MANUAL
              ======================================================== */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Configurações do Projeto Google / Firebase
                </h3>
                <p className="text-xs text-slate-400">
                  Parâmetros de autenticação usados pelo aplicativo. Configurados automaticamente pelo ambiente do Google Workspace.
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Project ID</label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-400 focus:outline-none"
                    placeholder="gen-lang-client-..."
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-400 focus:outline-none"
                    placeholder="AIzaSy..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveConfig}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Parâmetros</span>
                  </button>

                  <button
                    onClick={() => {
                      clearStoredFirebaseConfig();
                      window.location.reload();
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/30 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Restaurar Padrão
                  </button>
                </div>

                {configSuccessFeedback && (
                  <p className="text-xs text-emerald-400 font-bold">
                    ✓ Configuração atualizada! Recarregando...
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-500/20 bg-emerald-950/20 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local-First: seus dados sempre funcionam offline</span>
          </span>
          <button
            onClick={() => {
              soundEffects.playSystemBeep();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* ========================================================
          MODAL DE CONFIRMAÇÃO DE RESTAURAÇÃO (Google Workspace Guideline)
          ======================================================== */}
      {isConfirmingRestore && pendingRestoreData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#040f07] border border-cyan-400/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 uppercase">
                  Confirmar Restauração do Google Drive?
                </h3>
                <p className="text-xs text-slate-400">
                  Os dados locais deste dispositivo serão substituídos pelo backup da nuvem.
                </p>
              </div>
            </div>

            {/* Comparativo de Dados */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="space-y-1.5 pr-2 border-r border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Dispositivo Atual</span>
                <p className="text-slate-200 font-bold">{player.name}</p>
                <p className="text-emerald-400">Nível {player.level} ({player.hunterRank})</p>
                <p className="text-slate-400">{quests.length} Missões</p>
                <p className="text-[10px] text-slate-500">{formatDriveTimestamp(player.updatedAt)}</p>
              </div>

              <div className="space-y-1.5 pl-2">
                <span className="text-[10px] text-cyan-400 uppercase font-bold block">Backup no Google Drive</span>
                <p className="text-slate-200 font-bold">{pendingRestoreData.data.player.name}</p>
                <p className="text-cyan-300">Nível {pendingRestoreData.data.player.level} ({pendingRestoreData.data.player.hunterRank})</p>
                <p className="text-slate-400">{pendingRestoreData.data.quests.length} Missões</p>
                <p className="text-[10px] text-cyan-400">{formatDriveTimestamp(pendingRestoreData.data.savedAt || pendingRestoreData.fileInfo.modifiedTime)}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  soundEffects.playSystemBeep();
                  setIsConfirmingRestore(false);
                  setPendingRestoreData(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar & Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE CONFIRMAÇÃO DE SOBREGRAVAÇÃO NO DRIVE (Google Workspace Guideline)
          ======================================================== */}
      {isConfirmingDriveOverwrite && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#040f07] border border-emerald-400/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 uppercase">
                  Atualizar Backup no Drive?
                </h3>
                <p className="text-xs text-slate-400">
                  O arquivo existente <span className="text-emerald-400 font-mono">hunter_save.json</span> será substituído pelo progresso atual deste dispositivo.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
              <p className="text-slate-300">Caçador: <span className="text-emerald-400 font-bold">{player.name} (Nível {player.level})</span></p>
              <p className="text-slate-300">Missões: <span className="text-emerald-400 font-bold">{quests.length}</span></p>
              <p className="text-slate-400 text-[10px]">Destino: Google Drive &gt; {DRIVE_FOLDER_NAME} &gt; {DRIVE_FILE_NAME}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmingDriveOverwrite(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteSaveToDrive}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Substituir no Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
