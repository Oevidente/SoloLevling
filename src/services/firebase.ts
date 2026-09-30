import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';

// Configuração base do applet (Gen-Lang / Solo Leveling)
const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  projectId: 'gen-lang-client-0769530201',
  appId: '1:149392141150:web:e04e3966a9645cf4473dcf',
  apiKey: 'AIzaSyBmWukUONh8iHXSZCK5413qmyW2UbrSGTY',
  authDomain: 'gen-lang-client-0769530201.firebaseapp.com',
  storageBucket: 'gen-lang-client-0769530201.firebasestorage.app',
  messagingSenderId: '149392141150',
};

export interface FirebaseCustomConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

const LOCAL_STORAGE_FIREBASE_KEY = 'sololeveling_custom_firebase_config';
const LOCAL_STORAGE_GOOGLE_TOKEN_KEY = 'sololeveling_google_oauth_token';
const LOCAL_STORAGE_GOOGLE_TOKEN_TIME = 'sololeveling_google_oauth_token_time';

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

// Persistência local do Access Token do Google Drive
export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_GOOGLE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(LOCAL_STORAGE_GOOGLE_TOKEN_KEY, token);
      localStorage.setItem(LOCAL_STORAGE_GOOGLE_TOKEN_TIME, String(Date.now()));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_GOOGLE_TOKEN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_GOOGLE_TOKEN_TIME);
    }
  } catch (err) {
    console.warn('Erro ao salvar token de acesso no localStorage:', err);
  }
}

// Resolução de credenciais: LocalStorage -> Vite env vars -> Defaults embutidos
const userCustom = getStoredFirebaseConfig();

const resolvedProjectId =
  userCustom?.projectId ||
  import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  DEFAULT_FIREBASE_CONFIG.projectId ||
  'gen-lang-client-0769530201';

const resolvedAuthDomain =
  userCustom?.authDomain ||
  (userCustom?.projectId
    ? `${userCustom.projectId}.firebaseapp.com`
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      DEFAULT_FIREBASE_CONFIG.authDomain ||
      `${resolvedProjectId}.firebaseapp.com`);

const activeConfig: FirebaseCustomConfig = {
  projectId: resolvedProjectId,
  appId:
    userCustom?.appId ||
    import.meta.env.VITE_FIREBASE_APP_ID ||
    DEFAULT_FIREBASE_CONFIG.appId ||
    '',
  apiKey:
    userCustom?.apiKey ||
    import.meta.env.VITE_FIREBASE_API_KEY ||
    DEFAULT_FIREBASE_CONFIG.apiKey ||
    '',
  authDomain: resolvedAuthDomain,
  storageBucket:
    userCustom?.storageBucket ||
    (userCustom?.projectId
      ? `${userCustom.projectId}.firebasestorage.app`
      : import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        DEFAULT_FIREBASE_CONFIG.storageBucket ||
        ''),
  messagingSenderId:
    userCustom?.messagingSenderId ||
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    DEFAULT_FIREBASE_CONFIG.messagingSenderId ||
    '',
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
  // Garante persistência em LocalStorage / IndexedDB para todas as abas e sessões
  setPersistence(authInstance, browserLocalPersistence).catch((err) => {
    console.warn('Aviso ao configurar persistência do Firebase Auth:', err);
  });

  googleProviderInstance = new GoogleAuthProvider();
  // Escopo de acesso ao Google Drive apenas para arquivos criados pelo app
  googleProviderInstance.addScope('https://www.googleapis.com/auth/drive.file');
  googleProviderInstance.setCustomParameters({
    prompt: 'select_account',
  });
} catch (err) {
  console.warn('Inicialização Firebase/Auth:', err);
}

export const app = appInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const currentFirebaseConfig = activeConfig;

// Token em memória sincronizado com LocalStorage
let cachedAccessToken: string | null = getStoredAccessToken();

export function getCachedAccessToken(): string | null {
  if (!cachedAccessToken) {
    cachedAccessToken = getStoredAccessToken();
  }
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  setStoredAccessToken(token);
}

declare global {
  interface Window {
    google?: any;
  }
}

const LOCAL_STORAGE_USER_INFO_KEY = 'sololeveling_user_profile_cache';

export interface SimpleUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export function getStoredUserProfile(): SimpleUserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setStoredUserProfile(profile: SimpleUserProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_USER_INFO_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_INFO_KEY);
    }
  } catch {}
}

/**
 * Listener de autenticação com restauração e persistência de sessão
 */
export function subscribeToAuth(
  callback: (user: any | null, accessToken: string | null) => void
): () => void {
  // Restaura sessão existente imediatamente
  const storedUser = getStoredUserProfile();
  const storedToken = getStoredAccessToken();
  if (storedUser && storedToken) {
    callback(storedUser, storedToken);
  }

  if (!auth) {
    if (!storedUser || !storedToken) {
      callback(null, null);
    }
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Se não há usuário do Firebase, mas temos sessão do GIS armazenada, mantemos
      const gisUser = getStoredUserProfile();
      const gisToken = getStoredAccessToken();
      if (gisUser && gisToken) {
        callback(gisUser, gisToken);
      } else {
        cachedAccessToken = null;
        setStoredAccessToken(null);
        setStoredUserProfile(null);
        callback(null, null);
      }
    } else {
      const stored = getStoredAccessToken();
      cachedAccessToken = stored;
      const simpleUser: SimpleUserProfile = {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Caçador',
        email: user.email || null,
        photoURL: user.photoURL || null,
      };
      setStoredUserProfile(simpleUser);
      callback(simpleUser, stored);
    }
  });
}

/**
 * Autenticação Direta via Google Identity Services (GIS)
 * Não requer redirecionamento via /__/auth/handler nem cookies de terceiros.
 * Ideal e infalível para GitHub Pages e SPAs estáticos.
 */
export async function loginWithGoogleIdentityServices(customClientId?: string): Promise<{ user: SimpleUserProfile; accessToken: string }> {
  const resolvedClientId =
    customClientId ||
    userCustom?.appId || // pode ser usado se guardado
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '149392141150-om7tfsqanvdtamd4qc1vebqk0kih6mcd.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    const startGis = () => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Biblioteca Google Identity Services não carregada no navegador.'));
        return;
      }

      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: resolvedClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          prompt: 'select_account',
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error || 'Falha na autenticação do Google.'));
              return;
            }

            const token = response.access_token;
            if (!token) {
              reject(new Error('Token de acesso não retornado pelo Google.'));
              return;
            }

            cachedAccessToken = token;
            setStoredAccessToken(token);

            // Obter perfil do usuário diretamente da API do Google
            let profile: SimpleUserProfile = {
              uid: 'hunter_' + Date.now(),
              displayName: 'Caçador Conectado',
              email: null,
              photoURL: null,
            };

            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const data = await res.json();
                profile = {
                  uid: data.sub || profile.uid,
                  displayName: data.name || data.email?.split('@')[0] || 'Caçador',
                  email: data.email || null,
                  photoURL: data.picture || null,
                };
              }
            } catch (err) {
              console.warn('Erro ao obter perfil via userinfo:', err);
            }

            setStoredUserProfile(profile);
            resolve({ user: profile, accessToken: token });
          },
        });

        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err: any) {
        reject(err);
      }
    };

    if (window.google?.accounts?.oauth2) {
      startGis();
    } else {
      // Se o script ainda não carregou, aguarda ou injeta
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => startGis();
      script.onerror = () => reject(new Error('Não foi possível carregar a biblioteca de login do Google.'));
      document.head.appendChild(script);
    }
  });
}

/**
 * Login com Google inteligente:
 * 1. Tenta o Google Identity Services (GIS) direto (sem problema de redirect_uri ou cookies de terceiros no GitHub Pages).
 * 2. Se não estiver disponível, tenta o Firebase Auth.
 */
export async function loginWithGoogle(): Promise<{ user: any; accessToken: string }> {
  try {
    // 1. Tenta autenticação nativa do Google Identity Services (mais compatível com GitHub Pages)
    return await loginWithGoogleIdentityServices();
  } catch (gisError: any) {
    console.warn('Google Identity Services tentou autenticar, tentando fallback para Firebase Auth...', gisError);

    if (!auth || !googleProvider) {
      throw gisError;
    }

    // 2. Fallback para Firebase Auth
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error('Falha ao obter o token de acesso do Google Drive.');
      }

      cachedAccessToken = token;
      setStoredAccessToken(token);

      const simpleUser: SimpleUserProfile = {
        uid: result.user.uid,
        displayName: result.user.displayName || 'Caçador',
        email: result.user.email || null,
        photoURL: result.user.photoURL || null,
      };
      setStoredUserProfile(simpleUser);

      return {
        user: simpleUser,
        accessToken: token,
      };
    } catch (firebaseError: any) {
      console.error('Erro também no Firebase Auth:', firebaseError);

      if (firebaseError?.code === 'auth/popup-blocked') {
        throw new Error('O navegador bloqueou o pop-up do Google. Por favor, permita pop-ups neste site.');
      }
      if (firebaseError?.code === 'auth/popup-closed-by-user') {
        throw new Error('A janela do Google foi fechada antes de concluir.');
      }
      if (firebaseError?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'oevidente.github.io';
        throw new Error(`Domínio "${currentHost}" não autorizado no Firebase. Use a autenticação direta do Google ou o Backup Local (JSON).`);
      }

      // Lança a mensagem mais compreensível entre os dois erros
      throw new Error(gisError.message || firebaseError.message || 'Falha ao autenticar com o Google.');
    }
  }
}

/**
 * Logout do usuário e expurgo do token local e da memória
 */
export async function logoutUser(): Promise<void> {
  cachedAccessToken = null;
  setStoredAccessToken(null);
  setStoredUserProfile(null);
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
}
