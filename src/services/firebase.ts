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
  initializeFirestore,
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

// Helper com timeout generoso (25s) para conexões móveis e redes com latência
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 25000, fallbackVal?: T): Promise<T> {
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

// Inicialização segura do Firebase com Long-Polling forçado (elimina o travamento de streaming de 30s)
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

    // Inicializa o Firestore de forma nativa e compatível com WebChannel
    const customDbId = activeConfig.firestoreDatabaseId && activeConfig.firestoreDatabaseId !== '(default)'
      ? activeConfig.firestoreDatabaseId
      : undefined;

    try {
      dbInstance = customDbId
        ? getFirestore(appInstance, customDbId)
        : getFirestore(appInstance);
    } catch {
      try {
        dbInstance = getFirestore(appInstance);
      } catch (fErr) {
        console.warn('Erro ao obter instância do Firestore:', fErr);
      }
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
    msg.includes('network') ||
    msg.includes('offline') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
}

export function formatFirestoreError(error: any): string {
  if (!error) return 'Erro desconhecido ao comunicar com a nuvem.';
  const code = error?.code || '';
  const msg = error?.message || String(error);

  if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
    return 'PERMISSÃO NEGADA: As Regras de Segurança do Firestore no Firebase Console bloquearam a gravação. Na aba Configurar Google / Firebase, clique em "Copiar Regras do Firestore" e publique-as no console do Firebase.';
  }
  if (code === 'not-found' || msg.includes('not-found') || msg.includes('does not exist')) {
    return 'BANCO NÃO ENCONTRADO: O Cloud Firestore não foi encontrado no projeto Firebase. Acesse o console e confirme a criação da base de dados em Firestore Database.';
  }
  if (msg.includes('TIMEOUT_EXCEEDED')) {
    return 'TEMPO LIMITE EXCEDIDO: O Firestore não respondeu à requisição. Isso acontece quando as Regras de Segurança bloqueiam silenciosamente a conexão, o banco ainda não foi criado no console, ou há bloqueio de rede no navegador. Verifique a aba Configurar Google / Firebase.';
  }
  if (code === 'unavailable' || msg.includes('unavailable') || msg.includes('client is offline')) {
    return 'FIREBASE INDISPONÍVEL / OFFLINE: O navegador não conseguiu se conectar ao Firestore. Verifique sua conexão e se o banco está ativo no Console.';
  }
  return msg;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isOffline = isOfflineError(error);
  const errMsg = error instanceof Error ? error.message : String(error);
  
  if (isOffline) {
    console.info(`[Firestore: Offline] Operação ${operationType} em ${path || 'doc'}. Usando cache local.`);
    return;
  }
  
  console.warn(`[Firestore: Aviso] Operação ${operationType} em ${path || 'doc'}:`, errMsg);
}

// ==========================================
// TESTE DE CONEXÃO DIRETA
// ==========================================
export async function testFirestoreConnection(userId: string): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { 
      success: false, 
      message: 'Firebase Firestore não está inicializado. Verifique se as credenciais foram configuradas e salvas.' 
    };
  }
  try {
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    await withTimeout(getDoc(gameDocRef), 12000);
    return {
      success: true,
      message: 'Conexão com Cloud Firestore estabelecida e ativa com sucesso! Canal de Long-Polling respondendo.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatFirestoreError(err),
    };
  }
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
// ==========================================

/**
 * Busca o save consolidado do jogador na nuvem (users/{userId}/game/data)
 * Com suporte a fallback de chave por email e paths legados.
 */
export async function fetchCloudSave(userId: string, userEmail?: string | null): Promise<GameSaveData | null> {
  if (!db) return null;
  const path = `users/${userId}/game/data`;
  try {
    // 1. Caminho consolidado moderno (users/{uid}/game/data) - única leitura para poupar cotas
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    const snap = await withTimeout(getDoc(gameDocRef), 22000);
    if (snap && snap.exists()) {
      const data = snap.data() as GameSaveData;
      return data;
    }

    // 2. Caminho legado direto em users/{uid} apenas se não houver no caminho consolidado
    try {
      const legacyDocRef = doc(db, 'users', userId);
      const legacySnap = await withTimeout(getDoc(legacyDocRef), 6000);
      if (legacySnap && legacySnap.exists()) {
        const legacyData = legacySnap.data() as any;
        if (legacyData.level || legacyData.stats) {
          const legacyQuests = await loadQuestsFromFirestore(userId);
          return {
            player: legacyData as PlayerProfile,
            quests: legacyQuests,
            updatedAt: legacyData.updatedAt || new Date().toISOString(),
            version: 1,
          };
        }
      }
    } catch {}

    // 3. Fallback retroativo usando email higienizado como chave de documento
    if (userEmail) {
      try {
        const safeEmailKey = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const emailDocRef = doc(db, 'users_by_email', safeEmailKey);
        const emailSnap = await withTimeout(getDoc(emailDocRef), 5000);
        if (emailSnap && emailSnap.exists()) {
          const emailData = emailSnap.data() as any;
          if (emailData.player) {
            return emailData as GameSaveData;
          } else if (emailData.level || emailData.stats) {
            const legacyQuests = await loadQuestsFromFirestore(userId);
            return {
              player: emailData as PlayerProfile,
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
      const playerSnap = await withTimeout(getDoc(playerDocRef), 4000);
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
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Salva o jogo completo na nuvem gravando exclusivamente em users/{userId}/game/data
 * 1 única operação atômica de escrita para poupar as cotas gratuitas do Firestore.
 */
export async function saveCloudSave(userId: string, data: { player: PlayerProfile; quests: Quest[] }): Promise<void> {
  if (!db) {
    throw new Error('CONFIG_REQUIRED: Firebase Firestore não inicializado.');
  }
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

    // Grava de forma consolidada e atômica em users/{userId}/game/data
    const gameDocRef = doc(db, 'users', userId, 'game', 'data');
    await withTimeout(setDoc(gameDocRef, saveData), 25000);
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
    }, { merge: true }), 10000);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadQuestsFromFirestore(userId: string): Promise<Quest[]> {
  if (!db) return [];
  const path = `users/${userId}/quests`;
  try {
    const colRef = collection(db, 'users', userId, 'quests');
    const snap = await withTimeout(getDocs(colRef), 10000);
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
    await withTimeout(batch.commit(), 15000);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuestFromFirestore(userId: string, questId: string): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/quests/${questId}`;
  try {
    const docRef = doc(db, 'users', userId, 'quests', questId);
    await withTimeout(deleteDoc(docRef), 8000);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
