import { Building2, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PropertyCard } from "@/components/PropertyCard";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de control</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-new-property">
            <Building2 className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
          <Button data-testid="button-new-appointment">
            <Calendar className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Propiedades Activas"
          value={45}
          icon={Building2}
          trend={{ value: 12, label: "vs mes anterior" }}
        />
        <StatsCard
          title="Citas Pendientes"
          value={8}
          icon={Clock}
          description="Esta semana"
        />
        <StatsCard
          title="Nuevos Clientes"
          value={23}
          icon={Users}
          trend={{ value: 8, label: "este mes" }}
        />
        <StatsCard
          title="Ingresos"
          value="$1.2M"
          icon={TrendingUp}
          trend={{ value: 15, label: "vs mes anterior" }}
        />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar propiedades, clientes..."
            className="pl-9"
            data-testid="input-global-search"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Propiedades Destacadas</h2>
            <Button variant="ghost" size="sm" data-testid="button-view-all-properties">
              Ver todas
            </Button>
          </div>
          <div className="grid gap-4">
            <PropertyCard
              id="1"
              title="Casa Moderna en Polanco"
              price={25000}
              bedrooms={3}
              bathrooms={2}
              area={180}
              location="Polanco, CDMX"
              status="rent"
              onView={() => console.log("Ver propiedad")}
              onEdit={() => console.log("Editar")}
              onSchedule={() => console.log("Agendar")}
            />
            <PropertyCard
              id="2"
              title="Departamento en Santa Fe"
              price={4500000}
              bedrooms={2}
              bathrooms={2}
              area={120}
              location="Santa Fe, CDMX"
              status="sale"
              onView={() => console.log("Ver propiedad")}
              onSchedule={() => console.log("Agendar")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Próximas Citas</h2>
            <Button variant="ghost" size="sm" data-testid="button-view-all-appointments">
              Ver todas
            </Button>
          </div>
          <div className="grid gap-4">
            <AppointmentCard
              id="1"
              propertyTitle="Casa Moderna en Polanco"
              clientName="María González"
              date="15 Oct 2025"
              time="10:00 AM"
              type="video"
              status="pending"
              meetLink="https://meet.google.com/abc-defg-hij"
              onConfirm={() => console.log("Confirmar")}
              onCancel={() => console.log("Cancelar")}
            />
            <AppointmentCard
              id="2"
              propertyTitle="Departamento en Santa Fe"
              clientName="Carlos Rodríguez"
              date="16 Oct 2025"
              time="3:00 PM"
              type="in-person"
              status="confirmed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
