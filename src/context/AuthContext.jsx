import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister, isLoggedIn } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      fetchMe()
        .then(setUser)
        .catch(() => { apiLogout(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function loginUser(username, password) {
    await apiLogin(username, password);
    const me = await fetchMe();
    setUser(me);
    return me;
  }

  async function registerUser(username, email, password) {
    await apiRegister(username, email, password);
    return loginUser(username, password);
  }

  function logoutUser() {
    apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
