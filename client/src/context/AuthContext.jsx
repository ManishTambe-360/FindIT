import { createContext, useEffect, useState } from 'react';
import { fetchMe, loginUser, registerUser } from '../services/authService';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // only "loading" if there is a saved session to restore
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('findit_token')));

  // On app load, restore the session if a token exists
  useEffect(() => {
    const token = localStorage.getItem('findit_token');
    if (!token) return;
    fetchMe()
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('findit_token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ user, token }) => {
    localStorage.setItem('findit_token', token);
    setUser(user);
  };

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    saveSession(res.data);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    saveSession(res.data);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('findit_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}