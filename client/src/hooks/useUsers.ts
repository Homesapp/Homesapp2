import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function usePendingUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/users/pending"],
  });
}

export function useUsersByRole(role: string) {
  return useQuery<User[]>({
    queryKey: ["/api/users/role", role],
    enabled: !!role,
  });
}

export function useApproveUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
  });
}

export function useRejectUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
  });
}

export function useApproveAllUsers() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/approve-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
  });
}

export function useUpdateUserRole() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
    },
  });
}
