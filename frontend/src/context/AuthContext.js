import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading] = useState(false);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") setUser(readStoredUser());
      if (e.key === "token" && !e.newValue) setUser(null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    if (userData.id) {
      localStorage.setItem("userId", String(userData.id));
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
