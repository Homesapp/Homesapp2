import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Budget, InsertBudget } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface BudgetFilters {
  propertyId?: string;
  staffId?: string;
  status?: string;
}

export function useBudgets(filters?: BudgetFilters) {
  const params = new URLSearchParams();
  if (filters?.propertyId) params.append("propertyId", filters.propertyId);
  if (filters?.staffId) params.append("staffId", filters.staffId);
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);

  const queryString = params.toString();
  const url = queryString ? `/api/budgets?${queryString}` : "/api/budgets";

  return useQuery<Budget[]>({
    queryKey: ["/api/budgets", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch budgets");
      }
      return res.json();
    },
  });
}

export function useBudget(id: string) {
  return useQuery<Budget>({
    queryKey: ["/api/budgets", id],
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertBudget) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el presupuesto",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBudget() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      const res = await apiRequest("PATCH", `/api/budgets/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets", variables.id] });
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el presupuesto",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBudget() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el presupuesto",
        variant: "destructive",
      });
    },
  });
}
