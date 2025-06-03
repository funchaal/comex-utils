import { createContext, useState } from "react";

// Criando o contexto
export const AuthContext = createContext();

// Criando o Provider
export const AuthProvider = ({ children }) => {
  const [certificate, setCertificate] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState(null);

  return (
    <AuthContext.Provider value={{ certificate, setCertificate, certificatePassword, setCertificatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
