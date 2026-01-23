import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");

    if (storedToken) setToken(storedToken);
    if (storedRole) setRole(storedRole);
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (newToken, newRole, newUser) => {
    setToken(newToken);
    setRole(newRole);
    setUser(newUser || null);

    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    if (newUser) localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
