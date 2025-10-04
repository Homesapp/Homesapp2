import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, User, CheckCircle, XCircle } from "lucide-react";
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
  onConfirm?: () => void;
  onCancel?: () => void;
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
  onConfirm,
  onCancel,
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
        <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
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
      </CardContent>
    </Card>
  );
}
