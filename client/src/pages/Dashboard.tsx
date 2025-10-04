import { Building2, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PropertyCard } from "@/components/PropertyCard";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useMemo } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { data: properties, isLoading } = useProperties({ active: true });
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  const updateAppointment = useUpdateAppointment();

  const featuredProperties = properties?.slice(0, 2) || [];

  const upcomingAppointments = useMemo(() => {
    if (!appointments || !properties) return [];

    const now = new Date();
    const upcoming = appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now && (apt.status === "pending" || apt.status === "confirmed");
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2);

    return upcoming.map(appointment => {
      const property = properties.find(p => p.id === appointment.propertyId);
      
      return {
        id: appointment.id,
        propertyTitle: property?.title || "Propiedad",
        clientName: "Cliente",
        date: format(new Date(appointment.date), "dd MMM yyyy"),
        time: format(new Date(appointment.date), "h:mm a"),
        type: appointment.type,
        status: appointment.status,
        meetLink: appointment.meetLink || undefined,
      };
    });
  }, [appointments, properties]);

  const handleConfirm = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "confirmed" },
      });
      toast({
        title: "Cita confirmada",
        description: "La cita ha sido confirmada exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled" },
      });
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita",
        variant: "destructive",
      });
    }
  };

  const pendingAppointmentsCount = appointments?.filter(a => a.status === "pending").length || 0;

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
          value={properties?.length || 0}
          icon={Building2}
          trend={{ value: 12, label: "vs mes anterior" }}
        />
        <StatsCard
          title="Citas Pendientes"
          value={pendingAppointmentsCount}
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
            {isLoading ? (
              <>
                <div className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </>
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={Number(property.price)}
                  bedrooms={property.bedrooms}
                  bathrooms={Number(property.bathrooms)}
                  area={Number(property.area)}
                  location={property.location}
                  status={property.status}
                  onView={() => console.log("Ver propiedad", property.id)}
                  onEdit={() => console.log("Editar", property.id)}
                  onSchedule={() => console.log("Agendar", property.id)}
                />
              ))
            ) : (
              <div className="text-center py-8" data-testid="no-featured-properties">
                <p className="text-muted-foreground">No hay propiedades destacadas</p>
              </div>
            )}
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
            {appointmentsLoading ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  {...appointment}
                  onConfirm={() => handleConfirm(appointment.id)}
                  onCancel={() => handleCancel(appointment.id)}
                />
              ))
            ) : (
              <div className="text-center py-8" data-testid="no-upcoming-appointments">
                <p className="text-muted-foreground">No hay citas próximas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
