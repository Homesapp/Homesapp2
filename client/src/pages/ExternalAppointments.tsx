import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Building2, Eye, Phone, Navigation } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { type Appointment, type Property } from "@shared/schema";

interface AppointmentWithProperty extends Appointment {
  property?: Property & {
    externalAgencyName?: string | null;
    externalAgencyLogoUrl?: string | null;
  };
  client?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}

export default function ExternalAppointments() {
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const { t } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: allAppointments = [], isLoading } = useQuery<AppointmentWithProperty[]>({
    queryKey: ["/api/appointments"],
  });

  const externalAppointments = useMemo(() => {
    return allAppointments.filter((appt) => appt.property?.externalAgencyId);
  }, [allAppointments]);

  const filteredAppointments = useMemo(() => {
    const now = startOfDay(new Date());
    
    return externalAppointments.filter((appt) => {
      if (statusFilter === "upcoming") {
        return isAfter(new Date(appt.scheduledAt), now);
      }
      if (statusFilter === "past") {
        return isBefore(new Date(appt.scheduledAt), now);
      }
      return true;
    });
  }, [externalAppointments, statusFilter]);

  const upcomingCount = useMemo(() => {
    const now = startOfDay(new Date());
    return externalAppointments.filter((appt) => isAfter(new Date(appt.scheduledAt), now)).length;
  }, [externalAppointments]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "outline" as const },
      confirmed: { label: "Confirmada", variant: "default" as const },
      completed: { label: "Completada", variant: "secondary" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
      rescheduled: { label: "Reagendada", variant: "outline" as const },
      no_show: { label: "No asistió", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewProperty = (propertyId: string) => {
    setLocation(`/propiedad/${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Citas con Propiedades Externas</CardTitle>
              <CardDescription>
                Administra tus citas con propiedades de agencias asociadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{externalAppointments.length} citas totales</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{upcomingCount} próximas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all" data-testid="tab-all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">Pasadas</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6 space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Sin citas</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "upcoming"
                    ? "No tienes citas próximas con propiedades externas"
                    : statusFilter === "past"
                    ? "No tienes citas pasadas con propiedades externas"
                    : "No tienes citas con propiedades externas"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {appointment.property?.externalAgencyLogoUrl && (
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={appointment.property.externalAgencyLogoUrl} 
                                alt={appointment.property.externalAgencyName || "Agency"} 
                              />
                              <AvatarFallback>
                                <Building2 className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {appointment.property?.title || "Propiedad"}
                            </h3>
                            {appointment.property?.externalAgencyName && (
                              <p className="text-sm text-muted-foreground">
                                {t("property.listedBy")}: {appointment.property.externalAgencyName}
                              </p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.scheduledAt), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.scheduledAt), "HH:mm")}
                            {appointment.duration && ` - ${appointment.duration} min`}
                          </span>
                        </div>
                        {appointment.property?.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.property.location}</span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProperty(appointment.propertyId!)}
                        data-testid={`button-view-property-${appointment.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Propiedad
                      </Button>
                      {appointment.property?.googleMapsUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(appointment.property!.googleMapsUrl!, "_blank")}
                          data-testid={`button-navigate-${appointment.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navegar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
