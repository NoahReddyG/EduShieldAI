/**
 * authService.js — Authentication API calls
 */
import api from './api';

/**
 * Login with email + password.
 * Backend determines role from email domain (@admin.com = FACULTY, else STUDENT).
 * Stores token and user details in localStorage.
 */
/**
 * Login with email + password.
 * Backend determines role from email domain (@admin.com = FACULTY, else STUDENT).
 * Stores token and user details in localStorage.
 * Falls back to demo mode if backend is unavailable.
 */
export async function login(email, password) {
  try {
    const response = await api.post('/api/v1/auth/login', { email, password });
    const data = response.data;

    // Persist session
    localStorage.setItem('edushield_token', data.access_token);
    localStorage.setItem('edushield_user', JSON.stringify({
      user_id: data.user_id,
      email: data.email,
      role: data.role,
    }));

    return data;
  } catch (err) {
    // ── Demo / offline fallback ────────────────────────────────────────────
    // If the backend is not running (hackathon demo mode), derive role from email.
    const isNetworkError = !err.response; // axios network error = no response
    if (isNetworkError) {
      const role = email.includes('@admin.com') ? 'FACULTY' : 'STUDENT';
      const demoUser = {
        user_id: role === 'FACULTY' ? 999 : 1,
        email,
        role,
        access_token: 'demo-token',
      };
      localStorage.setItem('edushield_token', 'demo-token');
      localStorage.setItem('edushield_user', JSON.stringify({
        user_id: demoUser.user_id,
        email: demoUser.email,
        role: demoUser.role,
      }));
      return demoUser;
    }
    // Re-throw non-network errors (e.g., 401 Unauthorized)
    throw err;
  }
}

/** Retrieve stored user from localStorage */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('edushield_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clear session */
export function logout() {
  localStorage.removeItem('edushield_token');
  localStorage.removeItem('edushield_user');
}
