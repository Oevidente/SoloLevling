import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { PlayerProfile, Quest } from '../types/hunter';

export interface FirebaseCustomConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export interface GameSaveData {
  player: PlayerProfile;
  quests: Quest[];
  updatedAt: string;
  version: number;
  deviceLabel?: string;
}

const LOCAL_STORAGE_FIREBASE_KEY = 'sololeveling_custom_firebase_config';

export function getStoredFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FIREBASE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Erro ao ler custom firebase config do localStorage:', err);
  }
  return null;
}

export function saveStoredFirebaseConfig(config: FirebaseCustomConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_FIREBASE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Erro ao salvar custom firebase config no localStorage:', err);
  }
}

export function clearStoredFirebaseConfig() {
  localStorage.removeItem(LOCAL_STORAGE_FIREBASE_KEY);
}

// Resolução de credenciais: LocalStorage -> Vite env vars
const userCustom = getStoredFirebaseConfig();

const activeConfig: FirebaseCustomConfig = {
  projectId: userCustom?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: userCustom?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  apiKey: userCustom?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: userCustom?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  firestoreDatabaseId: userCustom?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '',
  storageBucket: userCustom?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: userCustom?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
};

export const isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
  activeConfig.apiKey.length > 5 &&
  activeConfig.projectId &&
  activeConfig.projectId !== 'MY_PROJECT_ID'
);

// Inicialização segura do Firebase
let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      appInstance = initializeApp({
        projectId: activeConfig.projectId,
        appId: activeConfig.appId,
        apiKey: activeConfig.apiKey,
        authDomain: activeConfig.authDomain || `${activeConfig.projectId}.firebaseapp.com`,
        storageBucket: activeConfig.storageBucket,
        messagingSenderId: activeConfig.messagingSenderId,
      });
    } else {
      appInstance = getApp();
    }

    if (activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)') {
      dbInstance = getFirestore(appInstance, activeConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(appInstance);
    }

    authInstance = getAuth(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (err) {
    console.warn('Erro ao inicializar Firebase:', err);
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const currentFirebaseConfig = activeConfig;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// AUTENTICAÇÃO COM GOOGLE
// ==========================================
export async function loginWithGoogle(): Promise<User | null> {
  if (!auth || !googleProvider) {
    throw new Error('CONFIG_REQUIRED: As chaves do Firebase ainda não foram configuradas. Abra as Configurações de Conexão no topo.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error(`DOMINIO_NAO_AUTORIZADO: Este domínio (${window.location.hostname}) não está na lista de "Authorized domains" do seu Firebase Console (Authentication > Settings > Authorized domains).`);
    } else if (error?.code === 'auth/popup-blocked') {
      throw new Error('POPUP_BLOQUEADO: O navegador bloqueou o pop-up de login do Google. Permita pop-ups para este site e tente novamente.');
    } else if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      throw new Error('POPUP_FECHADO: A janela de login do Google foi fechada antes de concluir.');
    } else if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('PROVEDOR_DESATIVADO: O provedor Google não foi ativado no Firebase Console (Authentication > Sign-in method > Google).');
    }
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ==========================================
// SINCRONIZAÇÃO COMPLETA DE ALTA EFICIÊNCIA
// Poupa cotas: 1 leitura ao abrir / 1 gravação por alteração debounced
// ==========================================

/**
 * Busca o save consolidado do jogador na nuvem (documento único users/{userId}/game/data)
 */
export async function fetchCloudSave(userId: string): Promise<GameSaveData | null> {
  if (!db) return null;
  const path = `users/${userId}/game/data`;
  try {
    // 1. Tenta buscar no documento consolidado moderno
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    const snap = await getDoc(gameDocRef);
    if (snap.exists()) {
      const data = snap.data() as GameSaveData;
      return data;
    }

    // 2. Fallback de compatibilidade caso o save antigo estivesse solto em users/{userId}
    const legacyDocRef = doc(db, 'users', userId);
    const legacySnap = await getDoc(legacyDocRef);
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data() as any;
      if (legacyData.level || legacyData.stats) {
        // Busca quests legadas
        const legacyQuests = await loadQuestsFromFirestore(userId);
        return {
          player: legacyData as PlayerProfile,
          quests: legacyQuests,
          updatedAt: legacyData.updatedAt || new Date().toISOString(),
          version: 1,
        };
      }
    }

    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Salva o jogo completo na nuvem em 1 único documento (máxima economia de cota)
 */
export async function saveCloudSave(userId: string, data: { player: PlayerProfile; quests: Quest[] }): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/game/data`;
  try {
    const saveData: GameSaveData = {
      player: {
        ...data.player,
        userId,
      },
      quests: data.quests.map((q) => ({ ...q, userId })),
      updatedAt: new Date().toISOString(),
      version: 2,
    };

    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    await setDoc(gameDocRef, saveData);

    // Atualiza resumo básico no nó do usuário para metadados rápidos
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      userId,
      name: data.player.name,
      level: data.player.level,
      hunterRank: data.player.hunterRank,
      currentXp: data.player.currentXp,
      updatedAt: saveData.updatedAt,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// LEGACY HELPERS (Para compatibilidade retroativa)
// ==========================================

export async function loadPlayerFromFirestore(userId: string): Promise<PlayerProfile | null> {
  const save = await fetchCloudSave(userId);
  return save ? save.player : null;
}

export async function savePlayerToFirestore(userId: string, profile: PlayerProfile): Promise<void> {
  if (!db) return;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, {
      ...profile,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadQuestsFromFirestore(userId: string): Promise<Quest[]> {
  if (!db) return [];
  const path = `users/${userId}/quests`;
  try {
    const colRef = collection(db, 'users', userId, 'quests');
    const snap = await getDocs(colRef);
    const quests: Quest[] = [];
    snap.forEach((docItem) => {
      quests.push({ ...docItem.data(), id: docItem.id } as Quest);
    });
    return quests;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function batchSaveQuestsToFirestore(userId: string, quests: Quest[]): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/quests`;
  try {
    const batch = writeBatch(db);
    quests.forEach((quest) => {
      const docRef = doc(db, 'users', userId, 'quests', quest.id);
      batch.set(docRef, {
        ...quest,
        userId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestFromFirestore(userId: string, questId: string): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/quests/${questId}`;
  try {
    const docRef = doc(db, 'users', userId, 'quests', questId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
