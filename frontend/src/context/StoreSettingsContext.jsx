import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  fallbackStoreSettings,
  getStoreSettings,
  updateStoreSettings,
} from "../api/client.js";

const StoreSettingsContext = createContext(null);

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(fallbackStoreSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const data = await getStoreSettings();
    const merged = { ...fallbackStoreSettings, ...data };
    setSettings(merged);
    return merged;
  }, []);

  const saveSettings = useCallback(async (payload) => {
    const data = await updateStoreSettings(payload);
    const merged = { ...fallbackStoreSettings, ...data };
    setSettings(merged);
    return merged;
  }, []);

  useEffect(() => {
    let isMounted = true;
    refreshSettings()
      .catch(() => {
        if (isMounted) {
          setSettings(fallbackStoreSettings);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshSettings]);

  const value = useMemo(
    () => ({
      loading,
      refreshSettings,
      saveSettings,
      settings,
    }),
    [loading, refreshSettings, saveSettings, settings],
  );

  return (
    <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error("useStoreSettings must be used inside StoreSettingsProvider");
  }
  return context;
}
