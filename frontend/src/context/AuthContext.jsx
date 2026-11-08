import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, login, logout, register } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  async function signIn(credentials) {
    const authenticated = await login(credentials);
    setUser(authenticated);
  }

  async function signUp(credentials) {
    const authenticated = await register(credentials);
    setUser(authenticated);
  }

  async function signOut() {
    await logout();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
