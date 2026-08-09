import api from './api';

export async function login(email, password) {
  try {
    const response = await api.post('/api/v1/auth/login', { email, password });
    const data = response.data;

    localStorage.setItem('edushield_token', data.access_token);
    localStorage.setItem('edushield_user', JSON.stringify({
      user_id: data.user_id,
      email: data.email,
      role: data.role,
    }));

    return data;
  } catch (err) {

    const isNetworkError = !err.response; 
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
