import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, User, CheckCircle, XCircle, FileText, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type AppointmentCardProps = {
  id: string;
  propertyTitle: string;
  clientName: string;
  clientAvatar?: string;
  date: string;
  time: string;
  type: "in-person" | "video";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  meetLink?: string;
  conciergeReport?: string | null;
  accessIssues?: string | null;
  conciergeId?: string | null;
  userRole?: string;
  userId?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onReportResult?: () => void;
};

export function AppointmentCard({
  propertyTitle,
  clientName,
  clientAvatar,
  date,
  time,
  type,
  status,
  meetLink,
  conciergeReport,
  accessIssues,
  conciergeId,
  userRole,
  userId,
  onConfirm,
  onCancel,
  onReportResult,
}: AppointmentCardProps) {
  const statusLabels = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  const statusVariants = {
    pending: "outline" as const,
    confirmed: "default" as const,
    completed: "secondary" as const,
    cancelled: "destructive" as const,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const canViewReport = userRole && ["master", "admin", "admin_jr", "owner", "concierge"].includes(userRole);
  const canCreateReport = userRole === "concierge" && conciergeId === userId && status === "completed";
  const needsReport = status === "completed" && !conciergeReport && canCreateReport;

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-10 w-10">
            {clientAvatar && <AvatarImage src={clientAvatar} />}
            <AvatarFallback>{getInitials(clientName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{clientName}</p>
            <p className="text-sm text-muted-foreground truncate">{propertyTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {needsReport && (
            <Badge variant="outline" className="bg-yellow-500/10" data-testid="badge-needs-report">
              Necesita Reporte
            </Badge>
          )}
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-1">
            {type === "video" ? (
              <>
                <Video className="h-4 w-4 text-muted-foreground" />
                <span>Videollamada</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Presencial</span>
              </>
            )}
          </div>
        </div>

        {type === "video" && meetLink && status === "confirmed" && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open(meetLink, "_blank")}
            data-testid="button-join-meet"
          >
            <Video className="h-4 w-4 mr-2" />
            Unirse a Videollamada
          </Button>
        )}

        {accessIssues && (
          <div className="rounded-md bg-destructive/10 p-3" data-testid="access-issues-section">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-destructive">Problemas de Acceso</p>
                <p className="text-sm text-muted-foreground mt-1">{accessIssues}</p>
              </div>
            </div>
          </div>
        )}

        {conciergeReport && canViewReport && (
          <div className="rounded-md bg-muted p-3" data-testid="concierge-report-section">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Reporte del Conserje</p>
                <p className="text-sm text-muted-foreground mt-1">{conciergeReport}</p>
              </div>
            </div>
          </div>
        )}

        {status === "pending" && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onConfirm}
              data-testid="button-confirm-appointment"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={onCancel}
              data-testid="button-cancel-appointment"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}

        {canCreateReport && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={onReportResult}
            data-testid="button-report-result"
          >
            <FileText className="h-4 w-4 mr-2" />
            Reportar Resultado
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
