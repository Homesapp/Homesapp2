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
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle, Info } from "lucide-react";
import type { Property, InspectionReport } from "@shared/schema";

type InspectionStatus = "pending" | "approved" | "rejected" | "needs_changes";

interface InspectionReportWithProperty extends InspectionReport {
  property?: Property;
  inspector?: { email: string; name?: string };
}

export default function AdminInspectionReports() {
  const [selectedReport, setSelectedReport] = useState<InspectionReportWithProperty | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | "all">("pending");
  const { toast } = useToast();

  const { data: allReports = [], isLoading } = useQuery<InspectionReportWithProperty[]>({
    queryKey: ["/api/admin/inspection-reports"],
  });

  const filteredReports = statusFilter === "all" 
    ? allReports 
    : allReports.filter(report => report.status === statusFilter);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InspectionStatus }) => {
      return apiRequest("PATCH", `/api/admin/inspection-reports/${id}`, { status });
    },
    onSuccess: (_, variables) => {
      const statusMessages: Record<InspectionStatus, string> = {
        pending: "Reporte marcado como pendiente",
        approved: "Inspección aprobada - Propiedad lista para aprobación final",
        rejected: "Inspección rechazada",
        needs_changes: "Cambios requeridos en la propiedad",
      };
      
      toast({
        title: "Estado actualizado",
        description: statusMessages[variables.status],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inspection-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setViewDetailsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "default", icon: Clock, label: "Pendiente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprobada" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rechazada" },
      needs_changes: { variant: "default", icon: AlertTriangle, label: "Requiere cambios" },
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

  const handleViewDetails = (report: InspectionReportWithProperty) => {
    setSelectedReport(report);
    setViewDetailsOpen(true);
  };

  const handleUpdateStatus = (status: InspectionStatus) => {
    if (!selectedReport) return;
    updateStatusMutation.mutate({ id: selectedReport.id, status });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando reportes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-inspection-reports">Reportes de Inspección</h1>
        <p className="text-muted-foreground">
          Gestiona las inspecciones de propiedades
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendientes ({allReports.filter(r => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprobadas ({allReports.filter(r => r.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="needs_changes" data-testid="tab-needs-changes">
            Requieren cambios ({allReports.filter(r => r.status === "needs_changes").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rechazadas ({allReports.filter(r => r.status === "rejected").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Todas ({allReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay reportes en este estado
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card key={report.id} data-testid={`card-inspection-report-${report.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {report.property?.title || report.propertyId}
                        </CardTitle>
                        {getStatusBadge(report.status)}
                      </div>
                      <CardDescription>
                        Inspeccionado el {new Date(report.inspectionDate).toLocaleDateString()} por{" "}
                        {report.inspector?.email || "Inspector desconocido"}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(report)}
                      data-testid={`button-view-${report.id}`}
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Ver detalles
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Condición: </span>
                      <span className="font-medium capitalize">{report.overallCondition || "N/A"}</span>
                    </div>
                    {report.approved !== null && (
                      <div>
                        <span className="text-muted-foreground">Aprobado: </span>
                        <span className="font-medium">{report.approved ? "Sí" : "No"}</span>
                      </div>
                    )}
                  </div>

                  {report.observations && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Observaciones:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.observations}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-inspection-details">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de Inspección</DialogTitle>
                <DialogDescription>
                  {selectedReport.property?.title || selectedReport.propertyId}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estado:</span>
                  {getStatusBadge(selectedReport.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha de inspección</Label>
                    <p className="font-medium">{new Date(selectedReport.inspectionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Inspector</Label>
                    <p className="font-medium">{selectedReport.inspector?.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Condición general</Label>
                    <p className="font-medium capitalize">{selectedReport.overallCondition || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Aprobado</Label>
                    <p className="font-medium">{selectedReport.approved === null ? "N/A" : selectedReport.approved ? "Sí" : "No"}</p>
                  </div>
                </div>

                {selectedReport.observations && (
                  <div>
                    <Label>Observaciones</Label>
                    <div className="bg-muted p-3 rounded-md mt-1" data-testid="text-observations">
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.observations}</p>
                    </div>
                  </div>
                )}

                {selectedReport.approvalNotes && (
                  <div>
                    <Label>Notas de aprobación</Label>
                    <div className="bg-muted p-3 rounded-md mt-1" data-testid="text-approval-notes">
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.approvalNotes}</p>
                    </div>
                  </div>
                )}

                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <Label>Imágenes ({selectedReport.images.length})</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedReport.images.length} imagen{selectedReport.images.length > 1 ? "es" : ""} adjunta{selectedReport.images.length > 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-reject-inspection"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("needs_changes")}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-needs-changes"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Requiere cambios
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("approved")}
                      disabled={updateStatusMutation.isPending}
                      data-testid="button-approve-inspection"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                  </>
                )}
                {selectedReport.status !== "pending" && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-reopen"
                  >
                    Reabrir como pendiente
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
