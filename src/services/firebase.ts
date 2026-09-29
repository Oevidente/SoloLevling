import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
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

// Resolução de credenciais em cascata: LocalStorage -> Vite env vars
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

// Inicialização segura do Firebase (evita crash se as chaves não tiverem sido configuradas ainda)
let appInstance = null;
let dbInstance = null;
let authInstance = null;
let googleProviderInstance = null;

if (isFirebaseConfigured) {
  try {
    appInstance = initializeApp({
      projectId: activeConfig.projectId,
      appId: activeConfig.appId,
      apiKey: activeConfig.apiKey,
      authDomain: activeConfig.authDomain || `${activeConfig.projectId}.firebaseapp.com`,
      storageBucket: activeConfig.storageBucket,
      messagingSenderId: activeConfig.messagingSenderId,
    });

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
export const db = dbInstance as any;
export const auth = authInstance as any;
export const googleProvider = googleProviderInstance as any;
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
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Funções de Autenticação
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
      throw new Error('POPUP_FECHADO: A janela de login foi fechada antes de concluir.');
    } else if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('PROVEDOR_DESATIVADO: O provedor Google não foi ativado no Firebase Console (Authentication > Sign-in method > Google).');
    }
    throw error;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  if (!auth) {
    throw new Error('CONFIG_REQUIRED: Firebase não configurado.');
  }
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign In Error:', error);
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

// Operações de Banco Otimizadas para Cota Mínima (Poupando leituras e gravações)

/**
 * Carrega perfil do Caçador no Firestore
 */
export async function loadPlayerFromFirestore(userId: string): Promise<PlayerProfile | null> {
  if (!db) return null;
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PlayerProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Salva perfil do Caçador no Firestore
 */
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

/**
 * Carrega missões do Caçador no Firestore
 */
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

/**
 * Salva ou atualiza uma única missão no Firestore
 */
export async function saveQuestToFirestore(userId: string, quest: Quest): Promise<void> {
  if (!db) return;
  const path = `users/${userId}/quests/${quest.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'quests', quest.id);
    await setDoc(docRef, {
      ...quest,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Salva lote de missões no Firestore (otimizado via Batch write)
 */
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

/**
 * Deleta uma missão no Firestore
 */
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
