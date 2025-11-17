import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds (fallback)

interface UseAutoLogoutOptions {
  onLogout?: () => void;
  enabled?: boolean;
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const { onLogout, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch auto-logout timeout from API
  const { data: timeoutData } = useQuery<{ timeout: number }>({
    queryKey: ["/api/system-settings/auto-logout-timeout"],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });

  const INACTIVITY_TIMEOUT = timeoutData?.timeout ?? DEFAULT_TIMEOUT;

  const logout = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Use custom logout function if provided, otherwise redirect to logout endpoint
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/api/logout";
    }
  }, [onLogout]);

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout only if enabled
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [logout, enabled, INACTIVITY_TIMEOUT]);

  useEffect(() => {
    // Only set up listeners if enabled
    if (!enabled) {
      return;
    }

    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer, enabled]);
}
