import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface PortalUser {
  contractId: number;
  role: "tenant" | "owner";
  email: string;
  name: string;
  agencyId: string;
  propertyId: number;
  propertyTitle: string;
}

interface PortalSession {
  user: PortalUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface PortalAuthContextType {
  session: PortalSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (portalId: string, password: string, role: "tenant" | "owner") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const PortalAuthContext = createContext<PortalAuthContextType | null>(null);

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error("usePortalAuth must be used within a PortalAuthProvider");
  }
  return context;
}

const STORAGE_KEY = "portal_session";

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = (sess: PortalSession | null) => {
    if (sess) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sess));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSession(sess);
  };

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    try {
      const parsed = JSON.parse(stored) as PortalSession;
      
      const response = await fetch("/api/portal/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: parsed.refreshToken }),
      });

      if (!response.ok) {
        saveSession(null);
        return false;
      }

      const data = await response.json();
      const newSession: PortalSession = {
        user: parsed.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt),
      };

      saveSession(newSession);
      return true;
    } catch {
      saveSession(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as PortalSession;
          const expiresAt = new Date(parsed.expiresAt);
          
          if (expiresAt > new Date()) {
            const response = await fetch("/api/portal/auth/info", {
              headers: {
                Authorization: `Bearer ${parsed.accessToken}`,
              },
            });

            if (response.ok) {
              setSession(parsed);
            } else {
              const refreshed = await refreshSession();
              if (!refreshed) {
                saveSession(null);
              }
            }
          } else {
            const refreshed = await refreshSession();
            if (!refreshed) {
              saveSession(null);
            }
          }
        } catch {
          saveSession(null);
        }
      }
      setIsLoading(false);
    };

    initSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!session) return;

    const expiresAt = new Date(session.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        refreshSession();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [session, refreshSession]);

  const login = async (
    portalId: string,
    password: string,
    role: "tenant" | "owner"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ portalId, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      const newSession: PortalSession = {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt),
      };

      saveSession(newSession);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    if (session) {
      try {
        await fetch("/api/portal/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch {
      }
    }
    saveSession(null);
  };

  return (
    <PortalAuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}
