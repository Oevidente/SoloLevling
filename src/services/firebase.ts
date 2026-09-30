import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

export interface FirebaseCustomConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
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

// Resolução de credenciais: LocalStorage -> Vite env vars
const userCustom = getStoredFirebaseConfig();

const activeConfig: FirebaseCustomConfig = {
  projectId: userCustom?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0769530201',
  appId: userCustom?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  apiKey: userCustom?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: userCustom?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0769530201.firebaseapp.com',
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

// Inicialização segura do Firebase App e Auth
let appInstance: any = null;
let authInstance: any = null;
let googleProviderInstance: any = null;

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

  authInstance = getAuth(appInstance);
  googleProviderInstance = new GoogleAuthProvider();
  // Escopo de acesso ao Google Drive apenas para arquivos criados pelo app
  googleProviderInstance.addScope('https://www.googleapis.com/auth/drive.file');
  googleProviderInstance.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline',
  });
} catch (err) {
  console.warn('Inicialização Firebase/Auth:', err);
}

export const app = appInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const currentFirebaseConfig = activeConfig;

// Cache do token em memória (NUNCA persistir em localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

/**
 * Listener de autenticação com limpeza do token em memória
 */
export function subscribeToAuth(
  callback: (user: User | null, accessToken: string | null) => void
): () => void {
  if (!auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
      callback(null, null);
    } else {
      callback(user, cachedAccessToken);
    }
  });
}

/**
 * Login com Google solicitando o escopo do Google Drive
 */
export async function loginWithGoogle(): Promise<{ user: User; accessToken: string }> {
  if (!auth || !googleProvider) {
    throw new Error('Serviço de autenticação não inicializado. Verifique as credenciais da API do Google.');
  }

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      console.warn('Nenhum access token retornado no credential. Tentando obter token de id.');
      // O token ainda pode ser obtido via getIdToken, mas para a Drive API precisamos do accessToken
      throw new Error('Falha ao obter o token de acesso do Google Drive. Verifique se autorizou o acesso.');
    }

    cachedAccessToken = token;
    return {
      user: result.user,
      accessToken: token,
    };
  } catch (error: any) {
    console.error('Erro no login Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Logout do usuário e expurgo do token da memória
 */
export async function logoutUser(): Promise<void> {
  cachedAccessToken = null;
  if (auth) {
    await signOut(auth);
  }
}
