import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { TopBar } from './components/TopBar';
import { StatusHud } from './components/StatusHud';
import { InventoryModal } from './components/InventoryModal';
import { RedemptionDungeonModal } from './components/RedemptionDungeonModal';
import { LevelUpModal } from './components/LevelUpModal';
import { LootBoxModal } from './components/LootBoxModal';
import { NewQuestModal } from './components/NewQuestModal';
import { CycleReportModal } from './components/CycleReportModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { SyncConflictModal } from './components/SyncConflictModal';
import { ExpRewardPopup } from './components/ExpRewardPopup';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_DEFAULT_QUESTS } from './data/defaultQuests';
import { PlayerProfile, Quest, PillarType, HunterRank, InventoryItem, ExpRewardEvent } from './types/hunter';
import { soundEffects } from './services/soundEffects';
import { 
  subscribeToAuth, 
  loginWithGoogle, 
  logoutUser, 
  fetchCloudSave, 
  saveCloudSave, 
  GameSaveData 
} from './services/firebase';

const DEFAULT_PLAYER: PlayerProfile = {
  userId: 'local_hunter',
  name: 'Sung Jin-Woo',
  hunterRank: 'E',
  hunterTitle: 'O Despertado da Tríade',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  unassignedPoints: 0,
  stats: {
    fisico: 10,
    mental: 10,
    espiritual: 10,
  },
  hp: { current: 100, max: 100 },
  mp: { current: 50, max: 50 },
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  inventory: [],
  redemptionUsedToday: false,
  lootBoxesAvailable: 1,
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);

  const [currentTab, setCurrentTab] = useState<'status' | 'inventory'>('status');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'local'>('local');

  // Estado do Caçador com Local-First Caching
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('solo_hunter_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLAYER;
  });
  const playerRef = useRef(player);
  playerRef.current = player;

  // Estado das Missões
  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('solo_hunter_quests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DEFAULT_QUESTS.map((q, idx) => ({
      ...q,
      id: `quest_default_${idx}_${Date.now()}`,
      userId: 'local_hunter',
    }));
  });
  const questsRef = useRef(quests);
  questsRef.current = quests;

  // Modais
  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  const [isLootBoxOpen, setIsLootBoxOpen] = useState(false);
  const [isNewQuestOpen, setIsNewQuestOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [newQuestCategory, setNewQuestCategory] = useState<PillarType>('fisico');
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [isCycleReportOpen, setIsCycleReportOpen] = useState(false);
  const [isCloudBackupOpen, setIsCloudBackupOpen] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Sincronização entre dispositivos e resolução de conflitos
  const [pendingCloudData, setPendingCloudData] = useState<GameSaveData | null>(null);
  const [isSyncConflictOpen, setIsSyncConflictOpen] = useState(false);

  // Recompensa de EXP pop-up & Glow de missão
  const [activeExpReward, setActiveExpReward] = useState<ExpRewardEvent | null>(null);
  const [recentlyCompletedQuestId, setRecentlyCompletedQuestId] = useState<string | null>(null);

  // Áudio
  const [isMuted, setIsMuted] = useState(() => soundEffects.getMuted());

  // Debounced cloud sync ref
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncConflictOpenRef = useRef(isSyncConflictOpen);
  isSyncConflictOpenRef.current = isSyncConflictOpen;

  // Sincronização LocalStorage constante
  useEffect(() => {
    try {
      localStorage.setItem('solo_hunter_profile', JSON.stringify(player));
    } catch {}
  }, [player]);

  useEffect(() => {
    try {
      localStorage.setItem('solo_hunter_quests', JSON.stringify(quests));
    } catch {}
  }, [quests]);

  // Executa o sync inicial ao autenticar (protegido contra loops)
  const performInitialSync = useCallback(async (user: User) => {
    try {
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('saving');
      const cloudSave = await fetchCloudSave(user.uid);

      if (cloudSave && cloudSave.player) {
        const currentLocal = playerRef.current;
        const currentQuests = questsRef.current;

        const isLocalDefault = currentLocal.level === 1 && currentLocal.currentXp === 0 && currentLocal.name === 'Sung Jin-Woo';
        const isDifferent = 
          cloudSave.player.level !== currentLocal.level ||
          cloudSave.player.currentXp !== currentLocal.currentXp ||
          cloudSave.player.name !== currentLocal.name ||
          (cloudSave.quests && cloudSave.quests.length !== currentQuests.length);

        if (isLocalDefault && !isDifferent) {
          // Ambos padrão
          setSyncStatus('synced');
        } else if (isDifferent) {
          // Conflito ou novo dispositivo: exibe modal para o usuário decidir
          setPendingCloudData(cloudSave);
          setIsSyncConflictOpen(true);
          setSyncStatus('synced');
        } else {
          setSyncStatus('synced');
        }
      } else {
        // Nuvem sem save: sobe dados locais atuais para criar o primeiro backup
        await saveCloudSave(user.uid, {
          player: playerRef.current,
          quests: questsRef.current,
        });
        setSyncStatus('synced');
      }
    } catch (err) {
      console.warn('Sync inicial não pôde ser completado, mantendo dados locais:', err);
      setSyncStatus('offline');
    }
  }, []);

  // Listener de Autenticação Firebase (Executado apenas 1 vez na montagem)
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      currentUserRef.current = user;

      if (user) {
        performInitialSync(user);
      } else {
        setSyncStatus('local');
      }
    });

    const handleOnline = () => {
      if (currentUserRef.current) {
        performInitialSync(currentUserRef.current);
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performInitialSync]);

  // Salva no Firestore de forma consolidada e espaçada (debounce) para nunca estourar cotas
  const triggerDebouncedSync = (updatedPlayer: PlayerProfile, updatedQuests?: Quest[]) => {
    const activeUser = currentUserRef.current;
    if (!activeUser || isSyncConflictOpenRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('saving');
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await saveCloudSave(activeUser.uid, {
          player: updatedPlayer,
          quests: updatedQuests || questsRef.current,
        });
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Debounced sync mantido em cache local:', err);
        setSyncStatus('offline');
      }
    }, 2500);
  };

  // Escolha 1: Baixar dados da Nuvem
  const handleChooseCloudSave = () => {
    if (!pendingCloudData) return;
    const downloadedPlayer = {
      ...pendingCloudData.player,
      userId: currentUser?.uid || pendingCloudData.player.userId,
    };
    const downloadedQuests = pendingCloudData.quests || [];

    setPlayer(downloadedPlayer);
    setQuests(downloadedQuests);

    try {
      localStorage.setItem('solo_hunter_profile', JSON.stringify(downloadedPlayer));
      localStorage.setItem('solo_hunter_quests', JSON.stringify(downloadedQuests));
    } catch {}

    setIsSyncConflictOpen(false);
    setPendingCloudData(null);
    setSyncStatus('synced');
    soundEffects.playQuestComplete();
  };

  // Escolha 2: Manter dados deste Dispositivo (Sobe para a Nuvem)
  const handleChooseLocalSave = async () => {
    const activeUser = currentUserRef.current;
    if (!activeUser) return;
    try {
      setSyncStatus('saving');
      await saveCloudSave(activeUser.uid, { player, quests });
      setSyncStatus('synced');
      setIsSyncConflictOpen(false);
      setPendingCloudData(null);
      soundEffects.playLevelUp();
    } catch (err) {
      console.warn('Erro ao enviar dados locais para a nuvem:', err);
      setSyncStatus('offline');
      setIsSyncConflictOpen(false);
    }
  };

  // Forçar Baixar da Nuvem manualmente pelo modal de Backup
  const handleForcePullFromCloud = async () => {
    const activeUser = currentUserRef.current;
    if (!activeUser) return;
    setSyncStatus('saving');
    const cloudSave = await fetchCloudSave(activeUser.uid);
    if (!cloudSave || !cloudSave.player) {
      throw new Error('Nenhum save encontrado na nuvem para esta conta.');
    }
    const downloadedPlayer = { ...cloudSave.player, userId: activeUser.uid };
    const downloadedQuests = cloudSave.quests || [];
    setPlayer(downloadedPlayer);
    setQuests(downloadedQuests);
    try {
      localStorage.setItem('solo_hunter_profile', JSON.stringify(downloadedPlayer));
      localStorage.setItem('solo_hunter_quests', JSON.stringify(downloadedQuests));
    } catch {}
    setSyncStatus('synced');
  };

  // Forçar Enviar para Nuvem manualmente pelo modal de Backup
  const handleForceSyncToCloud = async () => {
    const activeUser = currentUserRef.current;
    if (!activeUser) return;
    setSyncStatus('saving');
    await saveCloudSave(activeUser.uid, { player, quests });
    setSyncStatus('synced');
  };

  // Cálculo dinâmico de Rank
  const calculateRank = (level: number): HunterRank => {
    if (level >= 50) return 'Monarca';
    if (level >= 35) return 'S';
    if (level >= 25) return 'A';
    if (level >= 15) return 'B';
    if (level >= 8) return 'C';
    if (level >= 3) return 'D';
    return 'E';
  };

  // Completar Missão
  const handleToggleQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    if (quest.isCompleted) {
      soundEffects.playAlertNotice();
      return;
    }

    const willBeCompleted = true;

    const updatedQuests = quests.map((q) => {
      if (q.id === questId) {
        return {
          ...q,
          isCompleted: willBeCompleted,
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    setQuests(updatedQuests);
    soundEffects.playQuestComplete();

    setRecentlyCompletedQuestId(questId);
    setTimeout(() => {
      setRecentlyCompletedQuestId((prev) => (prev === questId ? null : prev));
    }, 2500);

    let newXp = player.currentXp + quest.xpReward;
    let newLevel = player.level;
    let newNextXp = player.nextLevelXp;
    let newUnassigned = player.unassignedPoints;
    let leveledUp = false;

    const newStats = { ...player.stats };
    newStats[quest.category] += 1;

    setActiveExpReward({
      id: `${quest.id}_${Date.now()}`,
      questTitle: quest.title,
      category: quest.category,
      xpEarned: quest.xpReward,
      statRewardName: quest.category === 'fisico' ? 'Físico' : quest.category === 'mental' ? 'Mental' : 'Espiritual',
      currentXp: newXp,
      nextLevelXp: newNextXp,
      timestamp: Date.now(),
    });

    while (newXp >= newNextXp) {
      leveledUp = true;
      newXp -= newNextXp;
      newLevel += 1;
      newNextXp = Math.round(newNextXp * 1.35);
      newUnassigned += 3;
    }

    const updatedPlayer: PlayerProfile = {
      ...player,
      level: newLevel,
      currentXp: newXp,
      nextLevelXp: newNextXp,
      unassignedPoints: newUnassigned,
      hunterRank: calculateRank(newLevel),
      stats: newStats,
      hp: { ...player.hp, current: Math.min(player.hp.max, player.hp.current + 10) },
      mp: { ...player.mp, current: Math.min(player.mp.max, player.mp.current + 10) },
      updatedAt: new Date().toISOString(),
    };

    if (leveledUp) {
      setPreviousLevel(player.level);
      soundEffects.playLevelUp();
      setIsLevelUpOpen(true);
      updatedPlayer.lootBoxesAvailable += 1;
    }

    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer, updatedQuests);
  };

  // Renovar Ciclo Diário
  const handleRenewDay = () => {
    const completedCount = quests.filter((q) => q.isCompleted).length;
    const isSuccessDay = completedCount >= 3;

    const resetQuests = quests.map((q) => ({
      ...q,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    }));

    setQuests(resetQuests);

    const updatedPlayer: PlayerProfile = {
      ...player,
      streakDays: isSuccessDay ? player.streakDays + 1 : player.streakDays,
      redemptionUsedToday: false,
      hp: { current: player.hp.max, max: player.hp.max },
      mp: { current: player.mp.max, max: player.mp.max },
      lastActiveDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer, resetQuests);
  };

  // Completar Masmorra de Redenção
  const handleCompleteRedemption = () => {
    const updatedPlayer: PlayerProfile = {
      ...player,
      redemptionUsedToday: true,
      lootBoxesAvailable: player.lootBoxesAvailable + 1,
      hp: { current: player.hp.max, max: player.hp.max },
      mp: { current: player.mp.max, max: player.mp.max },
      currentXp: player.currentXp + 25,
      updatedAt: new Date().toISOString(),
    };

    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer);
  };

  // Resgatar Item do Baú
  const handleClaimLoot = (item: InventoryItem) => {
    let bonusXp = 0;
    if (item.name.includes('+50 XP')) bonusXp = 50;
    if (item.name.includes('+75 XP')) bonusXp = 75;
    if (item.name.includes('+100 XP')) bonusXp = 100;
    if (item.name.includes('+150 XP')) bonusXp = 150;

    let newXp = player.currentXp + bonusXp;
    let newLevel = player.level;
    let newNextXp = player.nextLevelXp;
    let newUnassigned = player.unassignedPoints;

    while (newXp >= newNextXp) {
      newXp -= newNextXp;
      newLevel += 1;
      newNextXp = Math.round(newNextXp * 1.35);
      newUnassigned += 3;
    }

    const updatedPlayer: PlayerProfile = {
      ...player,
      level: newLevel,
      currentXp: newXp,
      nextLevelXp: newNextXp,
      unassignedPoints: newUnassigned,
      hunterRank: calculateRank(newLevel),
      lootBoxesAvailable: Math.max(0, player.lootBoxesAvailable - 1),
      inventory: [item, ...player.inventory],
      updatedAt: new Date().toISOString(),
    };

    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer);
  };

  // Utilizar item do inventário
  const handleUseItem = (itemId: string) => {
    const targetItem = player.inventory.find((i) => i.id === itemId);
    if (!targetItem || targetItem.isUsed) return;

    let bonusXp = 0;
    if (targetItem.name.includes('+50 XP')) bonusXp = 50;
    else if (targetItem.name.includes('+75 XP')) bonusXp = 75;
    else if (targetItem.name.includes('+100 XP')) bonusXp = 100;
    else if (targetItem.name.includes('+150 XP')) bonusXp = 150;

    let newXp = player.currentXp + bonusXp;
    let newLevel = player.level;
    let newNextXp = player.nextLevelXp;
    let newUnassigned = player.unassignedPoints;
    let leveledUp = false;

    while (newXp >= newNextXp) {
      leveledUp = true;
      newXp -= newNextXp;
      newLevel += 1;
      newNextXp = Math.round(newNextXp * 1.35);
      newUnassigned += 3;
    }

    const updatedInventory = player.inventory.map((item) => {
      if (item.id === itemId) {
        return { ...item, isUsed: true };
      }
      return item;
    });

    if (bonusXp > 0) {
      setActiveExpReward({
        id: `item_${itemId}_${Date.now()}`,
        questTitle: `Item: ${targetItem.name}`,
        category: 'mental',
        xpEarned: bonusXp,
        statRewardName: 'Recompensa do Baú',
        currentXp: newXp,
        nextLevelXp: newNextXp,
        timestamp: Date.now(),
      });
    }

    const updatedPlayer: PlayerProfile = {
      ...player,
      level: newLevel,
      currentXp: newXp,
      nextLevelXp: newNextXp,
      unassignedPoints: newUnassigned,
      hunterRank: calculateRank(newLevel),
      hp: { current: player.hp.max, max: player.hp.max },
      mp: { current: player.mp.max, max: player.mp.max },
      inventory: updatedInventory,
      updatedAt: new Date().toISOString(),
    };

    if (leveledUp) {
      setPreviousLevel(player.level);
      soundEffects.playLevelUp();
      setIsLevelUpOpen(true);
      updatedPlayer.lootBoxesAvailable += 1;
    } else {
      soundEffects.playQuestComplete();
    }

    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer);
  };

  // Alterar Título do Caçador
  const handleSetTitle = (newTitle: string) => {
    const updatedPlayer: PlayerProfile = {
      ...player,
      hunterTitle: newTitle,
      updatedAt: new Date().toISOString(),
    };
    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer);
  };

  // Alterar Nome do Caçador
  const handleChangeName = (newName: string) => {
    const updatedPlayer: PlayerProfile = {
      ...player,
      name: newName,
      updatedAt: new Date().toISOString(),
    };
    setPlayer(updatedPlayer);
    triggerDebouncedSync(updatedPlayer);
  };

  // Login com Google
  const handleLogin = async () => {
    try {
      setAuthErrorMessage(null);
      soundEffects.playSystemBeep();
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err?.message || 'Falha ao autenticar com o Google.';
      setAuthErrorMessage(msg);
      setIsCloudBackupOpen(true);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      soundEffects.playSystemBeep();
      await logoutUser();
      setCurrentUser(null);
      currentUserRef.current = null;
      setSyncStatus('local');
    } catch (err) {
      console.error('Falha ao desconectar:', err);
    }
  };

  // Áudio Mute
  const handleToggleMute = () => {
    const newState = soundEffects.toggleMute();
    setIsMuted(newState);
  };

  // Abrir Modal de Nova Missão para um pilar específico
  const handleOpenNewQuestModal = (category: PillarType = 'fisico') => {
    setEditingQuest(null);
    setNewQuestCategory(category);
    setIsNewQuestOpen(true);
  };

  // Abrir Modal de Edição de Missão
  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setNewQuestCategory(quest.category);
    setIsNewQuestOpen(true);
  };

  // Atualizar Missão Existente
  const handleUpdateQuest = (updatedQuest: Quest) => {
    const updatedQuests = quests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q));
    setQuests(updatedQuests);
    triggerDebouncedSync(player, updatedQuests);
  };

  // Adicionar Nova Missão
  const handleAddQuest = (newQuestData: Omit<Quest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const activeUser = currentUserRef.current;
    const newQuest: Quest = {
      ...newQuestData,
      id: `quest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: activeUser?.uid || 'local_hunter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedQuests = [newQuest, ...quests];
    setQuests(updatedQuests);
    triggerDebouncedSync(player, updatedQuests);
  };

  // Deletar Missão
  const handleDeleteQuest = (questId: string) => {
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);
    triggerDebouncedSync(player, updatedQuests);
  };

  return (
    <div className="min-h-screen solo-leveling-bg text-slate-100 flex flex-col font-sans scanline-effect">
      
      {/* Top Bar com indicador de Sync sem travamentos */}
      <TopBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openRedemption={() => setIsRedemptionOpen(true)}
        openLootBox={() => setIsLootBoxOpen(true)}
        openCycleReport={() => setIsCycleReportOpen(true)}
        lootBoxesCount={player.lootBoxesAvailable}
        inventoryCount={player.inventory.length}
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenCloudBackup={() => setIsCloudBackupOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        syncStatus={syncStatus}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28 md:pb-8 space-y-6">
        
        {currentTab === 'status' && (
          <StatusHud
            player={player}
            quests={quests}
            recentlyCompletedQuestId={recentlyCompletedQuestId}
            onToggleQuest={handleToggleQuest}
            onDeleteQuest={handleDeleteQuest}
            onEditQuest={handleEditQuest}
            onOpenNewQuestModal={handleOpenNewQuestModal}
            onRenewDay={handleRenewDay}
            onChangeName={handleChangeName}
            onChangeTitle={handleSetTitle}
            onOpenLootBox={() => setIsLootBoxOpen(true)}
            onOpenCycleReport={() => setIsCycleReportOpen(true)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryModal
            inventory={player.inventory}
            onUseItem={handleUseItem}
            onSetTitle={handleSetTitle}
            onBackToStatus={() => setCurrentTab('status')}
          />
        )}

      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-emerald-500/15 py-5 pb-24 md:pb-5 text-center text-xs text-slate-500">
        <p>System: Solo Leveling · Gamificação dos 3 Pilares com Neurociência para TDA</p>
      </footer>

      {/* Barra de Navegação Inferior Móvel (Exclusiva Mobile: md:hidden) */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openRedemption={() => setIsRedemptionOpen(true)}
        openCycleReport={() => setIsCycleReportOpen(true)}
        onOpenNewQuest={() => handleOpenNewQuestModal('fisico')}
        inventoryCount={player.inventory.length}
      />

      {/* Indicador de Status Offline do PWA */}
      <OfflineIndicator />

      {/* Modal de Conflito de Sincronização entre Nuvem e Dispositivo */}
      <SyncConflictModal
        isOpen={isSyncConflictOpen}
        cloudData={pendingCloudData}
        localPlayer={player}
        localQuests={quests}
        onChooseCloud={handleChooseCloudSave}
        onChooseLocal={handleChooseLocalSave}
      />

      {/* Modais Globais */}
      <RedemptionDungeonModal
        isOpen={isRedemptionOpen}
        onClose={() => setIsRedemptionOpen(false)}
        onCompleteRedemption={handleCompleteRedemption}
      />

      <LevelUpModal
        isOpen={isLevelUpOpen}
        onClose={() => setIsLevelUpOpen(false)}
        player={player}
        previousLevel={previousLevel}
      />

      <LootBoxModal
        isOpen={isLootBoxOpen}
        onClose={() => setIsLevelUpOpen(false)}
        onClaimItem={handleClaimLoot}
        availableBoxes={player.lootBoxesAvailable}
        onOpenInventory={() => setCurrentTab('inventory')}
      />

      <NewQuestModal
        isOpen={isNewQuestOpen}
        onClose={() => {
          setIsNewQuestOpen(false);
          setEditingQuest(null);
        }}
        onAddQuest={handleAddQuest}
        onUpdateQuest={handleUpdateQuest}
        onDeleteQuest={handleDeleteQuest}
        questToEdit={editingQuest}
        initialCategory={newQuestCategory}
      />

      <CycleReportModal
        isOpen={isCycleReportOpen}
        onClose={() => setIsCycleReportOpen(false)}
        player={player}
        quests={quests}
      />

      <CloudBackupModal
        isOpen={isCloudBackupOpen}
        onClose={() => setIsCloudBackupOpen(false)}
        player={player}
        quests={quests}
        onImportData={(importedPlayer, importedQuests) => {
          setPlayer(importedPlayer);
          setQuests(importedQuests);
          triggerDebouncedSync(importedPlayer, importedQuests);
        }}
        onTriggerGoogleLogin={handleLogin}
        isLoggedIn={Boolean(currentUser)}
        userEmail={currentUser?.email}
        authError={authErrorMessage}
        onForcePullFromCloud={handleForcePullFromCloud}
        onForceSyncToCloud={handleForceSyncToCloud}
      />

      {/* Pop-up de Recompensa de EXP (Auto-fecha após 5s) */}
      <ExpRewardPopup
        reward={activeExpReward}
        onClose={() => setActiveExpReward(null)}
      />

    </div>
  );
}
