import { AuthenticatedUserProfile, AuthSessionResponse, UserRole } from '../types/auth';
import { isSupabaseConfigured, supabaseClient } from './dataService';

const SESSION_TOKEN_STORAGE_KEY = 'academic_insight_session_token_v2';
const LEGACY_DATASET_KEY = 'academic_insight_dataset_v1';
const LEGACY_THRESHOLDS_KEY = 'academic_insight_thresholds_v1';

/**
 * Purges any legacy unencrypted cohort cache from localStorage so student data
 * is never exposed in browser storage.
 */
export function purgeLegacyClientStorage(): void {
  try {
    localStorage.removeItem(LEGACY_DATASET_KEY);
    localStorage.removeItem(LEGACY_THRESHOLDS_KEY);
  } catch {
    // Ignore storage access errors
  }
}

export function getStoredSessionToken(): string | null {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredSessionToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

async function fetchSupabaseUserProfile(
  userId: string,
  fallbackEmail: string
): Promise<AuthenticatedUserProfile | null> {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('id, email, full_name, role, student_id, department, assigned_title')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  const role: UserRole = data.role === 'FACULTY' ? 'FACULTY' : 'STUDENT';
  return {
    id: String(data.id),
    email: String(data.email || fallbackEmail),
    fullName: String(data.full_name),
    role,
    studentId: role === 'STUDENT' ? (data.student_id ? String(data.student_id) : null) : null,
    department: String(data.department || 'Computer Science & Engineering'),
    assignedTitle: data.assigned_title ? String(data.assigned_title) : undefined,
  };
}

/**
 * Signs in a user using either Supabase Auth (when configured) or the Node RBAC backend (`/api/auth/login`).
 * Role and studentId are resolved strictly from server/database records.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthSessionResponse> {
  purgeLegacyClientStorage();

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return {
      authenticated: false,
      user: null,
      error: 'Please enter both your institutional email and password.',
    };
  }

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      return {
        authenticated: false,
        user: null,
        error: error?.message || 'Invalid email or password.',
      };
    }

    const profile = await fetchSupabaseUserProfile(data.user.id, normalizedEmail);
    if (!profile) {
      await supabaseClient.auth.signOut();
      return {
        authenticated: false,
        user: null,
        error:
          'Account authenticated, but no authorized role mapping was found in public.user_profiles.',
      };
    }

    setStoredSessionToken(data.session.access_token);
    return {
      authenticated: true,
      user: profile,
      token: data.session.access_token,
    };
  }

  // Server-enforced Node RBAC endpoint
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const payload = (await response.json()) as AuthSessionResponse;
    if (!response.ok || !payload.authenticated || !payload.user) {
      setStoredSessionToken(null);
      return {
        authenticated: false,
        user: null,
        error: payload.error || 'Invalid email or password.',
      };
    }

    if (payload.token) {
      setStoredSessionToken(payload.token);
    }

    return {
      authenticated: true,
      user: payload.user,
      token: payload.token,
    };
  } catch {
    return {
      authenticated: false,
      user: null,
      error: 'Unable to reach the authentication service. Ensure the server is running.',
    };
  }
}

/**
 * Restores and verifies the active session with the server or Supabase on page load/refresh.
 * Never trusts client-side state without server verification.
 */
export async function verifyCurrentSession(): Promise<AuthSessionResponse> {
  purgeLegacyClientStorage();

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session || !data.session.user) {
      setStoredSessionToken(null);
      return { authenticated: false, user: null };
    }

    const profile = await fetchSupabaseUserProfile(
      data.session.user.id,
      data.session.user.email || ''
    );
    if (!profile) {
      await supabaseClient.auth.signOut();
      setStoredSessionToken(null);
      return { authenticated: false, user: null };
    }

    setStoredSessionToken(data.session.access_token);
    return {
      authenticated: true,
      user: profile,
      token: data.session.access_token,
    };
  }

  const token = getStoredSessionToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers,
      credentials: 'same-origin',
    });

    if (!response.ok) {
      setStoredSessionToken(null);
      return { authenticated: false, user: null };
    }

    const payload = (await response.json()) as AuthSessionResponse;
    if (!payload.authenticated || !payload.user) {
      setStoredSessionToken(null);
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: payload.user,
      token: token ?? undefined,
    };
  } catch {
    return { authenticated: false, user: null };
  }
}

/**
 * Invalidates the session on the server and clears client session tokens.
 */
export async function signOutCurrentSession(): Promise<void> {
  purgeLegacyClientStorage();

  if (isSupabaseConfigured && supabaseClient) {
    await supabaseClient.auth.signOut();
    setStoredSessionToken(null);
    return;
  }

  const token = getStoredSessionToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
    });
  } catch {
    // Proceed with local token cleanup even if network fails
  } finally {
    setStoredSessionToken(null);
  }
}

/**
 * Initiates a password reset request via Supabase Auth or the local auth server.
 */
export async function sendPasswordResetRequest(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return {
      ok: false,
      message: 'Please enter a valid institutional email address.',
    };
  }

  if (isSupabaseConfigured && supabaseClient) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return {
      ok: true,
      message:
        'Password reset email sent. Check your inbox for the recovery link.',
    };
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const data = (await res.json()) as { message?: string; error?: string };
    if (!res.ok) {
      return {
        ok: false,
        message: data.error || 'Could not process password reset request.',
      };
    }
    return {
      ok: true,
      message:
        data.message ||
        'If an authorized account matches this email, reset instructions have been queued.',
    };
  } catch {
    return {
      ok: false,
      message: 'Unable to reach the authentication server.',
    };
  }
}
