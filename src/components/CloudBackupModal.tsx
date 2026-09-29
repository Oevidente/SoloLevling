import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  Download, 
  Upload, 
  Settings, 
  Check, 
  AlertTriangle, 
  ExternalLink, 
  Copy, 
  Trash2, 
  X,
  FileJson,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  clearStoredFirebaseConfig, 
  isFirebaseConfigured,
  currentFirebaseConfig,
  formatFirestoreError,
  testFirestoreConnection,
  FirebaseCustomConfig 
} from '../services/firebase';
import { PlayerProfile, Quest } from '../types/hunter';
import { soundEffects } from '../services/soundEffects';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  quests: Quest[];
  onImportData: (importedPlayer: PlayerProfile, importedQuests: Quest[]) => void;
  onTriggerGoogleLogin: () => void;
  isLoggedIn: boolean;
  userEmail?: string | null;
  authError?: string | null;
  initialTab?: 'backup' | 'firebase';
  onForcePullFromCloud?: () => Promise<void>;
  onForceSyncToCloud?: () => Promise<void>;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  player,
  quests,
  onImportData,
  onTriggerGoogleLogin,
  isLoggedIn,
  userEmail,
  authError,
  initialTab = 'backup',
  onForcePullFromCloud,
  onForceSyncToCloud,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'firebase'>(initialTab);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (authError || initialTab === 'firebase') {
      setActiveTab('firebase');
    }
  }, [authError, initialTab, isOpen]);
  
  // Estados para configuração do Firebase
  const initialConfig = getStoredFirebaseConfig() || currentFirebaseConfig;
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(initialConfig.authDomain || '');
  const [projectId, setProjectId] = useState(initialConfig.projectId || '');
  const [appId, setAppId] = useState(initialConfig.appId || '');
  const [storageBucket, setStorageBucket] = useState(initialConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(initialConfig.messagingSenderId || '');
  const [jsonPaste, setJsonPaste] = useState('');
  
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyRulesFeedback, setCopyRulesFeedback] = useState(false);
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testConnResult, setTestConnResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Exportar dados como JSON
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

  // 2. Importar arquivo JSON
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
          message: `Backup restaurado com sucesso! Nível ${parsed.player.level} (${parsed.quests.length} missões).`,
        });
      } catch (err: any) {
        soundEffects.playAlertNotice();
        setImportFeedback({
          status: 'error',
          message: err.message || 'Falha ao ler o arquivo JSON.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Salvar configurações manuais do Firebase
  const handleSaveFirebaseConfig = () => {
    soundEffects.playSystemBeep();
    
    // Tenta interpretar jsonPaste se preenchido
    let finalApiKey = apiKey.trim();
    let finalAuthDomain = authDomain.trim();
    let finalProjectId = projectId.trim();
    let finalAppId = appId.trim();
    let finalStorageBucket = storageBucket.trim();
    let finalSenderId = messagingSenderId.trim();

    if (jsonPaste.trim()) {
      try {
        const cleaned = jsonPaste
          .replace(/(const|var|let)?\s*firebaseConfig\s*=\s*/g, '')
          .replace(/;\s*$/g, '');
        const parsed = JSON.parse(cleaned);
        if (parsed.apiKey) finalApiKey = parsed.apiKey;
        if (parsed.authDomain) finalAuthDomain = parsed.authDomain;
        if (parsed.projectId) finalProjectId = parsed.projectId;
        if (parsed.appId) finalAppId = parsed.appId;
        if (parsed.storageBucket) finalStorageBucket = parsed.storageBucket;
        if (parsed.messagingSenderId) finalSenderId = parsed.messagingSenderId;
      } catch {
        // Tentar regex simples em caso de objeto JS não formatado estritamente como JSON
        const matchKey = jsonPaste.match(/apiKey:\s*["']([^"']+)["']/);
        const matchAuth = jsonPaste.match(/authDomain:\s*["']([^"']+)["']/);
        const matchProject = jsonPaste.match(/projectId:\s*["']([^"']+)["']/);
        const matchApp = jsonPaste.match(/appId:\s*["']([^"']+)["']/);
        
        if (matchKey) finalApiKey = matchKey[1];
        if (matchAuth) finalAuthDomain = matchAuth[1];
        if (matchProject) finalProjectId = matchProject[1];
        if (matchApp) finalAppId = matchApp[1];
      }
    }

    const newCfg: FirebaseCustomConfig = {
      apiKey: finalApiKey,
      authDomain: finalAuthDomain || (finalProjectId ? `${finalProjectId}.firebaseapp.com` : ''),
      projectId: finalProjectId,
      appId: finalAppId,
      storageBucket: finalStorageBucket,
      messagingSenderId: finalSenderId,
      firestoreDatabaseId: '(default)', // Garante uso da base padrão em projetos Firebase normais
    };

    saveStoredFirebaseConfig(newCfg);
    setSaveSuccessFeedback(true);
    setTimeout(() => {
      // Recarregar a página para aplicar a nova inicialização do Firebase com as chaves corretas
      window.location.reload();
    }, 1200);
  };

  const handleClearConfig = () => {
    if (window.confirm('Deseja remover as chaves salvas do Firebase deste navegador?')) {
      clearStoredFirebaseConfig();
      window.location.reload();
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(window.location.hostname);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const copyRules = () => {
    const rulesText = `rules_version = '2';\n\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n      match /{allPaths=**} {\n        allow read, write: if request.auth != null && request.auth.uid == userId;\n      }\n    }\n  }\n}`;
    navigator.clipboard.writeText(rulesText);
    setCopyRulesFeedback(true);
    setTimeout(() => setCopyRulesFeedback(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestConnResult(null);
    soundEffects.playSystemBeep();
    try {
      const res = await testFirestoreConnection(player.userId || 'hunter_user');
      setTestConnResult(res);
      if (res.success) {
        soundEffects.playQuestComplete();
      } else {
        soundEffects.playAlertNotice();
      }
    } catch (err: any) {
      setTestConnResult({
        success: false,
        message: formatFirestoreError(err),
      });
      soundEffects.playAlertNotice();
    } finally {
      setIsTestingConn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#030d06] border border-emerald-500/40 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header do Modal */}
        <div className="px-5 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-400/40 text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-slate-100 text-base sm:text-lg tracking-wide uppercase">
                Sincronização & Salvamento
              </h2>
              <p className="text-xs text-slate-400">
                Garantia de persistência total e integração de nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores */}
        <div className="flex border-b border-emerald-500/20 bg-slate-950/60 px-5 pt-2 gap-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Backup Manual (Arquivo)</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'firebase'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Configurar Google / Firebase</span>
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          
          {activeTab === 'backup' && (
            <div className="space-y-4">
              
              {/* Aviso de salvamento local constante */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300/90 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300 block mb-0.5">Salvamento Local Ativo:</strong>
                  Seu progresso (missões, níveis, itens e status) é gravado automaticamente no armazenamento do navegador a cada ação. O backup manual em arquivo garante que você nunca perca nada, mesmo trocando de celular ou limpando os dados.
                </div>
              </div>

              {/* Bloco 1: Exportar */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Progresso Atual</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {quests.length} missões · Nv {player.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Baixe um arquivo <code className="text-emerald-400">.json</code> seguro contendo todos os seus dados. Não gasta cotas de banco de dados e funciona 100% offline.
                </p>
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/60 text-emerald-200 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo de Backup</span>
                </button>
              </div>

              {/* Bloco 2: Importar */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Restaurar / Importar Backup</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Carregue um arquivo <code className="text-amber-400">.json</code> previamente exportado para restaurar ou transferir seus dados em qualquer dispositivo.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-backup-file"
                />

                <label
                  htmlFor="import-backup-file"
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Arquivo JSON</span>
                </label>

                {importFeedback && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      importFeedback.status === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {importFeedback.status === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{importFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Bloco 3: Login Google Rápido */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Conexão Nuvem Google:</span>
                  {isLoggedIn ? (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Conectado ({userEmail})
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Desconectado</span>
                  )}
                </div>

                {isLoggedIn && (
                  <div className="pt-2 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span>Projeto Firebase Ativo:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {currentFirebaseConfig.projectId || 'Padrão'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isSyncingCloud}
                        onClick={async () => {
                          if (!onForcePullFromCloud) return;
                          try {
                            setIsSyncingCloud(true);
                            setCloudSyncMsg('Buscando dados no Firestore...');
                            soundEffects.playSystemBeep();
                            await onForcePullFromCloud();
                            setCloudSyncMsg('✓ Dados baixados da nuvem e restaurados neste aparelho com sucesso!');
                          } catch (err: any) {
                            setCloudSyncMsg(formatFirestoreError(err));
                          } finally {
                            setIsSyncingCloud(false);
                          }
                        }}
                        className="py-2.5 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                        <span>Baixar da Nuvem</span>
                      </button>

                      <button
                        disabled={isSyncingCloud}
                        onClick={async () => {
                          if (!onForceSyncToCloud) return;
                          try {
                            setIsSyncingCloud(true);
                            setCloudSyncMsg('Conectando ao Firestore e gravando progresso...');
                            soundEffects.playSystemBeep();
                            await onForceSyncToCloud();
                            setCloudSyncMsg(`✓ Progresso atual (Nv ${player.level} - ${quests.length} missões) gravado na nuvem!`);
                          } catch (err: any) {
                            setCloudSyncMsg(formatFirestoreError(err));
                          } finally {
                            setIsSyncingCloud(false);
                          }
                        }}
                        className="py-2.5 px-2.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/50 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Cloud className="w-3.5 h-3.5 text-sky-400" />
                        <span>Subir pra Nuvem</span>
                      </button>
                    </div>

                    <button
                      disabled={isTestingConn}
                      onClick={handleTestConnection}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Testando Conexão...' : 'Testar Conexão Direta com Firestore'}</span>
                    </button>

                    {testConnResult && (
                      <div className={`p-2.5 rounded-lg text-xs leading-relaxed flex items-start gap-2 ${
                        testConnResult.success 
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
                          : 'bg-rose-950/70 border border-rose-500/40 text-rose-200'
                      }`}>
                        {testConnResult.success ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <span>{testConnResult.message}</span>
                      </div>
                    )}

                    {cloudSyncMsg && (
                      <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                        cloudSyncMsg.startsWith('✓') 
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300' 
                          : 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                      }`}>
                        {cloudSyncMsg}
                      </div>
                    )}

                    {/* Guia de primeira sincronização */}
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
                      <strong className="text-emerald-300 block">💡 Primeira Sincronização:</strong>
                      <p>
                        Se o seu progresso anterior no GitHub ainda não havia sido gravado no Firebase, basta usar o botão <strong>"Selecionar Arquivo JSON"</strong> acima para carregar o seu backup e depois clicar em <strong>"Subir pra Nuvem"</strong>.
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Assim que o save for enviado para a nuvem uma vez, todos os seus dispositivos (PC e celular) sincronizarão automaticamente via Google!
                      </p>
                    </div>
                  </div>
                )}

                {!isLoggedIn && (
                  <button
                    onClick={() => {
                      soundEffects.playSystemBeep();
                      onTriggerGoogleLogin();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Tentar Fazer Login com o Google Agora</span>
                  </button>
                )}

                {authError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Aviso de Conexão:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-200/90 font-mono">
                      {authError}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Veja a aba <strong>Configurar Google / Firebase</strong> acima para resolver em 1 minuto.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              
              {/* Passo a Passo para o GitHub Pages com Links Diretos */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4" />
                  Links Rápidos no Firebase Console:
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Clique nos atalhos abaixo para abrir diretamente as páginas necessárias no seu Firebase Console:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-between transition-colors"
                  >
                    <span>1. Firebase Console Geral</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  <a
                    href="https://console.firebase.google.com/u/0/project/_/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-between transition-colors"
                  >
                    <span>2. Ativar Provedor Google</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  </a>

                  <a
                    href="https://console.firebase.google.com/u/0/project/_/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-between transition-colors"
                  >
                    <span>3. Authorized Domains</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  </a>

                  <a
                    href="https://console.firebase.google.com/u/0/project/_/settings/general"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-between transition-colors"
                  >
                    <span>4. Ver Config (apiKey / appId)</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  </a>

                  <a
                    href="https://console.firebase.google.com/u/0/project/_/firestore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-between transition-colors col-span-1 sm:col-span-2"
                  >
                    <span>5. Firestore Database (Criar Banco e Regras)</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400 text-[11px]">
                  <p>
                    <strong className="text-slate-200">Domínio a autorizar no passo 3 (Authorized domains):</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-black border border-slate-700 text-emerald-400 font-mono text-[11px]">
                      {window.location.hostname}
                    </code>
                    <button
                      onClick={copyDomain}
                      className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Copiar domínio"
                    >
                      {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copyFeedback ? 'Copiado!' : 'Copiar Domínio'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400 text-[11px]">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-300">Regras do Firestore (Firebase Console &gt; Firestore &gt; Regras):</strong>
                    <button
                      onClick={copyRules}
                      className="p-1 px-2.5 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copyRulesFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{copyRulesFeedback ? 'Copiado!' : 'Copiar Regras'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-black/80 border border-slate-800 font-mono text-[10px] text-emerald-300/90 overflow-x-auto leading-relaxed whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    ⚠️ Se as regras estiverem bloqueando (<code className="text-rose-400">allow read, write: if false;</code>), o Firestore não responderá e gerará timeout. Cole e publique as regras acima.
                  </p>
                </div>
              </div>

              {/* Colar Configuração do Firebase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Colar Objeto <code className="text-emerald-400">firebaseConfig</code> do Firebase:
                  </label>
                  {isFirebaseConfigured && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3 h-3" /> Chaves ativas
                    </span>
                  )}
                </div>

                <textarea
                  value={jsonPaste}
                  onChange={(e) => setJsonPaste(e.target.value)}
                  placeholder={`Cole aqui o código gerado no Firebase Console, por exemplo:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "seu-app.firebaseapp.com",\n  projectId: "seu-app",\n  appId: "1:..."\n};`}
                  className="w-full h-24 p-2.5 rounded-lg bg-black/60 border border-slate-700 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">API Key</label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full p-2 rounded bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Project ID</label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="meu-projeto"
                      className="w-full p-2 rounded bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">App ID</label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1:123456789:web:..."
                      className="w-full p-2 rounded bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Auth Domain (Opcional)</label>
                    <input
                      type="text"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      placeholder="projeto.firebaseapp.com"
                      className="w-full p-2 rounded bg-black/60 border border-slate-800 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSaveFirebaseConfig}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar e Conectar</span>
                  </button>

                  {getStoredFirebaseConfig() && (
                    <button
                      onClick={handleClearConfig}
                      className="p-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs transition-colors cursor-pointer"
                      title="Apagar chaves locais"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {saveSuccessFeedback && (
                  <p className="text-xs text-emerald-400 text-center font-bold animate-pulse">
                    Configurações salvas! Reiniciando conexão...
                  </p>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Footer do Modal */}
        <div className="px-5 py-3 border-t border-emerald-500/20 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>Persistência Gratuita · Zero Estouro de Cota</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
