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
  getDocFromServer,
} from 'firebase/firestore';
import rawConfig from '../../firebase-applet-config.json';
import { PlayerProfile, Quest } from '../types/hunter';

// Mescla variáveis de ambiente do Vite (GitHub Pages / Secrets) com a configuração local
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
};

// Inicialização Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Verifique a conexão de rede com o Firebase.");
    }
  }
}
testConnection();

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
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function loginAnonymously(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign In Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Operações de Banco Otimizadas para Cota Mínima (Poupando leituras e gravações)

/**
 * Carrega perfil do Caçador no Firestore
 */
export async function loadPlayerFromFirestore(userId: string): Promise<PlayerProfile | null> {
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
  const path = `users/${userId}/quests/${questId}`;
  try {
    const docRef = doc(db, 'users', userId, 'quests', questId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
