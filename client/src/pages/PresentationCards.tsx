import { ClientPresentationCard } from "@/components/ClientPresentationCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PresentationCards() {
  const cards = [
    {
      id: "1",
      clientName: "Carlos Rodríguez",
      propertyType: "Casa",
      modality: "rent" as const,
      minPrice: 20000,
      maxPrice: 35000,
      location: "Polanco, CDMX",
      bedrooms: 3,
      bathrooms: 2,
      amenities: ["Estacionamiento", "Jardín", "Seguridad 24/7"],
      matchCount: 8,
    },
    {
      id: "2",
      clientName: "Ana María López",
      propertyType: "Departamento",
      modality: "sale" as const,
      minPrice: 3000000,
      maxPrice: 5000000,
      location: "Santa Fe, CDMX",
      bedrooms: 2,
      bathrooms: 2,
      amenities: ["Gym", "Alberca", "Terraza"],
      matchCount: 5,
    },
    {
      id: "3",
      clientName: "Roberto Sánchez",
      propertyType: "Casa",
      modality: "both" as const,
      minPrice: 25000,
      maxPrice: 7000000,
      location: "Interlomas, Edo. Méx.",
      bedrooms: 4,
      bathrooms: 3,
      amenities: ["Estacionamiento", "Jardín", "Cuarto de servicio", "Terraza"],
      matchCount: 12,
    },
    {
      id: "4",
      clientName: "Diana Morales",
      propertyType: "Loft",
      modality: "rent" as const,
      minPrice: 15000,
      maxPrice: 22000,
      location: "Roma Norte, CDMX",
      bedrooms: 1,
      amenities: ["Amueblado", "Pet-friendly", "Roof garden"],
      matchCount: 3,
    },
    {
      id: "5",
      clientName: "Jorge Ramírez",
      propertyType: "Penthouse",
      modality: "sale" as const,
      minPrice: 8000000,
      maxPrice: 12000000,
      location: "Bosques de las Lomas",
      bedrooms: 3,
      bathrooms: 3,
      amenities: ["Vista panorámica", "Jacuzzi", "Terraza", "Gimnasio privado"],
      matchCount: 2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarjetas de Presentación</h1>
          <p className="text-muted-foreground">
            Perfiles de búsqueda de clientes
          </p>
        </div>
        <Button data-testid="button-new-card">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarjeta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <ClientPresentationCard
            key={card.id}
            {...card}
            onSave={() => console.log("Guardar tarjeta", card.id)}
            onShare={() => console.log("Compartir tarjeta", card.id)}
            onViewMatches={() => console.log("Ver coincidencias", card.id)}
          />
        ))}
      </div>
    </div>
  );
}
