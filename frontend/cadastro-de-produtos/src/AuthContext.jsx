import { createContext, useState } from "react";

// Criando o contexto
export const AuthContext = createContext();

// Criando o Provider
export const AuthProvider = ({ children }) => {
  const [setToken, setSetToken] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null);

  return (
    <AuthContext.Provider value={{ setToken, setSetToken, csrfToken, setCsrfToken }}>
      {children}
    </AuthContext.Provider>
  );
};
