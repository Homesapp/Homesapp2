import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  MapPin,
  Home,
  Eye
} from "lucide-react";
import type { Condominium } from "@shared/schema";
import { format } from "date-fns";

type CondominiumStatus = "pending" | "approved" | "rejected";

interface CondominiumWithUser extends Omit<Condominium, 'requestedBy'> {
  requestedBy?: { email: string; name?: string } | string | null;
}

interface CondominiumStats extends CondominiumWithUser {
  propertiesCount?: number;
}

export default function AdminCondominiums() {
  const [selectedCondominium, setSelectedCondominium] = useState<CondominiumStats | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [statusFilter, setStatusFilter] = useState<CondominiumStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newCondominiumName, setNewCondominiumName] = useState("");
  const [newCondominiumZone, setNewCondominiumZone] = useState("");
  const [newCondominiumAddress, setNewCondominiumAddress] = useState("");
  const [editData, setEditData] = useState({ name: "", zone: "", address: "" });
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/condominiums-stats"],
  });

  const { data: allCondominiums = [], isLoading } = useQuery<CondominiumStats[]>({
    queryKey: ["/api/condominiums"],
    select: (data) => {
      // Merge with stats if available
      if (stats?.condominiums) {
        return data.map(condo => {
          const stat = stats.condominiums.find((s: any) => s.id === condo.id);
          return { ...condo, propertiesCount: stat?.propertiesCount || 0 };
        });
      }
      return data;
    },
  });

  // Get unique zones from condominiums
  const zones = Array.from(new Set(allCondominiums.map(c => c.zone).filter(Boolean))) as string[];

  // Filter condominiums
  const filteredCondominiums = allCondominiums.filter(condo => {
    const matchesStatus = statusFilter === "all" || condo.approvalStatus === statusFilter;
    const matchesZone = zoneFilter === "all" || condo.zone === zoneFilter;
    const matchesSearch = !searchQuery || 
      condo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (condo.zone && condo.zone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (condo.address && condo.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesZone && matchesSearch;
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
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
    mutationFn: async (data: { name: string; zone?: string; address?: string }) => {
      return apiRequest("POST", "/api/condominiums", data);
    },
    onSuccess: () => {
      toast({
        title: "Condominio creado",
        description: "El condominio ha sido creado y está pendiente de aprobación",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      setShowCreateDialog(false);
      setNewCondominiumName("");
      setNewCondominiumZone("");
      setNewCondominiumAddress("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el condominio",
        variant: "destructive",
      });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Condominio actualizado",
        description: "El condominio ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
      setShowEditDialog(false);
      setSelectedCondominium(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el condominio",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiRequest("PATCH", `/api/admin/condominiums/${id}/toggle-active`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({
        title: active ? "Condominio activado" : "Condominio suspendido",
        description: `El condominio ha sido ${active ? 'activado' : 'suspendido'} exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado del condominio",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/condominiums/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Condominio eliminado",
        description: "El condominio ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/condominiums"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/condominiums-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el condominio",
        variant: "destructive",
      });
    },
  });

  const handleOpenReview = (condominium: CondominiumStats, action: "approve" | "reject") => {
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
    createMutation.mutate({
      name: newCondominiumName,
      zone: newCondominiumZone || undefined,
      address: newCondominiumAddress || undefined,
    });
  };

  const handleOpenEdit = (condominium: CondominiumStats) => {
    setSelectedCondominium(condominium);
    setEditData({
      name: condominium.name,
      zone: condominium.zone || "",
      address: condominium.address || "",
    });
    setShowEditDialog(true);
  };

  const handleSubmitEdit = () => {
    if (!selectedCondominium) return;
    if (!editData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del condominio es requerido",
        variant: "destructive",
      });
      return;
    }
    editMutation.mutate({
      id: selectedCondominium.id,
      data: {
        name: editData.name,
        zone: editData.zone || undefined,
        address: editData.address || undefined,
      },
    });
  };

  const handleToggleActive = (condominium: CondominiumStats) => {
    const newActive = !condominium.active;
    if (confirm(`¿Estás seguro de que deseas ${newActive ? 'activar' : 'suspender'} el condominio "${condominium.name}"?`)) {
      toggleActiveMutation.mutate({ id: condominium.id, active: newActive });
    }
  };

  const handleDelete = (condominium: CondominiumStats) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el condominio "${condominium.name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(condominium.id);
    }
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
            Administra los condominios del sistema ({filteredCondominiums.length} {filteredCondominiums.length === 1 ? 'condominio' : 'condominios'})
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

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, zona o dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-filter">Zona</Label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger id="zone-filter" data-testid="select-zone-filter">
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            Todos ({allCondominiums.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allCondominiums.filter(c => c.approvalStatus === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobados ({allCondominiums.filter(c => c.approvalStatus === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazados ({allCondominiums.filter(c => c.approvalStatus === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredCondominiums.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-condominiums">
                  No hay condominios {statusFilter !== "all" ? `en estado "${statusFilter}"` : ""} que coincidan con los filtros
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCondominiums.map((condominium) => (
                <Card key={condominium.id} className="hover-elevate" data-testid={`card-condominium-${condominium.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate" data-testid={`text-condominium-name-${condominium.id}`}>
                            {condominium.name}
                          </CardTitle>
                          {!condominium.active && (
                            <Badge variant="destructive" className="mt-1">Suspendido</Badge>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(condominium.approvalStatus)}
                    </div>
                    <CardDescription className="space-y-1">
                      {condominium.zone && (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          <span data-testid={`text-zone-${condominium.id}`}>{condominium.zone}</span>
                        </div>
                      )}
                      {condominium.address && (
                        <div className="text-xs truncate" data-testid={`text-address-${condominium.id}`}>
                          {condominium.address}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Home className="w-3 h-3" />
                        <span data-testid={`text-properties-count-${condominium.id}`}>
                          {condominium.propertiesCount || 0} {(condominium.propertiesCount || 0) === 1 ? 'propiedad' : 'propiedades'}
                        </span>
                      </div>
                      <div data-testid={`text-condominium-date-${condominium.id}`} className="text-xs">
                        Creado: {format(new Date(condominium.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                    <div className="flex gap-2">
                      <Link href={`/admin/condominiums/${condominium.id}`} asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          data-testid={`button-view-${condominium.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(condominium)}
                        data-testid={`button-edit-${condominium.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(condominium)}
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`button-toggle-active-${condominium.id}`}
                      >
                        {condominium.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(condominium)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${condominium.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
              Ingresa los datos del nuevo condominio. Estará pendiente de aprobación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="condominium-name">Nombre del Condominio *</Label>
              <Input
                id="condominium-name"
                placeholder="Ej: Residencial Las Palmas"
                value={newCondominiumName}
                onChange={(e) => setNewCondominiumName(e.target.value)}
                data-testid="input-condominium-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condominium-zone">Zona</Label>
              <Input
                id="condominium-zone"
                placeholder="Ej: Aldea Zamá"
                value={newCondominiumZone}
                onChange={(e) => setNewCondominiumZone(e.target.value)}
                data-testid="input-condominium-zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condominium-address">Dirección</Label>
              <Input
                id="condominium-address"
                placeholder="Ej: Av. Principal #123"
                value={newCondominiumAddress}
                onChange={(e) => setNewCondominiumAddress(e.target.value)}
                data-testid="input-condominium-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCondominiumName("");
                setNewCondominiumZone("");
                setNewCondominiumAddress("");
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="dialog-edit-condominium">
          <DialogHeader>
            <DialogTitle>Editar Condominio</DialogTitle>
            <DialogDescription>
              Modifica los datos del condominio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-condominium-name">Nombre del Condominio *</Label>
              <Input
                id="edit-condominium-name"
                placeholder="Ej: Residencial Las Palmas"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                data-testid="input-edit-condominium-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-condominium-zone">Zona</Label>
              <Input
                id="edit-condominium-zone"
                placeholder="Ej: Aldea Zamá"
                value={editData.zone}
                onChange={(e) => setEditData({ ...editData, zone: e.target.value })}
                data-testid="input-edit-condominium-zone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-condominium-address">Dirección</Label>
              <Input
                id="edit-condominium-address"
                placeholder="Ej: Av. Principal #123"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                data-testid="input-edit-condominium-address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedCondominium(null);
              }}
              data-testid="button-cancel-edit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={editMutation.isPending || !editData.name.trim()}
              data-testid="button-confirm-edit"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
