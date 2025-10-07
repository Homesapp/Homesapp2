import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, MessageSquare, Key, MapPin, Phone, Lock } from "lucide-react";
import type { Appointment } from "@shared/schema";

interface PropertyVisitsProps {
  propertyId: string;
}

interface ExtendedAppointment extends Appointment {
  clientName?: string;
  clientEmail?: string;
  feedback?: string;
}

const visitTypeLabels: Record<string, string> = {
  visita_cliente: "Visita de Cliente",
  visita_mantenimiento: "Mantenimiento",
  visita_limpieza: "Limpieza",
  visita_reconocimiento: "Reconocimiento",
  material_multimedia: "Material Multimedia",
  visita_inspeccion: "Inspección",
  otra: "Otra",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export function PropertyVisits({ propertyId }: PropertyVisitsProps) {
  const { data: property } = useQuery({
    queryKey: ["/api/owner/properties", propertyId, "detail"],
  });

  const { data: appointments = [], isLoading } = useQuery<ExtendedAppointment[]>({
    queryKey: ["/api/properties", propertyId, "appointments"],
  });

  if (isLoading) {
    return <div>Cargando visitas...</div>;
  }

  // Access information from property
  const accessInfo = property?.accessInfo as any;

  return (
    <div className="space-y-6">
      {/* Access Information Card */}
      {accessInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Información de Acceso</CardTitle>
            <CardDescription>Detalles de acceso para las visitas a la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accessInfo.accessType === "unattended" ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Acceso sin atención</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Método: {accessInfo.method === "lockbox" ? "Caja de seguridad" : "Cerradura inteligente"}
                    </p>
                  </div>
                </div>
                {accessInfo.method === "lockbox" && (
                  <>
                    {accessInfo.lockboxCode && (
                      <div className="flex items-start gap-3 pl-8">
                        <Key className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Código de caja: {accessInfo.lockboxCode}</p>
                        </div>
                      </div>
                    )}
                    {accessInfo.lockboxLocation && (
                      <div className="flex items-start gap-3 pl-8">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Ubicación: {accessInfo.lockboxLocation}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {accessInfo.method === "smart_lock" && accessInfo.smartLockInstructions && (
                  <div className="flex items-start gap-3 pl-8">
                    <div className="flex-1">
                      <p className="text-sm">{accessInfo.smartLockInstructions}</p>
                      {accessInfo.smartLockProvider && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Proveedor: {accessInfo.smartLockProvider}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : accessInfo.accessType === "attended" ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Acceso con atención</p>
                    <p className="text-sm text-muted-foreground">
                      Alguien abrirá la puerta
                    </p>
                  </div>
                </div>
                {accessInfo.contactPerson && (
                  <div className="flex items-start gap-3 pl-8">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contacto: {accessInfo.contactPerson}</p>
                    </div>
                  </div>
                )}
                {accessInfo.contactPhone && (
                  <div className="flex items-start gap-3 pl-8">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Teléfono: {accessInfo.contactPhone}</p>
                    </div>
                  </div>
                )}
                {accessInfo.contactNotes && (
                  <div className="flex items-start gap-3 pl-8">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{accessInfo.contactNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay información de acceso configurada</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Visits History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Visitas</CardTitle>
          <CardDescription>Historial de visitas realizadas a esta propiedad</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay visitas registradas para esta propiedad</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`appointment-${appointment.id}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">
                          {visitTypeLabels[appointment.visitType] || appointment.visitType}
                        </h4>
                        <Badge variant={statusColors[appointment.status]}>
                          {statusLabels[appointment.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(appointment.startTime).toLocaleDateString("es-ES")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(appointment.startTime).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {appointment.clientName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {appointment.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Notas:</p>
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    </>
                  )}

                  {appointment.feedback && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Feedback:</p>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{appointment.feedback}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
