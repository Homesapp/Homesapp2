import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Clock, Building2, Plus } from "lucide-react";
import type { Condominium } from "@shared/schema";
import { format } from "date-fns";

type CondominiumStatus = "pending" | "approved" | "rejected";

interface CondominiumWithUser extends Omit<Condominium, 'requestedBy'> {
  requestedBy?: { email: string; name?: string } | string | null;
}

export default function AdminCondominiums() {
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumWithUser | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [statusFilter, setStatusFilter] = useState<CondominiumStatus | "all">("pending");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCondominiumName, setNewCondominiumName] = useState("");
  const { toast } = useToast();

  const { data: allCondominiums = [], isLoading } = useQuery<CondominiumWithUser[]>({
    queryKey: ["/api/condominiums"],
  });

  const filteredCondominiums = statusFilter === "all" 
    ? allCondominiums 
    : allCondominiums.filter(condo => condo.approvalStatus === statusFilter);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Condominio aprobado",
        description: "El condominio ha sido aprobado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo aprobar el condominio",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Condominio rechazado",
        description: "El condominio ha sido rechazado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar el condominio",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/condominiums", { name });
    },
    onSuccess: () => {
      toast({
        title: "Condominio creado",
        description: "El condominio ha sido creado y está pendiente de aprobación",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      setShowCreateDialog(false);
      setNewCondominiumName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el condominio",
        variant: "destructive",
      });
    },
  });

  const handleOpenReview = (condominium: CondominiumWithUser, action: "approve" | "reject") => {
    setSelectedCondominium(condominium);
    setReviewAction(action);
  };

  const handleCloseDialog = () => {
    setSelectedCondominium(null);
    setReviewAction(null);
  };

  const handleSubmitReview = () => {
    if (!selectedCondominium) return;

    if (reviewAction === "approve") {
      approveMutation.mutate(selectedCondominium.id);
    } else if (reviewAction === "reject") {
      rejectMutation.mutate(selectedCondominium.id);
    }
  };

  const handleCreateCondominium = () => {
    if (!newCondominiumName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del condominio es requerido",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newCondominiumName);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobado" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazado" },
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
          <div className="text-muted-foreground">Cargando condominios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="heading-condominiums">Gestión de Condominios</h1>
          <p className="text-muted-foreground">
            Administra los condominios del sistema
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-condominium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Condominio
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allCondominiums.filter(c => c.approvalStatus === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobados ({allCondominiums.filter(c => c.approvalStatus === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazados ({allCondominiums.filter(c => c.approvalStatus === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todos ({allCondominiums.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredCondominiums.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-condominiums">
                  No hay condominios {statusFilter !== "all" ? `en estado "${statusFilter}"` : ""}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCondominiums.map((condominium) => (
                <Card key={condominium.id} className="hover-elevate" data-testid={`card-condominium-${condominium.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Building2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg" data-testid={`text-condominium-name-${condominium.id}`}>
                          {condominium.name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(condominium.approvalStatus)}
                    </div>
                    <CardDescription className="space-y-1">
                      <div data-testid={`text-condominium-date-${condominium.id}`}>
                        Creado: {format(new Date(condominium.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                      {condominium.requestedBy && typeof condominium.requestedBy === 'object' && (
                        <div data-testid={`text-condominium-requester-${condominium.id}`}>
                          Solicitado por: {condominium.requestedBy.name || condominium.requestedBy.email}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {condominium.approvalStatus === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenReview(condominium, "approve")}
                          className="flex-1"
                          data-testid={`button-approve-${condominium.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenReview(condominium, "reject")}
                          className="flex-1"
                          data-testid={`button-reject-${condominium.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedCondominium && !!reviewAction} onOpenChange={handleCloseDialog}>
        <DialogContent data-testid="dialog-review-condominium">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprobar Condominio" : "Rechazar Condominio"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve" 
                ? `¿Estás seguro de que deseas aprobar el condominio "${selectedCondominium?.name}"?`
                : `¿Estás seguro de que deseas rechazar el condominio "${selectedCondominium?.name}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              variant={reviewAction === "approve" ? "default" : "destructive"}
              onClick={handleSubmitReview}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              data-testid="button-confirm-review"
            >
              {reviewAction === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-condominium">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Condominio</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo condominio. Estará pendiente de aprobación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="condominium-name">Nombre del Condominio</Label>
              <Input
                id="condominium-name"
                placeholder="Ej: Residencial Las Palmas"
                value={newCondominiumName}
                onChange={(e) => setNewCondominiumName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCondominium()}
                data-testid="input-condominium-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCondominiumName("");
              }}
              data-testid="button-cancel-create"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCondominium}
              disabled={createMutation.isPending || !newCondominiumName.trim()}
              data-testid="button-confirm-create"
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
