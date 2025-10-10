import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, User as UserIcon, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HoaManagerAssignment } from "@shared/schema";

type Condominium = {
  id: string;
  name: string;
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type HoaManagerAssignmentWithDetails = HoaManagerAssignment & {
  condominium?: Condominium;
  manager?: User;
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  suspended: "Suspendido",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  suspended: "destructive",
};

export function HoaManagerRequests() {
  const [selectedAssignment, setSelectedAssignment] = useState<HoaManagerAssignmentWithDetails | null>(null);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  const { data: assignments = [], isLoading } = useQuery<HoaManagerAssignmentWithDetails[]>({
    queryKey: ["/api/hoa-manager/all-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/hoa-manager/all-assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });

  const approveAssignment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/hoa-manager/assignments/${id}/approve`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "El usuario ha sido aprobado como HOA Manager",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hoa-manager/all-assignments"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    },
  });

  const rejectAssignment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/hoa-manager/assignments/${id}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud de HOA Manager ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hoa-manager/all-assignments"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (assignment: HoaManagerAssignmentWithDetails, action: "approve" | "reject") => {
    setSelectedAssignment(assignment);
    setActionType(action);
    setReason("");
  };

  const handleCloseDialog = () => {
    setSelectedAssignment(null);
    setActionType(null);
    setReason("");
  };

  const handleConfirmAction = async () => {
    if (!selectedAssignment || !actionType || !reason.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un motivo",
        variant: "destructive",
      });
      return;
    }

    try {
      if (actionType === "approve") {
        await approveAssignment.mutateAsync({
          id: selectedAssignment.id,
          reason: reason.trim(),
        });
      } else {
        await rejectAssignment.mutateAsync({
          id: selectedAssignment.id,
          reason: reason.trim(),
        });
      }
    } catch (error: any) {
      // Error handled by mutation onError
    }
  };

  const getUserName = (assignment: HoaManagerAssignmentWithDetails) => {
    if (assignment.manager?.firstName && assignment.manager?.lastName) {
      return `${assignment.manager.firstName} ${assignment.manager.lastName}`;
    }
    return assignment.manager?.email || "Usuario desconocido";
  };

  const pendingAssignments = assignments.filter(a => a.status === "pending");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingAssignments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No hay solicitudes de HOA Manager pendientes
            </p>
          </CardContent>
        </Card>
      ) : (
        pendingAssignments.map((assignment) => (
          <Card key={assignment.id} data-testid={`card-hoa-assignment-${assignment.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {getUserName(assignment)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3" />
                      {assignment.condominium?.name || "Condominio no especificado"}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={statusColors[assignment.status]} data-testid={`badge-status-${assignment.id}`}>
                  {statusLabels[assignment.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignment.notes && (
                <div>
                  <Label className="text-sm font-semibold">Notas del solicitante:</Label>
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notes-${assignment.id}`}>
                    {assignment.notes}
                  </p>
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-md space-y-2">
                <Label className="text-sm font-semibold">Detalles de la solicitud:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Solicitado:</p>
                    <p className="text-sm font-medium">
                      {format(new Date(assignment.requestedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email:</p>
                    <p className="text-sm font-medium">
                      {assignment.manager?.email || "No disponible"}
                    </p>
                  </div>
                </div>
              </div>

              {assignment.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenDialog(assignment, "reject")}
                    data-testid={`button-reject-${assignment.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleOpenDialog(assignment, "approve")}
                    data-testid={`button-approve-${assignment.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprobar" : "Rechazar"} Solicitud de HOA Manager
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Proporciona un motivo de aprobación. El usuario recibirá una notificación con este mensaje."
                : "Proporciona un motivo de rechazo. El usuario recibirá una notificación con este mensaje."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedAssignment && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm font-medium">{getUserName(selectedAssignment)}</p>
                <p className="text-sm text-muted-foreground">
                  Condominio: {selectedAssignment.condominium?.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo de {actionType === "approve" ? "aprobación" : "rechazo"} *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Ej: El solicitante tiene experiencia comprobada en administración de condominios"
                    : "Ej: El solicitante no cumple con los requisitos necesarios"
                }
                rows={4}
                data-testid="textarea-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-dialog"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={!reason.trim() || approveAssignment.isPending || rejectAssignment.isPending}
              variant={actionType === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-dialog"
            >
              {approveAssignment.isPending || rejectAssignment.isPending
                ? "Procesando..."
                : actionType === "approve"
                ? "Aprobar"
                : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
