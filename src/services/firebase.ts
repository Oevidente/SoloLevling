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

// Helper para evitar bloqueios infinitos nas requisições do Firestore
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000, fallbackVal?: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fallbackVal !== undefined) {
          resolve(fallbackVal);
        } else {
          reject(new Error('TIMEOUT_EXCEEDED: Operação com Firestore excedeu o tempo limite.'));
        }
      }, timeoutMs);
    }),
  ]);
}

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

    // A base padrão no Firebase Firestore é sempre (default).
    // Previne erros ao tentar conectar a IDs inválidos que deixam o cliente offline.
    const customDb = activeConfig.firestoreDatabaseId;
    if (customDb && customDb !== '(default)' && !customDb.startsWith('ai-studio-')) {
      try {
        dbInstance = getFirestore(appInstance, customDb);
      } catch {
        dbInstance = getFirestore(appInstance);
      }
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

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('client is offline') ||
    msg.includes('TIMEOUT_EXCEEDED') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isOffline = isOfflineError(error);
  const errMsg = error instanceof Error ? error.message : String(error);
  
  if (isOffline) {
    console.info(`[Firestore: Offline/Timeout] Operação ${operationType} em ${path || 'doc'}.`);
    return;
  }
  
  console.warn(`[Firestore: Aviso] Operação ${operationType} em ${path || 'doc'}:`, errMsg);
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
// Busca em múltiplos caminhos de compatibilidade (moderno, legado, email)
// ==========================================

/**
 * Busca o save do jogador no Firestore.
 * Verifica caminho moderno: users/{userId}/game/data
 * Fallbacks de compatibilidade: users/{userId}, users/{email}, players/{userId}
 */
export async function fetchCloudSave(userId: string, userEmail?: string | null): Promise<GameSaveData | null> {
  if (!db) return null;

  // 1. Caminho moderno consolidado
  try {
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    const snap = await withTimeout(getDoc(gameDocRef), 4000);
    if (snap && snap.exists()) {
      const data = snap.data() as GameSaveData;
      if (data && data.player) {
        return data;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}/game/data`);
  }

  // 2. Caminho legado direto users/{userId}
  try {
    const legacyDocRef = doc(db, 'users', userId);
    const legacySnap = await withTimeout(getDoc(legacyDocRef), 3500);
    if (legacySnap && legacySnap.exists()) {
      const legacyData = legacySnap.data() as any;
      if (legacyData && (legacyData.level || legacyData.stats || legacyData.hunterRank)) {
        const legacyQuests = await loadQuestsFromFirestore(userId);
        return {
          player: legacyData as PlayerProfile,
          quests: legacyQuests,
          updatedAt: legacyData.updatedAt || new Date().toISOString(),
          version: 1,
        };
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
  }

  // 3. Caminho alternativo por email users/{userEmail}
  if (userEmail) {
    try {
      const emailDocRef = doc(db, 'users', userEmail);
      const emailSnap = await withTimeout(getDoc(emailDocRef), 3000);
      if (emailSnap && emailSnap.exists()) {
        const emailData = emailSnap.data() as any;
        if (emailData && (emailData.level || emailData.stats)) {
          const legacyQuests = await loadQuestsFromFirestore(userEmail);
          return {
            player: { ...emailData, userId },
            quests: legacyQuests,
            updatedAt: emailData.updatedAt || new Date().toISOString(),
            version: 1,
          };
        }
      }
    } catch {}
  }

  // 4. Caminho legado players/{userId}
  try {
    const playerDocRef = doc(db, 'players', userId);
    const playerSnap = await withTimeout(getDoc(playerDocRef), 2500);
    if (playerSnap && playerSnap.exists()) {
      const pData = playerSnap.data() as any;
      if (pData && (pData.level || pData.stats)) {
        return {
          player: pData as PlayerProfile,
          quests: [],
          updatedAt: pData.updatedAt || new Date().toISOString(),
          version: 1,
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Salva o jogo completo na nuvem gravando em users/{userId}/game/data
 * e sincronizando o nó raiz users/{userId} para máxima compatibilidade retroativa.
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

    // 1. Grava no caminho consolidado moderno
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    await withTimeout(setDoc(gameDocRef, saveData), 5000);

    // 2. Grava no nó users/{userId} para retrocompatibilidade
    const userDocRef = doc(db, 'users', userId);
    await withTimeout(setDoc(userDocRef, {
      ...data.player,
      userId,
      updatedAt: saveData.updatedAt,
    }, { merge: true }), 4000).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// ==========================================
// LEGACY HELPERS
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
    await withTimeout(setDoc(docRef, {
      ...profile,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true }), 4000);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadQuestsFromFirestore(userId: string): Promise<Quest[]> {
  if (!db) return [];
  const path = `users/${userId}/quests`;
  try {
    const colRef = collection(db, 'users', userId, 'quests');
    const snap = await withTimeout(getDocs(colRef), 4000);
    const quests: Quest[] = [];
    snap?.forEach((docItem: any) => {
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
    await withTimeout(batch.commit(), 5000);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestFromFirestore(userId: string, questId: string): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/quests/${questId}`;
  try {
    const docRef = doc(db, 'users', userId, 'quests', questId);
    await withTimeout(deleteDoc(docRef), 4000);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
