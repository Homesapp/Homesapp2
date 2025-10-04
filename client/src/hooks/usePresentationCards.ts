import { useQuery, useMutation, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PresentationCard, InsertPresentationCard, Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePresentationCards(clientId?: string): UseQueryResult<PresentationCard[], Error> {
  const queryString = clientId ? `?clientId=${clientId}` : "";
  const url = `/api/presentation-cards${queryString}`;

  return useQuery<PresentationCard[], Error>({
    queryKey: ["/api/presentation-cards", clientId],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
  });
}

export function usePresentationCard(id: string): UseQueryResult<PresentationCard, Error> {
  return useQuery<PresentationCard, Error>({
    queryKey: ["/api/presentation-cards", id],
    enabled: !!id,
  });
}

export function useMatchPropertiesForCard(cardId: string): UseQueryResult<Property[], Error> {
  return useQuery<Property[], Error>({
    queryKey: ["/api/presentation-cards", cardId, "matches"],
    queryFn: async () => {
      const res = await fetch(`/api/presentation-cards/${cardId}/matches`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    enabled: !!cardId,
  });
}

export function useCreatePresentationCard() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPresentationCard) => {
      const res = await apiRequest("POST", "/api/presentation-cards", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards"] });
      toast({
        title: "Tarjeta creada",
        description: "La tarjeta de presentación ha sido creada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tarjeta",
        variant: "destructive",
      });
    },
  });
}

export function useUpdatePresentationCard() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPresentationCard> }) => {
      const res = await apiRequest("PATCH", `/api/presentation-cards/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards", variables.id] });
      toast({
        title: "Tarjeta actualizada",
        description: "La tarjeta de presentación ha sido actualizada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la tarjeta",
        variant: "destructive",
      });
    },
  });
}

export function useDeletePresentationCard() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/presentation-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentation-cards"] });
      toast({
        title: "Tarjeta eliminada",
        description: "La tarjeta de presentación ha sido eliminada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la tarjeta",
        variant: "destructive",
      });
    },
  });
}
