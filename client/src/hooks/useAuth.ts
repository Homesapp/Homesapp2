import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

const VIEW_AS_ROLE_KEY = "homesapp_view_as_role";

export function useAuth() {
  const [viewAsRole, setViewAsRoleState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(VIEW_AS_ROLE_KEY);
    }
    return null;
  });

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const canChangeRole = user?.role === "master" || user?.role === "admin";

  useEffect(() => {
    if (user && !canChangeRole && viewAsRole) {
      localStorage.removeItem(VIEW_AS_ROLE_KEY);
      setViewAsRoleState(null);
    }
  }, [user, canChangeRole, viewAsRole]);

  const setViewAsRole = useMemo(() => (role: string) => {
    localStorage.setItem(VIEW_AS_ROLE_KEY, role);
    setViewAsRoleState(role);
  }, []);

  const clearViewAsRole = useMemo(() => () => {
    localStorage.removeItem(VIEW_AS_ROLE_KEY);
    setViewAsRoleState(null);
  }, []);

  const effectiveUser = useMemo(() => {
    if (user && viewAsRole && canChangeRole) {
      return {
        ...user,
        role: viewAsRole as any,
      };
    }
    return user;
  }, [user, viewAsRole, canChangeRole]);

  return {
    user: effectiveUser,
    realUser: user,
    isLoading,
    isAuthenticated: !!user,
    viewAsRole,
    canChangeRole,
    setViewAsRole,
    clearViewAsRole,
    isViewingAsOtherRole: !!viewAsRole && canChangeRole,
  };
}
