export type SessionUser = {
  id: number;
  name: string;
  phone: string;
};

export const SESSION_CHANGED_EVENT = "stemnorge-session-changed";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";

function isBrowser() {
  return typeof window !== "undefined";
}

function isSessionUser(value: unknown): value is SessionUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SessionUser).id === "number" &&
    typeof (value as SessionUser).name === "string" &&
    typeof (value as SessionUser).phone === "string"
  );
}

export function getStoredToken() {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): SessionUser | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function notifySessionChanged() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}