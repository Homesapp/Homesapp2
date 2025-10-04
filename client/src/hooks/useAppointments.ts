import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment, InsertAppointment } from "@shared/schema";

type AppointmentsFilters = {
  status?: string;
  clientId?: string;
  propertyId?: string;
};

export function useAppointments(filters?: AppointmentsFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.clientId) queryParams.append("clientId", filters.clientId);
  if (filters?.propertyId) queryParams.append("propertyId", filters.propertyId);
  
  const queryString = queryParams.toString();
  const url = queryString ? `/api/appointments?${queryString}` : "/api/appointments";

  return useQuery<Appointment[]>({
    queryKey: ["/api/appointments", filters],
    queryFn: async () => {
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return res.json();
    },
  });
}

export function useAppointment(id: string) {
  return useQuery<Appointment>({
    queryKey: ["/api/appointments", id],
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  return useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Appointment> }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });
}

export function useUpdateAppointmentReport() {
  return useMutation({
    mutationFn: async ({ 
      id, 
      conciergeReport, 
      accessIssues 
    }: { 
      id: string; 
      conciergeReport: string; 
      accessIssues?: string; 
    }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, {
        conciergeReport,
        accessIssues: accessIssues || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });
}
