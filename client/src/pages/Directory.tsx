import { useState } from "react";
import { ServiceProviderCard } from "@/components/ServiceProviderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function Directory() {
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const providers = [
    {
      id: "1",
      name: "Juan Pérez",
      specialty: "Electricista",
      rating: 4.8,
      reviewCount: 24,
      available: true,
      services: [
        { name: "Instalación eléctrica", price: 1500, description: "Instalación completa de sistema eléctrico" },
        { name: "Reparación de fallas", price: 800, description: "Diagnóstico y reparación" },
      ],
    },
    {
      id: "2",
      name: "María Hernández",
      specialty: "Plomero",
      rating: 4.9,
      reviewCount: 31,
      available: false,
      services: [
        { name: "Reparación de fugas", price: 600, description: "Detección y reparación de fugas de agua" },
        { name: "Instalación de tuberías", price: 2000, description: "Instalación completa de sistema de plomería" },
        { name: "Mantenimiento preventivo", price: 500, description: "Revisión general del sistema" },
      ],
    },
    {
      id: "3",
      name: "Carlos Sánchez",
      specialty: "Limpieza",
      rating: 4.7,
      reviewCount: 18,
      available: true,
      services: [
        { name: "Limpieza profunda", price: 1200, description: "Limpieza completa de la propiedad" },
        { name: "Limpieza de mantenimiento", price: 700, description: "Limpieza regular semanal" },
      ],
    },
    {
      id: "4",
      name: "Ana López",
      specialty: "Jardinería",
      rating: 4.6,
      reviewCount: 15,
      available: true,
      services: [
        { name: "Mantenimiento de jardín", price: 900, description: "Poda, riego y cuidado general" },
        { name: "Diseño de jardines", price: 3500, description: "Diseño y creación de espacios verdes" },
      ],
    },
    {
      id: "5",
      name: "Roberto Díaz",
      specialty: "Mantenimiento General",
      rating: 4.5,
      reviewCount: 22,
      available: true,
      services: [
        { name: "Reparaciones menores", price: 500, description: "Arreglos generales del hogar" },
        { name: "Pintura", price: 1800, description: "Pintura de interiores y exteriores" },
      ],
    },
    {
      id: "6",
      name: "Laura Martínez",
      specialty: "Contador",
      rating: 5.0,
      reviewCount: 42,
      available: false,
      services: [
        { name: "Asesoría fiscal", price: 2500, description: "Consultoría y planificación fiscal" },
        { name: "Contabilidad mensual", price: 3000, description: "Gestión contable completa" },
      ],
    },
  ];

  const filterProviders = () => {
    let filtered = providers;
    if (specialtyFilter !== "all") {
      filtered = filtered.filter((p) => p.specialty === specialtyFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const specialties = Array.from(new Set(providers.map((p) => p.specialty)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Directorio de Servicios</h1>
        <p className="text-muted-foreground">
          Encuentra proveedores de servicios para tus propiedades
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o especialidad..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-providers"
          />
        </div>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-specialty-filter">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las especialidades</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filterProviders().map((provider) => (
          <ServiceProviderCard
            key={provider.id}
            {...provider}
            onMessage={() => console.log("Mensaje a", provider.name)}
            onCall={() => console.log("Llamar a", provider.name)}
            onHire={() => console.log("Contratar a", provider.name)}
          />
        ))}
      </div>

      {filterProviders().length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron proveedores
        </div>
      )}
    </div>
  );
}
