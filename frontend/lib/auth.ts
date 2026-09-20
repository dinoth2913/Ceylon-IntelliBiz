export type AuthUser = {
  userId: number;
  username: string;
  email: string;
  role: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

const STORAGE_KEY = 'intellibiz-auth';
const COOKIE_NAME = 'intellibiz_token';

// The backend URL can be overridden per environment (e.g. a deployed API) via
// NEXT_PUBLIC_API_URL. It defaults to the docker-compose service on localhost.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function saveSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // A cookie (not httpOnly, since it's set from client-side JS) lets the Next.js
  // middleware gate /dashboard routes server-side without an extra round trip.
  document.cookie = `${COOKIE_NAME}=${session.token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

type BackendAuthResponse = {
  token: string;
  userId: number;
  username: string;
  email: string;
  role: string;
};

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function login(usernameOrEmail: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password })
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Invalid username/email or password.'));
  }

  const data: BackendAuthResponse = await response.json();
  const session: AuthSession = {
    token: data.token,
    user: { userId: data.userId, username: data.username, email: data.email, role: data.role }
  };
  saveSession(session);
  return session;
}

export async function register(username: string, email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Could not create your account.'));
  }

  const data: BackendAuthResponse = await response.json();
  const session: AuthSession = {
    token: data.token,
    user: { userId: data.userId, username: data.username, email: data.email, role: data.role }
  };
  saveSession(session);
  return session;
}

/**
 * Re-reads the signed-in user from the server so a role an admin has just changed is picked up
 * without logging in again. Returns null if the session is gone (apiFetch clears it on a 401).
 */
export async function refreshUser(): Promise<AuthUser | null> {
  const session = getSession();
  if (!session) return null;
  try {
    const response = await apiFetch('/api/auth/me');
    if (!response.ok) return null;
    const data = await response.json();
    const user: AuthUser = { userId: data.userId, username: data.username, email: data.email, role: data.role };
    saveSession({ token: session.token, user });
    return user;
  } catch {
    return null;
  }
}

export function logout() {
  clearSession();
}

/**
 * Fetch helper that attaches the stored JWT (when present) to a request against
 * the Spring Boot API. On a 401 it clears the stale session so the next guarded
 * navigation sends the user back to /auth instead of looping on stale data.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const session = getSession();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    clearSession();
  }
  return response;
}
