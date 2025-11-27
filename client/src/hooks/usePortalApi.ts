import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { useCallback } from "react";

export function usePortalApi() {
  const { session, refreshSession } = usePortalAuth();

  const portalFetch = useCallback(
    async (
      endpoint: string,
      options: RequestInit = {}
    ): Promise<Response> => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${session.accessToken}`);
      headers.set("Content-Type", "application/json");

      let response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const refreshed = await refreshSession();
        if (refreshed) {
          const newSession = JSON.parse(localStorage.getItem("portal_session") || "{}");
          headers.set("Authorization", `Bearer ${newSession.accessToken}`);
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
        }
      }

      return response;
    },
    [session, refreshSession]
  );

  const get = useCallback(
    async <T>(endpoint: string): Promise<T> => {
      const response = await portalFetch(endpoint);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
      }
      return response.json();
    },
    [portalFetch]
  );

  const post = useCallback(
    async <T>(endpoint: string, data?: unknown): Promise<T> => {
      const response = await portalFetch(endpoint, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
      }
      return response.json();
    },
    [portalFetch]
  );

  const put = useCallback(
    async <T>(endpoint: string, data?: unknown): Promise<T> => {
      const response = await portalFetch(endpoint, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
      }
      return response.json();
    },
    [portalFetch]
  );

  const del = useCallback(
    async <T>(endpoint: string): Promise<T> => {
      const response = await portalFetch(endpoint, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
      }
      return response.json();
    },
    [portalFetch]
  );

  return { get, post, put, del, portalFetch };
}
