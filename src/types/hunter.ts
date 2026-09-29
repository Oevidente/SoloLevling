export type PillarType = 'fisico' | 'mental' | 'espiritual';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'Monarca';

export interface PillarStats {
  fisico: number;
  mental: number;
  espiritual: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'buff' | 'pergaminho' | 'relic' | 'titulo';
  rarity: 'comum' | 'raro' | 'epico' | 'lendario';
  description: string;
  effect: string;
  acquiredAt: string;
  isUsed?: boolean;
}

export interface PlayerProfile {
  userId: string;
  name: string;
  hunterRank: HunterRank;
  hunterTitle: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  unassignedPoints: number;
  stats: PillarStats;
  hp: { current: number; max: number };
  mp: { current: number; max: number };
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  inventory: InventoryItem[];
  redemptionUsedToday: boolean;
  lootBoxesAvailable: number;
  updatedAt: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: PillarType;
  xpReward: number;
  statReward: 'fisico' | 'mental' | 'espiritual';
  isCompleted: boolean;
  microStepTip: string; // Dica neurocientífica anti-inércia para TDA
  estimatedMinutes: number;
  isDailyMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}
