import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, SlidersHorizontal } from "lucide-react";

export default function Properties() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const properties = [
    {
      id: "1",
      title: "Casa Moderna en Polanco",
      price: 25000,
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      location: "Polanco, CDMX",
      status: "rent" as const,
    },
    {
      id: "2",
      title: "Departamento en Santa Fe",
      price: 4500000,
      bedrooms: 2,
      bathrooms: 2,
      area: 120,
      location: "Santa Fe, CDMX",
      status: "sale" as const,
    },
    {
      id: "3",
      title: "Penthouse con Vista Panorámica",
      price: 8500000,
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      location: "Interlomas, Estado de México",
      status: "both" as const,
    },
    {
      id: "4",
      title: "Casa Residencial con Jardín",
      price: 35000,
      bedrooms: 4,
      bathrooms: 3,
      area: 220,
      location: "Coyoacán, CDMX",
      status: "rent" as const,
    },
    {
      id: "5",
      title: "Loft Moderno Centro",
      price: 2800000,
      bedrooms: 1,
      bathrooms: 1,
      area: 85,
      location: "Roma Norte, CDMX",
      status: "sale" as const,
    },
    {
      id: "6",
      title: "Casa en Fraccionamiento Privado",
      price: 28000,
      bedrooms: 3,
      bathrooms: 2.5,
      area: 195,
      location: "San Ángel, CDMX",
      status: "rent" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Propiedades</h1>
          <p className="text-muted-foreground">{properties.length} propiedades disponibles</p>
        </div>
        <Button data-testid="button-add-property">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Propiedad
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ubicación, características..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-properties"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="rent">En Renta</SelectItem>
            <SelectItem value="sale">En Venta</SelectItem>
            <SelectItem value="both">Renta y Venta</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" data-testid="button-advanced-filters">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros Avanzados
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            {...property}
            onView={() => console.log("Ver propiedad", property.id)}
            onEdit={() => console.log("Editar propiedad", property.id)}
            onSchedule={() => console.log("Agendar cita", property.id)}
          />
        ))}
      </div>
    </div>
  );
}
