import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { PlayerProfile, Quest, PillarType, InventoryItem, HunterRank, ExpRewardEvent } from './types/hunter';
import { INITIAL_DEFAULT_QUESTS } from './data/defaultQuests';
import { soundEffects } from './services/soundEffects';
import {
  subscribeToAuth,
  loginWithGoogle,
  logoutUser,
  loadPlayerFromFirestore,
  savePlayerToFirestore,
  loadQuestsFromFirestore,
  saveQuestToFirestore,
  batchSaveQuestsToFirestore,
  deleteQuestFromFirestore,
} from './services/firebase';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StatusHud } from './components/StatusHud';
import { RedemptionDungeonModal } from './components/RedemptionDungeonModal';
import { LevelUpModal } from './components/LevelUpModal';
import { LootBoxModal } from './components/LootBoxModal';
import { InventoryModal } from './components/InventoryModal';
import { NewQuestModal } from './components/NewQuestModal';
import { CycleReportModal } from './components/CycleReportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CloudBackupModal } from './components/CloudBackupModal';
import { ExpRewardPopup } from './components/ExpRewardPopup';

const DEFAULT_PLAYER: PlayerProfile = {
  userId: 'local_hunter',
  name: 'Alex Albuquerque Belo Neto',
  hunterRank: 'E',
  hunterTitle: 'Desenvolvedor / Monarca da Resiliência',
  level: 2,
  currentXp: 300,
  nextLevelXp: 1200,
  unassignedPoints: 0,
  stats: {
    fisico: 10,
    mental: 10,
    espiritual: 10,
  },
  hp: { current: 100, max: 100 },
  mp: { current: 100, max: 100 },
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  inventory: [],
  redemptionUsedToday: false,
  lootBoxesAvailable: 1,
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<'status' | 'inventory'>('status');

  // Estado do Caçador com Local-First Caching (Poupando cota de leitura/gravação)
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('solo_hunter_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLAYER;
  });

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

  // Recompensa de EXP pop-up & Glow de missão
  const [activeExpReward, setActiveExpReward] = useState<ExpRewardEvent | null>(null);
  const [recentlyCompletedQuestId, setRecentlyCompletedQuestId] = useState<string | null>(null);

  // Áudio
  const [isMuted, setIsMuted] = useState(() => soundEffects.getMuted());

  // Debounced cloud sync ref
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Listener de Autenticação Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudPlayer = await loadPlayerFromFirestore(user.uid);
          if (cloudPlayer) {
            setPlayer(cloudPlayer);
          } else {
            await savePlayerToFirestore(user.uid, { ...player, userId: user.uid });
          }

          const cloudQuests = await loadQuestsFromFirestore(user.uid);
          if (cloudQuests && cloudQuests.length > 0) {
            setQuests(cloudQuests);
          } else {
            const userQuests = quests.map((q) => ({ ...q, userId: user.uid }));
            await batchSaveQuestsToFirestore(user.uid, userQuests);
            setQuests(userQuests);
          }
        } catch (err) {
          console.error('Erro na sincronização inicial do Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Salva no Firestore de forma espaçada (debounce) para nunca estourar cotas
  const triggerDebouncedSync = (updatedPlayer: PlayerProfile, updatedQuests?: Quest[]) => {
    if (!currentUser) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await savePlayerToFirestore(currentUser.uid, updatedPlayer);
        if (updatedQuests) {
          await batchSaveQuestsToFirestore(currentUser.uid, updatedQuests);
        }
      } catch (err) {
        console.error('Falha ao sincronizar com Firestore:', err);
      }
    }, 2000);
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

  // Completar Missão (com trava de ciclo anti-repetição)
  const handleToggleQuest = (questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;

    // Se já foi cumprida neste ciclo, bloqueia para evitar repetição/farming indevido no mesmo dia
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

    // Dispara animação de brilho no card de missão recém-concluída
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

    // Dispara o Pop-up de EXP (fecha sozinho em 5 segundos)
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

  // Renovar Ciclo Diário (Destrava as missões para o novo dia)
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
      // Abre o modal diretamente na aba de configuração do Firebase para o usuário colar suas chaves ou usar backup manual
      setIsCloudBackupOpen(true);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      soundEffects.playSystemBeep();
      await logoutUser();
      setCurrentUser(null);
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

    if (currentUser) {
      saveQuestToFirestore(currentUser.uid, updatedQuest).catch(console.error);
    }
  };

  // Adicionar Nova Missão
  const handleAddQuest = (newQuestData: Omit<Quest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newQuest: Quest = {
      ...newQuestData,
      id: `quest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser?.uid || 'local_hunter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedQuests = [newQuest, ...quests];
    setQuests(updatedQuests);

    if (currentUser) {
      saveQuestToFirestore(currentUser.uid, newQuest).catch(console.error);
    }
  };

  // Deletar Missão
  const handleDeleteQuest = (questId: string) => {
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);

    if (currentUser) {
      deleteQuestFromFirestore(currentUser.uid, questId).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen solo-leveling-bg text-slate-100 flex flex-col font-sans scanline-effect">
      
      {/* Top Bar seguindo o contrato oficial */}
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
      />

      {/* Main Viewport com padding inferior seguro para a barra mobile */}
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

      {/* Footer minimalista sem telemetria fake */}
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
        onClose={() => setIsLootBoxOpen(false)}
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
      />

      {/* Pop-up de Recompensa de EXP (Auto-fecha após 5s) */}
      <ExpRewardPopup
        reward={activeExpReward}
        onClose={() => setActiveExpReward(null)}
      />

    </div>
  );
}
