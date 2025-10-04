import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServiceProvider, Service, InsertServiceProvider, InsertService } from "@shared/schema";

type ServiceProviderWithUser = ServiceProvider & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

export function useServiceProviders(filters?: { specialty?: string; available?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.specialty) params.append("specialty", filters.specialty);
  if (filters?.available !== undefined) params.append("available", String(filters.available));
  
  const queryString = params.toString();
  const url = queryString ? `/api/service-providers?${queryString}` : "/api/service-providers";

  return useQuery<ServiceProviderWithUser[]>({
    queryKey: ["/api/service-providers", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch service providers");
      return res.json();
    },
  });
}

export function useServicesByProvider(providerId: string) {
  return useQuery<Service[]>({
    queryKey: ["/api/service-providers", providerId, "services"],
    queryFn: async () => {
      const res = await fetch(`/api/service-providers/${providerId}/services`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
    enabled: !!providerId,
  });
}

export function useCreateServiceProvider() {
  return useMutation({
    mutationFn: async (data: InsertServiceProvider) => {
      const res = await apiRequest("POST", "/api/service-providers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers"] });
    },
  });
}

export function useUpdateServiceProvider() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertServiceProvider> }) => {
      const res = await apiRequest("PATCH", `/api/service-providers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-providers"] });
    },
  });
}

export function useCreateService() {
  return useMutation({
    mutationFn: async (data: InsertService) => {
      const res = await apiRequest("POST", "/api/services", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/service-providers", variables.providerId, "services"] 
      });
    },
  });
}

export function useUpdateService() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertService> }) => {
      const res = await apiRequest("PATCH", `/api/services/${id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/service-providers", data.providerId, "services"] 
      });
    },
  });
}

export function useDeleteService() {
  return useMutation({
    mutationFn: async ({ id, providerId }: { id: string; providerId: string }) => {
      await apiRequest("DELETE", `/api/services/${id}`, undefined);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/service-providers", variables.providerId, "services"] 
      });
    },
  });
}
