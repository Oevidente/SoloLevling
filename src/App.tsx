import React, { useState, useEffect, useRef } from 'react';
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
import { ExpRewardPopup } from './components/ExpRewardPopup';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_DEFAULT_QUESTS } from './data/defaultQuests';
import { PlayerProfile, Quest, PillarType, HunterRank, InventoryItem, ExpRewardEvent } from './types/hunter';
import { soundEffects } from './services/soundEffects';
import { normalizeQuestExp } from './utils/questUtils';
import { 
  subscribeToAuth, 
  loginWithGoogle, 
  logoutUser, 
  getCachedAccessToken,
  setCachedAccessToken
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
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());

  const [currentTab, setCurrentTab] = useState<'status' | 'inventory'>('status');

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
      if (saved) {
        const parsed: Quest[] = JSON.parse(saved);
        return parsed.map((q) => ({
          ...q,
          xpReward: normalizeQuestExp(q.xpReward),
        }));
      }
    } catch {}
    return INITIAL_DEFAULT_QUESTS.map((q, idx) => ({
      ...q,
      xpReward: normalizeQuestExp(q.xpReward),
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

  // Recompensa de EXP pop-up & Glow de missão
  const [activeExpReward, setActiveExpReward] = useState<ExpRewardEvent | null>(null);
  const [recentlyCompletedQuestId, setRecentlyCompletedQuestId] = useState<string | null>(null);

  // Áudio
  const [isMuted, setIsMuted] = useState(() => soundEffects.getMuted());

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

  // Listener de Autenticação Google
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user, token) => {
      setCurrentUser(user);
      setAccessToken(token);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Login com Google
  const handleLogin = async () => {
    try {
      soundEffects.playSystemBeep();
      const result = await loginWithGoogle();
      setCurrentUser(result.user);
      setAccessToken(result.accessToken);
      setCachedAccessToken(result.accessToken);
      soundEffects.playQuestComplete();
      setIsCloudBackupOpen(true);
    } catch (err: any) {
      console.warn('Login com Google cancelado ou com erro:', err);
    }
  };

  // Logout
  const handleLogout = async () => {
    soundEffects.playSystemBeep();
    await logoutUser();
    setCurrentUser(null);
    setAccessToken(null);
    setCachedAccessToken(null);
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
  };

  // Reivindicar Item do Loot Box
  const handleClaimLoot = (item: InventoryItem) => {
    setPlayer((prev) => ({
      ...prev,
      lootBoxesAvailable: Math.max(0, prev.lootBoxesAvailable - 1),
      inventory: [item, ...prev.inventory],
      updatedAt: new Date().toISOString(),
    }));
  };

  // Usar item do Inventário
  const handleUseItem = (itemId: string) => {
    const item = player.inventory.find((i) => i.id === itemId);
    if (!item) return;

    soundEffects.playStatUpgrade();

    let xpGain = 0;
    if (item.name.includes('+50 XP')) xpGain = 50;
    else if (item.name.includes('+75 XP')) xpGain = 75;
    else if (item.name.includes('+100 XP')) xpGain = 100;
    else if (item.name.includes('+150 XP')) xpGain = 150;

    setPlayer((prev) => {
      let newXp = prev.currentXp + xpGain;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;
      let newUnassigned = prev.unassignedPoints;

      while (newXp >= newNextXp) {
        newXp -= newNextXp;
        newLevel += 1;
        newNextXp = Math.round(newNextXp * 1.35);
        newUnassigned += 3;
      }

      const updatedInventory = prev.inventory.filter((inv) => inv.id !== itemId);

      return {
        ...prev,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp: newNextXp,
        unassignedPoints: newUnassigned,
        hunterRank: calculateRank(newLevel),
        inventory: updatedInventory,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Equipar / Mudar Título do Caçador
  const handleSetTitle = (title: string) => {
    soundEffects.playSystemBeep();
    setPlayer((prev) => ({
      ...prev,
      hunterTitle: title,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Mudar Nome do Caçador
  const handleChangeName = (newName: string) => {
    soundEffects.playSystemBeep();
    setPlayer((prev) => ({
      ...prev,
      name: newName,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Concluir Dungeon de Redenção
  const handleCompleteRedemption = () => {
    soundEffects.playLevelUp();
    setPlayer((prev) => ({
      ...prev,
      redemptionUsedToday: true,
      streakDays: prev.streakDays + 1,
      hp: { ...prev.hp, current: prev.hp.max },
      mp: { ...prev.mp, current: prev.mp.max },
      updatedAt: new Date().toISOString(),
    }));
    setIsRedemptionOpen(false);
  };

  // Renovar Ciclo Diário
  const handleRenewDay = () => {
    soundEffects.playSystemBeep();
    const todayStr = new Date().toISOString().split('T')[0];

    const resetQuests = quests.map((q) => ({
      ...q,
      isCompleted: false,
      updatedAt: new Date().toISOString(),
    }));

    setQuests(resetQuests);
    setPlayer((prev) => ({
      ...prev,
      lastActiveDate: todayStr,
      redemptionUsedToday: false,
      hp: { ...prev.hp, current: prev.hp.max },
      mp: { ...prev.mp, current: prev.mp.max },
      updatedAt: new Date().toISOString(),
    }));
  };

  // Alternar Mudo
  const handleToggleMute = () => {
    const newState = soundEffects.toggleMute();
    setIsMuted(newState);
  };

  // Abrir Modal de Nova Missão
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
    const sanitized: Quest = {
      ...updatedQuest,
      xpReward: normalizeQuestExp(updatedQuest.xpReward),
    };
    const updatedQuests = quests.map((q) => (q.id === sanitized.id ? sanitized : q));
    setQuests(updatedQuests);
  };

  // Adicionar Nova Missão
  const handleAddQuest = (newQuestData: Omit<Quest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newQuest: Quest = {
      ...newQuestData,
      xpReward: normalizeQuestExp(newQuestData.xpReward),
      id: `quest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: currentUser?.uid || 'local_hunter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedQuests = [newQuest, ...quests];
    setQuests(updatedQuests);
  };

  // Deletar Missão
  const handleDeleteQuest = (questId: string) => {
    const updatedQuests = quests.filter((q) => q.id !== questId);
    setQuests(updatedQuests);
  };

  // Importar Dados (Restaurar do Drive ou JSON)
  const handleImportData = (importedPlayer: PlayerProfile, importedQuests: Quest[]) => {
    const normalizedQuests = importedQuests.map((q) => ({
      ...q,
      xpReward: normalizeQuestExp(q.xpReward),
    }));
    setPlayer(importedPlayer);
    setQuests(normalizedQuests);
    try {
      localStorage.setItem('solo_hunter_profile', JSON.stringify(importedPlayer));
      localStorage.setItem('solo_hunter_quests', JSON.stringify(normalizedQuests));
    } catch {}
  };

  return (
    <div className="min-h-screen solo-leveling-bg text-slate-100 flex flex-col font-sans scanline-effect">
      
      {/* Top Bar */}
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
        onImportData={handleImportData}
        onTriggerGoogleLogin={handleLogin}
        onTriggerGoogleLogout={handleLogout}
        isLoggedIn={Boolean(currentUser)}
        userEmail={currentUser?.email}
        userName={currentUser?.displayName}
        userPhoto={currentUser?.photoURL}
        accessToken={accessToken}
      />

      {/* Pop-up de Recompensa de EXP */}
      <ExpRewardPopup
        reward={activeExpReward}
        onClose={() => setActiveExpReward(null)}
      />

    </div>
  );
}
