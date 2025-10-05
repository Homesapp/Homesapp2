import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleVisitDialog } from "@/components/ScheduleVisitDialog";
import { Calendar, MapPin, Clock, Video, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { type RentalOpportunityRequest, type Property, type Appointment } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SORWithDetails extends RentalOpportunityRequest {
  property?: Property;
  appointment?: Appointment;
}

export default function MyOpportunities() {
  const [selectedSOR, setSelectedSOR] = useState<SORWithDetails | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const { data: sors = [], isLoading } = useQuery<SORWithDetails[]>({
    queryKey: ["/api/my-rental-opportunities"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      scheduled_visit: { label: "Visita Programada", variant: "default" as const, icon: Calendar },
      accepted: { label: "Aceptada", variant: "default" as const, icon: CheckCircle2 },
      rejected: { label: "Rechazada", variant: "destructive" as const, icon: XCircle },
      expired: { label: "Expirada", variant: "secondary" as const, icon: XCircle },
      cancelled: { label: "Cancelada", variant: "secondary" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleScheduleVisit = (sor: SORWithDetails) => {
    setSelectedSOR(sor);
    setShowScheduleDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mis Solicitudes de Oportunidad</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus solicitudes de renta y programa visitas
        </p>
      </div>

      {sors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes solicitudes de oportunidad de renta activas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sors.map((sor) => (
            <Card key={sor.id} data-testid={`card-sor-${sor.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {sor.property?.title || "Propiedad"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{sor.property?.location}</span>
                    </div>
                  </div>
                  {getStatusBadge(sor.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {sor.desiredMoveInDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fecha deseada de mudanza:</span>
                    <span className="font-medium">
                      {format(new Date(sor.desiredMoveInDate), "dd 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                )}

                {sor.preferredContactMethod && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Método de contacto preferido:</span>
                    <Badge variant="outline">{sor.preferredContactMethod}</Badge>
                  </div>
                )}

                {sor.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">Notas:</p>
                    <p className="text-foreground">{sor.notes}</p>
                  </div>
                )}

                {sor.status === "scheduled_visit" && sor.appointment && (
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Visita Programada
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        Fecha: {format(new Date(sor.appointment.date), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                      <p className="flex items-center gap-2">
                        Tipo: {sor.appointment.type === "video" ? (
                          <>
                            <Video className="h-4 w-4" />
                            <span>Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>Presencial</span>
                          </>
                        )}
                      </p>
                      {sor.appointment.meetLink && (
                        <div className="pt-2">
                          <a
                            href={sor.appointment.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                            data-testid="link-meet"
                          >
                            <Video className="h-4 w-4" />
                            Unirse a la reunión de Google Meet
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {sor.status === "pending" && (
                  <Button
                    onClick={() => handleScheduleVisit(sor)}
                    className="w-full"
                    data-testid="button-schedule-visit"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Visita
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSOR && (
        <ScheduleVisitDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          sorId={selectedSOR.id}
          propertyTitle={selectedSOR.property?.title || "Propiedad"}
        />
      )}
    </div>
  );
}
