import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User, Building, Phone, Mail, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAppointmentDetails } from "@/hooks/useAppointments";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

type VisitDetailsCardProps = {
  appointmentId: string;
  onSubmitFeedback?: () => void;
  onSendCredentials?: () => void;
  onAutoApprove?: () => void;
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  visita_cliente: "Visita de Cliente",
  visita_mantenimiento: "Visita de Mantenimiento",
  visita_limpieza: "Visita de Limpieza",
  visita_reconocimiento: "Visita de Reconocimiento",
  material_multimedia: "Visita para Material Multimedia",
  visita_inspeccion: "Visita de Inspección",
  otra: "Otra Visita",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function VisitDetailsCard({ 
  appointmentId, 
  onSubmitFeedback,
  onSendCredentials,
  onAutoApprove,
}: VisitDetailsCardProps) {
  const { user } = useAuth();
  const { data: appointment, isLoading } = useAppointmentDetails(appointmentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No se encontró la visita</p>
        </CardContent>
      </Card>
    );
  }

  const isOwner = user?.role === "owner" || user?.role === "seller";
  const isAdmin = ["master", "admin", "admin_jr"].includes(user?.role || "");
  const isClientVisit = appointment.visitType === "visita_cliente";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const appointmentDate = new Date(appointment.date);
  const propertyName = appointment.property?.condoName && appointment.property?.unitNumber
    ? `${appointment.property.condoName} - Unidad ${appointment.property.unitNumber}`
    : appointment.property?.title 
    || (appointment.condominiumName && appointment.unitNumber 
      ? `${appointment.condominiumName} - Unidad ${appointment.unitNumber}` 
      : "Propiedad");

  return (
    <Card data-testid={`visit-card-${appointmentId}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate">{VISIT_TYPE_LABELS[appointment.visitType] || appointment.visitType}</CardTitle>
            <p className="text-sm text-muted-foreground truncate mt-1">{propertyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={STATUS_COLORS[appointment.status]} data-testid="badge-status">
            {appointment.status === "pending" && "Pendiente"}
            {appointment.status === "confirmed" && "Confirmada"}
            {appointment.status === "completed" && "Completada"}
            {appointment.status === "cancelled" && "Cancelada"}
          </Badge>
          <Badge className={APPROVAL_STATUS_COLORS[appointment.ownerApprovalStatus]} data-testid="badge-approval">
            {appointment.ownerApprovalStatus === "pending" && "Aprobación Pendiente"}
            {appointment.ownerApprovalStatus === "approved" && "Aprobada"}
            {appointment.ownerApprovalStatus === "rejected" && "Rechazada"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fecha y Hora */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, "HH:mm", { locale: es })}</span>
          </div>
        </div>

        {/* Información de la Propiedad */}
        {(appointment.property || (appointment.condominiumName && appointment.unitNumber)) && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Ubicación
            </h3>
            <div className="space-y-1 text-sm">
              {appointment.property ? (
                <>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{appointment.property.location}</span>
                  </p>
                  {appointment.property.condominium && (
                    <p className="text-muted-foreground">
                      {appointment.property.condominium.name}
                      {appointment.property.unitNumber && ` - Unidad ${appointment.property.unitNumber}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    <span>{appointment.condominiumName}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Unidad {appointment.unitNumber}
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-1">
                    * Propiedad ingresada manualmente (no registrada en el sistema)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Información de Cliente (solo para visitas de cliente y con restricciones) */}
        {isClientVisit && appointment.client && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {appointment.client.profileImageUrl && (
                  <AvatarImage src={appointment.client.profileImageUrl} />
                )}
                <AvatarFallback>
                  {getInitials(`${appointment.client.firstName} ${appointment.client.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {appointment.client.firstName} {appointment.client.lastName}
                </p>
                {appointment.client.presentationCard && (
                  <p className="text-sm text-muted-foreground truncate">
                    {appointment.client.presentationCard.jobTitle && 
                      `${appointment.client.presentationCard.jobTitle}`}
                    {appointment.client.presentationCard.company && 
                      ` en ${appointment.client.presentationCard.company}`}
                  </p>
                )}
              </div>
            </div>
            {isOwner && (
              <p className="text-xs text-muted-foreground mt-2">
                * Información de contacto restringida para protección de privacidad
              </p>
            )}
          </div>
        )}

        {/* Información del Conserje */}
        {appointment.concierge && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Conserje Designado
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {appointment.concierge.profileImageUrl && (
                  <AvatarImage src={appointment.concierge.profileImageUrl} />
                )}
                <AvatarFallback>
                  {getInitials(`${appointment.concierge.firstName} ${appointment.concierge.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="font-medium">
                  {appointment.concierge.firstName} {appointment.concierge.lastName}
                </p>
                {appointment.concierge.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <a 
                      href={`https://wa.me/${appointment.concierge.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      data-testid="link-concierge-phone"
                    >
                      {appointment.concierge.phone}
                    </a>
                  </div>
                )}
                {appointment.concierge.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a 
                      href={`mailto:${appointment.concierge.email}`}
                      className="text-primary hover:underline truncate"
                      data-testid="link-concierge-email"
                    >
                      {appointment.concierge.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Información del Staff (para visitas que NO son de cliente) */}
        {!isClientVisit && appointment.staffMember && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Persona Asignada
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{appointment.staffMember.name}</p>
                  {appointment.staffMember.position && (
                    <p className="text-sm text-muted-foreground">{appointment.staffMember.position}</p>
                  )}
                  {appointment.staffMember.company && (
                    <p className="text-sm text-muted-foreground">{appointment.staffMember.company}</p>
                  )}
                </div>
              </div>
              {appointment.staffMember.whatsapp && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`https://wa.me/${appointment.staffMember.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    data-testid="link-whatsapp"
                  >
                    {appointment.staffMember.whatsapp}
                  </a>
                </div>
              )}
              {appointment.staffMember.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${appointment.staffMember.email}`}
                    className="text-primary hover:underline truncate"
                    data-testid="link-email"
                  >
                    {appointment.staffMember.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credenciales de Acceso */}
        {!isClientVisit && isAdmin && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Credenciales de Acceso
              </h3>
              {appointment.accessCredentialsSent ? (
                <Badge variant="secondary" className="gap-1" data-testid="badge-credentials-sent">
                  <CheckCircle className="h-3 w-3" />
                  Enviadas
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSendCredentials}
                  data-testid="button-send-credentials"
                >
                  Enviar Credenciales
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        {appointment.notes && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notas
            </h3>
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}

        {/* Feedback del Cliente */}
        {appointment.clientFeedback && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Feedback del Cliente</h3>
            <div className="bg-muted/50 rounded-md p-3">
              {typeof appointment.clientFeedback === 'object' && (
                <div className="space-y-1 text-sm">
                  {appointment.clientFeedback.liked && (
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {appointment.clientFeedback.message}
                    </p>
                  )}
                  {!appointment.clientFeedback.liked && (
                    <p className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      {appointment.clientFeedback.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback del Staff */}
        {appointment.staffFeedback && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Reporte del Personal</h3>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">{appointment.staffFeedback}</p>
            </div>
          </div>
        )}

        {/* Acciones para Administradores */}
        {isAdmin && appointment.ownerApprovalStatus === "pending" && onAutoApprove && (
          <div className="border-t pt-4">
            <Button
              onClick={onAutoApprove}
              className="w-full"
              data-testid="button-auto-approve"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Auto-aprobar Cita
            </Button>
          </div>
        )}

        {/* Botón de Feedback */}
        {appointment.status === "completed" && !appointment.clientFeedback && !appointment.staffFeedback && onSubmitFeedback && (
          <div className="border-t pt-4">
            <Button
              onClick={onSubmitFeedback}
              className="w-full"
              variant="outline"
              data-testid="button-submit-feedback"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Dejar Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
