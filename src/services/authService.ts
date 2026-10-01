/**
 * Google Authentication & Multi-Account Session Service for GooKal
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture: string;
  locale?: string;
  loginTimestamp: number;
}

const AUTH_STORAGE_KEY = 'gookal_current_google_user';
const SAVED_ACCOUNTS_STORAGE_KEY = 'gookal_saved_google_accounts';
const GOOGLE_CLIENT_ID_KEY = 'gookal_google_client_id';

/**
 * Get currently active Google user from localStorage
 */
export function getCurrentUser(): GoogleUser | null {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as GoogleUser;
  } catch (err) {
    console.error('[GooKal Auth] Failed to parse current user session:', err);
    return null;
  }
}

/**
 * Get list of all saved Google accounts on this device
 */
export function getSavedAccounts(): GoogleUser[] {
  try {
    const data = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as GoogleUser[];
  } catch (err) {
    console.error('[GooKal Auth] Failed to parse saved accounts:', err);
    return [];
  }
}

/**
 * Save user session to localStorage and add to device's saved accounts
 */
export function saveUserSession(user: GoogleUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    
    // Add/Update in saved accounts list
    const accounts = getSavedAccounts();
    const existingIndex = accounts.findIndex(a => a.id === user.id || a.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...user, loginTimestamp: Date.now() };
    } else {
      accounts.push({ ...user, loginTimestamp: Date.now() });
    }
    localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('[GooKal Auth] Failed to save user session:', err);
  }
}

/**
 * Switch active account to one of the saved accounts
 */
export function switchAccount(userIdOrEmail: string): GoogleUser | null {
  try {
    const accounts = getSavedAccounts();
    const user = accounts.find(a => a.id === userIdOrEmail || a.email.toLowerCase() === userIdOrEmail.toLowerCase());
    if (user) {
      const updatedUser = { ...user, loginTimestamp: Date.now() };
      saveUserSession(updatedUser);
      return updatedUser;
    }
    return null;
  } catch (err) {
    console.error('[GooKal Auth] Failed to switch account:', err);
    return null;
  }
}

/**
 * Remove an account from saved accounts list
 */
export function removeSavedAccount(userId: string): void {
  try {
    const accounts = getSavedAccounts().filter(a => a.id !== userId);
    localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    
    // If removed active user, clear current session
    const current = getCurrentUser();
    if (current && current.id === userId) {
      logoutUser();
    }
  } catch (err) {
    console.error('[GooKal Auth] Failed to remove saved account:', err);
  }
}

/**
 * Log out active user (keeps saved accounts for easy re-selection)
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('[GooKal Auth] Failed to remove user session:', err);
  }
}

/**
 * Get Google Client ID (from localStorage or environment variable)
 */
export function getGoogleClientId(): string {
  try {
    const fromStorage = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) {
      return import.meta.env.VITE_GOOGLE_CLIENT_ID;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Save custom Google Client ID
 */
export function saveGoogleClientId(clientId: string): void {
  try {
    if (clientId.trim()) {
      localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
    } else {
      localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
    }
  } catch (err) {
    console.error('[GooKal Auth] Failed to save Google Client ID:', err);
  }
}

/**
 * Scope storage keys by user ID so that multiple users on the same device have isolated data
 */
export function getScopedStorageKey(baseKey: string, userId?: string | null): string {
  if (!userId) return baseKey;
  return `${baseKey}_user_${userId}`;
}

/**
 * Parse Google JWT credential token payload (returned from Google Identity Services)
 */
export function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
      );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[GooKal Auth] Failed to parse JWT payload:', err);
    return null;
  }
}
