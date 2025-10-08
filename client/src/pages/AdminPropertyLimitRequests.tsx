import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, TrendingUp, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type RequestStatus = "pending" | "approved" | "rejected";

interface Owner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
}

interface PropertyLimitRequest {
  id: string;
  ownerId: string;
  requestedLimit: number;
  currentLimit: number;
  reason: string;
  status: RequestStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: Owner;
}

export default function AdminPropertyLimitRequests() {
  const [selectedRequest, setSelectedRequest] = useState<PropertyLimitRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("pending");
  const { toast } = useToast();

  const { data: allRequests = [], isLoading } = useQuery<PropertyLimitRequest[]>({
    queryKey: ["/api/property-limit-requests"],
  });

  const filteredRequests = statusFilter === "all" 
    ? allRequests 
    : allRequests.filter(req => req.status === statusFilter);

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest(`/api/property-limit-requests/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes: notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud aprobada",
        description: "El límite de propiedades ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-limit-requests"] });
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

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest(`/api/property-limit-requests/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNotes: notes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/property-limit-requests"] });
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

  const handleOpenReview = (request: PropertyLimitRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes(request.reviewNotes || "");
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    if (reviewAction === "approve") {
      approveMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    } else if (reviewAction === "reject") {
      rejectMutation.mutate({ id: selectedRequest.id, notes: reviewNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobada" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazada" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1" data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando solicitudes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-property-limit-requests">Solicitudes de Límite de Propiedades</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de aumento de límite de propiedades
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allRequests.filter(r => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobadas ({allRequests.filter(r => r.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({allRequests.filter(r => r.status === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({allRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-6">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay solicitudes {statusFilter !== "all" && statusFilter === "pending" ? "pendientes" : statusFilter === "approved" ? "aprobadas" : statusFilter === "rejected" ? "rechazadas" : ""}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {request.owner?.firstName} {request.owner?.lastName}
                        </CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardDescription className="flex flex-col gap-1">
                        <span>{request.owner?.email}</span>
                        <span className="text-xs">
                          Solicitado: {format(new Date(request.createdAt), "PPp", { locale: es })}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Límite Actual</div>
                        <div className="text-2xl font-bold">{request.currentLimit}</div>
                      </div>
                      <div className="text-muted-foreground">→</div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Límite Solicitado</div>
                        <div className="text-2xl font-bold text-primary">{request.requestedLimit}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Motivo de la Solicitud:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                  </div>

                  {request.reviewNotes && (
                    <div>
                      <Label className="text-sm font-medium">Notas de Revisión:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{request.reviewNotes}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleOpenReview(request, "approve")}
                        variant="default"
                        size="sm"
                        data-testid={`button-approve-${request.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => handleOpenReview(request, "reject")}
                        variant="destructive"
                        size="sm"
                        data-testid={`button-reject-${request.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest && !!reviewAction} onOpenChange={handleCloseDialog}>
        <DialogContent data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar" : "Rechazar"} Solicitud
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? `Se actualizará el límite de ${selectedRequest?.currentLimit} a ${selectedRequest?.requestedLimit} propiedades.`
                : "La solicitud será rechazada y no se realizarán cambios."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="review-notes">Notas de Revisión (opcional)</Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Agrega comentarios sobre tu decisión..."
                rows={4}
                data-testid="textarea-review-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-testid="button-submit-review"
            >
              {approveMutation.isPending || rejectMutation.isPending ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
