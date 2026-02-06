import { createContext, useState, useEffect, useContext } from "react";
import { api } from "../api/client";

export const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    allowRegistration: true, 
    enable2FA: false,
    maxUploadSize: 1073741824,
    appName: "Krypton Drive",
    version: "1.0.0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/settings/public-config")
      .then((data) => {
        setConfig(data);
      })
      .catch((err) => {
        console.error("Failed to fetch config:", err);
        // Keep defaults on error
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
