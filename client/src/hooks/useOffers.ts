import { useQuery, useMutation, type UseQueryResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Offer, InsertOffer, User, Property, Appointment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface OfferFilters {
  status?: string;
  clientId?: string;
  propertyId?: string;
}

type OfferWithDetails = Offer & {
  property?: Property;
  appointment?: Appointment;
};

export function useOffers(filters?: OfferFilters): UseQueryResult<OfferWithDetails[], Error> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters?.clientId) {
    params.append("clientId", filters.clientId);
  }
  if (filters?.propertyId) {
    params.append("propertyId", filters.propertyId);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/offers?${queryString}` : "/api/offers";

  return useQuery<OfferWithDetails[], Error>({
    queryKey: ["/api/offers", filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      const offers: Offer[] = await res.json();

      const [propertiesRes, appointmentsRes] = await Promise.all([
        fetch(`/api/properties`, { credentials: "include" }),
        fetch(`/api/appointments`, { credentials: "include" })
      ]);

      const allProperties: Property[] = propertiesRes.ok ? await propertiesRes.json() : [];
      const allAppointments: Appointment[] = appointmentsRes.ok ? await appointmentsRes.json() : [];

      const propertiesMap = new Map(allProperties.map((p: Property) => [p.id, p]));
      const appointmentsMap = new Map(allAppointments.map((a: Appointment) => [a.id, a]));

      return offers.map(offer => ({
        ...offer,
        property: propertiesMap.get(offer.propertyId),
        appointment: offer.appointmentId ? appointmentsMap.get(offer.appointmentId) : undefined,
      }));
    },
  });
}

export function useOffer(id: string): UseQueryResult<OfferWithDetails | undefined, Error> {
  const { data: offers } = useOffers();
  
  return useQuery<OfferWithDetails | undefined, Error>({
    queryKey: ["/api/offers", id],
    queryFn: () => {
      return offers?.find(offer => offer.id === id);
    },
    enabled: !!id && !!offers,
  });
}

export function useCreateOffer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertOffer) => {
      const res = await apiRequest("POST", "/api/offers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Oferta creada",
        description: "La oferta ha sido creada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la oferta",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateOffer() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertOffer> }) => {
      const res = await apiRequest("PATCH", `/api/offers/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers", variables.id] });
      toast({
        title: "Oferta actualizada",
        description: "La oferta ha sido actualizada exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la oferta",
        variant: "destructive",
      });
    },
  });
}
